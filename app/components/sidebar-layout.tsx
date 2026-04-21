'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { useTranslations } from '../hooks/useTranslations';
import { useSettings } from '../contexts/SettingsContext';
import LanguageSwitcher from './LanguageSwitcher';
import { 
  Users, 
  Calendar, 
  CalendarDays,
  CalendarClock,
  Briefcase,
  FileText, 
  Receipt,
  Home,
  Scale,
  Stethoscope,
  Plus,
  LogOut,
  Menu,
  X,
  Bell,
  Settings,
  Brain,
  TrendingUp,
  Pill,
  Camera,
  Shield,
  LineChart,
  Mic,
  User,
  ChevronDown,
  ChevronRight,
  UserPlus,
  UserCheck,
  Crown,
  List,
  BarChart3,
  MessageSquare,
  PieChart,
  DollarSign,
  Activity,
  Target,
  ClipboardList,
  Clock,
  FlaskConical,
  TestTube,
  ClipboardCheck,
  Building2,
  Bed,
  HeartPulse,
  Radio,
  Image,
  Package,
  Truck,
  ShoppingCart,
  Gavel
} from 'lucide-react';

interface SidebarLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
}

interface NavigationItem {
  id: string;
  label: string;
  icon: any;
  href: string;
  roles: string[];
  children?: NavigationItem[];
}

