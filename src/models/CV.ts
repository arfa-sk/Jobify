import mongoose, { Document, Schema, Types } from 'mongoose';
import { JsonResumeSchema, CvSectionDescriptor } from '@/types/cv';

export interface ICV extends Document {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    isDefault: boolean;
    category: string | null;
    displayName: string;
    cvFormat?: 'json-resume' | 'freeform' | null;
    jobApplicationId?: Types.ObjectId | null;
    cvJson?: JsonResumeSchema | null;
    originalCvJson?: JsonResumeSchema | null;
    extractionMode?: 'strict' | 'standard' | null;
    extractionTimestamp?: Date | null;
    cvDescriptor?: CvSectionDescriptor[] | null;
    cvData?: Record<string, any> | null;
    templateId?: string | null;
    filename?: string | null;
    isStarred?: boolean;
    isTailored?: boolean;
    targetRole?: string | null;
    parentCvId?: Types.ObjectId | null;
    version: number;
    lastEditedAt?: Date;
    originalPdf?: Buffer | null;
    createdAt: Date;
    updatedAt: Date;
}

const CVSchema = new Schema<ICV>(
    {
        userId: { type: Schema.Types.ObjectId, required: true, index: true },
        isDefault: { type: Boolean, required: true, default: false, index: true },
        cvFormat: { type: String, enum: ['json-resume', 'freeform'], default: null },
        category: { type: String, default: null, maxlength: 50 },
        displayName: { type: String, required: true, maxlength: 100 },
        jobApplicationId: { type: Schema.Types.ObjectId, default: null, index: true, sparse: true },
        cvJson: { type: Schema.Types.Mixed, default: null },
        originalCvJson: { type: Schema.Types.Mixed, default: null },
        extractionMode: { type: String, enum: ['strict', 'standard'], default: null },
        extractionTimestamp: { type: Date, default: null },
        cvDescriptor: { type: Schema.Types.Mixed, default: null },
        cvData: { type: Schema.Types.Mixed, default: null },
        templateId: { type: String, default: null },
        filename: { type: String, default: null },
        isStarred: { type: Boolean, default: false },
        isTailored: { type: Boolean, default: false },
        targetRole: { type: String, default: null },
        parentCvId: { type: Schema.Types.ObjectId, default: null, index: true },
        version: { type: Number, default: 0, min: 0 },
        lastEditedAt: { type: Date, default: null },
        originalPdf: { type: Buffer, default: null, select: false },
    },
    { timestamps: true }
);

CVSchema.index(
    { userId: 1, isDefault: 1 },
    { unique: true, partialFilterExpression: { isDefault: true }, name: 'unique_default_cv_per_user' }
);

export interface ICVModel extends mongoose.Model<ICV> {}
const CV = mongoose.models.CV || mongoose.model<ICV, ICVModel>('CV', CVSchema);
export default CV;
