import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IJob extends Document {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    title: string;
    company: string;
    email: string;
    description: string;
    location?: string;
    status: 'open' | 'applied' | 'rejected';
    createdAt: Date;
    updatedAt: Date;
}

const JobSchema = new Schema<IJob>(
    {
        userId: { type: Schema.Types.ObjectId, required: true, index: true },
        title: { type: String, required: true },
        company: { type: String, required: true },
        email: { type: String, required: true },
        description: { type: String, required: true },
        location: { type: String, default: 'Remote' },
        status: { type: String, enum: ['open', 'applied', 'rejected'], default: 'open' },
    },
    { timestamps: true }
);

export interface IJobModel extends mongoose.Model<IJob> {}
const Job = mongoose.models.Job || mongoose.model<IJob, IJobModel>('Job', JobSchema);
export default Job;
