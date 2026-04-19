import mongoose from 'mongoose';

export interface IContact {
  _id: string;
  clientId: string;
  name: string;
  email?: string;
  phone?: string;
  title?: string; // e.g. "General Counsel", "Assistant"
  relationship?: string; // e.g. "primary", "billing", "opposing", "witness"
  isPrimary?: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const contactSchema = new mongoose.Schema<IContact>(
  {
    clientId: { type: String, required: true, trim: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    title: { type: String, trim: true },
    relationship: { type: String, trim: true },
    isPrimary: { type: Boolean, default: false },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

contactSchema.index({ clientId: 1, isPrimary: -1, createdAt: -1 });

export default mongoose.models.Contact || mongoose.model<IContact>('Contact', contactSchema);

