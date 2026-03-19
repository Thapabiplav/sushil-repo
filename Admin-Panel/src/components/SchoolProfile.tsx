import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { useSchoolSettings } from './SchoolSettingsContext';
import { useThemeStyles } from './useThemeStyles';
import { apiFetch, API_BASE_URL } from '../lib/api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Edit, Upload, X } from 'lucide-react';

interface SchoolProfileData {
  name: string;
  motto: string;
  email: string;
  phone: string;
  telephone: string;
  website: string;
  address: string;
  established: string;
  principal: string;
  totalStudents: string;
  totalTeachers: string;
  totalClasses: string;
  description: string;
  registrationNumber: string;
  panNumber: string;
  contactPerson: string;
  alternatePhone: string;
  fax: string;
  schoolLogo?: string | null;
  loginBackground?: string | null;
  profileBackground?: string | null;
  backgroundImages: string[];
  socialMedia: {
    facebook: string;
    twitter: string;
    linkedin: string;
    instagram: string;
  };
}

export function SchoolProfile() {
  const theme = useThemeStyles();
  const { settings, updateSettings } = useSchoolSettings();
  const [isEditing, setIsEditing] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const backgroundInputRef = useRef<HTMLInputElement>(null);
  const profileBackgroundInputRef = useRef<HTMLInputElement>(null);
  const multipleBackgroundInputRef = useRef<HTMLInputElement>(null);
  
  const [pendingLogo, setPendingLogo] = useState<string | null>(null);
  const [pendingBackground, setPendingBackground] = useState<string | null>(null);
  const [pendingProfileBackground, setPendingProfileBackground] = useState<string | null>(null);
  
  const [profileData, setProfileData] = useState<SchoolProfileData>({
    name: '',
    motto: '',
    email: '',
    phone: '',
    telephone: '',
    website: '',
    address: '',
    established: '',
    principal: '',
    totalStudents: '0',
    totalTeachers: '0',
    totalClasses: '0',
    description: '',
    registrationNumber: '',
    panNumber: '',
    contactPerson: '',
    alternatePhone: '',
    fax: '',
    schoolLogo: null,
    loginBackground: null,
    profileBackground: null,
    backgroundImages: [],
    socialMedia: {
      facebook: '',
      twitter: '',
      linkedin: '',
      instagram: '',
    },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSchoolProfile();
  }, []);

  const loadSchoolProfile = async () => {
    setIsLoading(true);
    try {
      const data = await apiFetch<SchoolProfileData>('/admin/school-profile');
      setProfileData({ ...profileData, ...data });
      
      // Update settings context with loaded data
      const settingsUpdate: any = {};
      if (data.name) {
        settingsUpdate.schoolName = data.name;
      }
      if (data.schoolLogo) {
        settingsUpdate.schoolLogo = data.schoolLogo;
      }
      if (data.loginBackground) {
        settingsUpdate.loginBackground = data.loginBackground;
      }
      if (data.profileBackground) {
        settingsUpdate.profileBackground = data.profileBackground;
      }
      updateSettings(settingsUpdate);
    } catch (err) {
      toast.error('Failed to load school profile');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const validateEmail = (email: string): boolean => {
    if (!email) return true; // Optional field
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    if (!phone) return true; // Optional field
    const phoneRegex = /^[\d\s\-+()]+$/;
    return phoneRegex.test(phone);
  };

  const validateYear = (year: string): boolean => {
    if (!year) return true; // Optional field
    const yearNum = parseInt(year, 10);
    if (isNaN(yearNum)) return false;
    const currentYear = new Date().getFullYear();
    return yearNum >= 1800 && yearNum <= currentYear;
  };

  // Helper function to check if a value is a base64 image
  const isBase64Image = (value: string | null | undefined): boolean => {
    if (!value) return false;
    return value.startsWith('data:image/') && value.includes('base64,');
  };

  // Helper function to upload base64 image to Cloudinary
  const uploadBase64ToCloudinary = async (base64Data: string): Promise<string> => {
    // Convert base64 to blob
    const response = await fetch(base64Data);
    const blob = await response.blob();
    
    const formData = new FormData();
    formData.append('file', blob, 'image.jpg');
    formData.append('folder', 'sushil-school/profile');

    const uploadResponse = await fetch(`${API_BASE_URL}/admin/upload-file`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`,
      },
      body: formData,
    });

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload image to Cloudinary');
    }

    const data = await uploadResponse.json();
    return data.url;
  };

  const handleSave = async () => {
    // Validation
    if (!profileData.name || profileData.name.trim() === '') {
      toast.error('School name is required');
      return;
    }

    if (profileData.email && !validateEmail(profileData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (profileData.phone && !validatePhone(profileData.phone)) {
      toast.error('Please enter a valid phone number');
      return;
    }

    if (profileData.telephone && !validatePhone(profileData.telephone)) {
      toast.error('Please enter a valid telephone number');
      return;
    }

    if (profileData.established && !validateYear(profileData.established)) {
      toast.error('Please enter a valid year (1800-present)');
      return;
    }

    setIsSaving(true);
    try {
      // Upload any base64 images to Cloudinary first
      const dataToSave = { ...profileData };
      
      // Upload school logo if base64
      if (isBase64Image(dataToSave.schoolLogo)) {
        toast.info('Uploading school logo to Cloudinary...');
        dataToSave.schoolLogo = await uploadBase64ToCloudinary(dataToSave.schoolLogo!);
      }
      
      // Upload login background if base64
      if (isBase64Image(dataToSave.loginBackground)) {
        toast.info('Uploading login background to Cloudinary...');
        dataToSave.loginBackground = await uploadBase64ToCloudinary(dataToSave.loginBackground!);
      }
      
      // Upload profile background if base64
      if (isBase64Image(dataToSave.profileBackground)) {
        toast.info('Uploading profile background to Cloudinary...');
        dataToSave.profileBackground = await uploadBase64ToCloudinary(dataToSave.profileBackground!);
      }
      
      // Upload background images if they are base64
      if (dataToSave.backgroundImages && dataToSave.backgroundImages.length > 0) {
        const uploadedImages: string[] = [];
        for (const img of dataToSave.backgroundImages) {
          if (isBase64Image(img)) {
            toast.info('Uploading gallery image to Cloudinary...');
            const cloudinaryUrl = await uploadBase64ToCloudinary(img);
            uploadedImages.push(cloudinaryUrl);
          } else {
            uploadedImages.push(img);
          }
        }
        dataToSave.backgroundImages = uploadedImages;
      }

      // Save to database
      const updatedProfile = await apiFetch<SchoolProfileData>('/admin/school-profile', {
        method: 'PUT',
        body: JSON.stringify(dataToSave),
      });
      
      setProfileData(updatedProfile);
      
      // Update settings context with Cloudinary URLs only
      const settingsUpdate: any = {};
      if (updatedProfile.name) {
        settingsUpdate.schoolName = updatedProfile.name;
      }
      if (updatedProfile.schoolLogo) {
        settingsUpdate.schoolLogo = updatedProfile.schoolLogo;
      }
      if (updatedProfile.loginBackground) {
        settingsUpdate.loginBackground = updatedProfile.loginBackground;
      }
      if (updatedProfile.profileBackground) {
        settingsUpdate.profileBackground = updatedProfile.profileBackground;
      }
      updateSettings(settingsUpdate);
      
      toast.success('School profile saved successfully!');
      setIsEditing(false);
    } catch (err) {
      console.error('Save error:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to save school profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setPendingLogo(null);
    setPendingBackground(null);
    setPendingProfileBackground(null);
    loadSchoolProfile(); // Reload original data
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error('Logo file size should be less than 5MB');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'sushil-school/logo');

      const response = await fetch(`${API_BASE_URL}/admin/upload-file`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.message || 'Failed to upload logo');
      }

      const data = await response.json();
      setPendingLogo(data.url);
      setProfileData({ ...profileData, schoolLogo: data.url });
      toast.success('Logo uploaded successfully');
    } catch (err) {
      console.error('Logo upload error:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to upload logo');
    }
  };

  const handleBackgroundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error('Background file size should be less than 10MB');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'sushil-school/backgrounds');

      const response = await fetch(`${API_BASE_URL}/admin/upload-file`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.message || 'Failed to upload background');
      }

      const data = await response.json();
      setPendingBackground(data.url);
      setProfileData({ ...profileData, loginBackground: data.url });
      toast.success('Background uploaded successfully');
    } catch (err) {
      console.error('Background upload error:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to upload background');
    }
  };

  const handleProfileBackgroundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error('Background file size should be less than 10MB');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'sushil-school/profile-background');

      const response = await fetch(`${API_BASE_URL}/admin/upload-file`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.message || 'Failed to upload profile background');
      }

      const data = await response.json();
      setPendingProfileBackground(data.url);
      setProfileData({ ...profileData, profileBackground: data.url });
      toast.success('Profile background uploaded successfully');
    } catch (err) {
      console.error('Profile background upload error:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to upload profile background');
    }
  };

  const handleMultipleBackgroundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const fileArray = Array.from(files);
    
    // Validate total number
    if (profileData.backgroundImages.length + fileArray.length > 10) {
      toast.error('Maximum 10 background images allowed');
      return;
    }

    // Validate file sizes
    for (const file of fileArray) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Each background file should be less than 10MB');
        return;
      }
    }

    try {
      const uploadPromises = fileArray.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'sushil-school/gallery');

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
        return data.url;
      });

      const results = await Promise.all(uploadPromises);
      setProfileData({
        ...profileData,
        backgroundImages: [...profileData.backgroundImages, ...results]
      });
      toast.success(`${results.length} image(s) added`);
    } catch (err) {
      console.error('Gallery upload error:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to upload images');
    }
  };

  const handleRemoveBackgroundImage = (index: number) => {
    const newImages = profileData.backgroundImages.filter((_, i) => i !== index);
    setProfileData({ ...profileData, backgroundImages: newImages });
    toast.success('Background image removed');
  };

  const handleRemoveLogo = () => {
    setPendingLogo(null);
    setProfileData({ ...profileData, schoolLogo: null });
  };

  const handleRemoveBackground = () => {
    setPendingBackground(null);
    setProfileData({ ...profileData, loginBackground: null });
  };

  const handleRemoveProfileBackground = () => {
    setPendingProfileBackground(null);
    setProfileData({ ...profileData, profileBackground: null });
  };

  // Only update settings if we have actual Cloudinary URLs (not base64)
  const handleUpdateSettings = () => {
    if (pendingLogo !== null && !isBase64Image(pendingLogo)) {
      updateSettings({ schoolLogo: pendingLogo });
      setPendingLogo(null);
    }
    if (pendingBackground !== null && !isBase64Image(pendingBackground)) {
      updateSettings({ loginBackground: pendingBackground });
      setPendingBackground(null);
    }
    if (pendingProfileBackground !== null && !isBase64Image(pendingProfileBackground)) {
      updateSettings({ profileBackground: pendingProfileBackground });
      setPendingProfileBackground(null);
    }
  };

  const hasChanges =
    pendingLogo !== null || pendingBackground !== null || pendingProfileBackground !== null;
  const displayLogo = pendingLogo || profileData.schoolLogo || settings.schoolLogo;
  const displayBackground = pendingLogo || profileData.loginBackground || settings.loginBackground;
  const displayProfileBackground = pendingProfileBackground || profileData.profileBackground || settings.profileBackground;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Loading school profile...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-4 sm:mb-6 lg:mb-8">
        <h1 className={`${theme.textColor} mb-2 text-xl sm:text-2xl lg:text-3xl`}>School Profile Management</h1>
        <p className={`${theme.subtextColor} text-sm sm:text-base`}>Manage your school's information and settings</p>
      </div>

      {/* Profile Header */}
      <div
        className="relative h-48 sm:h-64 lg:h-80 rounded-xl overflow-hidden mb-6"
        style={{
          backgroundImage: displayProfileBackground
            ? `url(${displayProfileBackground})`
            : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {!displayProfileBackground && (
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600" />
        )}
        
        <div className="relative z-10 p-6 h-full flex flex-col sm:flex-row items-start sm:items-end justify-between">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-white rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0 shadow-lg">
              {displayLogo ? (
                <img
                  src={displayLogo}
                  alt="School Logo"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-blue-600 font-bold text-xl">Logo</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  className="bg-white/20 border border-white/30 rounded-lg px-3 sm:px-4 py-2 text-white text-lg sm:text-xl lg:text-2xl mb-2 w-full focus:outline-none focus:ring-2 focus:ring-white"
                  placeholder="School Name"
                />
              ) : (
                <h2 className="text-white mb-2 text-lg sm:text-xl lg:text-2xl break-words">{profileData.name || 'School Name'}</h2>
              )}
              {isEditing ? (
                <input
                  type="text"
                  value={profileData.motto}
                  onChange={(e) => setProfileData({ ...profileData, motto: e.target.value })}
                  className="bg-white/20 border border-white/30 rounded-lg px-3 sm:px-4 py-2 text-white text-sm sm:text-base w-full focus:outline-none focus:ring-2 focus:ring-white"
                  placeholder="School Motto"
                />
              ) : (
                <p className="text-white/90 text-xs sm:text-sm lg:text-base break-words">{profileData.motto || 'School Motto'}</p>
              )}
            </div>
          </div>

          {isEditing && (
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={() => profileBackgroundInputRef.current?.click()}
                className="px-3 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors text-sm"
              >
                Change Cover
              </button>
            </div>
          )}
        </div>
        
        {isEditing && (
          <input
            ref={profileBackgroundInputRef}
            type="file"
            accept="image/*"
            onChange={handleProfileBackgroundUpload}
            className="hidden"
          />
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 mb-6">
        {isEditing ? (
          <>
            <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </>
        ) : (
          <Button onClick={() => setIsEditing(true)} className="flex items-center gap-2">
            <Edit className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Edit Profile</span>
            <span className="sm:hidden">Edit</span>
          </Button>
        )}
      </div>

      {/* Editable Fields */}
      <div className={`rounded-xl p-4 sm:p-6 ${theme.cardBg} shadow-sm`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          
          {/* Email */}
          <div>
            <label className={`${theme.subtextColor} mb-2 block text-sm sm:text-base`}>Email</label>
            {isEditing ? (
              <input
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                className={`w-full px-3 sm:px-4 py-2 text-sm sm:text-base border ${theme.borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme.inputBg} ${theme.textColor}`}
                placeholder="school@example.com"
              />
            ) : (
              <p className={`${theme.textColor} text-sm sm:text-base break-words`}>{profileData.email || 'Not set'}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className={`${theme.subtextColor} mb-2 block text-sm sm:text-base`}>Phone</label>
            {isEditing ? (
              <input
                type="tel"
                value={profileData.phone}
                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                className={`w-full px-3 sm:px-4 py-2 text-sm sm:text-base border ${theme.borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme.inputBg} ${theme.textColor}`}
                placeholder="+977-1234567890"
              />
            ) : (
              <p className={`${theme.textColor} text-sm sm:text-base`}>{profileData.phone || 'Not set'}</p>
            )}
          </div>

          {/* Telephone */}
          <div>
            <label className={`${theme.subtextColor} mb-2 block text-sm sm:text-base`}>Telephone</label>
            {isEditing ? (
              <input
                type="tel"
                value={profileData.telephone}
                onChange={(e) => setProfileData({ ...profileData, telephone: e.target.value })}
                className={`w-full px-3 sm:px-4 py-2 text-sm sm:text-base border ${theme.borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme.inputBg} ${theme.textColor}`}
                placeholder="+977-12345678"
              />
            ) : (
              <p className={`${theme.textColor} text-sm sm:text-base`}>{profileData.telephone || 'Not set'}</p>
            )}
          </div>

          {/* Website */}
          <div>
            <label className={`${theme.subtextColor} mb-2 block text-sm sm:text-base`}>Website</label>
            {isEditing ? (
              <input
                type="url"
                value={profileData.website}
                onChange={(e) => setProfileData({ ...profileData, website: e.target.value })}
                className={`w-full px-3 sm:px-4 py-2 text-sm sm:text-base border ${theme.borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme.inputBg} ${theme.textColor}`}
                placeholder="https://www.school.edu.np"
              />
            ) : (
              <p className={`${theme.textColor} text-sm sm:text-base break-words`}>{profileData.website || 'Not set'}</p>
            )}
          </div>

          {/* Established Year */}
          <div>
            <label className={`${theme.subtextColor} mb-2 block text-sm sm:text-base`}>Established Year</label>
            {isEditing ? (
              <input
                type="text"
                value={profileData.established}
                onChange={(e) => setProfileData({ ...profileData, established: e.target.value })}
                className={`w-full px-3 sm:px-4 py-2 text-sm sm:text-base border ${theme.borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme.inputBg} ${theme.textColor}`}
                placeholder="2060"
              />
            ) : (
              <p className={`${theme.textColor} text-sm sm:text-base`}>{profileData.established || 'Not set'}</p>
            )}
          </div>

          {/* Registration Number */}
          <div>
            <label className={`${theme.subtextColor} mb-2 block text-sm sm:text-base`}>Registration Number</label>
            {isEditing ? (
              <input
                type="text"
                value={profileData.registrationNumber}
                onChange={(e) => setProfileData({ ...profileData, registrationNumber: e.target.value })}
                className={`w-full px-3 sm:px-4 py-2 text-sm sm:text-base border ${theme.borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme.inputBg} ${theme.textColor}`}
                placeholder="123456"
              />
            ) : (
              <p className={`${theme.textColor} text-sm sm:text-base`}>{profileData.registrationNumber || 'Not set'}</p>
            )}
          </div>

          {/* PAN Number */}
          <div>
            <label className={`${theme.subtextColor} mb-2 block text-sm sm:text-base`}>PAN Number</label>
            {isEditing ? (
              <input
                type="text"
                value={profileData.panNumber}
                onChange={(e) => setProfileData({ ...profileData, panNumber: e.target.value })}
                className={`w-full px-3 sm:px-4 py-2 text-sm sm:text-base border ${theme.borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme.inputBg} ${theme.textColor}`}
                placeholder="123456789"
              />
            ) : (
              <p className={`${theme.textColor} text-sm sm:text-base`}>{profileData.panNumber || 'Not set'}</p>
            )}
          </div>

          {/* Principal */}
          <div>
            <label className={`${theme.subtextColor} mb-2 block text-sm sm:text-base`}>Principal</label>
            {isEditing ? (
              <input
                type="text"
                value={profileData.principal}
                onChange={(e) => setProfileData({ ...profileData, principal: e.target.value })}
                className={`w-full px-3 sm:px-4 py-2 text-sm sm:text-base border ${theme.borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme.inputBg} ${theme.textColor}`}
                placeholder="Principal Name"
              />
            ) : (
              <p className={`${theme.textColor} text-sm sm:text-base`}>{profileData.principal || 'Not set'}</p>
            )}
          </div>

          {/* Address - Full Width */}
          <div className="md:col-span-2">
            <label className={`${theme.subtextColor} mb-2 block text-sm sm:text-base`}>Address</label>
            {isEditing ? (
              <textarea
                value={profileData.address}
                onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                className={`w-full px-3 sm:px-4 py-2 text-sm sm:text-base border ${theme.borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme.inputBg} ${theme.textColor}`}
                rows={2}
                placeholder="Full Address"
              />
            ) : (
              <p className={`${theme.textColor} text-sm sm:text-base break-words`}>{profileData.address || 'Not set'}</p>
            )}
          </div>

          {/* Description - Full Width */}
          <div className="md:col-span-2">
            <label className={`${theme.subtextColor} mb-2 block text-sm sm:text-base`}>Description</label>
            {isEditing ? (
              <textarea
                value={profileData.description}
                onChange={(e) => setProfileData({ ...profileData, description: e.target.value })}
                className={`w-full px-3 sm:px-4 py-2 text-sm sm:text-base border ${theme.borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme.inputBg} ${theme.textColor}`}
                rows={3}
                placeholder="School Description"
              />
            ) : (
              <p className={`${theme.textColor} leading-relaxed text-xs sm:text-sm md:text-base break-words`}>
                {profileData.description || 'No description available'}
              </p>
            )}
          </div>
        </div>

        {/* School Logo Section */}
        <div className="mt-6">
          <label className={`${theme.subtextColor} mb-2 block text-sm sm:text-base`}>School Logo</label>
          <p className={`${theme.subtextColor} text-xs mb-2`}>Recommended: 200x200px JPG or PNG</p>
          <div className={`border-2 border-dashed ${theme.borderColor} rounded-lg p-4 sm:p-6 text-center`}>
            {displayLogo ? (
              <div className="space-y-3">
                <div className="relative inline-block">
                  <img
                    src={displayLogo}
                    alt="School Logo"
                    className="w-24 h-24 object-cover mx-auto rounded-lg"
                  />
                  {isEditing && (
                    <>
                      <button
                        onClick={() => logoInputRef.current?.click()}
                        className="absolute top-0 right-0 bg-blue-600 text-white p-1 rounded-full transform translate-x-1/2 -translate-y-1/2 hover:bg-blue-700"
                      >
                        <Edit className="w-3 h-3" />
                      </button>
                      <button
                        onClick={handleRemoveLogo}
                        className="absolute top-0 left-0 bg-red-600 text-white p-1 rounded-full transform -translate-x-1/2 -translate-y-1/2 hover:bg-red-700"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </>
                  )}
                </div>
                {isEditing && (
                  <button
                    onClick={() => logoInputRef.current?.click()}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    Change Logo
                  </button>
                )}
              </div>
            ) : (
              <>
                <p className={`${theme.subtextColor} text-sm mb-3`}>Upload your school logo</p>
                <button
                  onClick={() => logoInputRef.current?.click()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  Upload Logo
                </button>
              </>
            )}
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
            />
          </div>
        </div>

        {/* Login Background Section */}
        <div className="mt-6">
          <label className={`${theme.subtextColor} mb-2 block text-sm sm:text-base`}>Login Background Image</label>
          <p className={`${theme.subtextColor} text-xs mb-2`}>Recommended: 1920x1080px JPG or PNG</p>
          <div className={`border-2 border-dashed ${theme.borderColor} rounded-lg p-4 sm:p-6 text-center`}>
            {displayBackground ? (
              <div className="space-y-3">
                <img
                  src={displayBackground}
                  alt="Login Background"
                  className="w-full h-32 object-cover mx-auto rounded-lg"
                />
                {isEditing && (
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() => backgroundInputRef.current?.click()}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      Change Background
                    </button>
                    <button
                      onClick={handleRemoveBackground}
                      className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <p className={`${theme.subtextColor} text-sm mb-3`}>Upload a background image for the login page</p>
                <button
                  onClick={() => backgroundInputRef.current?.click()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  Upload Background
                </button>
              </>
            )}
            <input
              ref={backgroundInputRef}
              type="file"
              accept="image/*"
              onChange={handleBackgroundUpload}
              className="hidden"
            />
          </div>
        </div>

        {/* Profile Background Section */}
        <div className="mt-6">
          <label className={`${theme.subtextColor} mb-2 block text-sm sm:text-base`}>Profile Background Image</label>
          <p className={`${theme.subtextColor} text-xs mb-2`}>Recommended: 1600x400px JPG or PNG</p>
          <div className={`border-2 border-dashed ${theme.borderColor} rounded-lg p-4 sm:p-6 text-center`}>
            {displayProfileBackground ? (
              <div className="space-y-3">
                <img
                  src={displayProfileBackground}
                  alt="Profile Background"
                  className="w-full h-32 object-cover mx-auto rounded-lg"
                />
                {isEditing && (
                  <>
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => profileBackgroundInputRef.current?.click()}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        Change Background
                      </button>
                      <button
                        onClick={handleRemoveProfileBackground}
                        className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                <p className={`${theme.subtextColor} text-sm mb-3`}>
                  Upload a background image for the School Profile header
                </p>
                <button
                  onClick={() => profileBackgroundInputRef.current?.click()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  Upload Background
                </button>
              </>
            )}
            <input
              ref={profileBackgroundInputRef}
              type="file"
              accept="image/*"
              onChange={handleProfileBackgroundUpload}
              className="hidden"
            />
          </div>
        </div>

        {/* Multiple Background Images Section */}
        <div className="mt-6">
          <label className={`${theme.subtextColor} mb-2 block text-sm sm:text-base`}>Gallery Images</label>
          <p className={`${theme.subtextColor} text-xs mb-2`}>Add up to 10 images for your school gallery (1600x400px recommended)</p>
          
          {profileData.backgroundImages.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mb-3">
              {profileData.backgroundImages.map((img, index) => (
                <div key={index} className="relative group">
                  <img
                    src={img}
                    alt={`Gallery ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  {isEditing && (
                    <button
                      onClick={() => handleRemoveBackgroundImage(index)}
                      className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {isEditing && (
            <>
              <p className="text-gray-600 text-sm mb-2">
                {profileData.backgroundImages.length}/10 images uploaded
              </p>
              <button
                onClick={() => multipleBackgroundInputRef.current?.click()}
                disabled={profileData.backgroundImages.length >= 10}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Images
              </button>
              <input
                ref={multipleBackgroundInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleMultipleBackgroundUpload}
                className="hidden"
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
