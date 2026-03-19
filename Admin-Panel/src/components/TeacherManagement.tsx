import { useEffect, useState } from 'react';
import { useThemeStyles } from './useThemeStyles';
import { Search, Plus, Download, Edit, Trash2, Eye, Mail, Phone, X, Save, EyeOff, User } from 'lucide-react';
import { useAdminData } from './AdminDataContext';
import { apiFetch } from '../lib/api';
import { toast } from 'sonner';
import { validateNepalPhone, validateStrongPassword } from '../lib/validation';
import * as XLSX from 'xlsx';

interface Teacher {
  id: number;
  name: string;
  role: string;
  subjects: string[];
  phone: string;
  email: string;
  qualification: string;
  experience: string;
  joinDate: string;
  status: string;
  post?: string;
  isClassTeacher?: boolean;
  classTeacherOf?: string;
  teachingClasses?: string[];
  teacherId?: string | null;
  image?: string | null;
  roles?: { id: number; name: string }[];
  address?: string;
  // Assignment data from database
  subjectAssignments?: SubjectAssignment[];
  classTeacherAssignments?: ClassTeacherAssignmentData[];
}

interface SubjectAssignment {
  id: number;
  subjectId: number;
  subjectName: string;
  classId: number;
  className: string;
  sectionId: number | null;
  sectionName: string | null;
}

interface ClassTeacherAssignmentData {
  id: number;
  classId: number;
  className: string;
  sectionId: number | null;
  sectionName: string | null;
  academicYear: string;
}

interface ClassWithSections {
  id: number;
  name: string;
  sections: { id: number; name: string }[];
}

interface SubjectDto {
  id: number;
  name: string;
  classId: number;
}

interface RoleDto {
  id: number;
  name: string;
}

