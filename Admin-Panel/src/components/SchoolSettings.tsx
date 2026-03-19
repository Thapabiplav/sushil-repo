import { useState, useEffect } from 'react';
import { Palette, MessageSquare, Database, Shield, Globe, Moon, Sun, Save, Upload, Bell, Lock, Clock, FileText, Calendar as CalendarIcon, Sparkles, ChevronDown, ChevronRight } from 'lucide-react';
import { useSchoolSettings } from './SchoolSettingsContext';

const UPCOMING_SECTION_IDS = ['communication', 'backup', 'security'];

export function SchoolSettings() {
  const { settings, updateSettings, t } = useSchoolSettings();
  const [activeSection, setActiveSection] = useState<string>('theme');
  const [upcomingFeatureExpanded, setUpcomingFeatureExpanded] = useState(false);
  
  // Local state synced with context
  const [theme, setTheme] = useState(settings.theme);
  const [primaryColor, setPrimaryColor] = useState(settings.primaryColor);
  const [secondaryColor, setSecondaryColor] = useState(settings.secondaryColor);
  const [sidebarType, setSidebarType] = useState(settings.sidebarType);
  const [language, setLanguage] = useState(settings.language);
  
  // Communication Settings
  const [smsEnabled, setSmsEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [inAppNotifications, setInAppNotifications] = useState(true);
  
  // Security Settings
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState('30');
  
  // Other localization settings
  const [dateFormat, setDateFormat] = useState('MM/DD/YYYY');
  const [timeFormat, setTimeFormat] = useState('12h');
  const [currency, setCurrency] = useState('NPR');

  // Apply changes in real-time
  useEffect(() => {
    updateSettings({ theme });
  }, [theme]);

  useEffect(() => {
    updateSettings({ primaryColor });
  }, [primaryColor]);

  useEffect(() => {
    updateSettings({ secondaryColor });
  }, [secondaryColor]);

  useEffect(() => {
    updateSettings({ sidebarType });
  }, [sidebarType]);

  useEffect(() => {
    updateSettings({ language });
  }, [language]);

  // Auto-expand Upcoming Feature when one of its sections is active
  useEffect(() => {
    if (UPCOMING_SECTION_IDS.includes(activeSection)) {
      setUpcomingFeatureExpanded(true);
    }
  }, [activeSection]);

  const mainSections = [
    { id: 'theme', label: t('themeUI'), icon: Palette },
    { id: 'localization', label: t('localization'), icon: Globe },
  ];
  const upcomingSections = [
    { id: 'communication', label: t('communication'), icon: MessageSquare },
    { id: 'backup', label: t('backupRestore'), icon: Database },
    { id: 'security', label: t('security'), icon: Shield },
  ];
  const isUpcomingSectionActive = UPCOMING_SECTION_IDS.includes(activeSection);

  const handleSave = () => {
    const allSettings = {
      theme,
      primaryColor,
      secondaryColor,
      sidebarType,
      language,
      smsEnabled,
      emailEnabled,
      inAppNotifications,
      twoFactorAuth,
      sessionTimeout,
      dateFormat,
      timeFormat,
      currency,
    };
    localStorage.setItem('additionalSettings', JSON.stringify(allSettings));
    alert(language === 'ne' ? 'सेटिङहरू सफलतापूर्वक सेभ भयो!' : 'Settings saved successfully!');
  };

  const handleExportData = () => {
    alert(language === 'ne' ? 'CSV/Excel को रूपमा डाटा निर्यात गर्दै...' : 'Exporting data as CSV/Excel...');
  };

  const handleImportData = () => {
    alert(language === 'ne' ? 'डाटा आयात कार्य...' : 'Import data functionality...');
  };

  const handleBackup = () => {
    alert(language === 'ne' ? 'डाटाबेस ब्याकअप सिर्जना गर्दै...' : 'Creating database backup...');
  };

  const handleRestore = () => {
    alert(language === 'ne' ? 'डाटाबेस पुनर्स्थापना कार्य...' : 'Restore database functionality...');
  };

  const isDark = settings.theme === 'dark';
  const bgColor = isDark ? 'bg-gray-800' : 'bg-white';
  const textColor = isDark ? 'text-gray-100' : 'text-gray-900';
  const subtextColor = isDark ? 'text-gray-400' : 'text-gray-600';
  const borderColor = isDark ? 'border-gray-700' : 'border-gray-100';
  const inputBg = isDark ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300';
  const hoverColor = isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50';

  return (
    <>
      <div className="mb-6 sm:mb-8">
        <h1 className={textColor + " mb-2"}>{t('systemSettings')}</h1>
        <p className={subtextColor}>{t('configurePreferences')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Settings Menu */}
        <div className="lg:col-span-1">
          <div className={`${bgColor} rounded-xl shadow-sm border ${borderColor} p-3 sm:p-4`}>
            <nav className="space-y-1">
              {/* Theme - main section */}
              {mainSections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg transition-colors text-sm sm:text-base ${
                      activeSection === section.id
                        ? isDark
                          ? 'bg-gray-700 text-white'
                          : 'bg-blue-50 text-blue-600'
                        : `${textColor} ${hoverColor}`
                    }`}
                    style={activeSection === section.id ? { backgroundColor: settings.primaryColor + '20', color: settings.primaryColor } : {}}
                  >
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                    <span className="truncate">{section.label}</span>
                  </button>
                );
              })}

              {/* Upcoming Feature - collapsible parent */}
              <div>
                <button
                  onClick={() => setUpcomingFeatureExpanded((prev) => !prev)}
                  className={`w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg transition-colors text-sm sm:text-base ${
                    isUpcomingSectionActive
                      ? isDark
                        ? 'bg-gray-700 text-white'
                        : 'bg-blue-50 text-blue-600'
                      : `${textColor} ${hoverColor}`
                  }`}
                  style={isUpcomingSectionActive ? { backgroundColor: settings.primaryColor + '20', color: settings.primaryColor } : {}}
                >
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  <span className="truncate flex-1 text-left">{t('upcomingFeature')}</span>
                  {upcomingFeatureExpanded ? (
                    <ChevronDown className="w-4 h-4 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 flex-shrink-0" />
                  )}
                </button>
                {upcomingFeatureExpanded && (
                  <div className="mt-1 ml-2 sm:ml-4 pl-2 sm:pl-3 border-l-2 space-y-0.5" style={{ borderColor: settings.primaryColor + '40' }}>
                    {upcomingSections.map((section) => {
                      const Icon = section.icon;
                      return (
                        <button
                          key={section.id}
                          onClick={() => setActiveSection(section.id)}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                            activeSection === section.id
                              ? isDark
                                ? 'bg-gray-700 text-white'
                                : 'bg-blue-50 text-blue-600'
                              : `${textColor} ${hoverColor}`
                          }`}
                          style={activeSection === section.id ? { backgroundColor: settings.primaryColor + '20', color: settings.primaryColor } : {}}
                        >
                          <Icon className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{section.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </nav>
          </div>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          <div className={`${bgColor} rounded-xl shadow-sm border ${borderColor} p-4 sm:p-6`}>
            {/* Theme & UI Settings */}
            {activeSection === 'theme' && (
              <div>
                <h2 className={`${textColor} mb-6`}>{language === 'ne' ? 'थिम र UI अनुकूलन' : 'Theme & UI Customization'}</h2>
                
                {/* Theme Mode */}
                <div className="mb-6">
                  <label className={`${textColor} mb-3 block`}>{t('themeMode')}</label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setTheme('light')}
                      className={`flex items-center gap-2 px-6 py-3 rounded-lg border-2 transition-colors ${
                        theme === 'light' 
                          ? 'text-white'
                          : isDark 
                          ? 'border-gray-600 hover:border-gray-500' 
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                      style={theme === 'light' ? { borderColor: settings.primaryColor, backgroundColor: settings.primaryColor + '20', color: settings.primaryColor } : {}}
                    >
                      <Sun className="w-5 h-5" />
                      {t('lightMode')}
                    </button>
                    <button
                      onClick={() => setTheme('dark')}
                      className={`flex items-center gap-2 px-6 py-3 rounded-lg border-2 transition-colors ${
                        theme === 'dark' 
                          ? 'text-white'
                          : isDark 
                          ? 'border-gray-600 hover:border-gray-500' 
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                      style={theme === 'dark' ? { borderColor: settings.primaryColor, backgroundColor: settings.primaryColor + '20', color: settings.primaryColor } : {}}
                    >
                      <Moon className="w-5 h-5" />
                      {t('darkMode')}
                    </button>
                  </div>
                </div>

                {/* Color Selection */}
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className={`${textColor} mb-2 block`}>{t('primaryColor')}</label>
                    <div className="flex gap-3 items-center">
                      <input
                        type="color"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="w-16 h-16 rounded-lg cursor-pointer"
                      />
                      <input
                        type="text"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className={`flex-1 px-4 py-2 border rounded-lg ${inputBg}`}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={`${textColor} mb-2 block`}>{t('secondaryColor')}</label>
                    <div className="flex gap-3 items-center">
                      <input
                        type="color"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="w-16 h-16 rounded-lg cursor-pointer"
                      />
                      <input
                        type="text"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className={`flex-1 px-4 py-2 border rounded-lg ${inputBg}`}
                      />
                    </div>
                  </div>
                </div>

                {/* Sidebar Type */}
                <div className="mb-6">
                  <label className={`${textColor} mb-2 block`}>{t('sidebarType')}</label>
                  <select
                    value={sidebarType}
                    onChange={(e) => setSidebarType(e.target.value as any)}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputBg}`}
                    style={{ focusRingColor: settings.primaryColor }}
                  >
                    <option value="default">{t('default')}</option>
                    <option value="compact">{t('compact')}</option>
                    <option value="mini">{t('miniSidebar')}</option>
                  </select>
                </div>

                {/* Compact Mode */}
                <div className={`flex items-center justify-between p-4 ${isDark ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg`}>
                  <div>
                    <p className={textColor}>{t('compactMode')}</p>
                    <p className={`${subtextColor} text-sm`}>{t('reduceSpacing')}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      defaultChecked={false}
                      readOnly
                      className="sr-only peer"
                    />
                    <div 
                      className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"
                      style={{ backgroundColor: settings.primaryColor }}
                    ></div>
                  </label>
                </div>
              </div>
            )}

            {/* Communication Settings */}
            {activeSection === 'communication' && (
              <div>
                <h2 className={`${textColor} mb-6`}>{language === 'ne' ? 'सञ्चार सेटिङहरू' : 'Communication Settings'}</h2>
                
                {/* SMS/Email Integration */}
                <div className="space-y-4 mb-6">
                  <div className={`flex items-center justify-between p-4 ${isDark ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg`}>
                    <div>
                      <p className={textColor}>{language === 'ne' ? 'SMS सूचनाहरू' : 'SMS Notifications'}</p>
                      <p className={`${subtextColor} text-sm`}>{language === 'ne' ? 'अभिभावक र शिक्षकहरूलाई SMS पठाउनुहोस्' : 'Send SMS to parents and teachers'}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={smsEnabled}
                        onChange={(e) => setSmsEnabled(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div 
                        className={`w-11 h-6 ${isDark ? 'bg-gray-600' : 'bg-gray-300'} peer-focus:outline-none peer-focus:ring-4 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all`}
                        style={smsEnabled ? { backgroundColor: settings.primaryColor } : {}}
                      ></div>
                    </label>
                  </div>

                  <div className={`flex items-center justify-between p-4 ${isDark ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg`}>
                    <div>
                      <p className={textColor}>{language === 'ne' ? 'इमेल सूचनाहरू' : 'Email Notifications'}</p>
                      <p className={`${subtextColor} text-sm`}>{language === 'ne' ? 'इमेल अपडेट र रिपोर्टहरू पठाउनुहोस्' : 'Send email updates and reports'}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={emailEnabled}
                        onChange={(e) => setEmailEnabled(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div 
                        className={`w-11 h-6 ${isDark ? 'bg-gray-600' : 'bg-gray-300'} peer-focus:outline-none peer-focus:ring-4 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all`}
                        style={emailEnabled ? { backgroundColor: settings.primaryColor } : {}}
                      ></div>
                    </label>
                  </div>

                  <div className={`flex items-center justify-between p-4 ${isDark ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg`}>
                    <div>
                      <p className={textColor}>{language === 'ne' ? 'एप-भित्रि सूचनाहरू' : 'In-App Notifications'}</p>
                      <p className={`${subtextColor} text-sm`}>{language === 'ne' ? 'प्रणाली भित्र सूचनाहरू देखाउनुहोस्' : 'Show notifications within the system'}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={inAppNotifications}
                        onChange={(e) => setInAppNotifications(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div 
                        className={`w-11 h-6 ${isDark ? 'bg-gray-600' : 'bg-gray-300'} peer-focus:outline-none peer-focus:ring-4 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all`}
                        style={inAppNotifications ? { backgroundColor: settings.primaryColor } : {}}
                      ></div>
                    </label>
                  </div>
                </div>

                {/* Notification Templates */}
                <div className="mb-6">
                  <label className={`${textColor} mb-2 block`}>{language === 'ne' ? 'सूचना टेम्प्लेटहरू' : 'Notification Templates'}</label>
                  <div className="space-y-2">
                    <button 
                      className="w-full px-4 py-3 rounded-lg transition-colors text-left"
                      style={{ backgroundColor: settings.primaryColor + '10', color: settings.primaryColor }}
                    >
                      {language === 'ne' ? 'SMS टेम्प्लेटहरू व्यवस्थापन गर्नुहोस्' : 'Manage SMS Templates'}
                    </button>
                    <button 
                      className="w-full px-4 py-3 rounded-lg transition-colors text-left"
                      style={{ backgroundColor: settings.secondaryColor + '10', color: settings.secondaryColor }}
                    >
                      {language === 'ne' ? 'इमेल टेम्प्लेटहरू व्यवस्थापन गर्नुहोस्' : 'Manage Email Templates'}
                    </button>
                  </div>
                </div>

                {/* Parent/Teacher Communication Rules */}
                <div>
                  <label className={`${textColor} mb-2 block`}>{language === 'ne' ? 'सञ्चार नियमहरू' : 'Communication Rules'}</label>
                  <textarea
                    placeholder={language === 'ne' ? 'अभिभावक-शिक्षक सञ्चार नियम र दिशानिर्देशहरू परिभाषित गर्नुहोस्...' : 'Define parent-teacher communication rules and guidelines...'}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputBg}`}
                    rows={4}
                  />
                </div>
              </div>
            )}

            {/* Backup & Restore Settings */}
            {activeSection === 'backup' && (
              <div>
                <h2 className={`${textColor} mb-6`}>{t('backupRestore')}</h2>
                
                {/* Database Backup */}
                <div className="mb-6">
                  <h3 className={`${textColor} mb-4`}>{language === 'ne' ? 'डाटाबेस ब्याकअप' : 'Database Backup'}</h3>
                  <div className="space-y-3">
                    <button
                      onClick={handleBackup}
                      className="w-full flex items-center gap-3 px-4 py-3 text-white rounded-lg transition-colors"
                      style={{ backgroundColor: settings.primaryColor }}
                    >
                      <Database className="w-5 h-5" />
                      {language === 'ne' ? 'अहिले ब्याकअप सिर्जना गर्नुहोस्' : 'Create Backup Now'}
                    </button>
                    <div className={`p-4 ${isDark ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg`}>
                      <p className={`${subtextColor} mb-2`}>{language === 'ne' ? 'अन्तिम ब्याकअप' : 'Last Backup'}</p>
                      <p className={textColor}>December 12, 2025 - 10:30 AM</p>
                    </div>
                  </div>
                </div>

                {/* Restore System */}
                <div className="mb-6">
                  <h3 className={`${textColor} mb-4`}>{language === 'ne' ? 'प्रणाली पुनर्स्थापना गर्नुहोस्' : 'Restore System'}</h3>
                  <button
                    onClick={handleRestore}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    <Upload className="w-5 h-5" />
                    {language === 'ne' ? 'ब्याकअपबाट पुनर्स्थापना गर्नुहोस्' : 'Restore from Backup'}
                  </button>
                  <p className={`${subtextColor} text-sm mt-2`}>
                    {language === 'ne' ? 'प्रणाली पुनर्स्थापना गर्न अघिल्लो ब्याकअप फाइल अपलोड गर्नुहोस्' : 'Upload a previous backup file to restore the system'}
                  </p>
                </div>

                {/* Export/Import Data */}
                <div>
                  <h3 className={`${textColor} mb-4`}>{language === 'ne' ? 'डाटा निर्यात/आयात' : 'Export/Import Data'}</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={handleExportData}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <FileText className="w-5 h-5" />
                      {language === 'ne' ? 'CSV मा निर्यात' : 'Export to CSV'}
                    </button>
                    <button
                      onClick={handleExportData}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <FileText className="w-5 h-5" />
                      {language === 'ne' ? 'Excel मा निर्यात' : 'Export to Excel'}
                    </button>
                    <button
                      onClick={handleImportData}
                      className="col-span-2 flex items-center justify-center gap-2 px-4 py-3 text-white rounded-lg transition-colors"
                      style={{ backgroundColor: settings.secondaryColor }}
                    >
                      <Upload className="w-5 h-5" />
                      {language === 'ne' ? 'डाटा आयात गर्नुहोस्' : 'Import Data'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Security Settings */}
            {activeSection === 'security' && (
              <div>
                <h2 className={`${textColor} mb-6`}>{t('security')} {language === 'ne' ? 'सेटिङहरू' : 'Settings'}</h2>
                
                {/* Two-Factor Authentication */}
                <div className={`flex items-center justify-between p-4 ${isDark ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg mb-6`}>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Lock className={`w-5 h-5 ${textColor}`} />
                      <p className={textColor}>{language === 'ne' ? 'दुई-कारक प्रमाणीकरण (2FA)' : 'Two-Factor Authentication (2FA)'}</p>
                    </div>
                    <p className={`${subtextColor} text-sm`}>
                      {language === 'ne' ? 'एडमिन लगइनमा सुरक्षाको अतिरिक्त तह थप्नुहोस्' : 'Add an extra layer of security to admin login'}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={twoFactorAuth}
                      onChange={(e) => setTwoFactorAuth(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div 
                      className={`w-11 h-6 ${isDark ? 'bg-gray-600' : 'bg-gray-300'} peer-focus:outline-none peer-focus:ring-4 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all`}
                      style={twoFactorAuth ? { backgroundColor: settings.primaryColor } : {}}
                    ></div>
                  </label>
                </div>

                {/* Session Timeout */}
                <div className="mb-6">
                  <label className={`flex items-center gap-2 ${textColor} mb-2`}>
                    <Clock className="w-5 h-5" />
                    {language === 'ne' ? 'लगइन सत्र समय सीमा (मिनेट)' : 'Login Session Timeout (minutes)'}
                  </label>
                  <input
                    type="number"
                    value={sessionTimeout}
                    onChange={(e) => setSessionTimeout(e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputBg}`}
                    placeholder="30"
                  />
                </div>

                {/* IP Management */}
                <div className="mb-6">
                  <h3 className={`${textColor} mb-3`}>{language === 'ne' ? 'IP व्यवस्थापन' : 'IP Management'}</h3>
                  <div className="space-y-3">
                    <div>
                      <label className={`${textColor} text-sm mb-2 block`}>{language === 'ne' ? 'ब्लक गरिएको IP हरू' : 'Blocked IPs'}</label>
                      <textarea
                        placeholder={language === 'ne' ? 'ब्लक गरिएको IP ठ��गानाहरू प्रविष्ट गर्नुहोस् (प्रति लाइन एक)...' : 'Enter blocked IP addresses (one per line)...'}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputBg}`}
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className={`${textColor} text-sm mb-2 block`}>{language === 'ne' ? 'अनुमति दिइएको IP हरू (ह्वाइटलिस्ट)' : 'Allowed IPs (Whitelist)'}</label>
                      <textarea
                        placeholder={language === 'ne' ? 'अनुमति दिइएको IP ठेगानाहरू प्रविष्ट गर्नुहोस् (प्रति लाइन एक)...' : 'Enter allowed IP addresses (one per line)...'}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputBg}`}
                        rows={3}
                      />
                    </div>
                  </div>
                </div>

                {/* Activity Logs */}
                <div>
                  <h3 className={`${textColor} mb-3`}>{language === 'ne' ? 'गतिविधि लगहरू' : 'Activity Logs'}</h3>
                  <button 
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 text-white rounded-lg transition-colors"
                    style={{ backgroundColor: settings.primaryColor }}
                  >
                    <FileText className="w-5 h-5" />
                    {language === 'ne' ? 'गतिविधि लगहरू हेर्नुहोस्' : 'View Activity Logs'}
                  </button>
                  <p className={`${subtextColor} text-sm mt-2`}>
                    {language === 'ne' ? 'सबै एडमिन र प्रयोगकर्ता गतिविधिहरू निगरानी गर्नुहोस्' : 'Monitor all admin and user activities'}
                  </p>
                </div>
              </div>
            )}

            {/* Language & Localization Settings */}
            {activeSection === 'localization' && (
              <div>
                <h2 className={`${textColor} mb-6`}>{language === 'ne' ? 'भाषा र स्थानीयकरण' : 'Language & Localization'}</h2>
                
                {/* System Language */}
                <div className="mb-6">
                  <label className={`${textColor} mb-2 block`}>{t('systemLanguage')}</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as any)}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputBg}`}
                  >
                    <option value="en">{t('english')}</option>
                    <option value="ne">{t('nepali')}</option>
                  </select>
                </div>

                {/* Date Format */}
                <div className="mb-6">
                  <label className={`${textColor} mb-2 block`}>{language === 'ne' ? 'मिति ढाँचा' : 'Date Format'}</label>
                  <select
                    value={dateFormat}
                    onChange={(e) => setDateFormat(e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputBg}`}
                  >
                    <option value="MM/DD/YYYY">MM/DD/YYYY (12/25/2025)</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY (25/12/2025)</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD (2025-12-25)</option>
                    <option value="DD MMM YYYY">DD MMM YYYY (25 Dec 2025)</option>
                  </select>
                </div>

                {/* Time Format */}
                <div className="mb-6">
                  <label className={`${textColor} mb-2 block`}>{language === 'ne' ? 'समय ढाँचा' : 'Time Format'}</label>
                  <select
                    value={timeFormat}
                    onChange={(e) => setTimeFormat(e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputBg}`}
                  >
                    <option value="12h">{language === 'ne' ? '12-घण्टा (3:30 PM)' : '12-Hour (3:30 PM)'}</option>
                    <option value="24h">{language === 'ne' ? '24-घण्टा (15:30)' : '24-Hour (15:30)'}</option>
                  </select>
                </div>

                {/* Currency Format */}
                {/* <div>
                  <label className={`${textColor} mb-2 block`}>{language === 'ne' ? 'मुद्रा' : 'Currency'}</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputBg}`}
                  >
                    <option value="NPR">{language === 'ne' ? 'नेपाली रुपैयाँ (रू)' : 'Nepali Rupee (रू)'}</option>
                    <option value="USD">{language === 'ne' ? 'यूएस डलर ($)' : 'US Dollar ($)'}</option>
                    <option value="EUR">{language === 'ne' ? 'युरो (€)' : 'Euro (€)'}</option>
                    <option value="GBP">{language === 'ne' ? 'ब्रिटिश पाउन्ड (£)' : 'British Pound (£)'}</option>
                    <option value="INR">{language === 'ne' ? 'भारतीय रुपैयाँ (₹)' : 'Indian Rupee (₹)'}</option>
                  </select>
                </div> */}
              </div>
            )}

            {/* Save Button */}
            <div className={`mt-8 pt-6 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-6 py-3 text-white rounded-lg transition-colors"
                style={{ backgroundColor: settings.primaryColor }}
              >
                <Save className="w-5 h-5" />
                {t('saveChanges')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}