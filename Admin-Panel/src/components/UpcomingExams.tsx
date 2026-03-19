import { FileText } from 'lucide-react';
import { useAdminData } from './AdminDataContext';

export function UpcomingExams() {
  const data = useAdminData();
  const exams = data.events.slice(0, 3).map((event) => ({
    id: event.id,
    subject: event.title,
    date: new Date(event.date).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    }),
    class: event.venue,
  }));

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-gray-900">Upcoming Exams</h3>
        <FileText className="w-5 h-5 text-orange-600" />
      </div>
      
      <div className="space-y-3">
        {exams.length === 0 && <p className="text-sm text-gray-500">No upcoming exams</p>}
        {exams.map((exam) => (
          <div key={exam.id} className="p-3 border border-gray-200 rounded-lg hover:border-orange-300 transition-colors">
            <p className="text-gray-900 text-sm mb-1">{exam.subject}</p>
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>{exam.class}</span>
              <span>{exam.date}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
