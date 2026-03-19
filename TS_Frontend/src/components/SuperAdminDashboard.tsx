import { useState } from 'react';
import { User } from '../App';
import { 
  LayoutDashboard, 
  Users, 
  School, 
  Bell, 
  FileText, 
  Calendar,
  Settings,
  LogOut,
  Menu,
  X,
  UserPlus,
  BookOpen,
  TrendingUp,
  UserCheck
} from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { AdminDashboardView } from './admin/AdminDashboardView';
import { AdminUsersView } from './admin/AdminUsersView';
import { AdminClassesView } from './admin/AdminClassesView';
import { AdminNoticesView } from './admin/AdminNoticesView';
import { AdminResultsView } from './admin/AdminResultsView';
import { AdminEventsView } from './admin/AdminEventsView';
import { AdminSettingsView } from './admin/AdminSettingsView';

interface SuperAdminDashboardProps {
  user: User;
  onLogout: () => void;
}

type ViewType = 'dashboard' | 'users' | 'classes' | 'notices' | 'results' | 'events' | 'settings';

const menuItems = [
  { id: 'dashboard' as ViewType, label: 'Dashboard', icon: LayoutDashboard },
  { id: 'users' as ViewType, label: 'Users', icon: Users },
  { id: 'classes' as ViewType, label: 'Classes', icon: School },
  { id: 'notices' as ViewType, label: 'Notices', icon: Bell },
  { id: 'results' as ViewType, label: 'Results', icon: FileText },
  { id: 'events' as ViewType, label: 'Events', icon: Calendar },
  { id: 'settings' as ViewType, label: 'Settings', icon: Settings },
];

export function SuperAdminDashboard({ user, onLogout }: SuperAdminDashboardProps) {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <AdminDashboardView />;
      case 'users':
        return <AdminUsersView />;
      case 'classes':
        return <AdminClassesView />;
      case 'notices':
        return <AdminNoticesView />;
      case 'results':
        return <AdminResultsView />;
      case 'events':
        return <AdminEventsView />;
      case 'settings':
        return <AdminSettingsView />;
      default:
        return <AdminDashboardView />;
    }
  };

  const handleMenuClick = (view: ViewType) => {
    setCurrentView(view);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-white border-r border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="size-10 bg-purple-600 rounded-lg flex items-center justify-center">
              <School className="size-6 text-white" />
            </div>
            <div>
              <h1 className="text-gray-900">Sushil School</h1>
              <p className="text-xs text-gray-500">Admin Panel</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors ${
                  currentView === item.id
                    ? 'bg-purple-50 text-purple-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="size-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="size-10 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-purple-700">{user.name?.charAt(0)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate">{user.name}</p>
              <p className="text-xs text-gray-500">Super Admin</p>
            </div>
          </div>
          <Button
            onClick={onLogout}
            variant="outline"
            className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50"
          >
            <LogOut className="size-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity ${
          isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        <aside
          className={`fixed inset-y-0 left-0 w-64 bg-white transform transition-transform ${
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10 bg-purple-600 rounded-lg flex items-center justify-center">
                <School className="size-6 text-white" />
              </div>
              <div>
                <h1 className="text-gray-900">Sushil School</h1>
                <p className="text-xs text-gray-500">Admin Panel</p>
              </div>
            </div>
            <button onClick={() => setIsMobileMenuOpen(false)}>
              <X className="size-5 text-gray-500" />
            </button>
          </div>

          <nav className="flex-1 p-4 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleMenuClick(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors ${
                    currentView === item.id
                      ? 'bg-purple-50 text-purple-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="size-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center gap-3 px-4 py-3 mb-2">
              <div className="size-10 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-700">{user.name?.charAt(0)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{user.name}</p>
                <p className="text-xs text-gray-500">Super Admin</p>
              </div>
            </div>
            <Button
              onClick={onLogout}
              variant="outline"
              className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50"
            >
              <LogOut className="size-4 mr-2" />
              Logout
            </Button>
          </div>
        </aside>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="flex items-center justify-between p-4 lg:px-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden text-gray-500 hover:text-gray-700"
              >
                <Menu className="size-6" />
              </button>
              <div>
                <h2 className="text-gray-900">
                  {menuItems.find(item => item.id === currentView)?.label}
                </h2>
                <p className="text-sm text-gray-500 hidden sm:block">
                  Manage your school system
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          {renderView()}
        </div>
      </main>
    </div>
  );
}
