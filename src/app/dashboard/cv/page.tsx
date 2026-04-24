'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { 
  Plus, 
  Upload, 
  FileText, 
  Check, 
  Trash2, 
  ArrowRight, 
  Activity, 
  BrainCircuit, 
  Sparkles,
  Loader2,
  Zap,
  Target,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser } from '@/hooks/useUser';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useSearchParams, useRouter } from 'next/navigation';

function CVDashboardContent() {
    const { user } = useUser();
    const router = useRouter();
    const searchParams = useSearchParams();
    const targetJobId = searchParams.get('targetJob');
    
    const [branches, setBranches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [isTailoring, setIsTailoring] = useState(false);
    const [tailorProgress, setTailorProgress] = useState("");

    useEffect(() => {
        if (user.id) {
            fetchBranches();
        }
    }, [user]);

    useEffect(() => {
        if (targetJobId && branches.length > 0 && !isTailoring) {
            const primary = branches.find(b => b.isDefault) || branches[0];
            if (primary) {
                handleAutoTailor(primary._id, targetJobId);
            }
        }
    }, [targetJobId, branches]);

    const fetchBranches = async () => {
        try {
            const res = await fetch(`/api/cv/branches?userId=${user.id || '000000000000000000000001'}`);
            const data = await res.json();
            if (data.branches) setBranches(data.branches);
        } catch (err) {
            console.error('Failed to fetch branches', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAutoTailor = async (cvId: string, jobId: string) => {
        setIsTailoring(true);
        setTailorProgress("Analyzing job requirements...");
        
        try {
            // 1. Get Job Details
            const jobRes = await fetch(`/api/jobs/${jobId}`);
            const jobData = await jobRes.json();
            if (!jobData.job) throw new Error("Job details not found");

            setTailorProgress(`Tailoring for ${jobData.job.title}...`);
            
            // 2. Trigger Tailoring
            const tailorRes = await fetch('/api/cv/tailor', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id || '000000000000000000000001',
                    cvId,
                    jobDescription: jobData.job.description,
                    targetRole: jobData.job.title
                })
            });
            
            const tailorData = await tailorRes.json();
            if (tailorData.success) {
                setTailorProgress("Success! Finalizing Artboard...");
                setTimeout(() => {
                    router.push(`/dashboard/cv/${tailorData.branchId}`);
                }, 1000);
            } else {
                throw new Error(tailorData.error || "Tailoring failed");
            }
        } catch (err: any) {
            console.error("Auto-tailoring failed", err);
            setTailorProgress(`Error: ${err.message}`);
            setTimeout(() => setIsTailoring(false), 3000);
        }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('cvFile', file);
        formData.append('userId', user.id || '000000000000000000000001');

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
                body: JSON.stringify({ userId: user.id || '000000000000000000000001', cvId, action: 'set-primary' }),
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
            
            {/* Auto-Tailoring Overlay */}
            {isTailoring && (
                <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-2xl flex items-center justify-center p-6 animate-in fade-in duration-500">
                    <Card className="bg-white/5 border-amber-500/30 rounded-[40px] p-12 max-w-lg w-full text-center space-y-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-[60px] pointer-events-none" />
                        
                        <div className="relative">
                            <div className="w-24 h-24 bg-amber-500/20 rounded-3xl flex items-center justify-center mx-auto border border-amber-500/30 shadow-[0_0_30px_rgba(245,158,11,0.3)]">
                                <Sparkles className="text-amber-500 h-10 w-10 animate-pulse" />
                            </div>
                            <Loader2 className="absolute -bottom-2 -right-2 text-amber-500 animate-spin" size={32} />
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-3xl font-black tracking-tighter uppercase italic">Xperia Tailoring Engine</h2>
                            <p className="text-amber-500/60 text-[10px] font-black uppercase tracking-[0.3em]">{tailorProgress}</p>
                        </div>

                        <p className="text-white/40 text-sm font-medium leading-relaxed italic">
                            We are surgically aligning your master profile with the target role requirements using high-fidelity keyword injection.
                        </p>

                        {tailorProgress.includes("Error") && (
                            <Button onClick={() => setIsTailoring(false)} className="bg-white/10 hover:bg-white/20 text-white rounded-xl h-12 uppercase font-black tracking-widest text-[10px]">
                                Cancel & Return
                            </Button>
                        )}
                    </Card>
                </div>
            )}

            <div className="max-w-6xl mx-auto relative z-10">
                <header className="flex justify-between items-end mb-12">
                    <div>
                        <h1 className="text-5xl font-black tracking-tighter mb-2 uppercase italic leading-none">CV Library</h1>
                        <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Architect your career through AI-optimized branches.</p>
                    </div>
                    <label className="h-14 px-8 bg-amber-500 hover:bg-amber-400 text-black rounded-2xl flex items-center gap-3 cursor-pointer shadow-[0_0_30px_rgba(245,158,11,0.2)] transition-all active:scale-95">
                        <Upload size={18} />
                        <span className="text-[10px] font-black uppercase tracking-widest">{uploading ? 'Analyzing...' : 'Upload Master CV'}</span>
                        <input type="file" className="hidden" onChange={handleUpload} accept=".pdf,.docx" disabled={uploading} />
                    </label>
                </header>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-6">
                        <div className="w-16 h-16 border-4 border-amber-500/10 border-t-amber-500 rounded-full animate-spin shadow-[0_0_30px_rgba(245,158,11,0.1)]" />
                        <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest animate-pulse">Synchronizing Neural Library...</span>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {branches.map((branch) => (
                            <Card key={branch._id} className={cn(
                                "bg-white/5 backdrop-blur-xl border-white/10 p-10 rounded-[40px] transition-all hover:bg-white/[0.08] group relative overflow-hidden border-l-4 border-l-transparent hover:border-l-amber-500",
                                branch.isDefault && "border-amber-500/20 ring-1 ring-amber-500/10 bg-white/[0.07]"
                            )}>
                                {branch.isDefault && (
                                    <div className="absolute top-0 right-0 bg-amber-500 text-black text-[9px] font-black px-5 py-1.5 rounded-bl-3xl uppercase tracking-widest">
                                        Primary
                                    </div>
                                )}
                                
                                <div className="p-4 bg-amber-500/10 rounded-2xl text-amber-500 w-fit mb-8 group-hover:bg-amber-500/20 transition-all">
                                    <FileText size={28} />
                                </div>
                                
                                <h3 className="text-2xl font-black tracking-tighter mb-1 uppercase italic">{branch.displayName}</h3>
                                <p className="text-white/30 text-[10px] font-black uppercase tracking-widest mb-10">{branch.category || "General"} Branch</p>
                                
                                <div className="flex items-center gap-4 mb-10">
                                    <div className="flex -space-x-3">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="w-9 h-9 rounded-xl border-4 border-[#0b0b14] bg-white/10 flex items-center justify-center text-[9px] font-black group-hover:border-amber-500/20 transition-all">AI</div>
                                        ))}
                                    </div>
                                    <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">AIGC Verified</span>
                                </div>

                                <div className="flex gap-3">
                                    <Button 
                                        onClick={() => router.push(`/dashboard/cv/${branch._id}`)}
                                        className="flex-1 bg-white/5 hover:bg-white/10 rounded-2xl h-14 text-[10px] font-black uppercase tracking-widest border-white/10"
                                    >
                                        Edit Artboard
                                    </Button>
                                    {!branch.isDefault && (
                                        <Button 
                                            onClick={() => setAsPrimary(branch._id)}
                                            variant="ghost"
                                            className="w-14 h-14 rounded-2xl hover:text-amber-500 bg-white/5 border-white/10"
                                        >
                                            <Check size={20} />
                                        </Button>
                                    )}
                                    <Button variant="ghost" className="w-14 h-14 rounded-2xl hover:text-rose-500 bg-white/5 border-white/10">
                                        <Trash2 size={20} />
                                    </Button>
                                </div>

                                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity" />
                            </Card>
                        ))}

                        <button className="bg-white/[0.02] backdrop-blur-xl border-2 border-dashed border-white/10 rounded-[40px] p-8 flex flex-col items-center justify-center gap-6 text-white/20 hover:text-amber-500 hover:border-amber-500/30 transition-all group min-h-[360px]">
                            <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center group-hover:bg-amber-500/20 group-hover:rotate-90 transition-all duration-500">
                                <Plus size={32} />
                            </div>
                            <div className="text-center">
                                <span className="block text-xs font-black uppercase tracking-widest mb-1">Create AI Branch</span>
                                <span className="text-[9px] font-medium text-white/10 uppercase tracking-widest">Manual Tailoring Mode</span>
                            </div>
                        </button>
                    </div>
                )}

                <div className="mt-24">
                    <div className="flex items-center gap-4 mb-10">
                        <div className="p-2 bg-amber-500/20 rounded-lg">
                           <BrainCircuit className="text-amber-500" size={24} />
                        </div>
                        <h2 className="text-3xl font-black tracking-tighter uppercase italic leading-none">Intelligence Report</h2>
                    </div>
                    <Card className="bg-gradient-to-br from-amber-500/10 to-transparent border-amber-500/20 rounded-[40px] p-12 relative overflow-hidden group">
                        <div className="flex flex-col md:flex-row gap-12 items-center relative z-10">
                            <div className="relative">
                                <div className="w-32 h-32 rounded-full border-8 border-amber-500/10 border-t-amber-500 flex items-center justify-center text-3xl font-black shadow-[0_0_50px_rgba(245,158,11,0.2)] group-hover:scale-110 transition-transform duration-700">
                                    82%
                                </div>
                                <div className="absolute inset-0 rounded-full animate-pulse bg-amber-500/5 -z-10" />
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-3xl font-black tracking-tighter uppercase italic">Strength Analysis: Excellent</h3>
                                <p className="text-white/40 text-sm font-medium max-w-xl leading-relaxed italic">
                                    Your "Master Profile" has exceptional keyword alignment for **Senior Engineering** roles. 
                                    We recommend architecting a **Management branch** to optimize for Lead positions.
                                </p>
                            </div>
                            <Button className="md:ml-auto h-14 px-10 bg-white text-black font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-amber-500 transition-all">
                                Full Insight Report
                            </Button>
                        </div>
                        <div className="absolute top-[-50%] right-[-10%] w-[400px] h-[400px] bg-amber-500/5 blur-[120px] rounded-full pointer-events-none" />
                    </Card>
                </div>
            </div>
        </div>
    );
}

export default function CVDashboard() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <CVDashboardContent />
        </Suspense>
    );
}
