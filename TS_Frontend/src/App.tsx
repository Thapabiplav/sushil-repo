import { useState, useEffect } from 'react';
import { LoginPage } from './components/LoginPage';
import { TeacherDashboard } from './components/TeacherDashboard';
import { StudentDashboard } from './components/StudentDashboard';
import { SuperAdminDashboard } from './components/SuperAdminDashboard';
import { ChangePasswordPage } from './components/ChangePasswordPage';
import { Toaster } from './components/ui/sonner';

export interface User {
  id: string;
  email: string;
  role: 'teacher' | 'student' | 'admin';
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
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    // Check if user is already logged in
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
  };

  const handlePasswordChanged = (user: User) => {
    const updatedUser = { ...user, needsPasswordChange: false };
    setCurrentUser(updatedUser);
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
  };

  if (!currentUser) {
    return (
      <>
        <LoginPage onLogin={handleLogin} />
        <Toaster />
      </>
    );
  }

  // Show password change screen for first-time login
  if (currentUser.needsPasswordChange && currentUser.role !== 'admin') {
    return (
      <>
        <ChangePasswordPage 
          user={currentUser} 
          onPasswordChanged={handlePasswordChanged}
          onLogout={handleLogout}
        />
        <Toaster />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {currentUser.role === 'admin' ? (
        <SuperAdminDashboard user={currentUser} onLogout={handleLogout} />
      ) : currentUser.role === 'teacher' ? (
        <TeacherDashboard user={currentUser} onLogout={handleLogout} onUpdateUser={setCurrentUser} />
      ) : (
        <StudentDashboard user={currentUser} onLogout={handleLogout} />
      )}
      <Toaster />
    </div>
  );
}