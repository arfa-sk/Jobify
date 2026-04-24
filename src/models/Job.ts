import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IJob extends Document {
  userId?: Types.ObjectId; // Optional for Discovery jobs
  title: string;
  company: string;
  location: string;
  description: string;
  email?: string; // Required for one-click apply
  url?: string; // For discovery jobs
  source?: string;
  postedAt: Date;
  fetchedAt: Date;
  guid?: string;
  aiSummary?: string;
  tags?: string[];
  relevanceScore?: number;
  companyInsights?: string;
  requiredSkills?: string[];
  status: 'open' | 'applied' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

const JobSchema = new Schema<IJob>(
  {
    userId: { type: Schema.Types.ObjectId, index: true },
    title: { type: String, required: true },
    company: { type: String, required: true },
    location: { type: String, default: "Remote" },
    description: { type: String, required: true },
    email: { type: String },
    url: { type: String },
    source: { type: String },
    postedAt: { type: Date, default: Date.now },
    fetchedAt: { type: Date, default: Date.now },
    guid: { type: String, unique: true, sparse: true, index: true },
    aiSummary: { type: String },
    tags: [{ type: String }],
    relevanceScore: { type: Number, min: 0, max: 100 },
    companyInsights: { type: String },
    requiredSkills: [{ type: String }],
    status: { type: String, enum: ['open', 'applied', 'rejected'], default: 'open' },
  },
  { timestamps: true }
);

export const Job: Model<IJob> =
  mongoose.models.Job ?? mongoose.model<IJob>("Job", JobSchema);

export default Job;
