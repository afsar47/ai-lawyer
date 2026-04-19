'use client';

import { useState } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  Eye, 
  EyeOff, 
  Lock, 
  User, 
  Scale,
  AlertCircle,
  CheckCircle,
  Copy,
  Crown,
  UserCheck
} from 'lucide-react';
import { useEffect } from 'react';
import { useTranslations } from '../hooks/useTranslations';

export default function LoginPage() {
  const { t } = useTranslations();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isDemo, setIsDemo] = useState(false);
  const router = useRouter();

  const demoUsers = [
    { role: 'Admin', email: 'admin@ailawyer.com', password: 'password123', icon: Crown, color: 'bg-purple-100 text-purple-800 border-purple-200' },
    { role: 'Lawyer', email: 'lawyer@ailawyer.com', password: 'password123', icon: Scale, color: 'bg-blue-100 text-blue-800 border-blue-200' },
    { role: 'Staff', email: 'staff@ailawyer.com', password: 'password123', icon: UserCheck, color: 'bg-green-100 text-green-800 border-green-200' },
    { role: 'Client', email: 'client@ailawyer.com', password: 'password123', icon: User, color: 'bg-gray-100 text-gray-800 border-gray-200' },
  ];

  useEffect(() => {
    // Check if user is already logged in
    const checkSession = async () => {
      const session = await getSession();
      if (session) {
        router.push('/');
      }
    };
    checkSession();

    // Check if demo mode is enabled
    const checkDemoMode = async () => {
      try {
        const response = await fetch('/api/demo-check');
        if (response.ok) {
          const data = await response.json();
          setIsDemo(data.isDemo || false);
        }
      } catch (error) {
        console.error('Error checking demo mode:', error);
      }
    };
    checkDemoMode();
  }, [router]);

  const handleDemoLogin = (email: string, password: string) => {
    setFormData({ email, password });
    setError('');
  };

  const copyCredentials = (email: string, password: string) => {
    navigator.clipboard.writeText(`Email: ${email}\nPassword: ${password}`);
    setSuccess('Credentials copied to clipboard!');
    setTimeout(() => setSuccess(''), 2000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    // Basic validation
    if (!formData.email || !formData.password) {
      setError(t('login.required'));
      setIsLoading(false);
      return;
    }

    if (!formData.email.includes('@')) {
      setError(t('login.invalidEmail'));
      setIsLoading(false);
      return;
    }

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        setError(t('login.invalidCredentials'));
      } else {
        setSuccess(t('login.signInSuccess'));
        // Redirect based on role (admin -> admin ops area)
        const session = await getSession();
        const role = (session as any)?.user?.role;
        if (role === 'admin') router.push('/lawyers');
        else if (role === 'patient') router.push('/patient-portal');
        else router.push('/');
      }
    } catch (err) {
      setError(t('login.signInError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className={`w-full ${isDemo ? 'max-w-6xl' : 'max-w-md'} space-y-8`}>
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-20 w-20 bg-blue-600 rounded-full flex items-center justify-center mb-6">
            <Scale className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {t('login.subtitle')}
          </h2>
          <p className="text-gray-600">
            {t('login.description')}
          </p>
        </div>

        {/* Main Content - Horizontal Layout */}
        <div className={`flex flex-col ${isDemo ? 'lg:flex-row' : ''} gap-6 items-start justify-center`}>
          {/* Login Form */}
          <div className={`bg-white rounded-xl shadow-xl p-8 border border-gray-100 ${isDemo ? 'flex-1 max-w-md' : 'w-full'}`}>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                {t('login.email')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder={t('login.email')}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                {t('login.password')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder={t('login.password')}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me */}
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
            </div>

            {/* Error/Success Messages */}
            {error && (
              <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm text-green-700">{success}</span>
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>{t('login.signingIn')}</span>
                </div>
              ) : (
                <span>{t('login.signIn')}</span>
              )}
            </button>
          </form>
          </div>

          {/* Demo Credentials Section - Right Side */}
          {isDemo && (
            <div className={`bg-yellow-50 border border-yellow-200 rounded-xl p-6 ${isDemo ? 'flex-1 max-w-md' : 'w-full'}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-yellow-900 flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Demo Credentials
                </h3>
                <span className="px-2 py-1 bg-yellow-200 text-yellow-800 text-xs font-medium rounded">DEMO MODE</span>
              </div>
              <p className="text-sm text-yellow-800 mb-4">
                Click on any user card below to auto-fill credentials, or copy them to clipboard.
              </p>
              <div className="grid grid-cols-1 gap-3">
                {demoUsers.map((user, index) => {
                  const Icon = user.icon;
                  return (
                    <div
                      key={index}
                      className={`border-2 rounded-lg p-4 cursor-pointer hover:shadow-md transition-all ${user.color}`}
                      onClick={() => handleDemoLogin(user.email, user.password)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white rounded-lg">
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-semibold">{user.role}</p>
                            <p className="text-sm opacity-80">{user.email}</p>
                            <p className="text-xs opacity-70">Password: {user.password}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyCredentials(user.email, user.password);
                          }}
                          className="p-2 hover:bg-white rounded-lg transition-colors"
                          title="Copy credentials"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
