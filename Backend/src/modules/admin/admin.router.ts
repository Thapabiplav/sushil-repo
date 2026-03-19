import { Router } from 'express';
import {
  adminDashboardHandler,
  reportsHandler,
  createNoticeHandler,
  updateNoticeHandler,
  deleteNoticeHandler,
  createEventHandler,
  updateEventHandler,
  deleteEventHandler,
  listUsersHandler,
  createUserHandler,
  updateUserHandler,
  deleteUserHandler,
  listClassesHandler,
  createOrUpdateClassHandler,
  deleteClassHandler,
  listSubjectsHandler,
  createSubjectHandler,
  updateSubjectHandler,
  deleteSubjectHandler,
  listRolesHandler,
  createRoleHandler,
  deleteRoleHandler,
  listRoleAssignmentsHandler,
  updateRoleAssignmentsHandler,
  teacherIdAvailabilityHandler,
  getSchoolProfileHandler,
  updateSchoolProfileHandler,
  bulkImportStudentsHandler,
  getStudentImportTemplateHandler,
  uploadLoginBackgroundHandler,
  uploadFileHandler,
  // Teacher assignment handlers
  getTeacherSubjectAssignmentsHandler,
  getTeacherClassTeacherAssignmentsHandler,
  assignTeacherSubjectsHandler,
  assignClassTeacherHandler,
  deleteClassTeacherAssignmentsHandler,
  getTeacherAssignmentsSummaryHandler,
} from './admin.controller';

export const adminRouter = Router();

adminRouter.get('/dashboard', adminDashboardHandler);
adminRouter.get('/reports', reportsHandler);

// Notices CRUD
adminRouter.post('/notices', createNoticeHandler);
adminRouter.put('/notices/:id', updateNoticeHandler);
adminRouter.delete('/notices/:id', deleteNoticeHandler);

// Events CRUD
adminRouter.post('/events', createEventHandler);
adminRouter.put('/events/:id', updateEventHandler);
adminRouter.delete('/events/:id', deleteEventHandler);

// Users CRUD
adminRouter.get('/users', listUsersHandler);
adminRouter.post('/users', createUserHandler);
adminRouter.put('/users/:id', updateUserHandler);
adminRouter.delete('/users/:id', deleteUserHandler);

// Classes & sections
adminRouter.get('/classes', listClassesHandler);
adminRouter.post('/classes', createOrUpdateClassHandler);
adminRouter.put('/classes/:id', createOrUpdateClassHandler);
adminRouter.delete('/classes/:id', deleteClassHandler);

// Subjects
adminRouter.get('/subjects', listSubjectsHandler);
adminRouter.post('/subjects', createSubjectHandler);
adminRouter.put('/subjects/:id', updateSubjectHandler);
adminRouter.delete('/subjects/:id', deleteSubjectHandler);

// Roles
adminRouter.get('/roles', listRolesHandler);
adminRouter.post('/roles', createRoleHandler);
adminRouter.delete('/roles/:id', deleteRoleHandler);

// Role assignments
adminRouter.get('/role-assignments', listRoleAssignmentsHandler);
adminRouter.put('/role-assignments', updateRoleAssignmentsHandler);

// Teacher ID availability
adminRouter.get('/teacher-id/availability', teacherIdAvailabilityHandler);

// School Profile
adminRouter.get('/school-profile', getSchoolProfileHandler);
adminRouter.put('/school-profile', updateSchoolProfileHandler);

// Bulk Student Import
adminRouter.get('/students/import-template', getStudentImportTemplateHandler);
adminRouter.post('/students/bulk-import', bulkImportStudentsHandler);

// Upload login background image
adminRouter.post('/upload-login-background', uploadLoginBackgroundHandler);

// General file upload (images, PDFs, documents)
adminRouter.post('/upload-file', uploadFileHandler);

// ==================== TEACHER ASSIGNMENT ROUTES ====================

// Get teacher subject assignments
adminRouter.get('/teachers/:teacherId/subject-assignments', getTeacherSubjectAssignmentsHandler);

// Get teacher class teacher assignments
adminRouter.get('/teachers/:teacherId/class-teacher-assignments', getTeacherClassTeacherAssignmentsHandler);

// Assign subjects to a teacher
adminRouter.post('/teachers/:teacherId/subject-assignments', assignTeacherSubjectsHandler);

// Assign teacher as class teacher
adminRouter.post('/teachers/:teacherId/class-teacher-assignments', assignClassTeacherHandler);

// Delete class teacher assignments for a teacher
adminRouter.delete('/teachers/:teacherId/class-teacher-assignments', deleteClassTeacherAssignmentsHandler);

// Get teacher assignments summary (for teacher profile)
adminRouter.get('/teachers/:teacherId/assignments-summary', getTeacherAssignmentsSummaryHandler);

