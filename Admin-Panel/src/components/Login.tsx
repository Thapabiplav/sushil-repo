import { useState } from 'react';
import { GraduationCap, Lock, User, Eye, EyeOff } from 'lucide-react';
import { useSchoolSettings } from './SchoolSettingsContext';
import { API_BASE_URL } from '../lib/api';

interface LoginProps {
  onLogin: () => void;
}

export function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { settings } = useSchoolSettings();
  const isDark = settings.theme === 'dark';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const login = async () => {
      try {
        setIsSubmitting(true);
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: username,
            password,
            role: 'admin',
          }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => null);
          throw new Error(data?.message ?? 'Invalid username or password');
        }

        const data = await response.json();
        // Store token and user for subsequent API calls
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        onLogin();
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
          <h1 className={`${isDark ? 'text-gray-100' : 'text-gray-900'} mb-2`}>{settings.schoolName || 'School Name'}</h1>
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Super Admin Portal</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className={`block mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
              Email
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="username"
                type="email"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
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
                placeholder="Enter your password"
                required
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
            {isSubmitting ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Contact your administrator if you need access
          </p>
        </div>
      </div>
    </div>
  );
}
