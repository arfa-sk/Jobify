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

import ApplyModal from "@/components/jobs/ApplyModal"

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
  const [selectedJobForApply, setSelectedJobForApply] = useState<any>(null)
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false)

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

  const handleApplyClick = (job: any) => {
    setSelectedJobForApply({
        id: job._id,
        title: job.title,
        company: job.company,
        description: job.description || job.aiSummary || job.title,
        email: job.email || 'careers@' + job.company.toLowerCase().replace(/\s+/g, '') + '.com' // Fallback for demo
    })
    setIsApplyModalOpen(true)
  }

  return (
    <div className="h-screen relative overflow-hidden bg-[#0b0b14] flex font-outfit text-white">
      {/* Cinematic Background */}
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20 pointer-events-none" style={{ backgroundImage: `url('https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Fractal%20Glass%20-%204.jpg-8QPt1A02QgjJIeTqwEYV5thwZXXEGT.jpeg')` }} />
      
      {/* Apply Modal */}
      {selectedJobForApply && (
        <ApplyModal 
            isOpen={isApplyModalOpen}
            onClose={() => setIsApplyModalOpen(false)}
            job={selectedJobForApply}
            cvs={cvs}
            userId={user.id || '000000000000000000000001'}
            onRefreshCvs={fetchData}
        />
      )}

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
                  item.href === "/pipeline" ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" : "text-white/40 hover:bg-white/5 hover:text-white"
                )}
              >
                <item.icon size={18} className={cn("shrink-0", item.href === "/pipeline" ? "text-amber-500" : "group-hover:text-amber-500")} />
                <span className="ml-4 text-xs font-bold uppercase tracking-wider">{item.label}</span>
              </Button>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 h-full overflow-hidden flex flex-col relative z-10">
        <header className="h-20 backdrop-blur-xl bg-black/40 border-b border-white/10 px-12 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <h2 className="text-xl font-semibold text-white uppercase tracking-tight ">Discovery Console</h2>
              <div className="h-6 w-[1px] bg-white/10" />
              <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 h-4 w-4" />
                 <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search opportunities..." className="bg-white/5 border border-white/10 rounded-xl h-10 pl-10 pr-4 text-xs focus:border-amber-500/40 w-64 placeholder:text-white/20 outline-none" />
              </div>
           </div>
           
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

        <div className="flex-1 overflow-y-auto bg-[#0f0f1a] p-12 scrollbar-hide">
           <div className="max-w-6xl mx-auto space-y-12">
              {showConsole && (
                <Card className="bg-black/90 border-amber-500/20 backdrop-blur-3xl rounded-[32px] overflow-hidden animate-in slide-in-from-top-4 duration-500">
                   <div className="px-6 py-3 border-b border-white/10 flex items-center justify-between bg-white/5 text-[10px] font-semibold uppercase tracking-normal text-white/60">
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
                                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center font-semibold text-xl text-white group-hover:border-amber-500/30 border border-white/10 transition-all">{job.company?.[0]}</div>
                                <div>
                                   <div className="flex items-center gap-3"><h3 className="text-xl font-bold text-white group-hover:text-amber-500 transition-colors tracking-tight">{job.company}</h3><Badge className="bg-white/10 text-white/40 border-white/10 text-[8px] font-semibold uppercase">{job.source}</Badge></div>
                                   <div className="flex items-center gap-3 text-[10px] font-semibold text-white/30 uppercase tracking-normal mt-1"><MapPin size={12} className="text-amber-500" /> {job.location}</div>
                                </div>
                             </div>
                             <div className="bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-xl text-center"><p className="text-[8px] font-semibold text-amber-500 uppercase tracking-normal mb-0.5">FIT SCORE</p><p className="text-lg font-semibold text-white">{job.relevanceScore || '??'}%</p></div>
                          </div>
                          
                          <div className="space-y-4 mb-8 flex-1">
                             <h4 className="text-3xl font-semibold text-white tracking-tight uppercase  leading-none">{job.title}</h4>
                             <p className="text-sm text-white/50 leading-relaxed  line-clamp-3">{job.aiSummary || "AI Enrichment in progress..."}</p>
                          </div>

                          <div className="mt-auto flex gap-3 pt-6 border-t border-white/5">
                             <Button onClick={() => window.open(job.url, '_blank')} className="flex-1 h-12 bg-white/5 hover:bg-white/10 text-white/60 border border-white/10 rounded-2xl font-semibold uppercase text-[10px] tracking-normal">Details</Button>
                             <Button onClick={() => handleApplyClick(job)} className="flex-[2] h-12 bg-white text-black hover:bg-amber-500 rounded-2xl font-semibold uppercase text-[10px] tracking-normal transition-all shadow-xl flex items-center justify-center gap-2">
                                <Sparkles size={16} />
                                Apply
                             </Button>
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
