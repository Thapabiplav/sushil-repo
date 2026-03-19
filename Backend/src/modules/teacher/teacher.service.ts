import { Op } from 'sequelize';
import { User } from '../../models/User';
import { ClassAssignment } from '../../models/ClassAssignment';
import { AttendanceRecord } from '../../models/AttendanceRecord';
import { Material } from '../../models/Material';
import { Notice } from '../../models/Notice';
import { Exam } from '../../models/Exam';
import { TeacherSubjectAssignment } from '../../models/TeacherSubjectAssignment';
import { ClassTeacherAssignment } from '../../models/ClassTeacherAssignment';
import { SchoolClass } from '../../models/SchoolClass';
import { ClassSection } from '../../models/ClassSection';
import { Subject } from '../../models/Subject';
import { HttpError } from '../../middleware/errorHandler';
import { uploadImageFromBuffer } from '../../services/cloudinary.service';

function ensureTeacher(teacher: User | null): asserts teacher is User {
  if (!teacher || teacher.role !== 'teacher') {
    throw new HttpError(404, 'Teacher not found');
  }
}

export async function getTeacherDashboard(teacherId: number) {
  const teacher = await User.findByPk(teacherId);
  ensureTeacher(teacher);

  // Fetch subject assignments from database
  const subjectAssignments = await TeacherSubjectAssignment.findAll({
    where: { teacherId },
    include: [
      { model: Subject, as: 'subject', attributes: ['id', 'name'] },
      { model: SchoolClass, as: 'class', attributes: ['id', 'name'] },
      { model: ClassSection, as: 'section', attributes: ['id', 'name'] },
    ],
    order: [[{ model: SchoolClass, as: 'class' }, 'name', 'ASC']],
  });

  // Fetch class teacher assignments from database
  const classTeacherAssignments = await ClassTeacherAssignment.findAll({
    where: { teacherId },
    include: [
      { model: SchoolClass, as: 'class', attributes: ['id', 'name'] },
      { model: ClassSection, as: 'section', attributes: ['id', 'name'] },
    ],
    order: [[{ model: SchoolClass, as: 'class' }, 'name', 'ASC']],
  });

  const materials = await Material.findAll({ 
    where: { teacherId }, 
    order: [['uploadedOn', 'DESC']] 
  });
  const notices = await Notice.findAll({ order: [['date', 'DESC']], limit: 5 });

  // Get class names from subject assignments
  const teachingClassNames: string[] = [];
  subjectAssignments.forEach((sa) => {
    const className = (sa as any).class?.name;
    if (className && !teachingClassNames.includes(className)) {
      teachingClassNames.push(className);
    }
  });
  
  // Get class names from class teacher assignments
  const classTeacherClassIds = classTeacherAssignments.map((cta) => cta.classId);
  
  // Fetch class names for class teacher assignments
  const classTeacherClassesData = await SchoolClass.findAll({
    where: { id: { [Op.in]: classTeacherClassIds.length > 0 ? classTeacherClassIds : [0] } },
    attributes: ['id', 'name'],
  });
  
  const classTeacherClassNames = classTeacherClassesData
    .map((c) => c.name)
    .filter((name): name is string => name !== undefined);

  // Build classes summary from subject assignments
  const classesSummary = subjectAssignments.map((sa) => ({
    id: sa.id,
    classId: sa.classId,
    name: (sa as any).class?.name || '',
    subject: (sa as any).subject?.name || '',
    sectionName: (sa as any).section?.name || null,
    sectionId: sa.sectionId,
  }));

  // Find students in the classes where teacher teaches
  const teachingStudents = teachingClassNames.length > 0 
    ? await User.findAll({
        where: {
          role: 'student',
          class: { [Op.in]: teachingClassNames },
        },
      })
    : [];

  // Find students in the classes where teacher is class teacher
  const classTeacherStudents = classTeacherClassNames.length > 0
    ? await User.findAll({
        where: {
          role: 'student',
          class: { [Op.in]: classTeacherClassNames },
        },
      })
    : [];

  // Combine unique students
  const allStudents = [...classTeacherStudents, ...teachingStudents];
  const uniqueStudentMap = new Map<number, User>();
  allStudents.forEach((student) => {
    if (!uniqueStudentMap.has(student.id)) {
      uniqueStudentMap.set(student.id, student);
    }
  });
  const students = Array.from(uniqueStudentMap.values());
  const studentIds = students.map((student) => student.id);

  const [attendanceRecords, exams] = await Promise.all([
    AttendanceRecord.findAll({
      where: {
        studentId: {
          [Op.in]: studentIds.length > 0 ? studentIds : [0],
        },
      },
      order: [['date', 'DESC']],
    }),
    Exam.findAll({
      where: {
        studentId: {
          [Op.in]: studentIds.length > 0 ? studentIds : [0],
        },
      },
      order: [['date', 'DESC']],
    }),
  ]);

  const studentsById = new Map(students.map((student) => [student.id, student]));

  const attendanceByStudent = new Map<number, AttendanceRecord[]>();
  attendanceRecords.forEach((record) => {
    const list = attendanceByStudent.get(record.studentId) ?? [];
    list.push(record);
    attendanceByStudent.set(record.studentId, list);
  });

  const examsByStudent = new Map<number, Exam[]>();
  exams.forEach((exam) => {
    const list = examsByStudent.get(exam.studentId) ?? [];
    list.push(exam);
    examsByStudent.set(exam.studentId, list);
  });

  const studentSummaries = students.map((student) => {
    const attendance = attendanceByStudent.get(student.id) ?? [];
    const total = attendance.length;
    const present = attendance.filter((record) => record.status === 'Present').length;
    const percentage = total ? Math.round((present / total) * 100) : 0;
    const latestExam = (examsByStudent.get(student.id) ?? [])[0];
    const latestPercentage = latestExam?.percentage ?? null;

    let status: 'Excellent' | 'Good' | 'Average' | 'Needs Attention' = 'Needs Attention';
    if (percentage >= 90) status = 'Excellent';
    else if (percentage >= 80) status = 'Good';
    else if (percentage >= 65) status = 'Average';

    return {
      id: student.id,
      name: student.name,
      rollNo: student.rollNumber,
      class: student.class,
      attendance: percentage,
      lastExam: latestPercentage,
      status,
    };
  });

  const attendanceDetails = studentSummaries.map((summary) => {
    const records = (attendanceByStudent.get(summary.id) ?? []).slice(0, 5).map((record) => ({
      date: record.date,
      status: record.status,
    }));
    const totalPresent = Math.round((summary.attendance / 100) * (records.length || 1));
    const totalAbsent = (records.length || 1) - totalPresent;
    return {
      studentName: summary.name,
      rollNo: summary.rollNo,
      class: summary.class,
      records,
      totalPresent,
      totalAbsent,
      percentage: summary.attendance,
    };
  });

  const existingMarksMap = new Map<
    string,
    {
      exam: string;
      class: string;
      subject: string;
      year: string;
      totalMarks: number;
      students: { rollNo?: string | null; name: string; marks: number }[];
    }
  >();

  exams.forEach((exam) => {
    const student = studentsById.get(exam.studentId);
    if (!student) return;
    
    // Ensure results is an array - parse if it's a string, use empty array if null/undefined
    let results: Exam['results'] = [];
    if (exam.results) {
      if (typeof exam.results === 'string') {
        try {
          results = JSON.parse(exam.results);
        } catch {
          results = [];
        }
      } else if (Array.isArray(exam.results)) {
        results = exam.results;
      }
    }
    
    results.forEach((result) => {
      const key = `${exam.exam}-${student.class}-${result.subject}`;
      if (!existingMarksMap.has(key)) {
        existingMarksMap.set(key, {
          exam: exam.exam,
          class: student.class ?? 'Class 10',
          subject: result.subject,
          year: new Date(exam.date).getFullYear().toString(),
          totalMarks: result.fullMarks,
          students: [],
        });
      }
      existingMarksMap.get(key)?.students.push({
        rollNo: student.rollNumber,
        name: student.name,
        marks: result.obtained,
      });
    });
  });

  const overviewStats = [
    { label: 'Total Classes', value: subjectAssignments.length.toString() },
    { label: 'Total Students', value: students.length.toString() },
    { label: 'Pending Attendance', value: '0' },
    { label: 'Materials Uploaded', value: materials.length.toString() },
  ];

  const upcomingClasses = classesSummary.map((cls) => ({
    class: cls.name,
    subject: cls.subject,
    room: '',
    time: '',
    days: '',
  }));

  const noticesWithPriority = notices.map((notice) => ({
    id: notice.id,
    title: notice.title,
    content: notice.content,
    date: notice.date,
    priority: notice.type === 'Event' ? 'High' : 'Medium',
  }));

  const attendanceStudents = students.map((student) => {
    const records = attendanceByStudent.get(student.id) ?? [];
    const latestStatus = records[0]?.status === 'Absent' ? 'absent' : 'present';
    return {
      id: student.id,
      name: student.name,
      rollNo: student.rollNumber,
      class: student.class,
      status: latestStatus as 'present' | 'absent',
    };
  });

  const teacherClasses = Array.from(new Set(classesSummary.map((cls) => cls.name)));
  const materialClasses = Array.from(new Set(materials.map((material) => material.class)));
  const materialSubjects = Array.from(new Set(materials.map((material) => material.subject)));

  // Get assigned classes and subjects for material upload dropdown
  const assignedClassesForUpload = Array.from(new Set(classesSummary.map((cls) => cls.name)));
  const assignedSubjectsForUpload = Array.from(new Set(classesSummary.map((cls) => cls.subject)));

  const examNames = Array.from(new Set(exams.map((exam) => exam.exam)));
  const examSubjects = new Set<string>();
  exams.forEach((exam) => {
    // Ensure results is an array - parse if it's a string, use empty array if null/undefined
    let results: Exam['results'] = [];
    if (exam.results) {
      if (typeof exam.results === 'string') {
        try {
          results = JSON.parse(exam.results);
        } catch {
          results = [];
        }
      } else if (Array.isArray(exam.results)) {
        results = exam.results;
      }
    }
    
    results.forEach((result) => examSubjects.add(result.subject));
  });

  // Build class teacher classes info
  const classTeacherClasses = classTeacherAssignments.map((cta) => ({
    id: cta.id,
    classId: cta.classId,
    className: (cta as any).class?.name || '',
    sectionId: cta.sectionId,
    sectionName: (cta as any).section?.name || null,
    academicYear: cta.academicYear,
  }));

  return {
    overview: {
      stats: overviewStats,
      schedule: upcomingClasses,
      notices: noticesWithPriority,
    },
    classes: {
      assigned: classesSummary,
      students: studentSummaries,
      classTeacherOf: classTeacherClasses,
    },
    attendance: {
      classes: teacherClasses,
      students: attendanceStudents,
      pendingRequests: [],
      details: attendanceDetails,
    },
    materials: {
      classes: materialClasses,
      subjects: materialSubjects,
      uploads: materials,
      assignedClasses: assignedClassesForUpload,
      assignedSubjects: assignedSubjectsForUpload,
    },
    exams: {
      classes: teacherClasses,
      exams: examNames,
      subjects: Array.from(examSubjects),
      students: studentSummaries.map((student) => ({
        id: student.id,
        name: student.name,
        rollNo: student.rollNo,
      })),
      existingMarks: Array.from(existingMarksMap.values()),
    },
  };
}

