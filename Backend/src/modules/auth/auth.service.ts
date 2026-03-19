import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { User } from '../../models/User';
import type { LoginRequestBody, LoginResponse, ChangePasswordRequestBody, ChangePasswordResponse } from './auth.types';
import { HttpError } from '../../middleware/errorHandler';

// Strong password validation regex
const PASSWORD_REGEX = {
  minLength: /.{8,}/,
  uppercase: /[A-Z]/,
  lowercase: /[a-z]/,
  number: /[0-9]/,
  special: /[!@#$%^&*(),.?":{}|<>]/,
};

export async function login(body: LoginRequestBody): Promise<LoginResponse> {
  const user = await User.findOne({
    where: { email: body.email, role: body.role },
  });

  if (!user) {
    throw new HttpError(401, 'Invalid email or password');
  }

  const valid = await bcrypt.compare(body.password, user.passwordHash);
  if (!valid) {
    throw new HttpError(401, 'Invalid email or password');
  }

  const token = jwt.sign(
    {
      sub: user.id,
      role: user.role,
      email: user.email,
    },
    env.jwtSecret,
    { expiresIn: '8h' }
  );

  const responseUser: LoginResponse['user'] = {
    id: String(user.id),
    email: user.email,
    role: user.role,
    name: user.name,
    phone: user.phone ?? undefined,
    address: user.address ?? undefined,
    image: user.image ?? undefined,
    username: user.username ?? undefined,
    teacherId: user.teacherId ?? undefined,
    classTeacherOf: user.classTeacherOf ?? undefined,
    assignedClasses: (user.assignedClasses as string[] | null) ?? undefined,
    class: user.class ?? undefined,
    rollNumber: user.rollNumber ?? undefined,
    needsPasswordChange: user.needsPasswordChange,
    passwordUpdatedAt: user.passwordUpdatedAt?.toISOString() ?? undefined,
  };

  return { user: responseUser, token };
}

export function validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!PASSWORD_REGEX.minLength.test(password)) {
    errors.push('Password must be at least 8 characters long');
  }
  if (!PASSWORD_REGEX.uppercase.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!PASSWORD_REGEX.lowercase.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!PASSWORD_REGEX.number.test(password)) {
    errors.push('Password must contain at least one number');
  }
  if (!PASSWORD_REGEX.special.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return { valid: errors.length === 0, errors };
}

export async function changePassword(
  userId: number,
  body: ChangePasswordRequestBody
): Promise<ChangePasswordResponse> {
  const user = await User.findByPk(userId);
  
  if (!user) {
    throw new HttpError(404, 'User not found');
  }

  // Verify current password
  const validCurrentPassword = await bcrypt.compare(body.currentPassword, user.passwordHash);
  if (!validCurrentPassword) {
    throw new HttpError(401, 'Current password is incorrect');
  }

  // Validate new password strength
  const { valid, errors } = validatePasswordStrength(body.newPassword);
  if (!valid) {
    throw new HttpError(400, 'Password does not meet requirements', errors);
  }

  // Check if new password is same as current password
  const isSamePassword = await bcrypt.compare(body.newPassword, user.passwordHash);
  if (isSamePassword) {
    throw new HttpError(400, 'New password must be different from current password');
  }

  // Hash new password and update user
  const newPasswordHash = await bcrypt.hash(body.newPassword, 10);
  await user.update({
    passwordHash: newPasswordHash,
    needsPasswordChange: false,
    passwordUpdatedAt: new Date(),
  });

  return {
    success: true,
    message: 'Password changed successfully',
  };
}

