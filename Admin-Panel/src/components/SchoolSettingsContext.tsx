import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { translations, type Language, type TranslationKey } from './translations';
import { apiFetch } from '../lib/api';

interface SchoolSettings {
  schoolName: string;
  schoolLogo: string | null;
  loginBackground: string | null;
  profileBackground: string | null;
  schoolAddress: string;
  theme: 'light' | 'dark';
  primaryColor: string;
  secondaryColor: string;
  sidebarType: 'default' | 'compact' | 'mini';
  language: Language;
}

interface SchoolSettingsContextType {
  settings: SchoolSettings;
  updateSettings: (newSettings: Partial<SchoolSettings>) => void;
  t: (key: TranslationKey) => string;
}

const SchoolSettingsContext = createContext<SchoolSettingsContextType | undefined>(undefined);

const defaultSettings: SchoolSettings = {
  schoolName: 'School Name',
  schoolLogo: null,
  loginBackground: null,
  profileBackground: null,
  schoolAddress: '',
  theme: 'light',
  primaryColor: '#3B82F6',
  secondaryColor: '#8B5CF6',
  sidebarType: 'default',
  language: 'en',
};

export function SchoolSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SchoolSettings>(() => {
    // Load from localStorage on initialization
    const saved = localStorage.getItem('schoolSettings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...defaultSettings, ...parsed };
      } catch (e) {
        return defaultSettings;
      }
    }
    return defaultSettings;
  });

  useEffect(() => {
    // Fetch latest settings from API
    const fetchSettings = async () => {
      try {
        // Use public endpoint without auth requirement
        const data = await apiFetch<any>('/school/profile');
        setSettings((prev) => ({
          ...prev,
          schoolName: data.name || prev.schoolName,
          schoolLogo: data.schoolLogo || prev.schoolLogo,
          loginBackground: data.loginBackground || prev.loginBackground,
          profileBackground: data.profileBackground || prev.profileBackground,
          schoolAddress: data.address || prev.schoolAddress,
          primaryColor: data.themeColor || prev.primaryColor,
        }));
      } catch (error) {
        console.error('Failed to fetch school profile:', error);
        // Don't throw - keep existing settings on error
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    // Save to localStorage whenever settings change
    try {
      localStorage.setItem('schoolSettings', JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to save settings to localStorage:', e);
    }
    
    // Apply theme to document
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Apply custom colors as CSS variables
    document.documentElement.style.setProperty('--primary-color', settings.primaryColor);
    document.documentElement.style.setProperty('--secondary-color', settings.secondaryColor);
  }, [settings]);

  const updateSettings = (newSettings: Partial<SchoolSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  // Translation function
  const t = (key: TranslationKey): string => {
    const lang = settings.language || 'en';
    const translationSet = translations[lang];
    if (!translationSet) {
      console.warn(`Translation set for language "${lang}" not found`);
      return key;
    }
    return translationSet[key] || key;
  };

  return (
    <SchoolSettingsContext.Provider value={{ settings, updateSettings, t }}>
      {children}
    </SchoolSettingsContext.Provider>
  );
}

export function useSchoolSettings() {
  const context = useContext(SchoolSettingsContext);
  if (context === undefined) {
    throw new Error('useSchoolSettings must be used within a SchoolSettingsProvider');
  }
  return context;
}