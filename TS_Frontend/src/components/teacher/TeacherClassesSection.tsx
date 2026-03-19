import { useEffect, useState } from 'react';
import { type User } from '../../App';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Users, BookOpen, ChevronRight, UserCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { useTeacherData } from './TeacherDataContext';

interface TeacherClassesSectionProps {
  user: User;
}

export function TeacherClassesSection({ user }: TeacherClassesSectionProps) {
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [view, setView] = useState<'classes' | 'students'>('classes');
  const data = useTeacherData();

  useEffect(() => {
    if (!selectedClass && data.classes.assigned.length) {
      setSelectedClass(data.classes.assigned[0].name);
    }
  }, [data.classes.assigned]);

  const filteredStudents = selectedClass 
    ? data.classes.students.filter(s => s.class === selectedClass)
    : data.classes.students;

  // Get unique classes from both assigned and class teacher
  const allClasses = [
    ...data.classes.assigned.map(c => ({ ...c, type: 'assigned' as const })),
    ...data.classes.classTeacherOf.map(c => ({ 
      id: c.id,
      classId: c.classId,
      name: c.className,
      subject: 'Class Teacher',
      sectionName: c.sectionName,
      sectionId: c.sectionId,
      type: 'classTeacher' as const
    }))
  ];

  return (
    <div className="space-y-4">
      {/* View Toggle */}
      <div className="flex gap-2">
        <Button
          variant={view === 'classes' ? 'default' : 'outline'}
          onClick={() => setView('classes')}
          className={view === 'classes' ? 'bg-indigo-600 hover:bg-indigo-700' : ''}
        >
          <BookOpen className="size-4 mr-2" />
          My Classes
        </Button>
        <Button
          variant={view === 'students' ? 'default' : 'outline'}
          onClick={() => setView('students')}
          className={view === 'students' ? 'bg-indigo-600 hover:bg-indigo-700' : ''}
        >
          <Users className="size-4 mr-2" />
          Students
        </Button>
      </div>

      {/* Assigned Classes View */}
      {view === 'classes' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="size-5 text-indigo-600" />
              My Classes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Subject Assignments */}
            {data.classes.assigned.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-600 mb-2">Subject Teaching</h4>
                {data.classes.assigned.map((cls) => (
                  <div key={`assigned-${cls.id}`} className="p-4 bg-white rounded-lg border hover:border-indigo-300 transition-colors mb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-gray-900 mb-1">{cls.name}</h3>
                        <p className="text-sm text-indigo-600 mb-2">{cls.subject}</p>
                        {cls.sectionName && (
                          <p className="text-xs text-gray-500 mb-2">Section: {cls.sectionName}</p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>{data.classes.students.filter(s => s.class === cls.name).length} Students</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedClass(cls.name);
                          setView('students');
                        }}
                      >
                        <ChevronRight className="size-5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Class Teacher Assignments */}
            {data.classes.classTeacherOf.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-600 mb-2">Class Teacher Of</h4>
                {data.classes.classTeacherOf.map((cls) => (
                  <div key={`classteacher-${cls.id}`} className="p-4 bg-indigo-50 rounded-lg border border-indigo-200 mb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <UserCircle className="size-4 text-indigo-600" />
                          <h3 className="text-gray-900">{cls.className}</h3>
                        </div>
                        {cls.sectionName && (
                          <p className="text-xs text-gray-500 mb-2">Section: {cls.sectionName}</p>
                        )}
                        <p className="text-xs text-gray-500 mb-2">Academic Year: {cls.academicYear}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>{data.classes.students.filter(s => s.class === cls.className).length} Students</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedClass(cls.className);
                          setView('students');
                        }}
                      >
                        <ChevronRight className="size-5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {data.classes.assigned.length === 0 && data.classes.classTeacherOf.length === 0 && (
              <p className="text-gray-500 text-center py-4">No classes assigned yet</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Students View */}
      {view === 'students' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="size-5 text-indigo-600" />
                Students
                {selectedClass && (
                  <span className="text-sm px-2 py-1 bg-indigo-100 text-indigo-700 rounded">
                    {selectedClass}
                  </span>
                )}
              </CardTitle>
              {selectedClass && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedClass(null)}
                >
                  Show All
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {/* Class Filter */}
            {!selectedClass && (
              <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                {allClasses.map((cls) => (
                  <button
                    key={cls.id}
                    onClick={() => setSelectedClass(cls.name)}
                    className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                      cls.type === 'classTeacher' 
                        ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {cls.name}
                    {cls.type === 'classTeacher' && (
                      <span className="ml-1 text-xs">(Class Teacher)</span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Students List */}
            <div className="space-y-2">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <div key={student.id} className="p-4 bg-white rounded-lg border">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-gray-900">{student.name}</h3>
                        <p className="text-sm text-gray-600">
                          Roll No: {student.rollNo} • {student.class}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${
                        student.status === 'Excellent' ? 'bg-green-100 text-green-700' :
                        student.status === 'Good' ? 'bg-blue-100 text-blue-700' :
                        student.status === 'Average' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {student.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-2 bg-green-50 rounded text-center">
                        <p className="text-xs text-gray-600">Attendance</p>
                        <p className="text-green-600">{student.attendance}%</p>
                      </div>
                      <div className="p-2 bg-blue-50 rounded text-center">
                        <p className="text-xs text-gray-600">Last Exam</p>
                        <p className="text-blue-600">{student.lastExam}%</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No students found</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
