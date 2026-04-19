import mongoose from 'mongoose';

export interface IUser {
  _id: string;
  email: string;
  name: string;
  password?: string;
  role: 'doctor' | 'admin' | 'staff' | 'patient';
  image?: string;
  emailVerified?: Date;
  // Doctor/Staff specific fields
  phone?: string;
  specialization?: string;
  department?: string;
  licenseNumber?: string;
  licenseExpiry?: Date;
  qualifications?: string[];
  yearsOfExperience?: number;
  bio?: string;
  address?: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  // Law firm ops
  practiceAreas?: string[];
  defaultHourlyRate?: number;
  maxCases?: number;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new mongoose.Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: false,
    },
    role: {
      type: String,
      enum: ['doctor', 'admin', 'staff', 'patient'],
      default: 'doctor',
    },
    image: {
      type: String,
    },
    emailVerified: {
      type: Date,
    },
    // Doctor/Staff specific fields
    phone: {
      type: String,
      trim: true,
    },
    specialization: {
      type: String,
      trim: true,
    },
    department: {
      type: String,
      trim: true,
    },
    licenseNumber: {
      type: String,
      trim: true,
    },
    licenseExpiry: {
      type: Date,
      index: true,
    },
    qualifications: [{
      type: String,
      trim: true,
    }],
    yearsOfExperience: {
      type: Number,
      min: 0,
    },
    bio: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer-not-to-say'],
    },

    practiceAreas: [
      {
        type: String,
        trim: true,
      },
    ],
    defaultHourlyRate: {
      type: Number,
      min: 0,
    },
    maxCases: {
      type: Number,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.index({ role: 1, createdAt: -1 });
userSchema.index({ role: 1, licenseExpiry: 1 });

// Prevent multiple model initialization in development
export default mongoose.models.User || mongoose.model<IUser>('User', userSchema);
