import { useCallback, useEffect, useState } from 'react';
import type { User } from '../App';
import { Button } from './ui/button';
import { LogOut, Home, CheckSquare, BookOpen, FolderOpen, UserCircle, MapPin, RefreshCw } from 'lucide-react';
import { StudentOverviewSection } from './student/StudentOverviewSection';
import { StudentAttendanceSection } from './student/StudentAttendanceSection';
import { StudentAcademicsSection } from './student/StudentAcademicsSection';
import { StudentMaterialsSection } from './student/StudentMaterialsSection';
import { StudentProfileSection } from './student/StudentProfileSection';
import { useSchoolProfile } from '../hooks/useSchoolProfile';
import { apiFetch } from '../lib/api';

interface StudentDashboardProps {
  user: User;
  onLogout: () => void;
}

type TabType = 'overview' | 'attendance' | 'academics' | 'materials' | 'profile';

export function StudentDashboard({ user: initialUser, onLogout }: StudentDashboardProps) {
  const { profile } = useSchoolProfile();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User>(initialUser);

  useEffect(() => {
    setUser(initialUser);
  }, [initialUser]);

  const handleUpdateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
  };

  // Get theme color from profile, default to green
  const themeColor = profile?.themeColor || '#22c55e';

  const navItems = [
    { id: 'overview' as TabType, icon: Home, label: 'Overview' },
    // { id: 'attendance' as TabType, icon: CheckSquare, label: 'Attendance' },
    // { id: 'academics' as TabType, icon: BookOpen, label: 'Academics' },
    { id: 'materials' as TabType, icon: FolderOpen, label: 'Materials' },
    { id: 'profile' as TabType, icon: UserCircle, label: 'Profile' },
  ];

  // Fetch student data to validate connection
  const fetchStudentData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await apiFetch(`/students/${user.id}/overview`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load student data');
    } finally {
      setIsLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    fetchStudentData();
  }, [fetchStudentData]);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header 
        className="text-white p-2 sticky top-0 z-10 relative overflow-hidden shadow-sm transition-all duration-300"
        style={{ backgroundColor: themeColor } as React.CSSProperties}
      >
        {/* Overlay for better text visibility if background image exists */}
        {profile?.profileBackground && (
          <div 
            className="absolute inset-0 z-0"
            style={{
              backgroundImage: `url(${profile.profileBackground})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        )}
        {profile?.profileBackground && (
          <div className="absolute inset-0 bg-black/50 z-0"></div>
        )}

        <div className="max-w-7xl mx-auto flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            {profile?.schoolLogo ? (
              <img 
                src={profile.schoolLogo} 
                alt="School Logo" 
                className="w-10 h-10 rounded-full border border-white/50 object-cover bg-white"
              />
            ) : (
              <div className="w-10 h-10 rounded-full border border-white/50 object-cover bg-white/20 flex items-center justify-center">
                <span className="text-white font-bold text-lg">{profile?.name?.[0] || 'S'}</span>
              </div>
            )}
            <div>
              <h1 className="text-white font-bold text-base leading-tight truncate max-w-[200px] sm:max-w-md">
                {profile?.name || 'School Name'}
              </h1>
              {profile?.address ? (
                <div className="flex items-center gap-1 text-xs text-white/90 truncate max-w-[200px] sm:max-w-md">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{profile.address}</span>
                </div>
              ) : (
                <p className="text-xs text-white/80">Student Portal</p>
              )}
            </div>
          </div>
          <Button
            onClick={onLogout}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20 h-8 w-8 p-0"
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </header>

      {/* Welcome Section */}
      <div className="bg-white border-b p-4">
        <div className="max-w-7xl mx-auto">
          <p className="text-gray-600">Welcome,</p>
          <h2 className="text-gray-900">{user.name}</h2>
          <p className="text-sm" style={{ color: themeColor }}>{user.class} - Roll No: {user.rollNumber}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            <p className="text-sm text-gray-500 mt-4">Loading student data...</p>
          </div>
        )}
        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded">
            {error}
            <button 
              onClick={fetchStudentData}
              className="mt-2 text-green-600 hover:text-green-800 underline flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              Try again
            </button>
          </div>
        )}
        {!isLoading && !error && (
          <>
            {activeTab === 'overview' && <StudentOverviewSection user={user} />}
            {activeTab === 'attendance' && <StudentAttendanceSection user={user} />}
            {activeTab === 'academics' && <StudentAcademicsSection user={user} />}
            {activeTab === 'materials' && <StudentMaterialsSection user={user} />}
            {activeTab === 'profile' && <StudentProfileSection user={user} onUpdateUser={handleUpdateUser} />}
          </>
        )}
        {!isLoading && !error && activeTab === 'overview' && !profile && (
          <div className="text-center py-12">
            <p className="text-gray-500">No data available</p>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-20">
        <div className="max-w-7xl mx-auto flex items-center justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center py-2 px-3 flex-1 transition-colors ${
                  isActive
                    ? ''
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                style={isActive ? { color: themeColor } : {}}
              >
                <Icon className={`size-6 ${isActive ? 'fill-current' : ''}`} />
                <span className="text-xs mt-1">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
