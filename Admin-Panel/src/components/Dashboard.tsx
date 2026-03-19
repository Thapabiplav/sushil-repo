import { StatsCards } from './StatsCards';
import { AttendanceChart } from './AttendanceChart';
import { EnrollmentChart } from './EnrollmentChart';
import { SchoolCalendar } from './SchoolCalendar';
import { UpcomingNotices } from './UpcomingNotices';
import { UpcomingExams } from './UpcomingExams';
import { useSchoolSettings } from './SchoolSettingsContext';

export function Dashboard() {
  const { settings, t } = useSchoolSettings();
  const isDark = settings.theme === 'dark';
  const textColor = isDark ? 'text-gray-100' : 'text-gray-900';
  const subtextColor = isDark ? 'text-gray-400' : 'text-gray-600';

  return (
    <>
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className={`${textColor} mb-2`}>{t('dashboardTitle')}</h1>
        <p className={subtextColor}>{t('welcomeMessage')}</p>
      </div>

      {/* Stats Cards */}
      <StatsCards />

      {/* Charts Section */}
      {/* <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
        <AttendanceChart />
        <EnrollmentChart />
      </div> */}

      {/* Calendar and Notices Section */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 mb-4 sm:mb-6">
        {/* <div className="xl:col-span-2">
          <SchoolCalendar />
        </div> */}

        {/* Notices and Exams side by side */}
        <div className="flex flex-col md:flex-row gap-4 sm:gap-6 w-full">
          <div className="flex-1">
            <UpcomingNotices />
          </div>
          {/* <div className="flex-1">
            <UpcomingExams />
          </div> */}
        </div>
      </div>
    </>
  );
}