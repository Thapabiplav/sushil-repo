import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useAdminData } from './AdminDataContext';
import { useThemeStyles } from './useThemeStyles';

export function EnrollmentChart() {
  const adminData = useAdminData();
  const theme = useThemeStyles();
  const [data, setData] = useState([
    { month: 'Jan', students: 0, teachers: 0 },
    { month: 'Feb', students: 0, teachers: 0 },
    { month: 'Mar', students: 0, teachers: 0 },
    { month: 'Apr', students: 0, teachers: 0 },
    { month: 'May', students: 0, teachers: 0 },
    { month: 'Jun', students: 0, teachers: 0 },
  ]);

  useEffect(() => {
    // Generate trend data based on current stats
    const currentStudents = adminData.stats.find(s => s.label === 'Total Students')?.value ?? 0;
    const currentTeachers = adminData.stats.find(s => s.label === 'Total Teachers')?.value ?? 0;
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const trendData = months.map((month, index) => {
      // Simulate growth trend
      const growthFactor = 1 - (months.length - index - 1) * 0.05;
      return {
        month,
        students: Math.round(currentStudents * growthFactor),
        teachers: Math.round(currentTeachers * growthFactor),
      };
    });
    setData(trendData);
  }, [adminData.stats]);

  return (
    <div className={`${theme.cardBg} rounded-xl p-6 shadow-sm border ${theme.borderColor}`}>
      <h3 className={`${theme.textColor} mb-4`}>Enrollment Trends</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={theme.isDark ? "#374151" : "#f0f0f0"} />
          <XAxis dataKey="month" stroke={theme.isDark ? "#9ca3af" : "#6b7280"} />
          <YAxis stroke={theme.isDark ? "#9ca3af" : "#6b7280"} />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: theme.isDark ? "#1f2937" : "#fff",
              border: `1px solid ${theme.isDark ? "#374151" : "#e5e7eb"}`,
              borderRadius: '8px',
              color: theme.isDark ? "#f3f4f6" : "#111827",
            }} 
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="students" 
            stroke="#3b82f6" 
            strokeWidth={3}
            dot={{ fill: '#3b82f6', r: 4 }}
          />
          <Line 
            type="monotone" 
            dataKey="teachers" 
            stroke="#10b981" 
            strokeWidth={3}
            dot={{ fill: '#10b981', r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
