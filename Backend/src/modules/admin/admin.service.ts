import { User } from '../../models/User';
import { Notice } from '../../models/Notice';
import { Event } from '../../models/Event';
import { ClassAssignment } from '../../models/ClassAssignment';
import { AttendanceRecord } from '../../models/AttendanceRecord';
import { Exam } from '../../models/Exam';
import { SchoolClass } from '../../models/SchoolClass';
import { ClassSection } from '../../models/ClassSection';
import { Subject } from '../../models/Subject';
import { Role } from '../../models/Role';
import { UserRoleAssignment } from '../../models/UserRoleAssignment';
import { SchoolProfile } from '../../models/SchoolProfile';
import { TeacherSubjectAssignment } from '../../models/TeacherSubjectAssignment';
import { ClassTeacherAssignment } from '../../models/ClassTeacherAssignment';
import { Op } from 'sequelize';
import bcrypt from 'bcryptjs';

export async function getAdminDashboardData() {
  const [students, teachers, notices, events, schoolClasses, attendanceRecords] = await Promise.all([
    User.findAll({ where: { role: 'student' } }),
    User.findAll({ where: { role: 'teacher' } }),
    Notice.findAll({ order: [['date', 'DESC']] }),
    Event.findAll({ order: [['date', 'ASC']] }),
    SchoolClass.findAll(),
    AttendanceRecord.findAll(),
  ]);

  const stats = [
    { label: 'Total Students', value: students.length },
    { label: 'Total Teachers', value: teachers.length },
    { label: 'Total Classes', value: schoolClasses.length },
    { label: 'Active Notices', value: notices.length },
  ];

  // Calculate today's attendance
  const today = new Date().toISOString().split('T')[0];
  const todayAttendance = attendanceRecords.filter((ar) => ar.date === today);
  const todayPresent = todayAttendance.filter((ar) => ar.status === 'Present').length;
  const todayAbsent = todayAttendance.filter((ar) => ar.status === 'Absent').length;
  const totalToday = todayPresent + todayAbsent;
  const avgAttendanceRate = totalToday > 0 ? Math.round((todayPresent / totalToday) * 1000) / 10 : 0;

  // Overall attendance rate from all records
  const allPresent = attendanceRecords.filter((ar) => ar.status === 'Present').length;
  const allTotal = attendanceRecords.length;
  const overallAttendanceRate = allTotal > 0 ? Math.round((allPresent / allTotal) * 1000) / 10 : 0;

  const studentList = students.map((student) => ({
    id: student.id,
    name: student.name,
    class: student.class,
    section: student.section,
    rollNo: student.rollNumber,
    phone: student.phone,
    email: student.email,
    guardian: 'Parent/Guardian',
    status: 'Active',
    address: student.address,
  }));

  const teacherList = teachers.map((teacher) => {
    const assignedClasses = teacher.assignedClasses ?? [];
    return {
      id: teacher.id,
      name: teacher.name,
      teacherId: teacher.teacherId,
      subject: assignedClasses[0] ?? 'Mathematics',
      phone: teacher.phone,
      email: teacher.email,
      classes: assignedClasses,
      status: 'Active',
    };
  });

  return {
    stats,
    students: studentList,
    teachers: teacherList,
    notices,
    events,
    classes: schoolClasses,
    absentToday: todayAbsent,
    avgAttendance: avgAttendanceRate,
    overallAttendance: overallAttendanceRate,
  };
}

/**
 * Shared dashboard summary - returns aggregated counts for all roles
 * Reuses queries from getAdminDashboardData()
 */
export async function getDashboardSummary(role: string) {
  const [students, teachers, classes, notices, subjects, schoolProfile] = await Promise.all([
    User.findAll({ where: { role: 'student' } }),
    User.findAll({ where: { role: 'teacher' } }),
    ClassAssignment.findAll(),
    Notice.findAll({ order: [['date', 'DESC']] }),
    Subject.findAll(),
    SchoolProfile.findOne({ order: [['id', 'DESC']] }),
  ]);

  // Active classes = classes with assignments
  const activeClasses = classes.length;

  // Admin gets full data
  if (role === 'admin') {
    return {
      totalClasses: classes.length,
      totalStudents: students.length,
      totalTeachers: teachers.length,
      totalSubjects: subjects.length,
      activeClasses,
      academicYear: schoolProfile?.academicYear ?? null,
      noticesCount: notices.length,
    };
  }

  // Teacher gets limited data (no sensitive admin-only metrics)
  if (role === 'teacher') {
    return {
      totalClasses: classes.length,
      totalStudents: students.length,
      totalTeachers: teachers.length,
      totalSubjects: subjects.length,
      activeClasses,
      academicYear: schoolProfile?.academicYear ?? null,
      noticesCount: notices.length,
    };
  }

  // Student gets student-safe data only
  if (role === 'student') {
    return {
      totalStudents: students.length,
      totalTeachers: teachers.length,
      academicYear: schoolProfile?.academicYear ?? null,
      noticesCount: notices.length,
    };
  }

  throw new Error('Invalid role');
}

