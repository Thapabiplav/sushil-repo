import { useEffect, useState, useMemo } from 'react';
import { Plus, Trash2, Search, ChevronDown, BookOpen, Loader2, Save, X, ArrowUpDown } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { toast } from 'sonner';
import { useSchoolSettings } from './SchoolSettingsContext';

interface SchoolClassDto {
  id: number;
  name: string;
}

interface SubjectDto {
  id: number;
  name: string;
  classId: number;
  isActive: boolean;
  class?: SchoolClassDto;
}

type SortOption = 'name_asc' | 'name_desc' | 'date_newest' | 'date_oldest';

export function SubjectManagement() {
  const { t } = useSchoolSettings();
  const [subjects, setSubjects] = useState<SubjectDto[]>([]);
  const [classes, setClasses] = useState<SchoolClassDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>(() => 
    (localStorage.getItem('subjectSortOption') as SortOption) || 'name_asc'
  );
  
  // UI States
  const [expandedClasses, setExpandedClasses] = useState<number[]>([]);
  const [addingSubjectTo, setAddingSubjectTo] = useState<number | null>(null);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [classesData, subjectsData] = await Promise.all([
        apiFetch<SchoolClassDto[]>('/admin/classes'),
        apiFetch<SubjectDto[]>('/admin/subjects'),
      ]);
      setClasses(classesData);
      setSubjects(subjectsData);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    localStorage.setItem('subjectSortOption', sortOption);
  }, [sortOption]);

  const toggleClass = (classId: number) => {
    setExpandedClasses(prev => 
      prev.includes(classId) 
        ? prev.filter(id => id !== classId)
        : [...prev, classId]
    );
  };

  const subjectsByClass = useMemo(() => {
    const map = new Map<number, SubjectDto[]>();
    subjects.forEach(s => {
      if (!map.has(s.classId)) map.set(s.classId, []);
      map.get(s.classId)?.push(s);
    });

    // Sort subjects within each class
    map.forEach((list) => {
      list.sort((a, b) => {
        switch (sortOption) {
            case 'name_asc': return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
            case 'name_desc': return b.name.localeCompare(a.name, undefined, { numeric: true, sensitivity: 'base' });
            case 'date_newest': return b.id - a.id;
            case 'date_oldest': return a.id - b.id;
            default: return 0;
        }
      });
    });

    return map;
  }, [subjects, sortOption]);

  const handleAddSubject = async (classId: number) => {
    if (!newSubjectName.trim()) {
      toast.error('Subject name is required');
      return;
    }

    // Check for duplicates in the same class
    const existingSubject = subjects.find(
      s => s.classId === classId && s.name.toLowerCase() === newSubjectName.trim().toLowerCase()
    );

    if (existingSubject) {
      toast.error(`Subject '${newSubjectName}' already exists in this class`);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await apiFetch<{ created: SubjectDto[], errors: string[] }>('/admin/subjects', {
        method: 'POST',
        body: JSON.stringify({ names: [newSubjectName.trim()], classId }),
      });

      if (result.created && result.created.length > 0) {
        setSubjects(prev => [...prev, ...result.created]);
        toast.success('Subject added successfully');
        setNewSubjectName('');
        // Keep the input open for adding more
      }

      if (result.errors && result.errors.length > 0) {
        result.errors.forEach(err => toast.error(err));
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to add subject');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSubject = async (subjectId: number) => {
    if (!confirm('Are you sure you want to delete this subject?')) return;
    try {
      await apiFetch(`/admin/subjects/${subjectId}`, { method: 'DELETE' });
      setSubjects(prev => prev.filter(s => s.id !== subjectId));
      toast.success('Subject deleted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete subject');
    }
  };

  const filteredClasses = useMemo(() => {
    const result = classes.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      subjects.some(s => s.classId === c.id && s.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return result.sort((a, b) => {
      switch (sortOption) {
        case 'name_asc': return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
        case 'name_desc': return b.name.localeCompare(a.name, undefined, { numeric: true, sensitivity: 'base' });
        case 'date_newest': return b.id - a.id;
        case 'date_oldest': return a.id - b.id;
        default: return 0;
      }
    });
  }, [classes, subjects, searchQuery, sortOption]);

  return (
    <>
      <div className="mb-6 sm:mb-8">
        <h1 className="text-gray-900 mb-2 text-2xl font-bold">Subject Management</h1>
        <p className="text-gray-600">Manage subjects class-wise</p>
      </div>

      <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search classes or subjects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="relative min-w-[200px]">
            <ArrowUpDown className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className="w-full pl-10 pr-8 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white cursor-pointer"
            >
              <option value="name_asc">Name (A-Z)</option>
              <option value="name_desc">Name (Z-A)</option>
              <option value="date_newest">Newest First</option>
              <option value="date_oldest">Oldest First</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : filteredClasses.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No classes found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredClasses.map((cls) => {
            const classSubjects = subjectsByClass.get(cls.id) || [];
            const isExpanded = expandedClasses.includes(cls.id);
            const isAdding = addingSubjectTo === cls.id;

            return (
              <div
                key={cls.id}
                className={`bg-white rounded-xl border transition-all duration-200 ${
                  isExpanded ? 'border-blue-200 shadow-md' : 'border-gray-200 shadow-sm hover:border-blue-200'
                }`}
              >
                {/* Class Header */}
                <div 
                  className="p-4 flex items-center justify-between cursor-pointer"
                  onClick={() => toggleClass(cls.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                      isExpanded ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'
                    }`}>
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">{cls.name}</h3>
                      <p className="text-sm text-gray-500">
                        {classSubjects.length} Subject{classSubjects.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  </div>
                </div>

                {/* Expanded Section */}
                {isExpanded && (
                  <div className="px-4 pb-4 sm:px-16 sm:pb-6 animate-in slide-in-from-top-2 duration-200">
                    <div className="space-y-2">
                      {classSubjects.length > 0 && (
                        <div className="grid gap-2">
                          {classSubjects.map((subject, index) => (
                            <div 
                              key={subject.id}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg group hover:bg-gray-100 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <span className="w-6 h-6 flex items-center justify-center bg-white text-xs font-medium text-gray-500 rounded-full border border-gray-200">
                                  {index + 1}
                                </span>
                                <span className="font-medium text-gray-700">{subject.name}</span>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteSubject(subject.id);
                                }}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                title="Delete Subject"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add Subject Section */}
                      {isAdding ? (
                        <div className="mt-3 flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200">
                          <input
                            type="text"
                            value={newSubjectName}
                            onChange={(e) => setNewSubjectName(e.target.value)}
                            placeholder="Enter subject name..."
                            className="flex-1 px-4 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-50/50"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleAddSubject(cls.id);
                              if (e.key === 'Escape') {
                                setAddingSubjectTo(null);
                                setNewSubjectName('');
                              }
                            }}
                          />
                          <button
                            onClick={() => handleAddSubject(cls.id)}
                            disabled={isSubmitting || !newSubjectName.trim()}
                            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {isSubmitting ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              <Save className="w-5 h-5" />
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setAddingSubjectTo(null);
                              setNewSubjectName('');
                            }}
                            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setAddingSubjectTo(cls.id)}
                          className="mt-3 flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          Add Subject
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
