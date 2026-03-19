import { LayoutDashboard, Users, GraduationCap, Bell, Calendar, BarChart3, School, Settings, Layers3, BadgeCheck, BookOpen } from 'lucide-react';
import { useSchoolSettings } from './SchoolSettingsContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout?: () => void;
}

export function Sidebar({ activeTab, setActiveTab, onLogout }: SidebarProps) {
  const { settings, t } = useSchoolSettings();

  const menuItems = [
    { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { id: 'classes', label: t('classes') ?? 'Classes', icon: School },
    { id: 'subjects', label: 'Subjects', icon: BookOpen },
    { id: 'students', label: t('students'), icon: Users },
    { id: 'teachers', label: t('teachers'), icon: GraduationCap },
    { id: 'roles', label: t('roles') ?? 'Roles', icon: BadgeCheck },
    { id: 'notices', label: t('noticesEvents'), icon: Bell },
    // { id: 'calendar', label: t('calendar'), icon: Calendar },
    { id: 'reports', label: t('reports'), icon: BarChart3 },
    { id: 'profile', label: t('schoolProfile'), icon: School },
    { id: 'settings', label: t('settings'), icon: Settings },
  ];

  // Determine sidebar width based on type
  const getSidebarWidth = () => {
    switch (settings.sidebarType) {
      case 'mini':
        return 'w-20';
      case 'compact':
        return 'w-56';
      default:
        return 'w-64';
    }
  };

  // Get theme-based colors
  const isDark = settings.theme === 'dark';
  const bgColor = isDark ? 'bg-gray-800' : 'bg-white';
  const borderColor = isDark ? 'border-gray-700' : 'border-gray-200';
  const textColor = isDark ? 'text-gray-100' : 'text-gray-900';
  const subtextColor = isDark ? 'text-gray-400' : 'text-gray-500';
  const hoverColor = isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50';

  return (
    <aside className={`${getSidebarWidth()} ${bgColor} border-r ${borderColor} h-screen overflow-y-auto transition-all duration-300`}>
      <div className={`${settings.sidebarType === 'mini' ? 'p-4' : 'p-6'}`}>
        <div className={`flex ${settings.sidebarType === 'mini' ? 'flex-col items-center' : 'items-center gap-2'} mb-8`}>
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0" 
            style={{ backgroundColor: settings.primaryColor }}
          >
            {settings.schoolLogo ? (
              <img
                src={settings.schoolLogo}
                alt={t('schoolName')}
                className="w-full h-full object-cover"
              />
            ) : (
              <GraduationCap className="w-6 h-6 text-white" />
            )}
          </div>
          {settings.sidebarType !== 'mini' && (
            <div>
              <h2 className={textColor}>{settings.schoolName || t('schoolName')}</h2>
              <p className={`${subtextColor} text-sm`}>{t('superAdmin')}</p>
            </div>
          )}
        </div>

        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center ${
                  settings.sidebarType === 'mini' ? 'justify-center p-3' : 'gap-3 px-4 py-3'
                } rounded-lg transition-colors ${
                  isActive
                    ? isDark
                      ? 'text-white'
                      : 'text-blue-600'
                    : isDark
                    ? `${subtextColor} ${hoverColor}`
                    : `text-gray-700 ${hoverColor}`
                }`}
                style={isActive ? { backgroundColor: settings.primaryColor + '20', color: settings.primaryColor } : {}}
                title={settings.sidebarType === 'mini' ? item.label : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {settings.sidebarType !== 'mini' && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {onLogout && (
          <button
            onClick={onLogout}
            className={`mt-6 w-full px-4 py-2 rounded-lg border ${isDark ? 'border-gray-700 text-red-300 hover:bg-gray-700' : 'border-gray-200 text-red-600 hover:bg-red-50'}`}
          >
            {t('logout') || 'Logout'}
          </button>
        )}
      </div>
    </aside>
  );
}