export async function getReportsData() {
  const [students, attendanceRecords, exams] = await Promise.all([
    User.findAll({ where: { role: 'student' } }),
    AttendanceRecord.findAll({
      include: [{ model: User, as: 'student', attributes: ['class'] }],
    }),
    Exam.findAll(),
  ]);

  // Group students by class
  const studentsByClass = new Map<string, User[]>();
  students.forEach((student) => {
    const className = student.class ?? 'Unknown';
    if (!studentsByClass.has(className)) {
      studentsByClass.set(className, []);
    }
    studentsByClass.get(className)!.push(student);
  });

  // Calculate attendance by class
  const attendanceData = Array.from(studentsByClass.entries()).map(([className, classStudents]) => {
    const studentIds = classStudents.map((s) => s.id);
    const classAttendance = attendanceRecords.filter((ar) => studentIds.includes(ar.studentId));
    const present = classAttendance.filter((ar) => ar.status === 'Present').length;
    const absent = classAttendance.filter((ar) => ar.status === 'Absent').length;
    const total = present + absent;
    const percentage = total > 0 ? Math.round((present / total) * 100 * 10) / 10 : 0;

    return {
      class: className,
      present,
      absent,
      percentage,
    };
  });

  // Calculate performance by subject
  const performanceBySubject = new Map<string, { total: number; sum: number; pass: number; fail: number }>();
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
      if (!performanceBySubject.has(result.subject)) {
        performanceBySubject.set(result.subject, { total: 0, sum: 0, pass: 0, fail: 0 });
      }
      const stats = performanceBySubject.get(result.subject)!;
      stats.total += 1;
      stats.sum += result.obtained;
      if (result.obtained >= 40) {
        stats.pass += 1;
      } else {
        stats.fail += 1;
      }
    });
  });

  const performanceData = Array.from(performanceBySubject.entries()).map(([subject, stats]) => ({
    subject,
    average: stats.total > 0 ? Math.round((stats.sum / stats.total) * 10) / 10 : 0,
    pass: stats.total > 0 ? Math.round((stats.pass / stats.total) * 100) : 0,
    fail: stats.total > 0 ? Math.round((stats.fail / stats.total) * 100) : 0,
  }));

  // Calculate monthly trends (last 5 months)
  const now = new Date();
  const monthlyTrends = [];
  for (let i = 4; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = monthDate.toLocaleString('en-US', { month: 'short' });
    const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

    const monthAttendance = attendanceRecords.filter((ar) => {
      const arDate = new Date(ar.date);
      return arDate >= monthStart && arDate <= monthEnd;
    });
    const monthPresent = monthAttendance.filter((ar) => ar.status === 'Present').length;
    const monthTotal = monthAttendance.length;
    const attendanceRate = monthTotal > 0 ? Math.round((monthPresent / monthTotal) * 100 * 10) / 10 : 0;

    const monthExams = exams.filter((exam) => {
      const examDate = new Date(exam.date);
      return examDate >= monthStart && examDate <= monthEnd;
    });
    const avgPerformance = monthExams.length > 0
      ? Math.round((monthExams.reduce((sum, e) => sum + (e.percentage || 0), 0) / monthExams.length) * 10) / 10
      : 0;

    monthlyTrends.push({
      month: monthKey,
      attendance: attendanceRate,
      performance: avgPerformance,
    });
  }

  // Summary stats
  const today = new Date().toISOString().split('T')[0];
  const todayAttendance = attendanceRecords.filter((ar) => ar.date === today);
  const todayPresent = todayAttendance.filter((ar) => ar.status === 'Present').length;
  const todayAbsent = todayAttendance.filter((ar) => ar.status === 'Absent').length;
  const totalToday = todayPresent + todayAbsent;
  const attendanceRate = totalToday > 0 ? Math.round((todayPresent / totalToday) * 100 * 10) / 10 : 0;

  return {
    attendance: {
      summary: {
        totalStudents: students.length,
        presentToday: todayPresent,
        absentToday: todayAbsent,
        attendanceRate: `${attendanceRate}%`,
      },
      byClass: attendanceData,
      monthlyTrend: monthlyTrends,
    },
    performance: {
      bySubject: performanceData,
      monthlyTrend: monthlyTrends,
    },
    feedback: {
      distribution: [
        { name: 'Excellent', value: 45, color: '#10b981' },
        { name: 'Good', value: 35, color: '#3b82f6' },
        { name: 'Average', value: 15, color: '#f59e0b' },
        { name: 'Poor', value: 5, color: '#ef4444' },
      ],
    },
  };
}

