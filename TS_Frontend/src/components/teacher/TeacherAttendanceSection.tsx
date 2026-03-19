import { useEffect, useState } from 'react';
import { User } from '../../App';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { CheckSquare, Clock, Users, Eye, Check, X, Calendar as CalendarIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { useTeacherData } from './TeacherDataContext';

interface TeacherAttendanceSectionProps {
  user: User;
}

export function TeacherAttendanceSection({ user }: TeacherAttendanceSectionProps) {
  const [view, setView] = useState<'mark' | 'pending' | 'details'>('mark');
  const data = useTeacherData();
  const [selectedClass, setSelectedClass] = useState(data?.attendance?.classes?.[0] ?? '');
  const [attendance, setAttendance] = useState<Record<number, 'present' | 'absent'>>({});
  const [viewingStudent, setViewingStudent] = useState<typeof data.attendance.details[0] | null>(null);

  if (!data || !data.attendance) {
    return <div className="p-4 text-gray-500">Loading attendance data...</div>;
  }

  useEffect(() => {
    if (data?.attendance?.students) {
      const initial = data.attendance.students.reduce(
        (acc, student) => ({ ...acc, [student.id]: student.status }),
        {}
      );
      setAttendance(initial);
    }
  }, [data?.attendance?.students]);

  useEffect(() => {
    if (!selectedClass && data?.attendance?.classes?.length) {
      setSelectedClass(data.attendance.classes[0]);
    }
  }, [data?.attendance?.classes, selectedClass]);

  const toggleAttendance = (studentId: number) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: prev[studentId] === 'present' ? 'absent' : 'present'
    }));
  };

  const submitAttendance = () => {
    toast.success('Attendance marked successfully!');
  };

  const handleRequest = (requestId: number, action: 'approve' | 'reject') => {
    toast.success(`Request ${action}d successfully!`);
  };

  return (
    <div className="space-y-4">
      {/* View Toggle */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <Button
          variant={view === 'mark' ? 'default' : 'outline'}
          onClick={() => setView('mark')}
          size="sm"
          className={view === 'mark' ? 'bg-indigo-600 hover:bg-indigo-700' : ''}
        >
          <CheckSquare className="size-4 mr-2" />
          Mark Attendance
        </Button>
        {/* <Button
          variant={view === 'pending' ? 'default' : 'outline'}
          onClick={() => setView('pending')}
          size="sm"
          className={view === 'pending' ? 'bg-indigo-600 hover:bg-indigo-700' : ''}
        >
          <Clock className="size-4 mr-2" />
          Pending ({data?.attendance?.pendingRequests?.length ?? 0})
        </Button> */}
        <Button
          variant={view === 'details' ? 'default' : 'outline'}
          onClick={() => setView('details')}
          size="sm"
          className={view === 'details' ? 'bg-indigo-600 hover:bg-indigo-700' : ''}
        >
          <Users className="size-4 mr-2" />
          Student Details
        </Button>
      </div>

      {/* Mark Attendance View */}
      {view === 'mark' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckSquare className="size-5 text-indigo-600" />
              Mark Attendance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Class Selector */}
            <div>
              <label className="text-sm text-gray-600 mb-2 block">Select Class</label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(data?.attendance?.classes ?? []).map((cls) => (
                    <SelectItem key={cls} value={cls}>
                      {cls}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date */}
            <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
              <p className="text-sm text-gray-600">Date</p>
              <p className="text-indigo-600">{new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</p>
            </div>

            {/* Students List */}
            <div className="space-y-2">
              {data.attendance.students
                .filter((student) => !selectedClass || student.class === selectedClass || !student.class)
                .map((student) => {
                  const isPresent = attendance[student.id] === 'present';
                  return (
                  <div
                    key={student.id}
                    className={`p-3 rounded-lg border transition-colors ${
                      isPresent
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-900">{student.name}</p>
                        <p className="text-sm text-gray-600">Roll No: {student.rollNo}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setAttendance(prev => ({ ...prev, [student.id]: 'present' }))}
                          className={`px-4 py-2 rounded-lg transition-colors ${
                            isPresent
                              ? 'bg-green-600 text-white'
                              : 'bg-white text-gray-600 border'
                          }`}
                        >
                          Present
                        </button>
                        <button
                          onClick={() => setAttendance(prev => ({ ...prev, [student.id]: 'absent' }))}
                          className={`px-4 py-2 rounded-lg transition-colors ${
                            !isPresent
                              ? 'bg-red-600 text-white'
                              : 'bg-white text-gray-600 border'
                          }`}
                        >
                          Absent
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary */}
            <div className="p-4 bg-gray-50 rounded-lg border">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-2xl text-gray-900">{data?.attendance?.students?.length ?? 0}</p>
                  <p className="text-sm text-gray-600">Total</p>
                </div>
                <div>
                  <p className="text-2xl text-green-600">
                    {Object.values(attendance).filter(s => s === 'present').length}
                  </p>
                  <p className="text-sm text-gray-600">Present</p>
                </div>
                <div>
                  <p className="text-2xl text-red-600">
                    {Object.values(attendance).filter(s => s === 'absent').length}
                  </p>
                  <p className="text-sm text-gray-600">Absent</p>
                </div>
              </div>
            </div>

            <Button onClick={submitAttendance} className="w-full bg-indigo-600 hover:bg-indigo-700">
              Submit Attendance
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Pending Requests View */}
      {view === 'pending' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="size-5 text-indigo-600" />
              Pending Requests ({data.attendance.pendingRequests.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
              {(data?.attendance?.pendingRequests?.length ?? 0) === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Clock className="size-12 mx-auto mb-2 opacity-50" />
                <p>No pending attendance requests</p>
              </div>
            ) : (
                (data?.attendance?.pendingRequests ?? []).map((request) => (
                <div key={request.id} className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-gray-900">{request.studentName}</h3>
                      <p className="text-sm text-gray-600">
                        Roll No: {request.rollNo} • {request.class}
                      </p>
                    </div>
                    <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded">
                      Pending
                    </span>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600 mb-3">
                    <p>Date: {new Date(request.date).toLocaleDateString()}</p>
                    <p>Time: {request.time}</p>
                    <p>Location: {request.location}</p>
                    <p>Reason: {request.reason}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleRequest(request.id, 'approve')}
                      size="sm"
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <Check className="size-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      onClick={() => handleRequest(request.id, 'reject')}
                      size="sm"
                      variant="outline"
                      className="flex-1 text-red-600 border-red-600 hover:bg-red-50"
                    >
                      <X className="size-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {/* Student Details & Attendance View */}
      {view === 'details' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="size-5 text-indigo-600" />
              Student Attendance Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(data?.attendance?.details ?? []).map((student, idx) => (
              <div key={idx} className="p-4 bg-white rounded-lg border">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-gray-900">{student.studentName}</h3>
                    <p className="text-sm text-gray-600">
                      Roll No: {student.rollNo} • {student.class}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewingStudent(student)}
                  >
                    <Eye className="size-4 mr-1" />
                    View
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-2 bg-green-50 rounded text-center">
                    <p className="text-xs text-gray-600">Present</p>
                    <p className="text-green-600">{student.totalPresent}</p>
                  </div>
                  <div className="p-2 bg-red-50 rounded text-center">
                    <p className="text-xs text-gray-600">Absent</p>
                    <p className="text-red-600">{student.totalAbsent}</p>
                  </div>
                  <div className="p-2 bg-blue-50 rounded text-center">
                    <p className="text-xs text-gray-600">Percentage</p>
                    <p className="text-blue-600">{student.percentage}%</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Student Details Dialog */}
      <Dialog open={!!viewingStudent} onOpenChange={() => setViewingStudent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Attendance Details</DialogTitle>
          </DialogHeader>
          {viewingStudent && (
            <div className="space-y-4">
              <div>
                <h3 className="text-gray-900">{viewingStudent.studentName}</h3>
                <p className="text-sm text-gray-600">
                  Roll No: {viewingStudent.rollNo} • {viewingStudent.class}
                </p>
              </div>
              
              <div className="grid grid-cols-3 gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <p className="text-2xl text-green-600">{viewingStudent.totalPresent}</p>
                  <p className="text-xs text-gray-600">Present</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl text-red-600">{viewingStudent.totalAbsent}</p>
                  <p className="text-xs text-gray-600">Absent</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl text-blue-600">{viewingStudent.percentage}%</p>
                  <p className="text-xs text-gray-600">Percentage</p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-gray-900">Recent Records</h4>
                {viewingStudent.records.map((record, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg ${
                      record.status === 'Present'
                        ? 'bg-green-50 border border-green-200'
                        : 'bg-red-50 border border-red-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-gray-900">
                        {new Date(record.date).toLocaleDateString()}
                      </span>
                      <span className={`text-sm px-2 py-1 rounded ${
                        record.status === 'Present'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {record.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
