import mongoose from 'mongoose';

export type ClientType = 'individual' | 'organization';

export interface IClient {
  _id: string;
  clientNumber: string; // CL-000001

  type: ClientType;
  name: string;
  email?: string;
  phone?: string;

  address?: string;
  identifiers?: {
    label: string;
    value: string;
  }[];

  notes?: string;
  conflictCheckNotes?: string;

  createdAt: Date;
  updatedAt: Date;
}

const clientSchema = new mongoose.Schema<IClient>(
  {
    clientNumber: {
      type: String,
      unique: true,
      required: false, // auto-generated in pre-save hook
      trim: true,
    },
    type: {
      type: String,
      enum: ['individual', 'organization'],
      default: 'individual',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    identifiers: [
      {
        label: { type: String, trim: true, required: true },
        value: { type: String, trim: true, required: true },
      },
    ],
    notes: {
      type: String,
      trim: true,
    },
    conflictCheckNotes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

clientSchema.pre('save', async function () {
  if (!this.clientNumber) {
    const count = (await mongoose.models.Client?.countDocuments?.()) || 0;
    this.clientNumber = `CL-${String(count + 1).padStart(6, '0')}`;
  }
});

// Enterprise query performance
clientSchema.index({ name: 1, createdAt: -1 });
clientSchema.index({ email: 1 });
clientSchema.index({ type: 1, createdAt: -1 });
clientSchema.index({ createdAt: -1 });

export default mongoose.models.Client || mongoose.model<IClient>('Client', clientSchema);

