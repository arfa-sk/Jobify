import { Types } from 'mongoose';
import CV, { ICV } from '../models/CV';

export async function createBranch(
    userId: string,
    sourceCvId: string,
    category: string,
    displayName: string
): Promise<ICV> {
    const sourceCv = await CV.findOne({ _id: sourceCvId, userId });
    if (!sourceCv) {
        throw new Error('Source CV not found');
    }

    // Deep copy the JSON and dynamic data
    const newBranch = await CV.create({
        userId: new Types.ObjectId(userId),
        isDefault: false,
        category,
        displayName,
        cvJson: sourceCv.cvJson ? JSON.parse(JSON.stringify(sourceCv.cvJson)) : null,
        originalCvJson: sourceCv.originalCvJson ? JSON.parse(JSON.stringify(sourceCv.originalCvJson)) : null,
        cvFormat: sourceCv.cvFormat,
        extractionMode: sourceCv.extractionMode,
        extractionTimestamp: sourceCv.extractionTimestamp,
        cvDescriptor: sourceCv.cvDescriptor ? JSON.parse(JSON.stringify(sourceCv.cvDescriptor)) : null,
        cvData: sourceCv.cvData ? JSON.parse(JSON.stringify(sourceCv.cvData)) : null,
        templateId: sourceCv.templateId,
    });

    return newBranch;
}

export async function setPrimary(userId: string, cvId: string): Promise<ICV> {
    const cv = await CV.findOne({ _id: cvId, userId });
    if (!cv) {
        throw new Error('CV not found');
    }

    if (cv.jobApplicationId) {
        throw new Error('Cannot set a job-specific CV as default');
    }

    // Unset current default and set new one in a transaction-like way
    // (Mongoose doesn't support transactions on standalone MongoDB easily, 
    // so we use two updates)
    await CV.updateMany({ userId: new Types.ObjectId(userId), isDefault: true }, { $set: { isDefault: false } });
    
    cv.isDefault = true;
    await cv.save();

    return cv;
}

export async function getBranches(userId: string): Promise<ICV[]> {
    return await CV.find({ userId: new Types.ObjectId(userId), jobApplicationId: null })
        .sort({ isDefault: -1, createdAt: -1 });
}
