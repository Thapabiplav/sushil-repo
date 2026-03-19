import { useEffect, useRef, useState } from 'react';
import { Search, Filter, Plus, Download, Edit, Trash2, Eye, Upload, User, X, EyeOff, ChevronDown } from 'lucide-react';
import { useSchoolSettings } from './SchoolSettingsContext';
import { useThemeStyles } from './useThemeStyles';
import { useAdminData } from './AdminDataContext';
import { apiFetch, API_BASE_URL } from '../lib/api';
import { toast } from 'sonner';
import { validateNepalPhone, validateStrongPassword } from '../lib/validation';
import * as XLSX from 'xlsx';

interface Student {
  id: number;
  name: string;
  class?: string | null;
  section?: string | null;
  rollNo: string;
  phone: string;
  email: string;
  guardian: string;
  address: string;
  status: string;
  photo?: string;
  dateOfBirth?: string;
  admissionDate?: string;
}

interface ClassWithSections {
  id: number;
  name: string;
  sections: { id: number; name: string }[];
}

export function StudentManagement() {
  const { t } = useSchoolSettings();
  const theme = useThemeStyles();
  const adminData = useAdminData();
  
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedSection, setSelectedSection] = useState('all');
  const [searchName, setSearchName] = useState('');
  const [searchRoll, setSearchRoll] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importClass, setImportClass] = useState('');
  const [importSection, setImportSection] = useState('');
  const [students, setStudents] = useState<Student[]>(() => {
    try {
      return (adminData?.students as Student[]) || [];
    } catch {
      return [];
    }
  });
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [classesWithSections, setClassesWithSections] = useState<ClassWithSections[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [previewStudents, setPreviewStudents] = useState<any[]>([]);
  const [importSummary, setImportSummary] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    class: '',
    section: '',
    rollNumber: '',
  });
  const [pendingPhoto, setPendingPhoto] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const importFileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    try {
      if (adminData?.students && Array.isArray(adminData.students)) {
        // Map adminData students to Student interface format
        const mappedStudents: Student[] = adminData.students.map((s: any) => ({
          id: s.id,
          name: s.name,
          class: s.class || null,
          section: s.section || null,
          rollNo: s.rollNo || s.rollNumber || '',
          phone: s.phone || '',
          email: s.email || '',
          guardian: s.guardian || 'Parent/Guardian',
          address: s.address || '',
          status: s.status || 'Active',
          photo: s.photo || null,
          dateOfBirth: s.dateOfBirth || null,
          admissionDate: s.admissionDate || null,
        }));
        setStudents(mappedStudents);
      } else {
        setStudents([]);
      }
    } catch (error) {
      console.error('Error loading students:', error);
      setStudents([]);
    }
  }, [adminData?.students]);

  useEffect(() => {
    apiFetch<ClassWithSections[]>('/admin/classes')
      .then(setClassesWithSections)
      .catch(() => {
        // fallback to classes from students if API fails
        const derived = Array.from(new Set(students.map((s) => s.class ?? 'Unknown'))).filter(
          (c) => c !== 'Unknown'
        );
        setClassesWithSections(derived.map(name => ({ id: 0, name, sections: [] })));
      });
  }, []);

  const availableClasses = (classesWithSections || []).map(c => c.name);
  const classes = ['all', ...availableClasses];
  
  const selectedClassData = (classesWithSections || []).find(c => c.name === selectedClass);
  const availableSections = selectedClassData?.sections.map(s => s.name) || [];
  const sections = ['all', ...availableSections];

  // Photo upload handler
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, studentId?: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Photo file size should be less than 5MB');
      return;
    }

    setIsUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'sushil-school/students');

      const response = await fetch(`${API_BASE_URL}/admin/upload-file`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.message || 'Failed to upload photo');
      }

      const data = await response.json();
      
      if (studentId) {
        // Update student photo via API
        await apiFetch(`/admin/users/${studentId}`, {
          method: 'PUT',
          body: JSON.stringify({ image: data.url }),
        });
        
        // Update local state
        setStudents(prev => prev.map(s => 
          s.id === studentId ? { ...s, photo: data.url } : s
        ));
        
        // Update selected student if viewing details
        if (selectedStudent === studentId) {
          const student = students.find(s => s.id === studentId);
          if (student) {
            setStudents(prev => prev.map(s => 
              s.id === studentId ? { ...s, photo: data.url } : s
            ));
          }
        }
        
        toast.success('Photo uploaded successfully');
      } else {
        // Just set pending photo for new student
        setPendingPhoto(data.url);
        toast.success('Photo uploaded successfully');
      }
    } catch (err) {
      console.error('Photo upload error:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to upload photo');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = () => {
    setPendingPhoto(null);
  };

  const filteredStudents = (students || []).filter(student => {
    const studentClass = student.class ?? '';
    const studentSection = student.section ?? '';
    const matchesClass = selectedClass === 'all' || studentClass === selectedClass;
    const matchesSection = selectedSection === 'all' || studentSection === selectedSection;
    const matchesName =
      !searchName ||
      student.name.toLowerCase().includes(searchName.toLowerCase());
    const matchesRoll =
      !searchRoll || (student.rollNo ?? '').toLowerCase().includes(searchRoll.toLowerCase());
    return matchesClass && matchesSection && matchesName && matchesRoll;
  });

  const handleDeleteStudent = async (id: number) => {
    if (!confirm('Are you sure you want to delete this student?')) return;
    
    try {
      await apiFetch(`/admin/users/${id}`, {
        method: 'DELETE',
      });
      toast.success('Student deleted successfully!');
      setStudents((prev) => prev.filter((s) => s.id !== id));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete student');
    }
  };

  const handleEditClick = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      email: student.email,
      password: '', // Don't pre-fill password
      phone: student.phone,
      address: student.address,
      class: student.class || '',
      section: student.section || '',
      rollNumber: student.rollNo,
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingStudent) return;
    const newErrors: Record<string, string | null> = {};
    if (!formData.name) {
      newErrors.name = 'Name is required';
    }
    if (!formData.email) {
      newErrors.email = 'Email is required';
    }

    // Validate Student ID (unique per class+section)
    if (!formData.rollNumber) {
      newErrors.rollNumber = 'Student ID is required';
    } else if (formData.rollNumber !== editingStudent.rollNo) {
      const duplicateInClass = students.some(
        s => s.id !== editingStudent.id &&
          s.rollNo === formData.rollNumber &&
          (s.class ?? '') === (formData.class ?? '') &&
          (s.section ?? '') === (formData.section ?? '')
      );
      if (duplicateInClass) {
        newErrors.rollNumber = 'Student ID already exists in this class/section';
      }
    }

    const phoneError = validateNepalPhone(formData.phone);
    if (phoneError) newErrors.phone = phoneError;
    if (formData.password) {
      const pwError = validateStrongPassword(formData.password);
      if (pwError) newErrors.password = pwError;
    }
    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) {
      toast.error('Please fix the highlighted errors');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        address: formData.address || undefined,
        class: formData.class || undefined,
        section: formData.section || undefined,
        rollNumber: formData.rollNumber || undefined,
      };

      // Only include password if it's been changed
      if (formData.password) {
        payload.password = formData.password;
      }

      // Include photo if uploaded
      if (pendingPhoto) {
        payload.image = pendingPhoto;
      }

      const updated = await apiFetch<Student>(`/admin/users/${editingStudent.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      toast.success('Student updated successfully!');
      setStudents((prev) =>
        prev.map((s) =>
          s.id === editingStudent.id
            ? {
                ...s,
                name: updated.name,
                email: updated.email,
                phone: updated.phone ?? '',
                address: updated.address ?? '',
                class: updated.class ?? s.class,
                section: updated.section ?? s.section,
                rollNo: updated.rollNo ?? s.rollNo,
              }
            : s
        )
      );
      setShowEditModal(false);
      setEditingStudent(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update student');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadTemplate = () => {
    if (!importClass) {
      toast.error('Please select a class first');
      return;
    }

    const headers = [
      'Full Name',
      'Roll Number',
      'Email',
      'Phone',
      'Address',
      'Guardian Name',
      'Password',
      'Section'
    ];
    
    // Create sample data row
    const sampleData = [
      {
        'Full Name': 'John Doe',
        'Roll Number': '101',
        'Email': 'john@example.com',
        'Phone': '9800000000',
        'Address': 'Kathmandu',
        'Guardian Name': 'Jane Doe',
        'Password': 'Password@123',
        'Section': importSection || 'A'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData, { header: headers });
    
    // Set column widths
    const wscols = [
      { wch: 20 }, // Full Name
      { wch: 15 }, // Roll Number
      { wch: 25 }, // Email
      { wch: 15 }, // Phone
      { wch: 20 }, // Address
      { wch: 20 }, // Guardian Name
      { wch: 15 }, // Password
      { wch: 10 }, // Section
    ];
    ws['!cols'] = wscols;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, `Student_Import_Template_${importClass}.xlsx`);
    toast.success('Template downloaded successfully!');
  };


  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file extension
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
      toast.error('Please upload a valid Excel file (.xlsx or .xls)');
      e.target.value = ''; // Reset file input
      return;
    }

    if (!importClass) {
      toast.error('Please select a class first');
      e.target.value = ''; // Reset file input
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[firstSheetName];
        const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        if (rows.length === 0) {
          toast.error('Excel file is empty');
          return;
        }

        const parsedStudents: any[] = [];
        const errors: string[] = [];

        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          const rowNumber = i + 2; // Excel row number (accounting for header)

          // Map columns with multiple possible names (case-insensitive)
          const name: string = (
            row.Name || row.name || row.FullName || row.fullName || 
            row['Full Name'] || row['full name'] || row.StudentName || row.studentName || ''
          ).toString().trim();
          
          const rollNo: string = (
            row['Roll No'] || row.rollNo || row.roll || row['Roll Number'] || 
            row.rollNumber || row.RollNo || row['roll no'] || ''
          ).toString().trim();
          
          const studentId: string = (
            row.StudentId || row.studentId || row['Student ID'] || 
            row['student id'] || row.ID || row.id || rollNo
          ).toString().trim();
          
          const phone: string = (
            row.Phone || row.phone || row.Mobile || row.mobile || 
            row.Contact || row.contact || ''
          ).toString().trim();
          
          const email: string = (
            row.Email || row.email || row['E-mail'] || row['e-mail'] || ''
          ).toString().trim();
          
          const guardian: string = (
            row.Guardian || row.guardian || row['Guardian Name'] || 
            row['guardian name'] || row.Parent || row.parent || 
            row['Parent Name'] || row['parent name'] || ''
          ).toString().trim();
          
          const address: string = (
            row.Address || row.address || row.Location || row.location || ''
          ).toString().trim();
          
          const password: string = (
            row.Password || row.password || row.Pass || row.pass || ''
          ).toString().trim();
          
          const section: string = (
            row.Section || row.section || row.Sec || row.sec || ''
          ).toString().trim();

          // Effective section for this row: from Excel or the selected import section (so same roll in different sections is allowed)
          const effectiveSection = (section || importSection || '').trim();
          const effectiveSectionNorm = effectiveSection.toLowerCase();

          // Basic validation
          if (!name) {
            errors.push(`Row ${rowNumber}: Name is required`);
          } else if (!rollNo && !studentId) {
            errors.push(`Row ${rowNumber}: Student ID is required`);
          }

          const finalRollNo = rollNo || studentId;

          // Duplicate = same roll in the SAME class AND SAME section only (roll 1 in Section A is different from roll 1 in Section B)
          let isDuplicate = false;
          if (finalRollNo) {
            try {
              const existingList = Array.isArray(students) ? students : [];
              const existingSectionNorm = (s: { section?: string | null }) => String(s?.section ?? '').trim().toLowerCase();
              const classNorm = String(importClass ?? '').trim();
              const alreadyInDb = existingList.some(
                (s) =>
                  String(s.rollNo) === String(finalRollNo) &&
                  String(s.class ?? '').trim() === classNorm &&
                  existingSectionNorm(s) === effectiveSectionNorm
              );
              if (alreadyInDb) {
                errors.push(`Row ${rowNumber}: Student ID ${finalRollNo} already exists in ${importClass}${effectiveSection ? ` Section ${effectiveSection}` : ''}`);
                isDuplicate = true;
              } else {
                const duplicateInFile = parsedStudents.some(
                  (s) =>
                    String(s.rollNumber) === String(finalRollNo) &&
                    String(s.section || importSection || '').trim().toLowerCase() === effectiveSectionNorm
                );
                if (duplicateInFile) {
                  errors.push(`Row ${rowNumber}: Student ID ${finalRollNo} is duplicated in file (same class/section)`);
                  isDuplicate = true;
                }
              }
            } catch (err) {
              console.warn('Duplicate check error for row', rowNumber, err);
              // On any error in duplicate check, allow the row so we don't block the whole import
            }
          }

          if (!isDuplicate) {
            parsedStudents.push({
              name,
              rollNumber: finalRollNo,
              email,
              phone,
              guardian,
              address,
              password,
              section,
              rowNumber,
              status: 'Pending'
            });
          }
        }

        setPreviewStudents(parsedStudents);
        setImportSummary(null); // Reset summary
        
        if (errors.length > 0) {
          toast.warning(`Found ${errors.length} issues in the file. Please review.`);
        } else {
          toast.success(`Loaded ${parsedStudents.length} students. Please review and save.`);
        }

        // Reset file input
        e.target.value = '';
      } catch (error) {
        console.error('Import error:', error);
        toast.error('Error reading Excel file.');
        e.target.value = ''; // Reset file input
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleSaveImport = async () => {
    if (previewStudents.length === 0) {
      toast.error('No students to save');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        class: importClass,
        section: importSection,
        students: previewStudents.map(s => ({
          name: s.name,
          rollNumber: s.rollNumber,
          email: s.email,
          phone: s.phone,
          address: s.address,
          guardian: s.guardian,
          password: s.password,
          section: s.section || importSection
        }))
      };

      const result = await apiFetch<any>('/admin/students/bulk-import', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (result.success) {
        setImportSummary(result.summary);
        setStudents((prev) => [...prev, ...result.created]);
        setPreviewStudents([]); // Clear preview
        toast.success(`Successfully imported ${result.summary.successful} students!`);
        
        if (result.errors && result.errors.length > 0) {
           // Show some errors
           result.errors.slice(0, 5).forEach((err: any) => {
             toast.error(`Row ${err.row}: ${err.error}`);
           });
           if (result.errors.length > 5) {
             toast.warning(`...and ${result.errors.length - 5} more errors.`);
           }
        }
      } else {
        toast.error('Import failed. Please check the errors.');
      }
    } catch (error) {
      console.error('Bulk import error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to import students');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExport = async (format: 'excel' | 'pdf') => {
    // Close dropdown after selection
    setShowExportDropdown(false);

    if (filteredStudents.length === 0) {
      toast.error('No students to export');
      return;
    }

    if (format === 'excel') {
      // Create Excel workbook with all required fields
      const ws = XLSX.utils.json_to_sheet(
        filteredStudents.map(s => ({
          'Roll No': s.rollNo,
          'Student ID': s.rollNo, // Using rollNo as student ID
          'Full Name': s.name,
          'Email': s.email,
          'Phone': s.phone,
          'Class': s.class || '',
          'Section': s.section || '',
          'Guardian': s.guardian,
          'Address': s.address,
          'Status': s.status,
        }))
      );
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Students');
      XLSX.writeFile(wb, `students_export_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Excel file exported successfully!');
    } else if (format === 'pdf') {
      // For PDF, we'll create a simple HTML table and use browser print
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        const htmlContent = `
          <!DOCTYPE html>
          <html>
            <head>
              <title>Students Export</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                h1 { color: #333; margin-bottom: 20px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #4f46e5; color: white; font-weight: bold; }
                tr:nth-child(even) { background-color: #f2f2f2; }
                @media print { 
                  @page { size: landscape; margin: 0.5cm; }
                  body { margin: 0; }
                }
              </style>
            </head>
            <body>
              <h1>Students Export - ${new Date().toLocaleDateString()}</h1>
              <table>
                <thead>
                  <tr>
                    <th>Roll No</th>
                    <th>Student ID</th>
                    <th>Full Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Class</th>
                    <th>Section</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${filteredStudents.map(s => `
                    <tr>
                      <td>${s.rollNo}</td>
                      <td>${s.rollNo}</td>
                      <td>${s.name}</td>
                      <td>${s.email}</td>
                      <td>${s.phone}</td>
                      <td>${s.class || ''}</td>
                      <td>${s.section || ''}</td>
                      <td>${s.status}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
              <script>
                window.onload = function() {
                  window.print();
                };
              </script>
            </body>
          </html>
        `;
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        toast.success('PDF export opened in print dialog!');
      }
    }
  };

  // Close export dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showExportDropdown && !target.closest('.export-dropdown-container')) {
        setShowExportDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showExportDropdown]);

  return (
    <>
      <div className="mb-6 sm:mb-8">
        <h1 className={`${theme.textColor} mb-2`}>{t('studentManagement')}</h1>
        <p className={theme.subtextColor}>{t('manageStudentInfo')}</p>
      </div>

      {/* Filters and Actions */}
      <div className={`${theme.bgColor} rounded-xl p-4 sm:p-6 shadow-sm border ${theme.borderColor} mb-4 sm:mb-6`}>
        <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 mb-4">
          {/* Name Search */}
          <div className="flex-1 relative">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${theme.subtextColor}`} />
            <input
              type="text"
              placeholder={t('searchStudents')}
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${theme.inputBg}`}
              style={{ focusRingColor: theme.primaryColor }}
            />
          </div>

          {/* Roll Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by roll number..."
              value={searchRoll}
              onChange={(e) => setSearchRoll(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${theme.inputBg}`}
            />
          </div>

          {/* Class Filter */}
          <div className="flex items-center gap-2">
            <Filter className={`w-5 h-5 ${theme.subtextColor}`} />
            <select
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setSelectedSection('all'); // Reset section when class changes
              }}
              className={`flex-1 sm:flex-none px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${theme.inputBg}`}
            >
              {classes.map((cls) => (
                <option key={cls} value={cls}>
                  {cls === 'all' ? t('allClasses') : cls}
                </option>
              ))}
            </select>
          </div>

          {/* Section Filter */}
          {selectedClass !== 'all' && (
            <div className="flex items-center gap-2">
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className={`flex-1 sm:flex-none px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${theme.inputBg}`}
              >
                {sections.map((sec) => (
                  <option key={sec} value={sec}>
                    {sec === 'all' ? 'All Sections' : sec}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3">
          <button 
            onClick={() => setIsAddDialogOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 text-white rounded-lg transition-colors"
            style={{ backgroundColor: theme.primaryColor }}
          >
            <Plus className="w-5 h-5" />
            <span className="text-sm sm:text-base">{t('addStudent')}</span>
          </button>
          <button 
            onClick={() => setShowImportModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Upload className="w-5 h-5" />
            <span className="text-sm sm:text-base">{t('importExcel')}</span>
          </button>
          
          {/* Responsive Export Dropdown */}
          <div className="relative export-dropdown-container">
            <button 
              type="button"
              onClick={() => setShowExportDropdown(!showExportDropdown)}
              className={`flex items-center justify-center gap-2 px-4 py-2 border rounded-lg transition-colors ${theme.borderColorAlt} ${theme.hoverColor} w-full sm:w-auto`}
            >
              <Download className="w-5 h-5" />
              <span className="text-sm sm:text-base">{t('export')}</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showExportDropdown ? 'rotate-180' : ''}`} />
            </button>
            
            {/* Dropdown Menu */}
            {showExportDropdown && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[180px] overflow-hidden">
                <button
                  type="button"
                  onClick={() => handleExport('excel')}
                  className="block w-full text-left px-4 py-3 hover:bg-gray-100 text-sm transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    <span>Export as Excel</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handleExport('pdf')}
                  className="block w-full text-left px-4 py-3 hover:bg-gray-100 text-sm transition-colors border-t border-gray-100"
                >
                  <div className="flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    <span>Export as PDF</span>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Students Table - Desktop */}
      <div className={`hidden md:block ${theme.bgColor} rounded-xl shadow-sm border ${theme.borderColor} overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={`${theme.bgColorAlt} border-b ${theme.borderColor}`}>
              <tr>
                <th className={`px-6 py-3 text-left ${theme.textColor}`}>{t('rollNo')}</th>
                <th className={`px-6 py-3 text-left ${theme.textColor}`}>{t('studentName')}</th>
                <th className={`px-6 py-3 text-left ${theme.textColor}`}>{t('class')}</th>
                <th className={`px-6 py-3 text-left ${theme.textColor}`}>{t('phone')}</th>
                <th className={`px-6 py-3 text-left ${theme.textColor}`}>{t('parent')}</th>
                <th className={`px-6 py-3 text-left ${theme.textColor}`}>{t('status')}</th>
                <th className={`px-6 py-3 text-left ${theme.textColor}`}>{t('actions')}</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${theme.borderColor}`}>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center">
                    <p className={theme.subtextColor}>No students found</p>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                <tr key={student.id} className={theme.hoverColor + " transition-colors"}>
                  <td className={`px-6 py-4 ${theme.textColor}`}>{student.rollNo}</td>
                  <td className="px-6 py-4">
                    <div>
                      <p className={theme.textColor}>{student.name}</p>
                      <p className={`${theme.subtextColor} text-sm`}>{student.email}</p>
                    </div>
                  </td>
                  <td className={`px-6 py-4 ${theme.textColor}`}>
                    {student.class ?? 'N/A'}
                    {student.section && <span className="text-gray-500"> - {student.section}</span>}
                  </td>
                  <td className={`px-6 py-4 ${theme.textColor}`}>{student.phone}</td>
                  <td className={`px-6 py-4 ${theme.textColor}`}>{student.guardian}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      student.status === 'Active' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {student.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setSelectedStudent(student.id)}
                        className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                        style={{ color: theme.primaryColor }}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleEditClick(student)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteStudent(student.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Students Cards - Mobile */}
      <div className="md:hidden space-y-3">
        {filteredStudents.length === 0 ? (
          <div className={`${theme.bgColor} rounded-xl p-6 shadow-sm border ${theme.borderColor} text-center`}>
            <p className={theme.subtextColor}>No students found</p>
          </div>
        ) : (
          filteredStudents.map((student) => (
          <div key={student.id} className={`${theme.bgColor} rounded-xl p-4 shadow-sm border ${theme.borderColor}`}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className={`${theme.textColor}`}>{student.name}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    student.status === 'Active' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {student.status}
                  </span>
                </div>
                <p className={`${theme.subtextColor} text-sm`}>{student.email}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
              <div>
                <span className={`${theme.subtextColor}`}>{t('rollNo')}: </span>
                <span className={theme.textColor}>{student.rollNo}</span>
              </div>
              <div>
                <span className={`${theme.subtextColor}`}>{t('class')}: </span>
                <span className={theme.textColor}>{student.class ?? 'N/A'}</span>
              </div>
              <div className="col-span-2">
                <span className={`${theme.subtextColor}`}>{t('phone')}: </span>
                <span className={theme.textColor}>{student.phone}</span>
              </div>
              <div className="col-span-2">
                <span className={`${theme.subtextColor}`}>{t('parent')}: </span>
                <span className={theme.textColor}>{student.guardian}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-3 border-t" style={{ borderColor: theme.borderColor }}>
              <button 
                onClick={() => setSelectedStudent(student.id)}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors text-sm"
                style={{ backgroundColor: theme.primaryColor + '20', color: theme.primaryColor }}
              >
                <Eye className="w-4 h-4" />
                View
              </button>
              <button 
                onClick={() => handleEditClick(student)}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors text-sm"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
              <button 
                onClick={() => handleDeleteStudent(student.id)}
                className="flex items-center justify-center p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          ))
        )}
      </div>
      
      {/* Student Details Modal */}
      {selectedStudent && (() => {
        const student = students.find(s => s.id === selectedStudent);
        if (!student) return null;
        
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-gray-900">Student Details</h2>
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="flex flex-col md:flex-row gap-6 mb-6">
                {/* Student Photo */}
                <div className="flex flex-col items-center">
                  {student.photo || pendingPhoto ? (
                    <div className="relative">
                      <img 
                        src={student.photo || pendingPhoto || ''} 
                        alt={student.name}
                        className="w-32 h-32 rounded-lg object-cover mb-3"
                      />
                      <button
                        onClick={() => {
                          if (student.id) {
                            handlePhotoUpload({ target: { files: [] } } as any, student.id);
                          }
                        }}
                        className="absolute -bottom-1 -right-1 p-1.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                        title="Change photo"
                      >
                        <Upload className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-3xl mb-3">
                      {student.name.split(' ').map(n => n[0]).join('')}
                    </div>
                  )}
                  <label className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm cursor-pointer">
                    {isUploadingPhoto ? 'Uploading...' : 'Upload Photo'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handlePhotoUpload(e, student.id)}
                    />
                  </label>
                </div>

                {/* Student Info */}
                <div className="flex-1 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-600 text-sm mb-1">Full Name</p>
                    <p className="text-gray-900">{student.name}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm mb-1">Student ID</p>
                    <p className="text-gray-900">{student.rollNo}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm mb-1">Class</p>
                    <p className="text-gray-900">{student.class ?? 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm mb-1">Status</p>
                    <p className="text-gray-900">{student.status}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm mb-1">Date of Birth</p>
                    <p className="text-gray-900">{student.dateOfBirth || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm mb-1">Admission Date</p>
                    <p className="text-gray-900">{student.admissionDate || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-gray-600 text-sm mb-1">Phone</p>
                  <p className="text-gray-900">{student.phone}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm mb-1">Email</p>
                  <p className="text-gray-900">{student.email}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm mb-1">Guardian Name</p>
                  <p className="text-gray-900">{student.guardian}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-600 text-sm mb-1">Address</p>
                  <p className="text-gray-900">{student.address}</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    setSelectedStudent(null);
                    handleEditClick(student);
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Edit Student
                </button>
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Import Excel Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-gray-900">Import Students from Excel</h2>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="mb-6">
              <label className="text-gray-700 mb-2 block">Select Class *</label>
              <select
                value={importClass}
                onChange={(e) => {
                  setImportClass(e.target.value);
                  setImportSection('');
                  setPreviewStudents([]);
                  if (importFileInputRef.current) importFileInputRef.current.value = '';
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Choose a class...</option>
                {classes.filter(c => c !== 'all').map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
            </div>

            {importClass && (
              <div className="mb-6">
                <label className="text-gray-700 mb-2 block">Select Section (Optional)</label>
                <select
                  value={importSection}
                  onChange={(e) => {
                    setImportSection(e.target.value);
                    setPreviewStudents([]);
                    if (importFileInputRef.current) importFileInputRef.current.value = '';
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Sections</option>
                  {classesWithSections
                    .find(c => c.name === importClass)
                    ?.sections.map(sec => (
                      <option key={sec.id} value={sec.name}>{sec.name}</option>
                    ))}
                </select>
              </div>
            )}

            {importClass ? (
              previewStudents.length > 0 ? (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">Preview Students ({previewStudents.length})</h3>
                    <button 
                      onClick={() => setPreviewStudents([])}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Clear Preview
                    </button>
                  </div>
                  <div className="border rounded-lg overflow-hidden max-h-[400px] overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-left font-medium text-gray-600">Student ID</th>
                          <th className="px-4 py-2 text-left font-medium text-gray-600">Name</th>
                          <th className="px-4 py-2 text-left font-medium text-gray-600">Email</th>
                          <th className="px-4 py-2 text-left font-medium text-gray-600">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {previewStudents.map((s, i) => (
                          <tr key={i}>
                            <td className="px-4 py-2 text-gray-900">{s.rollNumber}</td>
                            <td className="px-4 py-2 text-gray-900">{s.name}</td>
                            <td className="px-4 py-2 text-gray-600">{s.email}</td>
                            <td className="px-4 py-2">
                              <span className="px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 text-xs">
                                Pending
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="mb-6 space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                    <h3 className="text-sm font-semibold text-blue-800 mb-2">Step 1: Download Template</h3>
                    <p className="text-sm text-blue-600 mb-3">
                      Download the Excel template for {importClass} {importSection ? `(${importSection})` : ''}.
                    </p>
                    <button
                      onClick={handleDownloadTemplate}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm w-full justify-center"
                    >
                      <Download className="w-4 h-4" />
                      Download Excel Template
                    </button>
                  </div>

                  <div className="p-4 bg-gray-50 border border-gray-100 rounded-lg">
                    <h3 className="text-sm font-semibold text-gray-800 mb-2">Step 2: Upload Filled File</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Upload the filled Excel file to import students.
                    </p>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center bg-white">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-xs text-gray-500 mb-2">Supported: .xlsx, .xls</p>
                      <label className="inline-block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer transition-colors text-sm">
                        Select File to Upload
                        <input
                          ref={importFileInputRef}
                          type="file"
                          accept=".xlsx,.xls"
                          onChange={handleImportExcel}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              )
            ) : (
              <div className="mb-6 p-8 text-center text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                <p>Please select a class above to continue.</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowImportModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              {previewStudents.length > 0 && (
                <button
                  onClick={handleSaveImport}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Importing...' : 'Save & Import'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {isAddDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl p-6 max-w-md w-full my-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-gray-900 text-xl font-semibold">Add New Student</h2>
              <button
                onClick={() => {
                  setIsAddDialogOpen(false);
                  setFormData({
                    name: '',
                    email: '',
                    password: '',
                    phone: '',
                    address: '',
                    class: '',
                    section: '',
                    rollNumber: '',
                  });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form 
              className="space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!formData.name || !formData.email || !formData.password) {
                  toast.error('Please fill in all required fields');
                  return;
                }

                // Validate form
                const newErrors: Record<string, string | null> = {};
                if (!formData.name) newErrors.name = 'Name is required';
                if (!formData.email) newErrors.email = 'Email is required';

                // Validate Student ID (unique per class+section)
                if (!formData.rollNumber) {
                  newErrors.rollNumber = 'Student ID is required';
                } else if (students.some(
                  s => s.rollNo === formData.rollNumber &&
                    (s.class ?? '') === (formData.class ?? '') &&
                    (s.section ?? '') === (formData.section ?? '')
                )) {
                  newErrors.rollNumber = 'Student ID already exists in this class/section';
                }

                if (!formData.password) {
                  newErrors.password = 'Password is required';
                } else {
                  const pwError = validateStrongPassword(formData.password);
                  if (pwError) newErrors.password = pwError;
                }
                if (formData.phone) {
                  const phoneError = validateNepalPhone(formData.phone);
                  if (phoneError) newErrors.phone = phoneError;
                }
                setErrors(newErrors);
                if (Object.values(newErrors).some(Boolean)) {
                  toast.error('Please fix the highlighted errors');
                  return;
                }

                setIsSubmitting(true);
                try {
                  const payload: any = {
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                    role: 'student' as const,
                    phone: formData.phone || undefined,
                    address: formData.address || undefined,
                    class: formData.class || undefined,
                    section: formData.section || undefined,
                    rollNumber: formData.rollNumber || undefined,
                    image: pendingPhoto || undefined,
                  };

                  const created = await apiFetch<Student>('/admin/users', {
                    method: 'POST',
                    body: JSON.stringify(payload),
                  });

                  // Update UI state immediately without page reload
                  setStudents((prev) => [...prev, {
                    ...created,
                    rollNo: created.rollNo || formData.rollNumber,
                    guardian: 'Parent/Guardian',
                    status: 'Active',
                  }]);

                  // Switch view to the new student's class and section
                  if (formData.class) {
                    setSelectedClass(formData.class);
                    if (formData.section) {
                      setSelectedSection(formData.section);
                    } else {
                      setSelectedSection('all');
                    }
                  }

                  // Reset form
                  setFormData({
                    name: '',
                    email: '',
                    password: '',
                    phone: '',
                    address: '',
                    class: '',
                    section: '',
                    rollNumber: '',
                  });
                  setErrors({});
                  setIsAddDialogOpen(false);
                  toast.success('Student created successfully!');
                  adminData.refreshData();
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : 'Failed to create student');
                } finally {
                  setIsSubmitting(false);
                }
              }}
            >
              <div>
                <label htmlFor="student-name" className="text-gray-700 mb-2 block">Full Name *</label>
                <input
                  id="student-name"
                  type="text"
                  placeholder="Enter full name"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (errors.name) setErrors({ ...errors, name: null });
                  }}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-red-600">{errors.name}</p>
                )}
              </div>
              <div>
                <label htmlFor="student-email" className="text-gray-700 mb-2 block">Email *</label>
                <input
                  id="student-email"
                  type="email"
                  placeholder="Enter email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    if (errors.email) setErrors({ ...errors, email: null });
                  }}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-600">{errors.email}</p>
                )}
              </div>
              <div>
                <label htmlFor="student-password" className="text-gray-700 mb-2 block">
                  Password *
                </label>
                <div className="relative">
                  <input
                    id="student-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min 8 chars, upper, lower, number, special"
                    value={formData.password}
                    onChange={(e) => {
                      setFormData({ ...formData, password: e.target.value });
                      if (errors.password) {
                        setErrors({ ...errors, password: null });
                      }
                    }}
                    className={`w-full px-4 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.password ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700 z-10"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-red-600">{errors.password}</p>
                )}
              </div>
              <div>
                <label htmlFor="student-phone" className="text-gray-700 mb-2 block">
                  Phone
                </label>
                <input
                  id="student-phone"
                  type="tel"
                  placeholder="e.g., +97798..., 98..., 97..., 96..."
                  value={formData.phone}
                  onChange={(e) => {
                    setFormData({ ...formData, phone: e.target.value });
                    if (errors.phone) setErrors({ ...errors, phone: null });
                  }}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
              </div>
              <div>
                <label htmlFor="student-address" className="text-gray-700 mb-2 block">Address</label>
                <input
                  id="student-address"
                  type="text"
                  placeholder="Enter address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="student-class" className="text-gray-700 mb-2 block">
                  Class
                </label>
                <select
                  id="student-class"
                  value={formData.class}
                  onChange={(e) => {
                    setFormData({ ...formData, class: e.target.value, section: '' });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select class</option>
                  {availableClasses.map((cls) => (
                    <option key={cls} value={cls}>
                      {cls}
                    </option>
                  ))}
                </select>
              </div>
              {formData.class && (
                <div>
                  <label htmlFor="student-section" className="text-gray-700 mb-2 block">
                    Section
                  </label>
                  <select
                    id="student-section"
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select section</option>
                    {classesWithSections
                      .find(c => c.name === formData.class)
                      ?.sections.map(sec => (
                        <option key={sec.id} value={sec.name}>{sec.name}</option>
                      ))}
                  </select>
                </div>
              )}
              <div>
                <label htmlFor="student-rollNumber" className="text-gray-700 mb-2 block">Student ID *</label>
                <input
                  id="student-rollNumber"
                  type="text"
                  placeholder="Enter Student ID"
                  value={formData.rollNumber}
                  onChange={(e) => {
                    setFormData({ ...formData, rollNumber: e.target.value });
                    if (errors.rollNumber) setErrors({ ...errors, rollNumber: null });
                  }}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.rollNumber ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {errors.rollNumber && (
                  <p className="mt-1 text-xs text-red-600">{errors.rollNumber}</p>
                )}
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
                      class: '',
                      section: '',
                      rollNumber: '',
                    });
                    setErrors({});
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Adding...' : 'Add Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {showEditModal && editingStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl p-6 max-w-md w-full my-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-gray-900 text-xl font-semibold">Edit Student</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingStudent(null);
                  setFormData({
                    name: '',
                    email: '',
                    password: '',
                    phone: '',
                    address: '',
                    class: '',
                    section: '',
                    rollNumber: '',
                  });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form 
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveEdit();
              }}
            >
              <div>
                <label htmlFor="edit-student-name" className="text-gray-700 mb-2 block">Full Name *</label>
                <input
                  id="edit-student-name"
                  type="text"
                  placeholder="Enter full name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="edit-student-email" className="text-gray-700 mb-2 block">Email *</label>
                <input
                  id="edit-student-email"
                  type="email"
                  placeholder="Enter email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="edit-student-password"
                  className="text-gray-700 mb-2 block"
                >
                  Password (leave blank to keep current)
                </label>
                <div className="relative">
                  <input
                    id="edit-student-password"
                    type={showEditPassword ? 'text' : 'password'}
                    placeholder="Min 8 chars, upper, lower, number, special"
                    value={formData.password}
                    onChange={(e) => {
                      setFormData({ ...formData, password: e.target.value });
                      if (errors.password) {
                        setErrors({ ...errors, password: null });
                      }
                    }}
                    className={`w-full px-4 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.password ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700 z-10"
                    tabIndex={-1}
                  >
                    {showEditPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-red-600">{errors.password}</p>
                )}
              </div>
              <div>
                <label htmlFor="edit-student-phone" className="text-gray-700 mb-2 block">
                  Phone
                </label>
                <input
                  id="edit-student-phone"
                  type="tel"
                  placeholder="e.g., +97798..., 98..., 97..., 96..."
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
              </div>
              <div>
                <label htmlFor="edit-student-address" className="text-gray-700 mb-2 block">Address</label>
                <input
                  id="edit-student-address"
                  type="text"
                  placeholder="Enter address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="edit-student-class" className="text-gray-700 mb-2 block">
                  Class
                </label>
                <select
                  id="edit-student-class"
                  value={formData.class}
                  onChange={(e) => {
                    setFormData({ ...formData, class: e.target.value, section: '' });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select class</option>
                  {availableClasses.map((cls) => (
                    <option key={cls} value={cls}>
                      {cls}
                    </option>
                  ))}
                </select>
              </div>
              {formData.class && (
                <div>
                  <label htmlFor="edit-student-section" className="text-gray-700 mb-2 block">
                    Section
                  </label>
                  <select
                    id="edit-student-section"
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select section</option>
                    {classesWithSections
                      .find(c => c.name === formData.class)
                      ?.sections.map(sec => (
                        <option key={sec.id} value={sec.name}>{sec.name}</option>
                      ))}
                  </select>
                </div>
              )}
              <div>
                <label htmlFor="edit-student-rollNumber" className="text-gray-700 mb-2 block">Student ID *</label>
                <input
                  id="edit-student-rollNumber"
                  type="text"
                  placeholder="Enter Student ID"
                  value={formData.rollNumber}
                  onChange={(e) => {
                    setFormData({ ...formData, rollNumber: e.target.value });
                    if (errors.rollNumber) setErrors({ ...errors, rollNumber: null });
                  }}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.rollNumber ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {errors.rollNumber && (
                  <p className="mt-1 text-xs text-red-600">{errors.rollNumber}</p>
                )}
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingStudent(null);
                    setFormData({
                      name: '',
                      email: '',
                      password: '',
                      phone: '',
                      address: '',
                      class: '',
                      section: '',
                      rollNumber: '',
                    });
                    setErrors({});
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
