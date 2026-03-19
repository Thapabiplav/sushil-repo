"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadFileHandler = exports.uploadLoginBackgroundHandler = void 0;
exports.adminDashboardHandler = adminDashboardHandler;
exports.dashboardSummaryHandler = dashboardSummaryHandler;
exports.reportsHandler = reportsHandler;
exports.createNoticeHandler = createNoticeHandler;
exports.updateNoticeHandler = updateNoticeHandler;
exports.deleteNoticeHandler = deleteNoticeHandler;
exports.createEventHandler = createEventHandler;
exports.updateEventHandler = updateEventHandler;
exports.deleteEventHandler = deleteEventHandler;
exports.listUsersHandler = listUsersHandler;
exports.createUserHandler = createUserHandler;
exports.updateUserHandler = updateUserHandler;
exports.deleteUserHandler = deleteUserHandler;
exports.listClassesHandler = listClassesHandler;
exports.createOrUpdateClassHandler = createOrUpdateClassHandler;
exports.deleteClassHandler = deleteClassHandler;
exports.listSubjectsHandler = listSubjectsHandler;
exports.createSubjectHandler = createSubjectHandler;
exports.updateSubjectHandler = updateSubjectHandler;
exports.deleteSubjectHandler = deleteSubjectHandler;
exports.listRolesHandler = listRolesHandler;
exports.createRoleHandler = createRoleHandler;
exports.deleteRoleHandler = deleteRoleHandler;
exports.listRoleAssignmentsHandler = listRoleAssignmentsHandler;
exports.updateRoleAssignmentsHandler = updateRoleAssignmentsHandler;
exports.teacherIdAvailabilityHandler = teacherIdAvailabilityHandler;
exports.getSchoolProfileHandler = getSchoolProfileHandler;
exports.updateSchoolProfileHandler = updateSchoolProfileHandler;
exports.bulkImportStudentsHandler = bulkImportStudentsHandler;
exports.getStudentImportTemplateHandler = getStudentImportTemplateHandler;
exports.getTeacherSubjectAssignmentsHandler = getTeacherSubjectAssignmentsHandler;
exports.getTeacherClassTeacherAssignmentsHandler = getTeacherClassTeacherAssignmentsHandler;
exports.assignTeacherSubjectsHandler = assignTeacherSubjectsHandler;
exports.assignClassTeacherHandler = assignClassTeacherHandler;
exports.deleteClassTeacherAssignmentsHandler = deleteClassTeacherAssignmentsHandler;
exports.getTeacherAssignmentsSummaryHandler = getTeacherAssignmentsSummaryHandler;
const admin_service_1 = require("./admin.service");
const cloudinary_service_1 = require("../../services/cloudinary.service");
const upload_1 = require("../../utils/upload");
const zod_1 = require("zod");
const noticeSchema = zod_1.z.object({
    title: zod_1.z.string().min(1),
    content: zod_1.z.string().min(1),
    date: zod_1.z.string(),
    type: zod_1.z.string(),
});
const eventSchema = zod_1.z.object({
    title: zod_1.z.string().min(1),
    date: zod_1.z.string(),
    time: zod_1.z.string(),
    venue: zod_1.z.string(),
});
async function adminDashboardHandler(_req, res, next) {
    try {
        const data = await (0, admin_service_1.getAdminDashboardData)();
        res.json(data);
    }
    catch (error) {
        next(error);
    }
}
// Shared dashboard summary handler - returns role-based data
async function dashboardSummaryHandler(req, res, next) {
    try {
        const user = req.user;
        const role = user === null || user === void 0 ? void 0 : user.role;
        if (!role || !['admin', 'teacher', 'student'].includes(role)) {
            throw new HttpError(403, 'Unauthorized access');
        }
        const summary = await getDashboardSummary(role);
        res.json(summary);
    }
    catch (error) {
        next(error);
    }
}
async function reportsHandler(_req, res, next) {
    try {
        const data = await (0, admin_service_1.getReportsData)();
        res.json(data);
    }
    catch (error) {
        next(error);
    }
}
async function createNoticeHandler(req, res, next) {
    try {
        const body = noticeSchema.parse(req.body);
        const notice = await (0, admin_service_1.createNotice)(body);
        res.status(201).json(notice);
    }
    catch (error) {
        next(error);
    }
}
async function updateNoticeHandler(req, res, next) {
    try {
        const id = Number(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ message: 'Invalid notice ID' });
        }
        const body = noticeSchema.partial().parse(req.body);
        const notice = await (0, admin_service_1.updateNotice)(id, body);
        res.json(notice);
    }
    catch (error) {
        next(error);
    }
}
async function deleteNoticeHandler(req, res, next) {
    try {
        const id = Number(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ message: 'Invalid notice ID' });
        }
        await (0, admin_service_1.deleteNotice)(id);
        res.json({ success: true });
    }
    catch (error) {
        next(error);
    }
}
async function createEventHandler(req, res, next) {
    try {
        const body = eventSchema.parse(req.body);
        const event = await (0, admin_service_1.createEvent)(body);
        res.status(201).json(event);
    }
    catch (error) {
        next(error);
    }
}
async function updateEventHandler(req, res, next) {
    try {
        const id = Number(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ message: 'Invalid event ID' });
        }
        const body = eventSchema.partial().parse(req.body);
        const event = await (0, admin_service_1.updateEvent)(id, body);
        res.json(event);
    }
    catch (error) {
        next(error);
    }
}
async function deleteEventHandler(req, res, next) {
    try {
        const id = Number(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ message: 'Invalid event ID' });
        }
        await (0, admin_service_1.deleteEvent)(id);
        res.json({ success: true });
    }
    catch (error) {
        next(error);
    }
}
const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\da-zA-Z]).{8,}$/;
// Accepts:
// - +97798XXXXXXXX or +97797XXXXXXXX or +97796XXXXXXXX
// - 98XXXXXXXX, 97XXXXXXXX, 96XXXXXXXX (10 digits)
const nepalPhoneRegex = /^(\+977(?:98|97|96)\d{8}|(?:98|97|96)\d{8})$/;
const createUserSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    email: zod_1.z.string().email(),
    password: zod_1.z
        .string()
        .regex(strongPasswordRegex, 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character'),
    role: zod_1.z.enum(['teacher', 'student']),
    roleId: zod_1.z.number().optional(),
    phone: zod_1.z
        .string()
        .regex(nepalPhoneRegex, 'Invalid Nepal phone number')
        .optional(),
    address: zod_1.z.string().optional(),
    class: zod_1.z.string().optional(),
    section: zod_1.z.string().optional(),
    rollNumber: zod_1.z.string().optional(),
    teacherId: zod_1.z.string().optional(),
    assignedClasses: zod_1.z.array(zod_1.z.string()).optional(),
});
async function listUsersHandler(req, res, next) {
    try {
        const role = req.query.role;
        const users = await (0, admin_service_1.listUsers)(role);
        res.json(users);
    }
    catch (error) {
        next(error);
    }
}
async function createUserHandler(req, res, next) {
    try {
        const body = createUserSchema.parse(req.body);
        const user = await (0, admin_service_1.createUser)(body);
        res.status(201).json(user);
    }
    catch (error) {
        next(error);
    }
}
async function updateUserHandler(req, res, next) {
    try {
        const id = Number(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ message: 'Invalid user ID' });
        }
        const partialSchema = createUserSchema
            .partial()
            .omit({ password: true, role: true });
        const body = partialSchema.parse(req.body);
        const user = await (0, admin_service_1.updateUser)(id, body);
        res.json(user);
    }
    catch (error) {
        next(error);
    }
}
async function deleteUserHandler(req, res, next) {
    try {
        const id = Number(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ message: 'Invalid user ID' });
        }
        await (0, admin_service_1.deleteUser)(id);
        res.json({ success: true });
    }
    catch (error) {
        next(error);
    }
}
async function listClassesHandler(_req, res, next) {
    try {
        const data = await (0, admin_service_1.listClassesWithSections)();
        res.json(data);
    }
    catch (error) {
        next(error);
    }
}
async function createOrUpdateClassHandler(req, res, next) {
    try {
        const idParam = req.params.id;
        const id = idParam ? Number(idParam) : undefined;
        if (idParam && isNaN(Number(idParam))) {
            return res.status(400).json({ message: 'Invalid class ID' });
        }
        const body = zod_1.z
            .object({
            name: zod_1.z.string().min(1),
            isActive: zod_1.z.boolean().optional(),
            sections: zod_1.z.array(zod_1.z.object({ id: zod_1.z.number().optional(), name: zod_1.z.string().min(1) })).optional(),
        })
            .parse(req.body);
        const result = await (0, admin_service_1.createOrUpdateClassWithSections)(id, body);
        res.status(id ? 200 : 201).json(result);
    }
    catch (error) {
        next(error);
    }
}
async function deleteClassHandler(req, res, next) {
    try {
        const id = Number(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ message: 'Invalid class ID' });
        }
        await (0, admin_service_1.deleteClassWithSections)(id);
        res.json({ success: true });
    }
    catch (error) {
        next(error);
    }
}
async function listSubjectsHandler(req, res, next) {
    try {
        const classId = req.query.classId ? Number(req.query.classId) : undefined;
        const data = await (0, admin_service_1.listSubjects)(classId);
        res.json(data);
    }
    catch (error) {
        next(error);
    }
}
async function createSubjectHandler(req, res, next) {
    try {
        // Check if it's a bulk create request
        if (req.body.names && Array.isArray(req.body.names)) {
            const body = zod_1.z.object({
                names: zod_1.z.array(zod_1.z.string().min(1)),
                classId: zod_1.z.number().int().positive(),
            }).parse(req.body);
            const result = await (0, admin_service_1.bulkCreateSubjects)(body);
            return res.status(201).json(result);
        }
        const body = zod_1.z
            .object({
            name: zod_1.z.string().min(1),
            classId: zod_1.z.number().int().positive(),
            isActive: zod_1.z.boolean().optional(),
        })
            .parse(req.body);
        const subject = await (0, admin_service_1.createSubject)(body);
        res.status(201).json(subject);
    }
    catch (error) {
        next(error);
    }
}
async function updateSubjectHandler(req, res, next) {
    try {
        const id = Number(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ message: 'Invalid subject ID' });
        }
        const body = zod_1.z
            .object({
            name: zod_1.z.string().min(1).optional(),
            classId: zod_1.z.number().int().positive().optional(),
            isActive: zod_1.z.boolean().optional(),
        })
            .parse(req.body);
        const subject = await (0, admin_service_1.updateSubject)(id, body);
        res.json(subject);
    }
    catch (error) {
        next(error);
    }
}
async function deleteSubjectHandler(req, res, next) {
    try {
        const id = Number(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ message: 'Invalid subject ID' });
        }
        await (0, admin_service_1.deleteSubject)(id);
        res.json({ success: true });
    }
    catch (error) {
        next(error);
    }
}
async function listRolesHandler(_req, res, next) {
    try {
        const roles = await (0, admin_service_1.listRoles)();
        res.json(roles);
    }
    catch (error) {
        next(error);
    }
}
async function createRoleHandler(req, res, next) {
    try {
        const body = zod_1.z.object({ name: zod_1.z.string().min(1) }).parse(req.body);
        const role = await (0, admin_service_1.createRole)(body);
        res.status(201).json(role);
    }
    catch (error) {
        next(error);
    }
}
async function deleteRoleHandler(req, res, next) {
    try {
        const id = Number(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ message: 'Invalid role ID' });
        }
        await (0, admin_service_1.deleteRole)(id);
        res.json({ success: true });
    }
    catch (error) {
        next(error);
    }
}
async function listRoleAssignmentsHandler(_req, res, next) {
    try {
        const data = await (0, admin_service_1.listRoleAssignments)();
        res.json(data);
    }
    catch (error) {
        next(error);
    }
}
async function updateRoleAssignmentsHandler(req, res, next) {
    try {
        const body = zod_1.z
            .object({
            assignments: zod_1.z.array(zod_1.z.object({
                userId: zod_1.z.number(),
                roleIds: zod_1.z.array(zod_1.z.number()),
            })),
        })
            .parse(req.body);
        await (0, admin_service_1.updateRoleAssignments)(body.assignments);
        res.json({ success: true });
    }
    catch (error) {
        next(error);
    }
}
async function teacherIdAvailabilityHandler(req, res, next) {
    var _a;
    try {
        const teacherId = String((_a = req.query.teacherId) !== null && _a !== void 0 ? _a : '').trim();
        if (!teacherId) {
            return res.status(400).json({ message: 'teacherId is required' });
        }
        const result = await (0, admin_service_1.isTeacherIdAvailable)(teacherId);
        res.json(result);
    }
    catch (error) {
        next(error);
    }
}
async function getSchoolProfileHandler(_req, res, next) {
    try {
        const profile = await (0, admin_service_1.getSchoolProfile)();
        res.json(profile);
    }
    catch (error) {
        next(error);
    }
}
async function updateSchoolProfileHandler(req, res, next) {
    try {
        const profile = await (0, admin_service_1.updateSchoolProfile)(req.body);
        res.json(profile);
    }
    catch (error) {
        next(error);
    }
}
// Bulk import students handler
const bulkImportSchema = zod_1.z.object({
    class: zod_1.z.string().min(1, 'Class is required'),
    section: zod_1.z.string().optional().default(''),
    students: zod_1.z.array(zod_1.z.object({
        name: zod_1.z.string().min(1, 'Name is required'),
        rollNumber: zod_1.z.string().min(1, 'Roll number is required'),
        email: zod_1.z.string().optional(),
        phone: zod_1.z.string().optional(),
        address: zod_1.z.string().optional(),
        guardian: zod_1.z.string().optional(),
        password: zod_1.z.string().optional(),
    })).min(1, 'At least one student is required'),
});
async function bulkImportStudentsHandler(req, res, next) {
    try {
        const body = bulkImportSchema.parse(req.body);
        const result = await (0, admin_service_1.bulkImportStudents)(body.class, body.section, body.students);
        res.status(result.success ? 201 : 400).json(result);
    }
    catch (error) {
        next(error);
    }
}
// Get student import template handler
async function getStudentImportTemplateHandler(_req, res, next) {
    try {
        const template = (0, admin_service_1.getStudentImportTemplate)();
        res.json(template);
    }
    catch (error) {
        next(error);
    }
}
// Upload login background image handler
exports.uploadLoginBackgroundHandler = [
    upload_1.upload.single('image'),
    async (req, res, next) => {
        try {
            if (!req.file) {
                return res.status(400).json({ message: 'No image file provided' });
            }
            const result = await (0, cloudinary_service_1.uploadImageFromBuffer)(req.file.buffer, req.file.mimetype, 'sushil-school/login-background');
            res.json({
                success: true,
                url: result.secure_url,
                publicId: result.public_id,
            });
        }
        catch (error) {
            next(error);
        }
    },
];
// General file upload handler (supports images, PDFs, documents)
exports.uploadFileHandler = [
    upload_1.upload.single('file'),
    async (req, res, next) => {
        try {
            if (!req.file) {
                return res.status(400).json({ message: 'No file provided' });
            }
            const folder = req.body.folder || 'sushil-school/uploads';
            const resourceType = req.file.mimetype.startsWith('image/') ? 'image' : 'raw';
            const result = await (0, cloudinary_service_1.uploadImageFromBuffer)(req.file.buffer, req.file.mimetype, folder, resourceType);
            res.json({
                success: true,
                url: result.secure_url,
                publicId: result.public_id,
                originalName: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size,
            });
        }
        catch (error) {
            next(error);
        }
    },
];
// ==================== TEACHER ASSIGNMENT HANDLERS ====================
/**
 * Get teacher subject assignments
 */
