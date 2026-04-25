'use client';

import React, { useState } from 'react';
import { Sparkles, Send, X, FileText, CheckCircle2, Loader2, Scissors, Info } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface ApplyModalProps {
    isOpen: boolean;
    onClose: () => void;
    job: {
        id: string;
        title: string;
        company: string;
        email: string;
        description?: string;
    };
    cvs: any[];
    userId: string;
    onRefreshCvs?: () => Promise<void>;
}

export default function ApplyModal({ isOpen, onClose, job, cvs, userId, onRefreshCvs }: ApplyModalProps) {
    const [loading, setLoading] = useState(false);
    const [tailoringId, setTailoringId] = useState<string | null>(null);
    const [mode, setMode] = useState<'pro' | 'thorough'>('pro');
    const [selectedCvId, setSelectedCvId] = useState<string>(cvs[0]?._id || '');
    const [result, setResult] = useState<{ gmailUrl: string, body: string, mode?: string } | null>(null);
    const [tailorResult, setTailorResult] = useState<any | null>(null);

    if (!isOpen) return null;

    const handleTailor = async (cvId: string) => {
        setTailoringId(cvId);
        setTailorResult(null);
        try {
            const res = await fetch('/api/cv/tailor', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    userId, 
                    cvId, 
                    jobDescription: job.description || `${job.title} at ${job.company}`,
                    targetRole: job.title
                }),
            });
            const data = await res.json();
            if (data.success) {
                if (onRefreshCvs) await onRefreshCvs();
                setSelectedCvId(data.branchId);
                setTailorResult({
                    mode: data.mode,
                    changes: data.changes || [],
                    keywords: data.jdAnalysis?.extractedKeywords || []
                });
            } else {
                throw new Error(data.error || 'Tailoring failed');
            }
        } catch (error: any) {
            console.error('Tailoring failed', error);
            alert(`Tailoring failed: ${error.message}`);
        } finally {
            setTailoringId(null);
        }
    };

    const handleApply = async () => {
        if (!selectedCvId) {
            alert('Please select a CV to apply with.');
            return;
        }
        setLoading(true);
        try {
            const res = await fetch('/api/apply/email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jobId: job.id, cvId: selectedCvId, userId, mode }),
            });
            const data = await res.json();
            
            if (data.gmailUrl) {
                setResult({ gmailUrl: data.gmailUrl, body: data.body });
            } else {
                throw new Error(data.error || 'Failed to generate');
            }
        } catch (error: any) {
            console.error('Apply failed', error);
            alert(`Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="glass-card w-full max-w-xl relative overflow-hidden border-white/10 shadow-[0_0_80px_rgba(245,158,11,0.15)] max-h-[90vh] overflow-y-auto scrollbar-hide">
                {/* Close Button */}
                <button onClick={() => { setResult(null); setTailorResult(null); onClose(); }} className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white transition-colors">
                    <X size={20} />
                </button>

                {!result ? (
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-500">
                                <Sparkles size={20} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-white">AI One-Click Apply</h2>
                                <p className="text-xs text-slate-500 uppercase tracking-widest">{job.company} • {job.title}</p>
                            </div>
                        </div>

                        {/* Tailoring Result Proof */}
                        {tailorResult && (
                            <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl animate-in slide-in-from-top-2 duration-300">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-500">
                                            <CheckCircle2 size={14} />
                                        </div>
                                        <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Surgical Tailoring Success</h3>
                                    </div>
                                    <span className={cn("text-[8px] px-2 py-0.5 rounded-full font-bold uppercase", tailorResult.mode === 'AI' ? "bg-green-500/20 text-green-500" : "bg-amber-500/20 text-amber-500")}>
                                        {tailorResult.mode} Engine
                                    </span>
                                </div>
                                <div className="space-y-2">
                                    {tailorResult.changes.slice(0, 3).map((c: any, i: number) => (
                                        <div key={i} className="flex gap-2 text-[9px] text-slate-400">
                                            <span className="text-amber-500 font-bold min-w-[50px]">{c.section}:</span>
                                            <span className="italic">{c.description}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">1. Select or Tailor CV</label>
                            <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-2 scrollbar-hide">
                                {cvs.map((cv) => (
                                    <div 
                                        key={cv._id}
                                        className={cn(
                                            "flex items-center justify-between p-3 rounded-xl border transition-all",
                                            selectedCvId === cv._id 
                                                ? "bg-amber-500/10 border-amber-500/30" 
                                                : "bg-white/5 border-white/5"
                                        )}
                                    >
                                        <button
                                            onClick={() => setSelectedCvId(cv._id)}
                                            className="flex-1 flex items-center gap-3 text-left"
                                        >
                                            <FileText size={16} className={selectedCvId === cv._id ? "text-amber-500" : "text-slate-600"} />
                                            <div className="flex flex-col">
                                                <span className={cn("text-xs font-bold", selectedCvId === cv._id ? "text-white" : "text-slate-400")}>{cv.displayName}</span>
                                                {cv.isTailored && <span className="text-[8px] text-green-500 font-black uppercase tracking-widest mt-0.5">Tailored</span>}
                                            </div>
                                        </button>
                                        
                                        {!cv.isTailored && (
                                            <button 
                                                onClick={() => handleTailor(cv._id)}
                                                disabled={tailoringId !== null}
                                                className="ml-2 p-2 rounded-lg bg-white/5 hover:bg-amber-500/20 text-amber-500 transition-all border border-transparent hover:border-amber-500/30 disabled:opacity-50 group"
                                                title="Tailor this CV for this job"
                                            >
                                                {tailoringId === cv._id ? <Loader2 size={14} className="animate-spin" /> : <Scissors size={14} className="group-hover:rotate-12 transition-transform" />}
                                            </button>
                                        )}
                                        
                                        {selectedCvId === cv._id && <CheckCircle2 size={16} className="text-amber-500 ml-2" />}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">2. Application Mode</label>
                            <div className="grid grid-cols-2 gap-4">
                                <button 
                                    onClick={() => setMode('pro')}
                                    className={cn(
                                        "p-4 rounded-2xl border transition-all text-left group",
                                        mode === 'pro' 
                                            ? "bg-amber-500/10 border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.1)]" 
                                            : "bg-white/5 border-white/5 hover:border-white/20"
                                    )}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <FileText size={18} className={mode === 'pro' ? "text-amber-500" : "text-slate-500"} />
                                        {mode === 'pro' && <CheckCircle2 size={16} className="text-amber-500" />}
                                    </div>
                                    <h4 className="font-bold text-white text-sm mb-1">Pro Mail</h4>
                                    <p className="text-[10px] text-slate-500 leading-tight">Short, punchy, and modern. Best for quick responses.</p>
                                </button>

                                <button 
                                    onClick={() => setMode('thorough')}
                                    className={cn(
                                        "p-4 rounded-2xl border transition-all text-left group",
                                        mode === 'thorough' 
                                            ? "bg-amber-500/10 border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.1)]" 
                                            : "bg-white/5 border-white/5 hover:border-white/20"
                                    )}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <Send size={18} className={mode === 'thorough' ? "text-amber-500" : "text-slate-500"} />
                                        {mode === 'thorough' && <CheckCircle2 size={16} className="text-amber-500" />}
                                    </div>
                                    <h4 className="font-bold text-white text-sm mb-1">Thorough</h4>
                                    <p className="text-[10px] text-slate-500 leading-tight">Detailed narrative highlighting your full journey.</p>
                                </button>
                            </div>
                        </div>

                        <div className="pt-4">
                            <button 
                                onClick={handleApply}
                                disabled={loading || !selectedCvId}
                                className="btn-premium w-full flex items-center justify-center gap-2 group disabled:opacity-50"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="animate-spin" size={18} />
                                        <span>AI Writing Letter...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Generate Application</span>
                                        <Sparkles size={18} className="group-hover:rotate-12 transition-transform" />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6 animate-in zoom-in-95 duration-300">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center text-green-500">
                                <CheckCircle2 size={20} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-white">Application Ready!</h2>
                                <p className="text-xs text-slate-500 uppercase tracking-widest">Review your AI-generated letter</p>
                            </div>
                        </div>

                        <div className="max-h-60 overflow-y-auto p-4 bg-white/5 border border-white/10 rounded-2xl text-xs text-slate-300 leading-relaxed scrollbar-hide">
                            <pre className="whitespace-pre-wrap font-outfit">{result.body}</pre>
                        </div>

                        <div className="pt-4 space-y-3">
                            <a 
                                href={result.gmailUrl} 
                                target="_blank" 
                                rel="noreferrer"
                                className="btn-premium w-full flex items-center justify-center gap-2"
                            >
                                <span>Continue to Gmail</span>
                                <Send size={18} />
                            </a>
                            <button 
                                onClick={() => setResult(null)}
                                className="w-full text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] hover:text-white transition-colors"
                            >
                                Start Over
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
    return <span className={cn("px-2 py-0.5 rounded-full font-black uppercase", className)}>{children}</span>;
}
