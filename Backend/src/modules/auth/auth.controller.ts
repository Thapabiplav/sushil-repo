import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { login, changePassword } from './auth.service';
import { HttpError } from '../../middleware/errorHandler';
import { env } from '../../config/env';
import jwt from 'jsonwebtoken';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  role: z.enum(['admin', 'teacher', 'student']),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

// Middleware to verify JWT token and extract user
async function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    throw new HttpError(401, 'Authentication required');
  }

  try {
    const decoded = jwt.verify(token, env.jwtSecret) as unknown as { sub: number; role: string; email: string };
    (req as any).user = decoded;
    next();
  } catch {
    throw new HttpError(401, 'Invalid or expired token');
  }
}

export async function loginHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, 'Invalid request body', parsed.error.flatten());
    }

    const result = await login(parsed.data);
    return res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function changePasswordHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const parsed = changePasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, 'Invalid request body', parsed.error.flatten());
    }

    const userId = (req as any).user.sub;
    const result = await changePassword(userId, parsed.data);
    return res.json(result);
  } catch (err) {
    next(err);
  }
}

export { authenticateToken };

