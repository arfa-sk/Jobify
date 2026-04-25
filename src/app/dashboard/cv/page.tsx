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
  X,
  ArrowLeft,
  LayoutDashboard,
  Briefcase
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser } from '@/hooks/useUser';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

function CVDashboardContent() {
    const { user } = useUser();
    const router = useRouter();
    const pathname = usePathname();
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
            const jobRes = await fetch(`/api/jobs/${jobId}`);
            const jobData = await jobRes.json();
            if (!jobData.job) throw new Error("Job details not found");

            setTailorProgress(`Tailoring for ${jobData.job.title}...`);
            
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
            await fetch('/api/cv/upload', { method: 'POST', body: formData });
            fetchBranches();
        } catch (err) {
            console.error('Upload failed', err);
        } finally {
            setUploading(false);
        }
    };

    const setAsPrimary = async (cvId: string) => {
        try {
            await fetch('/api/cv/branches', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cvId, isDefault: true, userId: user.id || '000000000000000000000001' })
            });
            fetchBranches();
        } catch (err) {
            console.error('Failed to set primary', err);
        }
    };

    const deleteBranch = async (cvId: string) => {
        if (!confirm("Are you sure you want to delete this AI branch?")) return;
        try {
            await fetch(`/api/cv/branches?cvId=${cvId}`, { method: 'DELETE' });
            fetchBranches();
        } catch (err) {
            console.error('Delete failed', err);
        }
    };

    return (
        <div className="h-screen relative overflow-hidden bg-[#0b0b14] flex font-outfit text-white">
            {/* SIDEBAR */}
            <aside className={cn("h-full bg-[#05050a] border-r border-white/10 transition-all duration-500 flex flex-col relative z-30 w-72")}>
                <div className="p-8 flex-1 flex flex-col overflow-hidden">
                    <div className="mb-12 flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center border border-white/20 shadow-[0_0_15px_rgba(245,158,11,0.3)] cursor-pointer" onClick={() => router.push('/dashboard')}>
                            <Zap className="text-black h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold tracking-tight leading-none">Jobify Pro</h1>
                            <p className="text-amber-500/80 text-[9px] uppercase tracking-normal font-bold mt-1">Intelligence</p>
                        </div>
                    </div>

                    <nav className="space-y-2 flex-1">
                        {[
                            { icon: LayoutDashboard, label: "Overview", href: "/dashboard" },
                            { icon: FileText, label: "CV Management", href: "/dashboard/cv" },
                            { icon: Briefcase, label: "Job Listing", href: "/pipeline" },
                            { icon: Target, label: "Track Applications", href: "/dashboard/applications" },
                        ].map((item, index) => (
                            <Button
                                key={index}
                                variant="ghost"
                                onClick={() => router.push(item.href)}
                                className={cn(
                                    "w-full h-12 rounded-xl group transition-all justify-start px-4",
                                    pathname === item.href ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" : "text-white/40 hover:bg-white/5 hover:text-white"
                                )}
                            >
                                <item.icon size={18} className={cn("shrink-0", pathname === item.href ? "text-amber-500" : "group-hover:text-amber-500")} />
                                <span className="ml-4 text-xs font-bold uppercase tracking-wider">{item.label}</span>
                            </Button>
                        ))}
                    </nav>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className="flex-1 h-full overflow-hidden flex flex-col relative">
                <div className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20 pointer-events-none" style={{ backgroundImage: `url('https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Fractal%20Glass%20-%204.jpg-8QPt1A02QgjJIeTqwEYV5thwZXXEGT.jpeg')` }} />

                <header className="relative z-20 backdrop-blur-xl bg-black/40 border-b border-white/10 px-12 h-20 flex items-center justify-end">
                    <div className="flex items-center gap-6">
                        <div className="text-right">
                            <p className="text-xs font-bold text-white uppercase">{user.firstName} {user.lastName}</p>
                            <p className="text-[9px] text-amber-500/60 font-semibold tracking-normal uppercase ">{user.role || 'Career Pilot'}</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center font-bold text-amber-500 text-xs shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                            {user.firstName[0]}{user.lastName[0]}
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-12 relative z-10 scrollbar-hide">
                    {/* CV TAILORING OVERLAY */}
                    {isTailoring && (
                        <div className="fixed inset-0 z-50 bg-[#0b0b14]/95 backdrop-blur-sm flex items-center justify-center p-6">
                            <Card className="bg-white/5 border-amber-500/30 rounded-[40px] p-12 max-w-lg w-full text-center space-y-8 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-[60px] pointer-events-none" />
                                <div className="relative">
                                    <div className="w-24 h-24 bg-amber-500/20 rounded-3xl flex items-center justify-center mx-auto border border-amber-500/30 shadow-[0_0_30px_rgba(245,158,11,0.3)]">
                                        <Sparkles className="text-amber-500 h-10 w-10 animate-pulse" />
                                    </div>
                                    <Loader2 className="absolute -bottom-2 -right-2 text-amber-500 animate-spin" size={32} />
                                </div>
                                <div className="space-y-2">
                                    <h2 className="text-3xl font-semibold tracking-tight uppercase ">Xperia Tailoring Engine</h2>
                                    <p className="text-amber-500/60 text-[10px] font-semibold uppercase tracking-[0.3em]">{tailorProgress}</p>
                                </div>
                                <p className="text-white/40 text-sm font-medium leading-relaxed ">
                                    We are surgically aligning your master profile with the target role requirements using high-fidelity keyword injection.
                                </p>
                                {tailorProgress.includes("Error") && (
                                    <Button onClick={() => setIsTailoring(false)} className="bg-white/10 hover:bg-white/20 text-white rounded-xl h-12 uppercase font-semibold tracking-normal text-[10px]">
                                        Cancel & Return
                                    </Button>
                                )}
                            </Card>
                        </div>
                    )}

                    <div className="max-w-6xl mx-auto">
                        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-white/5 pb-12">
                            <div>
                                <h1 className="text-5xl font-semibold tracking-tight mb-2 uppercase leading-none">CV Library</h1>
                                <p className="text-white/40 text-xs font-bold uppercase tracking-normal">Architect your career through AI-optimized branches.</p>
                            </div>
                            <label className="h-14 px-8 bg-amber-500 hover:bg-amber-400 text-black rounded-2xl flex items-center gap-3 cursor-pointer shadow-[0_0_30px_rgba(245,158,11,0.2)] transition-all active:scale-95">
                                <Upload size={18} />
                                <span className="text-[10px] font-semibold uppercase tracking-normal">{uploading ? 'Analyzing...' : 'Upload Master CV'}</span>
                                <input type="file" className="hidden" onChange={handleUpload} accept=".pdf,.docx" disabled={uploading} />
                            </label>
                        </header>

                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-32 gap-6">
                                <div className="w-16 h-16 border-4 border-amber-500/10 border-t-amber-500 rounded-full animate-spin shadow-[0_0_30px_rgba(245,158,11,0.1)]" />
                                <span className="text-[10px] font-semibold text-amber-500 uppercase tracking-normal animate-pulse">Synchronizing Neural Library...</span>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
                                {branches.map((branch, idx) => (
                                    <Card key={branch._id || idx} className={cn(
                                        "bg-white/5 backdrop-blur-xl border-white/10 p-10 rounded-[40px] transition-all hover:bg-white/[0.08] group relative overflow-hidden border-l-4 border-l-transparent hover:border-l-amber-500",
                                        branch.isDefault && "border-amber-500/20 ring-1 ring-amber-500/10 bg-white/[0.07]"
                                    )}>
                                        {branch.isDefault && (
                                            <div className="absolute top-0 right-0 bg-amber-500 text-black text-[9px] font-semibold px-5 py-1.5 rounded-bl-3xl uppercase tracking-normal">
                                                Master Profile
                                            </div>
                                        )}
                                        
                                        <div className="p-4 bg-amber-500/10 rounded-2xl text-amber-500 w-fit mb-8 group-hover:bg-amber-500/20 transition-all">
                                            <FileText size={28} />
                                        </div>
                                        
                                        <h3 className="text-2xl font-semibold tracking-tight mb-1 uppercase ">{branch.displayName || branch.name}</h3>
                                        <p className="text-white/30 text-[10px] font-semibold uppercase tracking-normal mb-10">{branch.category || "General"} Branch</p>
                                        
                                        <div className="flex items-center gap-4 mb-10">
                                            <div className="flex -space-x-3">
                                                {[1, 2, 3].map(i => (
                                                    <div key={i} className="w-9 h-9 rounded-xl border-4 border-[#0b0b14] bg-white/10 flex items-center justify-center text-[9px] font-semibold group-hover:border-amber-500/20 transition-all">AI</div>
                                                ))}
                                            </div>
                                            <span className="text-[9px] font-semibold text-white/20 uppercase tracking-[0.2em]">AIGC Verified</span>
                                        </div>

                                        <div className="flex gap-3">
                                            <Button 
                                                onClick={() => router.push(`/dashboard/cv/${branch._id}`)}
                                                className="flex-1 bg-white/5 hover:bg-white/10 rounded-2xl h-14 text-[10px] font-semibold uppercase tracking-normal border-white/10"
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
                                            <Button onClick={() => deleteBranch(branch._id)} variant="ghost" className="w-14 h-14 rounded-2xl hover:text-rose-500 bg-white/5 border-white/10">
                                                <Trash2 size={20} />
                                            </Button>
                                        </div>

                                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </Card>
                                ))}
                            </div>
                        )}

                        <div className="mt-24">
                            <div className="flex items-center gap-4 mb-10">
                                <div className="p-2 bg-amber-500/20 rounded-lg">
                                   <BrainCircuit className="text-amber-500" size={24} />
                                </div>
                                <h2 className="text-3xl font-semibold tracking-tight uppercase leading-none">Intelligence Report</h2>
                            </div>
                            <Card className="bg-gradient-to-br from-amber-500/10 to-transparent border-amber-500/20 rounded-[40px] p-12 relative overflow-hidden group">
                                <div className="flex flex-col md:flex-row gap-12 items-center relative z-10">
                                    <div className="relative">
                                        <div className="w-32 h-32 rounded-full border-8 border-amber-500/10 border-t-amber-500 flex items-center justify-center text-3xl font-semibold shadow-[0_0_50px_rgba(245,158,11,0.2)] group-hover:scale-110 transition-transform duration-700">
                                            82%
                                        </div>
                                        <div className="absolute inset-0 rounded-full animate-pulse bg-amber-500/5 -z-10" />
                                    </div>
                                    <div className="space-y-4">
                                        <h3 className="text-3xl font-semibold tracking-tight uppercase ">Strength Analysis: Excellent</h3>
                                        <p className="text-white/40 text-sm font-medium max-w-xl leading-relaxed ">
                                            Your "Master Profile" has exceptional keyword alignment for **Senior Engineering** roles. 
                                            We recommend architecting a **Management branch** to optimize for Lead positions.
                                        </p>
                                    </div>
                                    <Button className="md:ml-auto h-14 px-10 bg-white text-black font-semibold uppercase tracking-normal text-[10px] rounded-2xl hover:bg-amber-500 transition-all">
                                        Full Insight Report
                                    </Button>
                                </div>
                                <div className="absolute top-[-50%] right-[-10%] w-[400px] h-[400px] bg-amber-500/5 blur-[120px] rounded-full pointer-events-none" />
                            </Card>
                        </div>
                    </div>
                </div>
            </main>
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
