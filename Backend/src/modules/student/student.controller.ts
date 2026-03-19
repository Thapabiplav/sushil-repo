import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import {
  getStudentAcademics,
  getStudentAttendance,
  getStudentMaterials,
  getStudentOverview,
  submitStudentAttendance,
  updateStudentProfileImage,
  updateStudentProfile,
} from './student.service';
import { uploadImageFromBuffer } from '../../services/cloudinary.service';
import { HttpError } from '../../middleware/errorHandler';

const idParamSchema = z.object({
  studentId: z.coerce.number(),
});

export async function studentOverviewHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { studentId } = idParamSchema.parse(req.params);
    const data = await getStudentOverview(studentId);
    res.json(data);
  } catch (error) {
    next(error);
  }
}

export async function studentAttendanceHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { studentId } = idParamSchema.parse(req.params);
    const data = await getStudentAttendance(studentId);
    res.json(data);
  } catch (error) {
    next(error);
  }
}

const attendanceBodySchema = z.object({
  location: z.string().min(1),
});

export async function studentAttendanceSubmitHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { studentId } = idParamSchema.parse(req.params);
    const { location } = attendanceBodySchema.parse(req.body);

    const photo = req.file
      ? {
          buffer: req.file.buffer,
          mimetype: req.file.mimetype,
        }
      : undefined;

    const result = await submitStudentAttendance(studentId, { location, photo });
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function studentAcademicsHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { studentId } = idParamSchema.parse(req.params);
    const data = await getStudentAcademics(studentId);
    res.json(data);
  } catch (error) {
    next(error);
  }
}

export async function studentMaterialsHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { studentId } = idParamSchema.parse(req.params);
    const data = await getStudentMaterials(studentId);
    res.json(data);
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

export async function studentProfileUpdateHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { studentId } = idParamSchema.parse(req.params);
    const body = profileUpdateSchema.parse(req.body);
    const student = await updateStudentProfile(studentId, body);
    res.json({
      id: student.id,
      name: student.name,
      email: student.email,
      phone: student.phone,
      address: student.address,
    });
  } catch (error) {
    next(error);
  }
}

export async function studentProfileImageHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { studentId } = idParamSchema.parse(req.params);
    const { profileImage } = profileImageSchema.parse(req.body);

    const student = await updateStudentProfileImage(studentId, profileImage);
    res.json({ image: student.image });
  } catch (error) {
    next(error);
  }
}

export async function studentProfileImageUploadHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { studentId } = idParamSchema.parse(req.params);
    if (!req.file) {
      throw new HttpError(400, 'Image file is required');
    }

    const upload = await uploadImageFromBuffer(
      req.file.buffer,
      req.file.mimetype,
      'sushil-school/profile-images',
      'image'
    );

    const student = await updateStudentProfileImage(studentId, upload.secure_url);
    res.json({ image: student.image });
  } catch (error) {
    next(error);
  }
}

