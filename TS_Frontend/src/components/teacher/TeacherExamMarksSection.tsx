import { useState, useRef } from 'react';
import { User } from '../../App';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { FileText, Upload, Eye, Plus } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { useTeacherData } from './TeacherDataContext';
import type { TeacherDashboardData } from './TeacherDataContext';

interface TeacherExamMarksSectionProps {
  user: User;
}

export function TeacherExamMarksSection({ user }: TeacherExamMarksSectionProps) {
  const [view, setView] = useState<'enter' | 'import' | 'existing'>('enter');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [totalMarks, setTotalMarks] = useState('');
  const [marks, setMarks] = useState<Record<number, string>>({});
  const [viewingMarks, setViewingMarks] = useState<
    TeacherDashboardData['exams']['existingMarks'][0] | null
  >(null);
  const [filterExam, setFilterExam] = useState('All Exams');
  const [filterClass, setFilterClass] = useState('All Classes');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const data = useTeacherData();
  const studentsForMarks = data.exams.students;
  const existingMarks = data.exams.existingMarks;

  const handleMarkChange = (studentId: number, value: string) => {
    setMarks(prev => ({
      ...prev,
      [studentId]: value
    }));
  };

  const submitMarks = () => {
    if (!selectedClass || !selectedExam || !selectedSubject || !totalMarks) {
      toast.error('Please fill all required fields');
      return;
    }

    const allMarksEntered = studentsForMarks.every(student => marks[student.id]);
    if (!allMarksEntered) {
      toast.error('Please enter marks for all students');
      return;
    }

    toast.success('Marks submitted successfully!');
    
    // Reset form
    setSelectedClass('');
    setSelectedExam('');
    setSelectedSubject('');
    setTotalMarks('');
    setMarks({});
  };

  const handleExcelImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls') && !file.name.endsWith('.csv')) {
        toast.error('Please select a valid Excel file (.xlsx, .xls, or .csv)');
        return;
      }
      
      // Mock import
      toast.success('Excel file imported successfully! Processing marks...');
      setTimeout(() => {
        toast.success('Marks have been imported and are ready for review.');
      }, 1500);
    }
  };

  const downloadTemplate = () => {
    toast.info('Downloading Excel template...');
    // In real implementation, this would trigger actual download
  };

  const filteredMarks = existingMarks.filter((mark) => {
    const examMatch = filterExam === 'All Exams' || mark.exam === filterExam;
    const classMatch = filterClass === 'All Classes' || mark.class === filterClass;
    return examMatch && classMatch;
  });

  return (
    <div className="space-y-4">
      {/* View Toggle */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <Button
          variant={view === 'enter' ? 'default' : 'outline'}
          onClick={() => setView('enter')}
          size="sm"
          className={view === 'enter' ? 'bg-indigo-600 hover:bg-indigo-700' : ''}
        >
          <Plus className="size-4 mr-2" />
          Enter Marks
        </Button>
        <Button
          variant={view === 'import' ? 'default' : 'outline'}
          onClick={() => setView('import')}
          size="sm"
          className={view === 'import' ? 'bg-indigo-600 hover:bg-indigo-700' : ''}
        >
          <Upload className="size-4 mr-2" />
          Import Excel
        </Button>
        <Button
          variant={view === 'existing' ? 'default' : 'outline'}
          onClick={() => setView('existing')}
          size="sm"
          className={view === 'existing' ? 'bg-indigo-600 hover:bg-indigo-700' : ''}
        >
          <Eye className="size-4 mr-2" />
          View Marks
        </Button>
      </div>

      {/* Enter Marks View */}
      {view === 'enter' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="size-5 text-indigo-600" />
              Enter Exam Marks
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Exam Details */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-gray-600 mb-2 block">
                  Class <span className="text-red-600">*</span>
                </label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                <SelectContent>
                  {data.exams.classes.map((cls) => (
                    <SelectItem key={cls} value={cls}>
                      {cls}
                    </SelectItem>
                  ))}
                </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm text-gray-600 mb-2 block">
                  Exam <span className="text-red-600">*</span>
                </label>
                <Select value={selectedExam} onValueChange={setSelectedExam}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select exam" />
                  </SelectTrigger>
                <SelectContent>
                  {data.exams.exams.map((exam) => (
                    <SelectItem key={exam} value={exam}>
                      {exam}
                    </SelectItem>
                  ))}
                </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm text-gray-600 mb-2 block">
                  Subject <span className="text-red-600">*</span>
                </label>
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                <SelectContent>
                  {data.exams.subjects.map((subject) => (
                    <SelectItem key={subject} value={subject}>
                      {subject}
                    </SelectItem>
                  ))}
                </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm text-gray-600 mb-2 block">
                  Total Marks <span className="text-red-600">*</span>
                </label>
                <Input
                  type="number"
                  value={totalMarks}
                  onChange={(e) => setTotalMarks(e.target.value)}
                  placeholder="e.g., 100"
                />
              </div>
            </div>

            {/* Students Marks Entry */}
            {selectedClass && selectedExam && selectedSubject && totalMarks && (
              <>
                <div className="border-t pt-4">
                  <h3 className="text-gray-900 mb-3">Enter Marks for Students</h3>
                  <div className="space-y-2">
                    {studentsForMarks.map((student) => (
                      <div key={student.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <p className="text-gray-900">{student.name}</p>
                          <p className="text-sm text-gray-600">Roll No: {student.rollNo}</p>
                        </div>
                        <div className="w-24">
                          <Input
                            type="number"
                            value={marks[student.id] || ''}
                            onChange={(e) => handleMarkChange(student.id, e.target.value)}
                            placeholder="Marks"
                            min="0"
                            max={totalMarks}
                          />
                        </div>
                        <span className="text-sm text-gray-600">/ {totalMarks}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Button onClick={submitMarks} className="w-full bg-indigo-600 hover:bg-indigo-700">
                  Submit Marks
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Import Excel View */}
      {view === 'import' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="size-5 text-indigo-600" />
              Import Marks from Excel
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-700 mb-2">📋 Instructions:</p>
              <ol className="text-sm text-blue-600 space-y-1 list-decimal list-inside">
                <li>Download the Excel template below</li>
                <li>Fill in student marks in the template</li>
                <li>Upload the completed Excel file</li>
                <li>Review and confirm the imported marks</li>
              </ol>
            </div>

            <Button onClick={downloadTemplate} variant="outline" className="w-full">
              <FileText className="size-4 mr-2" />
              Download Excel Template
            </Button>

            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleExcelImport}
                accept=".xlsx,.xls,.csv"
                className="hidden"
              />
              <Upload className="size-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-900 mb-2">Upload Excel File</p>
              <p className="text-sm text-gray-600 mb-4">
                Supported formats: XLSX, XLS, CSV
              </p>
              <Button onClick={() => fileInputRef.current?.click()}>
                Select File
              </Button>
            </div>

            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-sm text-yellow-700">
                ⚠️ Note: Make sure the Excel file follows the template format. 
                The system will validate the data before importing.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* View Existing Marks */}
      {view === 'existing' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="size-5 text-indigo-600" />
              Existing Marks
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filters */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-gray-600 mb-2 block">Filter by Exam</label>
                <Select value={filterExam} onValueChange={setFilterExam}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Exams">All Exams</SelectItem>
                  {data.exams.exams.map((exam) => (
                    <SelectItem key={exam} value={exam}>
                      {exam}
                    </SelectItem>
                  ))}
                </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm text-gray-600 mb-2 block">Filter by Class</label>
                <Select value={filterClass} onValueChange={setFilterClass}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Classes">All Classes</SelectItem>
                  {data.exams.classes.map((cls) => (
                    <SelectItem key={cls} value={cls}>
                      {cls}
                    </SelectItem>
                  ))}
                </SelectContent>
                </Select>
              </div>
            </div>

            {/* Marks List */}
            <div className="space-y-3">
              {filteredMarks.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="size-12 mx-auto mb-2 opacity-50" />
                  <p>No marks found for selected filters</p>
                </div>
              ) : (
                filteredMarks.map((mark, idx) => (
                  <div key={idx} className="p-4 bg-white rounded-lg border">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-gray-900">{mark.exam}</h3>
                        <p className="text-sm text-gray-600">
                          {mark.class} • {mark.subject}
                        </p>
                        <p className="text-sm text-gray-600">
                          Total Marks: {mark.totalMarks}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setViewingMarks(mark)}
                      >
                        <Eye className="size-4 mr-1" />
                        View
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-center p-3 bg-gray-50 rounded">
                      <div>
                        <p className="text-sm text-gray-600">Students</p>
                        <p className="text-gray-900">{mark.students.length}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Average</p>
                        <p className="text-gray-900">
                          {(mark.students.reduce((sum, s) => sum + s.marks, 0) / mark.students.length).toFixed(1)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Highest</p>
                        <p className="text-gray-900">
                          {Math.max(...mark.students.map(s => s.marks))}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* View Marks Dialog */}
      <Dialog open={!!viewingMarks} onOpenChange={() => setViewingMarks(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Marks Details</DialogTitle>
          </DialogHeader>
          {viewingMarks && (
            <div className="space-y-4">
              <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                <h3 className="text-gray-900 mb-1">{viewingMarks.exam}</h3>
                <p className="text-sm text-gray-600">
                  {viewingMarks.class} • {viewingMarks.subject} • Total: {viewingMarks.totalMarks}
                </p>
              </div>

              <div className="space-y-2">
                {viewingMarks.students.map((student, idx) => {
                  const percentage = (student.marks / viewingMarks.totalMarks) * 100;
                  return (
                    <div key={idx} className="p-3 bg-white rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-gray-900">{student.name}</p>
                          <p className="text-sm text-gray-600">Roll No: {student.rollNo}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl text-indigo-600">{student.marks}</p>
                          <p className="text-sm text-gray-600">/ {viewingMarks.totalMarks}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              percentage >= 90 ? 'bg-green-600' :
                              percentage >= 75 ? 'bg-blue-600' :
                              percentage >= 60 ? 'bg-yellow-600' : 'bg-red-600'
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600">{percentage.toFixed(0)}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
