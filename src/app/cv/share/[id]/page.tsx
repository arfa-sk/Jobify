import React from 'react';
import { getPublicCv } from '@/server/services/share-service';
import connectDB from '@/server/db';
import { notFound } from 'next/navigation';
import { Mail, Phone, Globe, MapPin, ExternalLink } from 'lucide-react';

export default async function SharedCvPage({ params }: { params: { id: string } }) {
    await connectDB();
    const { id } = await params;
    
    let cv;
    try {
        cv = await getPublicCv(id);
    } catch (e) {
        notFound();
    }

    const rawData = cv.cvJson || cv.cvData || {};
    const basics = rawData.basics || {};
    const work = rawData.work || [];
    const education = rawData.education || [];
    const skills = rawData.skills || [];

    return (
        <div className="min-h-screen bg-[#0b0b14] text-[#eeeef8] p-4 md:p-12 font-outfit selection:bg-amber-500/30">
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Recruiter Badge */}
                <div className="flex justify-center">
                    <div className="px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] font-black uppercase tracking-[0.2em] text-amber-500">
                        Interactive Recruiter View
                    </div>
                </div>

                {/* Header Card */}
                <div className="glass-card flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-2">{basics.name || 'Candidate Profile'}</h1>
                        <p className="text-xl text-amber-500 font-medium">{basics.label || 'Professional'}</p>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-slate-400">
                        {basics.email && (
                            <div className="flex items-center gap-2">
                                <Mail size={16} className="text-amber-500" />
                                <span>{basics.email}</span>
                            </div>
                        )}
                        {basics.location?.city && (
                            <div className="flex items-center gap-2">
                                <MapPin size={16} className="text-amber-500" />
                                <span>{basics.location.city}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Sidebar */}
                    <div className="space-y-8">
                        <section className="space-y-4">
                            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 border-b border-white/5 pb-2">Profile</h2>
                            <p className="text-sm leading-relaxed text-slate-400">
                                {basics.summary || 'A highly skilled professional dedicated to excellence and continuous growth in their field.'}
                            </p>
                        </section>

                        {skills.length > 0 && (
                            <section className="space-y-4">
                                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 border-b border-white/5 pb-2">Expertise</h2>
                                <div className="flex flex-wrap gap-2">
                                    {skills.map((skill: any, i: number) => (
                                        <span key={i} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold text-slate-300">
                                            {skill.name}
                                        </span>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>

                    {/* Main Feed */}
                    <div className="md:col-span-2 space-y-12">
                        {/* Experience */}
                        <section className="space-y-8">
                            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 border-b border-white/5 pb-2">Experience</h2>
                            {work.length > 0 ? work.map((item: any, i: number) => (
                                <div key={i} className="relative pl-6 border-l border-white/5 space-y-2">
                                    <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-amber-500" />
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-lg font-bold text-white">{item.position}</h3>
                                            <p className="text-amber-500/80 text-sm font-medium">{item.name}</p>
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{item.startDate} — {item.endDate || 'Present'}</span>
                                    </div>
                                    <p className="text-sm text-slate-400 leading-relaxed">{item.summary}</p>
                                </div>
                            )) : (
                                <p className="text-sm text-slate-500 italic">No experience data available for this branch.</p>
                            )}
                        </section>

                        {/* Education */}
                        {education.length > 0 && (
                            <section className="space-y-6">
                                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 border-b border-white/5 pb-2">Education</h2>
                                {education.map((edu: any, i: number) => (
                                    <div key={i} className="space-y-1">
                                        <h3 className="text-sm font-bold text-white">{edu.area}</h3>
                                        <p className="text-xs text-slate-400">{edu.institution}</p>
                                    </div>
                                ))}
                            </section>
                        )}
                    </div>
                </div>

                {/* Footer Link */}
                <div className="pt-12 text-center border-t border-white/5">
                    <a href="/" className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-slate-600 hover:text-amber-500 transition-colors">
                        Powered by Jobify Intelligence <ExternalLink size={12} />
                    </a>
                </div>
            </div>
        </div>
    );
}
