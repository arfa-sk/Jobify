'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Upload, FileText, Check, Trash2, ArrowRight, Activity, BrainCircuit } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser } from '@/hooks/useUser';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function CVDashboard() {
    const { user } = useUser();
    const [branches, setBranches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (user.email !== "alex@career.com") {
            fetchBranches();
        } else {
            // Mock data for initial state
            setBranches([
                { _id: '1', displayName: 'Master Profile', category: 'Software Engineer', isDefault: true },
                { _id: '2', displayName: 'Management Focus', category: 'Product Manager', isDefault: false },
            ]);
            setLoading(false);
        }
    }, [user]);

    const fetchBranches = async () => {
        try {
            const res = await fetch(`/api/cv/branches?email=${user.email}`);
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
        formData.append('email', user.email);

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
                body: JSON.stringify({ email: user.email, cvId, action: 'set-primary' }),
            });
            fetchBranches();
        } catch (err) {
            console.error('Failed to set primary', err);
        }
    };

    return (
        <div className="min-h-screen bg-[#0b0b14] text-white p-8 font-outfit relative">
            <div className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20 pointer-events-none"
                 style={{ backgroundImage: `url('https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Fractal%20Glass%20-%204.jpg-8QPt1A02QgjJIeTqwEYV5thwZXXEGT.jpeg')` }} />
            
            <div className="max-w-6xl mx-auto relative z-10">
                <header className="flex justify-between items-end mb-12">
                    <div>
                        <h1 className="text-4xl font-black tracking-tighter mb-2">CV Library</h1>
                        <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Manage your master profile and AI-optimized branches.</p>
                    </div>
                    <label className="btn-premium flex items-center gap-2 cursor-pointer shadow-amber-900/40">
                        <Upload size={18} />
                        <span className="text-[10px] font-black uppercase tracking-widest">{uploading ? 'Analyzing...' : 'Upload Master CV'}</span>
                        <input type="file" className="hidden" onChange={handleUpload} accept=".pdf,.docx" disabled={uploading} />
                    </label>
                </header>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
                        <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Synchronizing Library...</span>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {branches.map((branch) => (
                            <Card key={branch._id} className={cn(
                                "bg-white/5 backdrop-blur-xl border-white/10 p-8 rounded-[32px] transition-all hover:scale-[1.02] group relative overflow-hidden",
                                branch.isDefault && "border-amber-500/30 ring-1 ring-amber-500/20"
                            )}>
                                {branch.isDefault && (
                                    <div className="absolute top-0 right-0 bg-amber-500 text-black text-[9px] font-black px-4 py-1 rounded-bl-2xl uppercase tracking-widest">
                                        Primary
                                    </div>
                                )}
                                
                                <div className="p-4 bg-amber-500/10 rounded-2xl text-amber-500 w-fit mb-6">
                                    <FileText size={24} />
                                </div>
                                
                                <h3 className="text-xl font-black tracking-tight mb-1">{branch.displayName}</h3>
                                <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-8">{branch.category} Branch</p>
                                
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="flex -space-x-2">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="w-7 h-7 rounded-full border-2 border-[#141424] bg-white/5 flex items-center justify-center text-[8px] font-black">AI</div>
                                        ))}
                                    </div>
                                    <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">AIGC Verified</span>
                                </div>

                                <div className="flex gap-3">
                                    <Button 
                                        onClick={() => window.location.href = `/dashboard/cv/${branch._id}`}
                                        className="flex-1 bg-white/5 hover:bg-white/10 rounded-2xl h-12 text-[10px] font-black uppercase tracking-widest border-white/10"
                                    >
                                        Edit <ArrowRight size={14} className="ml-2" />
                                    </Button>
                                    {!branch.isDefault && (
                                        <Button 
                                            onClick={() => setAsPrimary(branch._id)}
                                            variant="ghost"
                                            className="w-12 h-12 rounded-2xl hover:text-amber-500 border-white/10"
                                        >
                                            <Check size={18} />
                                        </Button>
                                    )}
                                    <Button variant="ghost" className="w-12 h-12 rounded-2xl hover:text-rose-500 border-white/10">
                                        <Trash2 size={18} />
                                    </Button>
                                </div>
                            </Card>
                        ))}

                        <button className="bg-white/2 backdrop-blur-xl border-2 border-dashed border-white/5 rounded-[32px] p-8 flex flex-col items-center justify-center gap-4 text-white/20 hover:text-amber-500 hover:border-amber-500/30 transition-all group min-h-[320px]">
                            <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-amber-500/20 transition-all">
                                <Plus size={24} />
                            </div>
                            <span className="text-xs font-black uppercase tracking-widest">Create AI Branch</span>
                        </button>
                    </div>
                )}

                <div className="mt-20">
                    <div className="flex items-center gap-3 mb-8">
                        <BrainCircuit className="text-amber-500" />
                        <h2 className="text-2xl font-black tracking-tighter uppercase">AI Intelligence</h2>
                    </div>
                    <Card className="bg-gradient-to-br from-amber-500/10 to-transparent border-amber-500/20 rounded-[32px] p-10">
                        <div className="flex flex-col md:flex-row gap-10 items-center">
                            <div className="relative">
                                <div className="w-24 h-24 rounded-full border-4 border-amber-500/10 border-t-amber-500 flex items-center justify-center text-2xl font-black shadow-[0_0_30px_rgba(245,158,11,0.2)]">
                                    82%
                                </div>
                                <div className="absolute inset-0 rounded-full animate-pulse bg-amber-500/5 -z-10" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black tracking-tight">Strength Analysis: Excellent</h3>
                                <p className="text-white/40 text-xs font-medium max-w-xl leading-relaxed">
                                    Your "Master Profile" has strong keyword alignment for **Senior Engineering** roles. 
                                    We recommend creating a **Management branch** to optimize for Lead positions.
                                </p>
                            </div>
                            <Button className="md:ml-auto btn-premium">
                                Full Insight Report
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
