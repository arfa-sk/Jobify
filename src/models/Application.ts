import mongoose, { Schema, Document, Model } from "mongoose";

export interface IApplication extends Document {
  userId: mongoose.Types.ObjectId | string;
  jobId: mongoose.Types.ObjectId | string;
  cvId: mongoose.Types.ObjectId | string; // The specific branch used
  coverLetter?: string;
  outreachEmail?: string;
  status: 'PENDING' | 'APPLIED' | 'INTERVIEW' | 'OFFER' | 'REJECTED';
  notes?: string;
  appliedAt?: Date;
}

const ApplicationSchema = new Schema<IApplication>(
  {
    userId: { type: Schema.Types.Mixed, required: true, index: true },
    jobId: { type: Schema.Types.Mixed, required: true, index: true },
    cvId: { type: Schema.Types.Mixed, required: true },
    coverLetter: { type: String },
    outreachEmail: { type: String },
    status: { 
      type: String, 
      enum: ['PENDING', 'APPLIED', 'INTERVIEW', 'OFFER', 'REJECTED'],
      default: 'PENDING' 
    },
    notes: { type: String },
    appliedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const Application: Model<IApplication> =
  mongoose.models.Application ?? mongoose.model<IApplication>("Application", ApplicationSchema);
