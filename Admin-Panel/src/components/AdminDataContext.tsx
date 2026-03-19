import { createContext, useContext } from 'react';

export interface AdminDashboardData {
  stats: { label: string; value: number }[];
  absentToday: number;
  avgAttendance: number;
  overallAttendance: number;
  students: Array<{
    id: number;
    name: string;
    class?: string | null;
    rollNo?: string | null;
    phone?: string | null;
    email: string;
    guardian: string;
    status: string;
    address?: string | null;
  }>;
  teachers: Array<{
    id: number;
    name: string;
    teacherId?: string | null;
    subject: string;
    phone?: string | null;
    email: string;
    classes: string[];
    status: string;
  }>;
  notices: Array<{
    id: number;
    title: string;
    content: string;
    date: string;
    type: string;
    imageUrl?: string | null;
  }>;
  events: Array<{
    id: number;
    title: string;
    date: string;
    time: string;
    venue: string;
  }>;
  classes: Array<{
    id: number;
    name: string;
    subject: string;
    students: number;
    schedule: string;
  }>;
}

export interface AdminContextValue extends AdminDashboardData {
  refreshData: () => Promise<void>;
  isLoading: boolean;
}

const AdminDataContext = createContext<AdminContextValue | null>(null);

// Default context value to prevent null errors
const defaultContextValue: AdminContextValue = {
  stats: [],
  absentToday: 0,
  avgAttendance: 0,
  overallAttendance: 0,
  students: [],
  teachers: [],
  notices: [],
  events: [],
  classes: [],
  refreshData: async () => {},
  isLoading: false,
};

export const AdminDataProvider = AdminDataContext.Provider;

export function useAdminData() {
  const context = useContext(AdminDataContext);
  // Return default value if context is null (during initial render)
  return context || defaultContextValue;
}

