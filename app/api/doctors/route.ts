import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Only admin can access doctors list
    if (!session?.user?.email || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get('id');
    const q = (searchParams.get('q') || '').trim();
    const rolesParam = (searchParams.get('roles') || '').trim(); // comma-separated
    const pageRaw = searchParams.get('page');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10) || 50, 200);

    // If ID is provided, return single doctor
    if (doctorId) {
      const doctor = await User.findById(doctorId).select('-password');
      if (!doctor) {
        return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
      }
      return NextResponse.json(doctor);
    }

    const roleList = rolesParam
      ? rolesParam.split(',').map((r) => r.trim()).filter(Boolean)
      : ['doctor']; // backward-compatible default

    const query: any = { role: { $in: roleList } };
    if (q) {
      const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [{ name: rx }, { email: rx }, { role: rx }, { specialization: rx }, { department: rx }];
    }

    const page = pageRaw ? Math.max(parseInt(pageRaw, 10) || 1, 1) : null;
    if (page) {
      const total = await User.countDocuments(query);
      const skip = (page - 1) * limit;
      const users = await User.find(query).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit).lean();
      return NextResponse.json({ data: users, total, page, limit });
    }

    const users = await User.find(query).select('-password').sort({ createdAt: -1 });
    return NextResponse.json(users);

  } catch (error) {
    console.error('Doctors fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Only admin can create doctors
    if (!session?.user?.email || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { 
      name, 
      email, 
      password, 
      role,
      phone,
      specialization,
      department,
      licenseNumber,
      licenseExpiry,
      qualifications,
      yearsOfExperience,
      bio,
      address,
      dateOfBirth,
      gender,
      practiceAreas,
      defaultHourlyRate,
      maxCases
    } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 });
    }

    await dbConnect();

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new user with all fields
    const userData: any = {
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role || 'doctor',
    };

    // Add optional doctor/staff specific fields
    if (phone) userData.phone = phone;
    if (specialization) userData.specialization = specialization;
    if (department) userData.department = department;
    if (licenseNumber) userData.licenseNumber = licenseNumber;
    if (licenseExpiry) userData.licenseExpiry = new Date(licenseExpiry);
    if (qualifications && Array.isArray(qualifications)) userData.qualifications = qualifications;
    if (yearsOfExperience) userData.yearsOfExperience = parseInt(yearsOfExperience) || 0;
    if (bio) userData.bio = bio;
    if (address) userData.address = address;
    if (dateOfBirth) userData.dateOfBirth = new Date(dateOfBirth);
    if (gender) userData.gender = gender;
    if (practiceAreas && Array.isArray(practiceAreas)) {
      userData.practiceAreas = practiceAreas.map((p: any) => String(p).trim()).filter(Boolean);
    }
    if (defaultHourlyRate !== undefined && defaultHourlyRate !== '') {
      const rate = Number(defaultHourlyRate);
      if (!Number.isNaN(rate) && rate >= 0) userData.defaultHourlyRate = rate;
    }
    if (maxCases !== undefined && maxCases !== '') {
      const mc = parseInt(maxCases, 10);
      if (!Number.isNaN(mc) && mc >= 0) userData.maxCases = mc;
    }

    const newUser = new User(userData);

    await newUser.save();

    // Return user without password
    const userResponse = newUser.toObject();
    delete userResponse.password;

    return NextResponse.json({ 
      message: 'Doctor created successfully',
      user: userResponse
    });

  } catch (error) {
    console.error('Doctor creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Only admin can update doctors
    if (!session?.user?.email || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get('id');

    if (!doctorId) {
      return NextResponse.json({ error: 'Doctor ID is required' }, { status: 400 });
    }

    const { 
      name, 
      email, 
      password, 
      role,
      phone,
      specialization,
      department,
      licenseNumber,
      licenseExpiry,
      qualifications,
      yearsOfExperience,
      bio,
      address,
      dateOfBirth,
      gender,
      practiceAreas,
      defaultHourlyRate,
      maxCases
    } = await request.json();

    await dbConnect();

    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email.toLowerCase();
    // Role cannot be changed when editing - it's set only during creation
    // if (role) updateData.role = role;
    if (password && password.length >= 6) {
      updateData.password = await bcrypt.hash(password, 12);
    }
    // Update doctor/staff specific fields
    if (phone !== undefined) updateData.phone = phone;
    if (specialization !== undefined) updateData.specialization = specialization;
    if (department !== undefined) updateData.department = department;
    if (licenseNumber !== undefined) updateData.licenseNumber = licenseNumber;
    if (licenseExpiry !== undefined) updateData.licenseExpiry = licenseExpiry ? new Date(licenseExpiry) : null;
    if (qualifications !== undefined) updateData.qualifications = qualifications;
    if (yearsOfExperience !== undefined) updateData.yearsOfExperience = parseInt(yearsOfExperience) || 0;
    if (bio !== undefined) updateData.bio = bio;
    if (address !== undefined) updateData.address = address;
    if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    if (gender !== undefined) updateData.gender = gender;
    if (practiceAreas !== undefined) {
      updateData.practiceAreas = Array.isArray(practiceAreas)
        ? practiceAreas.map((p: any) => String(p).trim()).filter(Boolean)
        : [];
    }
    if (defaultHourlyRate !== undefined) {
      if (defaultHourlyRate === '' || defaultHourlyRate === null) updateData.defaultHourlyRate = null;
      else {
        const rate = Number(defaultHourlyRate);
        updateData.defaultHourlyRate = Number.isNaN(rate) ? null : rate;
      }
    }
    if (maxCases !== undefined) {
      if (maxCases === '' || maxCases === null) updateData.maxCases = null;
      else {
        const mc = parseInt(maxCases, 10);
        updateData.maxCases = Number.isNaN(mc) ? null : mc;
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      doctorId,
      { $set: updateData },
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      message: 'Doctor updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Doctor update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Only admin can delete doctors
    if (!session?.user?.email || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get('id');

    if (!doctorId) {
      return NextResponse.json({ error: 'Doctor ID is required' }, { status: 400 });
    }

    // Prevent deleting own account
    if (doctorId === session.user.id || doctorId === 'demo-user' || doctorId === 'admin-user') {
      return NextResponse.json({ error: 'Cannot delete your own account or demo accounts' }, { status: 400 });
    }

    await dbConnect();

    const deletedUser = await User.findByIdAndDelete(doctorId);

    if (!deletedUser) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      message: 'Doctor deleted successfully'
    });

  } catch (error) {
    console.error('Doctor deletion error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

