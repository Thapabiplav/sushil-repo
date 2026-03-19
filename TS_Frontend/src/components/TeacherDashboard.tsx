import { useCallback, useEffect, useState } from 'react';
import type { User } from '../App';
import { Button } from './ui/button';
import { LogOut, Home, Users, CheckSquare, Upload, FileText, UserCircle, MapPin } from 'lucide-react';
import { TeacherOverviewSection } from './teacher/TeacherOverviewSection';
import { TeacherClassesSection } from './teacher/TeacherClassesSection';
import { TeacherAttendanceSection } from './teacher/TeacherAttendanceSection';
import { TeacherUploadSection } from './teacher/TeacherUploadSection';
import { TeacherExamMarksSection } from './teacher/TeacherExamMarksSection';
import { TeacherProfileSection } from './teacher/TeacherProfileSection';
import { apiFetch } from '../lib/api';
import { TeacherDataProvider, type TeacherDashboardData } from './teacher/TeacherDataContext';
import { useSchoolProfile } from '../hooks/useSchoolProfile';

interface TeacherDashboardProps {
  user: User;
  onLogout: () => void;
  onUpdateUser: (user: User) => void;
}

type TabType = 'overview' | 'classes' | 'attendance' | 'upload' | 'marks' | 'profile';

export function TeacherDashboard({ user, onLogout, onUpdateUser }: TeacherDashboardProps) {
  const { profile } = useSchoolProfile();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [dashboardData, setDashboardData] = useState<TeacherDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get theme color from profile, default to indigo-600
  const themeColor = profile?.themeColor || '#4f46e5';

  const fetchDashboardData = useCallback(() => {
    setIsLoading(true);
    setError(null);
    apiFetch<TeacherDashboardData>(`/teachers/${user.id}/dashboard`)
      .then(setDashboardData)
      .catch((err) => setError(err.message ?? 'Failed to load teacher data'))
      .finally(() => setIsLoading(false));
  }, [user.id]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const navItems = [
    { id: 'overview' as TabType, icon: Home, label: 'Overview' },
    { id: 'classes' as TabType, icon: Users, label: 'Classes' },
    { id: 'attendance' as TabType, icon: CheckSquare, label: 'Attendance' },
    { id: 'upload' as TabType, icon: Upload, label: 'Materials' },
    // { id: 'marks' as TabType, icon: FileText, label: 'Marks' },
    { id: 'profile' as TabType, icon: UserCircle, label: 'Profile' },
  ];

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
                <p className="text-xs text-white/80">Teacher Portal</p>
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
          <p className="text-gray-600">Welcome back,</p>
          <h2 className="text-gray-900">{user.name}</h2>
          {user.classTeacherOf && (
            <p className="text-sm" style={{ color: themeColor }}>Class Teacher: {user.classTeacherOf}</p>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="text-sm text-gray-500 mt-4">Loading teacher data...</p>
          </div>
        )}
        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded">
            {error}
            <button 
              onClick={fetchDashboardData}
              className="mt-2 text-indigo-600 hover:text-indigo-800 underline"
            >
              Try again
            </button>
          </div>
        )}
        {!isLoading && !error && dashboardData && (
          <TeacherDataProvider value={dashboardData}>
            {activeTab === 'overview' && <TeacherOverviewSection user={user} />}
            {activeTab === 'classes' && <TeacherClassesSection user={user} />}
            {activeTab === 'attendance' && <TeacherAttendanceSection user={user} />}
            {activeTab === 'upload' && (
              <TeacherUploadSection user={user} onRefresh={fetchDashboardData} />
            )}
            {activeTab === 'marks' && <TeacherExamMarksSection user={user} />}
            {activeTab === 'profile' && (
              <TeacherProfileSection user={user} onUpdateUser={onUpdateUser} />
            )}
          </TeacherDataProvider>
        )}
        {!isLoading && !error && !dashboardData && (
          <div className="text-center py-12">
            <p className="text-gray-500">No data available</p>
            <button 
              onClick={fetchDashboardData}
              className="mt-2 text-indigo-600 hover:text-indigo-800 underline"
            >
              Refresh
            </button>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-20">
        <div className="max-w-7xl mx-auto grid grid-cols-6">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center py-2 px-1 transition-colors ${
                  isActive
                    ? ''
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                style={isActive ? { color: themeColor } : {}}
              >
                <Icon className={`size-5 ${isActive ? 'fill-current' : ''}`} />
                <span className="text-xs mt-1">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
