import { AlertCircle } from 'lucide-react';
import { useAdminData } from './AdminDataContext';

export function UpcomingNotices() {
  const data = useAdminData();

  const priorityColors = {
    high: 'bg-red-100 text-red-700 border-red-200',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    low: 'bg-green-100 text-green-700 border-green-200',
  };

  const notices = data.notices.slice(0, 3).map((notice) => ({
    id: notice.id,
    title: notice.title,
    date: new Date(notice.date).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    }),
    priority:
      notice.type === 'Event'
        ? 'high'
        : notice.type === 'Notice'
        ? 'medium'
        : 'low',
  }));

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-gray-900">Upcoming Notices</h3>
        <AlertCircle className="w-5 h-5 text-blue-600" />
      </div>
      
      <div className="space-y-3">
        {notices.length === 0 && (
          <p className="text-sm text-gray-500">No notices available</p>
        )}
        {notices.map((notice) => (
          <div
            key={notice.id}
            className={`p-3 border rounded-lg ${priorityColors[notice.priority as keyof typeof priorityColors]}`}
          >
            <p className="text-sm mb-1">{notice.title}</p>
            <p className="text-xs opacity-75">{notice.date}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
