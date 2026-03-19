import { Card } from '../ui/card';
import { Users, School, FileText, TrendingUp, UserCheck, Bell } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const stats = [
  { label: 'Total Students', value: '1,234', change: '+12%', icon: Users, color: 'bg-blue-500' },
  { label: 'Total Teachers', value: '87', change: '+5%', icon: UserCheck, color: 'bg-green-500' },
  { label: 'Total Classes', value: '42', change: '0%', icon: School, color: 'bg-purple-500' },
  { label: 'Active Notices', value: '15', change: '+3', icon: Bell, color: 'bg-orange-500' },
];

const attendanceData = [
  { name: 'Mon', students: 1150, teachers: 82 },
  { name: 'Tue', students: 1180, teachers: 85 },
  { name: 'Wed', students: 1160, teachers: 83 },
  { name: 'Thu', students: 1190, teachers: 86 },
  { name: 'Fri', students: 1170, teachers: 84 },
];

const examData = [
  { name: 'Jan', average: 75 },
  { name: 'Feb', average: 78 },
  { name: 'Mar', average: 82 },
  { name: 'Apr', average: 80 },
  { name: 'May', average: 85 },
  { name: 'Jun', average: 88 },
];

const classDistribution = [
  { name: 'Grade 1-3', value: 350 },
  { name: 'Grade 4-6', value: 400 },
  { name: 'Grade 7-9', value: 320 },
  { name: 'Grade 10-12', value: 164 },
];

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

const recentActivities = [
  { id: 1, title: 'New notice published', time: '2 hours ago', type: 'notice' },
  { id: 2, title: 'Exam marks uploaded for Class 10A', time: '5 hours ago', type: 'exam' },
  { id: 3, title: 'New student enrolled', time: '1 day ago', type: 'student' },
  { id: 4, title: 'Teacher profile updated', time: '2 days ago', type: 'teacher' },
  { id: 5, title: 'Study material uploaded', time: '3 days ago', type: 'material' },
];

export function AdminDashboardView() {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.color} size-12 rounded-lg flex items-center justify-center`}>
                  <Icon className="size-6 text-white" />
                </div>
                <span className="text-sm text-green-600">{stat.change}</span>
              </div>
              <p className="text-gray-600 text-sm mb-1">{stat.label}</p>
              <p className="text-gray-900">{stat.value}</p>
            </Card>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Chart */}
        <Card className="p-6">
          <h3 className="mb-4">Weekly Attendance Overview</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="students" fill="#3b82f6" name="Students" />
                <Bar dataKey="teachers" fill="#10b981" name="Teachers" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Class Distribution */}
        <Card className="p-6">
          <h3 className="mb-4">Students Distribution by Grade</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={classDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {classDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Exam Performance and Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Exam Performance Trend */}
        <Card className="p-6 lg:col-span-2">
          <h3 className="mb-4">Average Exam Performance Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={examData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="average" stroke="#8b5cf6" strokeWidth={2} name="Average Score (%)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Recent Activities */}
        <Card className="p-6">
          <h3 className="mb-4">Recent Activities</h3>
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex gap-3">
                <div className="size-2 bg-purple-600 rounded-full mt-2 flex-shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 truncate">{activity.title}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <h3 className="mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-left transition-colors">
            <Users className="size-6 text-blue-600 mb-2" />
            <p className="text-sm text-gray-900">Add New Student</p>
          </button>
          <button className="p-4 bg-green-50 hover:bg-green-100 rounded-lg text-left transition-colors">
            <UserCheck className="size-6 text-green-600 mb-2" />
            <p className="text-sm text-gray-900">Add New Teacher</p>
          </button>
          <button className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg text-left transition-colors">
            <School className="size-6 text-purple-600 mb-2" />
            <p className="text-sm text-gray-900">Create New Class</p>
          </button>
          <button className="p-4 bg-orange-50 hover:bg-orange-100 rounded-lg text-left transition-colors">
            <Bell className="size-6 text-orange-600 mb-2" />
            <p className="text-sm text-gray-900">Post Notice</p>
          </button>
        </div>
      </Card>
    </div>
  );
}
