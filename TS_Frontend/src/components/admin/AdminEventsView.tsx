import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Calendar, Plus, MapPin, Clock, Edit2, Trash2 } from 'lucide-react';
import { apiFetch } from '../../lib/api';

interface Event {
  id: number;
  title: string;
  date: string;
  time: string;
  venue: string;
}

export function AdminEventsView() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiFetch<{ events: Event[] }>('/admin/dashboard')
      .then((data) => setEvents(data.events))
      .catch(() => setEvents([]))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return <div className="p-4 text-gray-600">Loading events...</div>;
  }

  const eventsList = events.map((event) => ({
    id: event.id.toString(),
    title: event.title,
    description: `${event.title} at ${event.venue}`,
    date: event.date,
    time: event.time,
    location: event.venue,
    type: event.title.toLowerCase().includes('sport') ? 'Sports' : 
          event.title.toLowerCase().includes('science') || event.title.toLowerCase().includes('exam') ? 'Academic' : 
          'Cultural',
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3>Events & Calendar</h3>
          <p className="text-sm text-gray-600 mt-1">Manage school events and activities</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Plus className="size-4 mr-2" />
              Add Event
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Event</DialogTitle>
            </DialogHeader>
            <form className="space-y-4 mt-4">
              <div>
                <Label htmlFor="eventTitle">Event Title</Label>
                <Input id="eventTitle" placeholder="Enter event title" />
              </div>
              <div>
                <Label htmlFor="eventDescription">Description</Label>
                <Textarea id="eventDescription" placeholder="Enter event description" rows={3} />
              </div>
              <div>
                <Label htmlFor="eventDate">Date</Label>
                <Input id="eventDate" type="date" />
              </div>
              <div>
                <Label htmlFor="eventTime">Time</Label>
                <Input id="eventTime" type="time" />
              </div>
              <div>
                <Label htmlFor="eventLocation">Location</Label>
                <Input id="eventLocation" placeholder="Enter location" />
              </div>
              <div>
                <Label htmlFor="eventType">Type</Label>
                <Input id="eventType" placeholder="e.g., Sports, Academic, Cultural" />
              </div>
              <div className="flex gap-3">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700">
                  Add Event
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {eventsList.map((event) => (
          <Card key={event.id} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="size-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calendar className="size-6 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-gray-900 mb-1">{event.title}</h4>
                  <span className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md">
                    {event.type}
                  </span>
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm">
                  <Edit2 className="size-4" />
                </Button>
                <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-4">{event.description}</p>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="size-4 text-gray-400" />
                <span>{new Date(event.date).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="size-4 text-gray-400" />
                <span>{event.time}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="size-4 text-gray-400" />
                <span>{event.location}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Calendar View Placeholder */}
      <Card className="p-6">
        <h3 className="mb-4">Calendar View</h3>
        <div className="aspect-video bg-gray-50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <Calendar className="size-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">Calendar view coming soon</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
