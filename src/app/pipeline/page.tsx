"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useUser } from "@/hooks/useUser"
import { 
  Briefcase, 
  Search, 
  Filter, 
  Sparkles, 
  ChevronRight, 
  Zap,
  MapPin,
  Clock,
  ExternalLink,
  BrainCircuit,
  Loader2,
  Terminal,
  X,
  Target,
  Globe,
  Building2,
  Calendar,
  Layers,
  LayoutDashboard,
  CheckCircle2,
  Mail,
  FileText,
  AlertCircle
} from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"

export default function JobDiscoveryArtboard() {
  const router = useRouter()
  const { user } = useUser()
  const [jobs, setJobs] = useState<any[]>([])
  const [cvs, setCvs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isScraping, setIsScraping] = useState(false)
  const [showConsole, setShowConsole] = useState(false)
  const [logs, setLogs] = useState<{msg: string, type: 'info' | 'success' | 'warn'}[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  
  // Apply Modal State
  const [selectedJob, setSelectedJob] = useState<any>(null)
  const [isApplying, setIsApplying] = useState(false)
  const [applyStep, setApplyStep] = useState<'options' | 'generating' | 'success'>('options')
  const [applyStatus, setApplyStatus] = useState("")

  useEffect(() => {
    fetchData()
  }, [user])

  const fetchData = async () => {
    try {
      const [jobRes, cvRes] = await Promise.all([
        fetch("/api/jobs"),
        fetch(`/api/cv/branches?userId=${user.id || '000000000000000000000001'}`)
      ])
      const jobData = await jobRes.json()
      const cvData = await cvRes.json()
      setJobs(jobData.jobs || [])
      setCvs(cvData.branches || [])
    } catch (err) {
      console.error("Failed to fetch data", err)
    } finally {
      setLoading(false)
    }
  }

  const runDiscovery = async () => {
    setIsScraping(true)
    setShowConsole(true)
    setLogs([{ msg: "Initializing Xperia-Autonomous Job Engine...", type: "info" }])
    
    try {
      const res = await fetch("/api/pipeline/trigger", { method: "POST" })
      const data = await res.json()
      if (data.success) {
        setLogs(prev => [{ msg: `Analysis complete. ${data.count || 0} unique opportunities synced.`, type: "success" }, ...prev])
        fetchData()
      } else {
        setLogs(prev => [{ msg: "Session complete. Registry is up to date.", type: "warn" }, ...prev])
      }
    } catch (err) {
      setLogs(prev => [{ msg: "Network error during discovery sequence.", type: "warn" }, ...prev])
    } finally {
      setIsScraping(false)
    }
  }

  const handleApply = async (type: 'master' | 'tailor') => {
    setIsApplying(true)
    setApplyStep('generating')
    setApplyStatus(type === 'master' ? "Recording application..." : "Architecting Tailored Suite...")
    
    const primaryCv = cvs.find(c => c.isDefault) || cvs[0]
    
    try {
      if (type === 'master') {
        await fetch('/api/applications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id || '000000000000000000000001',
            jobId: selectedJob._id,
            cvId: primaryCv._id,
            status: 'APPLIED'
          })
        })
      } else {
        const res = await fetch('/api/cv/tailor-suite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id || '000000000000000000000001',
            cvId: primaryCv._id,
            jobId: selectedJob._id,
            jobDescription: selectedJob.description,
            targetRole: selectedJob.title
          })
        })
        const data = await res.json()
        if (!data.success) throw new Error(data.error)
      }
      
      setApplyStep('success')
    } catch (err: any) {
      setApplyStatus(`Error: ${err.message}`)
      setTimeout(() => setIsApplying(false), 3000)
    }
  }

  return (
    <div className="h-screen relative overflow-hidden bg-[#0b0b14] flex font-outfit text-white">
      {/* Cinematic Background */}
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20 pointer-events-none" style={{ backgroundImage: `url('https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Fractal%20Glass%20-%204.jpg-8QPt1A02QgjJIeTqwEYV5thwZXXEGT.jpeg')` }} />
      
      {/* Apply Modal Overlay */}
      {selectedJob && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-2xl flex items-center justify-center p-6 animate-in fade-in duration-300">
           <Card className="bg-white/5 border-white/10 rounded-[40px] p-12 max-w-2xl w-full relative overflow-hidden space-y-10">
              <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 blur-[80px] pointer-events-none" />
              
              <button onClick={() => setSelectedJob(null)} className="absolute top-8 right-8 text-white/20 hover:text-white transition-colors">
                 <X size={24} />
              </button>

              {applyStep === 'options' && (
                <>
                  <div className="space-y-4">
                     <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-500/20 rounded-lg"><Target className="text-amber-500" size={20} /></div>
                        <h3 className="text-3xl font-black tracking-tighter uppercase italic">Application Protocol</h3>
                     </div>
                     <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                        <h4 className="text-xl font-bold text-white mb-1 leading-none">{selectedJob.title}</h4>
                        <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">{selectedJob.company} • {selectedJob.location}</p>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <Card onClick={() => handleApply('master')} className="bg-white/5 border-white/10 p-8 rounded-3xl hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer group text-center space-y-4">
                        <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mx-auto group-hover:bg-white/20 transition-all"><FileText size={24} /></div>
                        <div>
                           <h5 className="font-bold text-white uppercase tracking-tight">Direct Apply</h5>
                           <p className="text-[9px] text-white/40 font-black uppercase tracking-widest mt-1 italic">Use Master Profile</p>
                        </div>
                     </Card>
                     <Card onClick={() => handleApply('tailor')} className="bg-amber-500/10 border-amber-500/20 p-8 rounded-3xl hover:bg-amber-500/20 hover:border-amber-500/40 transition-all cursor-pointer group text-center space-y-4">
                        <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center mx-auto group-hover:bg-amber-500/30 transition-all"><Sparkles className="text-amber-500" size={24} /></div>
                        <div>
                           <h5 className="font-bold text-white uppercase tracking-tight">Xperia Suite</h5>
                           <p className="text-[9px] text-amber-500 font-black uppercase tracking-widest mt-1 italic">Tailored CV + Outreach</p>
                        </div>
                     </Card>
                  </div>
                </>
              )}

              {applyStep === 'generating' && (
                <div className="text-center py-12 space-y-8 animate-in zoom-in-95 duration-500">
                   <div className="relative w-24 h-24 mx-auto">
                      <Sparkles className="text-amber-500 h-24 w-24 animate-pulse" />
                      <Loader2 className="absolute inset-0 text-amber-500 animate-spin opacity-50" size={96} />
                   </div>
                   <div className="space-y-2">
                      <h4 className="text-2xl font-black uppercase tracking-tighter italic">Engine Active</h4>
                      <p className="text-amber-500/60 text-[10px] font-black uppercase tracking-[0.3em]">{applyStatus}</p>
                   </div>
                </div>
              )}

              {applyStep === 'success' && (
                <div className="text-center py-12 space-y-8 animate-in zoom-in-95 duration-500">
                   <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto border border-green-500/30 shadow-[0_0_40px_rgba(34,197,94,0.2)]">
                      <CheckCircle2 className="text-green-500" size={48} />
                   </div>
                   <div className="space-y-2">
                      <h4 className="text-3xl font-black uppercase tracking-tighter italic">Target Locked</h4>
                      <p className="text-green-500/60 text-[10px] font-black uppercase tracking-[0.3em]">Application Synced to Ledger</p>
                   </div>
                   <div className="flex gap-4 pt-6">
                      <Button onClick={() => router.push('/dashboard/applications')} className="flex-1 h-14 bg-white text-black font-black uppercase tracking-widest text-[10px] rounded-2xl">View Ledger</Button>
                      <Button onClick={() => setSelectedJob(null)} variant="ghost" className="flex-1 h-14 bg-white/5 border border-white/10 font-black uppercase tracking-widest text-[10px] rounded-2xl">Continue Discovery</Button>
                   </div>
                </div>
              )}
           </Card>
        </div>
      )}

      {/* SIDEBAR */}
      <aside className={cn("w-72 h-full bg-[#05050a] border-r border-white/10 relative z-30 flex flex-col")}>
          <div className="p-8 flex flex-col h-full">
            <Link href="/dashboard" className="flex items-center gap-3 mb-12 hover:opacity-80 transition-opacity">
                <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center border border-white/20 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                  <Zap className="text-black h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-xl font-black text-white tracking-tighter leading-none">Jobify Pro</h1>
                  <p className="text-amber-500/80 text-[9px] uppercase tracking-widest font-bold mt-1">Recruitment</p>
                </div>
            </Link>

            <nav className="space-y-6 flex-1">
               <div className="space-y-1">
                  <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-4 px-3">Primary Action</p>
                  <Button onClick={runDiscovery} disabled={isScraping} className={cn("w-full h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all gap-3", isScraping ? "bg-white/5 text-white/20" : "bg-amber-500 hover:bg-amber-400 text-black shadow-[0_0_20px_rgba(245,158,11,0.2)]")}>
                    {isScraping ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} fill="currentColor" />}
                    {isScraping ? "Discovering..." : "Scan Market"}
                  </Button>
               </div>

               <div className="space-y-1">
                  <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-4 px-3">Navigation</p>
                  <Link href="/dashboard">
                    <Button variant="ghost" className="w-full justify-start h-12 rounded-xl text-white/40 hover:text-white hover:bg-white/5 gap-3 px-3">
                        <LayoutDashboard size={16} />
                        <span className="text-xs font-bold uppercase tracking-wider">Dashboard</span>
                    </Button>
                  </Link>
                  <Button variant="ghost" className="w-full justify-start h-12 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 gap-3 px-3">
                      <Briefcase size={16} />
                      <span className="text-xs font-bold uppercase tracking-wider">Opportunity Artboard</span>
                  </Button>
                  <Link href="/dashboard/cv">
                    <Button variant="ghost" className="w-full justify-start h-12 rounded-xl text-white/40 hover:text-white hover:bg-white/5 gap-3 px-3">
                        <FileText size={16} />
                        <span className="text-xs font-bold uppercase tracking-wider">CV Management</span>
                    </Button>
                  </Link>
                  <Link href="/dashboard/applications">
                    <Button variant="ghost" className="w-full justify-start h-12 rounded-xl text-white/40 hover:text-white hover:bg-white/5 gap-3 px-3">
                        <Target size={16} />
                        <span className="text-xs font-bold uppercase tracking-wider">Application Tracker</span>
                    </Button>
                  </Link>
               </div>
            </nav>
          </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 h-full overflow-hidden flex flex-col relative z-10">
        <header className="h-20 backdrop-blur-xl bg-black/40 border-b border-white/10 px-12 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <h2 className="text-xl font-black text-white uppercase tracking-tighter italic">Discovery Console</h2>
              <div className="h-6 w-[1px] bg-white/10" />
              <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 h-4 w-4" />
                 <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search opportunities..." className="bg-white/5 border border-white/10 rounded-xl h-10 pl-10 pr-4 text-xs focus:border-amber-500/40 w-64 placeholder:text-white/20 outline-none" />
              </div>
           </div>
           
           <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-xs font-bold text-white uppercase">{user.firstName} {user.lastName}</p>
                <p className="text-[9px] text-amber-500/60 font-black tracking-widest uppercase italic">{user.role || 'Career Pilot'}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center font-bold text-amber-500 text-xs shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                {user.firstName[0]}{user.lastName[0]}
              </div>
           </div>
        </header>

        <div className="flex-1 overflow-y-auto bg-[#0f0f1a] p-12 scrollbar-hide">
           <div className="max-w-6xl mx-auto space-y-12">
              {showConsole && (
                <Card className="bg-black/90 border-amber-500/20 backdrop-blur-3xl rounded-[32px] overflow-hidden animate-in slide-in-from-top-4 duration-500">
                   <div className="px-6 py-3 border-b border-white/10 flex items-center justify-between bg-white/5 text-[10px] font-black uppercase tracking-widest text-white/60">
                      <div className="flex items-center gap-2"><Terminal size={14} className="text-amber-500" /> Autonomous Stream</div>
                      <button onClick={() => setShowConsole(false)}><X size={16} /></button>
                   </div>
                   <div className="p-6 h-32 overflow-y-auto font-mono text-[10px] space-y-2">
                      {logs.map((log, i) => <div key={i} className={cn(log.type === 'success' ? "text-green-400" : log.type === 'warn' ? "text-amber-400" : "text-white/40")}>→ {log.msg}</div>)}
                   </div>
                </Card>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 {loading ? [1,2,3,4].map(i => <div key={i} className="h-[400px] bg-white/5 rounded-[40px] animate-pulse" />) : (
                    jobs.filter(j => j.company.toLowerCase().includes(searchQuery.toLowerCase()) || j.title.toLowerCase().includes(searchQuery.toLowerCase())).map((job, idx) => (
                       <Card key={idx} className="bg-white/5 border-white/10 rounded-[40px] p-10 hover:bg-white/[0.08] transition-all group relative overflow-hidden flex flex-col h-full hover:border-amber-500/40">
                          <div className="flex justify-between items-start mb-8">
                             <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center font-black text-xl text-white group-hover:border-amber-500/30 border border-white/10 transition-all">{job.company?.[0]}</div>
                                <div>
                                   <div className="flex items-center gap-3"><h3 className="text-xl font-bold text-white group-hover:text-amber-500 transition-colors tracking-tight">{job.company}</h3><Badge className="bg-white/10 text-white/40 border-white/10 text-[8px] font-black uppercase">{job.source}</Badge></div>
                                   <div className="flex items-center gap-3 text-[10px] font-black text-white/30 uppercase tracking-widest mt-1"><MapPin size={12} className="text-amber-500" /> {job.location}</div>
                                </div>
                             </div>
                             <div className="bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-xl text-center"><p className="text-[8px] font-black text-amber-500 uppercase tracking-widest mb-0.5">FIT SCORE</p><p className="text-lg font-black text-white">{job.relevanceScore || '??'}%</p></div>
                          </div>
                          
                          <div className="space-y-4 mb-8 flex-1">
                             <h4 className="text-3xl font-black text-white tracking-tighter uppercase italic leading-none">{job.title}</h4>
                             <p className="text-sm text-white/50 leading-relaxed italic line-clamp-3">{job.aiSummary || "AI Enrichment in progress..."}</p>
                          </div>

                          <div className="mt-auto flex gap-3 pt-6 border-t border-white/5">
                             <Button onClick={() => window.open(job.url, '_blank')} className="flex-1 h-12 bg-white/5 hover:bg-white/10 text-white/60 border border-white/10 rounded-2xl font-black uppercase text-[10px] tracking-widest">Details</Button>
                             <Button onClick={() => setSelectedJob(job)} className="flex-[2] h-12 bg-white text-black hover:bg-amber-500 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all shadow-xl">Apply Suite</Button>
                          </div>
                          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity" />
                       </Card>
                    ))
                 )}
              </div>
           </div>
        </div>
      </main>
    </div>
  )
}
