'use client';

import React, { useState, useEffect } from 'react';
import { Briefcase, MapPin, DollarSign, Send, Search, Filter, Sparkles } from 'lucide-react';
import ApplyModal from '@/components/jobs/ApplyModal';

export default function JobsDashboard() {
    const [jobs, setJobs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedJob, setSelectedJob] = useState<any>(null);
    const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
    
    // For demo purposes, we'll fetch the user's primary CV
    const [cvs, setCvs] = useState<any[]>([]);
    const userId = '000000000000000000000001'; // Same placeholder as before

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Jobs
                const jobsRes = await fetch('/api/jobs');
                const jobsData = await jobsRes.json();
                setJobs(jobsData.jobs);

                // Fetch CVs to find primary
                const cvsRes = await fetch(`/api/cv/branches?userId=${userId}`);
                const cvsData = await cvsRes.json();
                setCvs(cvsData.branches || []);
            } catch (err) {
                console.error('Failed to fetch jobs', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleApplyClick = (job: any) => {
        setSelectedJob({
            id: job._id,
            title: job.title,
            company: job.company,
            email: job.email
        });
        setIsApplyModalOpen(true);
    };

    const primaryCv = cvs.find(c => c.isDefault) || cvs[0];

    return (
        <div className="min-h-screen bg-[#0b0b14] text-white p-6 md:p-12 font-outfit">
            <div className="max-w-6xl mx-auto space-y-12">
                {/* Header */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h1 className="text-4xl font-black tracking-tight">Available Positions</h1>
                        <p className="text-slate-500 mt-2">Premium opportunities tailored for your expertise.</p>
                    </div>
                    
                    <div className="flex gap-4 w-full md:w-auto">
                        <div className="relative flex-1 md:w-80">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <input 
                                type="text" 
                                placeholder="Search by role or company..." 
                                className="w-full bg-white/5 border border-white/10 rounded-2xl h-12 pl-12 pr-4 focus:outline-none focus:border-amber-500 transition-colors"
                            />
                        </div>
                        <button className="h-12 w-12 flex items-center justify-center bg-white/5 border border-white/10 rounded-2xl text-slate-400 hover:text-white transition-colors">
                            <Filter size={20} />
                        </button>
                    </div>
                </header>

                {/* Main Grid */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-amber-500"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {jobs.map((job) => (
                            <div key={job._id} className="glass-card group hover:border-amber-500/30 transition-all duration-500 relative overflow-hidden">
                                {/* Ambient Background */}
                                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-40 h-40 bg-amber-500/5 blur-[80px] group-hover:bg-amber-500/10 transition-colors duration-500" />
                                
                                <div className="space-y-6 relative z-10">
                                    <div className="flex justify-between items-start">
                                        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 group-hover:text-amber-500 group-hover:border-amber-500/20 transition-all duration-500">
                                            <Briefcase size={24} />
                                        </div>
                                        {job.salary && (
                                            <span className="text-[10px] font-bold text-amber-500/60 bg-amber-500/10 px-3 py-1 rounded-full uppercase tracking-widest">
                                                {job.salary}
                                            </span>
                                        )}
                                    </div>

                                    <div>
                                        <h3 className="text-xl font-black text-white group-hover:text-amber-500 transition-colors duration-300">{job.title}</h3>
                                        <p className="text-slate-400 font-medium">{job.company}</p>
                                    </div>

                                    <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                                        <div className="flex items-center gap-1.5">
                                            <MapPin size={14} />
                                            <span>{job.location}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <DollarSign size={14} />
                                            <span>Competitive</span>
                                        </div>
                                    </div>

                                    <p className="text-sm text-slate-500 leading-relaxed line-clamp-3">
                                        {job.description}
                                    </p>

                                    <div className="pt-4 flex gap-3">
                                        <button 
                                            onClick={() => handleApplyClick(job)}
                                            className="flex-1 btn-premium text-xs flex items-center justify-center gap-2"
                                        >
                                            <Sparkles size={16} />
                                            One-Click Apply
                                        </button>
                                        <button className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-slate-400 hover:text-white transition-all">
                                            <Send size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Apply Modal */}
            {selectedJob && cvs.length > 0 && (
                <ApplyModal 
                    isOpen={isApplyModalOpen}
                    onClose={() => setIsApplyModalOpen(false)}
                    job={selectedJob}
                    cvs={cvs}
                    userId={userId}
                />
            )}
        </div>
    );
}
