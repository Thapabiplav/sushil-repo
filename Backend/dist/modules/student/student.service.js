"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStudentOverview = getStudentOverview;
exports.getStudentAttendance = getStudentAttendance;
exports.submitStudentAttendance = submitStudentAttendance;
exports.getStudentAcademics = getStudentAcademics;
exports.getStudentMaterials = getStudentMaterials;
exports.updateStudentProfileImage = updateStudentProfileImage;
const User_1 = require("../../models/User");
const Notice_1 = require("../../models/Notice");
const Event_1 = require("../../models/Event");
const RoutineSlot_1 = require("../../models/RoutineSlot");
const AttendanceRecord_1 = require("../../models/AttendanceRecord");
const Exam_1 = require("../../models/Exam");
const Material_1 = require("../../models/Material");
const errorHandler_1 = require("../../middleware/errorHandler");
const cloudinary_service_1 = require("../../services/cloudinary.service");
function ensureStudent(student) {
    if (!student || student.role !== 'student') {
        throw new errorHandler_1.HttpError(404, 'Student not found');
    }
}
async function getStudentOverview(studentId) {
    var _a, _b;
    const student = await User_1.User.findByPk(studentId);
    ensureStudent(student);
    const [notices, events, routineSlots] = await Promise.all([
        Notice_1.Notice.findAll({ order: [['date', 'DESC']], limit: 5 }),
        Event_1.Event.findAll({ order: [['date', 'ASC']], limit: 5 }),
        RoutineSlot_1.RoutineSlot.findAll({
            where: {
                className: (_a = student.class) !== null && _a !== void 0 ? _a : 'Class 10A',
            },
            order: [['day', 'ASC'], ['time', 'ASC']],
        }),
    ]);
    const routineMap = new Map();
    for (const slot of routineSlots) {
        if (!routineMap.has(slot.day)) {
            routineMap.set(slot.day, { day: slot.day, periods: [] });
        }
        (_b = routineMap.get(slot.day)) === null || _b === void 0 ? void 0 : _b.periods.push({
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
async function getStudentAttendance(studentId) {
    const student = await User_1.User.findByPk(studentId);
    ensureStudent(student);
    const records = await AttendanceRecord_1.AttendanceRecord.findAll({
        where: { studentId },
        order: [['date', 'DESC']],
    });
    const monthlySummaryMap = new Map();
    records.forEach((record) => {
        const monthKey = new Date(record.date).toLocaleString('en-US', {
            month: 'long',
            year: 'numeric',
        });
        if (!monthlySummaryMap.has(monthKey)) {
            monthlySummaryMap.set(monthKey, { month: monthKey, present: 0, absent: 0, total: 0 });
        }
        const summary = monthlySummaryMap.get(monthKey);
        summary.total += 1;
        if (record.status === 'Present') {
            summary.present += 1;
        }
        else {
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
async function submitStudentAttendance(studentId, payload) {
    const student = await User_1.User.findByPk(studentId);
    ensureStudent(student);
    let photoUrl;
    if (payload.photo) {
        const upload = await (0, cloudinary_service_1.uploadImageFromBuffer)(payload.photo.buffer, payload.photo.mimetype, 'sushil-school/attendance');
        photoUrl = upload.secure_url;
    }
    const now = new Date();
    await AttendanceRecord_1.AttendanceRecord.create({
        studentId,
        date: now,
        status: 'Present',
        time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        location: payload.location,
        photoUrl,
    });
    return { message: 'Attendance marked successfully' };
}
async function getStudentAcademics(studentId) {
    const student = await User_1.User.findByPk(studentId);
    ensureStudent(student);
    const exams = await Exam_1.Exam.findAll({
        where: { studentId },
        order: [['date', 'DESC']],
    });
    const subjectMap = new Map();
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
            if (!subjectMap.has(result.subject)) {
                subjectMap.set(result.subject, {
                    subject: result.subject,
                    total: 0,
                    count: 0,
                    exams: [],
                });
            }
            const subject = subjectMap.get(result.subject);
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
        const trend = percentageValues.length >= 2 && percentageValues[0] < percentageValues[percentageValues.length - 1]
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
function normalizeClassName(className) {
    if (!className)
        return undefined;
    const parts = className.split(' ');
    if (parts.length < 2)
        return className;
    const grade = parts[1].replace(/[A-Z]+$/, '');
    return `Class ${grade}`;
}
async function getStudentMaterials(studentId) {
    var _a;
    const student = await User_1.User.findByPk(studentId);
    ensureStudent(student);
    const targetClass = (_a = normalizeClassName(student.class)) !== null && _a !== void 0 ? _a : 'Class 10';
    // Get materials only for the student's class
    const materials = await Material_1.Material.findAll({
        where: {
            class: targetClass,
        },
        order: [['uploadedOn', 'DESC']],
    });
    // Get unique subjects from materials for the student's class
    const materialsForClass = await Material_1.Material.findAll({
        where: { class: targetClass },
        attributes: ['subject'],
    });
    const subjects = [...new Set(materialsForClass.map((m) => m.subject))];
    return {
        selectedClass: targetClass,
        materials,
        classes: [targetClass], // Only show student's class
        subjects: subjects.length > 0 ? subjects : ['All Subjects'],
    };
}
async function updateStudentProfileImage(studentId, imageUrl) {
    const student = await User_1.User.findByPk(studentId);
    ensureStudent(student);
    await student.update({ image: imageUrl });
    return student;
}
//# sourceMappingURL=student.service.js.map