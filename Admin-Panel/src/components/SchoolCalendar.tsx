import { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Calendar as CalendarIcon, 
  Edit, 
  Trash2, 
  Filter,
  Download,
  Upload,
  X,
  Save,
  Clock,
  Users,
  FileText,
  Image as ImageIcon,
  Globe
} from 'lucide-react';
import { adToBs, bsToAd, formatNepaliDate, getNepaliMonthName, getNepaliDayName, getDaysInNepaliMonth, type NepaliDate } from '../lib/nepaliDateConverter';
import { useThemeStyles } from './useThemeStyles';
import { API_BASE_URL } from '../lib/api';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  startTime?: string;
  endTime?: string;
  category: string;
  categoryColor: string;
  isFullDay: boolean;
  isRepeat: boolean;
  repeatType?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  repeatEndDate?: string;
  targetAudience: string[];
  classes?: string[];
  image?: string;
  createdAt: string;
  updatedAt?: string;
}

interface Category {
  id: string;
  name: string;
  color: string;
  enabled: boolean;
}

export function SchoolCalendar() {
  const theme = useThemeStyles();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day' | 'year'>('month');
  const [events, setEvents] = useState<Event[]>([]);
  const [categories, setCategories] = useState<Category[]>([
    { id: '1', name: 'Holiday', color: '#EF4444', enabled: true },
    { id: '2', name: 'Exam', color: '#3B82F6', enabled: true },
    { id: '3', name: 'Sports', color: '#10B981', enabled: true },
    { id: '4', name: 'Festival', color: '#F59E0B', enabled: true },
    { id: '5', name: 'Meeting', color: '#8B5CF6', enabled: true },
    { id: '6', name: 'Orientation', color: '#EC4899', enabled: true },
  ]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterAudience, setFilterAudience] = useState<string>('all');
  const [calendarType, setCalendarType] = useState<'ad' | 'bs'>('ad'); // AD or BS calendar
  const [currentNepaliDate, setCurrentNepaliDate] = useState<NepaliDate | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<Partial<Event>>({
    title: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    category: '',
    categoryColor: '',
    isFullDay: true,
    isRepeat: false,
    repeatType: 'weekly',
    repeatEndDate: '',
    targetAudience: ['all'],
    classes: [],
  });

  useEffect(() => {
    // Update Nepali date when current date changes
    setCurrentNepaliDate(adToBs(currentDate));
  }, [currentDate]);

  useEffect(() => {
    // Load events from backend
    const loadEvents = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api'}/admin/dashboard`);
        const data = await response.json();
        
        // Convert backend events to calendar format
        const backendEvents: Event[] = (data.events || []).map((event: any) => {
          const eventDate = new Date(event.date);
          const category = event.title.toLowerCase().includes('holiday') ? 'Holiday' :
                          event.title.toLowerCase().includes('exam') ? 'Exam' :
                          event.title.toLowerCase().includes('sport') ? 'Sports' :
                          event.title.toLowerCase().includes('meeting') ? 'Meeting' : 'Festival';
          
          const categoryColor = category === 'Holiday' ? '#EF4444' :
                               category === 'Exam' ? '#3B82F6' :
                               category === 'Sports' ? '#10B981' :
                               category === 'Meeting' ? '#8B5CF6' : '#F59E0B';
          
          return {
            id: event.id.toString(),
            title: event.title,
            description: event.venue || '',
            date: event.date,
            startTime: event.time || 'All Day',
            endTime: '',
            category,
            categoryColor,
            isFullDay: !event.time || event.time === 'All Day',
            isRepeat: false,
            targetAudience: ['all'],
            createdAt: event.createdAt || new Date().toISOString(),
          };
        });
        
        setEvents(backendEvents);
      } catch (error) {
        console.error('Failed to load events:', error);
        // Keep empty array on error
        setEvents([]);
      }
    };
    
    loadEvents();
  }, []);

  const saveEvents = (updatedEvents: Event[]) => {
    setEvents(updatedEvents);
    // Save to backend would go here - for now just update local state
    // In production, you'd want to call an API endpoint to save the event
  };

  const daysInMonth = calendarType === 'ad' 
    ? new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
    : currentNepaliDate ? getDaysInNepaliMonth(currentNepaliDate.year, currentNepaliDate.month) : 30;
  
  const firstDayOfMonth = calendarType === 'ad'
    ? new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay()
    : currentNepaliDate ? bsToAd({ ...currentNepaliDate, day: 1 }).getDay() : 0;
  
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];
  
  const getCurrentMonthName = () => {
    if (calendarType === 'bs' && currentNepaliDate) {
      return `${getNepaliMonthName(currentNepaliDate.month, true)} ${currentNepaliDate.year} BS`;
    }
    return `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
  };

  const previousMonth = () => {
    if (calendarType === 'bs' && currentNepaliDate) {
      let newMonth = currentNepaliDate.month - 1;
      let newYear = currentNepaliDate.year;
      if (newMonth < 0) {
        newMonth = 11;
        newYear--;
      }
      const newBsDate = { year: newYear, month: newMonth, day: 1 };
      setCurrentDate(bsToAd(newBsDate));
    } else {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    }
  };

  const nextMonth = () => {
    if (calendarType === 'bs' && currentNepaliDate) {
      let newMonth = currentNepaliDate.month + 1;
      let newYear = currentNepaliDate.year;
      if (newMonth >= 12) {
        newMonth = 0;
        newYear++;
      }
      const newBsDate = { year: newYear, month: newMonth, day: 1 };
      setCurrentDate(bsToAd(newBsDate));
    } else {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    }
  };

  const previousWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const nextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const previousDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 1);
    setCurrentDate(newDate);
  };

  const nextDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 1);
    setCurrentDate(newDate);
  };

  const previousYear = () => {
    setCurrentDate(new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), 1));
  };

  const nextYear = () => {
    setCurrentDate(new Date(currentDate.getFullYear() + 1, currentDate.getMonth(), 1));
  };

  const handleAddEvent = () => {
    if (!formData.title || !formData.date || !formData.category) {
      alert('Please fill in all required fields');
      return;
    }

    const category = categories.find(c => c.name === formData.category);
    const newEvent: Event = {
      id: Date.now().toString(),
      title: formData.title!,
      description: formData.description || '',
      date: formData.date!,
      startTime: formData.isFullDay ? undefined : formData.startTime,
      endTime: formData.isFullDay ? undefined : formData.endTime,
      category: formData.category!,
      categoryColor: category?.color || '#3B82F6',
      isFullDay: formData.isFullDay!,
      isRepeat: formData.isRepeat!,
      repeatType: formData.isRepeat ? formData.repeatType : undefined,
      repeatEndDate: formData.isRepeat ? formData.repeatEndDate : undefined,
      targetAudience: formData.targetAudience || ['all'],
      classes: formData.classes,
      image: formData.image,
      createdAt: new Date().toISOString(),
    };

    saveEvents([...events, newEvent]);
    setShowAddModal(false);
    resetForm();
  };

  const handleEditEvent = () => {
    if (!selectedEvent || !formData.title || !formData.date || !formData.category) {
      alert('Please fill in all required fields');
      return;
    }

    const category = categories.find(c => c.name === formData.category);
    const updatedEvent: Event = {
      ...selectedEvent,
      title: formData.title!,
      description: formData.description || '',
      date: formData.date!,
      startTime: formData.isFullDay ? undefined : formData.startTime,
      endTime: formData.isFullDay ? undefined : formData.endTime,
      category: formData.category!,
      categoryColor: category?.color || '#3B82F6',
      isFullDay: formData.isFullDay!,
      isRepeat: formData.isRepeat!,
      repeatType: formData.isRepeat ? formData.repeatType : undefined,
      repeatEndDate: formData.isRepeat ? formData.repeatEndDate : undefined,
      targetAudience: formData.targetAudience || ['all'],
      classes: formData.classes,
      image: formData.image,
      updatedAt: new Date().toISOString(),
    };

    const updatedEvents = events.map(e => e.id === selectedEvent.id ? updatedEvent : e);
    saveEvents(updatedEvents);
    setSelectedEvent(null);
    setShowAddModal(false);
    resetForm();
  };

  const handleDeleteEvent = (eventId: string) => {
    if (confirm('Are you sure you want to delete this event?')) {
      const updatedEvents = events.filter(e => e.id !== eventId);
      saveEvents(updatedEvents);
    }
  };

  const openEditModal = (event: Event) => {
    setSelectedEvent(event);
    setFormData({
      title: event.title,
      description: event.description,
      date: event.date,
      startTime: event.startTime || '',
      endTime: event.endTime || '',
      category: event.category,
      categoryColor: event.categoryColor,
      isFullDay: event.isFullDay,
      isRepeat: event.isRepeat,
      repeatType: event.repeatType,
      repeatEndDate: event.repeatEndDate,
      targetAudience: event.targetAudience,
      classes: event.classes,
      image: event.image,
    });
    setShowAddModal(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      date: '',
      startTime: '',
      endTime: '',
      category: '',
      categoryColor: '',
      isFullDay: true,
      isRepeat: false,
      repeatType: 'weekly',
      repeatEndDate: '',
      targetAudience: ['all'],
      classes: [],
    });
    setSelectedEvent(null);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'sushil-school/events');

      const response = await fetch(`${API_BASE_URL}/admin/upload-file`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.message || 'Failed to upload image');
      }

      const data = await response.json();
      setFormData({ ...formData, image: data.url });
    } catch (err) {
      console.error('Image upload error:', err);
      // Fallback to base64 if upload fails
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const getEventsForDate = (day: number) => {
    let dateStr: string;
    if (calendarType === 'bs' && currentNepaliDate) {
      // Convert BS date to AD for event matching
      const bsDate = { year: currentNepaliDate.year, month: currentNepaliDate.month, day };
      const adDate = bsToAd(bsDate);
      dateStr = `${adDate.getFullYear()}-${String(adDate.getMonth() + 1).padStart(2, '0')}-${String(adDate.getDate()).padStart(2, '0')}`;
    } else {
      dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
    return events.filter(event => {
      if (event.date !== dateStr) return false;
      if (filterCategory !== 'all' && event.category !== filterCategory) return false;
      if (filterAudience !== 'all' && !event.targetAudience.includes(filterAudience)) return false;
      return true;
    });
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(events, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'school_calendar_events.json';
    link.click();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const importedEvents = JSON.parse(event.target?.result as string);
          saveEvents([...events, ...importedEvents]);
          alert('Events imported successfully!');
        } catch (error) {
          alert('Error importing events. Please check the file format.');
        }
      };
      reader.readAsText(file);
    }
  };

  // Render calendar days
  const renderMonthView = () => {
    const days = [];
    
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className={`p-2 min-h-[100px] ${theme.bgColorAlt}`}></div>);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      let isToday = false;
      if (calendarType === 'bs' && currentNepaliDate) {
        const todayBs = adToBs(new Date());
        isToday = day === todayBs.day && 
                  currentNepaliDate.month === todayBs.month &&
                  currentNepaliDate.year === todayBs.year;
      } else {
        isToday = day === new Date().getDate() && 
                  currentDate.getMonth() === new Date().getMonth() &&
                  currentDate.getFullYear() === new Date().getFullYear();
      }
      const dayEvents = getEventsForDate(day);
      
      // Get AD date for BS calendar display
      let adDateDisplay = '';
      if (calendarType === 'bs' && currentNepaliDate) {
        const bsDate = { year: currentNepaliDate.year, month: currentNepaliDate.month, day };
        const adDate = bsToAd(bsDate);
        adDateDisplay = `(${adDate.getDate()}/${adDate.getMonth() + 1})`;
      }
      
      days.push(
        <div
          key={day}
          className={`p-2 min-h-[100px] border ${theme.borderColor} ${isToday ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700' : theme.bgColor} ${theme.hoverColor} transition-colors`}
        >
          <div className={`mb-1 ${isToday ? 'text-blue-600 dark:text-blue-400 font-semibold' : theme.textColor}`}>
            {day}
            {calendarType === 'bs' && adDateDisplay && (
              <span className={`text-xs ${theme.subtextColor} ml-1`}>{adDateDisplay}</span>
            )}
          </div>
          <div className="space-y-1">
            {dayEvents.slice(0, 3).map((event) => (
              <div
                key={event.id}
                className="text-xs px-2 py-1 rounded cursor-pointer hover:opacity-80 transition-opacity"
                style={{ backgroundColor: event.categoryColor + '20', color: event.categoryColor }}
                onClick={() => openEditModal(event)}
              >
                {event.title}
              </div>
            ))}
            {dayEvents.length > 3 && (
              <div className="text-xs text-gray-500 px-2">
                +{dayEvents.length - 3} more
              </div>
            )}
          </div>
        </div>
      );
    }
    
    return days;
  };

  const renderWeekView = () => {
    const weekStart = new Date(currentDate);
    weekStart.setDate(currentDate.getDate() - currentDate.getDay());
    const days = [];
    
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(weekStart);
      dayDate.setDate(weekStart.getDate() + i);
      const dateStr = `${dayDate.getFullYear()}-${String(dayDate.getMonth() + 1).padStart(2, '0')}-${String(dayDate.getDate()).padStart(2, '0')}`;
      const dayEvents = events.filter(event => {
        if (event.date !== dateStr) return false;
        if (filterCategory !== 'all' && event.category !== filterCategory) return false;
        if (filterAudience !== 'all' && !event.targetAudience.includes(filterAudience)) return false;
        return true;
      });
      const isToday = dayDate.toDateString() === new Date().toDateString();
      
      days.push(
        <div
          key={i}
          className={`p-3 min-h-[200px] border ${theme.borderColor} ${isToday ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700' : theme.bgColor} ${theme.hoverColor} transition-colors`}
        >
          <div className={`mb-2 font-semibold ${isToday ? 'text-blue-600 dark:text-blue-400' : theme.textColor}`}>
            {dayDate.getDate()}
          </div>
          <div className="space-y-1">
            {dayEvents.map((event) => (
              <div
                key={event.id}
                className="text-xs px-2 py-1 rounded cursor-pointer hover:opacity-80 transition-opacity"
                style={{ backgroundColor: event.categoryColor + '20', color: event.categoryColor }}
                onClick={() => openEditModal(event)}
              >
                {event.title}
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    return days;
  };

  const renderDayView = () => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
    const dayEvents = events.filter(event => {
      if (event.date !== dateStr) return false;
      if (filterCategory !== 'all' && event.category !== filterCategory) return false;
      if (filterAudience !== 'all' && !event.targetAudience.includes(filterAudience)) return false;
      return true;
    });

    const hours = Array.from({ length: 24 }, (_, i) => i);
    
    return (
      <div className="space-y-2">
        {hours.map((hour) => {
          const hourEvents = dayEvents.filter(event => {
            if (event.isFullDay) return false;
            const eventStart = event.startTime ? parseInt(event.startTime.split(':')[0]) : 0;
            return eventStart === hour;
          });
          
          return (
            <div key={hour} className={`flex border-b ${theme.borderColor} pb-2`}>
              <div className={`w-20 text-sm ${theme.subtextColor} font-medium`}>
                {hour.toString().padStart(2, '0')}:00
              </div>
              <div className="flex-1 space-y-2">
                {hourEvents.map((event) => (
                  <div
                    key={event.id}
                    className="p-3 rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: event.categoryColor + '20', borderLeft: `4px solid ${event.categoryColor}` }}
                    onClick={() => openEditModal(event)}
                  >
                    <div className="font-semibold" style={{ color: event.categoryColor }}>
                      {event.title}
                    </div>
                    {event.startTime && event.endTime && (
                      <div className={`text-xs ${theme.subtextColor} mt-1`}>
                        {event.startTime} - {event.endTime}
                      </div>
                    )}
                    {event.description && (
                      <div className={`text-sm ${theme.textColor} mt-1`}>{event.description}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {dayEvents.filter(e => e.isFullDay).map((event) => (
          <div
            key={event.id}
            className="p-3 rounded-lg cursor-pointer hover:opacity-80 transition-opacity border-l-4"
            style={{ backgroundColor: event.categoryColor + '20', borderLeftColor: event.categoryColor }}
            onClick={() => openEditModal(event)}
          >
            <div className="font-semibold" style={{ color: event.categoryColor }}>
              {event.title} (All Day)
            </div>
            {event.description && (
              <div className={`text-sm ${theme.textColor} mt-1`}>{event.description}</div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderYearMonthView = (monthIndex: number) => {
    const monthDate = new Date(currentDate.getFullYear(), monthIndex, 1);
    const firstDay = monthDate.getDay();
    const daysInMonth = new Date(currentDate.getFullYear(), monthIndex + 1, 0).getDate();
    const days = [];
    
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="text-center"></div>);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentDate.getFullYear()}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayEvents = events.filter(e => e.date === dateStr);
      const hasEvent = dayEvents.length > 0;
      
      days.push(
        <div
          key={day}
          className={`text-center text-xs p-1 ${hasEvent ? 'bg-blue-100 rounded' : ''}`}
        >
          {day}
        </div>
      );
    }
    
    return days;
  };

  return (
    <>
      <div className="mb-8">
        <h1 className={`${theme.textColor} mb-2`}>School Calendar</h1>
        <p className={theme.subtextColor}>Manage school events, holidays, exams, and activities</p>
      </div>

      {/* Controls */}
      <div className={`${theme.cardBg} rounded-xl p-6 shadow-sm border ${theme.borderColor} mb-6`}>
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={
                view === 'month' ? previousMonth :
                view === 'week' ? previousWeek :
                view === 'day' ? previousDay :
                previousYear
              }
              className={`p-2 ${theme.hoverColor} rounded-lg transition-colors`}
            >
              <ChevronLeft className={`w-5 h-5 ${theme.subtextColor}`} />
            </button>
            <h2 className={`${theme.textColor} min-w-[180px] text-center`}>
              {view === 'year' 
                ? (calendarType === 'bs' && currentNepaliDate ? currentNepaliDate.year.toString() + ' BS' : currentDate.getFullYear().toString())
                : view === 'day'
                ? (calendarType === 'bs' 
                    ? `${currentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} (${formatNepaliDate(currentDate, true)})`
                    : currentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }))
                : getCurrentMonthName()
              }
            </h2>
            <button
              onClick={
                view === 'month' ? nextMonth :
                view === 'week' ? nextWeek :
                view === 'day' ? nextDay :
                nextYear
              }
              className={`p-2 ${theme.hoverColor} rounded-lg transition-colors`}
            >
              <ChevronRight className={`w-5 h-5 ${theme.subtextColor}`} />
            </button>
          </div>

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setView('month')}
              className={`px-4 py-2 rounded-lg transition-colors ${view === 'month' ? 'bg-blue-600 text-white' : `${theme.bgColorAlt} ${theme.textColor} ${theme.hoverColor}`}`}
            >
              Month
            </button>
            <button
              onClick={() => setView('week')}
              className={`px-4 py-2 rounded-lg transition-colors ${view === 'week' ? 'bg-blue-600 text-white' : `${theme.bgColorAlt} ${theme.textColor} ${theme.hoverColor}`}`}
            >
              Week
            </button>
            <button
              onClick={() => setView('day')}
              className={`px-4 py-2 rounded-lg transition-colors ${view === 'day' ? 'bg-blue-600 text-white' : `${theme.bgColorAlt} ${theme.textColor} ${theme.hoverColor}`}`}
            >
              Day
            </button>
            <button
              onClick={() => setView('year')}
              className={`px-4 py-2 rounded-lg transition-colors ${view === 'year' ? 'bg-blue-600 text-white' : `${theme.bgColorAlt} ${theme.textColor} ${theme.hoverColor}`}`}
            >
              Year
            </button>
            <button
              onClick={() => setCalendarType(calendarType === 'ad' ? 'bs' : 'ad')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                calendarType === 'bs' ? 'bg-green-600 text-white' : `${theme.bgColorAlt} ${theme.textColor} ${theme.hoverColor}`
              }`}
              title="Toggle between AD and BS calendar"
            >
              <Globe className="w-4 h-4" />
              <span className="hidden sm:inline">{calendarType === 'ad' ? 'AD' : 'BS'}</span>
            </button>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-wrap gap-3">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className={`px-4 py-2 border ${theme.borderColorAlt} ${theme.inputBg} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
          >
            <option value="all">All Categories</option>
            {categories.filter(c => c.enabled).map(cat => (
              <option key={cat.id} value={cat.name}>{cat.name}</option>
            ))}
          </select>

          <select
            value={filterAudience}
            onChange={(e) => setFilterAudience(e.target.value)}
            className={`px-4 py-2 border ${theme.borderColorAlt} ${theme.inputBg} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
          >
            <option value="all">All Audience</option>
            <option value="students">Students Only</option>
            <option value="teachers">Teachers Only</option>
            <option value="parents">Parents Only</option>
          </select>

          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Event
          </button>

          <button
            onClick={() => setShowCategoryModal(true)}
            className={`flex items-center gap-2 px-4 py-2 border ${theme.borderColorAlt} ${theme.inputBg} rounded-lg ${theme.hoverColor} transition-colors`}
          >
            <Filter className="w-5 h-5" />
            Manage Categories
          </button>

          <button
            onClick={handleExport}
            className={`flex items-center gap-2 px-4 py-2 border ${theme.borderColorAlt} ${theme.inputBg} rounded-lg ${theme.hoverColor} transition-colors`}
          >
            <Download className="w-5 h-5" />
            Export
          </button>

          <label className={`flex items-center gap-2 px-4 py-2 border ${theme.borderColorAlt} ${theme.inputBg} rounded-lg ${theme.hoverColor} transition-colors cursor-pointer`}>
            <Upload className="w-5 h-5" />
            Import
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
        </div>

        {/* Legend */}
        <div className={`mt-4 pt-4 border-t ${theme.borderColor}`}>
          <p className={`${theme.subtextColor} text-sm mb-2`}>Event Categories:</p>
          <div className="flex flex-wrap gap-2">
            {categories.filter(c => c.enabled).map(cat => (
              <div key={cat.id} className="flex items-center gap-2 px-3 py-1 rounded-lg" style={{ backgroundColor: cat.color + '20' }}>
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }}></div>
                <span className="text-sm" style={{ color: cat.color }}>{cat.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className={`${theme.cardBg} rounded-xl shadow-sm border ${theme.borderColor} overflow-hidden`}>
        {view === 'month' && (
          <div className="p-4">
            <div className="grid grid-cols-7 gap-1">
              {(calendarType === 'bs' 
                ? ['आइत', 'सोम', 'मंगल', 'बुध', 'बिहि', 'शुक्र', 'शनि']
                : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
              ).map((day) => (
                <div key={day} className={`p-2 text-center ${theme.subtextColor} font-semibold text-sm`}>
                  {day}
                </div>
              ))}
              {renderMonthView()}
            </div>
            {calendarType === 'bs' && currentNepaliDate && (
              <div className={`mt-4 text-center text-sm ${theme.subtextColor}`}>
                <p>AD: {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
              </div>
            )}
          </div>
        )}

        {view === 'week' && (
          <div className="p-4">
            <div className="grid grid-cols-7 gap-1">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className={`p-2 text-center ${theme.subtextColor} font-semibold border-b ${theme.borderColor}`}>
                  {day}
                </div>
              ))}
              {renderWeekView()}
            </div>
          </div>
        )}

        {view === 'day' && (
          <div className="p-4">
            <div className={`border-b ${theme.borderColor} pb-2 mb-4`}>
              <h3 className={`text-lg font-semibold ${theme.textColor}`}>
                {currentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </h3>
            </div>
            {renderDayView()}
          </div>
        )}

        {view === 'year' && (
          <div className="p-4">
            <div className="grid grid-cols-4 gap-4">
              {Array.from({ length: 12 }, (_, i) => {
                const monthDate = new Date(currentDate.getFullYear(), i, 1);
                return (
                  <div key={i} className={`border ${theme.borderColor} rounded-lg p-3`}>
                    <h4 className={`font-semibold ${theme.textColor} mb-2`}>{monthDate.toLocaleDateString('en-US', { month: 'long' })}</h4>
                    <div className="grid grid-cols-7 gap-1 text-xs">
                      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day) => (
                        <div key={day} className={`text-center ${theme.subtextColor}`}>{day}</div>
                      ))}
                      {renderYearMonthView(i)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Event Modal */}
      {showAddModal && (
        <div className={`fixed inset-0 ${theme.modalOverlay} flex items-center justify-center p-4 z-50 overflow-y-auto`}>
          <div className={`${theme.modalBg} rounded-xl p-6 max-w-2xl w-full my-8 border ${theme.borderColor}`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className={theme.textColor}>{selectedEvent ? 'Edit Event' : 'Add New Event'}</h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              {/* Title */}
              <div>
                <label className={`${theme.textColor} mb-2 block`}>Event Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className={`w-full px-4 py-2 border ${theme.borderColorAlt} ${theme.inputBg} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="Enter event title"
                />
              </div>

              {/* Description */}
              <div>
                <label className={`${theme.textColor} mb-2 block`}>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className={`w-full px-4 py-2 border ${theme.borderColorAlt} ${theme.inputBg} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  rows={3}
                  placeholder="Enter event description"
                />
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`${theme.textColor} mb-2 block`}>Date *</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className={`w-full px-4 py-2 border ${theme.borderColorAlt} ${theme.inputBg} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      checked={formData.isFullDay}
                      onChange={(e) => setFormData({ ...formData, isFullDay: e.target.checked })}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className={theme.textColor}>Full Day Event</span>
                  </label>
                </div>
              </div>

              {!formData.isFullDay && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`${theme.textColor} mb-2 block`}>Start Time</label>
                    <input
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      className={`w-full px-4 py-2 border ${theme.borderColorAlt} ${theme.inputBg} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                  </div>
                  <div>
                    <label className={`${theme.textColor} mb-2 block`}>End Time</label>
                    <input
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      className={`w-full px-4 py-2 border ${theme.borderColorAlt} ${theme.inputBg} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                  </div>
                </div>
              )}

              {/* Category */}
              <div>
                <label className={`${theme.textColor} mb-2 block`}>Event Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className={`w-full px-4 py-2 border ${theme.borderColorAlt} ${theme.inputBg} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                >
                  <option value="">Select category</option>
                  {categories.filter(c => c.enabled).map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Target Audience */}
              <div>
                <label className={`${theme.textColor} mb-2 block`}>Target Audience</label>
                <div className="space-y-2">
                  {['all', 'students', 'teachers', 'parents'].map(audience => (
                    <label key={audience} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.targetAudience?.includes(audience)}
                        onChange={(e) => {
                          const updated = e.target.checked
                            ? [...(formData.targetAudience || []), audience]
                            : (formData.targetAudience || []).filter(a => a !== audience);
                          setFormData({ ...formData, targetAudience: updated });
                        }}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className={`${theme.textColor} capitalize`}>{audience}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Classes */}
              <div>
                <label className={`${theme.textColor} mb-2 block`}>Specific Classes (Optional)</label>
                <input
                  type="text"
                  value={formData.classes?.join(', ')}
                  onChange={(e) => setFormData({ ...formData, classes: e.target.value.split(',').map(s => s.trim()) })}
                  className={`w-full px-4 py-2 border ${theme.borderColorAlt} ${theme.inputBg} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="e.g., Grade 9, Grade 10"
                />
              </div>

              {/* Repeat Event */}
              <div>
                <label className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    checked={formData.isRepeat}
                    onChange={(e) => setFormData({ ...formData, isRepeat: e.target.checked })}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className={theme.textColor}>Repeat Event</span>
                </label>

                {formData.isRepeat && (
                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <div>
                      <label className={`${theme.subtextColor} text-sm mb-2 block`}>Repeat Type</label>
                      <select
                        value={formData.repeatType}
                        onChange={(e) => setFormData({ ...formData, repeatType: e.target.value as any })}
                        className={`w-full px-4 py-2 border ${theme.borderColorAlt} ${theme.inputBg} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                    </div>
                    <div>
                      <label className={`${theme.subtextColor} text-sm mb-2 block`}>End Date</label>
                      <input
                        type="date"
                        value={formData.repeatEndDate}
                        onChange={(e) => setFormData({ ...formData, repeatEndDate: e.target.value })}
                        className={`w-full px-4 py-2 border ${theme.borderColorAlt} ${theme.inputBg} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Image Upload */}
              <div>
                <label className={`${theme.textColor} mb-2 block`}>Event Image (Optional)</label>
                {formData.image ? (
                  <div className="relative">
                    <img src={formData.image} alt="Event" className="w-full h-40 object-cover rounded-lg" />
                    <button
                      onClick={() => setFormData({ ...formData, image: undefined })}
                      className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed ${theme.borderColorAlt} rounded-lg cursor-pointer ${theme.hoverColor}`}>
                    <ImageIcon className={`w-8 h-8 ${theme.subtextColor} mb-2`} />
                    <span className={`${theme.subtextColor} text-sm`}>Click to upload image</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={selectedEvent ? handleEditEvent : handleAddEvent}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Save className="w-5 h-5" />
                {selectedEvent ? 'Update Event' : 'Add Event'}
              </button>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className={`flex-1 px-4 py-3 border ${theme.borderColorAlt} rounded-lg ${theme.hoverColor} transition-colors ${theme.textColor}`}
              >
                Cancel
              </button>
            </div>

            {selectedEvent && (
              <button
                onClick={() => {
                  handleDeleteEvent(selectedEvent.id);
                  setShowAddModal(false);
                }}
                className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
                Delete Event
              </button>
            )}
          </div>
        </div>
      )}

      {/* Category Management Modal */}
      {showCategoryModal && (
        <div className={`fixed inset-0 ${theme.modalOverlay} flex items-center justify-center p-4 z-50`}>
          <div className={`${theme.modalBg} rounded-xl p-6 max-w-md w-full border ${theme.borderColor}`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className={theme.textColor}>Manage Categories</h2>
              <button
                onClick={() => setShowCategoryModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-3">
              {categories.map(cat => (
                <div key={cat.id} className={`flex items-center justify-between p-3 ${theme.bgColorAlt} rounded-lg`}>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded" style={{ backgroundColor: cat.color }}></div>
                    <span className={theme.textColor}>{cat.name}</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cat.enabled}
                      onChange={(e) => {
                        const updated = categories.map(c =>
                          c.id === cat.id ? { ...c, enabled: e.target.checked } : c
                        );
                        setCategories(updated);
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowCategoryModal(false)}
              className="w-full mt-6 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
}
