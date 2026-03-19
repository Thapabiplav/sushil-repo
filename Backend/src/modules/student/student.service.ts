import { Op } from 'sequelize';
import { User } from '../../models/User';
import { Notice } from '../../models/Notice';
import { Event } from '../../models/Event';
import { RoutineSlot } from '../../models/RoutineSlot';
import { AttendanceRecord } from '../../models/AttendanceRecord';
import { Exam } from '../../models/Exam';
import { Material } from '../../models/Material';
import { Subject } from '../../models/Subject';
import { SchoolClass } from '../../models/SchoolClass';
import { HttpError } from '../../middleware/errorHandler';
import { uploadImageFromBuffer } from '../../services/cloudinary.service';

function ensureStudent(student: User | null): asserts student is User {
  if (!student || student.role !== 'student') {
    throw new HttpError(404, 'Student not found');
  }
}

export async function getStudentOverview(studentId: number) {
  const student = await User.findByPk(studentId);
  ensureStudent(student);

  const [notices, events, routineSlots] = await Promise.all([
    Notice.findAll({ order: [['date', 'DESC']], limit: 5 }),
    Event.findAll({ order: [['date', 'ASC']], limit: 5 }),
    RoutineSlot.findAll({
      where: {
        className: student.class ?? 'Class 10A',
      },
      order: [['day', 'ASC'], ['time', 'ASC']],
    }),
  ]);

  const routineMap = new Map<
    string,
    { day: string; periods: { time: string; subject: string; teacher: string }[] }
  >();

  for (const slot of routineSlots) {
    if (!routineMap.has(slot.day)) {
      routineMap.set(slot.day, { day: slot.day, periods: [] });
    }
    routineMap.get(slot.day)?.periods.push({
      time: slot.time,
      subject: slot.subject,
      teacher: slot.teacher,
    });
  }

  return {
    student: {
      id: student.id,
      name: student.name,
      class: student.class,
      rollNumber: student.rollNumber,
    },
    notices,
    events,
    routine: Array.from(routineMap.values()),
  };
}

export async function getStudentAttendance(studentId: number) {
  const student = await User.findByPk(studentId);
  ensureStudent(student);

  const records = await AttendanceRecord.findAll({
    where: { studentId },
    order: [['date', 'DESC']],
  });

  const monthlySummaryMap = new Map<
    string,
    { month: string; present: number; absent: number; total: number }
  >();

  records.forEach((record) => {
    const monthKey = new Date(record.date).toLocaleString('en-US', {
      month: 'long',
      year: 'numeric',
    });
    if (!monthlySummaryMap.has(monthKey)) {
      monthlySummaryMap.set(monthKey, { month: monthKey, present: 0, absent: 0, total: 0 });
    }
    const summary = monthlySummaryMap.get(monthKey)!;
    summary.total += 1;
    if (record.status === 'Present') {
      summary.present += 1;
    } else {
      summary.absent += 1;
    }
  });

  const monthlySummary = Array.from(monthlySummaryMap.values()).map((summary) => ({
    ...summary,
    percentage: summary.total ? Math.round((summary.present / summary.total) * 100) : 0,
  }));

  return {
    summary: monthlySummary,
    records: records.map((record) => ({
      date: record.date,
      status: record.status,
      time: record.time,
      location: record.location,
    })),
  };
}

export async function submitStudentAttendance(
  studentId: number,
  payload: { location: string; photo?: { buffer: Buffer; mimetype: string } }
) {
  const student = await User.findByPk(studentId);
  ensureStudent(student);

  let photoUrl: string | undefined;
  if (payload.photo) {
    const upload = await uploadImageFromBuffer(
      payload.photo.buffer,
      payload.photo.mimetype,
      'sushil-school/attendance'
    );
    photoUrl = upload.secure_url;
  }

  const now = new Date();

  await AttendanceRecord.create({
    studentId,
    date: now,
    status: 'Present',
    time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    location: payload.location,
    photoUrl,
  });

  return { message: 'Attendance marked successfully' };
}

