import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Plus, Users, User, Edit2, Trash2 } from 'lucide-react';
import { apiFetch } from '../../lib/api';

interface ClassAssignment {
  id: number;
  name: string;
  subject: string;
  students: number;
  schedule: string;
}

export function AdminClassesView() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [classes, setClasses] = useState<ClassAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiFetch<{ classes: ClassAssignment[]; students: Array<{ class?: string | null }>; teachers: Array<{ name: string; classes: string[] }> }>('/admin/dashboard')
      .then((data) => {
        setClasses(data.classes);
        // Group students by class to get student counts
        const classCounts = new Map<string, number>();
        data.students.forEach((student) => {
          const className = student.class ?? 'Unknown';
          classCounts.set(className, (classCounts.get(className) ?? 0) + 1);
        });
        // Map classes with student counts and teachers
        const classesWithDetails = data.classes.map((cls) => {
          const teacher = data.teachers.find((t) => t.classes.includes(cls.name));
          return {
            ...cls,
            students: classCounts.get(cls.name) ?? 0,
            classTeacher: teacher?.name ?? '-',
            subjects: [cls.subject],
          };
        });
        setClasses(classesWithDetails as any);
      })
      .catch(() => setClasses([]))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return <div className="p-4 text-gray-600">Loading classes...</div>;
  }

  const classesList = classes.map((classItem: any) => ({
    id: classItem.id.toString(),
    name: classItem.name,
    students: classItem.students ?? 0,
    classTeacher: classItem.classTeacher ?? '-',
    subjects: classItem.subjects ?? [classItem.subject],
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3>Classes Management</h3>
          <p className="text-sm text-gray-600 mt-1">Manage all classes in your school</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Plus className="size-4 mr-2" />
              Add Class
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Class</DialogTitle>
            </DialogHeader>
            <form className="space-y-4 mt-4">
              <div>
                <Label htmlFor="className">Class Name</Label>
                <Input id="className" placeholder="e.g., Class 10A" />
              </div>
              <div>
                <Label htmlFor="classTeacher">Class Teacher</Label>
                <Input id="classTeacher" placeholder="Select class teacher" />
              </div>
              <div>
                <Label htmlFor="capacity">Maximum Capacity</Label>
                <Input id="capacity" type="number" placeholder="Enter maximum students" />
              </div>
              <div className="flex gap-3">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700">
                  Add Class
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {classesList.map((classItem) => (
          <Card key={classItem.id} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="size-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Users className="size-6 text-purple-600" />
                </div>
                <div>
                  <h4 className="text-gray-900">{classItem.name}</h4>
                  <p className="text-sm text-gray-600">{classItem.students} students</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm">
                  <Edit2 className="size-4" />
                </Button>
                <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <User className="size-4 text-gray-400" />
                <span className="text-gray-600">Class Teacher:</span>
                <span className="text-gray-900">{classItem.classTeacher}</span>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-2">Subjects:</p>
                <div className="flex flex-wrap gap-2">
                  {classItem.subjects.map((subject, index) => (
                    <span key={index} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md">
                      {subject}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-gray-200">
                <Button variant="outline" className="w-full" size="sm">
                  View Details
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
