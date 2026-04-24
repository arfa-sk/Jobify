import mongoose, { Schema, Document, Model } from "mongoose";

export interface IJob extends Document {
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  source: string;
  postedAt: Date;
  fetchedAt: Date;
  guid: string;
  aiSummary?: string;
  tags?: string[];
  relevanceScore?: number;
  companyInsights?: string;
  requiredSkills?: string[];
}

const JobSchema = new Schema<IJob>(
  {
    title: { type: String, required: true },
    company: { type: String, default: "Unknown" },
    location: { type: String, default: "Remote" },
    description: { type: String, default: "" },
    url: { type: String, required: true },
    source: { type: String, required: true },
    postedAt: { type: Date, default: Date.now },
    fetchedAt: { type: Date, default: Date.now },
    guid: { type: String, required: true, unique: true, index: true },
    aiSummary: { type: String },
    tags: [{ type: String }],
    relevanceScore: { type: Number, min: 0, max: 100 },
    companyInsights: { type: String },
    requiredSkills: [{ type: String }],
  },
  { timestamps: true }
);

export const Job: Model<IJob> =
  mongoose.models.Job ?? mongoose.model<IJob>("Job", JobSchema);