export async function createNotice(data: {
  title: string;
  content: string;
  date: string;
  type: string;
  imageUrl?: string | null;
}) {
  const payload: any = {
    title: data.title,
    content: data.content,
    date: data.date,
    type: data.type,
  };
  payload.imageUrl = data.imageUrl && data.imageUrl.trim() !== "" ? data.imageUrl.trim() : null;
  return await Notice.create(payload);
}

export async function updateNotice(
  id: number,
  data: Partial<{ title: string; content: string; date: string; type: string; imageUrl?: string | null }>
) {
  const notice = await Notice.findByPk(id);
  if (!notice) {
    throw new Error('Notice not found');
  }
  const updateData: any = { ...data };
  if (Object.prototype.hasOwnProperty.call(data, 'imageUrl')) {
    updateData.imageUrl =
      data.imageUrl != null && String(data.imageUrl).trim() !== "" ? String(data.imageUrl).trim() : null;
  }
  await notice.update(updateData);
  return notice;
}

export async function deleteNotice(id: number) {
  const notice = await Notice.findByPk(id);
  if (!notice) {
    throw new Error('Notice not found');
  }
  await notice.destroy();
  return { success: true };
}

export async function createEvent(data: { title: string; date: string; time: string; venue: string }) {
  return await Event.create(data);
}

export async function updateEvent(id: number, data: Partial<{ title: string; date: string; time: string; venue: string }>) {
  const event = await Event.findByPk(id);
  if (!event) {
    throw new Error('Event not found');
  }
  await event.update(data);
  return event;
}

export async function deleteEvent(id: number) {
  const event = await Event.findByPk(id);
  if (!event) {
    throw new Error('Event not found');
  }
  await event.destroy();
  return { success: true };
}

export async function listUsers(role?: string) {
  const where: any = {};
  if (role) {
    where.role = role;
  }

  const users = await User.findAll({
    where,
    include: [
      {
        model: Role,
        as: 'roles',
        through: { attributes: [] },
      },
    ],
    order: [['name', 'ASC']],
  });

  return users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    teacherId: user.teacherId,
    assignedClasses: user.assignedClasses,
    classTeacherOf: user.classTeacherOf,
    status: 'Active', // Default status as it's not in the model yet
    image: user.image,
    roles: (user as any).roles?.map((r: Role) => ({
      id: r.id,
      name: r.name,
    })) ?? [],
    class: user.class,
    section: user.section,
    rollNumber: user.rollNumber,
  }));
}

export async function createUser(data: {
  name: string;
  email: string;
  password: string;
  role: 'teacher' | 'student';
  phone?: string;
  address?: string;
  class?: string;
  section?: string;
  rollNumber?: string;
  teacherId?: string;
  assignedClasses?: string[];
}) {
  const passwordHash = await bcrypt.hash(data.password, 10);
  
  const userData: any = {
    name: data.name,
    email: data.email,
    passwordHash,
    role: data.role,
    roleId: data.roleId,
    phone: data.phone,
    address: data.address,
    needsPasswordChange: true,
  };
  
  if (data.role === 'student') {
    userData.class = data.class;
    userData.section = data.section;
    userData.rollNumber = data.rollNumber;
  } else if (data.role === 'teacher') {
    userData.teacherId = data.teacherId;
    userData.assignedClasses = data.assignedClasses ?? [];
  }
  
  const user = await User.create(userData);
  
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    address: user.address,
    class: user.class,
    section: user.section,
    rollNumber: user.rollNumber,
    teacherId: user.teacherId,
    assignedClasses: user.assignedClasses,
  };
}

export async function updateUser(id: number, data: Partial<{
  name: string;
  email: string;
  phone: string;
  address: string;
  class: string;
  section: string;
  rollNumber: string;
  teacherId: string;
  assignedClasses: string[];
  roleId: number;
}>) {
  const user = await User.findByPk(id);
  if (!user) {
    throw new Error('User not found');
  }
  await user.update(data);
  return user;
}

export async function deleteUser(id: number) {
  const user = await User.findByPk(id);
  if (!user) {
    throw new Error('User not found');
  }
  await user.destroy();
  return { success: true };
}

export async function listClassesWithSections() {
  const classes = await SchoolClass.findAll({
    include: [
      {
        model: ClassSection,
        as: 'sections',
      },
    ],
    order: [
      ['name', 'ASC'],
      [{ model: ClassSection, as: 'sections' }, 'name', 'ASC'],
    ],
  });

  return classes.map((cls) => ({
    id: cls.id,
    name: cls.name,
    isActive: cls.isActive,
    sections:
      (cls as any).sections?.map((section: ClassSection) => ({
        id: section.id,
        name: section.name,
      })) ?? [],
  }));
}

