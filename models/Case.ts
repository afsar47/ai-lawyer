import mongoose from 'mongoose';

export type CaseStatus = 'lead' | 'open' | 'closed';
export type CasePriority = 'low' | 'medium' | 'high';
export type MatterStage = 'intake' | 'active' | 'litigation' | 'settlement' | 'closed';
export type ConflictCheckStatus = 'pending' | 'cleared' | 'conflict';

export interface ICase {
  _id: string;
  caseNumber: string; // CASE-0001
  title: string;
  description?: string;
  status: CaseStatus;
  stage?: MatterStage;
  priority: CasePriority;
  practiceArea?: string;

  // Client (stored in existing Patient collection for now)
  clientId: string;
  clientName: string;
  clientEmail: string;

  // Lifecycle
  openedAt?: Date;
  closedAt?: Date;
  closedReason?: string;

  // Court / jurisdiction metadata
  jurisdiction?: string;
  courtName?: string;
  docketNumber?: string;
  opposingCounsel?: string;
  opposingParties?: string[];

  // Conflict check
  conflictCheckStatus?: ConflictCheckStatus;
  conflictCheckDate?: Date;
  conflictCheckNotes?: string;

  // Assigned lawyer (stored in existing User role=doctor for now)
  assignedLawyerName?: string;
  assignedLawyerEmail?: string;

  createdByEmail?: string;
  tags?: string[];

  createdAt: Date;
  updatedAt: Date;
}

const caseSchema = new mongoose.Schema<ICase>(
  {
    caseNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['lead', 'open', 'closed'],
      default: 'open',
    },
    stage: {
      type: String,
      enum: ['intake', 'active', 'litigation', 'settlement', 'closed'],
      default: 'active',
      index: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    practiceArea: {
      type: String,
      trim: true,
    },
    clientId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    clientName: {
      type: String,
      required: true,
      trim: true,
    },
    clientEmail: {
      type: String,
      required: false,
      default: '',
      trim: true,
      lowercase: true,
    },
    openedAt: { type: Date, index: true },
    closedAt: { type: Date, index: true },
    closedReason: { type: String, trim: true },

    jurisdiction: { type: String, trim: true, index: true },
    courtName: { type: String, trim: true },
    docketNumber: { type: String, trim: true },
    opposingCounsel: { type: String, trim: true },
    opposingParties: [{ type: String, trim: true }],

    conflictCheckStatus: {
      type: String,
      enum: ['pending', 'cleared', 'conflict'],
      default: 'pending',
      index: true,
    },
    conflictCheckDate: { type: Date, index: true },
    conflictCheckNotes: { type: String, trim: true },
    assignedLawyerName: {
      type: String,
      trim: true,
    },
    assignedLawyerEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    createdByEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  { timestamps: true }
);

caseSchema.pre('validate', function () {
  // eslint-disable-next-line @typescript-eslint/no-this-alias
  const doc: any = this;
  if (!doc.stage) {
    doc.stage = doc.status === 'lead' ? 'intake' : doc.status === 'closed' ? 'closed' : 'active';
  }
});

caseSchema.index({ status: 1, createdAt: -1 });
caseSchema.index({ assignedLawyerEmail: 1, createdAt: -1 });
caseSchema.index({ practiceArea: 1, createdAt: -1 });

// Prevent multiple model initialization in development
export default mongoose.models.Case || mongoose.model<ICase>('Case', caseSchema);

