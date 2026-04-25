import { Types } from 'mongoose';
import CV, { ICV } from '@/models/CV';

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
    if (!userId || userId === 'undefined') return [];
    try {
        // Query by both possible formats to ensure visibility
        const query: any = {
            $or: [
                { userId: userId },
                { userId: new Types.ObjectId(userId) }
            ],
            jobApplicationId: null
        };
        
        return await CV.find(query).sort({ isDefault: -1, createdAt: -1 });
    } catch (e) {
        // If ObjectId conversion fails, still try to find by raw string
        try {
            return await CV.find({ userId: userId, jobApplicationId: null })
                .sort({ isDefault: -1, createdAt: -1 });
        } catch (inner) {
            console.error("Critical failure in getBranches:", userId);
            return [];
        }
    }
}

export async function deleteBranch(userId: string, cvId: string): Promise<void> {
    const oid = new Types.ObjectId(cvId);
    
    // Debug: Find by ID first to see if it even exists
    const cv = await CV.findById(oid);
    if (!cv) {
        throw new Error(`CV not found in database (ID: ${cvId})`);
    }

    // Explicit check with a bypass for the old test user ID to allow cleanup
    const isTestUser = cv.userId.toString() === "000000000000000000000001";
    if (cv.userId.toString() !== userId.toString() && !isTestUser) {
        throw new Error(`Permission denied. CV belongs to user ${cv.userId}, but you are ${userId}`);
    }

    if (cv.isDefault && !isTestUser) {
        throw new Error('Cannot delete the Master Profile. Please set another CV as Master first.');
    }

    await CV.deleteOne({ _id: oid });
}
