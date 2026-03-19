import type { User } from '../../models/User';

export interface LoginRequestBody {
  email: string;
  password: string;
  role: 'admin' | 'teacher' | 'student';
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    role: 'admin' | 'teacher' | 'student';
    name: string;
    phone?: string;
    address?: string;
    image?: string;
    username?: string;
    teacherId?: string;
    classTeacherOf?: string;
    assignedClasses?: string[];
    class?: string;
    rollNumber?: string;
    needsPasswordChange?: boolean;
    passwordUpdatedAt?: string;
  };
  token: string;
}

export type UserModel = User;

export interface ChangePasswordRequestBody {
  currentPassword: string;
  newPassword: string;
}

export interface ChangePasswordResponse {
  success: boolean;
  message: string;
}

