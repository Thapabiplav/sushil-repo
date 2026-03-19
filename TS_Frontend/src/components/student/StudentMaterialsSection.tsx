import { useEffect, useState } from 'react';
import { User } from '../../App';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { FolderOpen, Download, Eye, FileText, File } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { apiFetch } from '../../lib/api';

interface StudentMaterialsSectionProps {
  user: User;
}

interface MaterialItem {
  id: number;
  title: string;
  subject: string;
  class: string;
  type: string;
  size: string;
  uploadedByName: string;
  uploadedOn: string;
  url: string;
}

interface MaterialsResponse {
  selectedClass: string;
  classes: string[];
  subjects: string[];
  materials: MaterialItem[];
}

export function StudentMaterialsSection({ user }: StudentMaterialsSectionProps) {
  const [selectedClass, setSelectedClass] = useState('Class 10');
  const [selectedSubject, setSelectedSubject] = useState('All Subjects');
  const [data, setData] = useState<MaterialsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    apiFetch<MaterialsResponse>(`/students/${user.id}/materials`)
      .then((response) => {
        setData(response);
        setSelectedClass(response.selectedClass);
      })
      .catch((err) => setError(err.message ?? 'Failed to load study materials'))
      .finally(() => setIsLoading(false));
  }, [user.id]);

  const filteredMaterials = data?.materials.filter((material) => {
    const classMatch = selectedClass === 'All Classes' || material.class === selectedClass;
    const subjectMatch = selectedSubject === 'All Subjects' || material.subject === selectedSubject;
    return classMatch && subjectMatch;
  }) ?? [];

  const getFileIcon = (type: string) => {
    const normalized = type?.toUpperCase() ?? '';
    switch (normalized) {
      case 'PDF':
        return <FileText className="size-8 text-red-600" />;
      case 'DOCX':
        return <FileText className="size-8 text-blue-600" />;
      case 'PPTX':
        return <FileText className="size-8 text-orange-600" />;
      default:
        if (normalized.includes('PDF')) return <FileText className="size-8 text-red-600" />;
        if (normalized.includes('WORD')) return <FileText className="size-8 text-blue-600" />;
        if (normalized.includes('PPT')) return <FileText className="size-8 text-orange-600" />;
        return <File className="size-8 text-gray-600" />;
    }
  };

  const viewFile = (material: MaterialItem) => {
    window.open(material.url, '_blank', 'noopener,noreferrer');
  };

  const getFileExtension = (type: string) => {
    const t = (type ?? '').toLowerCase();
    if (t.includes('pdf')) return '.pdf';
    if (t.includes('word') || t === 'docx') return '.docx';
    if (t.includes('ppt')) return '.pptx';
    return '.pdf';
  };

  const downloadFile = async (material: MaterialItem) => {
    setDownloadingId(material.id);
    try {
      const res = await fetch(material.url, { mode: 'cors' });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const baseName = (material.title || 'material').replace(/[^a-zA-Z0-9._-]/g, '_');
      link.download = baseName + getFileExtension(material.type);
      link.rel = 'noopener noreferrer';
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      const link = document.createElement('a');
      link.href = material.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.download = (material.title || 'material').replace(/[^a-zA-Z0-9._-]/g, '_') + getFileExtension(material.type);
      link.click();
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="size-5 text-green-600" />
            Study Materials
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Class</label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Classes">All Classes</SelectItem>
                  {data?.classes.map((cls) => (
                    <SelectItem key={cls} value={cls}>
                      {cls}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Subject</label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Subjects">All Subjects</SelectItem>
                  {data?.subjects.map((subject) => (
                    <SelectItem key={subject} value={subject}>
                      {subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded">
              {error}
            </div>
          )}
          {isLoading && <p className="text-sm text-gray-500">Loading materials...</p>}

          {/* Materials List */}
          <div className="space-y-2">
            {filteredMaterials.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FolderOpen className="size-12 mx-auto mb-2 opacity-50" />
                <p>No materials found for selected filters</p>
              </div>
            ) : (
              filteredMaterials.map((material) => (
                <div key={material.id} className="p-4 bg-white rounded-lg border hover:border-green-300 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      {getFileIcon(material.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-gray-900 mb-1 line-clamp-1">{material.title}</h3>
                      <div className="flex flex-wrap gap-2 text-xs text-gray-600 mb-2">
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
                          {material.subject}
                        </span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                          {material.class}
                        </span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">
                          {material.type}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        <p>Uploaded by {material.uploadedByName} • {new Date(material.uploadedOn).toLocaleDateString()}</p>
                        <p>Size: {material.size}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button
                      onClick={() => viewFile(material)}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <Eye className="size-4 mr-1" />
                      View
                    </Button>
                    <Button
                      onClick={() => downloadFile(material)}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      disabled={downloadingId === material.id}
                    >
                      {downloadingId === material.id ? (
                        'Downloading...'
                      ) : (
                        <>
                          <Download className="size-4 mr-1" />
                          Download
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
