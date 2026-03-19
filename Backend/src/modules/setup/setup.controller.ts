import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { User } from '../../models/User';
import { HttpError } from '../../middleware/errorHandler';

const setupSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export async function setupHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Check if admin user already exists
    const existingAdmin = await User.findOne({ where: { role: 'admin' } });
    
    if (existingAdmin) {
      throw new HttpError(400, 'System has already been set up. Please login with existing credentials.');
    }

    // Validate request body
    const parsed = setupSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, 'Invalid request body', parsed.error.flatten());
    }

    // Check if email is already in use
    const existingUser = await User.findOne({ where: { email: parsed.data.email } });
    if (existingUser) {
      throw new HttpError(400, 'Email is already registered');
    }

    // Create admin user
    const passwordHash = await bcrypt.hash(parsed.data.password, 10);
    const admin = await User.create({
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
      role: 'admin',
      needsPasswordChange: false,
    });

    res.status(201).json({
      message: 'Admin user created successfully',
      user: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function checkSetupStatusHandler(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const adminExists = await User.findOne({ where: { role: 'admin' } });
    res.json({ needsSetup: !adminExists });
  } catch (err) {
    next(err);
  }
}
