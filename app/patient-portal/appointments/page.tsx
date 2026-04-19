'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useTranslations } from '../../hooks/useTranslations';
import { 
  Calendar,
  Clock,
  User,
  MapPin,
  Phone,
  FileText,
  ChevronRight,
  Filter,
  Search
} from 'lucide-react';

interface Appointment {
  _id: string;
  patientName: string;
  doctorName: string;
  doctorEmail?: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentType: string;
  status: string;
  reason?: string;
  notes?: string;
  symptoms?: string[];
  diagnosis?: string;
  treatment?: string;
}

export default function PatientAppointmentsPage() {
  const { data: session } = useSession();
  const { t } = useTranslations();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const res = await fetch('/api/patient-portal/appointments');
        const data = await res.json();
        setAppointments(data.appointments || []);
      } catch (error) {
        console.error('Error fetching appointments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatShortDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-700 border-green-200';
      case 'completed': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'scheduled': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'in-progress': case 'inProgress': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'consultation': return 'bg-blue-500';
      case 'follow-up': case 'followUp': return 'bg-purple-500';
      case 'checkup': return 'bg-green-500';
      case 'emergency': return 'bg-red-500';
      case 'surgery': return 'bg-orange-500';
      case 'therapy': return 'bg-teal-500';
      default: return 'bg-gray-500';
    }
  };

  const filteredAppointments = appointments.filter(apt => {
    const now = new Date();
    const aptDate = new Date(apt.appointmentDate);
    
    // Filter by time
    if (filter === 'upcoming' && aptDate < now) return false;
    if (filter === 'past' && aptDate >= now) return false;
    
    // Filter by search
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        apt.doctorName.toLowerCase().includes(search) ||
        apt.appointmentType.toLowerCase().includes(search) ||
        apt.reason?.toLowerCase().includes(search)
      );
    }
    
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('patientPortal.appointments.title')}</h1>
        <p className="text-gray-600 mt-1">{t('patientPortal.appointments.subtitle')}</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder={t('patientPortal.appointments.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'upcoming', 'past'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-teal-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {t(`patientPortal.appointments.filter.${f}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Appointments List */}
      <div className="grid gap-4">
        {filteredAppointments.length > 0 ? (
          filteredAppointments.map((apt) => (
            <div
              key={apt._id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="flex">
                {/* Date Badge */}
                <div className="hidden sm:flex flex-col items-center justify-center px-6 py-4 bg-gradient-to-b from-teal-50 to-cyan-50 border-r border-gray-100">
                  <span className="text-3xl font-bold text-teal-600">
                    {new Date(apt.appointmentDate).getDate()}
                  </span>
                  <span className="text-sm text-teal-700 uppercase">
                    {new Date(apt.appointmentDate).toLocaleDateString('en-US', { month: 'short' })}
                  </span>
                </div>

                {/* Appointment Details */}
                <div className="flex-1 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${getTypeColor(apt.appointmentType)}`} />
                        <h3 className="font-semibold text-gray-900">{apt.doctorName}</h3>
                      </div>
                      <p className="text-sm text-gray-500 mt-1 capitalize">{apt.appointmentType.replace('-', ' ')}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(apt.status)}`}>
                      {apt.status.replace('-', ' ')}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      {formatDate(apt.appointmentDate)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-gray-400" />
                      {apt.appointmentTime}
                    </span>
                  </div>

                  {apt.reason && (
                    <p className="mt-2 text-sm text-gray-600">
                      <span className="font-medium">Reason:</span> {apt.reason}
                    </p>
                  )}

                  {/* Show details for completed appointments */}
                  {apt.status === 'completed' && (apt.diagnosis || apt.treatment) && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      {apt.diagnosis && (
                        <p className="text-sm text-gray-700">
                          <span className="font-medium text-gray-900">Diagnosis:</span> {apt.diagnosis}
                        </p>
                      )}
                      {apt.treatment && (
                        <p className="text-sm text-gray-700 mt-1">
                          <span className="font-medium text-gray-900">Treatment:</span> {apt.treatment}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
            <Calendar className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">{t('patientPortal.appointments.noAppointments')}</h3>
            <p className="text-gray-500 mt-1">{t('patientPortal.appointments.noAppointmentsDesc')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
