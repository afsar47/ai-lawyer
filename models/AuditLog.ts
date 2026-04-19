import mongoose from 'mongoose';

export type AuditAction =
  | 'auth.login'
  | 'auth.logout'
  | 'ai.run'
  | 'ai.model.create'
  | 'ai.model.update'
  | 'ai.model.delete'
  | 'ai.model.set_active'
  | 'case.create'
  | 'case.update'
  | 'case.delete'
  | 'document.create'
  | 'document.update'
  | 'document.delete'
  | 'deadline.create'
  | 'deadline.update'
  | 'deadline.delete'
  | 'hearing.create'
  | 'hearing.update'
  | 'hearing.delete'
  | 'invoice.create'
  | 'invoice.update'
  | 'invoice.delete'
  | 'other';

export interface IAuditLog {
  _id: string;
  action: AuditAction;
  actorId?: string;
  actorEmail?: string;
  actorRole?: string;
  ip?: string;
  userAgent?: string;
  resourceType?: string;
  resourceId?: string;
  message?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const auditLogSchema = new mongoose.Schema<IAuditLog>(
  {
    action: { type: String, required: true, index: true },
    actorId: { type: String, trim: true, index: true },
    actorEmail: { type: String, trim: true, lowercase: true, index: true },
    actorRole: { type: String, trim: true, index: true },
    ip: { type: String, trim: true },
    userAgent: { type: String, trim: true },
    resourceType: { type: String, trim: true, index: true },
    resourceId: { type: String, trim: true, index: true },
    message: { type: String, trim: true },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

auditLogSchema.index({ action: 1, createdAt: -1 });

export default mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', auditLogSchema);

