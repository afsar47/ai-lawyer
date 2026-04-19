import mongoose from 'mongoose';

export interface ISettings {
  _id: string;
  systemTitle: string;
  systemDescription: string;
  jurisdiction: 'global_generic' | 'us' | 'uk' | 'eu_generic';
  currency: string;
  timezone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  language: string;
  theme: 'light' | 'dark' | 'auto';
  emailNotifications: boolean;
  smsNotifications: boolean;
  appointmentReminders: boolean;
  reminderTime: number; // in minutes before appointment
  maxAppointmentsPerDay: number;
  workingHours: {
    start: string; // HH:MM format
    end: string;   // HH:MM format
    days: string[]; // ['monday', 'tuesday', ...]
  };
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    phone: string;
    email: string;
  };
  socialMedia: {
    website: string;
    facebook: string;
    twitter: string;
    linkedin: string;
    instagram: string;
  };
  privacy: {
    dataRetentionDays: number;
    allowDataExport: boolean;
    allowDataDeletion: boolean;
    requireConsent: boolean;
  };
  security: {
    sessionTimeout: number; // in minutes
    maxLoginAttempts: number;
    passwordMinLength: number;
    requireTwoFactor: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const settingsSchema = new mongoose.Schema<ISettings>(
  {
    systemTitle: {
      type: String,
      required: true,
      default: '',
      trim: true,
    },
    systemDescription: {
      type: String,
      required: true,
      default: 'Practice Management System',
      trim: true,
    },
    jurisdiction: {
      type: String,
      enum: ['global_generic', 'us', 'uk', 'eu_generic'],
      default: 'global_generic',
      trim: true,
    },
    currency: {
      type: String,
      required: true,
      default: 'USD',
      trim: true,
    },
    timezone: {
      type: String,
      required: true,
      default: 'UTC',
      trim: true,
    },
    dateFormat: {
      type: String,
      required: true,
      default: 'MM/DD/YYYY',
      trim: true,
    },
    timeFormat: {
      type: String,
      enum: ['12h', '24h'],
      default: '12h',
    },
    language: {
      type: String,
      required: true,
      default: 'en',
      trim: true,
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'light',
    },
    emailNotifications: {
      type: Boolean,
      default: true,
    },
    smsNotifications: {
      type: Boolean,
      default: false,
    },
    appointmentReminders: {
      type: Boolean,
      default: true,
    },
    reminderTime: {
      type: Number,
      default: 30, // 30 minutes before appointment
    },
    maxAppointmentsPerDay: {
      type: Number,
      default: 50,
    },
    workingHours: {
      start: {
        type: String,
        default: '09:00',
      },
      end: {
        type: String,
        default: '17:00',
      },
      days: [{
        type: String,
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      }],
      default: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    },
    address: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      country: { type: String, default: '' },
      postalCode: { type: String, default: '' },
      phone: { type: String, default: '' },
      email: { type: String, default: '' },
    },
    socialMedia: {
      website: { type: String, default: '' },
      facebook: { type: String, default: '' },
      twitter: { type: String, default: '' },
      linkedin: { type: String, default: '' },
      instagram: { type: String, default: '' },
    },
    privacy: {
      dataRetentionDays: { type: Number, default: 2555 }, // 7 years
      allowDataExport: { type: Boolean, default: true },
      allowDataDeletion: { type: Boolean, default: true },
      requireConsent: { type: Boolean, default: true },
    },
    security: {
      sessionTimeout: { type: Number, default: 480 }, // 8 hours
      maxLoginAttempts: { type: Number, default: 5 },
      passwordMinLength: { type: Number, default: 8 },
      requireTwoFactor: { type: Boolean, default: false },
    },
  },
  {
    timestamps: true,
  }
);

// Ensure only one settings document exists
settingsSchema.index({}, { unique: true });

export default mongoose.models.Settings || mongoose.model<ISettings>('Settings', settingsSchema);
