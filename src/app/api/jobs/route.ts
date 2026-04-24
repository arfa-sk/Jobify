import { NextResponse } from 'next/server';
import connectDB from '@/server/db';
import Job from '@/models/Job';

export async function GET() {
    try {
        await connectDB();
        let jobs = await Job.find({}).limit(10);

        // Auto-seed for demo if empty
        if (jobs.length === 0) {
            const sampleJobs = [
                {
                    userId: '000000000000000000000001',
                    title: 'Senior Frontend Engineer',
                    company: 'Vercel',
                    email: 'careers@vercel.com',
                    description: 'We are looking for a React expert to help us build the future of the web. Experience with Next.js and Tailwind is a must.',
                    location: 'Remote',
                },
                {
                    userId: '000000000000000000000001',
                    title: 'Full Stack Developer',
                    company: 'Supabase',
                    email: 'hiring@supabase.io',
                    description: 'Join the team building the open source Firebase alternative. Work with Postgres, Go, and TypeScript.',
                    location: 'Singapore / Remote',
                }
            ];
            await Job.insertMany(sampleJobs);
            jobs = await Job.find({});
        }

        return NextResponse.json({ jobs });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
    }
}