export default function SidebarLayout({ children, title, description }: SidebarLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [mobileProfileMenuOpen, setMobileProfileMenuOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());
  const pathname = usePathname();
  const { data: session } = useSession();
  const { t, translationsLoaded } = useTranslations();
  const { settings } = useSettings();
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const mobileProfileMenuRef = useRef<HTMLDivElement>(null);

  const isAdmin = session?.user?.role === 'admin';

  // Map internal role names to display-friendly names
  const getRoleDisplayName = (role: string | undefined) => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'doctor': return 'Lawyer';
      case 'staff': return 'Staff';
      case 'patient': return 'Client';
      default: return role || 'Lawyer';
    }
  };

  const toggleSubmenu = (menuId: string) => {
    setExpandedMenus(prev => {
      const newSet = new Set(prev);
      if (newSet.has(menuId)) {
        newSet.delete(menuId);
      } else {
        newSet.add(menuId);
      }
      return newSet;
    });
  };

  const navigation: NavigationItem[] = [
    // Main
    { id: 'dashboard', label: t('navigation.dashboard'), icon: Home, href: '/dashboard', roles: ['admin', 'doctor', 'staff'] },

    // People
    { id: 'lawyers', label: t('navigation.doctors'), icon: UserPlus, href: '/lawyers', roles: ['admin'] },
    { id: 'clients', label: t('navigation.patients'), icon: Users, href: '/clients', roles: ['admin', 'doctor', 'staff'] },

    // Case Management
    { 
      id: 'case-management', 
      label: t('navigation.caseManagement'), 
      icon: Briefcase, 
      href: '/cases', 
      roles: ['admin', 'doctor', 'staff'],
      children: [
        { id: 'cases', label: t('navigation.cases'), icon: Briefcase, href: '/cases', roles: ['admin', 'doctor', 'staff'] },
        { id: 'tasks', label: t('navigation.tasks'), icon: ClipboardList, href: '/tasks', roles: ['admin', 'doctor', 'staff'] },
        { id: 'deadlines', label: t('navigation.deadlines'), icon: CalendarClock, href: '/deadlines', roles: ['admin', 'doctor', 'staff'] },
        { id: 'hearings', label: t('navigation.hearings'), icon: Gavel, href: '/hearings', roles: ['admin', 'doctor', 'staff'] }
      ]
    },

    // Schedule
    { 
      id: 'schedule', 
      label: t('navigation.schedule'), 
      icon: CalendarDays, 
      href: '/calendar', 
      roles: ['admin', 'doctor', 'staff'],
      children: [
        { id: 'calendar', label: t('navigation.calendar'), icon: CalendarDays, href: '/calendar', roles: ['admin', 'doctor', 'staff'] },
        { id: 'appointments', label: t('navigation.appointments'), icon: Calendar, href: '/appointments', roles: ['admin', 'doctor', 'staff'] }
      ]
    },

    // Billing
    { 
      id: 'billing', 
      label: t('navigation.billing'), 
      icon: Receipt, 
      href: '/billing', 
      roles: ['admin', 'doctor', 'staff'],
      children: [
        { id: 'billing-home', label: t('billing.title'), icon: Receipt, href: '/billing', roles: ['admin', 'doctor', 'staff'] },
        { id: 'billing-new', label: t('billing.addNewInvoice'), icon: Plus, href: '/billing/invoices/new', roles: ['admin', 'doctor', 'staff'] },
        { id: 'service-items', label: t('navigation.serviceItems'), icon: List, href: '/billing/service-items', roles: ['admin', 'staff'] }
      ]
    },

    // Documents
    { 
      id: 'documents-menu', 
      label: t('navigation.documents'), 
      icon: FileText, 
      href: '/documents', 
      roles: ['admin', 'doctor', 'staff'],
      children: [
        { id: 'documents', label: t('navigation.allDocuments'), icon: FileText, href: '/documents', roles: ['admin', 'doctor', 'staff'] },
        { id: 'templates', label: t('navigation.templates'), icon: List, href: '/documents/templates', roles: ['admin', 'doctor', 'staff'] },
        { id: 'documents-upload', label: t('navigation.upload'), icon: Plus, href: '/documents/upload', roles: ['admin', 'doctor', 'staff'] }
      ]
    },

    // AI Features
    { id: 'ai-drafting', label: t('navigation.aiDrafting'), icon: FileText, href: '/ai-drafting', roles: ['admin', 'doctor', 'staff'] },
    { id: 'ai-case-intake', label: t('navigation.aiCaseIntake'), icon: ClipboardCheck, href: '/ai-matter-intake', roles: ['admin', 'doctor', 'staff'] },
    { id: 'ai-timeline', label: t('navigation.aiTimeline'), icon: BarChart3, href: '/ai-timeline', roles: ['admin', 'doctor', 'staff'] },
    { id: 'ai-contract-review', label: t('navigation.aiContractReview'), icon: Shield, href: '/ai-contract-review', roles: ['admin', 'doctor', 'staff'] },
    { id: 'ai-motion-draft', label: t('navigation.aiMotionDraft'), icon: Gavel, href: '/ai-motion-draft', roles: ['admin', 'doctor', 'staff'] },
    { id: 'ai-letter-pack', label: t('navigation.aiLetterPack'), icon: FileText, href: '/ai-letter-pack', roles: ['admin', 'doctor', 'staff'] },
    { id: 'ai-knowledge-search', label: t('navigation.aiKnowledgeSearch'), icon: MessageSquare, href: '/ai-knowledge-search', roles: ['admin', 'doctor', 'staff'] },
    { id: 'ai-assistant', label: t('navigation.aiAssistant'), icon: Brain, href: '/ai-assistant', roles: ['admin', 'doctor', 'staff'] },

    // Activity
    { id: 'activity', label: t('navigation.activity'), icon: Activity, href: '/activity', roles: ['admin', 'doctor', 'staff'] }
  ].filter(item => {
    const userRole = session?.user?.role || 'doctor';
    // Filter parent items
    if (!item.roles.includes(userRole)) return false;
    // Filter children if they exist
    if (item.children) {
      item.children = item.children.filter(child => child.roles.includes(userRole));
      // If no children remain and parent has no direct href functionality, we might want to hide it
      // But for billing, we want to show it even if user can't access service-items
    }
    return true;
  });

  const handleLogout = () => {
    signOut({ callbackUrl: '/login' });
  };

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
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  // Auto-expand menus based on current route
  useEffect(() => {
    const newExpanded = new Set<string>();
    
    // Case Management routes
    if (pathname.startsWith('/cases') || 
        pathname.startsWith('/tasks') || pathname.startsWith('/deadlines') || 
        pathname.startsWith('/hearings')) {
      newExpanded.add('case-management');
    }
    
    // Documents routes
    if (pathname.startsWith('/documents')) {
      newExpanded.add('documents-menu');
    }
    
    // Billing routes
    if (pathname.startsWith('/billing')) {
      newExpanded.add('billing');
    }
    
    // Schedule routes
    if (pathname.startsWith('/calendar') || pathname.startsWith('/appointments')) {
      newExpanded.add('schedule');
    }
    
    setExpandedMenus(prev => {
      const combined = new Set(prev);
      newExpanded.forEach(id => combined.add(id));
      return combined;
    });
  }, [pathname]);

  // Show loading state if translations aren't loaded yet
  if (!translationsLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <div className="flex items-center justify-center w-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading translations...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Scale className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {settings?.systemTitle || ''}
              </h1>
              <p className="text-xs text-gray-700">
                {settings?.systemDescription || ''}
              </p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded-md text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>


        {/* Navigation Menu */}
        <nav className="px-3 py-4 space-y-1">
          {navigation.map((item) => {
            const hasChildren = item.children && item.children.length > 0;
            const isExpanded = expandedMenus.has(item.id);
            const isActive = isActiveRoute(item.href) || (hasChildren && item.children?.some(child => isActiveRoute(child.href)));

            return (
              <div key={item.id}>
                {hasChildren ? (
                  <>
                    <button
                      onClick={() => toggleSubmenu(item.id)}
                      className={`
                        w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors
                        ${isActive
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                        }
                      `}
                    >
                      <div className="flex items-center space-x-3">
                        <item.icon className="h-5 w-5" />
                        <span>{item.label}</span>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                    {isExpanded && hasChildren && (
                      <div className="ml-4 mt-1 space-y-1">
                        {item.children?.map((child) => (
                          <Link
                            key={child.id}
                            href={child.href}
                            className={`
                              flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                              ${isActiveRoute(child.href)
                                ? 'bg-blue-100 text-blue-700'
                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                              }
                            `}
                            onClick={() => setSidebarOpen(false)}
                          >
                            <child.icon className="h-4 w-4" />
                            <span>{child.label}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
            <Link
              href={item.href}
              className={`
                flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                      ${isActive
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }
              `}
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
                )}
              </div>
            );
          })}
        </nav>

        {/* General Settings - Admin Only */}
        {isAdmin && (
          <div className="px-3 py-4 border-t border-gray-200">
            <div className="space-y-1">
              <Link
                href="/settings"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                onClick={() => setSidebarOpen(false)}
              >
                <Settings className="h-4 w-4 text-gray-600" />
                <span>{t('navigation.settings')}</span>
              </Link>
              <Link
                href="/ai-settings"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                onClick={() => setSidebarOpen(false)}
              >
                <Settings className="h-4 w-4 text-purple-600" />
                <span>{t('navigation.aiSettings')}</span>
              </Link>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="px-3 py-4 border-t border-gray-200">
          <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3 px-3">
            {t('quickActions.title')}
          </h3>
          <div className="space-y-1">
            <Link
              href="/clients/new"
              className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              <Plus className="h-4 w-4 text-blue-600" />
              <span>{t('quickActions.newPatient')}</span>
            </Link>
            <Link
              href="/appointments/new"
              className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              <Plus className="h-4 w-4 text-green-600" />
              <span>{t('quickActions.newAppointment')}</span>
            </Link>
            {isAdmin && (
              <Link
                href="/lawyers/new"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                onClick={() => setSidebarOpen(false)}
              >
                <UserPlus className="h-4 w-4 text-purple-600" />
                <span>{t('quickActions.newDoctor')}</span>
              </Link>
            )}
          </div>
        </div>

        {/* Language Switcher */}
        <div className="px-3 py-4 border-t border-gray-200">
          <div className="px-3">
            <LanguageSwitcher />
          </div>
        </div>

        {/* Administration - Admin Only (bottom) */}
        {isAdmin && (
          <div className="px-3 py-4 border-t border-gray-200">
            <Link
              href="/staff"
              className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              <UserCheck className="h-4 w-4 text-gray-600" />
              <span>{t('navigation.staff')}</span>
            </Link>
          </div>
        )}

        {/* User Profile */}
        <div className="px-3 py-4 border-t border-gray-200">
          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              className="flex items-center space-x-3 w-full p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                {session?.user?.name?.charAt(0) || 'D'}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {session?.user?.name || t('auth.doctor')}
                </p>
                <p className="text-xs text-gray-700">{getRoleDisplayName(session?.user?.role)}</p>
              </div>
              <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${profileMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Profile Dropdown Menu */}
            {profileMenuOpen && (
              <div className="absolute bottom-full left-3 right-3 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="py-1">
                  <Link
                    href="/profile"
                    className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    onClick={() => setProfileMenuOpen(false)}
                  >
                    <User className="h-4 w-4" />
                    <span>{t('profile.profileSettings')}</span>
                  </Link>
                  <button
                    onClick={() => {
                      setProfileMenuOpen(false);
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 lg:hidden">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <Bell className="h-5 w-5" />
              </button>
              <LanguageSwitcher />
              <div className="relative" ref={mobileProfileMenuRef}>
                <button
                  onClick={() => setMobileProfileMenuOpen(!mobileProfileMenuOpen)}
                  className="flex items-center space-x-2 p-2 text-gray-400 hover:text-gray-600"
                >
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {session?.user?.name?.charAt(0) || 'D'}
                  </div>
                  <ChevronDown className={`h-4 w-4 transition-transform ${mobileProfileMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Mobile Profile Dropdown Menu */}
                {mobileProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="py-1">
                      <div className="px-4 py-2 border-b border-gray-200">
                        <p className="text-sm font-medium text-gray-900">{session?.user?.name || t('auth.doctor')}</p>
                        <p className="text-xs text-gray-600">{session?.user?.email || 'doctor@aidoc.com'}</p>
                      </div>
                      <Link
                        href="/profile"
                        className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={() => setMobileProfileMenuOpen(false)}
                      >
                        <User className="h-4 w-4" />
                        <span>{t('profile.profileSettings')}</span>
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
            {/* Page Header */}
            <div className="mb-8 print:hidden">
              <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
              {description && (
                                        <p className="text-gray-700">{description}</p>
              )}
            </div>

            {/* Page Content */}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
