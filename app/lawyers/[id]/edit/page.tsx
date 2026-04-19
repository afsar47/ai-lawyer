'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  ArrowLeft,
  Save,
  Phone,
  GraduationCap,
  Building,
  FileText,
  Award,
  Calendar,
  MapPin,
  User,
  AlertCircle,
} from 'lucide-react';
import ProtectedRoute from '../../../protected-route';
import SidebarLayout from '../../../components/sidebar-layout';

function EditLawyerForm() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newQualification, setNewQualification] = useState('');
  const [newPracticeArea, setNewPracticeArea] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'doctor' as 'doctor' | 'admin' | 'staff',
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

  const isAdmin = session?.user?.role === 'admin';

  useEffect(() => {
    if (!isAdmin) {
      router.push('/lawyers');
      return;
    }
    fetchLawyer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, router, (params as any)?.id]);

  const fetchLawyer = async () => {
    try {
      const response = await fetch(`/api/lawyers?id=${(params as any).id}`);
      if (response.ok) {
        const lawyer = await response.json();
        setFormData({
          name: lawyer.name || '',
          email: lawyer.email || '',
          password: '',
          role: lawyer.role || 'doctor',
          phone: lawyer.phone || '',
          specialization: lawyer.specialization || '',
          department: lawyer.department || '',
          licenseNumber: lawyer.licenseNumber || '',
          licenseExpiry: lawyer.licenseExpiry ? new Date(lawyer.licenseExpiry).toISOString().split('T')[0] : '',
          qualifications: lawyer.qualifications || [],
          yearsOfExperience: lawyer.yearsOfExperience?.toString() || '',
          bio: lawyer.bio || '',
          address: lawyer.address || '',
          dateOfBirth: lawyer.dateOfBirth ? new Date(lawyer.dateOfBirth).toISOString().split('T')[0] : '',
          gender: lawyer.gender || '',
          practiceAreas: lawyer.practiceAreas || [],
          defaultHourlyRate:
            lawyer.defaultHourlyRate !== undefined && lawyer.defaultHourlyRate !== null
              ? String(lawyer.defaultHourlyRate)
              : '',
          maxCases: lawyer.maxCases !== undefined && lawyer.maxCases !== null ? String(lawyer.maxCases) : '',
        });
      } else {
        setError('Lawyer not found');
      }
    } catch (err) {
      console.error('Error fetching lawyer:', err);
      setError('Failed to fetch lawyer data');
    } finally {
      setLoading(false);
    }
  };

  const addQualification = () => {
    const q = newQualification.trim();
    if (!q) return;
    setFormData((prev) => ({ ...prev, qualifications: [...prev.qualifications, q] }));
    setNewQualification('');
  };

  const removeQualification = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      qualifications: prev.qualifications.filter((_, i) => i !== index),
    }));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/lawyers?id=${(params as any).id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push('/lawyers');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update lawyer');
      }
    } catch (err) {
      console.error('Error updating lawyer:', err);
      setError('Error updating lawyer. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <SidebarLayout title="Loading..." description="Please wait...">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading lawyer data...</p>
            </div>
          </div>
        </SidebarLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <SidebarLayout title="Edit Lawyer" description="Update lawyer information">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Link
              href="/lawyers"
              className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Lawyers</span>
            </Link>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Leave blank to keep the current password.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <input
                  disabled
                  value={formData.role === 'doctor' ? 'Lawyer' : formData.role}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Specialization</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">License Number</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">License Expiry</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Default Hourly Rate</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Max Active Cases</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Practice Areas</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newPracticeArea}
                  onChange={(e) => setNewPracticeArea(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Corporate, Family, Criminal"
                />
                <button type="button" onClick={addPracticeArea} className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">
                  Add
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Qualifications</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newQualification}
                  onChange={(e) => setNewQualification(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., JD, LLM, Bar Admission"
                />
                <button type="button" onClick={addQualification} className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">
                  Add
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Years of Experience</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData((prev) => ({ ...prev, dateOfBirth: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
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
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </form>
        </div>
      </SidebarLayout>
    </ProtectedRoute>
  );
}

export default function EditLawyerPage() {
  return (
    <Suspense fallback={<div className="p-6 text-gray-600">Loading...</div>}>
      <EditLawyerForm />
    </Suspense>
  );
}

