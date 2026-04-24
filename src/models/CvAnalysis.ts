import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IAtsScores {
    score: number;
    explanation: string;
    missingKeywords: string[];
    matchingKeywords: string[];
    improvements: string[];
}

export interface IDetailedResultItem {
    checkName: string;
    score?: number | null;
    issues: string[];
    suggestions?: string[];
    status: 'pass' | 'fail' | 'warning' | 'not-applicable';
    priority: 'high' | 'medium' | 'low';
}

export interface ICvAnalysis extends Document {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    cvId?: Types.ObjectId; // Optional: Link to the CV branch analyzed
    
    status: 'pending' | 'completed' | 'failed';
    cvHash?: string;
    overallScore: number;
    issueCount: number;
    categoryScores: Record<string, number>;
    detailedResults: Record<string, IDetailedResultItem>;
    
    atsScores?: IAtsScores;
    errorInfo?: string;
    analysisDate: Date;
    createdAt: Date;
    updatedAt: Date;
}

const CvAnalysisSchema = new Schema<ICvAnalysis>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            required: true,
            index: true,
        },
        cvId: {
            type: Schema.Types.ObjectId,
            ref: 'CV',
            index: true,
        },
        status: {
            type: String,
            enum: ['pending', 'completed', 'failed'],
            default: 'pending',
        },
        cvHash: {
            type: String,
            index: true,
        },
        overallScore: {
            type: Number,
            default: 0,
        },
        issueCount: {
            type: Number,
            default: 0,
        },
        categoryScores: {
            type: Schema.Types.Mixed,
            default: {},
        },
        detailedResults: {
            type: Schema.Types.Mixed,
            default: {},
        },
        atsScores: {
            type: Schema.Types.Mixed,
        },
        errorInfo: {
            type: String,
        },
        analysisDate: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

const CvAnalysis = mongoose.models.CvAnalysis || mongoose.model<ICvAnalysis>('CvAnalysis', CvAnalysisSchema);

export default CvAnalysis;
