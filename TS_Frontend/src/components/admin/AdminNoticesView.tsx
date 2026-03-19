import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Bell, Plus, Calendar, Users, Edit2, Trash2 } from 'lucide-react';
import { apiFetch } from '../../lib/api';

interface Notice {
  id: number;
  title: string;
  content: string;
  date: string;
  type: string;
}

export function AdminNoticesView() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiFetch<{ notices: Notice[] }>('/admin/dashboard')
      .then((data) => setNotices(data.notices))
      .catch(() => setNotices([]))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return <div className="p-4 text-gray-600">Loading notices...</div>;
  }

  const noticesList = notices.map((notice) => ({
    id: notice.id.toString(),
    title: notice.title,
    description: notice.content,
    date: notice.date,
    priority: notice.type === 'Event' ? 'High' : notice.type === 'General' ? 'Medium' : 'Low',
    target: 'All',
    status: 'Active',
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3>Notices Management</h3>
          <p className="text-sm text-gray-600 mt-1">Create and manage school notices</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Plus className="size-4 mr-2" />
              Create Notice
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Notice</DialogTitle>
            </DialogHeader>
            <form className="space-y-4 mt-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input id="title" placeholder="Enter notice title" />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" placeholder="Enter notice description" rows={4} />
              </div>
              <div>
                <Label htmlFor="target">Target Audience</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select target audience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="students">Students</SelectItem>
                    <SelectItem value="teachers">Teachers</SelectItem>
                    <SelectItem value="parents">Parents</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-3">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700">
                  Publish Notice
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {noticesList.map((notice) => (
          <Card key={notice.id} className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex items-start gap-4 flex-1 min-w-0">
                <div className={`size-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  notice.priority === 'High' ? 'bg-red-100' : notice.priority === 'Medium' ? 'bg-orange-100' : 'bg-blue-100'
                }`}>
                  <Bell className={`size-6 ${
                    notice.priority === 'High' ? 'text-red-600' : notice.priority === 'Medium' ? 'text-orange-600' : 'text-blue-600'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="text-gray-900">{notice.title}</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{notice.description}</p>
                  <div className="flex flex-wrap gap-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs ${
                      notice.priority === 'High' ? 'bg-red-50 text-red-700' : 
                      notice.priority === 'Medium' ? 'bg-orange-50 text-orange-700' : 
                      'bg-blue-50 text-blue-700'
                    }`}>
                      {notice.priority} Priority
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-purple-50 text-purple-700 text-xs">
                      <Users className="size-3" />
                      {notice.target}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-gray-100 text-gray-700 text-xs">
                      <Calendar className="size-3" />
                      {new Date(notice.date).toLocaleDateString()}
                    </span>
                    <span className="inline-flex items-center px-2 py-1 rounded-md bg-green-50 text-green-700 text-xs">
                      {notice.status}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 sm:flex-col">
                <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                  <Edit2 className="size-3 mr-1" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" className="flex-1 sm:flex-none text-red-600 border-red-200 hover:bg-red-50">
                  <Trash2 className="size-3 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