export async function createOrUpdateClassWithSections(
  id: number | undefined,
  data: {
    name: string;
    isActive?: boolean;
    sections?: { id?: number; name: string }[];
  }
) {
  let schoolClass: SchoolClass;
  if (id) {
    schoolClass = await SchoolClass.findByPk(id, {
      include: [{ model: ClassSection, as: 'sections' }],
    });
    if (!schoolClass) {
      throw new Error('Class not found');
    }
    await schoolClass.update({
      name: data.name,
      isActive:
        typeof data.isActive === 'boolean' ? data.isActive : schoolClass.isActive,
    });
  } else {
    schoolClass = await SchoolClass.create({
      name: data.name,
      isActive: data.isActive ?? true,
    });
  }

  if (data.sections) {
    const existingSections = await ClassSection.findAll({
      where: { classId: schoolClass.id },
    });
    const incomingById = new Map<number, { name: string }>();
    const toCreate: { name: string }[] = [];

    for (const section of data.sections) {
      if (section.id) {
        incomingById.set(section.id, { name: section.name });
      } else {
        toCreate.push({ name: section.name });
      }
    }

    // Update or delete existing
    for (const existing of existingSections) {
      const incoming = incomingById.get(existing.id);
      if (!incoming) {
        await existing.destroy();
      } else if (incoming.name !== existing.name) {
        await existing.update({ name: incoming.name });
      }
    }

    // Create new
    for (const section of toCreate) {
      await ClassSection.create({
        classId: schoolClass.id,
        name: section.name,
      });
    }
  }

  return await SchoolClass.findByPk(schoolClass.id, {
    include: [{ model: ClassSection, as: 'sections' }],
  });
}

export async function deleteClassWithSections(id: number) {
  const schoolClass = await SchoolClass.findByPk(id);
  if (!schoolClass) {
    throw new Error('Class not found');
  }
  await schoolClass.destroy();
  return { success: true };
}

export async function listSubjects(classId?: number) {
  const where: any = {};
  if (classId) {
    where.classId = classId;
  }
  const subjects = await Subject.findAll({ 
    where,
    order: [['name', 'ASC']] 
  });
  return subjects;
}

export async function createSubject(data: { name: string; classId: number }) {
  // Check for duplicate in same class
  const existing = await Subject.findOne({
    where: { 
      name: data.name,
      classId: data.classId 
    }
  });

  if (existing) {
    throw new Error(`Subject '${data.name}' already exists in this class`);
  }

  const subject = await Subject.create({ 
    name: data.name,
    classId: data.classId 
  });
  return subject;
}

export async function bulkCreateSubjects(data: { classId: number; names: string[] }) {
  const { classId, names } = data;
  
  // Remove duplicates from input array
  const uniqueNames = [...new Set(names.map(n => n.trim()).filter(n => n))];
  
  if (uniqueNames.length === 0) {
    return { created: [], errors: [] };
  }

  // Find existing subjects for this class
  const existingSubjects = await Subject.findAll({
    where: {
      classId,
      name: { [Op.in]: uniqueNames }
    }
  });

  const existingNames = new Set(existingSubjects.map(s => s.name));
  const toCreate = uniqueNames.filter(name => !existingNames.has(name));
  
  const created = await Promise.all(toCreate.map(name => Subject.create({ name, classId })));
  
  const errors = uniqueNames
    .filter(name => existingNames.has(name))
    .map(name => `Subject '${name}' already exists in this class`);

  return { created, errors };
}

export async function updateSubject(
  id: number,
  data: { name?: string; classId?: number; isActive?: boolean }
) {
  const subject = await Subject.findByPk(id);
  if (!subject) {
    throw new Error('Subject not found');
  }

  if ((data.name && data.name !== subject.name) || (data.classId && data.classId !== subject.classId)) {
    const newName = data.name || subject.name;
    const newClassId = data.classId || subject.classId;

    const existing = await Subject.findOne({
      where: {
        name: newName,
        classId: newClassId,
        id: { [Op.ne]: id },
      },
    });

    if (existing) {
      throw new Error(`Subject '${newName}' already exists in the target class`);
    }
  }

  await subject.update({
    name: data.name ?? subject.name,
    classId: data.classId ?? subject.classId,
    isActive: typeof data.isActive === 'boolean' ? data.isActive : subject.isActive,
  });
  return subject;
}

export async function deleteSubject(id: number) {
  const subject = await Subject.findByPk(id);
  if (!subject) {
    throw new Error('Subject not found');
  }
  await subject.destroy();
  return { success: true };
}

export async function listRoles() {
  const roles = await Role.findAll({ order: [['name', 'ASC']] });
  return roles;
}

export async function createRole(data: { name: string }) {
  const role = await Role.create({ name: data.name });
  return role;
}

export async function deleteRole(id: number) {
  const role = await Role.findByPk(id);
  if (!role) {
    throw new Error('Role not found');
  }
  await role.destroy();
  return { success: true };
}