async function getTeacherSubjectAssignmentsHandler(req, res, next) {
    try {
        const teacherId = Number(req.params.teacherId);
        if (isNaN(teacherId)) {
            return res.status(400).json({ message: 'Invalid teacher ID' });
        }
        const assignments = await (0, admin_service_1.getTeacherSubjectAssignments)(teacherId);
        res.json(assignments);
    }
    catch (error) {
        next(error);
    }
}
/**
 * Get teacher class teacher assignments
 */
async function getTeacherClassTeacherAssignmentsHandler(req, res, next) {
    try {
        const teacherId = Number(req.params.teacherId);
        if (isNaN(teacherId)) {
            return res.status(400).json({ message: 'Invalid teacher ID' });
        }
        const assignments = await (0, admin_service_1.getTeacherClassTeacherAssignments)(teacherId);
        res.json(assignments);
    }
    catch (error) {
        next(error);
    }
}
/**
 * Assign subjects to a teacher
 */
async function assignTeacherSubjectsHandler(req, res, next) {
    try {
        const teacherId = Number(req.params.teacherId);
        if (isNaN(teacherId)) {
            return res.status(400).json({ message: 'Invalid teacher ID' });
        }
        const body = zod_1.z.object({
            assignments: zod_1.z.array(zod_1.z.object({
                subjectId: zod_1.z.number().int().positive(),
                classId: zod_1.z.number().int().positive(),
                sectionId: zod_1.z.number().int().positive().nullable().optional(),
            })),
        }).parse(req.body);
        await (0, admin_service_1.assignTeacherSubjects)(teacherId, body.assignments);
        res.json({ success: true, message: 'Subjects assigned successfully' });
    }
    catch (error) {
        next(error);
    }
}
/**
 * Assign teacher as class teacher
 */
