import mongoose from 'mongoose';

export type TaskStatus = 'open' | 'done' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface ITask {
  _id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: Date;

  matterId?: string;
  matterNumber?: string;
  clientId?: string;
  clientName?: string;

  assignedToEmail?: string;
  assignedToName?: string;
  createdByEmail?: string;

  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new mongoose.Schema<ITask>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    status: { type: String, enum: ['open', 'done', 'cancelled'], default: 'open', index: true },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium', index: true },
    dueDate: { type: Date, index: true },

    matterId: { type: String, trim: true, index: true },
    matterNumber: { type: String, trim: true },
    clientId: { type: String, trim: true, index: true },
    clientName: { type: String, trim: true },

    assignedToEmail: { type: String, trim: true, lowercase: true, index: true },
    assignedToName: { type: String, trim: true },
    createdByEmail: { type: String, trim: true, lowercase: true, index: true },
  },
  { timestamps: true }
);

taskSchema.index({ status: 1, dueDate: 1 });

export default mongoose.models.Task || mongoose.model<ITask>('Task', taskSchema);

