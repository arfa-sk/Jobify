import { NextRequest, NextResponse } from 'next/server';
import { parseUploadedCv } from '@/server/services/cv-parser';
import CV from '@/models/CV';
import connectToDatabase from '@/lib/mongodb';
import { Types } from 'mongoose';
import fs from 'fs';
import path from 'path';
import os from 'os';

export async function POST(req: NextRequest) {
    try {
        await connectToDatabase();

        const formData = await req.formData();
        const file = formData.get('cvFile') as File;
        const userId = formData.get('userId') as string || '000000000000000000000001';

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        // Save file to temp directory for processing
        const buffer = Buffer.from(await file.arrayBuffer());
        const tempPath = path.join(os.tmpdir(), `cv-${Date.now()}-${file.name}`);
        fs.writeFileSync(tempPath, buffer);

        try {
            const cvJson = await parseUploadedCv(tempPath, file.type, userId);
            
            // If there was already a default, unset it FIRST to avoid unique index violation
            await CV.updateMany(
                { userId: new Types.ObjectId(userId), isDefault: true },
                { $set: { isDefault: false } }
            );

            // Create a new base CV as the new default
            const newCv = await CV.create({
                userId: new Types.ObjectId(userId),
                isDefault: true,
                category: 'General',
                displayName: file.name.replace(/\.[^.]+$/, ''),
                cvJson,
                originalCvJson: JSON.parse(JSON.stringify(cvJson)),
                filename: file.name,
                extractionMode: 'strict',
                extractionTimestamp: new Date(),
                originalPdf: buffer,
            });

            return NextResponse.json({ message: 'CV parsed successfully', cv: newCv });
        } finally {
            // Clean up temp file
            if (fs.existsSync(tempPath)) {
                fs.unlinkSync(tempPath);
            }
        }
    } catch (error: any) {
        console.error('Upload error:', error);
        return NextResponse.json({ error: error.message || 'Failed to process CV' }, { status: 500 });
    }
}
