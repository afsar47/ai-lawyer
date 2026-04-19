'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  ArrowLeft,
  UserPlus,
  Save,
  Phone,
  GraduationCap,
  Building,
  FileText,
  Award,
  Calendar,
  MapPin,
  User,
} from 'lucide-react';
import ProtectedRoute from '../../protected-route';
import SidebarLayout from '../../components/sidebar-layout';
import { useTranslations } from '../../hooks/useTranslations';

function NewLawyerForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const { t } = useTranslations();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get role from query parameter or default to lawyer (role=doctor internally)
  const roleParam = searchParams.get('role') as 'doctor' | 'admin' | 'staff' | null;
  const defaultRole = roleParam && ['doctor', 'admin', 'staff'].includes(roleParam) ? roleParam : 'doctor';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: defaultRole as 'doctor' | 'admin' | 'staff',
    phone: '',
    specialization: '',
    department: '',
    licenseNumber: '',
    licenseExpiry: '',
    qualifications: [] as string[],
    yearsOfExperience: '',
    bio: '',
    address: '',
    dateOfBirth: '',
    gender: '' as 'male' | 'female' | 'other' | 'prefer-not-to-say' | '',
    practiceAreas: [] as string[],
    defaultHourlyRate: '',
    maxCases: '',
  });

  const [newQualification, setNewQualification] = useState('');
  const [newPracticeArea, setNewPracticeArea] = useState('');

  useEffect(() => {
    if (roleParam && ['doctor', 'admin', 'staff'].includes(roleParam)) {
      setFormData((prev) => ({ ...prev, role: roleParam as 'doctor' | 'admin' | 'staff' }));
    }
  }, [roleParam]);

  const isAdmin = session?.user?.role === 'admin';

  if (!isAdmin) {
    router.push('/');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/lawyers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        if (formData.role === 'admin') router.push('/admins');
        else if (formData.role === 'staff') router.push('/staff');
        else router.push('/lawyers');
      } else {
        const errorData = await response.json();
        setError(errorData.error || t('lawyers.newLawyer.failedCreate'));
      }
    } catch (error) {
      console.error('Error creating lawyer:', error);
      setError(t('lawyers.newLawyer.errorCreating'));
    } finally {
      setSaving(false);
    }
  };

  const addQualification = () => {
    const q = newQualification.trim();
    if (!q) return;
    setFormData((prev) => ({ ...prev, qualifications: [...prev.qualifications, q] }));
    setNewQualification('');
  };

  const addPracticeArea = () => {
    const p = newPracticeArea.trim();
    if (!p) return;
    setFormData((prev) => ({ ...prev, practiceAreas: [...prev.practiceAreas, p] }));
    setNewPracticeArea('');
  };

  const removePracticeArea = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      practiceAreas: prev.practiceAreas.filter((_, i) => i !== index),
    }));
  };

  const removeQualification = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      qualifications: prev.qualifications.filter((_, i) => i !== index),
    }));
  };

  return (
    <ProtectedRoute>
      <SidebarLayout
        title={
          formData.role === 'admin'
            ? t('lawyers.newLawyer.titleAdmin')
            : formData.role === 'staff'
              ? t('lawyers.newLawyer.titleStaff')
              : t('lawyers.newLawyer.title')
        }
        description={
          formData.role === 'admin'
            ? t('lawyers.newLawyer.descriptionAdmin')
            : formData.role === 'staff'
              ? t('lawyers.newLawyer.descriptionStaff')
              : t('lawyers.newLawyer.description')
        }
      >
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <Link
              href={formData.role === 'admin' ? '/admins' : formData.role === 'staff' ? '/staff' : '/lawyers'}
              className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>
                {formData.role === 'admin' ? t('lawyers.newLawyer.backToAdmins') : formData.role === 'staff' ? t('lawyers.newLawyer.backToStaff') : t('lawyers.newLawyer.backToLawyers')}
              </span>
            </Link>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('lawyers.newLawyer.fullName')} *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('lawyers.newLawyer.email')} *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('lawyers.newLawyer.password')} *</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('lawyers.newLawyer.role')}</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData((prev) => ({ ...prev, role: e.target.value as any }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="doctor">{t('lawyers.newLawyer.roleLawyer')}</option>
                  <option value="staff">{t('lawyers.newLawyer.roleStaff')}</option>
                  <option value="admin">{t('lawyers.newLawyer.roleAdmin')}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('lawyers.newLawyer.phone')}</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('lawyers.newLawyer.specialization')}</label>
                <div className="relative">
                  <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={formData.specialization}
                    onChange={(e) => setFormData((prev) => ({ ...prev, specialization: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('lawyers.newLawyer.department')}</label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData((prev) => ({ ...prev, department: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('lawyers.newLawyer.licenseNumber')}</label>
                <div className="relative">
                  <Award className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={formData.licenseNumber}
                    onChange={(e) => setFormData((prev) => ({ ...prev, licenseNumber: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('lawyers.newLawyer.licenseExpiry')}</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="date"
                    value={formData.licenseExpiry}
                    onChange={(e) => setFormData((prev) => ({ ...prev, licenseExpiry: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('lawyers.newLawyer.defaultHourlyRate')}</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={formData.defaultHourlyRate}
                  onChange={(e) => setFormData((prev) => ({ ...prev, defaultHourlyRate: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 250"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('lawyers.newLawyer.maxActiveCases')}</label>
                <input
                  type="number"
                  min={0}
                  step="1"
                  value={formData.maxCases}
                  onChange={(e) => setFormData((prev) => ({ ...prev, maxCases: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 25"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('lawyers.newLawyer.practiceAreas')}</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newPracticeArea}
                  onChange={(e) => setNewPracticeArea(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={t('lawyers.newLawyer.practiceAreasPlaceholder')}
                />
                <button
                  type="button"
                  onClick={addPracticeArea}
                  className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  {t('lawyers.newLawyer.add')}
                </button>
              </div>
              {formData.practiceAreas.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {formData.practiceAreas.map((p, idx) => (
                    <button
                      type="button"
                      key={`${p}-${idx}`}
                      onClick={() => removePracticeArea(idx)}
                      className="px-3 py-1 bg-blue-50 text-blue-800 rounded-full text-xs hover:bg-blue-100"
                      title="Click to remove"
                    >
                      {p} ×
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('lawyers.newLawyer.qualifications')}</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newQualification}
                  onChange={(e) => setNewQualification(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={t('lawyers.newLawyer.qualificationsPlaceholder')}
                />
                <button
                  type="button"
                  onClick={addQualification}
                  className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  {t('lawyers.newLawyer.add')}
                </button>
              </div>
              {formData.qualifications.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {formData.qualifications.map((q, idx) => (
                    <button
                      key={`${q}-${idx}`}
                      type="button"
                      onClick={() => removeQualification(idx)}
                      className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100"
                      title="Remove"
                    >
                      {q} ×
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('lawyers.newLawyer.yearsOfExperience')}</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="number"
                    value={formData.yearsOfExperience}
                    onChange={(e) => setFormData((prev) => ({ ...prev, yearsOfExperience: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('lawyers.newLawyer.dateOfBirth')}</label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData((prev) => ({ ...prev, dateOfBirth: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('lawyers.newLawyer.address')}</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={2}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('lawyers.newLawyer.bio')}</label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>{saving ? t('common.saving') : t('common.save')}</span>
              </button>
            </div>
          </form>
        </div>
      </SidebarLayout>
    </ProtectedRoute>
  );
}

export default function NewLawyerPage() {
  return (
    <Suspense fallback={<div className="p-6 text-gray-600">Loading...</div>}>
      <NewLawyerForm />
    </Suspense>
  );
}