export async function listRoleAssignments() {
  const teachers = await User.findAll({
    where: { role: 'teacher' },
    include: [
      {
        model: Role,
        as: 'roles',
        through: { attributes: [] },
      },
    ],
    order: [['name', 'ASC']],
  });

  return teachers.map((teacher) => ({
    id: teacher.id,
    name: teacher.name,
    email: teacher.email,
    teacherId: teacher.teacherId,
    baseRole: teacher.role,
    roles: (teacher as any).roles?.map((r: Role) => ({
      id: r.id,
      name: r.name,
    })) ?? [],
  }));
}

export async function updateRoleAssignments(
  assignments: { userId: number; roleIds: number[] }[]
) {
  for (const { userId, roleIds } of assignments) {
    const user = await User.findByPk(userId);
    if (!user) continue;

    // Clear existing assignments
    await UserRoleAssignment.destroy({ where: { userId } });

    // Insert new assignments
    for (const roleId of roleIds) {
      await UserRoleAssignment.create({ userId, roleId });
    }
  }
}

export async function isTeacherIdAvailable(teacherId: string) {
  const existing = await User.findOne({
    where: { teacherId },
  });

  const available = !existing;

  const suggestions: string[] = [];
  if (!available) {
    // Simple suggestion strategy
    const maxSuggestions = 3;
    let base = teacherId;
    let numMatch = teacherId.match(/(\d+)$/);
    let start = 1;
    if (numMatch) {
      base = teacherId.slice(0, -numMatch[1].length);
      start = Number(numMatch[1]) + 1;
    }
    let candidateIndex = start;
    while (suggestions.length < maxSuggestions) {
      const candidate = `${base}${candidateIndex}`;
      // eslint-disable-next-line no-await-in-loop
      const exists = await User.findOne({ where: { teacherId: candidate } });
      if (!exists) {
        suggestions.push(candidate);
      }
      candidateIndex += 1;
    }
  }

  return { available, suggestions };
}

export async function getSchoolProfile() {
  // Get or create the school profile (singleton pattern)
  let profile = await SchoolProfile.findOne();
  
  if (!profile) {
    // Create default profile if it doesn't exist
    profile = await SchoolProfile.create({
      name: 'School Name',
      motto: null,
      email: null,
      phone: null,
      telephone: null,
      website: null,
      address: null,
      established: null,
      principal: null,
      description: null,
      registrationNumber: null,
      panNumber: null,
      contactPerson: null,
      alternatePhone: null,
      fax: null,
      schoolLogo: null,
      loginBackground: null,
      profileBackground: null,
      backgroundImages: '[]',
      socialMedia: '{}',
      themeColor: '#22c55e',
    });
  }

  // Parse JSON fields
  const backgroundImages = profile.backgroundImages ? JSON.parse(profile.backgroundImages) : [];
  const socialMedia = profile.socialMedia ? JSON.parse(profile.socialMedia) : {};

  return {
    id: profile.id,
    name: profile.name,
    motto: profile.motto,
    email: profile.email,
    phone: profile.phone,
    telephone: profile.telephone,
    website: profile.website,
    address: profile.address,
    established: profile.established,
    principal: profile.principal,
    description: profile.description,
    registrationNumber: profile.registrationNumber,
    panNumber: profile.panNumber,
    contactPerson: profile.contactPerson,
    alternatePhone: profile.alternatePhone,
    fax: profile.fax,
    schoolLogo: profile.schoolLogo,
    loginBackground: profile.loginBackground,
    profileBackground: profile.profileBackground,
    backgroundImages,
    socialMedia,
    themeColor: profile.themeColor || '#22c55e',
  };
}

export async function updateSchoolProfile(data: {
  name?: string;
  motto?: string;
  email?: string;
  phone?: string;
  telephone?: string;
  website?: string;
  address?: string;
  established?: string;
  principal?: string;
  description?: string;
  registrationNumber?: string;
  panNumber?: string;
  contactPerson?: string;
  alternatePhone?: string;
  fax?: string;
  schoolLogo?: string | null;
  loginBackground?: string | null;
  profileBackground?: string | null;
  backgroundImages?: string[];
  socialMedia?: Record<string, string>;
  themeColor?: string;
}) {
  let profile = await SchoolProfile.findOne();
  
  if (!profile) {
    // Create if doesn't exist
    profile = await SchoolProfile.create({
      name: data.name || 'School Name',
    });
  }

  // Prepare update data
  const updateData: any = { ...data };
  
  // Stringify JSON fields if provided
  if (data.backgroundImages !== undefined) {
    updateData.backgroundImages = JSON.stringify(data.backgroundImages);
  }
  if (data.socialMedia !== undefined) {
    updateData.socialMedia = JSON.stringify(data.socialMedia);
  }

  await profile.update(updateData);

  // Return the updated profile
  return await getSchoolProfile();
}

