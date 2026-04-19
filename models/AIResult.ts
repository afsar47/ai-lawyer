import mongoose from 'mongoose';

export interface IAIResult {
  _id: string;
  // Legal/enterprise naming: this is the authenticated user who generated the result.
  // Backward-compatible alias: `patientId`.
  userId: string;
  patientId?: string;
  type:
    | 'treatment-plan'
    | 'drug-interaction'
    | 'image-analysis'
    | 'appointment-optimizer'
    | 'risk-assessment'
    | 'symptom-analysis'
    | 'prescription'
    | 'voice-transcription'
    // Legal AI
    | 'legal-assistant'
    | 'legal-draft'
    | 'legal-review'
    | 'legal-intake-summary'
    | 'legal-timeline'
    | 'legal-knowledge-search';
  title: string;
  content: string;
  rawData?: any;
  aiModel?: {
    id: string;
    name: string;
    provider: string;
  };
  metadata?: {
    symptoms?: string[];
    diagnosis?: string;
    medications?: string[];
    imageType?: string;
    appointmentPreferences?: any;
    riskFactors?: string[];
    // Legal metadata
    jurisdiction?: string;
    tool?: string;
    matterId?: string;
    clientId?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const aiResultSchema = new mongoose.Schema<IAIResult>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    // Backward compatibility for older records/clients.
    patientId: {
      type: String,
      required: false,
      index: true,
    },
    type: {
      type: String,
      enum: [
        'treatment-plan',
        'drug-interaction',
        'image-analysis',
        'appointment-optimizer',
        'risk-assessment',
        'symptom-analysis',
        'prescription',
        'voice-transcription',
        'legal-assistant',
        'legal-draft',
        'legal-review',
        'legal-intake-summary',
        'legal-timeline',
        'legal-knowledge-search',
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    rawData: {
      type: mongoose.Schema.Types.Mixed,
    },
    aiModel: {
      id: String,
      name: String,
      provider: String,
    },
    metadata: {
      symptoms: [String],
      diagnosis: String,
      medications: [String],
      imageType: String,
      appointmentPreferences: mongoose.Schema.Types.Mixed,
      riskFactors: [String],
      jurisdiction: String,
      tool: String,
      matterId: String,
      clientId: String,
    },
  },
  {
    timestamps: true,
  }
);

aiResultSchema.pre('validate', function () {
  // Ensure both fields stay in sync.
  // eslint-disable-next-line @typescript-eslint/no-this-alias
  const doc: any = this;
  if (!doc.userId && doc.patientId) doc.userId = doc.patientId;
  if (!doc.patientId && doc.userId) doc.patientId = doc.userId;
});

// Index for efficient queries
aiResultSchema.index({ userId: 1, type: 1, createdAt: -1 });
aiResultSchema.index({ patientId: 1, type: 1, createdAt: -1 });

export default mongoose.models.AIResult || mongoose.model<IAIResult>('AIResult', aiResultSchema);

