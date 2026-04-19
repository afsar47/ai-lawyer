import mongoose from 'mongoose';

export interface IDocumentFolder {
  _id: string;
  name: string;
  description?: string;
  parentId?: string;
  path: string;
  color?: string;
  icon?: string;
  isSystem: boolean;
  matterId?: string;
  matterNumber?: string;
  clientId?: string;
  clientName?: string;
  documentCount: number;
  createdByEmail?: string;
  createdAt: Date;
  updatedAt: Date;
}

const documentFolderSchema = new mongoose.Schema<IDocumentFolder>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: { type: String, trim: true },
    parentId: { type: String, trim: true, index: true },
    path: { 
      type: String, 
      required: true, 
      trim: true
    },
    color: { type: String, trim: true, default: '#6366f1' },
    icon: { type: String, trim: true, default: 'folder' },
    isSystem: { type: Boolean, default: false },
    matterId: { type: String, trim: true, index: true },
    matterNumber: { type: String, trim: true },
    clientId: { type: String, trim: true, index: true },
    clientName: { type: String, trim: true },
    documentCount: { type: Number, default: 0 },
    createdByEmail: { type: String, trim: true, lowercase: true },
  },
  { timestamps: true }
);

documentFolderSchema.index({ path: 1 }, { unique: true });
documentFolderSchema.index({ matterId: 1, parentId: 1 });

export default mongoose.models.DocumentFolder || mongoose.model<IDocumentFolder>('DocumentFolder', documentFolderSchema);
