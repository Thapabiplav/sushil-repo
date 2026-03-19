"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.studentOverviewHandler = studentOverviewHandler;
exports.studentAttendanceHandler = studentAttendanceHandler;
exports.studentAttendanceSubmitHandler = studentAttendanceSubmitHandler;
exports.studentAcademicsHandler = studentAcademicsHandler;
exports.studentMaterialsHandler = studentMaterialsHandler;
exports.studentProfileImageHandler = studentProfileImageHandler;
exports.studentProfileImageUploadHandler = studentProfileImageUploadHandler;
const zod_1 = require("zod");
const student_service_1 = require("./student.service");
const cloudinary_service_1 = require("../../services/cloudinary.service");
const errorHandler_1 = require("../../middleware/errorHandler");
const idParamSchema = zod_1.z.object({
    studentId: zod_1.z.coerce.number(),
});
async function studentOverviewHandler(req, res, next) {
    try {
        const { studentId } = idParamSchema.parse(req.params);
        const data = await (0, student_service_1.getStudentOverview)(studentId);
        res.json(data);
    }
    catch (error) {
        next(error);
    }
}
async function studentAttendanceHandler(req, res, next) {
    try {
        const { studentId } = idParamSchema.parse(req.params);
        const data = await (0, student_service_1.getStudentAttendance)(studentId);
        res.json(data);
    }
    catch (error) {
        next(error);
    }
}
const attendanceBodySchema = zod_1.z.object({
    location: zod_1.z.string().min(1),
});
async function studentAttendanceSubmitHandler(req, res, next) {
    try {
        const { studentId } = idParamSchema.parse(req.params);
        const { location } = attendanceBodySchema.parse(req.body);
        const photo = req.file
            ? {
                buffer: req.file.buffer,
                mimetype: req.file.mimetype,
            }
            : undefined;
        const result = await (0, student_service_1.submitStudentAttendance)(studentId, { location, photo });
        res.json(result);
    }
    catch (error) {
        next(error);
    }
}
async function studentAcademicsHandler(req, res, next) {
    try {
        const { studentId } = idParamSchema.parse(req.params);
        const data = await (0, student_service_1.getStudentAcademics)(studentId);
        res.json(data);
    }
    catch (error) {
        next(error);
    }
}
async function studentMaterialsHandler(req, res, next) {
    try {
        const { studentId } = idParamSchema.parse(req.params);
        const data = await (0, student_service_1.getStudentMaterials)(studentId);
        res.json(data);
    }
    catch (error) {
        next(error);
    }
}
const profileImageSchema = zod_1.z.object({
    profileImage: zod_1.z.string().url(),
});
async function studentProfileImageHandler(req, res, next) {
    try {
        const { studentId } = idParamSchema.parse(req.params);
        const { profileImage } = profileImageSchema.parse(req.body);
        const student = await (0, student_service_1.updateStudentProfileImage)(studentId, profileImage);
        res.json({ image: student.image });
    }
    catch (error) {
        next(error);
    }
}
async function studentProfileImageUploadHandler(req, res, next) {
    try {
        const { studentId } = idParamSchema.parse(req.params);
        if (!req.file) {
            throw new errorHandler_1.HttpError(400, 'Image file is required');
        }
        const upload = await (0, cloudinary_service_1.uploadImageFromBuffer)(req.file.buffer, req.file.mimetype, 'sushil-school/profile-images', 'image');
        const student = await (0, student_service_1.updateStudentProfileImage)(studentId, upload.secure_url);
        res.json({ image: student.image });
    }
    catch (error) {
        next(error);
    }
}
//# sourceMappingURL=student.controller.js.map