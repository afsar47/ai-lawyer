import mongoose from 'mongoose';

export type DeadlineType = 'deadline' | 'court_date' | 'meeting' | 'reminder';
export type DeadlineStatus = 'upcoming' | 'completed' | 'cancelled';

export interface IDeadline {
  _id: string;
  title: string;
  type: DeadlineType;
  status: DeadlineStatus;
  dueDate: Date;

  matterId?: string;
  matterNumber?: string;
  clientId?: string;
  clientName?: string;

  notes?: string;
  reminderDaysBefore?: number[]; // e.g. [7, 1]
  createdByEmail?: string;

  createdAt: Date;
  updatedAt: Date;
}

const deadlineSchema = new mongoose.Schema<IDeadline>(
  {
    title: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['deadline', 'court_date', 'meeting', 'reminder'],
      default: 'deadline',
      required: true,
    },
    status: {
      type: String,
      enum: ['upcoming', 'completed', 'cancelled'],
      default: 'upcoming',
      required: true,
    },
    dueDate: { type: Date, required: true, index: true },
    matterId: { type: String, trim: true, index: true },
    matterNumber: { type: String, trim: true },
    clientId: { type: String, trim: true, index: true },
    clientName: { type: String, trim: true },
    notes: { type: String, trim: true },
    reminderDaysBefore: {
      type: [Number],
      default: [7, 1],
    },
    createdByEmail: { type: String, trim: true, lowercase: true },
  },
  { timestamps: true }
);

export default mongoose.models.Deadline || mongoose.model<IDeadline>('Deadline', deadlineSchema);

