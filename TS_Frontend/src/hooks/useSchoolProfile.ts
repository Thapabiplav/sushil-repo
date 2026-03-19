import { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';

export interface SchoolProfile {
  name: string;
  motto: string;
  email: string;
  phone: string;
  telephone: string;
  website: string;
  address: string;
  schoolLogo: string | null;
  loginBackground: string | null;
  profileBackground: string | null;
  backgroundImages: string[];
  socialMedia: {
    facebook: string;
    twitter: string;
    linkedin: string;
    instagram: string;
  };
  themeColor?: string;
}

export function useSchoolProfile() {
  const [profile, setProfile] = useState<SchoolProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchProfile = async () => {
      try {
        // Use public endpoint without auth requirement
        const data = await apiFetch<any>('/school/profile');
        if (mounted) {
          setProfile({
            name: data.name || '',
            motto: data.motto || '',
            email: data.email || '',
            phone: data.phone || '',
            telephone: data.telephone || '',
            website: data.website || '',
            address: data.address || '',
            schoolLogo: data.schoolLogo || null,
            loginBackground: data.loginBackground || null,
            profileBackground: data.profileBackground || null,
            backgroundImages: data.backgroundImages || [],
            socialMedia: data.socialMedia || {
              facebook: '',
              twitter: '',
              linkedin: '',
              instagram: '',
            },
            themeColor: data.themeColor || '#22c55e', // Default green color
          });
        }
      } catch (err) {
        console.error('Failed to load school profile', err);
        // Set empty profile with default values to prevent crashes
        if (mounted) {
          setProfile({
            name: '',
            motto: '',
            email: '',
            phone: '',
            telephone: '',
            website: '',
            address: '',
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
            themeColor: '#22c55e', // Default green color
          });
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    fetchProfile();

    return () => {
      mounted = false;
    };
  }, []);

  return { profile, isLoading };
}
