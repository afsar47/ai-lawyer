'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useTranslations } from '../hooks/useTranslations';
import { useSettings } from '../contexts/SettingsContext';
import { useLanguage } from '../contexts/LanguageContext';
import ProtectedRoute from '../protected-route';
import SidebarLayout from '../components/sidebar-layout';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Save, 
  RotateCcw, 
  Settings as SettingsIcon,
  Monitor,
  Bell,
  Clock,
  MapPin,
  Share2,
  Shield,
  Database,
  Globe,
  Palette
} from 'lucide-react';

const currencies = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
];

const timezones = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Rome',
  'Europe/Madrid',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Kolkata',
  'Asia/Dubai',
  'Australia/Sydney',
  'Australia/Melbourne',
  'Pacific/Auckland',
];

const dateFormats = [
  'MM/DD/YYYY',
  'DD/MM/YYYY',
  'YYYY-MM-DD',
  'DD-MM-YYYY',
  'MM-DD-YYYY',
];

const jurisdictions = [
  { value: 'global_generic', labelKey: 'settings.jurisdictionOptions.global_generic' },
  { value: 'us', labelKey: 'settings.jurisdictionOptions.us' },
  { value: 'uk', labelKey: 'settings.jurisdictionOptions.uk' },
  { value: 'eu_generic', labelKey: 'settings.jurisdictionOptions.eu_generic' },
] as const;

const daysOfWeek = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
];

