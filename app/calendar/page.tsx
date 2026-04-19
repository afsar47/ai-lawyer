'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus,
  Clock,
  User,
  MapPin,
  Calendar as CalendarIcon
} from 'lucide-react';
import ProtectedRoute from '../protected-route';
import SidebarLayout from '../components/sidebar-layout';
import { useTranslations } from '../hooks/useTranslations';

interface Appointment {
  _id: string;
  patientName: string;
  patientId: string;
  doctorName: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentType: string;
  status: string;
  location: string;
}

interface Hearing {
  _id: string;
  hearingType: string;
  hearingDate: string;
  hearingTime: string;
  courtName: string;
  judgeName?: string;
  caseNumber?: string;
  clientName?: string;
  status: string;
}

export default function CalendarPage() {
  const { t, currentLanguage } = useTranslations();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [hearings, setHearings] = useState<Hearing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [view, setView] = useState<'month' | 'week'>('month');
  const [eventType, setEventType] = useState<'all' | 'appointments' | 'hearings'>('all');

  // Localized day and month names
  const getLocalizedDays = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(2024, 0, i); // Jan 2024 starts on Monday
      days.push(date.toLocaleDateString(currentLanguage === 'es' ? 'es-ES' : currentLanguage === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'short' }));
    }
    return days;
  };

  const getLocalizedMonthYear = (date: Date) => {
    return date.toLocaleDateString(currentLanguage === 'es' ? 'es-ES' : currentLanguage === 'fr' ? 'fr-FR' : 'en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const getLocalizedDate = (date: Date) => {
    return date.toLocaleDateString(currentLanguage === 'es' ? 'es-ES' : currentLanguage === 'fr' ? 'fr-FR' : 'en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [appointmentsRes, hearingsRes] = await Promise.all([
          fetch('/api/appointments'),
          fetch('/api/hearings'),
        ]);
        if (appointmentsRes.ok) {
          const data = await appointmentsRes.json();
          setAppointments(data);
        }
        if (hearingsRes.ok) {
          const data = await hearingsRes.json();
          setHearings(data);
        }
      } catch (error) {
        console.error('Error fetching calendar data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    return { daysInMonth, startingDay, year, month };
  };

  const { daysInMonth, startingDay, year, month } = getDaysInMonth(currentDate);

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const toLocalDateKey = (d: Date) => {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const getAppointmentsForDate = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return appointments.filter(apt => {
      const aptDate = toLocalDateKey(new Date(apt.appointmentDate));
      return aptDate === dateStr;
    });
  };

  const getHearingsForDate = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return hearings.filter(hearing => {
      const hearingDate = toLocalDateKey(new Date(hearing.hearingDate));
      return hearingDate === dateStr;
    });
  };

  const getEventsForDate = (day: number) => {
    const apts = eventType === 'all' || eventType === 'appointments' ? getAppointmentsForDate(day) : [];
    const hrs = eventType === 'all' || eventType === 'hearings' ? getHearingsForDate(day) : [];
    return { appointments: apts, hearings: hrs };
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === month &&
      today.getFullYear() === year
    );
  };

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    return (
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === month &&
      selectedDate.getFullYear() === year
    );
  };

  const handleDateClick = (day: number) => {
    setSelectedDate(new Date(year, month, day));
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'bg-emerald-500';
      case 'pending':
        return 'bg-amber-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'bg-emerald-50 border-emerald-200 text-emerald-800';
      case 'pending':
        return 'bg-amber-50 border-amber-200 text-amber-800';
      case 'cancelled':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const selectedDateEvents = selectedDate
    ? getEventsForDate(selectedDate.getDate())
    : { appointments: [], hearings: [] };

  // Generate calendar grid
  const calendarDays = [];
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < startingDay; i++) {
    calendarDays.push(null);
  }
  
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const DAYS_OF_WEEK = getLocalizedDays();

  return (
    <ProtectedRoute>
      <SidebarLayout 
        title={t('calendar.title')} 
        description={t('calendar.description')}
      >
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Calendar Section */}
          <div className="flex-1">
            {/* Calendar Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={goToPreviousMonth}
                      className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <h2 className="text-xl font-bold text-white capitalize">
                      {getLocalizedMonthYear(currentDate)}
                    </h2>
                    <button
                      onClick={goToNextMonth}
                      className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1 bg-white/20 rounded-lg p-1">
                      <button
                        onClick={() => setEventType('all')}
                        className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                          eventType === 'all' ? 'bg-white text-blue-600' : 'text-white hover:bg-white/20'
                        }`}
                      >
                        All
                      </button>
                      <button
                        onClick={() => setEventType('appointments')}
                        className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                          eventType === 'appointments' ? 'bg-white text-blue-600' : 'text-white hover:bg-white/20'
                        }`}
                      >
                        Appointments
                      </button>
                      <button
                        onClick={() => setEventType('hearings')}
                        className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                          eventType === 'hearings' ? 'bg-white text-blue-600' : 'text-white hover:bg-white/20'
                        }`}
                      >
                        Hearings
                      </button>
                    </div>
                    <button
                      onClick={goToToday}
                      className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      {t('calendar.today')}
                    </button>
                    <Link
                      href="/appointments/new"
                      className="flex items-center space-x-2 px-4 py-2 bg-white text-blue-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      <span>{t('calendar.newAppointment')}</span>
                    </Link>
                    <Link
                      href="/hearings/new"
                      className="flex items-center space-x-2 px-4 py-2 bg-white text-purple-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      <span>New Hearing</span>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Days of Week Header */}
              <div className="grid grid-cols-7 border-b border-gray-100">
                {DAYS_OF_WEEK.map((day) => (
                  <div
                    key={day}
                    className="py-3 text-center text-sm font-semibold text-gray-600 bg-gray-50"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              {loading ? (
                <div className="flex items-center justify-center h-96">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="grid grid-cols-7">
                  {calendarDays.map((day, index) => {
                    const events = day ? getEventsForDate(day) : { appointments: [], hearings: [] };
                    const totalEvents = events.appointments.length + events.hearings.length;
                    
                    return (
                      <div
                        key={index}
                        className={`
                          min-h-[120px] border-b border-r border-gray-100 p-2 transition-colors cursor-pointer
                          ${day ? 'hover:bg-blue-50' : 'bg-gray-50'}
                          ${isToday(day || 0) ? 'bg-blue-50' : ''}
                          ${isSelected(day || 0) ? 'bg-blue-100 ring-2 ring-blue-500 ring-inset' : ''}
                        `}
                        onClick={() => day && handleDateClick(day)}
                      >
                        {day && (
                          <>
                            <div className="flex items-center justify-between mb-1">
                              <span
                                className={`
                                  inline-flex items-center justify-center w-7 h-7 text-sm font-medium rounded-full
                                  ${isToday(day) ? 'bg-blue-600 text-white' : 'text-gray-700'}
                                `}
                              >
                                {day}
                              </span>
                              {totalEvents > 0 && (
                                <span className="text-xs font-medium text-gray-500">
                                  {totalEvents}
                                </span>
                              )}
                            </div>
                            <div className="space-y-1">
                              {events.appointments.slice(0, 2).map((apt) => (
                                <Link
                                  key={apt._id}
                                  href={`/appointments/${apt._id}`}
                                  className={`
                                    block px-2 py-1 text-xs rounded truncate transition-colors
                                    ${getStatusBgColor(apt.status)} border
                                  `}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <span className="font-medium">{apt.appointmentTime}</span>
                                  <span className="ml-1 text-gray-600">{apt.patientName}</span>
                                </Link>
                              ))}
                              {events.hearings.slice(0, 2).map((hearing) => (
                                <Link
                                  key={hearing._id}
                                  href={`/hearings/${hearing._id}`}
                                  className="block px-2 py-1 text-xs rounded truncate transition-colors bg-purple-50 border-purple-200 text-purple-800 border"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <span className="font-medium">{hearing.hearingTime}</span>
                                  <span className="ml-1">{hearing.courtName}</span>
                                </Link>
                              ))}
                              {totalEvents > 4 && (
                                <div className="text-xs text-blue-600 font-medium px-2">
                                  +{totalEvents - 4} {t('calendar.more')}
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Legend */}
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span className="text-gray-600">{t('calendar.legend.confirmed')}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <span className="text-gray-600">{t('calendar.legend.pending')}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-gray-600">{t('calendar.legend.cancelled')}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                <span className="text-gray-600">Hearings</span>
              </div>
            </div>
          </div>

          {/* Sidebar - Selected Date Details */}
          <div className="lg:w-80">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden sticky top-6">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-4">
                <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                  <CalendarIcon className="h-5 w-5" />
                  <span className="capitalize">
                    {selectedDate
                      ? getLocalizedDate(selectedDate)
                      : t('calendar.selectDate')}
                  </span>
                </h3>
              </div>

              <div className="p-4">
                {!selectedDate ? (
                  <div className="text-center py-8">
                    <CalendarIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">
                      {t('calendar.clickToView')}
                    </p>
                  </div>
                ) : selectedDateEvents.appointments.length === 0 && selectedDateEvents.hearings.length === 0 ? (
                  <div className="text-center py-8">
                    <CalendarIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm mb-4">
                      {t('calendar.noAppointments')}
                    </p>
                    <div className="flex flex-col space-y-2">
                      <Link
                        href="/appointments/new"
                        className="inline-flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                        <span>{t('calendar.scheduleAppointment')}</span>
                      </Link>
                      <Link
                        href="/hearings/new"
                        className="inline-flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Schedule Hearing</span>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedDateEvents.appointments.map((apt) => (
                      <Link
                        key={apt._id}
                        href={`/appointments/${apt._id}`}
                        className="block p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${getStatusColor(apt.status)}`}></div>
                            <span className="text-sm font-semibold text-gray-900">
                              {apt.appointmentTime}
                            </span>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${getStatusBgColor(apt.status)}`}>
                            {apt.status}
                          </span>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center text-sm text-gray-700">
                            <User className="h-4 w-4 mr-2 text-gray-400" />
                            <span className="font-medium">{apt.patientName}</span>
                          </div>
                          
                          <div className="flex items-center text-sm text-gray-600">
                            <Clock className="h-4 w-4 mr-2 text-gray-400" />
                            <span>{apt.appointmentType}</span>
                          </div>
                          
                          {apt.location && (
                            <div className="flex items-center text-sm text-gray-600">
                              <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                              <span>{apt.location}</span>
                            </div>
                          )}
                          
                          <div className="text-xs text-gray-500 mt-2">
                            Dr. {apt.doctorName}
                          </div>
                        </div>
                      </Link>
                    ))}
                    {selectedDateEvents.hearings.map((hearing) => (
                      <Link
                        key={hearing._id}
                        href={`/hearings/${hearing._id}`}
                        className="block p-4 rounded-lg border border-purple-200 bg-purple-50 hover:border-purple-300 hover:shadow-md transition-all"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                            <span className="text-sm font-semibold text-gray-900">
                              {hearing.hearingTime}
                            </span>
                          </div>
                          <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-800">
                            {hearing.status.replace('_', ' ')}
                          </span>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center text-sm text-gray-700">
                            <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                            <span className="font-medium">{hearing.courtName}</span>
                          </div>
                          
                          <div className="flex items-center text-sm text-gray-600">
                            <Clock className="h-4 w-4 mr-2 text-gray-400" />
                            <span>{hearing.hearingType.replace('_', ' ')}</span>
                          </div>
                          
                          {hearing.judgeName && (
                            <div className="flex items-center text-sm text-gray-600">
                              <User className="h-4 w-4 mr-2 text-gray-400" />
                              <span>{hearing.judgeName}</span>
                            </div>
                          )}
                          
                          {hearing.caseNumber && (
                            <div className="text-xs text-gray-500 mt-2">
                              Case: {hearing.caseNumber}
                            </div>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="mt-4 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">{t('calendar.thisMonth')}</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {appointments.filter(apt => {
                      const aptDate = new Date(apt.appointmentDate);
                      return aptDate.getMonth() === month && aptDate.getFullYear() === year;
                    }).length}
                  </div>
                  <div className="text-xs text-gray-600">{t('calendar.total')}</div>
                </div>
                <div className="bg-emerald-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-emerald-600">
                    {appointments.filter(apt => {
                      const aptDate = new Date(apt.appointmentDate);
                      return aptDate.getMonth() === month && 
                             aptDate.getFullYear() === year && 
                             apt.status.toLowerCase() === 'confirmed';
                    }).length}
                  </div>
                  <div className="text-xs text-gray-600">{t('calendar.confirmed')}</div>
                </div>
                <div className="bg-amber-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-amber-600">
                    {appointments.filter(apt => {
                      const aptDate = new Date(apt.appointmentDate);
                      return aptDate.getMonth() === month && 
                             aptDate.getFullYear() === year && 
                             apt.status.toLowerCase() === 'pending';
                    }).length}
                  </div>
                  <div className="text-xs text-gray-600">{t('calendar.pending')}</div>
                </div>
                <div className="bg-red-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {appointments.filter(apt => {
                      const aptDate = new Date(apt.appointmentDate);
                      return aptDate.getMonth() === month && 
                             aptDate.getFullYear() === year && 
                             apt.status.toLowerCase() === 'cancelled';
                    }).length}
                  </div>
                  <div className="text-xs text-gray-600">{t('calendar.cancelled')}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarLayout>
    </ProtectedRoute>
  );
}
