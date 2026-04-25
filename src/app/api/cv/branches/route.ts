import { NextRequest, NextResponse } from 'next/server';
import { getBranches, createBranch, setPrimary } from '@/server/services/cv-branch-service';
import connectToDatabase from '@/lib/mongodb';

export async function GET(req: NextRequest) {
    try {
        await connectToDatabase();
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');
        if (!userId) return NextResponse.json({ branches: [] });

        const branches = await getBranches(userId);
        return NextResponse.json({ branches });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        await connectToDatabase();
        const body = await req.json();
        const { userId, sourceCvId, category, displayName } = body;

        if (!sourceCvId || !category || !displayName) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const branch = await createBranch(userId || 'default-user', sourceCvId, category, displayName);
        return NextResponse.json({ message: 'Branch created successfully', branch });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        await connectToDatabase();
        const body = await req.json();
        const { userId, cvId, action } = body;

        if (action === 'set-primary') {
            const branch = await setPrimary(userId || 'default-user', cvId);
            return NextResponse.json({ message: 'Primary CV updated', branch });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
export async function DELETE(req: NextRequest) {
    try {
        await connectToDatabase();
        const { searchParams } = new URL(req.url);
        const cvId = searchParams.get('cvId');
        const userId = searchParams.get('userId');

        if (!cvId || !userId) {
            return NextResponse.json({ error: 'Missing cvId or userId' }, { status: 400 });
        }

        const { deleteBranch } = await import('@/server/services/cv-branch-service');
        await deleteBranch(userId, cvId);
        return NextResponse.json({ message: 'Branch deleted successfully' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
