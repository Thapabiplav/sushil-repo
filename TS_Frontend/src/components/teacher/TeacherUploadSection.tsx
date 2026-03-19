import { useState, useRef } from 'react';
import type { User } from '../../App';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Upload, FileText, Eye, Trash2, File, Download, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { toast } from 'sonner';
import { useTeacherData } from './TeacherDataContext';
import { apiFetchFormData, apiFetch } from '../../lib/api';

interface TeacherUploadSectionProps {
  user: User;
  onRefresh: () => void;
}

export function TeacherUploadSection({ user, onRefresh }: TeacherUploadSectionProps) {
  const data = useTeacherData();
  const [view, setView] = useState<'upload' | 'existing'>('upload');

  if (!data || !data.materials) {
    return <div className="p-4 text-gray-500">Loading materials data...</div>;
  }
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use assigned classes and subjects for dropdowns
  const availableClasses = data.materials.assignedClasses && data.materials.assignedClasses.length > 0 
    ? data.materials.assignedClasses 
    : data.materials.classes;
  const availableSubjects = data.materials.assignedSubjects && data.materials.assignedSubjects.length > 0 
    ? data.materials.assignedSubjects 
    : data.materials.subjects;

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        toast.error('File size should be less than 50MB');
        return;
      }
      setSelectedFile(file);
      toast.success('File selected successfully!');
    }
  };

  const handleUpload = async () => {
    if (!selectedClass || !selectedSubject || !title || !selectedFile) {
      toast.error('Please fill all required fields');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('subject', selectedSubject);
      formData.append('className', selectedClass);
      formData.append(
        'size',
        `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`
      );
      formData.append('file', selectedFile);

      await apiFetchFormData(`/teachers/${user.id}/materials`, formData);
      toast.success('Study material uploaded successfully!');
      onRefresh();

      setSelectedClass('');
      setSelectedSubject('');
      setTitle('');
      setDescription('');
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to upload material');
    } finally {
      setIsUploading(false);
    }
  };

  const deleteMaterial = async (id: number) => {
    if (!confirm('Are you sure you want to delete this material?')) {
      return;
    }
    
    setIsDeleting(id);
    try {
      await apiFetch(`/teachers/${user.id}/materials/${id}`, {
        method: 'DELETE',
      });
      toast.success('Material deleted successfully!');
      onRefresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete material');
    } finally {
      setIsDeleting(null);
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'PDF':
        return <FileText className="size-8 text-red-600" />;
      case 'DOCX':
        return <FileText className="size-8 text-blue-600" />;
      case 'PPTX':
        return <FileText className="size-8 text-orange-600" />;
      default:
        return <File className="size-8 text-gray-600" />;
    }
  };

  const viewFile = (material: typeof data.materials.uploads[0]) => {
    window.open(material.url, '_blank');
  };

  const downloadFile = async (material: typeof data.materials.uploads[0]) => {
    try {
      const response = await fetch(material.url);
      if (!response.ok) {
        throw new Error('Failed to fetch file');
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = material.title || 'study-material';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
    } catch {
      // Fallback if direct download is blocked by browser/CORS
      window.open(material.url, '_blank');
    }
  };

  return (
    <div className="space-y-4">
      {/* View Toggle */}
      <div className="flex gap-2">
        <Button
          variant={view === 'upload' ? 'default' : 'outline'}
          onClick={() => setView('upload')}
          className={view === 'upload' ? 'bg-indigo-600 hover:bg-indigo-700' : ''}
        >
          <Upload className="size-4 mr-2" />
          Upload Materials
        </Button>
        <Button
          variant={view === 'existing' ? 'default' : 'outline'}
          onClick={() => setView('existing')}
          className={view === 'existing' ? 'bg-indigo-600 hover:bg-indigo-700' : ''}
        >
          <FileText className="size-4 mr-2" />
          My Materials ({data?.materials?.uploads?.length ?? 0})
        </Button>
      </div>

      {/* Upload View */}
      {view === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="size-5 text-indigo-600" />
              Upload Study Materials
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Class Selection */}
            <div>
              <label className="text-sm text-gray-600 mb-2 block">
                Class <span className="text-red-600">*</span>
              </label>
              <Select value={selectedClass} onValueChange={setSelectedClass} disabled={isUploading}>
                <SelectTrigger className={isUploading ? 'opacity-70' : ''}>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {(availableClasses ?? []).map((cls) => (
                    <SelectItem key={cls} value={cls}>
                      {cls}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Subject Selection */}
            <div>
              <label className="text-sm text-gray-600 mb-2 block">
                Subject <span className="text-red-600">*</span>
              </label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject} disabled={isUploading}>
                <SelectTrigger className={isUploading ? 'opacity-70' : ''}>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {(availableSubjects ?? []).map((subject) => (
                    <SelectItem key={subject} value={subject}>
                      {subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Title */}
            <div>
              <label className="text-sm text-gray-600 mb-2 block">
                Title <span className="text-red-600">*</span>
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Chapter 5 - Quadratic Equations"
                disabled={isUploading}
                className={isUploading ? 'opacity-70' : ''}
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-sm text-gray-600 mb-2 block">
                Description (Optional)
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the material..."
                rows={3}
                disabled={isUploading}
                className={isUploading ? 'opacity-70' : ''}
              />
            </div>

            {/* File Upload */}
            <div>
              <label className="text-sm text-gray-600 mb-2 block">
                Upload File <span className="text-red-600">*</span>
              </label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                  className="hidden"
                  disabled={isUploading}
                />
                {selectedFile ? (
                  <div className="space-y-2">
                    <FileText className="size-12 mx-auto text-indigo-600" />
                    <p className="text-gray-900">{selectedFile.name}</p>
                    <p className="text-sm text-gray-600">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      Change File
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="size-12 mx-auto text-gray-400" />
                    <p className="text-gray-600">Click to select file</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      Browse Files
                    </Button>
                    <p className="text-xs text-gray-500">
                      Supported: PDF, DOCX (Max 50MB)
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Upload Button */}
            <Button
              onClick={handleUpload}
              disabled={isUploading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 disabled:pointer-events-none"
            >
              {isUploading ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="size-4 mr-2" />
                  Upload Material
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Existing Materials View */}
      {view === 'existing' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="size-5 text-indigo-600" />
              My Uploaded Materials
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(data?.materials?.uploads?.length ?? 0) === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="size-12 mx-auto mb-2 opacity-50" />
                <p>No materials uploaded yet</p>
              </div>
            ) : (
              (data?.materials?.uploads ?? []).map((material) => (
                <div key={material.id} className="p-4 bg-white rounded-lg border">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      {getFileIcon(material.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-gray-900 mb-1 line-clamp-1">{material.title}</h3>
                      <div className="flex flex-wrap gap-2 text-xs mb-2">
                        <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded">
                          {material.subject}
                        </span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                          {material.class}
                        </span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">
                          {material.type}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>Size: {material.size}</p>
                        <p>Uploaded: {new Date(material.uploadedOn).toLocaleDateString()}</p>
                        <p>Uploaded By: {material.uploadedByName}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => viewFile(material)}
                    >
                      <Eye className="size-4 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => downloadFile(material)}
                    >
                      <Download className="size-4 mr-1" />
                      Download
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-red-600 border-red-600 hover:bg-red-50"
                      onClick={() => deleteMaterial(material.id)}
                      disabled={isDeleting === material.id}
                    >
                      <Trash2 className="size-4 mr-1" />
                      {isDeleting === material.id ? 'Deleting...' : 'Delete'}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
