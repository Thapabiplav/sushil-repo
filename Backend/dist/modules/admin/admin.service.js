"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdminDashboardData = getAdminDashboardData;
exports.getDashboardSummary = getDashboardSummary;
exports.getReportsData = getReportsData;
exports.createNotice = createNotice;
exports.updateNotice = updateNotice;
exports.deleteNotice = deleteNotice;
exports.createEvent = createEvent;
exports.updateEvent = updateEvent;
exports.deleteEvent = deleteEvent;
exports.listUsers = listUsers;
exports.createUser = createUser;
exports.updateUser = updateUser;
exports.deleteUser = deleteUser;
exports.listClassesWithSections = listClassesWithSections;
exports.createOrUpdateClassWithSections = createOrUpdateClassWithSections;
exports.deleteClassWithSections = deleteClassWithSections;
exports.listSubjects = listSubjects;
exports.createSubject = createSubject;
exports.bulkCreateSubjects = bulkCreateSubjects;
exports.updateSubject = updateSubject;
exports.deleteSubject = deleteSubject;
exports.listRoles = listRoles;
exports.createRole = createRole;
exports.deleteRole = deleteRole;
exports.listRoleAssignments = listRoleAssignments;
exports.updateRoleAssignments = updateRoleAssignments;
exports.isTeacherIdAvailable = isTeacherIdAvailable;
exports.getSchoolProfile = getSchoolProfile;
exports.updateSchoolProfile = updateSchoolProfile;
exports.bulkImportStudents = bulkImportStudents;
exports.getStudentImportTemplate = getStudentImportTemplate;
exports.getTeacherSubjectAssignments = getTeacherSubjectAssignments;
exports.getTeacherClassTeacherAssignments = getTeacherClassTeacherAssignments;
exports.assignTeacherSubjects = assignTeacherSubjects;
exports.assignClassTeacher = assignClassTeacher;
exports.getTeacherAssignmentsSummary = getTeacherAssignmentsSummary;
exports.deleteClassTeacherAssignments = deleteClassTeacherAssignments;
exports.getClassTeachers = getClassTeachers;
const User_1 = require("../../models/User");
const Notice_1 = require("../../models/Notice");
const Event_1 = require("../../models/Event");
const ClassAssignment_1 = require("../../models/ClassAssignment");
const AttendanceRecord_1 = require("../../models/AttendanceRecord");
const Exam_1 = require("../../models/Exam");
const SchoolClass_1 = require("../../models/SchoolClass");
const ClassSection_1 = require("../../models/ClassSection");
const Subject_1 = require("../../models/Subject");
const Role_1 = require("../../models/Role");
const UserRoleAssignment_1 = require("../../models/UserRoleAssignment");
const SchoolProfile_1 = require("../../models/SchoolProfile");
const TeacherSubjectAssignment_1 = require("../../models/TeacherSubjectAssignment");
const ClassTeacherAssignment_1 = require("../../models/ClassTeacherAssignment");
const sequelize_1 = require("sequelize");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
async function getAdminDashboardData() {
    const [students, teachers, notices, events, schoolClasses, attendanceRecords] = await Promise.all([
        User_1.User.findAll({ where: { role: 'student' } }),
        User_1.User.findAll({ where: { role: 'teacher' } }),
        Notice_1.Notice.findAll({ order: [['date', 'DESC']] }),
        Event_1.Event.findAll({ order: [['date', 'ASC']] }),
        SchoolClass_1.SchoolClass.findAll(),
        AttendanceRecord_1.AttendanceRecord.findAll(),
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
        var _a, _b;
        const assignedClasses = (_a = teacher.assignedClasses) !== null && _a !== void 0 ? _a : [];
        return {
            id: teacher.id,
            name: teacher.name,
            teacherId: teacher.teacherId,
            subject: (_b = assignedClasses[0]) !== null && _b !== void 0 ? _b : 'Mathematics',
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
async function getDashboardSummary(role) {
    var _a, _b, _c;
    const [students, teachers, classes, notices, subjects, schoolProfile] = await Promise.all([
        User_1.User.findAll({ where: { role: 'student' } }),
        User_1.User.findAll({ where: { role: 'teacher' } }),
        ClassAssignment_1.ClassAssignment.findAll(),
        Notice_1.Notice.findAll({ order: [['date', 'DESC']] }),
        Subject_1.Subject.findAll(),
        SchoolProfile_1.SchoolProfile.findOne({ order: [['id', 'DESC']] }),
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
            academicYear: (_a = schoolProfile === null || schoolProfile === void 0 ? void 0 : schoolProfile.academicYear) !== null && _a !== void 0 ? _a : null,
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
            academicYear: (_b = schoolProfile === null || schoolProfile === void 0 ? void 0 : schoolProfile.academicYear) !== null && _b !== void 0 ? _b : null,
            noticesCount: notices.length,
        };
    }
    // Student gets student-safe data only
    if (role === 'student') {
        return {
            totalStudents: students.length,
            totalTeachers: teachers.length,
            academicYear: (_c = schoolProfile === null || schoolProfile === void 0 ? void 0 : schoolProfile.academicYear) !== null && _c !== void 0 ? _c : null,
            noticesCount: notices.length,
        };
    }
    throw new Error('Invalid role');
}
async function getReportsData() {
    const [students, attendanceRecords, exams] = await Promise.all([
        User_1.User.findAll({ where: { role: 'student' } }),
        AttendanceRecord_1.AttendanceRecord.findAll({
            include: [{ model: User_1.User, as: 'student', attributes: ['class'] }],
        }),
        Exam_1.Exam.findAll(),
    ]);
    // Group students by class
    const studentsByClass = new Map();
    students.forEach((student) => {
        var _a;
        const className = (_a = student.class) !== null && _a !== void 0 ? _a : 'Unknown';
        if (!studentsByClass.has(className)) {
            studentsByClass.set(className, []);
        }
        studentsByClass.get(className).push(student);
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
    const performanceBySubject = new Map();
    exams.forEach((exam) => {
        // Ensure results is an array - parse if it's a string, use empty array if null/undefined
        let results = [];
        if (exam.results) {
            if (typeof exam.results === 'string') {
                try {
                    results = JSON.parse(exam.results);
                }
                catch {
                    results = [];
                }
            }
            else if (Array.isArray(exam.results)) {
                results = exam.results;
            }
        }
        results.forEach((result) => {
            if (!performanceBySubject.has(result.subject)) {
                performanceBySubject.set(result.subject, { total: 0, sum: 0, pass: 0, fail: 0 });
            }
            const stats = performanceBySubject.get(result.subject);
            stats.total += 1;
            stats.sum += result.obtained;
            if (result.obtained >= 40) {
                stats.pass += 1;
            }
            else {
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
async function createNotice(data) {
    return await Notice_1.Notice.create(data);
}
async function updateNotice(id, data) {
    const notice = await Notice_1.Notice.findByPk(id);
    if (!notice) {
        throw new Error('Notice not found');
    }
    await notice.update(data);
    return notice;
}
async function deleteNotice(id) {
    const notice = await Notice_1.Notice.findByPk(id);
    if (!notice) {
        throw new Error('Notice not found');
    }
    await notice.destroy();
    return { success: true };
}
async function createEvent(data) {
    return await Event_1.Event.create(data);
}
async function updateEvent(id, data) {
    const event = await Event_1.Event.findByPk(id);
    if (!event) {
        throw new Error('Event not found');
    }
    await event.update(data);
    return event;
}
async function deleteEvent(id) {
    const event = await Event_1.Event.findByPk(id);
    if (!event) {
        throw new Error('Event not found');
    }
    await event.destroy();
    return { success: true };
}
async function listUsers(role) {
    const where = {};
    if (role) {
        where.role = role;
    }
    const users = await User_1.User.findAll({
        where,
        include: [
            {
                model: Role_1.Role,
                as: 'roles',
                through: { attributes: [] },
            },
        ],
        order: [['name', 'ASC']],
    });
    return users.map((user) => {
        var _a, _b;
        return ({
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
            roles: (_b = (_a = user.roles) === null || _a === void 0 ? void 0 : _a.map((r) => ({
                id: r.id,
                name: r.name,
            }))) !== null && _b !== void 0 ? _b : [],
            class: user.class,
            section: user.section,
            rollNumber: user.rollNumber,
        });
    });
}
async function createUser(data) {
    var _a;
    const passwordHash = await bcryptjs_1.default.hash(data.password, 10);
    const userData = {
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
    }
    else if (data.role === 'teacher') {
        userData.teacherId = data.teacherId;
        userData.assignedClasses = (_a = data.assignedClasses) !== null && _a !== void 0 ? _a : [];
    }
    const user = await User_1.User.create(userData);
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
async function updateUser(id, data) {
    const user = await User_1.User.findByPk(id);
    if (!user) {
        throw new Error('User not found');
    }
    await user.update(data);
    return user;
}
async function deleteUser(id) {
    const user = await User_1.User.findByPk(id);
    if (!user) {
        throw new Error('User not found');
    }
    await user.destroy();
    return { success: true };
}
async function listClassesWithSections() {
    const classes = await SchoolClass_1.SchoolClass.findAll({
        include: [
            {
                model: ClassSection_1.ClassSection,
                as: 'sections',
            },
        ],
        order: [
            ['name', 'ASC'],
            [{ model: ClassSection_1.ClassSection, as: 'sections' }, 'name', 'ASC'],
        ],
    });
    return classes.map((cls) => {
        var _a, _b;
        return ({
            id: cls.id,
            name: cls.name,
            isActive: cls.isActive,
            sections: (_b = (_a = cls.sections) === null || _a === void 0 ? void 0 : _a.map((section) => ({
                id: section.id,
                name: section.name,
            }))) !== null && _b !== void 0 ? _b : [],
        });
    });
}
async function createOrUpdateClassWithSections(id, data) {
    var _a;
    let schoolClass;
    if (id) {
        schoolClass = await SchoolClass_1.SchoolClass.findByPk(id, {
            include: [{ model: ClassSection_1.ClassSection, as: 'sections' }],
        });
        if (!schoolClass) {
            throw new Error('Class not found');
        }
        await schoolClass.update({
            name: data.name,
            isActive: typeof data.isActive === 'boolean' ? data.isActive : schoolClass.isActive,
        });
    }
    else {
        schoolClass = await SchoolClass_1.SchoolClass.create({
            name: data.name,
            isActive: (_a = data.isActive) !== null && _a !== void 0 ? _a : true,
        });
    }
    if (data.sections) {
        const existingSections = await ClassSection_1.ClassSection.findAll({
            where: { classId: schoolClass.id },
        });
        const incomingById = new Map();
        const toCreate = [];
        for (const section of data.sections) {
            if (section.id) {
                incomingById.set(section.id, { name: section.name });
            }
            else {
                toCreate.push({ name: section.name });
            }
        }
        // Update or delete existing
        for (const existing of existingSections) {
            const incoming = incomingById.get(existing.id);
            if (!incoming) {
                await existing.destroy();
            }
            else if (incoming.name !== existing.name) {
                await existing.update({ name: incoming.name });
            }
        }
        // Create new
        for (const section of toCreate) {
            await ClassSection_1.ClassSection.create({
                classId: schoolClass.id,
                name: section.name,
            });
        }
    }
    return await SchoolClass_1.SchoolClass.findByPk(schoolClass.id, {
        include: [{ model: ClassSection_1.ClassSection, as: 'sections' }],
    });
}
async function deleteClassWithSections(id) {
    const schoolClass = await SchoolClass_1.SchoolClass.findByPk(id);
    if (!schoolClass) {
        throw new Error('Class not found');
    }
    await schoolClass.destroy();
    return { success: true };
}
async function listSubjects(classId) {
    const where = {};
    if (classId) {
        where.classId = classId;
    }
    const subjects = await Subject_1.Subject.findAll({
        where,
        order: [['name', 'ASC']]
    });
    return subjects;
}
async function createSubject(data) {
    // Check for duplicate in same class
    const existing = await Subject_1.Subject.findOne({
        where: {
            name: data.name,
            classId: data.classId
        }
    });
    if (existing) {
        throw new Error(`Subject '${data.name}' already exists in this class`);
    }
    const subject = await Subject_1.Subject.create({
        name: data.name,
        classId: data.classId
    });
    return subject;
}
async function bulkCreateSubjects(data) {
    const { classId, names } = data;
    // Remove duplicates from input array
    const uniqueNames = [...new Set(names.map(n => n.trim()).filter(n => n))];
    if (uniqueNames.length === 0) {
        return { created: [], errors: [] };
    }
    // Find existing subjects for this class
    const existingSubjects = await Subject_1.Subject.findAll({
        where: {
            classId,
            name: { [sequelize_1.Op.in]: uniqueNames }
        }
    });
    const existingNames = new Set(existingSubjects.map(s => s.name));
    const toCreate = uniqueNames.filter(name => !existingNames.has(name));
    const created = await Promise.all(toCreate.map(name => Subject_1.Subject.create({ name, classId })));
    const errors = uniqueNames
        .filter(name => existingNames.has(name))
        .map(name => `Subject '${name}' already exists in this class`);
    return { created, errors };
}
async function updateSubject(id, data) {
    var _a, _b;
    const subject = await Subject_1.Subject.findByPk(id);
    if (!subject) {
        throw new Error('Subject not found');
    }
    if ((data.name && data.name !== subject.name) || (data.classId && data.classId !== subject.classId)) {
        const newName = data.name || subject.name;
        const newClassId = data.classId || subject.classId;
        const existing = await Subject_1.Subject.findOne({
            where: {
                name: newName,
                classId: newClassId,
                id: { [sequelize_1.Op.ne]: id },
            },
        });
        if (existing) {
            throw new Error(`Subject '${newName}' already exists in the target class`);
        }
    }
    await subject.update({
        name: (_a = data.name) !== null && _a !== void 0 ? _a : subject.name,
        classId: (_b = data.classId) !== null && _b !== void 0 ? _b : subject.classId,
        isActive: typeof data.isActive === 'boolean' ? data.isActive : subject.isActive,
    });
    return subject;
}
async function deleteSubject(id) {
    const subject = await Subject_1.Subject.findByPk(id);
    if (!subject) {
        throw new Error('Subject not found');
    }
    await subject.destroy();
    return { success: true };
}
async function listRoles() {
    const roles = await Role_1.Role.findAll({ order: [['name', 'ASC']] });
    return roles;
}
async function createRole(data) {
    const role = await Role_1.Role.create({ name: data.name });
    return role;
}
async function deleteRole(id) {
    const role = await Role_1.Role.findByPk(id);
    if (!role) {
        throw new Error('Role not found');
    }
    await role.destroy();
    return { success: true };
}
async function listRoleAssignments() {
    const teachers = await User_1.User.findAll({
        where: { role: 'teacher' },
        include: [
            {
                model: Role_1.Role,
                as: 'roles',
                through: { attributes: [] },
            },
        ],
        order: [['name', 'ASC']],
    });
    return teachers.map((teacher) => {
        var _a, _b;
        return ({
            id: teacher.id,
            name: teacher.name,
            email: teacher.email,
            teacherId: teacher.teacherId,
            baseRole: teacher.role,
            roles: (_b = (_a = teacher.roles) === null || _a === void 0 ? void 0 : _a.map((r) => ({
                id: r.id,
                name: r.name,
            }))) !== null && _b !== void 0 ? _b : [],
        });
    });
}
async function updateRoleAssignments(assignments) {
    for (const { userId, roleIds } of assignments) {
        const user = await User_1.User.findByPk(userId);
        if (!user)
            continue;
        // Clear existing assignments
        await UserRoleAssignment_1.UserRoleAssignment.destroy({ where: { userId } });
        // Insert new assignments
        for (const roleId of roleIds) {
            await UserRoleAssignment_1.UserRoleAssignment.create({ userId, roleId });
        }
    }
}
async function isTeacherIdAvailable(teacherId) {
    const existing = await User_1.User.findOne({
        where: { teacherId },
    });
    const available = !existing;
    const suggestions = [];
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
            const exists = await User_1.User.findOne({ where: { teacherId: candidate } });
            if (!exists) {
                suggestions.push(candidate);
            }
            candidateIndex += 1;
        }
    }
    return { available, suggestions };
}
async function getSchoolProfile() {
    // Get or create the school profile (singleton pattern)
    let profile = await SchoolProfile_1.SchoolProfile.findOne();
    if (!profile) {
        // Create default profile if it doesn't exist
        profile = await SchoolProfile_1.SchoolProfile.create({
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
async function updateSchoolProfile(data) {
    let profile = await SchoolProfile_1.SchoolProfile.findOne();
    if (!profile) {
        // Create if doesn't exist
        profile = await SchoolProfile_1.SchoolProfile.create({
            name: data.name || 'School Name',
        });
    }
    // Prepare update data
    const updateData = { ...data };
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
async function bulkImportStudents(className, section, students) {
    var _a, _b, _c;
    const created = [];
    const errors = [];
    let duplicates = 0;
    // 1. Prepare data and identify potential duplicates within the input
    const validStudents = [];
    const emailsToCheck = new Set();
    const rollNumbersToCheck = new Set();
    // To avoid duplicate checks within the same batch
    const processingEmails = new Set();
    const processingRolls = new Set();
    for (let i = 0; i < students.length; i++) {
        const studentData = students[i];
        const rowNumber = i + 2; // Excel row number
        if (!((_a = studentData.name) === null || _a === void 0 ? void 0 : _a.trim())) {
            errors.push({ row: rowNumber, name: 'Unknown', error: 'Name is required' });
            continue;
        }
        if (!((_b = studentData.rollNumber) === null || _b === void 0 ? void 0 : _b.trim())) {
            errors.push({ row: rowNumber, name: studentData.name, error: 'Roll Number is required' });
            continue;
        }
        const email = ((_c = studentData.email) === null || _c === void 0 ? void 0 : _c.trim()) ||
            `${studentData.rollNumber.trim().replace(/\s+/g, '').toLowerCase()}@${className.replace(/\s+/g, '').toLowerCase()}.school.edu`;
        const rollNumber = studentData.rollNumber.trim();
        // Check internal duplicates in the batch
        if (processingEmails.has(email)) {
            duplicates++;
            errors.push({ row: rowNumber, name: studentData.name, error: `Duplicate email in file: ${email}` });
            continue;
        }
        if (processingRolls.has(rollNumber)) {
            duplicates++;
            errors.push({ row: rowNumber, name: studentData.name, error: `Duplicate roll number in file: ${rollNumber}` });
            continue;
        }
        processingEmails.add(email);
        processingRolls.add(rollNumber);
        emailsToCheck.add(email);
        rollNumbersToCheck.add(rollNumber);
        validStudents.push({ ...studentData, rowNumber, derivedEmail: email, derivedRoll: rollNumber });
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
    const existingUsers = await User_1.User.findAll({
        where: {
            [sequelize_1.Op.or]: [
                { email: { [sequelize_1.Op.in]: Array.from(emailsToCheck) } },
                {
                    role: 'student',
                    class: className,
                    section: section || null,
                    rollNumber: { [sequelize_1.Op.in]: Array.from(rollNumbersToCheck) }
                }
            ]
        }
    });
    const existingEmails = new Set(existingUsers.map(u => u.email));
    const existingRolls = new Set(existingUsers.filter(u => u.role === 'student' && u.class === className && u.section === (section || null)).map(u => u.rollNumber));
    // 3. Filter valid students for insertion
    const toInsert = [];
    // Pre-calculate hashes in parallel
    const hashPromises = validStudents.map(async (s) => {
        var _a, _b, _c, _d;
        if (existingEmails.has(s.derivedEmail)) {
            duplicates++;
            errors.push({ row: s.rowNumber, name: s.name, error: `Email already exists: ${s.derivedEmail}` });
            return null;
        }
        if (existingRolls.has(s.derivedRoll)) {
            duplicates++;
            errors.push({ row: s.rowNumber, name: s.name, error: `Roll number already exists in this class: ${s.derivedRoll}` });
            return null;
        }
        const password = ((_a = s.password) === null || _a === void 0 ? void 0 : _a.trim()) || 'Student@123';
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        return {
            name: s.name.trim(),
            email: s.derivedEmail,
            passwordHash,
            role: 'student',
            phone: ((_b = s.phone) === null || _b === void 0 ? void 0 : _b.trim()) || null,
            address: ((_c = s.address) === null || _c === void 0 ? void 0 : _c.trim()) || null,
            class: className,
            section: section || null,
            rollNumber: s.derivedRoll,
            needsPasswordChange: true,
            // Store guardian for response construction
            _guardian: (_d = s.guardian) === null || _d === void 0 ? void 0 : _d.trim()
        };
    });
    const processed = await Promise.all(hashPromises);
    for (const item of processed) {
        if (item)
            toInsert.push(item);
    }
    // 4. Bulk Create
    if (toInsert.length > 0) {
        try {
            const createdUsers = await User_1.User.bulkCreate(toInsert, { validate: true });
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
        }
        catch (err) {
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
function getStudentImportTemplate() {
    return {
        columns: [
            { key: 'name', label: 'Full Name', required: true, example: 'John Doe' },
            { key: 'rollNumber', label: 'Roll Number', required: true, example: '001' },
            { key: 'email', label: 'Email', required: false, example: 'john@example.com' },
            { key: 'phone', label: 'Phone', required: false, example: '9812345678' },
            { key: 'address', label: 'Address', required: false, example: 'Kathmandu, Nepal' },
            { key: 'guardian', label: 'Guardian Name', required: false, example: 'Jane Doe' },
            { key: 'password', label: 'Password', required: false, example: 'Student@123' },
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
async function getTeacherSubjectAssignments(teacherId) {
    const assignments = await TeacherSubjectAssignment_1.TeacherSubjectAssignment.findAll({
        where: { teacherId },
        include: [
            { model: Subject_1.Subject, as: 'subject', attributes: ['id', 'name', 'classId'] },
            { model: SchoolClass_1.SchoolClass, as: 'class', attributes: ['id', 'name'] },
            { model: ClassSection_1.ClassSection, as: 'section', attributes: ['id', 'name'] },
        ],
        order: [[{ model: SchoolClass_1.SchoolClass, as: 'class' }, 'name', 'ASC']],
    });
    return assignments.map((assignment) => {
        var _a, _b, _c;
        return ({
            id: assignment.id,
            subjectId: assignment.subjectId,
            subjectName: ((_a = assignment.subject) === null || _a === void 0 ? void 0 : _a.name) || '',
            classId: assignment.classId,
            className: ((_b = assignment.class) === null || _b === void 0 ? void 0 : _b.name) || '',
            sectionId: assignment.sectionId,
            sectionName: ((_c = assignment.section) === null || _c === void 0 ? void 0 : _c.name) || null,
        });
    });
}
/**
 * Get all class teacher assignments for a teacher
 */
async function getTeacherClassTeacherAssignments(teacherId) {
    const assignments = await ClassTeacherAssignment_1.ClassTeacherAssignment.findAll({
        where: { teacherId },
        include: [
            { model: SchoolClass_1.SchoolClass, as: 'class', attributes: ['id', 'name'] },
            { model: ClassSection_1.ClassSection, as: 'section', attributes: ['id', 'name'] },
        ],
        order: [[{ model: SchoolClass_1.SchoolClass, as: 'class' }, 'name', 'ASC']],
    });
    return assignments.map((assignment) => {
        var _a, _b;
        return ({
            id: assignment.id,
            classId: assignment.classId,
            className: ((_a = assignment.class) === null || _a === void 0 ? void 0 : _a.name) || '',
            sectionId: assignment.sectionId,
            sectionName: ((_b = assignment.section) === null || _b === void 0 ? void 0 : _b.name) || null,
            academicYear: assignment.academicYear,
        });
    });
}
/**
 * Assign subjects to a teacher
 */
async function assignTeacherSubjects(teacherId, assignments) {
    // Validate teacher exists
    const teacher = await User_1.User.findByPk(teacherId);
    if (!teacher || teacher.role !== 'teacher') {
        throw new Error('Teacher not found');
    }
    // Validate all subjects exist
    const subjectIds = assignments.map((a) => a.subjectId);
    const subjects = await Subject_1.Subject.findAll({
        where: { id: { [sequelize_1.Op.in]: subjectIds } },
    });
    if (subjects.length !== subjectIds.length) {
        throw new Error('One or more subjects not found');
    }
    // Validate all classes exist
    const classIds = [...new Set(assignments.map((a) => a.classId))];
    const classes = await SchoolClass_1.SchoolClass.findAll({
        where: { id: { [sequelize_1.Op.in]: classIds } },
    });
    if (classes.length !== classIds.length) {
        throw new Error('One or more classes not found');
    }
    // Delete existing assignments for this teacher
    await TeacherSubjectAssignment_1.TeacherSubjectAssignment.destroy({ where: { teacherId } });
    // Create new assignments
    const created = await Promise.all(assignments.map((assignment) => {
        var _a;
        return TeacherSubjectAssignment_1.TeacherSubjectAssignment.create({
            teacherId,
            subjectId: assignment.subjectId,
            classId: assignment.classId,
            sectionId: (_a = assignment.sectionId) !== null && _a !== void 0 ? _a : null,
        });
    }));
    return created;
}
/**
 * Assign teacher as class teacher for classes
 */
async function assignClassTeacher(teacherId, assignments) {
    var _a;
    // Validate teacher exists
    const teacher = await User_1.User.findByPk(teacherId);
    if (!teacher || teacher.role !== 'teacher') {
        throw new Error('Teacher not found');
    }
    // Validate all classes exist
    const classIds = [...new Set(assignments.map((a) => a.classId))];
    const classes = await SchoolClass_1.SchoolClass.findAll({
        where: { id: { [sequelize_1.Op.in]: classIds } },
    });
    if (classes.length !== classIds.length) {
        throw new Error('One or more classes not found');
    }
    // For each (class, section, year) combination, ensure only one class teacher
    for (const assignment of assignments) {
        const existing = await ClassTeacherAssignment_1.ClassTeacherAssignment.findOne({
            where: {
                classId: assignment.classId,
                sectionId: (_a = assignment.sectionId) !== null && _a !== void 0 ? _a : null,
                academicYear: assignment.academicYear,
            },
        });
        if (existing && existing.teacherId !== teacherId) {
            const cls = await SchoolClass_1.SchoolClass.findByPk(assignment.classId);
            throw new Error(`Class teacher already assigned for class ${(cls === null || cls === void 0 ? void 0 : cls.name) || assignment.classId}`);
        }
    }
    // Delete existing class teacher assignments for this teacher
    await ClassTeacherAssignment_1.ClassTeacherAssignment.destroy({ where: { teacherId } });
    // Create new assignments
    const created = await Promise.all(assignments.map((assignment) => {
        var _a;
        return ClassTeacherAssignment_1.ClassTeacherAssignment.create({
            teacherId,
            classId: assignment.classId,
            sectionId: (_a = assignment.sectionId) !== null && _a !== void 0 ? _a : null,
            academicYear: assignment.academicYear,
        });
    }));
    // Update the user's classTeacherOf field for backward compatibility
    if (assignments.length > 0) {
        const firstClass = await SchoolClass_1.SchoolClass.findByPk(assignments[0].classId);
        await teacher.update({
            classTeacherOf: (firstClass === null || firstClass === void 0 ? void 0 : firstClass.name) || null,
        });
    }
    return created;
}
/**
 * Get teacher assignments summary (for teacher profile)
 */
async function getTeacherAssignmentsSummary(teacherId) {
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
async function deleteClassTeacherAssignments(teacherId) {
    // Validate teacher exists
    const teacher = await User_1.User.findByPk(teacherId);
    if (!teacher || teacher.role !== 'teacher') {
        throw new Error('Teacher not found');
    }
    // Delete all class teacher assignments for this teacher
    await ClassTeacherAssignment_1.ClassTeacherAssignment.destroy({ where: { teacherId } });
    // Update the user's classTeacherOf field
    await teacher.update({
        classTeacherOf: null,
    });
    return { success: true };
}
/**
 * Get all class teachers for a specific class (to check conflicts)
 */
async function getClassTeachers(classId, sectionId, academicYear) {
    const where = { classId };
    if (sectionId) {
        where.sectionId = sectionId;
    }
    if (academicYear) {
        where.academicYear = academicYear;
    }
    const assignments = await ClassTeacherAssignment_1.ClassTeacherAssignment.findAll({
        where,
        include: [{ model: User_1.User, as: 'teacher', attributes: ['id', 'name', 'email'] }],
    });
    return assignments.map((a) => {
        var _a;
        return ({
            id: a.id,
            teacherId: a.teacherId,
            teacherName: ((_a = a.teacher) === null || _a === void 0 ? void 0 : _a.name) || '',
            academicYear: a.academicYear,
        });
    });
}
//# sourceMappingURL=admin.service.js.map