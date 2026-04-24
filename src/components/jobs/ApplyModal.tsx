'use client';

import React, { useState } from 'react';
import { Sparkles, Send, X, FileText, CheckCircle2, Loader2 } from 'lucide-react';
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
    };
    cvs: any[]; // Changed from cvId to cvs list
    userId: string;
}

export default function ApplyModal({ isOpen, onClose, job, cvs, userId }: ApplyModalProps) {
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState<'pro' | 'thorough'>('pro');
    const [selectedCvId, setSelectedCvId] = useState<string>(cvs[0]?._id || '');
    const [result, setResult] = useState<{ gmailUrl: string, body: string } | null>(null);

    if (!isOpen) return null;

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
            <div className="glass-card w-full max-w-xl relative overflow-hidden border-white/10 shadow-[0_0_80px_rgba(245,158,11,0.15)]">
                {/* Close Button */}
                <button onClick={() => { setResult(null); onClose(); }} className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white transition-colors">
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

                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">1. Select CV Branch</label>
                            <div className="grid grid-cols-1 gap-2">
                                {cvs.map((cv) => (
                                    <button
                                        key={cv._id}
                                        onClick={() => setSelectedCvId(cv._id)}
                                        className={cn(
                                            "flex items-center justify-between p-3 rounded-xl border transition-all text-sm",
                                            selectedCvId === cv._id 
                                                ? "bg-amber-500/10 border-amber-500/30 text-white" 
                                                : "bg-white/5 border-white/5 text-slate-400 hover:border-white/10"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <FileText size={16} className={selectedCvId === cv._id ? "text-amber-500" : "text-slate-600"} />
                                            <span className="font-medium">{cv.displayName}</span>
                                            {cv.isDefault && <span className="text-[8px] bg-amber-500/20 text-amber-500 px-2 py-0.5 rounded-full">Primary</span>}
                                        </div>
                                        {selectedCvId === cv._id && <CheckCircle2 size={16} className="text-amber-500" />}
                                    </button>
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
