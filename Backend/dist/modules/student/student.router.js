"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.studentRouter = void 0;
const express_1 = require("express");
const student_controller_1 = require("./student.controller");
const upload_1 = require("../../utils/upload");
exports.studentRouter = (0, express_1.Router)();
exports.studentRouter.get('/:studentId/overview', student_controller_1.studentOverviewHandler);
exports.studentRouter.get('/:studentId/attendance', student_controller_1.studentAttendanceHandler);
exports.studentRouter.post('/:studentId/attendance', upload_1.upload.single('photo'), student_controller_1.studentAttendanceSubmitHandler);
exports.studentRouter.get('/:studentId/academics', student_controller_1.studentAcademicsHandler);
exports.studentRouter.get('/:studentId/materials', student_controller_1.studentMaterialsHandler);
exports.studentRouter.put('/:studentId/profile-image', student_controller_1.studentProfileImageHandler);
exports.studentRouter.post('/:studentId/profile-image/upload', upload_1.upload.single('image'), student_controller_1.studentProfileImageUploadHandler);
//# sourceMappingURL=student.router.js.map