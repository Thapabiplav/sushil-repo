import { useState, useRef, useEffect } from 'react';
import type { User } from '../../App';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { UserCircle, Camera, Mail, Phone, MapPin, Calendar, Hash, Upload, Pencil, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { toast } from 'sonner';
import { uploadProfileImage, apiFetch } from '../../lib/api';

interface StudentProfileSectionProps {
  user: User;
  onUpdateUser?: (user: User) => void;
}

export function StudentProfileSection({ user, onUpdateUser }: StudentProfileSectionProps) {
  const [profileImage, setProfileImage] = useState<string | null>(user.image || null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(user.name);
  const [editPhone, setEditPhone] = useState(user.phone ?? '');
  const [editAddress, setEditAddress] = useState(user.address ?? '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => {
    if (user.image) {
      setProfileImage(user.image);
    }
  }, [user.image]);

  useEffect(() => {
    if (!isEditingProfile) {
      setEditName(user.name);
      setEditPhone(user.phone ?? '');
      setEditAddress(user.address ?? '');
    }
  }, [user.name, user.phone, user.address, isEditingProfile]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }

      // Create image preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to backend
      setIsUploading(true);
      try {
        const result = await uploadProfileImage(user.id, 'student', file);
        setProfileImage(result.image);
        
        // Update user state and localStorage
        const updatedUser = { ...user, image: result.image };
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        
        if (onUpdateUser) {
          onUpdateUser(updatedUser);
        }
        
        toast.success('Profile picture uploaded successfully!');
      } catch (error) {
        toast.error('Failed to upload profile picture. Please try again.');
        console.error('Upload error:', error);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const startEditingProfile = () => {
    setEditName(user.name);
    setEditPhone(user.phone ?? '');
    setEditAddress(user.address ?? '');
    setIsEditingProfile(true);
  };

  const cancelEditingProfile = () => {
    setIsEditingProfile(false);
    setEditName(user.name);
    setEditPhone(user.phone ?? '');
    setEditAddress(user.address ?? '');
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      toast.error('Name is required');
      return;
    }
    setIsSavingProfile(true);
    try {
      const updated = await apiFetch<{ id: number; name: string; email: string; phone: string | null; address: string | null }>(
        `/students/${user.id}/profile`,
        {
          method: 'PUT',
          body: JSON.stringify({
            name: editName.trim(),
            phone: editPhone.trim() || undefined,
            address: editAddress.trim() || undefined,
          }),
        }
      );
      const updatedUser: User = {
        ...user,
        name: updated.name,
        phone: updated.phone ?? undefined,
        address: updated.address ?? undefined,
      };
      if (onUpdateUser) {
        onUpdateUser(updatedUser);
      }
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      setIsEditingProfile(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Profile Picture Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCircle className="size-5 text-green-600" />
            Profile Picture
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <Avatar className="size-32">
                <AvatarImage src={profileImage || undefined} alt={user.name} />
                <AvatarFallback className="text-3xl bg-green-100 text-green-600">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={triggerFileInput}
                className="absolute bottom-0 right-0 p-2 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors shadow-lg"
              >
                <Camera className="size-5" />
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <div className="text-center">
              <h3 className="text-gray-900">{user.name}</h3>
              <p className="text-sm text-gray-600">{user.class}</p>
            </div>
            <Button 
              onClick={triggerFileInput} 
              variant="outline" 
              className="w-full"
              disabled={isUploading}
            >
              <Upload className="size-4 mr-2" />
              {isUploading ? 'Uploading...' : 'Change Profile Picture'}
            </Button>
            <p className="text-xs text-gray-500 text-center">
              Supported formats: JPG, PNG, GIF (Max 5MB)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Personal Information</CardTitle>
          {!isEditingProfile ? (
            <Button variant="outline" size="sm" onClick={startEditingProfile}>
              <Pencil className="size-4 mr-1" />
              Edit
            </Button>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-3">
          {isEditingProfile ? (
            <>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Full Name *</label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Your full name"
                  className="bg-white"
                />
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Hash className="size-5 text-gray-600 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-600">Roll Number</p>
                  <p className="text-gray-900">{user.rollNumber ?? '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <UserCircle className="size-5 text-gray-600 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-600">Class</p>
                  <p className="text-gray-900">{user.class ?? '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Mail className="size-5 text-gray-600 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="text-gray-900">{user.username ? `${user.username}@sushilschool.edu` : user.email}</p>
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Phone</label>
                <Input
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="e.g. 98XXXXXXXX"
                  className="bg-white"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Address</label>
                <Textarea
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  placeholder="Your address"
                  rows={3}
                  className="bg-white"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleSaveProfile}
                  disabled={isSavingProfile}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {isSavingProfile ? 'Saving...' : 'Save'}
                </Button>
                <Button variant="outline" onClick={cancelEditingProfile} disabled={isSavingProfile}>
                  <X className="size-4 mr-1" />
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <UserCircle className="size-5 text-gray-600 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-600">Full Name</p>
                  <p className="text-gray-900">{user.name}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Hash className="size-5 text-gray-600 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-600">Roll Number</p>
                  <p className="text-gray-900">{user.rollNumber ?? '—'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <UserCircle className="size-5 text-gray-600 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-600">Class</p>
                  <p className="text-gray-900">{user.class ?? '—'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Mail className="size-5 text-gray-600 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="text-gray-900">{user.username ? `${user.username}@sushilschool.edu` : user.email}</p>
                </div>
              </div>

              {(user.phone ?? '').trim() ? (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Phone className="size-5 text-gray-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="text-gray-900">{user.phone}</p>
                  </div>
                </div>
              ) : null}

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Calendar className="size-5 text-gray-600 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-600">Date of Birth</p>
                  <p className="text-gray-900">15th January, 2010</p>
                </div>
              </div>

              {(user.address ?? '').trim() ? (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <MapPin className="size-5 text-gray-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-600">Address</p>
                    <p className="text-gray-900">{user.address}</p>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>

      {/* Guardian Information */}
      <Card>
        <CardHeader>
          <CardTitle>Guardian Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <UserCircle className="size-5 text-gray-600 flex-shrink-0" />
            <div>
              <p className="text-sm text-gray-600">Father's Name</p>
              <p className="text-gray-900">Mr. Rajesh Kumar</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Phone className="size-5 text-gray-600 flex-shrink-0" />
            <div>
              <p className="text-sm text-gray-600">Father's Contact</p>
              <p className="text-gray-900">+91 98765 11111</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <UserCircle className="size-5 text-gray-600 flex-shrink-0" />
            <div>
              <p className="text-sm text-gray-600">Mother's Name</p>
              <p className="text-gray-900">Mrs. Priya Kumar</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Phone className="size-5 text-gray-600 flex-shrink-0" />
            <div>
              <p className="text-sm text-gray-600">Mother's Contact</p>
              <p className="text-gray-900">+91 98765 22222</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Academic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Academic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <UserCircle className="size-5 text-gray-600 flex-shrink-0" />
            <div>
              <p className="text-sm text-gray-600">Academic Year</p>
              <p className="text-gray-900">2025-2026</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Calendar className="size-5 text-gray-600 flex-shrink-0" />
            <div>
              <p className="text-sm text-gray-600">Admission Date</p>
              <p className="text-gray-900">1st April, 2020</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <UserCircle className="size-5 text-gray-600 flex-shrink-0" />
            <div>
              <p className="text-sm text-gray-600">Section</p>
              <p className="text-gray-900">A</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
