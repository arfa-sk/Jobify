export type JobStatus = 'DISCOVERED' | 'APPLIED' | 'INTERVIEW' | 'ASSESSMENT' | 'OFFER' | 'REJECTED' | 'SNOOZED';

export interface JobApplication {
  id: string;
  title: string;
  company: string;
  location?: string;
  url?: string;
  status: JobStatus;
  relevanceScore?: number;
  linkedCvBranchId?: string;
  description?: string;
  responsibilities: string[];
  skills: string[];
  createdAt: string;
}
