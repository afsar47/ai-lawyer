import mongoose from 'mongoose';

export type HearingType =
  | 'motion'
  | 'trial'
  | 'deposition'
  | 'settlement_conference'
  | 'pretrial'
  | 'status_conference'
  | 'arraignment'
  | 'sentencing'
  | 'mediation'
  | 'other';

export type HearingStatus =
  | 'scheduled'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'adjourned';

export interface IHearing {
  _id: string;
  hearingType: HearingType;
  hearingDate: Date;
  hearingTime: string; // HH:MM format
  duration?: number; // minutes
  courtName: string;
  courtAddress?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
  courtroom?: string;
  judgeName?: string;
  docketNumber?: string;
  caseId?: string;
  caseNumber?: string; // denormalized
  clientId?: string;
  clientName?: string;
  opposingCounsel?: string;
  status: HearingStatus;
  notes?: string;
  reminderDaysBefore?: number[]; // e.g. [7, 1]
  reminderSent?: boolean;
  createdByEmail?: string;
  createdAt: Date;
  updatedAt: Date;
}

const hearingSchema = new mongoose.Schema<IHearing>(
  {
    hearingType: {
      type: String,
      enum: [
        'motion',
        'trial',
        'deposition',
        'settlement_conference',
        'pretrial',
        'status_conference',
        'arraignment',
        'sentencing',
        'mediation',
        'other',
      ],
      required: true,
    },
    hearingDate: {
      type: Date,
      required: true,
      index: true,
    },
    hearingTime: {
      type: String,
      required: true,
      trim: true,
    },
    duration: {
      type: Number,
      min: 1,
    },
    courtName: {
      type: String,
      required: true,
      trim: true,
    },
    courtAddress: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      zip: { type: String, trim: true },
    },
    courtroom: {
      type: String,
      trim: true,
    },
    judgeName: {
      type: String,
      trim: true,
    },
    docketNumber: {
      type: String,
      trim: true,
    },
    caseId: {
      type: String,
      trim: true,
      index: true,
    },
    caseNumber: {
      type: String,
      trim: true,
    },
    clientId: {
      type: String,
      trim: true,
      index: true,
    },
    clientName: {
      type: String,
      trim: true,
    },
    opposingCounsel: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'adjourned'],
      default: 'scheduled',
      required: true,
      index: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    reminderDaysBefore: {
      type: [Number],
      default: [7, 1],
    },
    reminderSent: {
      type: Boolean,
      default: false,
    },
    createdByEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
  },
  { timestamps: true }
);

// Indexes for efficient queries
hearingSchema.index({ hearingDate: 1, hearingTime: 1 });
hearingSchema.index({ caseId: 1, hearingDate: 1 });
hearingSchema.index({ clientId: 1, hearingDate: 1 });
hearingSchema.index({ status: 1, hearingDate: 1 });

export default mongoose.models.Hearing || mongoose.model<IHearing>('Hearing', hearingSchema);