export async function uploadTeacherMaterial(
  teacherId: number,
  payload: {
    title: string;
    subject: string;
    className: string;
    size: string;
    file?: { buffer: Buffer; mimetype: string };
  }
) {
  const teacher = await User.findByPk(teacherId);
  ensureTeacher(teacher);

  if (!payload.file) {
    throw new HttpError(400, 'File is required');
  }

  const upload = await uploadImageFromBuffer(
    payload.file.buffer,
    payload.file.mimetype,
    'sushil-school/materials',
    'auto'
  );

  const material = await Material.create({
    title: payload.title,
    subject: payload.subject,
    class: payload.className,
    type: payload.file.mimetype,
    size: payload.size,
    uploadedByName: teacher.name,
    uploadedOn: new Date(),
    url: upload.secure_url,
    teacherId: teacher.id,
  });

  return material;
}

export async function updateTeacherProfileImage(teacherId: number, imageUrl: string) {
  const teacher = await User.findByPk(teacherId);
  ensureTeacher(teacher);

  await teacher.update({ image: imageUrl });
  return teacher;
}

export async function updateTeacherProfile(
  teacherId: number,
  data: { name?: string; phone?: string; address?: string }
) {
  const teacher = await User.findByPk(teacherId);
  ensureTeacher(teacher);

  const updates: Record<string, string | null> = {};
  if (data.name !== undefined) {
    const trimmed = data.name.trim();
    if (trimmed) updates.name = trimmed;
  }
  if (data.phone !== undefined) updates.phone = data.phone.trim() || null;
  if (data.address !== undefined) updates.address = data.address.trim() || null;
  await teacher.update(updates);
  return teacher;
}

export async function deleteTeacherMaterial(teacherId: number, materialId: number) {
  const material = await Material.findOne({
    where: { id: materialId, teacherId },
  });

  if (!material) {
    throw new HttpError(404, 'Material not found');
  }

  await material.destroy();
  return { message: 'Material deleted successfully' };
}
