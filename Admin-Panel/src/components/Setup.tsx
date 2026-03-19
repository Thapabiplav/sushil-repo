import { useState, useEffect } from 'react';
import { GraduationCap, Lock, Mail, User, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useSchoolSettings } from './SchoolSettingsContext';
import { API_BASE_URL } from '../lib/api';

interface SetupProps {
  onSetupComplete: () => void;
}

export function Setup({ onSetupComplete }: SetupProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { settings } = useSchoolSettings();
  const isDark = settings.theme === 'dark';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/setup/setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message ?? 'Setup failed');
      }

      // Setup successful, notify parent
      onSetupComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Setup failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className={`min-h-screen flex items-center justify-center p-4 relative ${
        isDark ? 'bg-gray-900' : ''
      }`}
      style={{
        background: settings.loginBackground 
          ? `url(${settings.loginBackground}) center/cover no-repeat` 
          : isDark
          ? undefined
          : 'linear-gradient(to bottom right, rgb(239 246 255), rgb(224 231 255))'
      }}
    >
      {/* Overlay for better readability when background image is set */}
      {settings.loginBackground && (
        <div className="absolute inset-0 bg-black/40" />
      )}
      
      <div
        className={`rounded-2xl shadow-xl w-full max-w-md p-8 relative z-10 ${
          isDark ? 'bg-gray-900 text-gray-100' : 'bg-white'
        }`}
      >
        <div className="text-center mb-8">
          {settings.schoolLogo ? (
            <div className="inline-flex items-center justify-center w-16 h-16 mb-4 overflow-hidden rounded-full">
              <img 
                src={settings.schoolLogo} 
                alt="School Logo" 
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
          )}
          <h1 className={`${isDark ? 'text-gray-100' : 'text-gray-900'} mb-2`}>
            {settings.schoolName || 'School Name'}
          </h1>
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
            System Setup - Create Admin Account
          </p>
        </div>

        <div className={`mb-6 p-4 rounded-lg ${isDark ? 'bg-blue-900/40 border-blue-700' : 'bg-blue-50 border-blue-200'} border`}>
          <div className="flex items-start gap-3">
            <AlertCircle className={`w-5 h-5 mt-0.5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
            <p className={`text-sm ${isDark ? 'text-blue-200' : 'text-blue-700'}`}>
              This appears to be a new installation. Please create your admin account to get started.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="name" className={`block mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError('');
                }}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  isDark ? 'bg-gray-800 border-gray-700 text-gray-100' : 'border-gray-300'
                }`}
                placeholder="Enter your full name"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className={`block mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  isDark ? 'bg-gray-800 border-gray-700 text-gray-100' : 'border-gray-300'
                }`}
                placeholder="Enter your email"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className={`block mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                className={`w-full pl-10 pr-10 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  isDark ? 'bg-gray-800 border-gray-700 text-gray-100' : 'border-gray-300'
                }`}
                placeholder="Create a password (min 8 characters)"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none p-1 rounded"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className={`block mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
              <input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setError('');
                }}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  isDark ? 'bg-gray-800 border-gray-700 text-gray-100' : 'border-gray-300'
                }`}
                placeholder="Confirm your password"
                required
              />
            </div>
          </div>

          {error && (
            <div
              className={`px-4 py-3 rounded-lg border ${
                isDark ? 'bg-red-900/40 border-red-700 text-red-300' : 'bg-red-50 border-red-200 text-red-700'
              }`}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-70"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Setting up...' : 'Create Admin Account'}
          </button>
        </form>
      </div>
    </div>
  );
}