export function TeacherManagement() {
  const theme = useThemeStyles();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState<number | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    teacherId: '',
    isClassTeacher: false,
    classTeacherOf: '',
  });
  const [availableClasses, setAvailableClasses] = useState<ClassWithSections[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<SubjectDto[]>([]);
  const [availableRoles, setAvailableRoles] = useState<RoleDto[]>([]);
  const [subjectAssignments, setSubjectAssignments] = useState<
    { classId: number | ''; subjectId: number | '' }[]
  >([{ classId: '', subjectId: '' }]);
  const [editingAssignments, setEditingAssignments] = useState<
    { classId: number | ''; subjectId: number | '' }[]
  >([{ classId: '', subjectId: '' }]);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [teacherIdStatus, setTeacherIdStatus] = useState<{
    checkedValue: string;
    available: boolean | null;
    suggestions: string[];
  }>({ checkedValue: '', available: null, suggestions: [] });
  const [teacherIdChecking, setTeacherIdChecking] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  // State for teacher assignments (from database)
  const [teacherSubjectAssignments, setTeacherSubjectAssignments] = useState<SubjectAssignment[]>([]);
  const [teacherClassTeacherAssignments, setTeacherClassTeacherAssignments] = useState<ClassTeacherAssignmentData[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);

  const adminData = useAdminData();

  // Function to load teacher assignments from database
  const loadTeacherAssignments = async (teacherId: number) => {
    setLoadingAssignments(true);
    try {
      const [subjectAssignments, classTeacherAssignments] = await Promise.all([
        apiFetch<SubjectAssignment[]>(`/admin/teachers/${teacherId}/subject-assignments`),
        apiFetch<ClassTeacherAssignmentData[]>(`/admin/teachers/${teacherId}/class-teacher-assignments`),
      ]);
      setTeacherSubjectAssignments(subjectAssignments || []);
      setTeacherClassTeacherAssignments(classTeacherAssignments || []);
    } catch (error) {
      console.error('Failed to load teacher assignments:', error);
      setTeacherSubjectAssignments([]);
      setTeacherClassTeacherAssignments([]);
    } finally {
      setLoadingAssignments(false);
    }
  };

  const loadTeachers = async () => {
    try {
      // Fetch teachers directly from API (now includes roles)
      const apiTeachers = await apiFetch<Array<{
        id: number;
        name: string;
        email: string;
        phone?: string | null;
        image?: string | null;
        teacherId?: string | null;
        assignedClasses?: string[] | null;
        classTeacherOf?: string | null;
        status?: string;
        roles?: { id: number; name: string }[];
      }>>('/admin/users?role=teacher');

      return apiTeachers.map((teacher) => {
        const classesArray = Array.isArray(teacher.assignedClasses) ? teacher.assignedClasses : [];
        const teacherRoles = teacher.roles || [];
        // Primary role logic: if specific roles exist, use the first one, otherwise default to 'Teacher'
        const primaryRole = teacherRoles.length > 0 ? teacherRoles[0].name : 'Teacher';

        return {
          id: teacher.id,
          name: teacher.name,
          role: primaryRole,
          roles: teacherRoles,
          subjects: classesArray.length > 0 ? classesArray : [],
          phone: teacher.phone ?? '',
          email: teacher.email,
          qualification: '',
          experience: '',
          joinDate: '',
          status: 'Active',
          post: classesArray[0] || 'Teacher',
          isClassTeacher: !!teacher.classTeacherOf,
          classTeacherOf: teacher.classTeacherOf || undefined,
          teachingClasses: classesArray,
          teacherId: teacher.teacherId ?? null,
          image: teacher.image || null,
        };
      });
    } catch (err) {
      // Fallback to adminData if API fails
      return adminData.teachers.map((teacher) => {
        const tClassesArray = Array.isArray(teacher.classes) ? teacher.classes : [];
        const subjectArray = teacher.subject ? [teacher.subject] : [];
        const subjects = subjectArray.length > 0 ? subjectArray : tClassesArray;

        return {
          id: teacher.id,
          name: teacher.name,
          role: 'Teacher',
          roles: [],
          subjects,
          phone: teacher.phone ?? '',
          email: teacher.email,
          qualification: '',
          experience: '',
          joinDate: '',
          status: teacher.status,
          post: teacher.subject || '',
          isClassTeacher: tClassesArray.length > 0,
          classTeacherOf: tClassesArray[0] || undefined,
          teachingClasses: tClassesArray,
          teacherId: teacher.teacherId ?? null,
          image: null,
        };
      });
    }
  };

  const [teachers, setTeachers] = useState<Teacher[]>([]);

  useEffect(() => {
    loadTeachers().then(setTeachers);
  }, [adminData.teachers]);

  // Refresh teachers when roles change
  useEffect(() => {
    if (availableRoles.length > 0) {
      loadTeachers().then(setTeachers);
    }
  }, [availableRoles]);

  useEffect(() => {
    apiFetch<ClassWithSections[]>('/admin/classes')
      .then(setAvailableClasses)
      .catch(() => {
        // ignore, UI will still work with manual class fields if needed
      });
    apiFetch<SubjectDto[]>('/admin/subjects')
      .then(setAvailableSubjects)
      .catch(() => {
        // optional
      });
    apiFetch<RoleDto[]>('/admin/roles')
      .then(setAvailableRoles)
      .catch(() => {
        // optional
      });
  }, []);

  // Load assignments when viewing a teacher
  useEffect(() => {
    if (selectedTeacher) {
      loadTeacherAssignments(selectedTeacher);
    } else {
      // Clear assignments when modal is closed
      setTeacherSubjectAssignments([]);
      setTeacherClassTeacherAssignments([]);
    }
  }, [selectedTeacher]);

  const filteredTeachers = teachers.filter(teacher =>
    teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    teacher.subjects.some(subject => subject.toLowerCase().includes(searchQuery.toLowerCase())) ||
    teacher.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteTeacher = async (id: number) => {
    if (!confirm('Are you sure you want to delete this teacher?')) return;
    
    try {
      await apiFetch(`/admin/users/${id}`, {
        method: 'DELETE',
      });
      toast.success('Teacher deleted successfully!');
      setTeachers((prev) => prev.filter((t) => t.id !== id));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete teacher');
    }
  };

  const handleExport = async (format: 'excel' | 'pdf') => {
    if (format === 'excel') {
      // Create Excel workbook
      const ws = XLSX.utils.json_to_sheet(
        filteredTeachers.map(t => ({
          'Name': t.name,
          'Email': t.email,
          'Phone': t.phone,
          'Role': t.roles && t.roles.length > 0 ? t.roles.map(r => r.name).join(', ') : t.role,
          'Teacher ID': t.teacherId || '',
          'Status': t.status,
          'Subjects': t.subjects.join('; '),
          'Qualification': t.qualification,
          'Experience': t.experience,
          'Join Date': t.joinDate,
        }))
      );
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Teachers');
      XLSX.writeFile(wb, `teachers_export_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Excel file exported successfully!');
    } else if (format === 'pdf') {
      // For PDF, create HTML table and use browser print
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        const htmlContent = `
          <!DOCTYPE html>
          <html>
            <head>
              <title>Teachers Export</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #4f46e5; color: white; }
                tr:nth-child(even) { background-color: #f2f2f2; }
                @media print { @page { size: landscape; } }
              </style>
            </head>
            <body>
              <h1>Teachers Export - ${new Date().toLocaleDateString()}</h1>
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Role</th>
                    <th>Teacher ID</th>
                    <th>Status</th>
                    <th>Subjects</th>
                  </tr>
                </thead>
                <tbody>
                  ${filteredTeachers.map(t => `
                    <tr>
                      <td>${t.name}</td>
                      <td>${t.email}</td>
                      <td>${t.phone}</td>
                      <td>${t.roles && t.roles.length > 0 ? t.roles.map(r => r.name).join(', ') : t.role}</td>
                      <td>${t.teacherId || ''}</td>
                      <td>${t.status}</td>
                      <td>${t.subjects.join(', ')}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </body>
          </html>
        `;
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.onload = () => {
          printWindow.print();
        };
        toast.success('PDF export opened in print dialog!');
      }
    }
  };

  const handleEditClick = async (teacher: Teacher) => {
    setEditingTeacher({ ...teacher });
    
    // Load assignments from database
    await loadTeacherAssignments(teacher.id);
    
    // Check if teacher is class teacher based on database assignments
    const isCT = teacherClassTeacherAssignments.length > 0;
    const classTeacherOf = teacherClassTeacherAssignments.length > 0 
      ? teacherClassTeacherAssignments[0].className 
      : '';
    
    // Set class teacher status
    setEditingTeacher(prev => prev ? {
      ...prev,
      isClassTeacher: isCT,
      classTeacherOf: isCT ? classTeacherOf : undefined
    } : null);
    
    // Parse assigned classes/subjects from database assignments into structured format
    const assignments: { classId: number | ''; subjectId: number | '' }[] = [];
    
    // Add subject assignments from database
    if (teacherSubjectAssignments.length > 0) {
      teacherSubjectAssignments.forEach(assignment => {
        assignments.push({ 
          classId: assignment.classId, 
          subjectId: assignment.subjectId 
        });
      });
    }
    
    if (assignments.length === 0) {
      // Fallback: parse from teachingClasses string format
      if (teacher.teachingClasses) {
        teacher.teachingClasses.forEach(assignmentStr => {
          if (!assignmentStr) return;
          const match = assignmentStr.trim().match(/^(.*) \((.*)\)$/);
          if (match) {
            const subjectName = match[1];
            const className = match[2];
            
            const cls = availableClasses.find(c => c.name === className);
            const subj = availableSubjects.find(s => s.name === subjectName && (!cls || s.classId === cls.id));
            
            if (cls && subj) {
              assignments.push({ classId: cls.id, subjectId: subj.id });
            }
          }
        });
      }
    }

    if (assignments.length === 0) {
      assignments.push({ classId: '', subjectId: '' });
    }
    
    setEditingAssignments(assignments);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingTeacher) return;
    setIsSubmitting(true);
    
    if (!editingTeacher.name || !editingTeacher.email) {
      toast.error('Name and email are required');
      setIsSubmitting(false);
      return;
    }

    const newErrors: Record<string, string | null> = {};
    const phoneError = validateNepalPhone(editingTeacher.phone);
    if (phoneError) newErrors.phone = phoneError;
    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) {
      toast.error('Please fix the highlighted errors');
      setIsSubmitting(false);
      return;
    }
    
    // Process assignments into strings
    const validAssignments = editingAssignments.filter(
      (a) => a.classId && a.subjectId
    );

    const formattedAssignments = validAssignments
      .map((a) => {
        const cls = availableClasses.find((c) => c.id === Number(a.classId));
        const subj = availableSubjects.find((s) => s.id === Number(a.subjectId));
        if (cls && subj) {
          return `${subj.name} (${cls.name})`;
        }
        return null;
      })
      .filter((s): s is string => s !== null);

    try {
      const payload: any = {
        name: editingTeacher.name,
        email: editingTeacher.email,
        phone: editingTeacher.phone,
        status: editingTeacher.status,
        teacherId: editingTeacher.teacherId,
        assignedClasses: formattedAssignments,
        classTeacherOf: editingTeacher.isClassTeacher ? editingTeacher.classTeacherOf : null,
        address: editingTeacher.address || '',
        // Add other fields as necessary
      };

      await apiFetch(`/admin/users/${editingTeacher.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      // Save subject assignments to database
      const validSubjectAssignments = editingAssignments.filter(
        (a) => a.classId && a.subjectId
      );
      
      if (validSubjectAssignments.length > 0) {
        await apiFetch(`/admin/teachers/${editingTeacher.id}/subject-assignments`, {
          method: 'POST',
          body: JSON.stringify({
            assignments: validSubjectAssignments.map((a) => ({
              subjectId: Number(a.subjectId),
              classId: Number(a.classId),
              sectionId: null, // Can be extended to support sections
            })),
          }),
        });
      }

      // Save class teacher assignments to database
      if (editingTeacher.isClassTeacher && editingTeacher.classTeacherOf) {
        const classAssignment = availableClasses.find((c) => c.name === editingTeacher.classTeacherOf);
        if (classAssignment) {
          const currentYear = new Date().getFullYear().toString();
          const academicYear = `${currentYear}-${parseInt(currentYear) + 1}`;
          
          await apiFetch(`/admin/teachers/${editingTeacher.id}/class-teacher-assignments`, {
            method: 'POST',
            body: JSON.stringify({
              assignments: [{
                classId: classAssignment.id,
                sectionId: null, // Can be extended to support sections
                academicYear,
              }],
            }),
          });
        }
      } else {
        // If class teacher is unchecked, delete existing class teacher assignments
        await apiFetch(`/admin/teachers/${editingTeacher.id}/class-teacher-assignments`, {
          method: 'DELETE',
        });
      }

      toast.success('Teacher updated successfully');
      setShowEditModal(false);
      setEditingTeacher(null);
      loadTeachers(); // Refresh list
    } catch (error: any) {
      toast.error(error.message || 'Failed to update teacher');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubjectAssignmentChange = (
    index: number,
    field: 'classId' | 'subjectId',
    value: number | ''
  ) => {
    setSubjectAssignments((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row;
        const newRow = { ...row, [field]: value };
        if (field === 'classId') {
          newRow.subjectId = '';
        }
        return newRow;
      })
    );
  };

  const addSubjectAssignmentRow = () => {
    setSubjectAssignments((prev) => [...prev, { classId: '', subjectId: '' }]);
  };

  const removeSubjectAssignmentRow = (index: number) => {
    setSubjectAssignments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleEditingAssignmentChange = (
    index: number,
    field: 'classId' | 'subjectId',
    value: number | ''
  ) => {
    setEditingAssignments((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row;
        const newRow = { ...row, [field]: value };
        if (field === 'classId') {
          newRow.subjectId = '';
        }
        return newRow;
      })
    );
  };

  const addEditingAssignmentRow = () => {
    setEditingAssignments((prev) => [...prev, { classId: '', subjectId: '' }]);
  };

  const removeEditingAssignmentRow = (index: number) => {
    setEditingAssignments((prev) => prev.filter((_, i) => i !== index));
  };

  const checkTeacherIdAvailability = async (value: string) => {
    if (!value) {
      setTeacherIdStatus({ checkedValue: '', available: null, suggestions: [] });
      return;
    }
    setTeacherIdChecking(true);
    try {
      const result = await apiFetch<{ available: boolean; suggestions: string[] }>(
        `/admin/teacher-id/availability?teacherId=${encodeURIComponent(value)}`
      );
      setTeacherIdStatus({
        checkedValue: value,
        available: result.available,
        suggestions: result.suggestions,
      });
    } catch {
      setTeacherIdStatus({ checkedValue: value, available: null, suggestions: [] });
    } finally {
      setTeacherIdChecking(false);
    }
  };

  return (
    <>
      <div className="mb-6 sm:mb-8">
        <h1 className={`${theme.textColor} mb-2`}>Teacher Management</h1>
        <p className={theme.subtextColor}>Manage all teacher information, roles, and subjects</p>
      </div>

      {/* Search and Actions */}
      <div className={`${theme.cardBg} rounded-xl p-4 sm:p-6 shadow-sm border ${theme.borderColor} mb-4 sm:mb-6`}>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, subject, or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 border ${theme.borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme.inputBg}`}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button 
            onClick={() => setIsAddDialogOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span className="text-sm sm:text-base">Add Teacher</span>
          </button>
          <div className="relative">
            <button 
              type="button"
              onClick={() => setShowExportMenu(!showExportMenu)}
              className={`flex items-center justify-center gap-2 px-4 py-2 border ${theme.borderColor} rounded-lg hover:${theme.bgColorAlt} transition-colors ${theme.textColor}`}
            >
              <Download className="w-5 h-5" />
              <span className="text-sm sm:text-base">Export</span>
            </button>
            {showExportMenu && (
              <div className={`absolute right-0 top-full mt-1 ${theme.cardBg} border ${theme.borderColor} rounded-lg shadow-lg z-20 min-w-[150px]`}>
                <button
                  type="button"
                  onClick={() => {
                    handleExport('excel');
                    setShowExportMenu(false);
                  }}
                  className={`block w-full text-left px-4 py-2 hover:${theme.bgColorAlt} ${theme.textColor} text-sm`}
                >
                  Export as Excel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleExport('pdf');
                    setShowExportMenu(false);
                  }}
                  className={`block w-full text-left px-4 py-2 hover:${theme.bgColorAlt} ${theme.textColor} text-sm`}
                >
                  Export as PDF
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Teachers Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {filteredTeachers.map((teacher) => (
          <div key={teacher.id} className={`${theme.cardBg} rounded-xl p-4 sm:p-6 shadow-sm border ${theme.borderColor} hover:shadow-md transition-shadow`}>
            <div className="flex items-start justify-between mb-4">
              {teacher.image ? (
                <img
                  src={teacher.image}
                  alt={teacher.name}
                  className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 ${theme.borderColor}`}
                  onError={(e) => {
                    // Fallback to initials if image fails to load
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const fallback = target.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
              ) : null}
              <div 
                className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm sm:text-base ${teacher.image ? 'hidden' : ''}`}
              >
                {teacher.name.split(' ').map(n => n[0]).join('')}
              </div>
              <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm ${
                teacher.status === 'Active' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-yellow-100 text-yellow-700'
              }`}>
                {teacher.status}
              </span>
            </div>

            <h3 className={`${theme.textColor} mb-1`}>{teacher.name}</h3>
            <div className="flex flex-wrap gap-1 mb-3">
              {teacher.roles && teacher.roles.length > 0 ? (
                teacher.roles.map((role, idx) => (
                  <span key={role.id} className="text-blue-600 text-xs sm:text-sm">
                    {role.name}{idx < teacher.roles!.length - 1 ? ', ' : ''}
                  </span>
                ))
              ) : (
                <p className="text-blue-600 text-sm">{teacher.role}</p>
              )}
            </div>
            {teacher.teacherId && (
              <p className={`text-xs ${theme.subtextColor} mb-2`}>Teacher ID: {teacher.teacherId}</p>
            )}

            {/* Class Teacher Badge - Show if teacher is class teacher */}
            {teacher.isClassTeacher && teacher.classTeacherOf && (
              <div className="mb-3 px-2 sm:px-3 py-1 bg-purple-50 text-purple-700 rounded-lg text-xs sm:text-sm inline-block">
                Class Teacher: {teacher.classTeacherOf}
              </div>
            )}

            {/* Database Class Teacher Assignments Badge */}
            {teacherClassTeacherAssignments.length > 0 && teacherClassTeacherAssignments[0]?.className && (
              <div className="mb-3 px-2 sm:px-3 py-1 bg-purple-50 text-purple-700 rounded-lg text-xs sm:text-sm inline-block">
                Class Teacher: {teacherClassTeacherAssignments.map(a => a.className).join(', ')}
              </div>
            )}

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-gray-600 text-sm">
                <Mail className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{teacher.email}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600 text-sm">
                <Phone className="w-4 h-4 flex-shrink-0" />
                <span>{teacher.phone}</span>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-gray-600 text-sm mb-2">Subjects:</p>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {/* Show database subject assignments */}
                {teacherSubjectAssignments.length > 0 ? (
                  teacherSubjectAssignments.map((assignment, index) => (
                    <span 
                      key={assignment.id || index} 
                      className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs sm:text-sm"
                      title={assignment.className}
                    >
                      {assignment.subjectName}
                    </span>
                  ))
                ) : (
                  /* Fallback to legacy subjects */
                  teacher.subjects.map((subject, index) => (
                    <span key={index} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs sm:text-sm">
                      {subject}
                    </span>
                  ))
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setSelectedTeacher(teacher.id)}
                className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <Eye className="w-4 h-4" />
                <span className="hidden sm:inline">View</span>
              </button>
              <button 
                onClick={() => handleEditClick(teacher)}
                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button 
                onClick={() => handleDeleteTeacher(teacher.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Teacher Details Modal */}
      {selectedTeacher && (() => {
        const teacher = teachers.find(t => t.id === selectedTeacher);
        if (!teacher) return null;
        
        return (
          <div className={`fixed inset-0 ${theme.modalOverlay} flex items-center justify-center p-4 z-50`}>
            <div className={`${theme.modalBg} rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border ${theme.borderColor}`}>
              <div className="flex items-center justify-between mb-6">
                <h2 className={theme.textColor}>Teacher Details</h2>
                <button
                  onClick={() => setSelectedTeacher(null)}
                  className={`${theme.subtextColor} hover:${theme.textColor}`}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className={`flex items-center gap-4 mb-6 pb-6 border-b ${theme.borderColor}`}>
                {teacher.image ? (
                  <img
                    src={teacher.image}
                    alt={teacher.name}
                    className={`w-20 h-20 rounded-full object-cover border-2 ${theme.borderColor}`}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const fallback = target.nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div 
                  className={`w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl ${teacher.image ? 'hidden' : ''}`}
                >
                  {teacher.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h3 className={`${theme.textColor} mb-1`}>{teacher.name}</h3>
                  <div className="flex flex-wrap gap-1">
                    {teacher.roles && teacher.roles.length > 0 ? (
                      teacher.roles.map((role, idx) => (
                        <span key={role.id} className="text-blue-600">
                          {role.name}{idx < teacher.roles!.length - 1 ? ', ' : ''}
                        </span>
                      ))
                    ) : (
                      <p className="text-blue-600">{teacher.role}</p>
                    )}
                  </div>
                  {teacher.isClassTeacher && (
                    <p className="text-purple-600 text-sm mt-1">Class Teacher of {teacher.classTeacherOf}</p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className={`${theme.subtextColor} text-sm mb-1`}>Email</p>
                  <p className={theme.textColor}>{teacher.email}</p>
                </div>
                <div>
                  <p className={`${theme.subtextColor} text-sm mb-1`}>Phone</p>
                  <p className={theme.textColor}>{teacher.phone || 'N/A'}</p>
                </div>
                {teacher.qualification && (
                  <div>
                    <p className={`${theme.subtextColor} text-sm mb-1`}>Qualification</p>
                    <p className={theme.textColor}>{teacher.qualification}</p>
                  </div>
                )}
                {teacher.experience && (
                  <div>
                    <p className={`${theme.subtextColor} text-sm mb-1`}>Experience</p>
                    <p className={theme.textColor}>{teacher.experience}</p>
                  </div>
                )}
                {teacher.joinDate && (
                  <div>
                    <p className={`${theme.subtextColor} text-sm mb-1`}>Join Date</p>
                    <p className={theme.textColor}>{teacher.joinDate}</p>
                  </div>
                )}
                <div>
                  <p className={`${theme.subtextColor} text-sm mb-1`}>Status</p>
                  <p className={theme.textColor}>{teacher.status}</p>
                </div>
                {teacher.post && (
                  <div>
                    <p className={`${theme.subtextColor} text-sm mb-1`}>Post</p>
                    <p className={theme.textColor}>{teacher.post}</p>
                  </div>
                )}
                <div className="col-span-2">
                  <p className={`${theme.subtextColor} text-sm mb-2`}>Subjects</p>
                  <div className="flex flex-wrap gap-2">
                    {teacher.subjects.map((subject, index) => (
                      <span key={index} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg">
                        {subject}
                      </span>
                    ))}
                  </div>
                </div>
                {teacher.teachingClasses && (
                  <div className="col-span-2">
                    <p className={`${theme.subtextColor} text-sm mb-2`}>Teaching Classes</p>
                    <div className="flex flex-wrap gap-2">
                      {teacher.teachingClasses.map((cls, index) => (
                        <span key={index} className="px-3 py-1 bg-green-50 text-green-700 rounded-lg">
                          {cls}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {/* Database Subject Assignments */}
                {teacherSubjectAssignments.length > 0 && (
                  <div className="col-span-2">
                    <p className={`${theme.subtextColor} text-sm mb-2`}>Subject Assignments (Database)</p>
                    <div className="flex flex-wrap gap-2">
                      {teacherSubjectAssignments.map((assignment) => (
                        <span
                          key={assignment.id}
                          className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-sm"
                          title={`Class: ${assignment.className}${assignment.sectionName ? ` - ${assignment.sectionName}` : ''}`}
                        >
                          {assignment.subjectName}
                          {assignment.sectionName && (
                            <span className="text-xs ml-1 opacity-75">
                              ({assignment.sectionName})
                            </span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {/* Database Class Teacher Assignments */}
                {teacherClassTeacherAssignments.length > 0 && (
                  <div className="col-span-2">
                    <p className={`${theme.subtextColor} text-sm mb-2`}>Class Teacher Assignments (Database)</p>
                    <div className="flex flex-wrap gap-2">
                      {teacherClassTeacherAssignments.map((assignment) => (
                        <span
                          key={assignment.id}
                          className="px-3 py-1 bg-purple-50 text-purple-700 rounded-lg text-sm"
                          title={`Academic Year: ${assignment.academicYear}`}
                        >
                          {assignment.className}
                          {assignment.sectionName && (
                            <span className="text-xs ml-1 opacity-75">
                              - {assignment.sectionName}
                            </span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {/* No assignments message */}
                {teacherSubjectAssignments.length === 0 && teacherClassTeacherAssignments.length === 0 && !loadingAssignments && (
                  <div className="col-span-2">
                    <p className={`${theme.subtextColor} text-sm italic`}>No assignments found in database</p>
                  </div>
                )}
                {loadingAssignments && (
                  <div className="col-span-2">
                    <p className={`${theme.subtextColor} text-sm`}>Loading assignments...</p>
                  </div>
                )}
              </div>
              
              <div className="mt-6 flex gap-3">
                <button 
                  onClick={() => {
                    setSelectedTeacher(null);
                    handleEditClick(teacher);
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Edit Teacher
                </button>
                <button
                  onClick={() => setSelectedTeacher(null)}
                  className={`flex-1 px-4 py-2 border ${theme.borderColor} rounded-lg hover:${theme.bgColorAlt} ${theme.textColor}`}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Edit Teacher Modal */}
      {showEditModal && editingTeacher && (
        <div className={`fixed inset-0 ${theme.modalOverlay} flex items-center justify-center p-4 z-50 overflow-y-auto`}>
          <div className={`${theme.modalBg} rounded-xl p-6 max-w-3xl w-full my-8 border ${theme.borderColor}`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className={theme.textColor}>Edit Teacher Information</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingTeacher(null);
                }}
                className={`${theme.subtextColor} hover:${theme.textColor}`}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Name */}
              <div>
                <label className={`${theme.subtextColor} mb-2 block`}>Full Name</label>
                <input
                  type="text"
                  value={editingTeacher.name}
                  onChange={(e) => setEditingTeacher({ ...editingTeacher, name: e.target.value })}
                  className={`w-full px-4 py-2 border ${theme.borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme.inputBg} ${theme.textColor}`}
                />
              </div>

              {/* Email and Phone */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`${theme.subtextColor} mb-2 block`}>Email</label>
                  <input
                    type="email"
                    value={editingTeacher.email}
                    onChange={(e) => setEditingTeacher({ ...editingTeacher, email: e.target.value })}
                    className={`w-full px-4 py-2 border ${theme.borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme.inputBg} ${theme.textColor}`}
                  />
                </div>
                <div>
                  <label className={`${theme.subtextColor} mb-2 block`}>Phone</label>
                  <input
                    type="tel"
                    value={editingTeacher.phone}
                    onChange={(e) => setEditingTeacher({ ...editingTeacher, phone: e.target.value })}
                    className={`w-full px-4 py-2 border ${theme.borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme.inputBg} ${theme.textColor}`}
                  />
                </div>
              </div>

              {/* Qualification and Experience */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`${theme.subtextColor} mb-2 block`}>Qualification</label>
                  <input
                    type="text"
                    value={editingTeacher.qualification}
                    onChange={(e) => setEditingTeacher({ ...editingTeacher, qualification: e.target.value })}
                    className={`w-full px-4 py-2 border ${theme.borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme.inputBg} ${theme.textColor}`}
                  />
                </div>
                <div>
                  <label className={`${theme.subtextColor} mb-2 block`}>Experience</label>
                  <input
                    type="text"
                    value={editingTeacher.experience}
                    onChange={(e) => setEditingTeacher({ ...editingTeacher, experience: e.target.value })}
                    className={`w-full px-4 py-2 border ${theme.borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme.inputBg} ${theme.textColor}`}
                  />
                </div>
              </div>

              {/* Join Date and Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`${theme.subtextColor} mb-2 block`}>Join Date</label>
                  <input
                    type="date"
                    value={editingTeacher.joinDate}
                    onChange={(e) => setEditingTeacher({ ...editingTeacher, joinDate: e.target.value })}
                    className={`w-full px-4 py-2 border ${theme.borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme.inputBg} ${theme.textColor}`}
                  />
                </div>
                <div>
                  <label className={`${theme.subtextColor} mb-2 block`}>Status</label>
                  <select
                    value={editingTeacher.status}
                    onChange={(e) => setEditingTeacher({ ...editingTeacher, status: e.target.value })}
                    className={`w-full px-4 py-2 border ${theme.borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme.inputBg} ${theme.textColor}`}
                  >
                    <option value="Active">Active</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Post and Role */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`${theme.subtextColor} mb-2 block`}>Post</label>
                  <input
                    type="text"
                    value={editingTeacher.post || ''}
                    onChange={(e) => setEditingTeacher({ ...editingTeacher, post: e.target.value })}
                    className={`w-full px-4 py-2 border ${theme.borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme.inputBg} ${theme.textColor}`}
                    placeholder="e.g., Senior Teacher, Assistant Teacher"
                  />
                </div>
                <div>
                  <label className={`${theme.subtextColor} mb-2 block`}>Role</label>
                  <input
                    type="text"
                    value={editingTeacher.role}
                    onChange={(e) => setEditingTeacher({ ...editingTeacher, role: e.target.value })}
                    className={`w-full px-4 py-2 border ${theme.borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme.inputBg} ${theme.textColor}`}
                  />
                </div>
              </div>

              {/* Class Teacher Assignment */}
              <div className={`border ${theme.borderColor} rounded-lg p-4`}>
                <label className="flex items-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    checked={editingTeacher.isClassTeacher || false}
                    onChange={(e) => setEditingTeacher({ 
                      ...editingTeacher, 
                      isClassTeacher: e.target.checked,
                      classTeacherOf: e.target.checked ? editingTeacher.classTeacherOf : undefined
                    })}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className={theme.textColor}>Is Class Teacher</span>
                </label>

                {editingTeacher.isClassTeacher && (
                  <div>
                    <label className={`${theme.subtextColor} text-sm mb-2 block`}>Class Teacher Of</label>
                    <select
                      value={editingTeacher.classTeacherOf || ''}
                      onChange={(e) => setEditingTeacher({ ...editingTeacher, classTeacherOf: e.target.value })}
                      className={`w-full px-4 py-2 border ${theme.borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme.inputBg} ${theme.textColor}`}
                    >
                      <option value="">Select a class</option>
                      {availableClasses.map((cls) => (
                        <option key={cls.id} value={cls.name}>
                          {cls.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Subject Assignments */}
              <div className={`border ${theme.borderColor} rounded-lg p-4`}>
                <div className="flex justify-between items-center mb-3">
                  <h3 className={`text-sm font-medium ${theme.textColor}`}>Subject Assignments</h3>
                  <button
                    type="button"
                    onClick={addEditingAssignmentRow}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" /> Add
                  </button>
                </div>
                <div className="space-y-3">
                  {editingAssignments.map((row, index) => (
                    <div key={index} className="flex gap-2">
                      <select
                        value={row.classId}
                        onChange={(e) => handleEditingAssignmentChange(index, 'classId', e.target.value ? Number(e.target.value) : '')}
                        className={`flex-1 px-3 py-2 border ${theme.borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme.inputBg} ${theme.textColor}`}
                      >
                        <option value="">Select Class</option>
                        {availableClasses.map((cls) => (
                          <option key={cls.id} value={cls.id}>
                            {cls.name}
                          </option>
                        ))}
                      </select>
                      <select
                        value={row.subjectId}
                        onChange={(e) => handleEditingAssignmentChange(index, 'subjectId', e.target.value ? Number(e.target.value) : '')}
                        disabled={!row.classId}
                        className={`flex-1 px-3 py-2 border ${theme.borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme.inputBg} ${theme.textColor} disabled:opacity-50`}
                      >
                        <option value="">{row.classId ? 'Select Subject' : 'Select Class First'}</option>
                        {availableSubjects
                          .filter(subj => !row.classId || subj.classId === row.classId)
                          .map((subj) => (
                          <option key={subj.id} value={subj.id}>
                            {subj.name}
                          </option>
                        ))}
                      </select>
                      {editingAssignments.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeEditingAssignmentRow(index)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSaveEdit}
                disabled={isSubmitting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Changes
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingTeacher(null);
                }}
                className={`flex-1 px-4 py-3 border ${theme.borderColor} rounded-lg hover:${theme.bgColorAlt} ${theme.textColor} transition-colors`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Teacher Modal */}
      {isAddDialogOpen && (
        <div className={`fixed inset-0 ${theme.modalOverlay} flex items-center justify-center p-4 z-50 overflow-y-auto`}>
          <div className={`${theme.modalBg} rounded-xl p-6 max-w-md w-full my-8 border ${theme.borderColor}`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className={`${theme.textColor} text-xl font-semibold`}>Add New Teacher</h2>
              <button
                onClick={() => {
                  setIsAddDialogOpen(false);
                  setFormData({
                    name: '',
                    email: '',
                    password: '',
                    phone: '',
                    address: '',
                    teacherId: '',
                    isClassTeacher: false,
                    classTeacherOf: '',
                  });
                }}
                className={`${theme.subtextColor} hover:${theme.textColor}`}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form 
              className="space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                const newErrors: Record<string, string | null> = {};
                if (!formData.name) newErrors.name = 'Name is required';
                if (!formData.email) newErrors.email = 'Email is required';
                const phoneError = validateNepalPhone(formData.phone);
                if (phoneError) newErrors.phone = phoneError;
                const pwError = validateStrongPassword(formData.password);
                if (pwError) newErrors.password = pwError;
                setErrors(newErrors);
                if (Object.values(newErrors).some(Boolean)) {
                  toast.error('Please fix the highlighted errors');
                  return;
                }

                setIsSubmitting(true);
                try {
                  const assignedClasses: string[] = [];
                  if (formData.isClassTeacher && formData.classTeacherOf) {
                    assignedClasses.push(formData.classTeacherOf);
                  }
                  subjectAssignments.forEach((row) => {
                    const cls = availableClasses.find((c) => c.id === row.classId);
                    const subj = availableSubjects.find((s) => s.id === row.subjectId);
                    if (cls && subj) {
                      const entry = `${subj.name} (${cls.name})`;
                      if (!assignedClasses.includes(entry)) {
                        assignedClasses.push(entry);
                      }
                    }
                  });

                  // Find Teacher role from available roles, default to first role if Teacher exists
                  const teacherRole = availableRoles.find(r => r.name.toLowerCase() === 'teacher') || availableRoles[0];
                  const defaultRoleId = teacherRole?.id;

                  const payload: any = {
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                    role: 'teacher' as const,
                    phone: formData.phone || undefined,
                    address: formData.address || undefined,
                    teacherId: formData.teacherId || undefined,
                    assignedClasses: assignedClasses.length ? assignedClasses : undefined,
                    roleIds: defaultRoleId ? [defaultRoleId] : undefined,
                  };

                  const created = await apiFetch<any>('/admin/users', {
                    method: 'POST',
                    body: JSON.stringify(payload),
                  });

                  // Reset form and update UI
                  setFormData({
                    name: '',
                    email: '',
                    password: '',
                    phone: '',
                    address: '',
                    teacherId: '',
                    isClassTeacher: false,
                    classTeacherOf: '',
                  });
                  setSubjectAssignments([{ classId: '', subjectId: '' }]);
                  setIsAddDialogOpen(false);
                  // Refresh teacher list from API to ensure consistency
                  loadTeachers().then(setTeachers);
                  toast.success('Teacher created successfully!');
                  adminData.refreshData();
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : 'Failed to create teacher');
                } finally {
                  setIsSubmitting(false);
                }
              }}
            >
              <div>
                <label htmlFor="teacher-name" className={`${theme.subtextColor} mb-2 block`}>Full Name *</label>
                <input
                  id="teacher-name"
                  type="text"
                  placeholder="Enter full name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-4 py-2 border ${theme.borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme.inputBg} ${theme.textColor}`}
                  required
                />
                {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
              </div>
              <div>
                <label htmlFor="teacher-email" className={`${theme.subtextColor} mb-2 block`}>Email *</label>
                <input
                  id="teacher-email"
                  type="email"
                  placeholder="Enter email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`w-full px-4 py-2 border ${theme.borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme.inputBg} ${theme.textColor}`}
                  required
                />
              </div>
              <div>
                <label htmlFor="teacher-password" className={`${theme.subtextColor} mb-2 block`}>Password *</label>
                <div className="relative">
                  <input
                    id="teacher-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min 8 chars, upper, lower, number, special"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className={`w-full px-4 py-2 pr-12 border ${theme.borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme.inputBg} ${theme.textColor}`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className={`absolute inset-y-0 right-0 px-3 flex items-center justify-center ${theme.subtextColor} hover:${theme.textColor} focus:outline-none`}
                    style={{ right: '1px', top: '1px', bottom: '1px' }} 
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
              </div>
              <div>
                <label htmlFor="teacher-phone" className={`${theme.subtextColor} mb-2 block`}>Phone</label>
                <input
                  id="teacher-phone"
                  type="tel"
                  placeholder="e.g., +97798..., 98..., 97..., 96..."
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className={`w-full px-4 py-2 border ${theme.borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme.inputBg} ${theme.textColor}`}
                />
                {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
              </div>
              <div>
                <label htmlFor="teacher-address" className={`${theme.subtextColor} mb-2 block`}>Address</label>
                <input
                  id="teacher-address"
                  type="text"
                  placeholder="Enter address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className={`w-full px-4 py-2 border ${theme.borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme.inputBg} ${theme.textColor}`}
                />
              </div>
              <div>
                <label htmlFor="teacher-teacherId" className={`${theme.subtextColor} mb-2 block`}>Teacher ID</label>
                <input
                  id="teacher-teacherId"
                  type="text"
                  placeholder="Enter teacher ID"
                  value={formData.teacherId}
                  onChange={(e) => {
                    setFormData({ ...formData, teacherId: e.target.value });
                    setTeacherIdStatus({ checkedValue: '', available: null, suggestions: [] });
                  }}
                  onBlur={(e) => checkTeacherIdAvailability(e.target.value)}
                  className={`w-full px-4 py-2 border ${theme.borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme.inputBg} ${theme.textColor}`}
                />
                {formData.teacherId && (
                  <p className="mt-1 text-xs">
                    {teacherIdChecking && <span className={theme.subtextColor}>Checking availability...</span>}
                    {!teacherIdChecking && teacherIdStatus.checkedValue === formData.teacherId && (
                      <>
                        {teacherIdStatus.available === true && (
                          <span className="text-green-600">ID is available</span>
                        )}
                        {teacherIdStatus.available === false && (
                          <span className="text-red-600">ID already taken</span>
                        )}
                      </>
                    )}
                  </p>
                )}
                {teacherIdStatus.available === false &&
                  teacherIdStatus.suggestions.length > 0 &&
                  teacherIdStatus.checkedValue === formData.teacherId && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      <span className={`text-xs ${theme.subtextColor} mr-1`}>Suggestions:</span>
                      {teacherIdStatus.suggestions.map((sug) => (
                        <button
                          key={sug}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, teacherId: sug });
                            checkTeacherIdAvailability(sug);
                          }}
                          className="px-2 py-1 rounded-full text-xs bg-blue-50 text-blue-700"
                        >
                          {sug}
                        </button>
                      ))}
                    </div>
                  )}
              </div>

              {/* Class Teacher toggle and class selection */}
              <div className={`border ${theme.borderColor} rounded-lg p-4`}>
                <label className="flex items-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    checked={formData.isClassTeacher}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        isClassTeacher: e.target.checked,
                      }))
                    }
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className={theme.textColor}>Is Class Teacher?</span>
                </label>
                {formData.isClassTeacher && (
                  <div>
                    <label className={`${theme.subtextColor} text-sm mb-2 block`}>Class</label>
                    <select
                      value={formData.classTeacherOf}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, classTeacherOf: e.target.value }))
                      }
                      className={`w-full px-4 py-2 border ${theme.borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme.inputBg} ${theme.textColor}`}
                    >
                      <option value="">Select a class</option>
                      {availableClasses.map((cls) => (
                        <option key={cls.id} value={cls.name}>
                          {cls.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Subject assignments */}
              <div>
                <label className={`${theme.subtextColor} mb-2 block`}>Subject Assignments</label>
                <p className={`text-xs ${theme.subtextColor} mb-2`}>
                  Select class and subject combinations. You can add multiple rows.
                </p>
                <div className="space-y-2">
                  {subjectAssignments.map((row, index) => (
                    <div key={index} className="grid grid-cols-2 gap-2">
                      <select
                        value={row.classId}
                        onChange={(e) =>
                          handleSubjectAssignmentChange(
                            index,
                            'classId',
                            e.target.value ? Number(e.target.value) : ''
                          )
                        }
                        className={`px-3 py-2 border ${theme.borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme.inputBg} ${theme.textColor}`}
                      >
                        <option value="">Select Class</option>
                        {availableClasses.map((cls) => (
                          <option key={cls.id} value={cls.id}>
                            {cls.name}
                          </option>
                        ))}
                      </select>
                      <div className="flex gap-2">
                        <select
                          value={row.subjectId}
                          onChange={(e) =>
                            handleSubjectAssignmentChange(
                              index,
                              'subjectId',
                              e.target.value ? Number(e.target.value) : ''
                            )
                          }
                          disabled={!row.classId}
                          className={`flex-1 px-3 py-2 border ${theme.borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme.inputBg} ${theme.textColor} disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          <option value="">{row.classId ? 'Select Subject' : 'Select Class First'}</option>
                          {availableSubjects
                            .filter(subj => !row.classId || subj.classId === row.classId)
                            .map((subj) => (
                            <option key={subj.id} value={subj.id}>
                              {subj.name}
                            </option>
                          ))}
                        </select>
                        {subjectAssignments.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSubjectAssignmentRow(index)}
                            className="px-2 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addSubjectAssignmentRow}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-700"
                >
                  + Add class–subject combination
                </button>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddDialogOpen(false);
                    setFormData({
                      name: '',
                      email: '',
                      password: '',
                      phone: '',
                      address: '',
                      teacherId: '',
                      isClassTeacher: false,
                      classTeacherOf: '',
                    });
                  }}
                  className={`flex-1 px-4 py-2 border ${theme.borderColor} rounded-lg hover:${theme.bgColorAlt} ${theme.textColor} transition-colors`}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Adding...' : 'Add Teacher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}