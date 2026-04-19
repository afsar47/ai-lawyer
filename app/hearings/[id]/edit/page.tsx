'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '../../../protected-route';
import SidebarLayout from '../../../components/sidebar-layout';
import CaseSearchSelect, { CaseOption } from '../../../components/CaseSearchSelect';

export default function EditHearingPage() {
  const params = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    hearingType: 'motion',
    hearingDate: '',
    hearingTime: '',
    duration: '',
    courtName: '',
    courtAddressStreet: '',
    courtAddressCity: '',
    courtAddressState: '',
    courtAddressZip: '',
    courtroom: '',
    judgeName: '',
    docketNumber: '',
    caseId: '',
    opposingCounsel: '',
    status: 'scheduled',
    notes: '',
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const hearingRes = await fetch(`/api/hearings/${params.id}`);
        const hearingData = await hearingRes.json();
        if (!hearingRes.ok) throw new Error(hearingData?.error || 'Failed to load hearing');

        const hearingDate = hearingData.hearingDate
          ? new Date(hearingData.hearingDate).toISOString().slice(0, 10)
          : '';

        setForm({
          hearingType: hearingData.hearingType || 'motion',
          hearingDate,
          hearingTime: hearingData.hearingTime || '',
          duration: hearingData.duration ? String(hearingData.duration) : '',
          courtName: hearingData.courtName || '',
          courtAddressStreet: hearingData.courtAddress?.street || '',
          courtAddressCity: hearingData.courtAddress?.city || '',
          courtAddressState: hearingData.courtAddress?.state || '',
          courtAddressZip: hearingData.courtAddress?.zip || '',
          courtroom: hearingData.courtroom || '',
          judgeName: hearingData.judgeName || '',
          docketNumber: hearingData.docketNumber || '',
          caseId: hearingData.caseId || '',
          opposingCounsel: hearingData.opposingCounsel || '',
          status: hearingData.status || 'scheduled',
          notes: hearingData.notes || '',
        });
      } catch (err: any) {
        setError(err?.message || 'Failed to load hearing');
      } finally {
        setLoading(false);
      }
    };
    if (params.id) load();
  }, [params.id]);

  const handleCaseChange = (id: string, caseData: CaseOption | null) => {
    setForm((p) => ({ ...p, caseId: id }));
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const payload: any = {
        hearingType: form.hearingType,
        hearingDate: form.hearingDate,
        hearingTime: form.hearingTime,
        courtName: form.courtName,
        status: form.status,
      };

      if (form.duration) payload.duration = Number(form.duration);
      if (form.courtAddressStreet || form.courtAddressCity || form.courtAddressState || form.courtAddressZip) {
        payload.courtAddress = {
          street: form.courtAddressStreet,
          city: form.courtAddressCity,
          state: form.courtAddressState,
          zip: form.courtAddressZip,
        };
      }
      if (form.courtroom) payload.courtroom = form.courtroom;
      if (form.judgeName) payload.judgeName = form.judgeName;
      if (form.docketNumber) payload.docketNumber = form.docketNumber;
      if (form.opposingCounsel) payload.opposingCounsel = form.opposingCounsel;
      if (form.notes) payload.notes = form.notes;
      if (form.caseId) payload.caseId = form.caseId;

      const res = await fetch(`/api/hearings/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to update hearing');
      router.push(`/hearings/${params.id}`);
    } catch (err: any) {
      setError(err?.message || 'Failed to update hearing');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProtectedRoute>
      <SidebarLayout title="Edit Hearing" description="Update hearing details">
        <div className="max-w-3xl mx-auto">
          {loading ? (
            <div className="text-gray-600">Loading...</div>
          ) : (
            <>
              {error && (
                <div className="mb-4 p-3 rounded-lg border border-red-200 bg-red-50 text-red-800 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={onSubmit} className="bg-white rounded-lg shadow p-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hearing Type *</label>
                    <select
                      name="hearingType"
                      value={form.hearingType}
                      onChange={onChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="motion">Motion</option>
                      <option value="trial">Trial</option>
                      <option value="deposition">Deposition</option>
                      <option value="settlement_conference">Settlement Conference</option>
                      <option value="pretrial">Pretrial</option>
                      <option value="status_conference">Status Conference</option>
                      <option value="arraignment">Arraignment</option>
                      <option value="sentencing">Sentencing</option>
                      <option value="mediation">Mediation</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      name="status"
                      value={form.status}
                      onChange={onChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="scheduled">Scheduled</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="adjourned">Adjourned</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hearing Date *</label>
                    <input
                      type="date"
                      name="hearingDate"
                      value={form.hearingDate}
                      onChange={onChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hearing Time *</label>
                    <input
                      type="time"
                      name="hearingTime"
                      value={form.hearingTime}
                      onChange={onChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                    <input
                      type="number"
                      name="duration"
                      value={form.duration}
                      onChange={onChange}
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Court Name *</label>
                  <input
                    name="courtName"
                    value={form.courtName}
                    onChange={onChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Courtroom</label>
                    <input
                      name="courtroom"
                      value={form.courtroom}
                      onChange={onChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Judge Name</label>
                    <input
                      name="judgeName"
                      value={form.judgeName}
                      onChange={onChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Docket Number</label>
                  <input
                    name="docketNumber"
                    value={form.docketNumber}
                    onChange={onChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Court Address - Street</label>
                    <input
                      name="courtAddressStreet"
                      value={form.courtAddressStreet}
                      onChange={onChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input
                      name="courtAddressCity"
                      value={form.courtAddressCity}
                      onChange={onChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                    <input
                      name="courtAddressState"
                      value={form.courtAddressState}
                      onChange={onChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
                    <input
                      name="courtAddressZip"
                      value={form.courtAddressZip}
                      onChange={onChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <CaseSearchSelect
                  label="Case (optional)"
                  value={form.caseId}
                  onChange={handleCaseChange}
                  placeholder="Search and select a case..."
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Opposing Counsel</label>
                  <input
                    name="opposingCounsel"
                    value={form.opposingCounsel}
                    onChange={onChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    name="notes"
                    value={form.notes}
                    onChange={onChange}
                    rows={5}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => router.push(`/hearings/${params.id}`)}
                    className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </SidebarLayout>
    </ProtectedRoute>
  );
}
