import { useEffect, useState } from 'react';
import type { User } from '../../App';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Bell, Calendar as CalendarIcon, Clock, Users, BookOpen } from 'lucide-react';
import { Calendar } from '../ui/calendar';
import { apiFetch } from '../../lib/api';

interface StudentOverviewSectionProps {
  user: User;
}

interface OverviewResponse {
  notices: Array<{
    id: number;
    title: string;
    content: string;
    date: string;
    type: string;
  }>;
  events: Array<{
    id: number;
    title: string;
    date: string;
    time: string;
    venue: string;
  }>;
  routine: Array<{
    day: string;
    periods: { time: string; subject: string; teacher: string }[];
  }>;
}

interface DashboardSummary {
  totalStudents: number;
  totalTeachers: number;
  academicYear: string | null;
  noticesCount: number;
}

export function StudentOverviewSection({ user }: StudentOverviewSectionProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    // Fetch overview data
    apiFetch<OverviewResponse>(`/students/${user.id}/overview`, {
      signal: controller.signal,
    })
      .then((response) => {
        setData(response);
        if (response.routine.length) {
          setSelectedDay(response.routine[0].day);
        }
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          setError(err.message ?? 'Failed to load overview');
        }
      })
      .finally(() => setIsLoading(false));

    return () => controller.abort();
  }, [user.id]);

  // Fetch dashboard summary for stats
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const result = await apiFetch<DashboardSummary>('/dashboard/summary');
        setSummary(result);
      } catch (error) {
        console.error('Failed to fetch dashboard summary:', error);
      }
    };

    fetchSummary();
  }, []);

  const statConfig = [
    { label: 'Total Students', icon: Users, color: 'bg-blue-50 text-blue-600', value: summary?.totalStudents ?? '-' },
    { label: 'Total Teachers', icon: Users, color: 'bg-green-50 text-green-600', value: summary?.totalTeachers ?? '-' },
    { label: 'Active Notices', icon: Bell, color: 'bg-orange-50 text-orange-600', value: summary?.noticesCount ?? '-' },
  ];

  return (
    <div className="space-y-4">
      {/* Stats Grid - Shows real data from admin dashboard (student-safe metrics only) */}
      <div className="grid grid-cols-3 gap-3">
        {statConfig.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card key={idx}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg ${stat.color}`}>
                    <Icon className="size-5" />
                  </div>
                  <div>
                    <p className="text-xl text-gray-900">{stat.value}</p>
                    <p className="text-xs text-gray-600">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="size-5 text-green-600" />
            Recent Notices
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded">
              {error}
            </div>
          )}
          {isLoading && !data && <p className="text-sm text-gray-500">Loading notices...</p>}
          {!isLoading && data?.notices?.length === 0 && (
            <p className="text-sm text-gray-500">No notices available</p>
          )}
          {data?.notices?.map((notice) => (
            <div key={notice.id} className="p-3 bg-gray-50 rounded-lg border">
              <div className="flex items-start justify-between mb-1">
                <h3 className="text-gray-900">{notice.title}</h3>
                <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                  {notice.type}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2">{notice.content}</p>
              <p className="text-xs text-gray-500">
                {new Date(notice.date).toLocaleDateString()}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="size-5 text-green-600" />
            Upcoming Events
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading && !data && <p className="text-sm text-gray-500">Loading events...</p>}
          {data?.events?.map((event) => (
            <div key={event.id} className="p-3 bg-green-50 rounded-lg border border-green-200">
              <h3 className="text-gray-900 mb-1">{event.title}</h3>
              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="size-4" />
                  {new Date(event.date).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="size-4" />
                  {event.time} - {event.venue}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="size-5 text-green-600" />
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="size-5 text-green-600" />
            Class Routine
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {data?.routine?.map((day) => (
              <button
                key={day.day}
                onClick={() => setSelectedDay(day.day)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  selectedDay === day.day
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {day.day}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            {data?.routine
              ?.find((r) => r.day === selectedDay)
              ?.periods.map((period, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border ${
                    period.subject === 'Break'
                      ? 'bg-orange-50 border-orange-200'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-900">{period.subject}</p>
                      <p className="text-sm text-gray-600">{period.teacher}</p>
                    </div>
                    <span className="text-sm text-gray-500">{period.time}</span>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
