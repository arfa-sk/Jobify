import { JobApplication } from "./types";

export const mockJobs: JobApplication[] = [
  {
    id: "1",
    title: "Senior Frontend Engineer",
    company: "Google",
    location: "Mountain View, CA",
    status: "INTERVIEW",
    relevanceScore: 95,
    responsibilities: ["Lead frontend development", "Optimize performance"],
    skills: ["React", "TypeScript", "Next.js"],
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    title: "Full Stack Developer",
    company: "Vercel",
    location: "Remote",
    status: "APPLIED",
    relevanceScore: 88,
    responsibilities: ["Build edge functions", "Improve DX"],
    skills: ["Node.js", "React", "Serverless"],
    createdAt: new Date().toISOString(),
  },
  {
    id: "3",
    title: "Product Designer",
    company: "Airbnb",
    location: "San Francisco, CA",
    status: "DISCOVERED",
    relevanceScore: 72,
    responsibilities: ["Design user experiences", "Create prototypes"],
    skills: ["Figma", "UX Research"],
    createdAt: new Date().toISOString(),
  }
];
