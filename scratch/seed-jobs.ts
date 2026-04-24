import connectDB from '../src/server/db';
import Job from '../src/models/Job';

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
    },
    {
        userId: '000000000000000000000001',
        title: 'Product Designer',
        company: 'Linear',
        email: 'jobs@linear.app',
        description: 'Help us design the most efficient tool for software teams. Focus on craft, detail, and speed.',
        location: 'Remote',
    }
];

async function seed() {
    await connectDB();
    console.log('Seeding jobs...');
    await Job.deleteMany({});
    await Job.insertMany(sampleJobs);
    console.log('Jobs seeded successfully!');
    process.exit(0);
}

seed();
