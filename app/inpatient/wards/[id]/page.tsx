'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/app/protected-route';
import SidebarLayout from '@/app/components/sidebar-layout';
import { useTranslations } from '@/app/hooks/useTranslations';
import { 
  ArrowLeft, 
  Edit, 
  Building2, 
  Bed as BedIcon,
  Plus,
  User,
  AlertCircle,
  Wrench,
  Sparkles
} from 'lucide-react';

interface Bed {
  _id: string;
  bedNumber: string;
  type: string;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance' | 'cleaning';
  currentPatientName?: string;
  dailyRate: number;
  features: string[];
  position?: string;
}

interface Ward {
  _id: string;
  wardNumber: string;
  name: string;
  type: string;
  floor: number;
  building?: string;
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  dailyRate: number;
  amenities: string[];
  description?: string;
  isActive: boolean;
  inchargeName?: string;
  contactNumber?: string;
}

export default function WardDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { t, translationsLoaded } = useTranslations();
  const [ward, setWard] = useState<Ward | null>(null);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWardDetails();
  }, [resolvedParams.id]);

  const fetchWardDetails = async () => {
    try {
      const response = await fetch(`/api/inpatient/wards/${resolvedParams.id}`);
      if (response.ok) {
        const data = await response.json();
        setWard(data.ward);
        setBeds(data.beds || []);
      }
    } catch (error) {
      console.error('Error fetching ward:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'available': 'bg-green-100 text-green-800 border-green-300',
      'occupied': 'bg-red-100 text-red-800 border-red-300',
      'reserved': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'maintenance': 'bg-orange-100 text-orange-800 border-orange-300',
      'cleaning': 'bg-blue-100 text-blue-800 border-blue-300',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available':
        return <BedIcon className="h-6 w-6" />;
      case 'occupied':
        return <User className="h-6 w-6" />;
      case 'reserved':
        return <AlertCircle className="h-6 w-6" />;
      case 'maintenance':
        return <Wrench className="h-6 w-6" />;
      case 'cleaning':
        return <Sparkles className="h-6 w-6" />;
      default:
        return <BedIcon className="h-6 w-6" />;
    }
  };

  if (!translationsLoaded || loading) {
    return (
      <ProtectedRoute>
        <SidebarLayout title={t('inpatient.wardDetails')} description="">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </SidebarLayout>
      </ProtectedRoute>
    );
  }

  if (!ward) {
    return (
      <ProtectedRoute>
        <SidebarLayout title={t('inpatient.wardDetails')} description="">
          <div className="text-center py-12">
            <p className="text-gray-500">{t('inpatient.wardNotFound')}</p>
            <Link href="/inpatient/wards" className="text-blue-600 hover:underline mt-2 inline-block">
              {t('common.back')}
            </Link>
          </div>
        </SidebarLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <SidebarLayout
        title={ward.name}
        description={ward.wardNumber}
      >
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Link
              href="/inpatient/wards"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>{t('common.back')}</span>
            </Link>
            <div className="flex items-center gap-3">
              <Link
                href={`/inpatient/beds/new?wardId=${ward._id}`}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="h-5 w-5" />
                <span>{t('inpatient.addBed')}</span>
              </Link>
              <Link
                href={`/inpatient/wards/${ward._id}/edit`}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Edit className="h-5 w-5" />
                <span>{t('common.edit')}</span>
              </Link>
            </div>
          </div>

          {/* Ward Info Card */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <Building2 className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{ward.name}</h2>
                <p className="text-gray-500">{ward.wardNumber}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    ward.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {ward.isActive ? t('inpatient.active') : t('inpatient.inactive')}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-500">{t('inpatient.wardType')}</p>
                <p className="text-base font-medium">{t(`inpatient.wardTypes.${ward.type}`)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t('inpatient.floor')}</p>
                <p className="text-base font-medium">{ward.floor}</p>
              </div>
              {ward.building && (
                <div>
                  <p className="text-sm text-gray-500">{t('inpatient.building')}</p>
                  <p className="text-base font-medium">{ward.building}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">{t('inpatient.dailyRate')}</p>
                <p className="text-base font-medium">${ward.dailyRate.toFixed(2)}</p>
              </div>
              {ward.inchargeName && (
                <div>
                  <p className="text-sm text-gray-500">{t('inpatient.incharge')}</p>
                  <p className="text-base font-medium">{ward.inchargeName}</p>
                </div>
              )}
              {ward.contactNumber && (
                <div>
                  <p className="text-sm text-gray-500">{t('inpatient.contactNumber')}</p>
                  <p className="text-base font-medium">{ward.contactNumber}</p>
                </div>
              )}
            </div>

            {ward.description && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-500 mb-1">{t('inpatient.description')}</p>
                <p className="text-gray-700">{ward.description}</p>
              </div>
            )}

            {ward.amenities && ward.amenities.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-500 mb-2">{t('inpatient.amenities')}</p>
                <div className="flex flex-wrap gap-2">
                  {ward.amenities.map((amenity, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bed Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <BedIcon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{t('inpatient.totalBeds')}</p>
                  <p className="text-2xl font-bold text-gray-900">{ward.totalBeds}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <BedIcon className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{t('inpatient.availableBeds')}</p>
                  <p className="text-2xl font-bold text-gray-900">{ward.availableBeds}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{t('inpatient.occupiedBeds')}</p>
                  <p className="text-2xl font-bold text-gray-900">{ward.occupiedBeds}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{t('inpatient.occupancy')}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {ward.totalBeds > 0 ? Math.round((ward.occupiedBeds / ward.totalBeds) * 100) : 0}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Beds Grid */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">{t('inpatient.bedsInWard')}</h3>
              <Link
                href={`/inpatient/beds/new?wardId=${ward._id}`}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>{t('inpatient.addBed')}</span>
              </Link>
            </div>

            {beds.length === 0 ? (
              <div className="text-center py-12">
                <BedIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">{t('inpatient.noBeds')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {beds.map((bed) => (
                  <Link
                    key={bed._id}
                    href={`/inpatient/beds/${bed._id}`}
                    className={`p-4 rounded-lg border-2 text-center transition-all hover:shadow-md ${getStatusColor(bed.status)}`}
                  >
                    <div className="flex justify-center mb-2">
                      {getStatusIcon(bed.status)}
                    </div>
                    <p className="font-semibold">{bed.bedNumber}</p>
                    <p className="text-xs mt-1 capitalize">{t(`inpatient.bedStatus.${bed.status}`)}</p>
                    {bed.currentPatientName && (
                      <p className="text-xs mt-1 truncate" title={bed.currentPatientName}>
                        {bed.currentPatientName}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            )}

            {/* Legend */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500 mb-3">{t('inpatient.legend')}</p>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-100 border-2 border-green-300 rounded"></div>
                  <span className="text-sm">{t('inpatient.bedStatus.available')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-100 border-2 border-red-300 rounded"></div>
                  <span className="text-sm">{t('inpatient.bedStatus.occupied')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-100 border-2 border-yellow-300 rounded"></div>
                  <span className="text-sm">{t('inpatient.bedStatus.reserved')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-orange-100 border-2 border-orange-300 rounded"></div>
                  <span className="text-sm">{t('inpatient.bedStatus.maintenance')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-100 border-2 border-blue-300 rounded"></div>
                  <span className="text-sm">{t('inpatient.bedStatus.cleaning')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarLayout>
    </ProtectedRoute>
  );
}