// Bulk import students from Excel data
export interface BulkStudentData {
  name: string;
  email?: string;
  password?: string;
  phone?: string;
  address?: string;
  rollNumber: string;
  guardian?: string;
  // Optional per-student section (falls back to batch-level section)
  section?: string;
}

export interface BulkImportResult {
  success: boolean;
  created: {
    id: number;
    name: string;
    email: string;
    class: string;
    section: string;
    rollNo: string;
    phone: string;
    address: string;
    guardian: string;
    status: string;
  }[];
  errors: { row: number; name: string; error: string }[];
  summary: {
    total: number;
    successful: number;
    failed: number;
    duplicates: number;
  };
}

export async function bulkImportStudents(
  className: string,
  section: string,
  students: BulkStudentData[]
): Promise<BulkImportResult> {
  const created: BulkImportResult['created'] = [];
  const errors: BulkImportResult['errors'] = [];
  let duplicates = 0;

  // 1. Prepare data and identify potential duplicates within the input
  const validStudents: any[] = [];
  const emailsToCheck = new Set<string>();
  const rollNumbersToCheck = new Set<string>();
  
  // To avoid duplicate checks within the same batch
  const processingEmails = new Set<string>();
  // Track duplicates within the file per (section, rollNumber)
  const processingRolls = new Set<string>();

  for (let i = 0; i < students.length; i++) {
    const studentData = students[i];
    const rowNumber = i + 2; // Excel row number

    if (!studentData.name?.trim()) {
      errors.push({ row: rowNumber, name: 'Unknown', error: 'Name is required' });
      continue;
    }
    if (!studentData.rollNumber?.trim()) {
      errors.push({ row: rowNumber, name: studentData.name, error: 'Roll Number is required' });
      continue;
    }

    const baseRoll = studentData.rollNumber.trim();
    const rowSection = (studentData.section ?? section ?? '').trim();

    const email =
      studentData.email?.trim() ||
      `${baseRoll.replace(/\s+/g, '').toLowerCase()}${rowSection ? `-${rowSection.toLowerCase()}` : ''}@${className
        .replace(/\s+/g, '')
        .toLowerCase()}.school.edu`;
    const rollNumber = baseRoll;

    // Use composite key (section + roll) for duplicate checks inside the file
    const rollKey = `${rowSection}::${rollNumber}`;

    // Check internal duplicates in the batch
    if (processingEmails.has(email)) {
      duplicates++;
      errors.push({ row: rowNumber, name: studentData.name, error: `Duplicate email in file: ${email}` });
      continue;
    }
    if (processingRolls.has(rollKey)) {
      duplicates++;
      errors.push({
        row: rowNumber,
        name: studentData.name,
        error: `Duplicate roll number in file for this class/section: ${rollNumber} (Section ${rowSection || '-'})`,
      });
      continue;
    }

    processingEmails.add(email);
    processingRolls.add(rollKey);
    emailsToCheck.add(email);
    rollNumbersToCheck.add(rollNumber);

    validStudents.push({
      ...studentData,
      rowNumber,
      derivedEmail: email,
      derivedRoll: rollNumber,
      derivedSection: rowSection,
    });
  }

  if (validStudents.length === 0) {
    return {
      success: false,
      created: [],
      errors,
      summary: { total: students.length, successful: 0, failed: errors.length, duplicates }
    };
  }

  // 2. Batch check against database
  const existingUsers = await User.findAll({
    where: {
      [Op.or]: [
        { email: { [Op.in]: Array.from(emailsToCheck) } },
        {
          role: 'student',
          class: className,
          rollNumber: { [Op.in]: Array.from(rollNumbersToCheck) },
        },
      ],
    },
  });

  const existingEmails = new Set(existingUsers.map((u) => u.email));
  // Map of existing (section, rollNumber) for this class
  const existingRolls = new Set(
    existingUsers
      .filter((u) => u.role === 'student' && u.class === className)
      .map((u) => `${(u.section ?? '').trim()}::${(u.rollNumber ?? '').trim()}`),
  );

  // 3. Filter valid students for insertion
  const toInsert: any[] = [];
  
  // Pre-calculate hashes in parallel
  const hashPromises = validStudents.map(async (s) => {
    const rowSection = (s.derivedSection ?? section ?? '').trim();
    const rollKey = `${rowSection}::${s.derivedRoll}`;

    if (existingEmails.has(s.derivedEmail)) {
      duplicates++;
      errors.push({ row: s.rowNumber, name: s.name, error: `Email already exists: ${s.derivedEmail}` });
      return null;
    }
    if (existingRolls.has(rollKey)) {
      duplicates++;
      errors.push({
        row: s.rowNumber,
        name: s.name,
        error: `Roll number already exists in this class/section: ${s.derivedRoll} (Section ${rowSection || '-'})`,
      });
      return null;
    }

    const password = s.password?.trim() || 'Student@123';
    const passwordHash = await bcrypt.hash(password, 10);

    return {
      name: s.name.trim(),
      email: s.derivedEmail,
      passwordHash,
      role: 'student',
      phone: s.phone?.trim() || null,
      address: s.address?.trim() || null,
      class: className,
      section: rowSection || null,
      rollNumber: s.derivedRoll,
      needsPasswordChange: true,
      // Store guardian for response construction
      _guardian: s.guardian?.trim(),
    };
  });

  const processed = await Promise.all(hashPromises);
  
  for (const item of processed) {
    if (item) toInsert.push(item);
  }

  // 4. Bulk Create
  if (toInsert.length > 0) {
    try {
      const createdUsers = await User.bulkCreate(toInsert, { validate: true });
      
      createdUsers.forEach((user, index) => {
        // Map back to include guardian from input since it's not in User model directly or handled otherwise
        const originalItem = toInsert[index];
        created.push({
          id: user.id,
          name: user.name,
          email: user.email,
          class: user.class || '',
          section: user.section || '',
          rollNo: user.rollNumber || '',
          phone: user.phone || '',
          address: user.address || '',
          guardian: originalItem._guardian || 'Parent/Guardian',
          status: 'Active',
        });
      });
    } catch (err: any) {
      errors.push({ row: 0, name: 'Batch', error: `Batch insert failed: ${err.message}` });
    }
  }

  return {
    success: created.length > 0,
    created,
    errors,
    summary: {
      total: students.length,
      successful: created.length,
      failed: errors.length - duplicates, // Approximate calculation of non-duplicate errors
      duplicates,
    },
  };
}

