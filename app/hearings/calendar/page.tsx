'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Plus, CalendarClock } from 'lucide-react';
import ProtectedRoute from '../../protected-route';
import SidebarLayout from '../../components/sidebar-layout';

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

export default function HearingsCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [hearings, setHearings] = useState<Hearing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    const fetchHearings = async () => {
      try {
        const response = await fetch('/api/hearings');
        if (response.ok) {
          const data = await response.json();
          setHearings(data);
        }
      } catch (error) {
        console.error('Error fetching hearings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHearings();
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

  const getHearingsForDate = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return hearings.filter(hearing => {
      const hearingDate = new Date(hearing.hearingDate).toISOString().split('T')[0];
      return hearingDate === dateStr;
    });
  };

  const isToday = (day: number) => {
    const today = new Date();
    return today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
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

  const calendarDays = [];
  for (let i = 0; i < startingDay; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const selectedDateHearings = selectedDate ? getHearingsForDate(selectedDate.getDate()) : [];

  return (
    <ProtectedRoute>
      <SidebarLayout title="Court Calendar" description="View all court hearings">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={goToPreviousMonth}
                      className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <h2 className="text-xl font-bold text-white">
                      {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </h2>
                    <button
                      onClick={goToNextMonth}
                      className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={goToToday}
                      className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      Today
                    </button>
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

              <div className="grid grid-cols-7 border-b border-gray-100">
                {DAYS_OF_WEEK.map((day) => (
                  <div key={day} className="py-3 text-center text-sm font-semibold text-gray-600 bg-gray-50">
                    {day}
                  </div>
                ))}
              </div>

              {loading ? (
                <div className="flex items-center justify-center h-96">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                </div>
              ) : (
                <div className="grid grid-cols-7">
                  {calendarDays.map((day, index) => {
                    const dayHearings = day ? getHearingsForDate(day) : [];
                    return (
                      <div
                        key={index}
                        className={`
                          min-h-[120px] border-b border-r border-gray-100 p-2 transition-colors cursor-pointer
                          ${day ? 'hover:bg-purple-50' : 'bg-gray-50'}
                          ${isToday(day || 0) ? 'bg-purple-50' : ''}
                          ${isSelected(day || 0) ? 'bg-purple-100 ring-2 ring-purple-500 ring-inset' : ''}
                        `}
                        onClick={() => day && handleDateClick(day)}
                      >
                        {day && (
                          <>
                            <div className="flex items-center justify-between mb-1">
                              <span
                                className={`
                                  inline-flex items-center justify-center w-7 h-7 text-sm font-medium rounded-full
                                  ${isToday(day) ? 'bg-purple-600 text-white' : 'text-gray-700'}
                                `}
                              >
                                {day}
                              </span>
                              {dayHearings.length > 0 && (
                                <span className="text-xs font-medium text-gray-500">{dayHearings.length}</span>
                              )}
                            </div>
                            <div className="space-y-1">
                              {dayHearings.slice(0, 3).map((hearing) => (
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
                              {dayHearings.length > 3 && (
                                <div className="text-xs text-purple-600 font-medium px-2">
                                  +{dayHearings.length - 3} more
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
          </div>

          <div className="lg:w-80">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden sticky top-6">
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-4">
                <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                  <CalendarClock className="h-5 w-5" />
                  <span>
                    {selectedDate
                      ? selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
                      : 'Select Date'}
                  </span>
                </h3>
              </div>

              <div className="p-4">
                {!selectedDate ? (
                  <div className="text-center py-8">
                    <CalendarClock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">Click a date to view hearings</p>
                  </div>
                ) : selectedDateHearings.length === 0 ? (
                  <div className="text-center py-8">
                    <CalendarClock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm mb-4">No hearings scheduled</p>
                    <Link
                      href="/hearings/new"
                      className="inline-flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Schedule Hearing</span>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedDateHearings.map((hearing) => (
                      <Link
                        key={hearing._id}
                        href={`/hearings/${hearing._id}`}
                        className="block p-4 rounded-lg border border-purple-200 bg-purple-50 hover:border-purple-300 hover:shadow-md transition-all"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                            <span className="text-sm font-semibold text-gray-900">{hearing.hearingTime}</span>
                          </div>
                          <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-800">
                            {hearing.status.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="space-y-2">
                          <div className="text-sm font-medium text-gray-900">{hearing.courtName}</div>
                          <div className="text-xs text-gray-600">{hearing.hearingType.replace('_', ' ')}</div>
                          {hearing.judgeName && <div className="text-xs text-gray-600">Judge: {hearing.judgeName}</div>}
                          {hearing.caseNumber && (
                            <div className="text-xs text-gray-500">Case: {hearing.caseNumber}</div>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </SidebarLayout>
    </ProtectedRoute>
  );
}
