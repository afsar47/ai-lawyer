import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import dbConnect from '../../../../lib/mongodb';
import Appointment from '../../../../models/Appointment';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'patient') {
      return NextResponse.json(
        { error: 'Unauthorized - Patient access only' },
        { status: 401 }
      );
    }

    await dbConnect();

    const patientEmail = session.user.email;

    // Find appointments for this patient by email
    const appointments = await Appointment.find({ 
      patientEmail: patientEmail 
    })
      .sort({ appointmentDate: -1 })
      .lean();

    return NextResponse.json({ 
      appointments,
      total: appointments.length 
    });
  } catch (error) {
    console.error('Error fetching patient appointments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch appointments' },
      { status: 500 }
    );
  }
}
