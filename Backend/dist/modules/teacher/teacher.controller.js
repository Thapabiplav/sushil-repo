"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.teacherDashboardHandler = teacherDashboardHandler;
exports.teacherMaterialUploadHandler = teacherMaterialUploadHandler;
exports.teacherProfileImageHandler = teacherProfileImageHandler;
exports.teacherProfileImageUploadHandler = teacherProfileImageUploadHandler;
exports.teacherMaterialDeleteHandler = teacherMaterialDeleteHandler;
const zod_1 = require("zod");
const teacher_service_1 = require("./teacher.service");
const errorHandler_1 = require("../../middleware/errorHandler");
const cloudinary_service_1 = require("../../services/cloudinary.service");
const paramsSchema = zod_1.z.object({
    teacherId: zod_1.z.coerce.number(),
});
async function teacherDashboardHandler(req, res, next) {
    try {
        const { teacherId } = paramsSchema.parse(req.params);
        const data = await (0, teacher_service_1.getTeacherDashboard)(teacherId);
        res.json(data);
    }
    catch (error) {
        next(error);
    }
}
const uploadBodySchema = zod_1.z.object({
    title: zod_1.z.string().min(1),
    subject: zod_1.z.string().min(1),
    className: zod_1.z.string().min(1),
    size: zod_1.z.string().min(1),
});
async function teacherMaterialUploadHandler(req, res, next) {
    try {
        const { teacherId } = paramsSchema.parse(req.params);
        const parsed = uploadBodySchema.parse(req.body);
        if (!req.file) {
            throw new errorHandler_1.HttpError(400, 'File is required');
        }
        const material = await (0, teacher_service_1.uploadTeacherMaterial)(teacherId, {
            ...parsed,
            file: { buffer: req.file.buffer, mimetype: req.file.mimetype },
        });
        res.status(201).json(material);
    }
    catch (error) {
        next(error);
    }
}
const profileImageSchema = zod_1.z.object({
    profileImage: zod_1.z.string().url(),
});
async function teacherProfileImageHandler(req, res, next) {
    try {
        const { teacherId } = paramsSchema.parse(req.params);
        const { profileImage } = profileImageSchema.parse(req.body);
        const teacher = await (0, teacher_service_1.updateTeacherProfileImage)(teacherId, profileImage);
        res.json({ image: teacher.image });
    }
    catch (error) {
        next(error);
    }
}
async function teacherProfileImageUploadHandler(req, res, next) {
    try {
        const { teacherId } = paramsSchema.parse(req.params);
        if (!req.file) {
            throw new errorHandler_1.HttpError(400, 'Image file is required');
        }
        const upload = await (0, cloudinary_service_1.uploadImageFromBuffer)(req.file.buffer, req.file.mimetype, 'sushil-school/profile-images', 'image');
        const teacher = await (0, teacher_service_1.updateTeacherProfileImage)(teacherId, upload.secure_url);
        res.json({ image: teacher.image });
    }
    catch (error) {
        next(error);
    }
}
const deleteMaterialParamsSchema = zod_1.z.object({
    materialId: zod_1.z.coerce.number(),
});
async function teacherMaterialDeleteHandler(req, res, next) {
    try {
        const { teacherId } = paramsSchema.parse(req.params);
        const { materialId } = deleteMaterialParamsSchema.parse(req.params);
        await (0, teacher_service_1.deleteTeacherMaterial)(teacherId, materialId);
        res.json({ message: 'Material deleted successfully' });
    }
    catch (error) {
        next(error);
    }
}
//# sourceMappingURL=teacher.controller.js.map