// Get Excel template columns for student import
export function getStudentImportTemplate() {
  return {
    columns: [
      { key: 'name', label: 'Full Name', required: true, example: 'John Doe' },
      { key: 'rollNumber', label: 'Roll Number', required: true, example: '001' },
      { key: 'email', label: 'Email', required: false, example: 'john@example.com' },
      { key: 'phone', label: 'Phone', required: false, example: '9812345678' },
      { key: 'address', label: 'Address', required: false, example: 'Kathmandu, Nepal' },
      { key: 'guardian', label: 'Guardian Name', required: false, example: 'Jane Doe' },
      { key: 'password', label: 'Password', required: false, example: 'Student@123' },
      { key: 'section', label: 'Section', required: false, example: 'A' },
    ],
    notes: [
      'Full Name and Roll Number are required fields',
      'If Email is not provided, it will be auto-generated',
      'If Password is not provided, default password "Student@123" will be used',
      'Phone should be a valid Nepal phone number (98XXXXXXXX, 97XXXXXXXX, or 96XXXXXXXX)',
    ],
  };
}

// ==================== TEACHER ASSIGNMENT FUNCTIONS ====================

/**
 * Get all subject assignments for a teacher
 */
export async function getTeacherSubjectAssignments(teacherId: number) {
  const assignments = await TeacherSubjectAssignment.findAll({
    where: { teacherId },
    include: [
      { model: Subject, as: 'subject', attributes: ['id', 'name', 'classId'] },
      { model: SchoolClass, as: 'class', attributes: ['id', 'name'] },
      { model: ClassSection, as: 'section', attributes: ['id', 'name'] },
    ],
    order: [[{ model: SchoolClass, as: 'class' }, 'name', 'ASC']],
  });

  return assignments.map((assignment) => ({
    id: assignment.id,
    subjectId: assignment.subjectId,
    subjectName: (assignment as any).subject?.name || '',
    classId: assignment.classId,
    className: (assignment as any).class?.name || '',
    sectionId: assignment.sectionId,
    sectionName: (assignment as any).section?.name || null,
  }));
}

/**
 * Get all class teacher assignments for a teacher
 */
export async function getTeacherClassTeacherAssignments(teacherId: number) {
  const assignments = await ClassTeacherAssignment.findAll({
    where: { teacherId },
    include: [
      { model: SchoolClass, as: 'class', attributes: ['id', 'name'] },
      { model: ClassSection, as: 'section', attributes: ['id', 'name'] },
    ],
    order: [[{ model: SchoolClass, as: 'class' }, 'name', 'ASC']],
  });

  return assignments.map((assignment) => ({
    id: assignment.id,
    classId: assignment.classId,
    className: (assignment as any).class?.name || '',
    sectionId: assignment.sectionId,
    sectionName: (assignment as any).section?.name || null,
    academicYear: assignment.academicYear,
  }));
}

/**
 * Assign subjects to a teacher
 */
