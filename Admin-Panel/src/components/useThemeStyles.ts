import { useSchoolSettings } from './SchoolSettingsContext';

export function useThemeStyles() {
  const { settings } = useSchoolSettings();
  const isDark = settings.theme === 'dark';

  return {
    isDark,
    bgColor: isDark ? 'bg-gray-800' : 'bg-white',
    bgColorAlt: isDark ? 'bg-gray-700' : 'bg-gray-50',
    textColor: isDark ? 'text-gray-100' : 'text-gray-900',
    subtextColor: isDark ? 'text-gray-400' : 'text-gray-600',
    borderColor: isDark ? 'border-gray-700' : 'border-gray-100',
    borderColorAlt: isDark ? 'border-gray-600' : 'border-gray-300',
    hoverColor: isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50',
    inputBg: isDark ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' : 'bg-white border-gray-300 placeholder-gray-500',
    cardBg: isDark ? 'bg-gray-800' : 'bg-white',
    tableHeaderBg: isDark ? 'bg-gray-900/50' : 'bg-gray-50',
    tableRowHover: isDark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50',
    modalOverlay: 'bg-black/50',
    modalBg: isDark ? 'bg-gray-800' : 'bg-white',
    primaryColor: settings.primaryColor,
    secondaryColor: settings.secondaryColor,
  };
}
