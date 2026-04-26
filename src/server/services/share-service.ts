import CV, { ICV } from '@/models/CV';
import { v4 as uuidv4 } from 'uuid';

export async function ensurePublic(cvId: string, userId: string): Promise<{ url: string; cv: ICV }> {
    const cv = await CV.findOne({ _id: cvId, userId });
    
    if (!cv) {
        throw new Error('CV not found');
    }

    if (!cv.isPublic || !cv.shareSlug) {
        const shareSlug = cv.shareSlug || uuidv4();
        await CV.updateOne(
            { _id: cvId },
            { $set: { isPublic: true, shareSlug } }
        );
        cv.isPublic = true;
        cv.shareSlug = shareSlug;
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
    const url = `${baseUrl}/cv/share/${cv._id}`;

    return { url, cv };
}

export async function getPublicCv(cvId: string): Promise<ICV> {
    const cv = await CV.findOne({ _id: cvId, isPublic: true });
    
    if (!cv) {
        throw new Error('Public CV not found or link has expired');
    }

    return cv;
}