export async function assignTeacherSubjects(
  teacherId: number,
  assignments: { subjectId: number; classId: number; sectionId?: number | null }[]
) {
  // Validate teacher exists
  const teacher = await User.findByPk(teacherId);
  if (!teacher || teacher.role !== 'teacher') {
    throw new Error('Teacher not found');
  }

  // Validate all subjects exist
  const subjectIds = assignments.map((a) => a.subjectId);
  const subjects = await Subject.findAll({
    where: { id: { [Op.in]: subjectIds } },
  });
  if (subjects.length !== subjectIds.length) {
    throw new Error('One or more subjects not found');
  }

  // Validate all classes exist
  const classIds = [...new Set(assignments.map((a) => a.classId))];
  const classes = await SchoolClass.findAll({
    where: { id: { [Op.in]: classIds } },
  });
  if (classes.length !== classIds.length) {
    throw new Error('One or more classes not found');
  }

  // Delete existing assignments for this teacher
  await TeacherSubjectAssignment.destroy({ where: { teacherId } });

  // Create new assignments
  const created = await Promise.all(
    assignments.map((assignment) =>
      TeacherSubjectAssignment.create({
        teacherId,
        subjectId: assignment.subjectId,
        classId: assignment.classId,
        sectionId: assignment.sectionId ?? null,
      })
    )
  );

  return created;
}

/**
 * Assign teacher as class teacher for classes
 */
export async function assignClassTeacher(
  teacherId: number,
  assignments: { classId: number; sectionId?: number | null; academicYear: string }[]
) {
  // Validate teacher exists
  const teacher = await User.findByPk(teacherId);
  if (!teacher || teacher.role !== 'teacher') {
    throw new Error('Teacher not found');
  }

  // Validate all classes exist
  const classIds = [...new Set(assignments.map((a) => a.classId))];
  const classes = await SchoolClass.findAll({
    where: { id: { [Op.in]: classIds } },
  });
  if (classes.length !== classIds.length) {
    throw new Error('One or more classes not found');
  }

  // For each (class, section, year) combination, ensure only one class teacher
  for (const assignment of assignments) {
    const existing = await ClassTeacherAssignment.findOne({
      where: {
        classId: assignment.classId,
        sectionId: assignment.sectionId ?? null,
        academicYear: assignment.academicYear,
      },
    });

    if (existing && existing.teacherId !== teacherId) {
      const cls = await SchoolClass.findByPk(assignment.classId);
      throw new Error(`Class teacher already assigned for class ${cls?.name || assignment.classId}`);
    }
  }

  // Delete existing class teacher assignments for this teacher
  await ClassTeacherAssignment.destroy({ where: { teacherId } });

  // Create new assignments
  const created = await Promise.all(
    assignments.map((assignment) =>
      ClassTeacherAssignment.create({
        teacherId,
        classId: assignment.classId,
        sectionId: assignment.sectionId ?? null,
        academicYear: assignment.academicYear,
      })
    )
  );

  // Update the user's classTeacherOf field for backward compatibility
  if (assignments.length > 0) {
    const firstClass = await SchoolClass.findByPk(assignments[0].classId);
    await teacher.update({
      classTeacherOf: firstClass?.name || null,
    });
  }

  return created;
}

/**
 * Get teacher assignments summary (for teacher profile)
 */
export async function getTeacherAssignmentsSummary(teacherId: number) {
  const [subjectAssignments, classTeacherAssignments] = await Promise.all([
    getTeacherSubjectAssignments(teacherId),
    getTeacherClassTeacherAssignments(teacherId),
  ]);

  return {
    subjectAssignments,
    classTeacherAssignments,
  };
}

/**
 * Delete class teacher assignments for a teacher
 */
export async function deleteClassTeacherAssignments(teacherId: number) {
  // Validate teacher exists
  const teacher = await User.findByPk(teacherId);
  if (!teacher || teacher.role !== 'teacher') {
    throw new Error('Teacher not found');
  }

  // Delete all class teacher assignments for this teacher
  await ClassTeacherAssignment.destroy({ where: { teacherId } });

  // Update the user's classTeacherOf field
  await teacher.update({
    classTeacherOf: null,
  });

  return { success: true };
}

/**
 * Get all class teachers for a specific class (to check conflicts)
 */
export async function getClassTeachers(classId: number, sectionId?: number | null, academicYear?: string) {
  const where: any = { classId };
  if (sectionId) {
    where.sectionId = sectionId;
  }
  if (academicYear) {
    where.academicYear = academicYear;
  }

  const assignments = await ClassTeacherAssignment.findAll({
    where,
    include: [{ model: User, as: 'teacher', attributes: ['id', 'name', 'email'] }],
  });

  return assignments.map((a) => ({
    id: a.id,
    teacherId: a.teacherId,
    teacherName: (a as any).teacher?.name || '',
    academicYear: a.academicYear,
  }));
}

