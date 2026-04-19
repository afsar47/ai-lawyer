'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Calendar, 
  Plus, 
  Search, 
  Filter,
  Clock,
  Users,
  MapPin,
  MoreVertical
} from 'lucide-react';
import ProtectedRoute from '../protected-route';
import SidebarLayout from '../components/sidebar-layout';
import { useTranslations } from '../hooks/useTranslations';

export default function AppointmentsPage() {
  const { t } = useTranslations();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDate, setFilterDate] = useState('all');
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [showActionsMenu, setShowActionsMenu] = useState<string | null>(null);

  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const response = await fetch('/api/appointments');
        if (response.ok) {
          const data = await response.json();
          setAppointments(data);
        }
      } catch (error) {
        console.error('Error fetching appointments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch = appointment.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         appointment.doctorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         appointment.patientId?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || appointment.status?.toLowerCase() === filterStatus.toLowerCase();
    const matchesDate = filterDate === 'all' || appointment.appointmentDate === filterDate;
    return matchesSearch && matchesStatus && matchesDate;
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'consultation':
        return 'bg-blue-100 text-blue-800';
      case 'follow-up':
        return 'bg-purple-100 text-purple-800';
      case 'examination':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleViewAppointment = (appointment: any) => {
    setSelectedAppointment(appointment);
    // Navigate to appointment view page
    window.location.href = `/appointments/${appointment._id}`;
  };

  const handleEditAppointment = (appointment: any) => {
    setSelectedAppointment(appointment);
    // Navigate to appointment edit page
    window.location.href = `/appointments/${appointment._id}/edit`;
  };

  const handleRescheduleAppointment = (appointment: any) => {
    setSelectedAppointment(appointment);
    // Navigate to appointment reschedule page
    window.location.href = `/appointments/${appointment._id}/reschedule`;
  };

  const handleCancelAppointment = async (appointment: any) => {
    if (confirm(`Are you sure you want to cancel the consultation for ${appointment.patientName}?`)) {
      try {
        const response = await fetch(`/api/appointments/${appointment._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...appointment,
            status: 'cancelled'
          }),
        });

        if (response.ok) {
          // Update the local state
          setAppointments(prev => 
            prev.map(apt => 
              apt._id === appointment._id 
                ? { ...apt, status: 'cancelled' }
                : apt
            )
          );
          alert(`Consultation for ${appointment.patientName} cancelled successfully`);
        } else {
          alert('Failed to cancel consultation. Please try again.');
        }
      } catch (error) {
        console.error('Error cancelling appointment:', error);
        alert('An error occurred while cancelling the consultation.');
      }
    }
  };

  const handleDeleteAppointment = async (appointment: any) => {
    if (confirm(`Are you sure you want to permanently delete the consultation for ${appointment.patientName}? This action cannot be undone.`)) {
      try {
        const response = await fetch(`/api/appointments/${appointment._id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          // Remove from local state
          setAppointments(prev => prev.filter(apt => apt._id !== appointment._id));
          alert(`Consultation for ${appointment.patientName} deleted successfully`);
        } else {
          alert('Failed to delete consultation. Please try again.');
        }
      } catch (error) {
        console.error('Error deleting appointment:', error);
        alert('An error occurred while deleting the consultation.');
      }
    }
  };

  const toggleActionsMenu = (appointmentId: string) => {
    setShowActionsMenu(showActionsMenu === appointmentId ? null : appointmentId);
  };

  // Close actions menu when clicking outside
  const actionsMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target as Node)) {
        setShowActionsMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close menu when pressing Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowActionsMenu(null);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  return (
    <ProtectedRoute>
      <SidebarLayout 
        title={t('appointments.title')} 
        description={t('appointments.description')}
      >
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center space-x-4">
                                    <span className="text-sm text-gray-700 bg-gray-100 px-2 py-1 rounded-full">
              {filteredAppointments.length} {t('appointments.title').toLowerCase()}
            </span>
          </div>
          <Link
            href="/appointments/new"
            className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>{t('appointments.addNew')}</span>
          </Link>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={t('appointments.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">{t('appointments.allStatus')}</option>
                  <option value="confirmed">{t('appointments.upcoming')}</option>
                  <option value="pending">{t('appointments.upcoming')}</option>
                  <option value="cancelled">{t('appointments.cancelled')}</option>
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <select
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">{t('appointments.allDates')}</option>
                  <option value="2024-02-20">{t('appointments.today')} (Feb 20)</option>
                  <option value="2024-02-21">Tomorrow (Feb 21)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Appointments List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">{t('appointments.loading')}</p>
              </div>
            ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    {t('appointments.patientDoctor')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    {t('appointments.dateTime')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    {t('appointments.type')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    {t('appointments.status')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    {t('appointments.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAppointments.map((appointment) => (
                  <tr key={appointment._id || appointment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{appointment.patientName}</div>
                          <div className="text-sm text-gray-500">ID: {appointment.patientId || 'N/A'}</div>
                          <div className="text-sm text-gray-700 font-medium">
                            {appointment.doctorName || 'No lawyer assigned'}
                          </div>
                        </div>
                      </div>
                    </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{new Date(appointment.appointmentDate).toLocaleDateString()}</div>
                      <div className="text-sm text-gray-700 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {appointment.appointmentTime}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(appointment.appointmentType)}`}>
                        {appointment.appointmentType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(appointment.status)}`}>
                        {appointment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <MapPin className="h-3 w-3 mr-1" />
                        {appointment.location}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => handleViewAppointment(appointment)}
                          className="text-blue-600 hover:text-blue-900 hover:underline"
                        >
                          {t('appointments.view')}
                        </button>
                        <button 
                          onClick={() => handleEditAppointment(appointment)}
                          className="text-green-600 hover:text-green-900 hover:underline"
                        >
                          {t('appointments.edit')}
                        </button>
                        <div className="relative" ref={actionsMenuRef}>
                          <button 
                            onClick={() => toggleActionsMenu(appointment._id)}
                            className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                          
                          {showActionsMenu === appointment._id && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                              <div className="py-1">
                                <button
                                  onClick={() => handleViewAppointment(appointment)}
                                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  {t('appointments.viewDetails')}
                                </button>
                                <button
                                  onClick={() => handleEditAppointment(appointment)}
                                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  {t('appointments.editAppointment')}
                                </button>
                                <button
                                  onClick={() => handleRescheduleAppointment(appointment)}
                                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  {t('appointments.reschedule')}
                                </button>
                                <button
                                  onClick={() => handleCancelAppointment(appointment)}
                                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                >
                                  {t('appointments.cancelAppointment')}
                                </button>
                                <button
                                  onClick={() => handleDeleteAppointment(appointment)}
                                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                >
                                  Delete Consultation
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            )}
          </div>
        </div>

        {/* Empty State */}
        {filteredAppointments.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">{t('appointments.noAppointments')}</h3>
            <p className="mt-1 text-sm text-gray-700">
              {searchTerm || filterStatus !== 'all' || filterDate !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : t('appointments.noAppointmentsDesc')
              }
            </p>
            {!searchTerm && filterStatus === 'all' && filterDate === 'all' && (
              <div className="mt-6">
                <Link
                  href="/appointments/new"
                  className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>{t('appointments.addNew')}</span>
                </Link>
              </div>
            )}
          </div>
        )}
      </SidebarLayout>
    </ProtectedRoute>
  );
}
