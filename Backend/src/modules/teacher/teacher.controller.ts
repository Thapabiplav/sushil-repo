import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { getTeacherDashboard, uploadTeacherMaterial, updateTeacherProfileImage, updateTeacherProfile, deleteTeacherMaterial } from './teacher.service';
import { HttpError } from '../../middleware/errorHandler';
import { uploadImageFromBuffer } from '../../services/cloudinary.service';

const paramsSchema = z.object({
  teacherId: z.coerce.number(),
});

export async function teacherDashboardHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { teacherId } = paramsSchema.parse(req.params);
    const data = await getTeacherDashboard(teacherId);
    res.json(data);
  } catch (error) {
    next(error);
  }
}

const uploadBodySchema = z.object({
  title: z.string().min(1),
  subject: z.string().min(1),
  className: z.string().min(1),
  size: z.string().min(1),
});

export async function teacherMaterialUploadHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { teacherId } = paramsSchema.parse(req.params);
    const parsed = uploadBodySchema.parse(req.body);
    if (!req.file) {
      throw new HttpError(400, 'File is required');
    }

    const material = await uploadTeacherMaterial(teacherId, {
      ...parsed,
      file: { buffer: req.file.buffer, mimetype: req.file.mimetype },
    });

    res.status(201).json(material);
  } catch (error) {
    next(error);
  }
}

const profileImageSchema = z.object({
  profileImage: z.string().url(),
});

const profileUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export async function teacherProfileImageHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { teacherId } = paramsSchema.parse(req.params);
    const { profileImage } = profileImageSchema.parse(req.body);

    const teacher = await updateTeacherProfileImage(teacherId, profileImage);
    res.json({ image: teacher.image });
  } catch (error) {
    next(error);
  }
}

export async function teacherProfileImageUploadHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { teacherId } = paramsSchema.parse(req.params);
    if (!req.file) {
      throw new HttpError(400, 'Image file is required');
    }

    const upload = await uploadImageFromBuffer(
      req.file.buffer,
      req.file.mimetype,
      'sushil-school/profile-images',
      'image'
    );

    const teacher = await updateTeacherProfileImage(teacherId, upload.secure_url);
    res.json({ image: teacher.image });
  } catch (error) {
    next(error);
  }
}

export async function teacherProfileUpdateHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { teacherId } = paramsSchema.parse(req.params);
    const body = profileUpdateSchema.parse(req.body);
    const teacher = await updateTeacherProfile(teacherId, body);
    res.json({
      id: teacher.id,
      name: teacher.name,
      email: teacher.email,
      phone: teacher.phone,
      address: teacher.address,
    });
  } catch (error) {
    next(error);
  }
}

const deleteMaterialParamsSchema = z.object({
  materialId: z.coerce.number(),
});

export async function teacherMaterialDeleteHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { teacherId } = paramsSchema.parse(req.params);
    const { materialId } = deleteMaterialParamsSchema.parse(req.params);
    
    await deleteTeacherMaterial(teacherId, materialId);
    res.json({ message: 'Material deleted successfully' });
  } catch (error) {
    next(error);
  }
}

