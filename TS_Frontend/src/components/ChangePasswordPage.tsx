import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { KeyRound, CheckCircle2, XCircle, Eye, EyeOff } from 'lucide-react';
import type { User } from '../App';
import { API_BASE_URL } from '../lib/api';
import { toast } from './ui/sonner';

interface ChangePasswordPageProps {
  user: User;
  onPasswordChanged: (user: User) => void;
  onLogout: () => void;
}

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
}

const passwordRequirements: PasswordRequirement[] = [
  { label: 'At least 8 characters long', test: (pwd) => pwd.length >= 8 },
  { label: 'Contains at least one uppercase letter', test: (pwd) => /[A-Z]/.test(pwd) },
  { label: 'Contains at least one lowercase letter', test: (pwd) => /[a-z]/.test(pwd) },
  { label: 'Contains at least one number', test: (pwd) => /[0-9]/.test(pwd) },
  { label: 'Contains at least one special character', test: (pwd) => /[!@#$%^&*(),.?":{}|<>]/.test(pwd) },
];

export function ChangePasswordPage({ user, onPasswordChanged, onLogout }: ChangePasswordPageProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validatePassword = (password: string): boolean => {
    return passwordRequirements.every(req => req.test(password));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!currentPassword) {
      setError('Please enter your current password');
      return;
    }

    if (!validatePassword(newPassword)) {
      setError('Password does not meet the requirements');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (currentPassword === newPassword) {
      setError('New password must be different from current password');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.message || 'Failed to change password');
      }

      const data = await response.json();
      toast.success(data.message || 'Password changed successfully');
      
      // Update user state and redirect to dashboard
      const updatedUser = { ...user, needsPasswordChange: false };
      onPasswordChanged(updatedUser);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 sm:p-8">
        <div className="text-center mb-6">
          <div className="size-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <KeyRound className="size-8 text-indigo-600" />
          </div>
          <h1 className="text-indigo-600 mb-2">Change Password</h1>
          <p className="text-gray-600">Welcome, {user.name}!</p>
          <p className="text-sm text-gray-500 mt-2">
            For security reasons, you need to change your password before accessing the system.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="currentPassword" className="block mb-2 text-gray-700">
              Current Password
            </label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showCurrentPassword ? 'text' : 'password'}
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showCurrentPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="newPassword" className="block mb-2 text-gray-700">
              New Password
            </label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block mb-2 text-gray-700">
              Confirm New Password
            </label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-md space-y-2">
            <p className="text-sm text-gray-700 mb-2">Password must meet the following requirements:</p>
            {passwordRequirements.map((req, index) => {
              const isMet = newPassword ? req.test(newPassword) : false;
              return (
                <div key={index} className="flex items-start gap-2">
                  {isMet ? (
                    <CheckCircle2 className="size-4 text-green-600 mt-0.5 flex-shrink-0" />
                  ) : (
                    <XCircle className="size-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  )}
                  <span className={`text-xs ${isMet ? 'text-green-700' : 'text-gray-600'}`}>
                    {req.label}
                  </span>
                </div>
              );
            })}
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onLogout}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-indigo-600 hover:bg-indigo-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Changing...' : 'Change Password'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
