import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import Patient from '../../../models/Patient';
import Appointment from '../../../models/Appointment';
import Report from '../../../models/Report';
import Case from '../../../models/Case';
import Invoice from '../../../models/Invoice';
import Hearing from '../../../models/Hearing';
import Document from '../../../models/Document';
import dbConnect from '../../../lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const role = (session.user as any)?.role || 'doctor';
    const userEmail = ((session.user as any)?.email || '').toLowerCase();
    const userName = (session.user as any)?.name || '';

    // For lawyers, get their case IDs for filtering
    let lawyerCaseIds: string[] = [];
    let lawyerCaseFilter: any = {};
    let lawyerAppointmentFilter: any = {};
    let lawyerHearingFilter: any = {};
    let lawyerInvoiceFilter: any = {};
    let lawyerDocumentFilter: any = { isTemplate: { $ne: true } };

    if (role === 'doctor') {
      const lawyerCases = await Case.find({
        $or: [{ assignedLawyerEmail: userEmail }, { createdByEmail: userEmail }],
      }).select('_id').lean();
      lawyerCaseIds = lawyerCases.map((c: any) => c._id.toString());

      lawyerCaseFilter = {
        $or: [{ assignedLawyerEmail: userEmail }, { createdByEmail: userEmail }],
      };
      lawyerAppointmentFilter = {
        $or: [{ doctorEmail: userEmail }, { doctorName: userName }],
      };
      lawyerHearingFilter = {
        $or: [{ createdByEmail: userEmail }, { caseId: { $in: lawyerCaseIds } }],
      };
      lawyerInvoiceFilter = {
        $or: [{ createdBy: userEmail }, { matterId: { $in: lawyerCaseIds } }],
      };
      lawyerDocumentFilter = {
        isTemplate: { $ne: true },
        $or: [{ createdByEmail: userEmail }, { matterId: { $in: lawyerCaseIds } }],
      };
    }

    // Get today's date range
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    // Get last month's date range for percentage calculations
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
    const startOfLastMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), lastMonth.getDate());
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    // Date windows
    const endOfNext7Days = new Date(startOfToday);
    endOfNext7Days.setDate(endOfNext7Days.getDate() + 7);
    const startOfPrev7Days = new Date(startOfToday);
    startOfPrev7Days.setDate(startOfPrev7Days.getDate() - 7);

    // Build queries based on role
    const openMattersQuery = role === 'doctor' 
      ? { status: 'open', ...lawyerCaseFilter }
      : { status: 'open' };
    const openMattersLastMonthQuery = role === 'doctor'
      ? { status: 'open', createdAt: { $gte: startOfLastMonth, $lt: endOfLastMonth }, ...lawyerCaseFilter }
      : { status: 'open', createdAt: { $gte: startOfLastMonth, $lt: endOfLastMonth } };

    const upcomingDeadlinesQuery = role === 'doctor'
      ? { appointmentDate: { $gte: startOfToday, $lt: endOfNext7Days }, status: { $ne: 'cancelled' }, ...lawyerAppointmentFilter }
      : { appointmentDate: { $gte: startOfToday, $lt: endOfNext7Days }, status: { $ne: 'cancelled' } };
    const upcomingDeadlinesPrevQuery = role === 'doctor'
      ? { appointmentDate: { $gte: startOfPrev7Days, $lt: startOfToday }, status: { $ne: 'cancelled' }, ...lawyerAppointmentFilter }
      : { appointmentDate: { $gte: startOfPrev7Days, $lt: startOfToday }, status: { $ne: 'cancelled' } };

    const unpaidInvoicesQuery = role === 'doctor'
      ? { status: { $in: ['pending', 'partial'] }, ...lawyerInvoiceFilter }
      : { status: { $in: ['pending', 'partial'] } };
    const unpaidInvoicesLastMonthQuery = role === 'doctor'
      ? { status: { $in: ['pending', 'partial'] }, createdAt: { $gte: startOfLastMonth, $lt: endOfLastMonth }, ...lawyerInvoiceFilter }
      : { status: { $in: ['pending', 'partial'] }, createdAt: { $gte: startOfLastMonth, $lt: endOfLastMonth } };

    const recentAppointmentsQuery = role === 'doctor' ? lawyerAppointmentFilter : {};
    const recentDocumentsQuery = lawyerDocumentFilter;

    // Fetch all stats in parallel (excluding Hearing queries which we'll handle separately)
    const [
      openMatters,
      openMattersLastMonth,
      upcomingDeadlines,
      upcomingDeadlinesPrev7Days,
      unpaidInvoices,
      unpaidInvoicesLastMonth,
      recentAppointments,
      recentPatients,
      recentReports,
      recentDocuments
    ] = await Promise.all([
      // Open matters
      Case.countDocuments(openMattersQuery),
      Case.countDocuments(openMattersLastMonthQuery),

      // Upcoming deadlines (proxy: upcoming consultations/events in the next 7 days)
      Appointment.countDocuments(upcomingDeadlinesQuery),
      Appointment.countDocuments(upcomingDeadlinesPrevQuery),

      // Unpaid invoices
      Invoice.countDocuments(unpaidInvoicesQuery),
      Invoice.countDocuments(unpaidInvoicesLastMonthQuery),

      // Recent appointments (get more to ensure we have enough for top 10)
      Appointment.find(recentAppointmentsQuery)
        .sort({ createdAt: -1 })
        .limit(20)
        .select('_id patientName doctorName appointmentDate appointmentTime status createdAt'),

      // Recent patients (get more to ensure we have enough for top 10)
      Patient.find()
        .sort({ createdAt: -1 })
        .limit(20)
        .select('name createdAt'),

      // Recent reports (get more to ensure we have enough for top 10)
      Report.find()
        .sort({ createdAt: -1 })
        .limit(20)
        .select('_id patientName doctorName reportType status createdAt'),

      // Recent documents
      Document.find(recentDocumentsQuery)
        .sort({ createdAt: -1 })
        .limit(5)
        .select('_id documentNumber title type status clientName matterNumber createdAt')
    ]);

    // Handle Hearing queries separately with error handling
    let upcomingHearings = 0;
    let upcomingHearingsPrev7Days = 0;
    let recentHearings: any[] = [];
    
    try {
      const upcomingHearingsQuery = role === 'doctor'
        ? { hearingDate: { $gte: startOfToday, $lt: endOfNext7Days }, status: { $in: ['scheduled', 'confirmed'] }, ...lawyerHearingFilter }
        : { hearingDate: { $gte: startOfToday, $lt: endOfNext7Days }, status: { $in: ['scheduled', 'confirmed'] } };
      const upcomingHearingsPrevQuery = role === 'doctor'
        ? { hearingDate: { $gte: startOfPrev7Days, $lt: startOfToday }, status: { $in: ['scheduled', 'confirmed'] }, ...lawyerHearingFilter }
        : { hearingDate: { $gte: startOfPrev7Days, $lt: startOfToday }, status: { $in: ['scheduled', 'confirmed'] } };
      const recentHearingsQuery = role === 'doctor' ? lawyerHearingFilter : {};

      [upcomingHearings, upcomingHearingsPrev7Days, recentHearings] = await Promise.all([
        Hearing.countDocuments(upcomingHearingsQuery),
        Hearing.countDocuments(upcomingHearingsPrevQuery),
        Hearing.find(recentHearingsQuery)
          .sort({ createdAt: -1 })
          .limit(10)
          .select('_id hearingType hearingDate hearingTime courtName caseNumber clientName status createdAt')
      ]);
    } catch (err) {
      console.error('Error fetching hearing data:', err);
      // Use default values (already set above)
    }

    // Calculate percentage changes
    const calculateChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? '+100%' : '0%';
      const change = ((current - previous) / previous) * 100;
      const sign = change >= 0 ? '+' : '';
      return `${sign}${Math.round(change)}%`;
    };

    // Build stats array
    const stats = [
      {
        name: 'openMatters',
        value: openMatters.toString(),
        change: calculateChange(openMatters, openMattersLastMonth),
        changeType: openMatters >= openMattersLastMonth ? 'positive' : 'negative'
      },
      {
        name: 'upcomingDeadlines',
        value: upcomingDeadlines.toString(),
        change: calculateChange(upcomingDeadlines, upcomingDeadlinesPrev7Days),
        changeType: upcomingDeadlines >= upcomingDeadlinesPrev7Days ? 'positive' : 'negative'
      },
      {
        name: 'upcomingHearings',
        value: upcomingHearings.toString(),
        change: calculateChange(upcomingHearings, upcomingHearingsPrev7Days),
        changeType: upcomingHearings >= upcomingHearingsPrev7Days ? 'positive' : 'negative'
      },
      {
        name: 'unpaidInvoices',
        value: unpaidInvoices.toString(),
        change: calculateChange(unpaidInvoices, unpaidInvoicesLastMonth),
        changeType: unpaidInvoices >= unpaidInvoicesLastMonth ? 'positive' : 'negative'
      }
    ];

    // Build recent activities
    const recentActivities = [];

    // Add recent appointments
    recentAppointments.forEach(appointment => {
      recentActivities.push({
        id: appointment._id.toString(),
        type: 'appointment',
        title: `Consultation scheduled: ${appointment.patientName}`,
        description: `${appointment.doctorName} - ${appointment.appointmentTime}`,
        time: formatTimeAgo(appointment.createdAt),
        createdAt: appointment.createdAt,
        status: appointment.status
      });
    });

    // Add recent clients (patients)
    recentPatients.forEach(patient => {
      recentActivities.push({
        id: `client-${patient._id}`,
        type: 'client',
        title: 'New client added',
        description: patient.name,
        time: formatTimeAgo(patient.createdAt),
        createdAt: patient.createdAt,
        status: 'completed'
      });
    });

    // Add recent reports
    recentReports.forEach(report => {
      recentActivities.push({
        id: report._id.toString(),
        type: 'report',
        title: 'Document created',
        description: `${report.patientName} - ${report.reportType}`,
        time: formatTimeAgo(report.createdAt),
        createdAt: report.createdAt,
        status: report.status
      });
    });

    // Add recent hearings
    recentHearings.forEach(hearing => {
      recentActivities.push({
        id: hearing._id.toString(),
        type: 'hearing',
        title: `Hearing scheduled: ${hearing.hearingType}`,
        description: `${hearing.courtName} - ${hearing.hearingTime}`,
        time: formatTimeAgo(hearing.createdAt),
        createdAt: hearing.createdAt,
        status: hearing.status
      });
    });

    // Sort activities by createdAt date (most recent first) and limit to 5
    recentActivities.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA; // Most recent first
    }).slice(0, 5);

    // Get upcoming appointments (today and future dates)
    // Reuse startOfToday that was already defined above
    const upcomingAppointmentsListQuery = role === 'doctor'
      ? { appointmentDate: { $gte: startOfToday }, status: { $in: ['scheduled', 'confirmed'] }, ...lawyerAppointmentFilter }
      : { appointmentDate: { $gte: startOfToday }, status: { $in: ['scheduled', 'confirmed'] } };

    const upcomingAppointments = await Appointment.find(upcomingAppointmentsListQuery)
    .sort({ appointmentDate: 1, appointmentTime: 1 })
    .limit(4)
    .select('_id patientName appointmentTime appointmentType status appointmentDate');
    
    console.log('Upcoming appointments found:', upcomingAppointments.length);

    const formattedUpcomingAppointments = upcomingAppointments.map(appointment => ({
      id: appointment._id.toString(),
      client: appointment.patientName || 'Unknown Client',
      time: appointment.appointmentTime || 'N/A',
      type: appointment.appointmentType || 'consultation',
      status: appointment.status === 'confirmed' ? 'confirmed' : 'pending'
    }));

    // Get upcoming hearings (today and future dates)
    let upcomingHearingsList = [];
    if (Hearing) {
      try {
        const upcomingHearingsListQuery = role === 'doctor'
          ? { hearingDate: { $gte: startOfToday }, status: { $in: ['scheduled', 'confirmed'] }, ...lawyerHearingFilter }
          : { hearingDate: { $gte: startOfToday }, status: { $in: ['scheduled', 'confirmed'] } };

        upcomingHearingsList = await Hearing.find(upcomingHearingsListQuery)
        .sort({ hearingDate: 1, hearingTime: 1 })
        .limit(4)
        .select('_id hearingType hearingDate hearingTime courtName caseNumber clientName status');
      } catch (err) {
        console.error('Error fetching upcoming hearings:', err);
        upcomingHearingsList = [];
      }
    }

    const formattedUpcomingHearings = upcomingHearingsList.map(hearing => ({
      id: hearing._id.toString(),
      type: hearing.hearingType || 'hearing',
      court: hearing.courtName || 'Unknown Court',
      time: hearing.hearingTime || 'N/A',
      date: hearing.hearingDate,
      caseNumber: hearing.caseNumber || '',
      clientName: hearing.clientName || '',
      status: hearing.status === 'confirmed' ? 'confirmed' : 'scheduled'
    }));

    // Format recent documents
    const formattedRecentDocuments = recentDocuments.map((doc: any) => ({
      id: doc._id.toString(),
      documentNumber: doc.documentNumber || '',
      title: doc.title || 'Untitled',
      type: doc.type || 'other',
      status: doc.status || 'draft',
      clientName: doc.clientName || '',
      matterNumber: doc.matterNumber || '',
      createdAt: doc.createdAt
    }));

    return NextResponse.json({
      stats,
      recentActivities,
      upcomingAppointments: formattedUpcomingAppointments,
      upcomingHearings: formattedUpcomingHearings,
      recentDocuments: formattedRecentDocuments
    });

  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}

// Helper function to format time ago
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));

  if (diffInHours > 0) {
    return `${diffInHours} hours ago`;
  } else if (diffInMinutes > 0) {
    return `${diffInMinutes} minutes ago`;
  } else {
    return 'Just now';
  }
}