export async function getStudentAcademics(studentId: number) {
  const student = await User.findByPk(studentId);
  ensureStudent(student);

  const exams = await Exam.findAll({
    where: { studentId },
    order: [['date', 'DESC']],
  });

  const subjectMap = new Map<
    string,
    { subject: string; total: number; count: number; exams: { name: string; marks: number; outOf: number }[] }
  >();

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
    
    results.forEach((result) => {
      if (!subjectMap.has(result.subject)) {
        subjectMap.set(result.subject, {
          subject: result.subject,
          total: 0,
          count: 0,
          exams: [],
        });
      }
      const subject = subjectMap.get(result.subject)!;
      subject.total += (result.obtained / result.fullMarks) * 100;
      subject.count += 1;
      subject.exams.push({
        name: exam.exam,
        marks: result.obtained,
        outOf: result.fullMarks,
      });
    });
  });

  const subjectPerformance = Array.from(subjectMap.values()).map((subject) => {
    const percentageValues = subject.exams.map((exam) => (exam.marks / exam.outOf) * 100);
    const trend =
      percentageValues.length >= 2 && percentageValues[0] < percentageValues[percentageValues.length - 1]
        ? 'up'
        : 'down';
    return {
      subject: subject.subject,
      average: Number((subject.total / subject.count).toFixed(1)),
      trend,
      exams: subject.exams,
    };
  });

  return {
    exams: exams.map((exam) => {
      // Ensure results is an array before returning
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
      
      return {
        exam: exam.exam,
        date: exam.date,
        results,
        totalObtained: exam.totalObtained,
        totalMarks: exam.totalMarks,
        percentage: exam.percentage,
        rank: exam.rank,
      };
    }),
    subjectPerformance,
  };
}

function normalizeClassName(className?: string | null) {
  if (!className) return undefined;
  const parts = className.split(' ');
  if (parts.length < 2) return className;
  const grade = parts[1].replace(/[A-Z]+$/, '');
  return `Class ${grade}`;
}

export async function getStudentMaterials(studentId: number) {
  const student = await User.findByPk(studentId);
  ensureStudent(student);

  const targetClass = normalizeClassName(student.class) ?? 'Class 10';

  // Get materials only for the student's class
  const materials = await Material.findAll({
    where: {
      class: targetClass,
    },
    order: [['uploadedOn', 'DESC']],
  });

  // Get assigned subjects for this class from Subject table (e.g. Math, Science)
  const schoolClass = await SchoolClass.findOne({
    where: { name: targetClass },
    attributes: ['id'],
  });
  const assignedSubjectNames = schoolClass
    ? (await Subject.findAll({
        where: { classId: schoolClass.id, isActive: true },
        attributes: ['name'],
        order: [['name', 'ASC']],
      })).map((s) => s.name)
    : [];

  // Include any subject that appears in materials but not in assigned list (e.g. legacy uploads)
  const materialSubjects = [...new Set(materials.map((m) => m.subject).filter(Boolean))];
  const subjectSet = new Set([...assignedSubjectNames, ...materialSubjects]);
  const subjects = Array.from(subjectSet).sort();

  return {
    selectedClass: targetClass,
    materials,
    classes: [targetClass], // Only show student's class
    subjects, // Specific subjects (Math, etc.) — frontend keeps "All Subjects" as filter option
  };
}

export async function updateStudentProfileImage(studentId: number, imageUrl: string) {
  const student = await User.findByPk(studentId);
  ensureStudent(student);

  await student.update({ image: imageUrl });
  return student;
}

export async function updateStudentProfile(
  studentId: number,
  data: { name?: string; phone?: string; address?: string }
) {
  const student = await User.findByPk(studentId);
  ensureStudent(student);

  const updates: Record<string, string | null> = {};
  if (data.name !== undefined) {
    const trimmed = data.name.trim();
    if (trimmed) updates.name = trimmed;
  }
  if (data.phone !== undefined) updates.phone = data.phone.trim() || null;
  if (data.address !== undefined) updates.address = data.address.trim() || null;
  await student.update(updates);
  return student;
}

