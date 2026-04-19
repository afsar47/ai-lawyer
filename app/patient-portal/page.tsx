'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useTranslations } from '../hooks/useTranslations';
import { ArrowRight, Briefcase, Calendar, CheckCircle2, FileText, Receipt } from 'lucide-react';

interface DashboardStats {
  upcomingConsultations: number;
  openMatters: number;
  sharedDocuments: number;
  unpaidInvoices: number;
}

interface Appointment {
  _id: string;
  doctorName: string;
  appointmentDate: string;
  appointmentTime: string;
  status: string;
}

interface SharedDocument {
  _id: string;
  title: string;
  documentNumber: string;
  type: string;
  status: string;
  createdAt: string;
}

export default function PatientPortalDashboard() {
  const { data: session } = useSession();
  const { t } = useTranslations();

  const [stats, setStats] = useState<DashboardStats>({
    upcomingConsultations: 0,
    openMatters: 0,
    sharedDocuments: 0,
    unpaidInvoices: 0,
  });
  const [recentAppointments, setRecentAppointments] = useState<Appointment[]>([]);
  const [recentDocuments, setRecentDocuments] = useState<SharedDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!session?.user?.email) return;
      try {
        const [appointmentsRes, mattersRes, documentsRes, invoicesRes] = await Promise.all([
          fetch('/api/patient-portal/appointments'),
          fetch('/api/patient-portal/matters'),
          fetch('/api/patient-portal/documents'),
          fetch('/api/patient-portal/invoices'),
        ]);

        const appointmentsData = await appointmentsRes.json();
        const mattersData = await mattersRes.json();
        const documentsData = await documentsRes.json();
        const invoicesData = await invoicesRes.json();

        const appointments: Appointment[] = appointmentsData.appointments || [];
        const matters: any[] = mattersData.matters || [];
        const documents: SharedDocument[] = documentsData.documents || [];
        const invoices: any[] = invoicesData.invoices || [];

        const now = new Date();
        const upcomingConsultations = appointments.filter(
          (apt) => new Date(apt.appointmentDate) >= now && apt.status !== 'cancelled'
        ).length;

        const openMatters = matters.filter((m) => m.status !== 'closed').length;
        const sharedDocuments = documents.length;
        const unpaidInvoices = invoices.filter((inv) => ['pending', 'partial'].includes(inv.status)).length;

        setStats({ upcomingConsultations, openMatters, sharedDocuments, unpaidInvoices });
        setRecentAppointments(appointments.slice(0, 3));
        setRecentDocuments(documents.slice(0, 3));
      } catch (error) {
        console.error('Error fetching client portal dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [session?.user?.email]);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'completed':
      case 'final':
      case 'paid':
        return 'bg-green-100 text-green-700';
      case 'scheduled':
      case 'pending':
      case 'partial':
      case 'draft':
        return 'bg-yellow-100 text-yellow-700';
      case 'cancelled':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

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
      <div className="bg-gradient-to-r from-teal-600 to-cyan-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              {t('patientPortal.dashboard.welcome')}, {session?.user?.name?.split(' ')[0]}!
            </h1>
            <p className="text-teal-100">Here’s an overview of your cases, documents, and invoices.</p>
          </div>
          <div className="hidden md:block">
            <Briefcase className="h-16 w-16 text-white/20" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/patient-portal/appointments"
          className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Upcoming Consultations</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.upcomingConsultations}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Link>

        <Link
          href="/patient-portal/matters"
          className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Open Cases</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.openMatters}</p>
            </div>
            <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
              <Briefcase className="h-6 w-6 text-teal-700" />
            </div>
          </div>
        </Link>

        <Link
          href="/patient-portal/documents"
          className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Shared Documents</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.sharedDocuments}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <FileText className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </Link>

        <Link
          href="/patient-portal/invoices"
          className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Unpaid Invoices</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.unpaidInvoices}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <Receipt className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </Link>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-teal-600" />
              Recent consultations
            </h2>
            <Link
              href="/patient-portal/appointments"
              className="text-sm text-teal-600 hover:text-teal-700 flex items-center gap-1"
            >
              {t('patientPortal.dashboard.viewAll')}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="p-4">
            {recentAppointments.length > 0 ? (
              <div className="space-y-3">
                {recentAppointments.map((apt) => (
                  <div
                    key={apt._id}
                    className="flex items-center justify-between gap-4 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">{apt.doctorName}</p>
                      <p className="text-sm text-gray-500">
                        {formatDate(apt.appointmentDate)} at {apt.appointmentTime}
                      </p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(apt.status)}`}>
                      {apt.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                <p>No consultations scheduled.</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-600" />
              Shared documents
            </h2>
            <Link
              href="/patient-portal/documents"
              className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1"
            >
              {t('patientPortal.dashboard.viewAll')}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="p-4">
            {recentDocuments.length > 0 ? (
              <div className="space-y-3">
                {recentDocuments.map((doc) => (
                  <Link
                    key={doc._id}
                    href={`/patient-portal/documents/${doc._id}`}
                    className="block p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{doc.title}</p>
                        <p className="text-sm text-gray-500">
                          {doc.documentNumber} • {doc.type}
                        </p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(doc.status)}`}>
                        {doc.status === 'final' ? <CheckCircle2 className="h-3 w-3 mr-1 inline" /> : null}
                        {doc.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                <p>No shared documents yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
