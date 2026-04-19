import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Appointment from '@/models/Appointment';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    await dbConnect();
    
    // Build query based on user role
    let query: any = {};
    
    if (session?.user) {
      // If user is a doctor, filter by doctor email or name
      if (session.user.role === 'doctor') {
        query.$or = [
          { doctorEmail: session.user.email },
          { doctorName: session.user.name }
        ];
      }
      // If user is admin or staff, show all appointments
      // If user is patient, filter by patient email
      else if (session.user.role === 'patient') {
        query.patientEmail = session.user.email;
      }
      // Admin and staff see all appointments (no filter)
    }
    
    const appointments = await Appointment.find(query).sort({ appointmentDate: -1 });
    return NextResponse.json(appointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch appointments' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    await dbConnect();
    const body = await request.json();
    
    // If logged in as a doctor, automatically set doctor email and name
    if (session?.user?.role === 'doctor') {
      body.doctorEmail = session.user.email;
      if (!body.doctorName && session.user.name) {
        body.doctorName = session.user.name;
      }
    } else if (body.doctorName && !body.doctorEmail) {
      // If admin/staff selected a doctor, find the doctor's email
      const User = (await import('@/models/User')).default;
      const doctor = await User.findOne({ 
        name: body.doctorName,
        role: 'doctor'
      });
      if (doctor) {
        body.doctorEmail = doctor.email;
      }
    }
    
    const appointment = new Appointment(body);
    await appointment.save();
    
    return NextResponse.json(appointment, { status: 201 });
  } catch (error) {
    console.error('Error creating appointment:', error);
    return NextResponse.json(
      { error: 'Failed to create appointment' },
      { status: 500 }
    );
  }
}
