import { Users, GraduationCap, BookOpen, TrendingUp, UserX, Bell } from 'lucide-react';
import { useSchoolSettings } from './SchoolSettingsContext';
import { useAdminData } from './AdminDataContext';
import { useThemeStyles } from './useThemeStyles';

export function StatsCards() {
  const theme = useThemeStyles();
  const { settings, t } = useSchoolSettings();
  const data = useAdminData();
  const isDark = settings.theme === 'dark';

  const baseStats = [
    {
      title: t('totalStudents'),
      icon: Users,
      color: settings.primaryColor,
      fallback: '0',
    },
    {
      title: t('totalTeachers'),
      icon: GraduationCap,
      color: '#10B981',
      fallback: '0',
    },
    {
      title: t('totalClasses'),
      icon: BookOpen,
      color: settings.secondaryColor,
      fallback: '0',
    },
    {
      title: settings.language === 'ne' ? 'Notices' : 'Active Notices',
      icon: Bell,
      color: '#06B6D4',
      fallback: '0',
    },
  ];

  const stats = [
    ...baseStats.map((stat, index) => ({
      ...stat,
      value: data.stats[index]?.value?.toLocaleString() ?? stat.fallback,
      change: '+0%',
      trend: 'up',
    })),
    {
      title: settings.language === 'ne' ? 'आज अनुपस्थित' : 'Absent Today',
      value: data.absentToday > 0 ? data.absentToday.toLocaleString() : '0',
      change: data.absentToday > 0 ? '-5%' : '0%',
      trend: 'down',
      icon: UserX,
      color: '#EF4444',
    },
    {
      title: t('avgAttendance'),
      value: data.avgAttendance > 0 ? `${data.avgAttendance}%` : '0%',
      change: data.avgAttendance > 0 ? '+2.1%' : '0%',
      trend: 'up',
      icon: TrendingUp,
      color: '#F59E0B',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
      {stats.map((stat) => {
        const Icon = stat.icon;
        
        return (
          <div key={stat.title} className={`${theme.cardBg} rounded-xl p-4 sm:p-6 shadow-sm border ${theme.borderColor}`}>
            <div className="flex items-start justify-between mb-3 sm:mb-4">
              <div 
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: stat.color }}
              >
                <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <span 
                className="text-sm"
                style={{ color: stat.trend === 'down' ? '#10B981' : settings.primaryColor }}
              >
                {stat.change}
              </span>
            </div>
            <h3 className={`${theme.subtextColor} text-sm mb-1`}>{stat.title}</h3>
            <p className={theme.textColor}>{stat.value}</p>
          </div>
        );
      })}
    </div>
  );
}