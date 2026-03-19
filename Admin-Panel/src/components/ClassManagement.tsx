import { useEffect, useState, useCallback, useMemo } from 'react';
import { Plus, Edit, Trash2, Layers3, X, Eye, Search, ChevronLeft, ChevronRight, Users, BookOpen, ArrowUpDown, ChevronDown } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { useThemeStyles } from './useThemeStyles';
import { useSchoolSettings } from './SchoolSettingsContext';
import { useAdminData } from './AdminDataContext';
import { toast } from 'sonner';

interface ClassSectionDto {
  id?: number;
  name: string;
}

interface SchoolClassDto {
  id: number;
  name: string;
  isActive: boolean;
  sections: ClassSectionDto[];
}

interface Student {
  id: number;
  name: string;
  class?: string | null;
  section?: string | null;
  rollNo: string;
  phone: string;
  email: string;
  status: string;
}

type SortOption = 'name_asc' | 'name_desc' | 'date_newest' | 'date_oldest';

export function ClassManagement() {
  const theme = useThemeStyles();
  const { t } = useSchoolSettings();
  const adminData = useAdminData();
  const [classes, setClasses] = useState<SchoolClassDto[]>([]);
  const [sortOption, setSortOption] = useState<SortOption>(() => 
    (localStorage.getItem('classSortOption') as SortOption) || 'name_asc'
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<SchoolClassDto | null>(null);
  const [formName, setFormName] = useState('');
  const [formSections, setFormSections] = useState<ClassSectionDto[]>([{ name: 'A' }]);
  const [viewingClass, setViewingClass] = useState<{ className: string; section?: string } | null>(null);
  const [classStudents, setClassStudents] = useState<Student[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [classSearchQuery, setClassSearchQuery] = useState('');
  const [expandedClasses, setExpandedClasses] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const studentsPerPage = 10;

  const loadClasses = () => {
    setIsLoading(true);
    setError(null);
    apiFetch<SchoolClassDto[]>('/admin/classes')
      .then(setClasses)
      .catch((err) => setError(err.message ?? 'Failed to load classes'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    localStorage.setItem('classSortOption', sortOption);
  }, [sortOption]);

  const filteredClasses = useMemo(() => {
    const normalizedClassQuery = classSearchQuery.toLowerCase();
    const base = classes.filter((c) =>
      String(c?.name ?? '').toLowerCase().includes(normalizedClassQuery),
    );
    return base.sort((a, b) => {
      switch (sortOption) {
        case 'name_asc': return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
        case 'name_desc': return b.name.localeCompare(a.name, undefined, { numeric: true, sensitivity: 'base' });
        case 'date_newest': return b.id - a.id;
        case 'date_oldest': return a.id - b.id;
        default: return 0;
      }
    });
  }, [classes, classSearchQuery, sortOption]);

  const toggleClass = (id: number) => {
    setExpandedClasses(prev =>
      prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]
    );
  };

  const resetForm = () => {
    setEditingClass(null);
    setFormName('');
    setFormSections([{ name: 'A' }]);
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (cls: SchoolClassDto) => {
    setEditingClass(cls);
    setFormName(cls.name);
    setFormSections(
      cls.sections.length > 0 ? cls.sections.map((s) => ({ id: s.id, name: s.name })) : [{ name: 'A' }]
    );
    setIsModalOpen(true);
  };

  const handleAddSectionRow = () => {
    setFormSections((prev) => [...prev, { name: '' }]);
  };

  const handleSectionChange = (index: number, value: string) => {
    setFormSections((prev) =>
      prev.map((section, i) => (i === index ? { ...section, name: value } : section))
    );
  };

  const handleRemoveSectionRow = (index: number) => {
    setFormSections((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error('Class name is required');
      return;
    }

    const sectionsPayload = formSections
      .map((s) => ({ id: s.id, name: s.name.trim() }))
      .filter((s) => s.name.length > 0);

    try {
      const payload: any = {
        name: formName.trim(),
        sections: sectionsPayload,
      };

      if (editingClass) {
        const updated = await apiFetch<SchoolClassDto>(`/admin/classes/${editingClass.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        setClasses((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        toast.success('Class updated successfully');
      } else {
        const created = await apiFetch<SchoolClassDto>('/admin/classes', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setClasses((prev) => [...prev, created]);
        toast.success('Class created successfully');
      }

      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save class');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('confirmDelete'))) return;
    try {
      await apiFetch(`/admin/classes/${id}`, { method: 'DELETE' });
      setClasses((prev) => prev.filter((c) => c.id !== id));
      toast.success('Class deleted successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete class');
    }
  };

  const handleViewStudents = async (className: string, section?: string) => {
    setViewingClass({ className, section });
    setStudentsLoading(true);
    setSearchQuery('');
    setCurrentPage(1);
    try {
      const allStudents = await apiFetch<Student[]>('/admin/users?role=student');
      // Filter strictly by class and section
      const filtered = allStudents.filter(s => {
        const matchesClass = s.class === className;
        const matchesSection = section ? s.section === section : true;
        return matchesClass && matchesSection;
      });
      setClassStudents(filtered);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load students');
      setClassStudents([]);
    } finally {
      setStudentsLoading(false);
    }
  };

  const filteredStudents = classStudents.filter((s) => {
    const normalizedQuery = searchQuery.toLowerCase();
    const studentName = String(s?.name ?? '').toLowerCase();
    const studentRoll = String(s?.rollNo ?? '').toLowerCase();
    const studentEmail = String(s?.email ?? '').toLowerCase();

    return (
      studentName.includes(normalizedQuery) ||
      studentRoll.includes(normalizedQuery) ||
      studentEmail.includes(normalizedQuery)
    );
  });

  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * studentsPerPage,
    currentPage * studentsPerPage
  );

  return (
    <>
      <div className="mb-6 sm:mb-8">
        <h1 className={`${theme.textColor} mb-2 text-2xl sm:text-3xl font-bold`}>{t('classes') ?? 'Classes'}</h1>
        <p className={theme.subtextColor}>
          {t('manageSchoolInfo') ?? 'Create and manage reusable classes and sections'}
        </p>
      </div>

      <div className={`${theme.cardBg} rounded-xl p-4 sm:p-6 shadow-sm border ${theme.borderColor} mb-4 sm:mb-6`}>
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search classes..."
              value={classSearchQuery}
              onChange={(e) => setClassSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300 text-sm sm:text-base"
            />
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <div className="relative min-w-[180px]">
              <ArrowUpDown className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
                className={`w-full pl-10 pr-8 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer ${theme.bgColor} ${theme.borderColor} ${theme.textColor}`}
              >
                <option value="name_asc">Name (A-Z)</option>
                <option value="name_desc">Name (Z-A)</option>
                <option value="date_newest">Newest First</option>
                <option value="date_oldest">Oldest First</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            <button
              onClick={openCreateModal}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-white text-sm sm:text-base whitespace-nowrap"
              style={{ backgroundColor: theme.primaryColor }}
            >
              <Plus className="w-4 h-4" />
              <span>{t('addClass') ?? 'Add Class'}</span>
            </button>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-10">
          <p className={theme.subtextColor}>{t('loading')}</p>
        </div>
      )}

      {error && !isLoading && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 text-red-700 border border-red-200 text-sm">
          {error}
        </div>
      )}

      {!isLoading && !error && (
        <div className="space-y-3 sm:space-y-4">
          {filteredClasses.map((cls) => {
            const isExpanded = expandedClasses.includes(cls.id);
            return (
              <div
                key={cls.id}
                className={`${theme.cardBg} rounded-xl border transition-all duration-200 ${
                  isExpanded ? 'border-blue-200 shadow-md' : `${theme.borderColor} shadow-sm hover:border-blue-200`
                }`}
              >
                <div
                  className="p-4 sm:p-5 flex items-center justify-between cursor-pointer"
                  onClick={() => toggleClass(cls.id)}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                        isExpanded ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      <Layers3 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className={`${theme.textColor} font-semibold text-lg`}>{cls.name}</h3>
                      <p className={`${theme.subtextColor} text-sm`}>
                        {cls.sections.length} section{cls.sections.length === 1 ? '' : 's'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewStudents(cls.name);
                      }}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="View Students"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(cls);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit Class"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(cls.id);
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Class"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {isExpanded && cls.sections.length > 0 && (
                  <div className="px-4 sm:px-5 pb-4">
                    <p className={`${theme.subtextColor} text-sm mb-2`}>Sections</p>
                    <div className="flex flex-wrap gap-2">
                      {cls.sections.map((section) => (
                        <button
                          key={section.id ?? section.name}
                          onClick={() => handleViewStudents(cls.name, section.name)}
                          className="px-3 py-1 rounded-full text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer"
                          title={`View students in ${cls.name} - ${section.name}`}
                        >
                          {section.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {filteredClasses.length === 0 && (
            <div className="col-span-full">
              <div
                className={`${theme.bgColor} rounded-xl p-6 border-dashed border-2 ${theme.borderColor} text-center`}
              >
                <p className={theme.subtextColor}>{t('noDataFound')}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* View Students Modal - Enhanced with better filtering */}
      {viewingClass && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl w-full max-w-4xl mx-auto my-4 sm:my-8 max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: theme.primaryColor + '20', color: theme.primaryColor }}
                >
                  <Users className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <h2 className="text-gray-900 text-lg sm:text-xl font-semibold">
                    {viewingClass.className}
                    {viewingClass.section && (
                      <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-sm rounded-full">
                        Section {viewingClass.section}
                      </span>
                    )}
                  </h2>
                  <p className="text-gray-500 text-xs sm:text-sm">
                    {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''} enrolled
                    {viewingClass.section ? ` in Section ${viewingClass.section}` : ''}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingClass(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="p-4 sm:px-6 sm:py-4 border-b border-gray-100 flex-shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, roll number, or email..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base transition-all"
                />
              </div>
            </div>

            {/* Students Content */}
            <div className="flex-1 overflow-y-auto">
              {studentsLoading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                  <p className="text-gray-600">Loading students...</p>
                </div>
              ) : paginatedStudents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Users className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600 text-center font-medium mb-1">No students found</p>
                  <p className="text-gray-500 text-sm text-center">
                    {searchQuery 
                      ? 'Try adjusting your search criteria' 
                      : `No students are assigned to ${viewingClass.className}${viewingClass.section ? ` - Section ${viewingClass.section}` : ''}`
                    }
                  </p>
                </div>
              ) : (
                <>
                  {/* Desktop Table View */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                        <tr>
                          <th className="px-4 py-3 text-left text-gray-700 font-semibold">Roll No</th>
                          <th className="px-4 py-3 text-left text-gray-700 font-semibold">Name</th>
                          <th className="px-4 py-3 text-left text-gray-700 font-semibold">Section</th>
                          <th className="px-4 py-3 text-left text-gray-700 font-semibold">Email</th>
                          <th className="px-4 py-3 text-left text-gray-700 font-semibold">Phone</th>
                          <th className="px-4 py-3 text-left text-gray-700 font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {paginatedStudents.map((student) => (
                          <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 text-gray-900 font-medium">{student.rollNo}</td>
                            <td className="px-4 py-3 text-gray-900">{student.name}</td>
                            <td className="px-4 py-3">
                              {student.section ? (
                                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full">
                                  {student.section}
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-gray-700 break-all">{student.email}</td>
                            <td className="px-4 py-3 text-gray-700">{student.phone || '-'}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                student.status === 'Active'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}>
                                {student.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card View */}
                  <div className="sm:hidden p-4 space-y-3">
                    {paginatedStudents.map((student) => (
                      <div key={student.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="text-gray-900 font-medium">{student.name}</h4>
                            <p className="text-gray-500 text-sm">{student.email}</p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            student.status === 'Active'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {student.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-gray-500">Roll No:</span>
                            <span className="ml-1 text-gray-900 font-medium">{student.rollNo}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Section:</span>
                            <span className="ml-1 text-gray-900">{student.section || '-'}</span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-gray-500">Phone:</span>
                            <span className="ml-1 text-gray-900">{student.phone || '-'}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Pagination Footer */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 sm:px-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
                <p className="text-xs sm:text-sm text-gray-600">
                  Showing {(currentPage - 1) * studentsPerPage + 1} to {Math.min(currentPage * studentsPerPage, filteredStudents.length)} of {filteredStudents.length} students
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs sm:text-sm text-gray-700 px-2">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Close Button Footer (when no pagination) */}
            {totalPages <= 1 && paginatedStudents.length > 0 && (
              <div className="p-4 sm:px-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
                <p className="text-xs sm:text-sm text-gray-600 text-center">
                  Showing {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add/Edit Class Modal - Fully Responsive */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl w-full max-w-lg mx-auto my-4 sm:my-8 max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header - Fixed */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: theme.primaryColor + '20', color: theme.primaryColor }}
                >
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-gray-900 text-lg sm:text-xl font-semibold">
                    {editingClass ? 'Edit Class' : 'Add New Class'}
                  </h2>
                  <p className="text-gray-500 text-xs sm:text-sm hidden sm:block">
                    {editingClass ? 'Update class details and sections' : 'Create a new class with sections'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <form id="class-form" className="space-y-5" onSubmit={handleSubmit}>
                {/* Class Name Field */}
                <div>
                  <label className="text-gray-700 mb-2 block text-sm sm:text-base font-medium">
                    Class Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="e.g., Grade 10, Class 9A"
                    required
                    autoFocus
                  />
                  <p className="mt-1.5 text-xs text-gray-500">
                    Enter a unique name for this class
                  </p>
                </div>

                {/* Sections Field */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-gray-700 text-sm sm:text-base font-medium">
                      Sections
                    </label>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {formSections.length} section{formSections.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  
                  <div className="space-y-2 sm:space-y-3">
                    {formSections.map((section, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center text-xs sm:text-sm font-medium">
                          {index + 1}
                        </div>
                        <input
                          type="text"
                          value={section.name}
                          onChange={(e) => handleSectionChange(index, e.target.value)}
                          className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder={`Section ${String.fromCharCode(65 + index)}`}
                        />
                        {formSections.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSectionRow(index)}
                            className="p-2.5 sm:p-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                            aria-label="Remove section"
                          >
                            <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <button
                    type="button"
                    onClick={handleAddSectionRow}
                    className="mt-3 w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 text-sm sm:text-base text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors font-medium border border-dashed border-blue-300"
                  >
                    <Plus className="w-4 h-4" />
                    Add Section
                  </button>
                </div>
              </form>
            </div>

            {/* Modal Footer - Fixed */}
            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 p-4 sm:p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
                className="flex-1 px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                form="class-form"
                className="flex-1 px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
              >
                {editingClass ? t('saveChanges') : t('save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
