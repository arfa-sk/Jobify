'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Upload, FileText, Check, Trash2, ArrowRight, Activity } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export default function CVDashboard() {
    const [branches, setBranches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [userId] = useState('000000000000000000000001'); // Valid ObjectId placeholder

    useEffect(() => {
        fetchBranches();
    }, []);

    const fetchBranches = async () => {
        try {
            const res = await fetch(`/api/cv/branches?userId=${userId}`);
            const data = await res.json();
            if (data.branches) setBranches(data.branches);
        } catch (err) {
            console.error('Failed to fetch branches', err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('cvFile', file);
        formData.append('userId', userId);

        try {
            const res = await fetch('/api/cv/upload', {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();
            if (data.cv) {
                fetchBranches();
            }
        } catch (err) {
            console.error('Upload failed', err);
        } finally {
            setUploading(false);
        }
    };

    const setAsPrimary = async (cvId: string) => {
        try {
            await fetch('/api/cv/branches', {
                method: 'PATCH',
                body: JSON.stringify({ userId, cvId, action: 'set-primary' }),
            });
            fetchBranches();
        } catch (err) {
            console.error('Failed to set primary', err);
        }
    };

    return (
        <div className="min-h-screen bg-[#0f0f17] text-white p-8">
            <div className="max-w-6xl mx-auto">
                <header className="flex justify-between items-end mb-12">
                    <div>
                        <h1 className="text-4xl font-bold mb-2">CV Library</h1>
                        <p className="text-slate-400">Manage your master profile and specialized branches.</p>
                    </div>
                    <label className="btn-premium flex items-center gap-2 cursor-pointer">
                        <Upload size={18} />
                        <span>{uploading ? 'Parsing...' : 'Upload New CV'}</span>
                        <input type="file" className="hidden" onChange={handleUpload} accept=".pdf,.docx" disabled={uploading} />
                    </label>
                </header>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-orange-500"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {branches.map((branch) => (
                            <div key={branch._id} className={cn(
                                "glass-card p-6 border-l-4 transition-all hover:scale-[1.02]",
                                branch.isDefault ? "border-l-orange-500" : "border-l-slate-700"
                            )}>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-orange-500/10 rounded-lg text-orange-500">
                                        <FileText size={24} />
                                    </div>
                                    {branch.isDefault && (
                                        <span className="text-[10px] uppercase tracking-widest font-bold bg-orange-500 text-white px-2 py-1 rounded">
                                            Primary
                                        </span>
                                    )}
                                </div>
                                
                                <h3 className="text-xl font-bold mb-1">{branch.displayName}</h3>
                                <p className="text-slate-500 text-sm mb-6 capitalize">{branch.category} Branch</p>
                                
                                <div className="flex items-center gap-2 mb-8">
                                    <div className="flex -space-x-2">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="w-6 h-6 rounded-full border-2 border-[#161621] bg-slate-800" />
                                        ))}
                                    </div>
                                    <span className="text-xs text-slate-400">Used in 12 applications</span>
                                </div>

                                <div className="flex gap-3 mt-auto">
                                    <button 
                                        onClick={() => window.location.href = `/cv/${branch._id}`}
                                        className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                                    >
                                        Edit <ArrowRight size={14} />
                                    </button>
                                    {!branch.isDefault && (
                                        <button 
                                            onClick={() => setAsPrimary(branch._id)}
                                            className="p-2 hover:text-orange-500 transition-colors"
                                            title="Set as Primary"
                                        >
                                            <Check size={18} />
                                        </button>
                                    )}
                                    <button className="p-2 hover:text-rose-500 transition-colors" title="Delete Branch">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}

                        <button className="glass-card p-6 border-dashed border-2 border-slate-800 flex flex-col items-center justify-center gap-4 text-slate-500 hover:text-white hover:border-orange-500/50 transition-all group">
                            <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center group-hover:bg-orange-500/20 group-hover:text-orange-500 transition-all">
                                <Plus size={24} />
                            </div>
                            <span className="font-medium">Create New Branch</span>
                        </button>
                    </div>
                )}

                <div className="mt-20">
                    <div className="flex items-center gap-3 mb-8">
                        <Activity className="text-orange-500" />
                        <h2 className="text-2xl font-bold">Recent Insights</h2>
                    </div>
                    <div className="glass-card p-8">
                        <div className="flex flex-col md:flex-row gap-8 items-center">
                            <div className="w-24 h-24 rounded-full border-8 border-orange-500/20 border-t-orange-500 flex items-center justify-center text-2xl font-bold">
                                82%
                            </div>
                            <div>
                                <h3 className="text-xl font-bold mb-2">Your CV Strength is Excellent!</h3>
                                <p className="text-slate-400 max-w-xl">
                                    Based on your current primary CV, you have strong keyword alignment for "Senior Software Engineer" roles. 
                                    Try creating a "Management" branch to optimize for Lead positions.
                                </p>
                            </div>
                            <button className="md:ml-auto px-6 py-3 rounded-xl bg-orange-500/10 text-orange-400 font-semibold hover:bg-orange-500/20 transition-all">
                                Full Analysis
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
