'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Save, Sparkles, ChevronLeft, Layout, Eye, MessageSquare, AlertCircle } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export default function CVEditor() {
    const { id } = useParams();
    const [cv, setCv] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [analyzing, setAnalyzing] = useState(false);
    const [feedback, setFeedback] = useState<any>({});
    const [userId] = useState('000000000000000000000001');

    useEffect(() => {
        if (id) fetchCv();
    }, [id]);

    const fetchCv = async () => {
        try {
            const res = await fetch(`/api/cv/branches/${id}?userId=${userId}`);
            const data = await res.json();
            if (data.cv) setCv(data.cv);
        } catch (err) {
            console.error('Failed to fetch CV', err);
        } finally {
            setLoading(false);
        }
    };

    const runAnalysis = async () => {
        setAnalyzing(true);
        try {
            const res = await fetch('/api/cv/analyze', {
                method: 'POST',
                body: JSON.stringify({ userId, cvId: id, type: 'sections' }),
            });
            const data = await res.json();
            if (data.sections) setFeedback(data.sections);
        } catch (err) {
            console.error('Analysis failed', err);
        } finally {
            setAnalyzing(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-[#0f0f17] flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-orange-500"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0f0f17] text-white flex flex-col">
            <header className="h-16 border-b border-white/5 flex items-center px-6 gap-4 bg-[#0f0f17]/80 backdrop-blur-md sticky top-0 z-50">
                <button onClick={() => window.location.href = '/dashboard/cv'} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                    <ChevronLeft size={20} />
                </button>
                <div className="h-6 w-[1px] bg-white/10 mx-2" />
                <div>
                    <h2 className="font-bold">{cv?.displayName}</h2>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">{cv?.category} Branch</p>
                </div>

                <div className="ml-auto flex items-center gap-3">
                    <button 
                        onClick={runAnalysis}
                        disabled={analyzing}
                        className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 text-orange-400 rounded-lg hover:bg-orange-500/20 transition-all text-sm font-semibold disabled:opacity-50"
                    >
                        <Sparkles size={16} />
                        {analyzing ? 'Analyzing...' : 'AI Analyze'}
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-all text-sm font-semibold">
                        <Save size={16} />
                        Save Changes
                    </button>
                    <div className="h-6 w-[1px] bg-white/10 mx-2" />
                    <button className="p-2 hover:bg-white/5 rounded-lg text-slate-400">
                        <Layout size={20} />
                    </button>
                    <button className="p-2 hover:bg-white/5 rounded-lg text-slate-400">
                        <Eye size={20} />
                    </button>
                </div>
            </header>

            <main className="flex-1 flex overflow-hidden">
                {/* Editor Area */}
                <div className="flex-1 overflow-y-auto p-12 bg-black/20">
                    <div className="max-w-3xl mx-auto space-y-12">
                        {/* Basics Section */}
                        <section className="space-y-6">
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-[0.2em] border-b border-white/5 pb-2">Personal Information</h3>
                            <div className="grid grid-cols-2 gap-6">
                                <EditableField label="Full Name" value={cv?.cvJson?.basics?.name} />
                                <EditableField label="Label" value={cv?.cvJson?.basics?.label} />
                                <EditableField label="Email" value={cv?.cvJson?.basics?.email} />
                                <EditableField label="Phone" value={cv?.cvJson?.basics?.phone} />
                            </div>
                        </section>

                        {/* Experience Section */}
                        <section className="space-y-6">
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-[0.2em] border-b border-white/5 pb-2">Experience</h3>
                            {cv?.cvJson?.work?.map((work: any, i: number) => (
                                <div key={i} className="relative group">
                                    <div className="space-y-4 p-4 rounded-xl hover:bg-white/[0.02] transition-colors">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <input className="bg-transparent text-xl font-bold w-full focus:outline-none" defaultValue={work.position} />
                                                <input className="bg-transparent text-orange-400 w-full focus:outline-none" defaultValue={work.name} />
                                            </div>
                                            <span className="text-xs text-slate-500">{work.startDate} - {work.endDate}</span>
                                        </div>
                                        <div className="space-y-2">
                                            {work.highlights?.map((h: string, j: number) => (
                                                <div key={j} className="relative group/bullet">
                                                    <textarea 
                                                        className="bg-transparent text-slate-300 w-full focus:outline-none resize-none leading-relaxed" 
                                                        defaultValue={h}
                                                        rows={2}
                                                    />
                                                    {feedback.work?.[i]?.needsImprovement && (
                                                        <div className="absolute left-[-2rem] top-1">
                                                            <div className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-500 flex items-center justify-center cursor-help group-hover/bullet:scale-110 transition-transform">
                                                                <AlertCircle size={14} />
                                                            </div>
                                                            {/* Tooltip Content */}
                                                            <div className="absolute left-8 top-0 w-64 p-3 bg-[#1c1c2b] border border-orange-500/30 rounded-xl shadow-2xl opacity-0 invisible group-hover/bullet:opacity-100 group-hover/bullet:visible transition-all z-20">
                                                                <div className="flex items-center gap-2 mb-2 text-orange-500">
                                                                    <Sparkles size={14} />
                                                                    <span className="text-[10px] font-bold uppercase tracking-widest">AI Feedback</span>
                                                                </div>
                                                                <p className="text-xs text-slate-300 leading-relaxed">
                                                                    {feedback.work[i].feedback}
                                                                </p>
                                                                <button className="mt-3 w-full py-1.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all">
                                                                    Auto-Improve
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </section>
                    </div>
                </div>

                {/* Sidebar */}
                <aside className="w-80 border-l border-white/5 p-6 bg-[#0f0f17]">
                    <div className="flex items-center gap-2 mb-8 text-slate-500">
                        <MessageSquare size={18} />
                        <h4 className="font-bold text-sm uppercase tracking-widest">Live Feedback</h4>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/10">
                            <div className="flex items-center gap-2 mb-2 text-orange-500">
                                <AlertCircle size={16} />
                                <span className="text-xs font-bold uppercase tracking-widest">Quick Tip</span>
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Quantify your achievements! Instead of "Managed a team", try "Led a team of 12 engineers to deliver 3 flagship projects."
                            </p>
                        </div>

                        {analyzing && (
                            <div className="flex flex-col items-center justify-center py-12 gap-4">
                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-orange-500"></div>
                                <span className="text-xs text-slate-500">Processing with Gemini...</span>
                            </div>
                        )}

                        {!analyzing && Object.keys(feedback).length > 0 && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                                <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/10">
                                    <h5 className="text-[10px] font-bold uppercase tracking-widest text-green-500 mb-2">Checklist Completed</h5>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-xs text-slate-400">
                                            <Check size={12} className="text-green-500" /> Grammar looks great
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-slate-400">
                                            <Check size={12} className="text-green-500" /> Structure is optimal
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </aside>
            </main>
        </div>
    );
}

function EditableField({ label, value }: { label: string, value: string }) {
    return (
        <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-600">{label}</label>
            <input 
                className="w-full bg-transparent border-b border-white/5 py-2 focus:outline-none focus:border-orange-500 transition-colors text-slate-300" 
                defaultValue={value}
            />
        </div>
    );
}

function Check({ size, className }: { size: number, className?: string }) {
    return (
        <svg 
            width={size} 
            height={size} 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className={className}
        >
            <polyline points="20 6 9 17 4 12" />
        </svg>
    );
}
