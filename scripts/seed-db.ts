// Load environment variables from .env.local BEFORE any other imports
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local'), override: true });

import mongoose from 'mongoose';
import User from '../models/User';
import Patient from '../models/Patient';
import Appointment from '../models/Appointment';
import Report from '../models/Report';
import Settings from '../models/Settings';
import Case from '../models/Case';
import dbConnect from '../lib/mongodb';
import bcrypt from 'bcryptjs';

async function seedDatabase() {
  try {
    await dbConnect();
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Patient.deleteMany({});
    await Appointment.deleteMany({});
    await Report.deleteMany({});
    await Settings.deleteMany({});
    await Case.deleteMany({});
    console.log('Cleared existing data');

    // Seed system settings (single-tenant)
    const settings = new Settings({
      systemTitle: 'AI Lawyer',
      systemDescription: 'AI Powered Law Firm Management System',
      jurisdiction: 'global_generic',
      currency: 'USD',
      timezone: 'UTC',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',
      language: 'en',
      theme: 'light',
    });
    await settings.save();
    console.log('Created system settings');

    // Demo credentials (for local/demo installs)
    const defaultPassword = 'password123';
    const hashedPassword = await bcrypt.hash(defaultPassword, 12);

    // Admin (full access)
    const admin = new User({
      email: 'admin@ailawyer.com',
      name: 'Admin (AI Lawyer)',
      role: 'admin',
      password: hashedPassword,
    });
    await admin.save();

    // Lawyer (mapped to existing 'doctor' role for now)
    const lawyer = new User({
      email: 'lawyer@ailawyer.com',
      name: 'Jordan Blake',
      role: 'doctor',
      password: hashedPassword,
      phone: '+1-555-1000',
      specialization: 'Corporate & Contracts',
      department: 'Legal',
      licenseNumber: 'BAR-000123',
      yearsOfExperience: 8,
    });
    await lawyer.save();

    // Staff
    const staff = new User({
      email: 'staff@ailawyer.com',
      name: 'Case Coordinator',
      role: 'staff',
      password: hashedPassword,
      phone: '+1-555-2000',
      department: 'Operations',
    });
    await staff.save();

    // Client portal user (mapped to existing 'patient' role for now)
    const clientUser = new User({
      email: 'client@ailawyer.com',
      name: 'Alex Client',
      role: 'patient',
      password: hashedPassword,
    });
    await clientUser.save();

    console.log('Created demo users:');
    console.log('- admin:  admin@ailawyer.com / password123');
    console.log('- lawyer: lawyer@ailawyer.com / password123');
    console.log('- staff:  staff@ailawyer.com / password123');
    console.log('- client: client@ailawyer.com / password123');

    // Create sample clients (stored in existing Patient schema for now)
    const patients = [
      {
        name: 'Alex Client',
        email: 'client@ailawyer.com',
        phone: '+1-555-0101',
        dateOfBirth: new Date('1992-03-15'),
        gender: 'other' as const,
        address: '123 Main St, Anytown, USA',
        emergencyContact: {
          name: 'Taylor Client',
          phone: '+1-555-0102',
          relationship: 'Family'
        },
        medicalHistory: [],
        allergies: [],
        currentMedications: [],
        assignedDoctor: lawyer.name
      },
      {
        name: 'Sarah Johnson',
        email: 'sarah.johnson@clientmail.com',
        phone: '+1-555-0201',
        dateOfBirth: new Date('1990-07-22'),
        gender: 'female' as const,
        address: '456 Oak Ave, Somewhere, USA',
        emergencyContact: {
          name: 'John Johnson',
          phone: '+1-555-0202',
          relationship: 'Spouse'
        },
        medicalHistory: [],
        allergies: [],
        currentMedications: [],
        assignedDoctor: lawyer.name
      },
      {
        name: 'Michael Chen',
        email: 'michael.chen@clientmail.com',
        phone: '+1-555-0301',
        dateOfBirth: new Date('1988-11-08'),
        gender: 'male' as const,
        address: '789 Pine Rd, Elsewhere, USA',
        emergencyContact: {
          name: 'Lisa Chen',
          phone: '+1-555-0302',
          relationship: 'Sister'
        },
        medicalHistory: [],
        allergies: [],
        currentMedications: [],
        assignedDoctor: lawyer.name
      }
    ];

    // Create patients one by one to trigger pre-save hook for patientId generation
    const createdPatients = [];
    for (const patientData of patients) {
      const patient = new Patient(patientData);
      await patient.save();
      createdPatients.push(patient);
    }
    console.log(`Created ${createdPatients.length} patients`);

    // Create sample consultations (stored in existing Appointment schema for now)
    const appointments = [
      {
        patientId: createdPatients[0]._id.toString(),
        patientName: createdPatients[0].name,
        patientEmail: createdPatients[0].email,
        patientPhone: '+1-555-0101',
        doctorName: lawyer.name,
        doctorEmail: lawyer.email,
        appointmentDate: new Date(),
        appointmentTime: '09:00 AM',
        appointmentType: 'consultation' as const,
        status: 'confirmed' as const,
        reason: 'Contract review consultation',
        notes: 'Review a service agreement and suggest revisions.',
        symptoms: ['Contract review', 'Risk spotting'],
        diagnosis: 'Contract risk review',
        treatment: 'Provide redlines and negotiation points'
      },
      {
        patientId: createdPatients[1]._id.toString(),
        patientName: createdPatients[1].name,
        patientEmail: createdPatients[1].email,
        patientPhone: '+1-555-0201',
        doctorName: lawyer.name,
        doctorEmail: lawyer.email,
        appointmentDate: new Date(),
        appointmentTime: '10:30 AM',
        appointmentType: 'follow-up' as const,
        status: 'confirmed' as const,
        reason: 'NDA drafting follow-up',
        notes: 'Finalize NDA with jurisdiction defaults (Global/Generic).',
        symptoms: ['NDA drafting', 'Clause checklist'],
        diagnosis: 'Draft NDA',
        treatment: 'Generate first draft + explain key clauses'
      },
      {
        patientId: createdPatients[2]._id.toString(),
        patientName: createdPatients[2].name,
        patientEmail: createdPatients[2].email,
        patientPhone: '+1-555-0301',
        doctorName: lawyer.name,
        doctorEmail: lawyer.email,
        appointmentDate: new Date(),
        appointmentTime: '02:00 PM',
        appointmentType: 'consultation' as const,
        status: 'scheduled' as const,
        reason: 'New client intake',
        notes: 'Gather facts and outline next steps.',
        symptoms: ['Client intake', 'Matter scoping'],
        diagnosis: 'Intake summary',
        treatment: 'Create matter plan and checklist'
      }
    ];

    const createdAppointments = await Appointment.insertMany(appointments);
    console.log(`Created ${createdAppointments.length} appointments`);

    // Create sample documents (stored in existing Report schema for now)
    const reports = [
      {
        patientId: createdPatients[0]._id.toString(),
        patientName: createdPatients[0].name,
        doctorId: lawyer._id.toString(),
        doctorName: lawyer.name,
        reportType: 'diagnostic' as const,
        reportDate: new Date(),
        status: 'completed' as const,
        findings: 'Contract reviewed. Key issues identified: termination, liability cap, indemnities, governing law.',
        diagnosis: 'Contract risk assessment',
        recommendations: 'Suggest edits for termination clause, clarify scope of services, add limitation of liability.',
        priority: 'high' as const,
        notes: 'Prepared for client review meeting.'
      },
      {
        patientId: createdPatients[1]._id.toString(),
        patientName: createdPatients[1].name,
        doctorId: lawyer._id.toString(),
        doctorName: lawyer.name,
        reportType: 'treatment' as const,
        reportDate: new Date(),
        status: 'pending' as const,
        findings: 'Draft NDA created. Sections: Confidential Info, Permitted Use, Term, Remedies, Return/Destruction.',
        diagnosis: 'NDA first draft',
        recommendations: 'Confirm parties, definition of Confidential Information, and term length; add jurisdiction-specific clause later if needed.',
        priority: 'medium' as const,
        notes: 'Waiting for client confirmation on business terms.'
      },
      {
        patientId: createdPatients[2]._id.toString(),
        patientName: createdPatients[2].name,
        doctorId: lawyer._id.toString(),
        doctorName: lawyer.name,
        reportType: 'follow-up' as const,
        reportDate: new Date(),
        status: 'in-progress' as const,
        findings: 'Client intake notes compiled. Matter type and goals drafted; missing facts checklist prepared.',
        diagnosis: 'Client intake summary',
        recommendations: 'Collect documents, confirm timeline, schedule next consultation, and open a matter file.',
        priority: 'medium' as const,
        notes: 'In progress—needs additional client documents.'
      }
    ];

    const createdReports = await Report.insertMany(reports);
    console.log(`Created ${createdReports.length} reports`);

    // Create sample cases (matters)
    const cases = [
      {
        caseNumber: 'CASE-0001',
        title: 'NDA Drafting for Vendor',
        description: 'Prepare a standard NDA (Global/Generic) for a vendor relationship.',
        status: 'open',
        priority: 'medium',
        practiceArea: 'Corporate & Contracts',
        clientId: createdPatients[0]._id.toString(),
        clientName: createdPatients[0].name,
        clientEmail: createdPatients[0].email,
        assignedLawyerName: lawyer.name,
        assignedLawyerEmail: lawyer.email,
        createdByEmail: admin.email,
        tags: ['nda', 'vendor', 'draft'],
      },
      {
        caseNumber: 'CASE-0002',
        title: 'Contract Review — Service Agreement',
        description: 'Review service agreement for risks (termination, liability, indemnity).',
        status: 'open',
        priority: 'high',
        practiceArea: 'Corporate & Contracts',
        clientId: createdPatients[1]._id.toString(),
        clientName: createdPatients[1].name,
        clientEmail: createdPatients[1].email,
        assignedLawyerName: lawyer.name,
        assignedLawyerEmail: lawyer.email,
        createdByEmail: staff.email,
        tags: ['review', 'contract'],
      },
      {
        caseNumber: 'CASE-0003',
        title: 'Client Intake — New Matter',
        description: 'Initial intake and matter scoping. Collect facts and documents.',
        status: 'lead',
        priority: 'low',
        practiceArea: 'General',
        clientId: createdPatients[2]._id.toString(),
        clientName: createdPatients[2].name,
        clientEmail: createdPatients[2].email,
        assignedLawyerName: lawyer.name,
        assignedLawyerEmail: lawyer.email,
        createdByEmail: lawyer.email,
        tags: ['intake', 'lead'],
      },
    ];

    const createdCases = await Case.insertMany(cases);
    console.log(`Created ${createdCases.length} cases`);

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
