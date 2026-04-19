import mongoose from 'mongoose';

export type DocumentType = 'engagement' | 'pleading' | 'contract' | 'evidence' | 'case_note' | 'correspondence' | 'court_filing' | 'discovery' | 'memo' | 'template' | 'other';
export type DocumentStatus = 'draft' | 'review' | 'approved' | 'final' | 'archived';
export type FileType = 'pdf' | 'docx' | 'doc' | 'xlsx' | 'xls' | 'pptx' | 'txt' | 'rtf' | 'jpg' | 'jpeg' | 'png' | 'gif' | 'other';

export interface IDocumentFile {
  filename: string;
  originalName: string;
  mimeType: string;
  fileType: FileType;
  size: number;
  url: string;
  uploadedAt: Date;
}

export interface IDocument {
  _id: string;
  documentNumber: string; // DOC-000001

  title: string;
  description?: string;
  type: DocumentType;
  status: DocumentStatus;

  // File storage
  file?: IDocumentFile;
  
  // Folder organization
  folderId?: string;
  folderPath?: string;

  // Tags for categorization
  tags?: string[];

  // Versioning (simple)
  version: number; // starts at 1
  rootDocumentId?: string; // points to the first version
  previousVersionId?: string;
  isLatest: boolean;
  versionNotes?: string;

  // Links
  clientId?: string;
  clientName?: string;
  matterId?: string;
  matterNumber?: string;

  // Content / storage metadata
  content?: string;
  attachments?: string[];

  // Permissions & sharing
  sharedWithClient: boolean;
  isConfidential: boolean;
  accessLevel: 'public' | 'team' | 'restricted';
  allowedUsers?: string[];

  // Template fields
  isTemplate: boolean;
  templateCategory?: string;

  // Metadata
  createdByEmail?: string;
  lastModifiedByEmail?: string;
  checkedOutBy?: string;
  checkedOutAt?: Date;
  downloadCount: number;
  lastDownloadedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const fileSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  mimeType: { type: String, required: true },
  fileType: { 
    type: String, 
    enum: ['pdf', 'docx', 'doc', 'xlsx', 'xls', 'pptx', 'txt', 'rtf', 'jpg', 'jpeg', 'png', 'gif', 'other'],
    default: 'other'
  },
  size: { type: Number, required: true },
  url: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
}, { _id: false });

const documentSchema = new mongoose.Schema<IDocument>(
  {
    documentNumber: {
      type: String,
      unique: true,
      required: false,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: { type: String, trim: true },
    type: {
      type: String,
      enum: ['engagement', 'pleading', 'contract', 'evidence', 'case_note', 'correspondence', 'court_filing', 'discovery', 'memo', 'template', 'other'],
      default: 'other',
      required: true,
    },
    status: {
      type: String,
      enum: ['draft', 'review', 'approved', 'final', 'archived'],
      default: 'draft',
      required: true,
    },
    file: fileSchema,
    folderId: { type: String, trim: true, index: true },
    folderPath: { type: String, trim: true },
    tags: [{ type: String, trim: true, lowercase: true }],
    version: { type: Number, default: 1, min: 1 },
    rootDocumentId: { type: String, trim: true, index: true },
    previousVersionId: { type: String, trim: true },
    isLatest: { type: Boolean, default: true, index: true },
    versionNotes: { type: String, trim: true },
    clientId: { type: String, trim: true, index: true },
    clientName: { type: String, trim: true },
    matterId: { type: String, trim: true, index: true },
    matterNumber: { type: String, trim: true },
    content: { type: String },
    attachments: [{ type: String, trim: true }],
    sharedWithClient: { type: Boolean, default: false },
    isConfidential: { type: Boolean, default: false },
    accessLevel: { 
      type: String, 
      enum: ['public', 'team', 'restricted'], 
      default: 'team' 
    },
    allowedUsers: [{ type: String, trim: true, lowercase: true }],
    isTemplate: { type: Boolean, default: false, index: true },
    templateCategory: { type: String, trim: true },
    createdByEmail: { type: String, trim: true, lowercase: true },
    lastModifiedByEmail: { type: String, trim: true, lowercase: true },
    checkedOutBy: { type: String, trim: true, lowercase: true },
    checkedOutAt: { type: Date },
    downloadCount: { type: Number, default: 0 },
    lastDownloadedAt: { type: Date },
  },
  { timestamps: true }
);

documentSchema.pre('save', async function () {
  if (!this.documentNumber) {
    const count = (await mongoose.models.Document?.countDocuments?.()) || 0;
    this.documentNumber = `DOC-${String(count + 1).padStart(6, '0')}`;
  }
  if (!this.rootDocumentId) {
    // Set on first save.
    this.rootDocumentId = this._id.toString();
  }
});

export default mongoose.models.Document || mongoose.model<IDocument>('Document', documentSchema);

