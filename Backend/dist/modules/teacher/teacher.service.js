"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTeacherDashboard = getTeacherDashboard;
exports.uploadTeacherMaterial = uploadTeacherMaterial;
exports.updateTeacherProfileImage = updateTeacherProfileImage;
exports.deleteTeacherMaterial = deleteTeacherMaterial;
const sequelize_1 = require("sequelize");
const User_1 = require("../../models/User");
const AttendanceRecord_1 = require("../../models/AttendanceRecord");
const Material_1 = require("../../models/Material");
const Notice_1 = require("../../models/Notice");
const Exam_1 = require("../../models/Exam");
const TeacherSubjectAssignment_1 = require("../../models/TeacherSubjectAssignment");
const ClassTeacherAssignment_1 = require("../../models/ClassTeacherAssignment");
const SchoolClass_1 = require("../../models/SchoolClass");
const ClassSection_1 = require("../../models/ClassSection");
const Subject_1 = require("../../models/Subject");
const errorHandler_1 = require("../../middleware/errorHandler");
const cloudinary_service_1 = require("../../services/cloudinary.service");
function ensureTeacher(teacher) {
    if (!teacher || teacher.role !== 'teacher') {
        throw new errorHandler_1.HttpError(404, 'Teacher not found');
    }
}
async function getTeacherDashboard(teacherId) {
    const teacher = await User_1.User.findByPk(teacherId);
    ensureTeacher(teacher);
    // Fetch subject assignments from database
    const subjectAssignments = await TeacherSubjectAssignment_1.TeacherSubjectAssignment.findAll({
        where: { teacherId },
        include: [
            { model: Subject_1.Subject, as: 'subject', attributes: ['id', 'name'] },
            { model: SchoolClass_1.SchoolClass, as: 'class', attributes: ['id', 'name'] },
            { model: ClassSection_1.ClassSection, as: 'section', attributes: ['id', 'name'] },
        ],
        order: [[{ model: SchoolClass_1.SchoolClass, as: 'class' }, 'name', 'ASC']],
    });
    // Fetch class teacher assignments from database
    const classTeacherAssignments = await ClassTeacherAssignment_1.ClassTeacherAssignment.findAll({
        where: { teacherId },
        include: [
            { model: SchoolClass_1.SchoolClass, as: 'class', attributes: ['id', 'name'] },
            { model: ClassSection_1.ClassSection, as: 'section', attributes: ['id', 'name'] },
        ],
        order: [[{ model: SchoolClass_1.SchoolClass, as: 'class' }, 'name', 'ASC']],
    });
    const materials = await Material_1.Material.findAll({
        where: { teacherId },
        order: [['uploadedOn', 'DESC']]
    });
    const notices = await Notice_1.Notice.findAll({ order: [['date', 'DESC']], limit: 5 });
    // Get class names from subject assignments
    const teachingClassNames = [];
    subjectAssignments.forEach((sa) => {
        var _a;
        const className = (_a = sa.class) === null || _a === void 0 ? void 0 : _a.name;
        if (className && !teachingClassNames.includes(className)) {
            teachingClassNames.push(className);
        }
    });
    // Get class names from class teacher assignments
    const classTeacherClassIds = classTeacherAssignments.map((cta) => cta.classId);
    // Fetch class names for class teacher assignments
    const classTeacherClassesData = await SchoolClass_1.SchoolClass.findAll({
        where: { id: { [sequelize_1.Op.in]: classTeacherClassIds.length > 0 ? classTeacherClassIds : [0] } },
        attributes: ['id', 'name'],
    });
    const classTeacherClassNames = classTeacherClassesData
        .map((c) => c.name)
        .filter((name) => name !== undefined);
    // Build classes summary from subject assignments
    const classesSummary = subjectAssignments.map((sa) => {
        var _a, _b, _c;
        return ({
            id: sa.id,
            classId: sa.classId,
            name: ((_a = sa.class) === null || _a === void 0 ? void 0 : _a.name) || '',
            subject: ((_b = sa.subject) === null || _b === void 0 ? void 0 : _b.name) || '',
            sectionName: ((_c = sa.section) === null || _c === void 0 ? void 0 : _c.name) || null,
            sectionId: sa.sectionId,
        });
    });
    // Find students in the classes where teacher teaches
    const teachingStudents = teachingClassNames.length > 0
        ? await User_1.User.findAll({
            where: {
                role: 'student',
                class: { [sequelize_1.Op.in]: teachingClassNames },
            },
        })
        : [];
    // Find students in the classes where teacher is class teacher
    const classTeacherStudents = classTeacherClassNames.length > 0
        ? await User_1.User.findAll({
            where: {
                role: 'student',
                class: { [sequelize_1.Op.in]: classTeacherClassNames },
            },
        })
        : [];
    // Combine unique students
    const allStudents = [...classTeacherStudents, ...teachingStudents];
    const uniqueStudentMap = new Map();
    allStudents.forEach((student) => {
        if (!uniqueStudentMap.has(student.id)) {
            uniqueStudentMap.set(student.id, student);
        }
    });
    const students = Array.from(uniqueStudentMap.values());
    const studentIds = students.map((student) => student.id);
    const [attendanceRecords, exams] = await Promise.all([
        AttendanceRecord_1.AttendanceRecord.findAll({
            where: {
                studentId: {
                    [sequelize_1.Op.in]: studentIds.length > 0 ? studentIds : [0],
                },
            },
            order: [['date', 'DESC']],
        }),
        Exam_1.Exam.findAll({
            where: {
                studentId: {
                    [sequelize_1.Op.in]: studentIds.length > 0 ? studentIds : [0],
                },
            },
            order: [['date', 'DESC']],
        }),
    ]);
    const studentsById = new Map(students.map((student) => [student.id, student]));
    const attendanceByStudent = new Map();
    attendanceRecords.forEach((record) => {
        var _a;
        const list = (_a = attendanceByStudent.get(record.studentId)) !== null && _a !== void 0 ? _a : [];
        list.push(record);
        attendanceByStudent.set(record.studentId, list);
    });
    const examsByStudent = new Map();
    exams.forEach((exam) => {
        var _a;
        const list = (_a = examsByStudent.get(exam.studentId)) !== null && _a !== void 0 ? _a : [];
        list.push(exam);
        examsByStudent.set(exam.studentId, list);
    });
    const studentSummaries = students.map((student) => {
        var _a, _b, _c;
        const attendance = (_a = attendanceByStudent.get(student.id)) !== null && _a !== void 0 ? _a : [];
        const total = attendance.length;
        const present = attendance.filter((record) => record.status === 'Present').length;
        const percentage = total ? Math.round((present / total) * 100) : 0;
        const latestExam = ((_b = examsByStudent.get(student.id)) !== null && _b !== void 0 ? _b : [])[0];
        const latestPercentage = (_c = latestExam === null || latestExam === void 0 ? void 0 : latestExam.percentage) !== null && _c !== void 0 ? _c : null;
        let status = 'Needs Attention';
        if (percentage >= 90)
            status = 'Excellent';
        else if (percentage >= 80)
            status = 'Good';
        else if (percentage >= 65)
            status = 'Average';
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
        var _a;
        const records = ((_a = attendanceByStudent.get(summary.id)) !== null && _a !== void 0 ? _a : []).slice(0, 5).map((record) => ({
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
    const existingMarksMap = new Map();
    exams.forEach((exam) => {
        const student = studentsById.get(exam.studentId);
        if (!student)
            return;
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
            var _a, _b;
            const key = `${exam.exam}-${student.class}-${result.subject}`;
            if (!existingMarksMap.has(key)) {
                existingMarksMap.set(key, {
                    exam: exam.exam,
                    class: (_a = student.class) !== null && _a !== void 0 ? _a : 'Class 10',
                    subject: result.subject,
                    year: new Date(exam.date).getFullYear().toString(),
                    totalMarks: result.fullMarks,
                    students: [],
                });
            }
            (_b = existingMarksMap.get(key)) === null || _b === void 0 ? void 0 : _b.students.push({
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
        var _a, _b;
        const records = (_a = attendanceByStudent.get(student.id)) !== null && _a !== void 0 ? _a : [];
        const latestStatus = ((_b = records[0]) === null || _b === void 0 ? void 0 : _b.status) === 'Absent' ? 'absent' : 'present';
        return {
            id: student.id,
            name: student.name,
            rollNo: student.rollNumber,
            class: student.class,
            status: latestStatus,
        };
    });
    const teacherClasses = Array.from(new Set(classesSummary.map((cls) => cls.name)));
    const materialClasses = Array.from(new Set(materials.map((material) => material.class)));
    const materialSubjects = Array.from(new Set(materials.map((material) => material.subject)));
    // Get assigned classes and subjects for material upload dropdown
    const assignedClassesForUpload = Array.from(new Set(classesSummary.map((cls) => cls.name)));
    const assignedSubjectsForUpload = Array.from(new Set(classesSummary.map((cls) => cls.subject)));
    const examNames = Array.from(new Set(exams.map((exam) => exam.exam)));
    const examSubjects = new Set();
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
        results.forEach((result) => examSubjects.add(result.subject));
    });
    // Build class teacher classes info
    const classTeacherClasses = classTeacherAssignments.map((cta) => {
        var _a, _b;
        return ({
            id: cta.id,
            classId: cta.classId,
            className: ((_a = cta.class) === null || _a === void 0 ? void 0 : _a.name) || '',
            sectionId: cta.sectionId,
            sectionName: ((_b = cta.section) === null || _b === void 0 ? void 0 : _b.name) || null,
            academicYear: cta.academicYear,
        });
    });
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
async function uploadTeacherMaterial(teacherId, payload) {
    const teacher = await User_1.User.findByPk(teacherId);
    ensureTeacher(teacher);
    if (!payload.file) {
        throw new errorHandler_1.HttpError(400, 'File is required');
    }
    const upload = await (0, cloudinary_service_1.uploadImageFromBuffer)(payload.file.buffer, payload.file.mimetype, 'sushil-school/materials', 'auto');
    const material = await Material_1.Material.create({
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
async function updateTeacherProfileImage(teacherId, imageUrl) {
    const teacher = await User_1.User.findByPk(teacherId);
    ensureTeacher(teacher);
    await teacher.update({ image: imageUrl });
    return teacher;
}
async function deleteTeacherMaterial(teacherId, materialId) {
    const material = await Material_1.Material.findOne({
        where: { id: materialId, teacherId },
    });
    if (!material) {
        throw new errorHandler_1.HttpError(404, 'Material not found');
    }
    await material.destroy();
    return { message: 'Material deleted successfully' };
}
//# sourceMappingURL=teacher.service.js.map