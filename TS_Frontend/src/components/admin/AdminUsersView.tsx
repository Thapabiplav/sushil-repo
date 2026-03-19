import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '../ui/dialog';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Search, UserPlus, Edit2, Trash2, Mail, Phone } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import { toast } from 'sonner';

interface AdminDashboardData {
  teachers: Array<{
    id: number;
    name: string;
    email: string;
    phone?: string | null;
    classes: string[];
    subject: string;
  }>;
  students: Array<{
    id: number;
    name: string;
    email: string;
    phone?: string | null;
    class?: string | null;
    rollNo?: string | null;
  }>;
}

export function AdminUsersView() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    userType: '',
    name: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    class: '',
    rollNumber: '',
    teacherId: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = () => {
    setIsLoading(true);
    apiFetch<AdminDashboardData>('/admin/dashboard')
      .then(setData)
      .catch(() => setData({ teachers: [], students: [] }))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  if (isLoading) {
    return <div className="p-4 text-gray-600">Loading users...</div>;
  }

  if (!data) {
    return <div className="p-4 text-red-600">Failed to load users</div>;
  }

  const teachers = data.teachers.map((teacher) => ({
    id: teacher.id.toString(),
    name: teacher.name,
    email: teacher.email,
    phone: teacher.phone ?? 'N/A',
    classTeacher: teacher.classes[0] ?? '-',
    status: 'Active',
  }));

  const students = data.students.map((student) => ({
    id: student.id.toString(),
    name: student.name,
    email: student.email,
    phone: student.phone ?? 'N/A',
    class: student.class ?? 'Unknown',
    rollNo: student.rollNo ?? 'N/A',
    status: 'Active',
  }));

  const filteredTeachers = teachers.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredStudents = students.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button 
          className="bg-purple-600 hover:bg-purple-700"
          onClick={() => {
            setIsAddDialogOpen(true);
            setFormData(prev => ({ ...prev, userType: '' }));
          }}
        >
          <UserPlus className="size-4 mr-2" />
          Add User
        </Button>
      </div>

      <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
        setIsAddDialogOpen(open);
        if (!open) {
          // Reset form when dialog closes
          setFormData({
            userType: '',
            name: '',
            email: '',
            password: '',
            phone: '',
            address: '',
            class: '',
            rollNumber: '',
            teacherId: '',
          });
        }
      }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Fill in the details below to add a new user to the system. Select the user type and provide the required information.
            </DialogDescription>
          </DialogHeader>
            <form 
              className="space-y-4 mt-4"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!formData.userType || !formData.name || !formData.email || !formData.password) {
                  alert('Please fill in all required fields');
                  return;
                }

                setIsSubmitting(true);
                try {
                  const payload: any = {
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                    role: formData.userType as 'teacher' | 'student',
                    phone: formData.phone || undefined,
                    address: formData.address || undefined,
                  };

                  if (formData.userType === 'student') {
                    payload.class = formData.class || undefined;
                    payload.rollNumber = formData.rollNumber || undefined;
                  } else if (formData.userType === 'teacher') {
                    payload.teacherId = formData.teacherId || undefined;
                  }

                  await apiFetch('/admin/users', {
                    method: 'POST',
                    body: JSON.stringify(payload),
                  });

                  // Reset form and reload data
                  setFormData({
                    userType: '',
                    name: '',
                    email: '',
                    password: '',
                    phone: '',
                    address: '',
                    class: '',
                    rollNumber: '',
                    teacherId: '',
                  });
                  setIsAddDialogOpen(false);
                  loadData();
                  toast.success('User created successfully!');
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : 'Failed to create user');
                } finally {
                  setIsSubmitting(false);
                }
              }}
            >
              <div>
                <Label htmlFor="userType">User Type *</Label>
                <Select 
                  value={formData.userType} 
                  onValueChange={(value) => setFormData({ ...formData, userType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select user type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="teacher">Teacher</SelectItem>
                    <SelectItem value="student">Student</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input 
                  id="name" 
                  placeholder="Enter full name" 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="Enter email" 
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">Password *</Label>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="Enter password (min 6 characters)" 
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={6}
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input 
                  id="phone" 
                  type="tel" 
                  placeholder="Enter phone number" 
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Input 
                  id="address" 
                  placeholder="Enter address" 
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              {formData.userType === 'student' && (
                <>
                  <div>
                    <Label htmlFor="class">Class</Label>
                    <Input 
                      id="class" 
                      placeholder="e.g., Class 10A" 
                      value={formData.class}
                      onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="rollNumber">Roll Number</Label>
                    <Input 
                      id="rollNumber" 
                      placeholder="Enter roll number" 
                      value={formData.rollNumber}
                      onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                    />
                  </div>
                </>
              )}
              {formData.userType === 'teacher' && (
                <div>
                  <Label htmlFor="teacherId">Teacher ID</Label>
                  <Input 
                    id="teacherId" 
                    placeholder="Enter teacher ID" 
                    value={formData.teacherId}
                    onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                  />
                </div>
              )}
              <div className="flex gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1" 
                  onClick={() => {
                    setIsAddDialogOpen(false);
                    setFormData({
                      userType: '',
                      name: '',
                      email: '',
                      password: '',
                      phone: '',
                      address: '',
                      class: '',
                      rollNumber: '',
                      teacherId: '',
                    });
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Adding...' : 'Add User'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

      <Tabs defaultValue="teachers" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="teachers">Teachers ({teachers.length})</TabsTrigger>
          <TabsTrigger value="students">Students ({students.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="teachers" className="mt-6">
          <div className="mb-4 flex justify-end">
            <Button 
              className="bg-green-600 hover:bg-green-700"
              onClick={() => {
                setIsAddDialogOpen(true);
                setFormData(prev => ({ ...prev, userType: 'teacher' }));
              }}
            >
              <UserPlus className="size-4 mr-2" />
              Add Teacher
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {filteredTeachers.map((teacher) => (
              <Card key={teacher.id} className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="size-12 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-indigo-700">{teacher.name.charAt(0)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-gray-900 mb-1">{teacher.name}</h4>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="size-3" />
                          <span className="truncate">{teacher.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="size-3" />
                          <span>{teacher.phone}</span>
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-purple-50 text-purple-700 text-xs">
                          Class Teacher: {teacher.classTeacher}
                        </span>
                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-green-50 text-green-700 text-xs">
                          {teacher.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 sm:flex-col">
                    <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                      <Edit2 className="size-3 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 sm:flex-none text-red-600 border-red-200 hover:bg-red-50"
                      onClick={async () => {
                        if (!confirm(`Are you sure you want to delete ${teacher.name}?`)) return;
                        try {
                          await apiFetch(`/admin/users/${teacher.id}`, { method: 'DELETE' });
                          toast.success('Teacher deleted successfully');
                          loadData();
                        } catch (error) {
                          toast.error(error instanceof Error ? error.message : 'Failed to delete teacher');
                        }
                      }}
                    >
                      <Trash2 className="size-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="students" className="mt-6">
          <div className="mb-4 flex justify-end">
            <Button 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => {
                setIsAddDialogOpen(true);
                setFormData(prev => ({ ...prev, userType: 'student' }));
              }}
            >
              <UserPlus className="size-4 mr-2" />
              Add Student
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {filteredStudents.map((student) => (
              <Card key={student.id} className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="size-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-green-700">{student.name.charAt(0)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-gray-900 mb-1">{student.name}</h4>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="size-3" />
                          <span className="truncate">{student.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="size-3" />
                          <span>{student.phone}</span>
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs">
                          {student.class} - Roll No: {student.rollNo}
                        </span>
                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-green-50 text-green-700 text-xs">
                          {student.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 sm:flex-col">
                    <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                      <Edit2 className="size-3 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 sm:flex-none text-red-600 border-red-200 hover:bg-red-50"
                      onClick={async () => {
                        if (!confirm(`Are you sure you want to delete ${student.name}?`)) return;
                        try {
                          await apiFetch(`/admin/users/${student.id}`, { method: 'DELETE' });
                          toast.success('Student deleted successfully');
                          loadData();
                        } catch (error) {
                          toast.error(error instanceof Error ? error.message : 'Failed to delete student');
                        }
                      }}
                    >
                      <Trash2 className="size-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
