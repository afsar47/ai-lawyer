import mongoose from 'mongoose';

export type NoteScope = 'client' | 'matter' | 'hearing' | 'deadline' | 'general';

export interface INote {
  _id: string;
  scope: NoteScope;
  clientId?: string;
  caseId?: string; // Matter id (current codebase uses Case)
  hearingId?: string;
  deadlineId?: string;
  title?: string;
  content: string;
  tags?: string[];
  createdBy?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const noteSchema = new mongoose.Schema<INote>(
  {
    scope: {
      type: String,
      enum: ['client', 'matter', 'hearing', 'deadline', 'general'],
      default: 'general',
      index: true,
    },
    clientId: { type: String, trim: true, index: true },
    caseId: { type: String, trim: true, index: true },
    hearingId: { type: String, trim: true, index: true },
    deadlineId: { type: String, trim: true, index: true },
    title: { type: String, trim: true },
    content: { type: String, required: true },
    tags: [{ type: String, trim: true }],
    createdBy: { type: String, trim: true },
    updatedBy: { type: String, trim: true },
  },
  { timestamps: true }
);

noteSchema.index({ caseId: 1, createdAt: -1 });
noteSchema.index({ clientId: 1, createdAt: -1 });

export default mongoose.models.Note || mongoose.model<INote>('Note', noteSchema);