async function assignClassTeacherHandler(req, res, next) {
    try {
        const teacherId = Number(req.params.teacherId);
        if (isNaN(teacherId)) {
            return res.status(400).json({ message: 'Invalid teacher ID' });
        }
        const body = zod_1.z.object({
            assignments: zod_1.z.array(zod_1.z.object({
                classId: zod_1.z.number().int().positive(),
                sectionId: zod_1.z.number().int().positive().nullable().optional(),
                academicYear: zod_1.z.string().min(1),
            })),
        }).parse(req.body);
        await (0, admin_service_1.assignClassTeacher)(teacherId, body.assignments);
        res.json({ success: true, message: 'Class teacher assigned successfully' });
    }
    catch (error) {
        next(error);
    }
}
/**
 * Delete class teacher assignments for a teacher
 */
async function deleteClassTeacherAssignmentsHandler(req, res, next) {
    try {
        const teacherId = Number(req.params.teacherId);
        if (isNaN(teacherId)) {
            return res.status(400).json({ message: 'Invalid teacher ID' });
        }
        await (0, admin_service_1.deleteClassTeacherAssignments)(teacherId);
        res.json({ success: true, message: 'Class teacher assignments deleted successfully' });
    }
    catch (error) {
        next(error);
    }
}
/**
 * Get teacher assignments summary (for teacher profile)
 */
async function getTeacherAssignmentsSummaryHandler(req, res, next) {
    try {
        const teacherId = Number(req.params.teacherId);
        if (isNaN(teacherId)) {
            return res.status(400).json({ message: 'Invalid teacher ID' });
        }
        const summary = await (0, admin_service_1.getTeacherAssignmentsSummary)(teacherId);
        res.json(summary);
    }
    catch (error) {
        next(error);
    }
}
//# sourceMappingURL=admin.controller.js.map