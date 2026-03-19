import { useCallback, useEffect, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { StudentManagement } from './components/StudentManagement';
import { TeacherManagement } from './components/TeacherManagement';
import { NoticesEvents } from './components/NoticesEvents';
import { SchoolCalendar } from './components/SchoolCalendar';
import { Reports } from './components/Reports';
import { SchoolProfile } from './components/SchoolProfile';
import { SchoolSettings } from './components/SchoolSettings';
import { Login } from './components/Login';
import { ClassManagement } from './components/ClassManagement';
import { SubjectManagement } from './components/SubjectManagement';
import { RoleManagement } from './components/RoleManagement';
import { SchoolSettingsProvider, useSchoolSettings } from './components/SchoolSettingsContext';
import { AdminDataProvider, type AdminDashboardData } from './components/AdminDataContext';
import { apiFetch } from './lib/api';
import { Menu } from 'lucide-react';

// Default fallback data when API fails
const defaultAdminData: AdminDashboardData = {
  stats: [
    { label: 'Total Students', value: 0 },
    { label: 'Total Teachers', value: 0 },
    { label: 'Total Classes', value: 0 },
    { label: 'Active Notices', value: 0 },
  ],
  absentToday: 0,
  avgAttendance: 0,
  overallAttendance: 0,
  students: [],
  teachers: [],
  notices: [],
  events: [],
  classes: [],
};

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminData, setAdminData] = useState<AdminDashboardData | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  // Persist auth across refreshes
  useEffect(() => {
    const storedAuth = localStorage.getItem('admin:isAuthenticated');
    if (storedAuth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
    localStorage.setItem('admin:isAuthenticated', 'true');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('admin:isAuthenticated');
    setAdminData(null);
  };

  const loadAdminData = useCallback(() => {
    setIsLoadingData(true);
    setDataError(null);
    return apiFetch<AdminDashboardData>('/admin/dashboard')
      .then((data) => {
        setAdminData(data);
        // Clear error on success
        setDataError(null);
      })
      .catch((err) => {
        console.error('Failed to load admin data:', err);
        // Set error but allow panel to load with default data
        setDataError(err.message ?? 'Failed to load admin data');
        // Set default data so panel can still function
        setAdminData(defaultAdminData);
      })
      .finally(() => {
        setIsLoadingData(false);
      });
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadAdminData();
    }
  }, [isAuthenticated, loadAdminData]);

  // Use actual data if available, otherwise use default
  const contextValue = adminData ? { ...adminData, refreshData: loadAdminData, isLoading: isLoadingData } : null;

  return (
    <SchoolSettingsProvider>
      {!isAuthenticated ? (
        <Login onLogin={handleLogin} />
      ) : (
        <AdminDataProvider value={contextValue}>
          <AppContent 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            onLogout={handleLogout} 
            dataError={dataError}
            onRetry={loadAdminData}
          />
        </AdminDataProvider>
      )}
    </SchoolSettingsProvider>
  );
}

function AppContent({ activeTab, setActiveTab, onLogout, dataError, onRetry }: { activeTab: string; setActiveTab: (tab: string) => void; onLogout: () => void; dataError: string | null; onRetry: () => void }) {
  const { settings, t } = useSchoolSettings();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'classes':
        return <ClassManagement />;
      case 'subjects':
        return <SubjectManagement />;
      case 'students':
        return <StudentManagement />;
      case 'teachers':
        return <TeacherManagement />;
      case 'roles':
        return <RoleManagement />;
      case 'notices':
        return <NoticesEvents />;
      case 'calendar':
        return <SchoolCalendar />;
      case 'reports':
        return <Reports />;
      case 'profile':
        return <SchoolProfile />;
      case 'settings':
        return <SchoolSettings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className={`flex min-h-screen ${settings.theme === 'dark' ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      {/* Error notification banner */}
      {dataError && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-red-50 border-b border-red-200 px-4 py-2 flex items-center justify-between">
          <span className="text-sm text-red-700">⚠️ {dataError}</span>
          <button 
            onClick={onRetry}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Retry
          </button>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={onLogout} />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 lg:hidden ${
        isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={(tab) => {
            setActiveTab(tab);
            setIsMobileSidebarOpen(false);
          }} 
          onLogout={() => {
            setIsMobileSidebarOpen(false);
            onLogout();
          }}
        />
      </div>
      
      <main className={`flex-1 overflow-y-auto ${settings.theme === 'dark' ? 'bg-gray-900' : ''}`} style={dataError ? { marginTop: '40px' } : {}}>
        {/* Mobile Header */}
        <div className={`lg:hidden sticky top-0 z-30 ${settings.theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b px-4 py-3 flex items-center gap-3`}>
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className={`p-2 rounded-lg ${settings.theme === 'dark' ? 'hover:bg-gray-700 text-gray-100' : 'hover:bg-gray-100 text-gray-900'}`}
          >
            <Menu className="w-6 h-6" />
          </button>
          <h2 className={settings.theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}>
            {settings.schoolName || t('schoolName') || 'School Name'}
          </h2>
          <button
            onClick={onLogout}
            className="ml-auto text-sm text-red-600 hover:text-red-700"
          >
            Logout
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
}