export default function SettingsPage() {
  const { t, translationsLoaded } = useTranslations();
  const { settings, loading, updateSettings } = useSettings();
  const { currentLanguage, setLanguage } = useLanguage();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [activeTab, setActiveTab] = useState('general');

  // Check if user is admin
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role !== 'admin') {
      router.push('/');
    }
  }, [session, status, router]);

  useEffect(() => {
    if (settings) {
      setFormData({
        ...settings,
        language: currentLanguage // Sync with language context
      });
    }
  }, [settings, currentLanguage]);

  // Apply theme changes immediately
  useEffect(() => {
    if (formData.theme) {
      const root = document.documentElement;
      const body = document.body;
      
      // Save theme to localStorage
      localStorage.setItem('theme', formData.theme);
      
      // Remove existing theme classes
      root.classList.remove('light', 'dark');
      body.classList.remove('light', 'dark');
      
      const applyTheme = (isDark: boolean) => {
        if (isDark) {
          root.classList.add('dark');
          body.classList.add('dark');
          root.style.colorScheme = 'dark';
        } else {
          root.classList.add('light');
          body.classList.add('light');
          root.style.colorScheme = 'light';
        }
      };
      
      if (formData.theme === 'dark') {
        applyTheme(true);
      } else if (formData.theme === 'light') {
        applyTheme(false);
      } else if (formData.theme === 'auto') {
        // Auto mode - use system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        applyTheme(prefersDark);
        
        // Listen for system theme changes
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e: MediaQueryListEvent) => {
          applyTheme(e.matches);
        };
        
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
      }
    }
  }, [formData.theme]);
  
  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme && ['light', 'dark', 'auto'].includes(savedTheme)) {
      setFormData((prev: any) => ({
        ...prev,
        theme: savedTheme
      }));
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev: any) => ({
        ...prev,
        [name]: checked
      }));
    } else if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData((prev: any) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      // Handle language change immediately
      if (name === 'language') {
        setLanguage(value); // Update language context immediately
      }
      
      setFormData((prev: any) => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleWorkingDayChange = (day: string, checked: boolean) => {
    setFormData((prev: any) => ({
      ...prev,
      workingHours: {
        ...prev.workingHours,
        days: checked 
          ? [...prev.workingHours.days, day]
          : prev.workingHours.days.filter((d: string) => d !== day)
      }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      await updateSettings(formData);
      setMessage({ type: 'success', text: t('settings.saved') });
    } catch (error) {
      setMessage({ type: 'error', text: t('settings.error') });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm(t('settings.confirmReset'))) {
      setFormData(settings);
    }
  };

  // Check if user is admin - show access denied if not
  if (status === 'authenticated' && session?.user?.role !== 'admin') {
    return (
      <ProtectedRoute>
        <SidebarLayout 
          title="Access Denied" 
          description="You don't have permission to access this page"
        >
          <div className="text-center py-12">
            <Shield className="mx-auto h-12 w-12 text-red-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
            <p className="text-sm text-gray-600 mb-6">
              Only administrators can access system settings.
            </p>
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </div>
        </SidebarLayout>
      </ProtectedRoute>
    );
  }

  // Show loading state if translations aren't loaded yet
  if (!translationsLoaded) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading translations...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <SidebarLayout title={t('settings.title')} description={t('settings.description')}>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </SidebarLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <SidebarLayout 
        title={t('settings.title')} 
        description={t('settings.description')}
      >
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Back Button */}
          <div className="mb-6">
            <Link
              href="/"
              className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>{t('settings.backToDashboard')}</span>
            </Link>
          </div>

          {/* Message */}
          {message && (
            <div className={`p-4 rounded-lg ${
              message.type === 'success' 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {message.text}
            </div>
          )}

          {/* Tabs Layout */}
          <div className="flex bg-white rounded-lg shadow overflow-hidden">
            {/* Left Sidebar Tabs */}
            <div className="w-80 bg-gray-50 border-r border-gray-200">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Settings</h2>
                <nav className="space-y-2">
                  <button
                    onClick={() => setActiveTab('general')}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === 'general'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <SettingsIcon className="h-5 w-5" />
                    <span>{t('settings.general.title')}</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('legal')}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === 'legal'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <Globe className="h-5 w-5" />
                    <span>{t('settings.legal')}</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('appearance')}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === 'appearance'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <Palette className="h-5 w-5" />
                    <span>{t('settings.appearance')}</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('notifications')}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === 'notifications'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <Bell className="h-5 w-5" />
                    <span>{t('settings.notifications')}</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('working-hours')}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === 'working-hours'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <Clock className="h-5 w-5" />
                    <span>{t('settings.workingHours')}</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('contact')}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === 'contact'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <MapPin className="h-5 w-5" />
                    <span>{t('settings.contact')}</span>
                  </button>
                </nav>
              </div>
            </div>

            {/* Right Content Area */}
            <div className="flex-1 p-6">
              <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>

                {/* General Settings Tab */}
                {activeTab === 'general' && (
                  <div>
                    <div className="mb-6">
                      <h3 className="text-xl font-semibold text-gray-900">{t('settings.general.title')}</h3>
                      <p className="text-sm text-gray-600">Basic system configuration</p>
                    </div>
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <SettingsIcon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{t('settings.general.title')}</h3>
                  <p className="text-sm text-gray-600">Basic system configuration</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="systemTitle" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('settings.general.systemTitle')}
                  </label>
                  <input
                    type="text"
                    id="systemTitle"
                    name="systemTitle"
                    value={formData.systemTitle || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('settings.general.currency')}
                  </label>
                  <select
                    id="currency"
                    name="currency"
                    value={formData.currency || 'USD'}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {currencies.map((currency) => (
                      <option key={currency.code} value={currency.code}>
                        {currency.symbol} {currency.name} ({currency.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('settings.general.timezone')}
                  </label>
                  <select
                    id="timezone"
                    name="timezone"
                    value={formData.timezone || 'UTC'}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {timezones.map((tz) => (
                      <option key={tz} value={tz}>{tz}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="dateFormat" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('settings.dateFormat')}
                  </label>
                  <select
                    id="dateFormat"
                    name="dateFormat"
                    value={formData.dateFormat || 'MM/DD/YYYY'}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {dateFormats.map((format) => (
                      <option key={format} value={format}>{format}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="timeFormat" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('settings.timeFormat')}
                  </label>
                  <select
                    id="timeFormat"
                    name="timeFormat"
                    value={formData.timeFormat || '12h'}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="12h">12 Hour (AM/PM)</option>
                    <option value="24h">24 Hour</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="maxAppointmentsPerDay" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('settings.maxAppointmentsPerDay')}
                  </label>
                  <input
                    type="number"
                    id="maxAppointmentsPerDay"
                    name="maxAppointmentsPerDay"
                    value={formData.maxAppointmentsPerDay || 50}
                    onChange={handleInputChange}
                    min="1"
                    max="200"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

                    <div className="mt-6">
                      <label htmlFor="systemDescription" className="block text-sm font-medium text-gray-700 mb-1">
                        {t('settings.general.systemDescription')}
                      </label>
                      <textarea
                        id="systemDescription"
                        name="systemDescription"
                        value={formData.systemDescription || ''}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                )}

                {/* Legal Settings Tab */}
                {activeTab === 'legal' && (
                  <div>
                    <div className="mb-6">
                      <h3 className="text-xl font-semibold text-gray-900">{t('settings.legal')}</h3>
                      <p className="text-sm text-gray-600">{t('settings.legalDescription')}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="jurisdiction" className="block text-sm font-medium text-gray-700 mb-1">
                          {t('settings.jurisdiction')}
                        </label>
                        <select
                          id="jurisdiction"
                          name="jurisdiction"
                          value={formData.jurisdiction || 'global_generic'}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          {jurisdictions.map((j) => (
                            <option key={j.value} value={j.value}>
                              {t(j.labelKey)}
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">{t('settings.jurisdictionHelp')}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Appearance Settings Tab */}
                {activeTab === 'appearance' && (
                  <div>
                    <div className="mb-6">
                      <h3 className="text-xl font-semibold text-gray-900">{t('settings.appearance')}</h3>
                      <p className="text-sm text-gray-600">Visual preferences and language settings</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-1">
                          {t('settings.language')}
                        </label>
                        <select
                          id="language"
                          name="language"
                          value={formData.language || currentLanguage || 'en'}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="en">English</option>
                          <option value="es">Español</option>
                          <option value="fr">Français</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                          Language changes apply immediately
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Notifications Settings Tab */}
                {activeTab === 'notifications' && (
                  <div>
                    <div className="mb-6">
                      <h3 className="text-xl font-semibold text-gray-900">{t('settings.notifications')}</h3>
                      <p className="text-sm text-gray-600">Notification preferences</p>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <label htmlFor="emailNotifications" className="text-sm font-medium text-gray-700">
                            {t('settings.emailNotifications')}
                          </label>
                          <p className="text-xs text-gray-500">Receive notifications via email</p>
                        </div>
                        <input
                          type="checkbox"
                          id="emailNotifications"
                          name="emailNotifications"
                          checked={formData.emailNotifications || false}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <label htmlFor="smsNotifications" className="text-sm font-medium text-gray-700">
                            {t('settings.smsNotifications')}
                          </label>
                          <p className="text-xs text-gray-500">Receive notifications via SMS</p>
                        </div>
                        <input
                          type="checkbox"
                          id="smsNotifications"
                          name="smsNotifications"
                          checked={formData.smsNotifications || false}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <label htmlFor="appointmentReminders" className="text-sm font-medium text-gray-700">
                            {t('settings.appointmentReminders')}
                          </label>
                          <p className="text-xs text-gray-500">Send appointment reminders</p>
                        </div>
                        <input
                          type="checkbox"
                          id="appointmentReminders"
                          name="appointmentReminders"
                          checked={formData.appointmentReminders || false}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </div>

                      {formData.appointmentReminders && (
                        <div>
                          <label htmlFor="reminderTime" className="block text-sm font-medium text-gray-700 mb-1">
                            {t('settings.reminderTime')}
                          </label>
                          <input
                            type="number"
                            id="reminderTime"
                            name="reminderTime"
                            value={formData.reminderTime || 30}
                            onChange={handleInputChange}
                            min="5"
                            max="1440"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Working Hours Tab */}
                {activeTab === 'working-hours' && (
                  <div>
                    <div className="mb-6">
                      <h3 className="text-xl font-semibold text-gray-900">{t('settings.workingHours')}</h3>
                      <p className="text-sm text-gray-600">Configure working hours and days</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="workingHours.start" className="block text-sm font-medium text-gray-700 mb-1">
                          {t('settings.startTime')}
                        </label>
                        <input
                          type="time"
                          id="workingHours.start"
                          name="workingHours.start"
                          value={formData.workingHours?.start || '09:00'}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label htmlFor="workingHours.end" className="block text-sm font-medium text-gray-700 mb-1">
                          {t('settings.endTime')}
                        </label>
                        <input
                          type="time"
                          id="workingHours.end"
                          name="workingHours.end"
                          value={formData.workingHours?.end || '17:00'}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div className="mt-6">
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        {t('settings.workingDays')}
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {daysOfWeek.map((day) => (
                          <div key={day} className="flex items-center">
                            <input
                              type="checkbox"
                              id={day}
                              checked={formData.workingHours?.days?.includes(day) || false}
                              onChange={(e) => handleWorkingDayChange(day, e.target.checked)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor={day} className="ml-2 text-sm text-gray-700">
                              {t(`settings.${day}`)}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Contact Information Tab */}
                {activeTab === 'contact' && (
                  <div>
                    <div className="mb-6">
                      <h3 className="text-xl font-semibold text-gray-900">{t('settings.contact')}</h3>
                      <p className="text-sm text-gray-600">Practice contact information</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                        <label htmlFor="address.street" className="block text-sm font-medium text-gray-700 mb-1">
                          {t('settings.street')}
                        </label>
                        <input
                          type="text"
                          id="address.street"
                          name="address.street"
                          value={formData.address?.street || ''}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label htmlFor="address.city" className="block text-sm font-medium text-gray-700 mb-1">
                          {t('settings.city')}
                        </label>
                        <input
                          type="text"
                          id="address.city"
                          name="address.city"
                          value={formData.address?.city || ''}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label htmlFor="address.state" className="block text-sm font-medium text-gray-700 mb-1">
                          {t('settings.state')}
                        </label>
                        <input
                          type="text"
                          id="address.state"
                          name="address.state"
                          value={formData.address?.state || ''}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label htmlFor="address.country" className="block text-sm font-medium text-gray-700 mb-1">
                          {t('settings.country')}
                        </label>
                        <input
                          type="text"
                          id="address.country"
                          name="address.country"
                          value={formData.address?.country || ''}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label htmlFor="address.postalCode" className="block text-sm font-medium text-gray-700 mb-1">
                          {t('settings.postalCode')}
                        </label>
                        <input
                          type="text"
                          id="address.postalCode"
                          name="address.postalCode"
                          value={formData.address?.postalCode || ''}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label htmlFor="address.phone" className="block text-sm font-medium text-gray-700 mb-1">
                          {t('settings.phone')}
                        </label>
                        <input
                          type="tel"
                          id="address.phone"
                          name="address.phone"
                          value={formData.address?.phone || ''}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label htmlFor="address.email" className="block text-sm font-medium text-gray-700 mb-1">
                          {t('settings.email')}
                        </label>
                        <input
                          type="email"
                          id="address.email"
                          name="address.email"
                          value={formData.address?.email || ''}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

              </form>

              {/* Action Buttons */}
              <div className="mt-8 pt-6 border-t border-gray-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>{t('settings.reset')}</span>
                </button>

                <button
                  type="submit"
                  onClick={(e) => { e.preventDefault(); handleSave(); }}
                  disabled={saving}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Save className="h-4 w-4" />
                  <span>{saving ? t('settings.saving') : t('settings.save')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </SidebarLayout>
    </ProtectedRoute>
  );
}
