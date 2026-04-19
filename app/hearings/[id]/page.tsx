'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Edit, CalendarClock, MapPin, User, Briefcase, Clock, X } from 'lucide-react';
import ProtectedRoute from '../../protected-route';
import SidebarLayout from '../../components/sidebar-layout';

export default function HearingDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [hearing, setHearing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/hearings/${params.id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'Failed to load hearing');
        setHearing(data);
      } catch (err: any) {
        setError(err?.message || 'Failed to load hearing');
      } finally {
        setLoading(false);
      }
    };
    if (params.id) load();
  }, [params.id]);

  const handleStatusChange = async (newStatus: string) => {
    try {
      const res = await fetch(`/api/hearings/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        setHearing(updated);
      }
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const badge = (value: string) => {
    const base = 'inline-flex px-2 py-1 rounded-full text-xs font-medium';
    if (value === 'scheduled') return `${base} bg-blue-100 text-blue-800`;
    if (value === 'confirmed') return `${base} bg-green-100 text-green-800`;
    if (value === 'in_progress') return `${base} bg-yellow-100 text-yellow-800`;
    if (value === 'completed') return `${base} bg-gray-100 text-gray-800`;
    if (value === 'cancelled') return `${base} bg-red-100 text-red-800`;
    if (value === 'adjourned') return `${base} bg-purple-100 text-purple-800`;
    return `${base} bg-gray-100 text-gray-800`;
  };

  return (
    <ProtectedRoute>
      <SidebarLayout title="Hearing Details" description="View hearing information">
        {loading ? (
          <div className="text-gray-600">Loading...</div>
        ) : error ? (
          <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-red-800 text-sm">{error}</div>
        ) : !hearing ? (
          <div className="text-gray-600">Hearing not found.</div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <Link
                href="/hearings"
                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Hearings
              </Link>
              <div className="flex items-center space-x-2">
                <Link
                  href={`/hearings/${hearing._id}/edit`}
                  className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Edit className="h-4 w-4" />
                  <span>Edit</span>
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">
                    {hearing.hearingType.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {new Date(hearing.hearingDate).toLocaleDateString()} at {hearing.hearingTime}
                  </p>
                </div>
                <span className={badge(hearing.status)}>{hearing.status.replace('_', ' ')}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <CalendarClock className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Date & Time</p>
                      <p className="text-sm text-gray-900">
                        {new Date(hearing.hearingDate).toLocaleDateString()} at {hearing.hearingTime}
                      </p>
                      {hearing.duration && (
                        <p className="text-xs text-gray-500 mt-1">Duration: {hearing.duration} minutes</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Court</p>
                      <p className="text-sm text-gray-900">{hearing.courtName}</p>
                      {hearing.courtAddress && (
                        <p className="text-xs text-gray-500 mt-1">
                          {hearing.courtAddress.street && `${hearing.courtAddress.street}, `}
                          {hearing.courtAddress.city && `${hearing.courtAddress.city}, `}
                          {hearing.courtAddress.state} {hearing.courtAddress.zip}
                        </p>
                      )}
                      {hearing.courtroom && <p className="text-xs text-gray-500 mt-1">Courtroom: {hearing.courtroom}</p>}
                    </div>
                  </div>

                  {hearing.judgeName && (
                    <div className="flex items-start space-x-3">
                      <User className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Judge</p>
                        <p className="text-sm text-gray-900">{hearing.judgeName}</p>
                      </div>
                    </div>
                  )}

                  {hearing.docketNumber && (
                    <div className="flex items-start space-x-3">
                      <Briefcase className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Docket Number</p>
                        <p className="text-sm text-gray-900">{hearing.docketNumber}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {hearing.caseNumber && (
                    <div className="flex items-start space-x-3">
                      <Briefcase className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Case</p>
                        <Link
                          href={hearing.caseId ? `/cases/${hearing.caseId}` : '#'}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          {hearing.caseNumber}
                        </Link>
                      </div>
                    </div>
                  )}

                  {hearing.clientName && (
                    <div className="flex items-start space-x-3">
                      <User className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Client</p>
                        <p className="text-sm text-gray-900">{hearing.clientName}</p>
                        {hearing.clientId && (
                          <Link
                            href={`/clients/${hearing.clientId}`}
                            className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                          >
                            View client profile
                          </Link>
                        )}
                      </div>
                    </div>
                  )}

                  {hearing.opposingCounsel && (
                    <div className="flex items-start space-x-3">
                      <User className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Opposing Counsel</p>
                        <p className="text-sm text-gray-900">{hearing.opposingCounsel}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {hearing.notes && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-sm font-semibold text-gray-900 mb-2">Notes</p>
                  <div className="text-sm text-gray-700 whitespace-pre-wrap">{hearing.notes}</div>
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</p>
                <div className="flex flex-wrap gap-2">
                  {hearing.status !== 'completed' && hearing.status !== 'cancelled' && (
                    <>
                      <button
                        onClick={() => handleStatusChange('completed')}
                        className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        Mark as Completed
                      </button>
                      <button
                        onClick={() => handleStatusChange('cancelled')}
                        className="px-3 py-1.5 text-sm border border-red-300 text-red-700 rounded-lg hover:bg-red-50"
                      >
                        Cancel Hearing
                      </button>
                    </>
                  )}
                  {hearing.status === 'scheduled' && (
                    <button
                      onClick={() => handleStatusChange('confirmed')}
                      className="px-3 py-1.5 text-sm border border-green-300 text-green-700 rounded-lg hover:bg-green-50"
                    >
                      Confirm Hearing
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </SidebarLayout>
    </ProtectedRoute>
  );
}
