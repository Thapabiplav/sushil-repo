import { useState, useEffect } from 'react';
import type { User } from '../../App';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Bell, Calendar as CalendarIcon, Users, CheckSquare, FileText } from 'lucide-react';
import { Calendar } from '../ui/calendar';
import { useTeacherData } from './TeacherDataContext';
import { apiFetch } from '../../lib/api';

interface TeacherOverviewSectionProps {
  user: User;
}

interface DashboardSummary {
  totalClasses: number;
  totalStudents: number;
  totalTeachers: number;
  totalSubjects: number;
  activeClasses: number;
  academicYear: string | null;
  noticesCount: number;
}

export function TeacherOverviewSection({ user }: TeacherOverviewSectionProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const data = useTeacherData();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const result = await apiFetch<DashboardSummary>('/dashboard/summary');
        setSummary(result);
      } catch (error) {
        console.error('Failed to fetch dashboard summary:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSummary();
  }, []);

  const statConfig = [
    { label: 'Total Classes', icon: Users, color: 'bg-blue-50 text-blue-600', value: summary?.totalClasses ?? 0 },
    { label: 'Total Students', icon: Users, color: 'bg-green-50 text-green-600', value: summary?.totalStudents ?? 0 },
    { label: 'Total Teachers', icon: Users, color: 'bg-purple-50 text-purple-600', value: summary?.totalTeachers ?? 0 },
    { label: 'Active Notices', icon: Bell, color: 'bg-orange-50 text-orange-600', value: summary?.noticesCount ?? 0 },
  ];

  return (
    <div className="space-y-4">
      {/* Stats Grid - Shows real data from admin dashboard */}
      <div className="grid grid-cols-2 gap-3">
        {statConfig.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card key={idx}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg ${stat.color}`}>
                    <Icon className="size-6" />
                  </div>
                  <div>
                    <p className="text-2xl text-gray-900">{isLoading ? '-' : stat.value}</p>
                    <p className="text-sm text-gray-600">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Today's Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="size-5 text-indigo-600" />
            Today's Schedule
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.overview.schedule.map((cls, idx) => (
            <div key={idx} className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
              <div className="flex items-center justify-between mb-1">
                <span className="text-indigo-600">{cls.time}</span>
                <span className="text-sm px-2 py-1 bg-white rounded text-gray-600">
                  {cls.room}
                </span>
              </div>
              <p className="text-gray-900">{cls.subject}</p>
              <p className="text-sm text-gray-600">{cls.class}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Notices */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="size-5 text-indigo-600" />
            Recent Notices
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.overview.notices.map((notice) => (
            <div key={notice.id} className="p-3 bg-gray-50 rounded-lg border">
              <div className="flex items-start justify-between mb-1">
                <h3 className="text-gray-900">{notice.title}</h3>
                <span className={`text-xs px-2 py-1 rounded ${
                  notice.priority === 'High' 
                    ? 'bg-red-100 text-red-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {notice.priority}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2">{notice.content}</p>
              <p className="text-xs text-gray-500">{new Date(notice.date).toLocaleDateString()}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Calendar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="size-5 text-indigo-600" />
            Calendar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="rounded-md border w-full"
          />
          

        </CardContent>
      </Card>
    </div>
  );
}
