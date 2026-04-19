'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { useTranslations } from '../hooks/useTranslations';
import { useSettings } from '../contexts/SettingsContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { 
  Home,
  Calendar,
  FileText,
  ClipboardList,
  Receipt,
  User,
  LogOut,
  Menu,
  X,
  Bell,
  ChevronDown,
  Scale,
  Brain
} from 'lucide-react';

interface PatientPortalLayoutProps {
  children: React.ReactNode;
}

export default function PatientPortalLayout({ children }: PatientPortalLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [mobileProfileMenuOpen, setMobileProfileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const { t, translationsLoaded } = useTranslations();
  const { settings } = useSettings();
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const mobileProfileMenuRef = useRef<HTMLDivElement>(null);

  // Redirect non-patients to main dashboard
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role !== 'patient') {
      router.push('/');
    }
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, session, router]);

  // Redirect legacy client-portal subroutes to new ones
  useEffect(() => {
    if (pathname.startsWith('/patient-portal/reports')) router.push('/patient-portal/documents');
    if (pathname.startsWith('/patient-portal/medical-records')) router.push('/patient-portal/matters');
    if (pathname.startsWith('/patient-portal/prescriptions')) router.push('/patient-portal/invoices');
    if (pathname.startsWith('/patient-portal/ai-insights')) router.push('/patient-portal');
  }, [pathname, router]);

  const navigation = [
    { id: 'dashboard', label: t('patientPortal.navigation.dashboard'), icon: Home, href: '/patient-portal' },
    { id: 'matters', label: t('patientPortal.navigation.matters'), icon: ClipboardList, href: '/patient-portal/matters' },
    { id: 'documents', label: t('patientPortal.navigation.documents'), icon: FileText, href: '/patient-portal/documents' },
    { id: 'invoices', label: t('patientPortal.navigation.invoices'), icon: Receipt, href: '/patient-portal/invoices' },
    { id: 'appointments', label: t('patientPortal.navigation.appointments'), icon: Calendar, href: '/patient-portal/appointments' },
    { id: 'profile', label: t('patientPortal.navigation.profile'), icon: User, href: '/patient-portal/profile' },
  ];

  // Close profile menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
      if (mobileProfileMenuRef.current && !mobileProfileMenuRef.current.contains(event.target as Node)) {
        setMobileProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const isActiveRoute = (href: string) => {
    if (href === '/patient-portal') {
      return pathname === '/patient-portal';
    }
    return pathname.startsWith(href);
  };

  // Show loading state
  if (!translationsLoaded || status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50 flex">
        <div className="flex items-center justify-center w-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Don't render for non-patients
  if (session?.user?.role !== 'patient') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 bg-gradient-to-r from-teal-600 to-cyan-600">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <Scale className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">
                {t('patientPortal.title')}
              </h1>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded-md text-white/80 hover:text-white"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Patient Info Card */}
        <div className="px-4 py-4 bg-gradient-to-r from-teal-50 to-cyan-50 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-teal-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
              {session?.user?.name?.charAt(0) || 'C'}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{session?.user?.name || 'Client'}</p>
              <p className="text-xs text-teal-600">{session?.user?.patientId || 'Client ID'}</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="px-3 py-4 space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className={`
                flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                ${isActiveRoute(item.href)
                  ? 'bg-teal-100 text-teal-700 shadow-sm'
                  : 'text-gray-700 hover:bg-teal-50 hover:text-teal-700'
                }
              `}
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon className={`h-5 w-5 ${isActiveRoute(item.href) ? 'text-teal-600' : 'text-gray-500'}`} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Language Switcher */}
        <div className="px-3 py-4 border-t border-gray-200 mt-auto">
          <div className="px-3">
            <LanguageSwitcher />
          </div>
        </div>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-gray-200">
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex items-center space-x-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span>{t('profile.logout')}</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-gray-400 hover:text-gray-600"
            >
              <Menu className="h-6 w-6" />
            </button>
            
            <div className="hidden lg:flex items-center space-x-2">
              <Scale className="h-5 w-5 text-teal-600" />
              <span className="text-lg font-semibold text-gray-800">{settings?.systemTitle || 'AI Lawyer'}</span>
            </div>

            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-teal-600 relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <LanguageSwitcher />
              <div className="relative" ref={mobileProfileMenuRef}>
                <button
                  onClick={() => setMobileProfileMenuOpen(!mobileProfileMenuOpen)}
                  className="flex items-center space-x-2 p-2 text-gray-600 hover:text-teal-600"
                >
                  <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {session?.user?.name?.charAt(0) || 'C'}
                  </div>
                  <ChevronDown className={`h-4 w-4 transition-transform ${mobileProfileMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Profile Dropdown Menu */}
                {mobileProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="py-1">
                      <div className="px-4 py-3 border-b border-gray-200">
                        <p className="text-sm font-medium text-gray-900">{session?.user?.name || 'Client'}</p>
                        <p className="text-xs text-gray-500">{session?.user?.email}</p>
                        <p className="text-xs text-teal-600 mt-1">{session?.user?.patientId}</p>
                      </div>
                      <Link
                        href="/patient-portal/profile"
                        className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={() => setMobileProfileMenuOpen(false)}
                      >
                        <User className="h-4 w-4" />
                        <span>{t('patientPortal.navigation.profile')}</span>
                      </Link>
                      <button
                        onClick={() => {
                          setMobileProfileMenuOpen(false);
                          signOut({ callbackUrl: '/login' });
                        }}
                        className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>{t('profile.logout')}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
