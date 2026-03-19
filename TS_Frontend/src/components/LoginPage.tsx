import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { GraduationCap, User, Shield, Eye, EyeOff, Image, X } from 'lucide-react';
import type { User as UserType } from '../App';
import { API_BASE_URL } from '../lib/api';

interface LoginPageProps {
  onLogin: (user: UserType) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [selectedRole, setSelectedRole] = useState<'teacher' | 'student' | 'admin' | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load background image from localStorage on mount
  useEffect(() => {
    const savedBackground = localStorage.getItem('loginBackgroundImage');
    if (savedBackground) {
      setBackgroundImage(savedBackground);
    }
  }, []);

  // Save background image to localStorage
  const saveBackgroundImage = (imageUrl: string) => {
    localStorage.setItem('loginBackgroundImage', imageUrl);
    setBackgroundImage(imageUrl);
  };

  // Remove background image
  const removeBackgroundImage = () => {
    localStorage.removeItem('loginBackgroundImage');
    setBackgroundImage('');
  };

  // Handle file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`${API_BASE_URL}/admin/upload-login-background`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.message ?? 'Failed to upload image');
      }

      const data = await response.json();
      saveBackgroundImage(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedRole) {
      setError('Please select a role');
      return;
    }

    const login = async () => {
      try {
        setIsSubmitting(true);
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            password,
            role: selectedRole,
          }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => null);
          throw new Error(data?.message ?? 'Invalid email or password');
        }

        const data = await response.json();
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        onLogin(data.user as UserType);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to login');
      } finally {
        setIsSubmitting(false);
      }
    };

    void login();
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{
        backgroundImage: backgroundImage ? `url(${backgroundImage}) center/cover no-repeat` : undefined,
        backgroundColor: backgroundImage ? undefined : 'rgb(239 246 255)',
        background: backgroundImage ? undefined : 'linear-gradient(to bottom right, rgb(239 246 255), rgb(224 231 255))',
      } as React.CSSProperties}
    >
      {/* Overlay for better readability when background image is set */}
      {backgroundImage && (
        <div className="absolute inset-0 bg-black/40" />
      )}
      
      {/* Background image controls */}
      <div className="absolute top-4 right-4 z-20 flex gap-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />
        {!backgroundImage ? (
          <Button
            onClick={triggerFileInput}
            disabled={isUploading}
            className="bg-white/90 hover:bg-white text-gray-700 shadow-lg"
          >
            <Image className="w-4 h-4 mr-2" />
            {isUploading ? 'Uploading...' : 'Add Background'}
          </Button>
        ) : (
          <Button
            onClick={removeBackgroundImage}
            className="bg-red-500/90 hover:bg-red-500 text-white shadow-lg"
          >
            <X className="w-4 h-4 mr-2" />
            Remove
          </Button>
        )}
      </div>

      <Card className="w-full max-w-md p-8 relative z-10">
        <div className="text-center mb-8">
          <GraduationCap className="size-16 mx-auto text-indigo-600 mb-4" />
          <h1 className="text-indigo-600 mb-2">Sushil School</h1>
          <p className="text-gray-600">Welcome back! Please login to continue</p>
        </div>

        {!selectedRole ? (
          <div className="space-y-4">
            <h2 className="text-center text-gray-700 mb-6">Select Login Type</h2>
            {/* <Button
              onClick={() => setSelectedRole('admin')}
              className="w-full h-16 bg-purple-600 hover:bg-purple-700"
            >
              <Shield className="size-5 mr-2" />
              Login as Super Admin
            </Button> */}
            <Button
              onClick={() => setSelectedRole('teacher')}
              className="w-full h-16 bg-indigo-600 hover:bg-indigo-700"
            >
              <User className="size-5 mr-2" />
              Login as Teacher
            </Button>
            <Button
              onClick={() => setSelectedRole('student')}
              className="w-full h-16 bg-green-600 hover:bg-green-700"
            >
              <GraduationCap className="size-5 mr-2" />
              Login as Student
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="text-center mb-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setSelectedRole(null);
                  setEmail('');
                  setPassword('');
                  setError('');
                }}
                className="text-sm"
              >
                ← Change Login Type
              </Button>
              <p className="mt-2 text-gray-600">
                Logging in as <span className="capitalize">{selectedRole}</span>
              </p>
            </div>

            <div>
              <label htmlFor="email" className="block mb-2 text-gray-700">Email</label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block mb-2 text-gray-700">Password</label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={isSubmitting}>
              {isSubmitting ? 'Logging in...' : 'Login'}
            </Button>

            
          </form>
        )}
      </Card>
    </div>
  );
}