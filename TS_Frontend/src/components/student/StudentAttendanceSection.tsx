import { useEffect, useRef, useState } from 'react';
import { User } from '../../App';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Camera, MapPin, CheckCircle, X, Calendar as CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch, apiFetchFormData } from '../../lib/api';

interface StudentAttendanceSectionProps {
  user: User;
}

interface AttendanceSummary {
  month: string;
  present: number;
  absent: number;
  total: number;
  percentage: number;
}

interface AttendanceRecordItem {
  date: string;
  status: 'Present' | 'Absent';
  time: string;
  location: string;
}

interface AttendanceResponse {
  summary: AttendanceSummary[];
  records: AttendanceRecordItem[];
}

export function StudentAttendanceSection({ user }: StudentAttendanceSectionProps) {
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [location, setLocation] = useState<string | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [attendanceData, setAttendanceData] = useState<AttendanceResponse | null>(null);
  const [isFetchingAttendance, setIsFetchingAttendance] = useState(true);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    loadAttendance();
  }, [user.id]);

  const loadAttendance = () => {
    setIsFetchingAttendance(true);
    setAttendanceError(null);
    apiFetch<AttendanceResponse>(`/students/${user.id}/attendance`)
      .then((data) => setAttendanceData(data))
      .catch((err) => setAttendanceError(err.message ?? 'Failed to load attendance'))
      .finally(() => setIsFetchingAttendance(false));
  };

  const getCurrentLocation = () => {
    setIsLoadingLocation(true);
    
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
          setIsLoadingLocation(false);
          toast.success('Location captured successfully!');
        },
        (error) => {
          setIsLoadingLocation(false);
          toast.error('Failed to get location. Please enable location services.');
          console.error('Location error:', error);
        }
      );
    } else {
      setIsLoadingLocation(false);
      toast.error('Geolocation is not supported by your browser.');
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' },
        audio: false 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setShowCamera(true);
      }
    } catch (error) {
      toast.error('Failed to access camera. Please grant camera permission.');
      console.error('Camera error:', error);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageData = canvas.toDataURL('image/jpeg');
        setCapturedImage(imageData);
        stopCamera();
        toast.success('Photo captured successfully!');
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera();
  };

  const submitAttendance = async () => {
    if (!capturedImage) {
      toast.error('Please capture a photo first.');
      return;
    }
    if (!location) {
      toast.error('Please enable location first.');
      return;
    }

    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append('location', location);
      const blob = await (await fetch(capturedImage)).blob();
      formData.append('photo', blob, 'attendance.jpg');

      await apiFetchFormData(`/students/${user.id}/attendance`, formData);
      toast.success('Attendance marked successfully!');
      setCapturedImage(null);
      setLocation(null);
      loadAttendance();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to submit attendance');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Mark Today's Attendance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="size-5 text-green-600" />
            Mark Today's Attendance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              Capture your photo and enable location to mark attendance
            </p>

            {/* Camera Section */}
            {!capturedImage && !showCamera && (
              <Button onClick={startCamera} className="w-full bg-green-600 hover:bg-green-700">
                <Camera className="size-5 mr-2" />
                Open Camera
              </Button>
            )}

            {showCamera && (
              <div className="space-y-4">
                <div className="relative rounded-lg overflow-hidden bg-black">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full max-h-96 object-contain"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={capturePhoto} className="flex-1 bg-green-600 hover:bg-green-700">
                    <Camera className="size-5 mr-2" />
                    Capture Photo
                  </Button>
                  <Button onClick={stopCamera} variant="outline" className="flex-1">
                    <X className="size-5 mr-2" />
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {capturedImage && (
              <div className="space-y-4">
                <div className="relative rounded-lg overflow-hidden border">
                  <img src={capturedImage} alt="Captured" className="w-full max-h-96 object-contain" />
                </div>
                <Button onClick={retakePhoto} variant="outline" className="w-full">
                  <Camera className="size-5 mr-2" />
                  Retake Photo
                </Button>
              </div>
            )}

            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Location Section */}
          <div className="pt-4 border-t">
            <Button
              onClick={getCurrentLocation}
              disabled={isLoadingLocation}
              variant="outline"
              className="w-full"
            >
              <MapPin className="size-5 mr-2" />
              {isLoadingLocation ? 'Getting Location...' : location ? 'Location Captured' : 'Enable Location'}
            </Button>
            {location && (
              <div className="mt-2 p-2 bg-green-50 rounded text-sm text-green-700 flex items-center gap-2">
                <CheckCircle className="size-4" />
                Location: {location}
              </div>
            )}
          </div>

          {/* Submit Button */}
          {(capturedImage || location) && (
            <Button
              onClick={submitAttendance}
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={!capturedImage || !location || isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Attendance'}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Attendance Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="size-5 text-green-600" />
            My Attendance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {attendanceError && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded">
              {attendanceError}
            </div>
          )}
          {isFetchingAttendance && (
            <p className="text-sm text-gray-500">Loading attendance summary...</p>
          )}
          {!isFetchingAttendance && attendanceData && (
            <>
              {attendanceData.summary.map((month, idx) => (
                <div key={idx} className="p-4 bg-gray-50 rounded-lg border">
                  <h3 className="text-gray-900 mb-3">{month.month}</h3>
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div className="text-center">
                      <p className="text-2xl text-green-600">{month.present}</p>
                      <p className="text-xs text-gray-600">Present</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl text-red-600">{month.absent}</p>
                      <p className="text-xs text-gray-600">Absent</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl text-blue-600">{month.total}</p>
                      <p className="text-xs text-gray-600">Total</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${month.percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-700">{month.percentage}%</span>
                  </div>
                </div>
              ))}

              <div className="space-y-2">
                <h3 className="text-gray-900">Recent Records</h3>
                {attendanceData.records.map((record, idx) => (
                  <div
                    key={`${record.date}-${idx}`}
                    className={`p-3 rounded-lg border ${
                      record.status === 'Present'
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-900">{new Date(record.date).toLocaleDateString()}</p>
                        <p className="text-sm text-gray-600">
                          {record.time} {record.location !== '-' && `• ${record.location}`}
                        </p>
                      </div>
                      <span
                        className={`text-sm px-3 py-1 rounded-full ${
                          record.status === 'Present'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {record.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
