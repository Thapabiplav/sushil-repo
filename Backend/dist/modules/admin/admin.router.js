"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRouter = void 0;
const express_1 = require("express");
const admin_controller_1 = require("./admin.controller");
exports.adminRouter = (0, express_1.Router)();
exports.adminRouter.get('/dashboard', admin_controller_1.adminDashboardHandler);
exports.adminRouter.get('/reports', admin_controller_1.reportsHandler);
// Notices CRUD
exports.adminRouter.post('/notices', admin_controller_1.createNoticeHandler);
exports.adminRouter.put('/notices/:id', admin_controller_1.updateNoticeHandler);
exports.adminRouter.delete('/notices/:id', admin_controller_1.deleteNoticeHandler);
// Events CRUD
exports.adminRouter.post('/events', admin_controller_1.createEventHandler);
exports.adminRouter.put('/events/:id', admin_controller_1.updateEventHandler);
exports.adminRouter.delete('/events/:id', admin_controller_1.deleteEventHandler);
// Users CRUD
exports.adminRouter.get('/users', admin_controller_1.listUsersHandler);
exports.adminRouter.post('/users', admin_controller_1.createUserHandler);
exports.adminRouter.put('/users/:id', admin_controller_1.updateUserHandler);
exports.adminRouter.delete('/users/:id', admin_controller_1.deleteUserHandler);
// Classes & sections
exports.adminRouter.get('/classes', admin_controller_1.listClassesHandler);
exports.adminRouter.post('/classes', admin_controller_1.createOrUpdateClassHandler);
exports.adminRouter.put('/classes/:id', admin_controller_1.createOrUpdateClassHandler);
exports.adminRouter.delete('/classes/:id', admin_controller_1.deleteClassHandler);
// Subjects
exports.adminRouter.get('/subjects', admin_controller_1.listSubjectsHandler);
exports.adminRouter.post('/subjects', admin_controller_1.createSubjectHandler);
exports.adminRouter.put('/subjects/:id', admin_controller_1.updateSubjectHandler);
exports.adminRouter.delete('/subjects/:id', admin_controller_1.deleteSubjectHandler);
// Roles
exports.adminRouter.get('/roles', admin_controller_1.listRolesHandler);
exports.adminRouter.post('/roles', admin_controller_1.createRoleHandler);
exports.adminRouter.delete('/roles/:id', admin_controller_1.deleteRoleHandler);
// Role assignments
exports.adminRouter.get('/role-assignments', admin_controller_1.listRoleAssignmentsHandler);
exports.adminRouter.put('/role-assignments', admin_controller_1.updateRoleAssignmentsHandler);
// Teacher ID availability
exports.adminRouter.get('/teacher-id/availability', admin_controller_1.teacherIdAvailabilityHandler);
// School Profile
exports.adminRouter.get('/school-profile', admin_controller_1.getSchoolProfileHandler);
exports.adminRouter.put('/school-profile', admin_controller_1.updateSchoolProfileHandler);
// Bulk Student Import
exports.adminRouter.get('/students/import-template', admin_controller_1.getStudentImportTemplateHandler);
exports.adminRouter.post('/students/bulk-import', admin_controller_1.bulkImportStudentsHandler);
// Upload login background image
exports.adminRouter.post('/upload-login-background', admin_controller_1.uploadLoginBackgroundHandler);
// General file upload (images, PDFs, documents)
exports.adminRouter.post('/upload-file', admin_controller_1.uploadFileHandler);
// ==================== TEACHER ASSIGNMENT ROUTES ====================
// Get teacher subject assignments
exports.adminRouter.get('/teachers/:teacherId/subject-assignments', admin_controller_1.getTeacherSubjectAssignmentsHandler);
// Get teacher class teacher assignments
exports.adminRouter.get('/teachers/:teacherId/class-teacher-assignments', admin_controller_1.getTeacherClassTeacherAssignmentsHandler);
// Assign subjects to a teacher
exports.adminRouter.post('/teachers/:teacherId/subject-assignments', admin_controller_1.assignTeacherSubjectsHandler);
// Assign teacher as class teacher
exports.adminRouter.post('/teachers/:teacherId/class-teacher-assignments', admin_controller_1.assignClassTeacherHandler);
// Delete class teacher assignments for a teacher
exports.adminRouter.delete('/teachers/:teacherId/class-teacher-assignments', admin_controller_1.deleteClassTeacherAssignmentsHandler);
// Get teacher assignments summary (for teacher profile)
exports.adminRouter.get('/teachers/:teacherId/assignments-summary', admin_controller_1.getTeacherAssignmentsSummaryHandler);
//# sourceMappingURL=admin.router.js.map