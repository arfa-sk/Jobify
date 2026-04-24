"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useUser } from "@/hooks/useUser"
import { useRouter, usePathname } from "next/navigation"
import {
  Search,
  Bell,
  Settings,
  Plus,
  Zap,
  LogOut,
  ChevronRight,
  LayoutDashboard,
  BrainCircuit, 
  ChevronLeft,
  Briefcase,
  History,
  Upload,
  Sparkles,
  Loader2,
  ExternalLink,
  FileText,
  Target
} from "lucide-react"
import Link from "next/link"

export default function Dashboard() {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useUser()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [cvs, setCvs] = useState<any[]>([])
  const [apps, setApps] = useState<any[]>([])
  const [recentJobs, setRecentJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (user.id) {
      fetchDashboardData()
    }
  }, [user])

  const fetchDashboardData = async () => {
    try {
      const [cvRes, appRes, jobRes] = await Promise.all([
        fetch(`/api/cv/branches?userId=${user.id || '000000000000000000000001'}`),
        fetch(`/api/applications?userId=${user.id || '000000000000000000000001'}`),
        fetch('/api/jobs')
      ])
      
      const cvData = await cvRes.json()
      const appData = await appRes.json()
      const jobData = await jobRes.json()
      
      setCvs(cvData.branches || [])
      setApps(appData.applications || [])
      setRecentJobs((jobData.jobs || []).slice(0, 3))
    } catch (err) {
      console.error("Dashboard data sync failed", err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const formData = new FormData()
    formData.append('cvFile', file)
    formData.append('userId', user.id || '000000000000000000000001')
    try {
      await fetch('/api/cv/upload', { method: 'POST', body: formData })
      fetchDashboardData()
    } catch (err) {
      console.error('Upload failed', err)
    } finally {
      setUploading(false)
    }
  }

  const navItems = [
    { icon: LayoutDashboard, label: "Overview", href: "/dashboard" },
    { icon: FileText, label: "CV Management", href: "/dashboard/cv" },
    { icon: Briefcase, label: "Job Discovery", href: "/pipeline" },
    { icon: Target, label: "Track Applications", href: "/dashboard/applications" },
  ]

  if (loading) {
    return (
      <div className="h-screen bg-[#0b0b14] flex items-center justify-center">
        <Loader2 className="text-amber-500 animate-spin h-10 w-10" />
      </div>
    )
  }

  // FIRST TIME VIEW: If no CVs exist
  const isFirstTime = cvs.length === 0

  return (
    <div className="h-screen relative overflow-hidden bg-[#0b0b14] flex font-outfit text-white">
      {/* SIDEBAR */}
      <aside className={cn("h-full bg-[#05050a] border-r border-white/10 transition-all duration-500 flex flex-col relative z-30", isCollapsed ? "w-20" : "w-72")}>
        <div className="p-8 flex-1 flex flex-col overflow-hidden">
          <div className={cn("mb-12 flex items-center gap-3", isCollapsed && "justify-center")}>
            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center border border-white/20 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
              <Zap className="text-black h-6 w-6" />
            </div>
            {!isCollapsed && (
              <div>
                <h1 className="text-xl font-black tracking-tighter leading-none">Jobify Pro</h1>
                <p className="text-amber-500/80 text-[9px] uppercase tracking-widest font-bold mt-1">Intelligence</p>
              </div>
            )}
          </div>

          <nav className="space-y-2 flex-1">
            {navItems.map((item, index) => (
              <Button
                key={index}
                variant="ghost"
                onClick={() => router.push(item.href)}
                className={cn(
                  "w-full h-12 rounded-xl group transition-all",
                  isCollapsed ? "justify-center px-0" : "justify-start px-4",
                  pathname === item.href ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" : "text-white/40 hover:bg-white/5 hover:text-white"
                )}
              >
                <item.icon size={18} className={cn("shrink-0", pathname === item.href ? "text-amber-500" : "group-hover:text-amber-500")} />
                {!isCollapsed && <span className="ml-4 text-xs font-bold uppercase tracking-wider">{item.label}</span>}
              </Button>
            ))}
          </nav>

          <div className="pt-8 border-t border-white/5 mt-auto space-y-2">
            <Button variant="ghost" className={cn("w-full h-10 text-white/30 hover:text-white", isCollapsed ? "justify-center px-0" : "justify-start px-4")}>
              <LogOut size={16} />
              {!isCollapsed && <span className="ml-4 text-[10px] font-black uppercase tracking-widest">Logout</span>}
            </Button>
          </div>
        </div>
      </aside>

      {/* CONTENT */}
      <main className="flex-1 h-full overflow-hidden flex flex-col relative">
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20 pointer-events-none" style={{ backgroundImage: `url('https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Fractal%20Glass%20-%204.jpg-8QPt1A02QgjJIeTqwEYV5thwZXXEGT.jpeg')` }} />
        
        <header className="relative z-20 backdrop-blur-xl bg-black/40 border-b border-white/10 px-12 h-20 flex items-center justify-between">
           <h2 className="text-xl font-black uppercase tracking-tighter italic">Command Center</h2>
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

        <div className="flex-1 overflow-y-auto p-12 relative z-10 scrollbar-hide">
          <div className="max-w-6xl mx-auto">
            {isFirstTime ? (
               <div className="py-24 animate-in fade-in zoom-in-95 duration-700">
                  <Card className="bg-white/5 border-amber-500/20 rounded-[40px] p-16 text-center space-y-8 relative overflow-hidden group">
                     <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 blur-[100px] pointer-events-none" />
                     <div className="w-24 h-24 bg-amber-500/20 rounded-3xl flex items-center justify-center mx-auto border border-amber-500/30 shadow-[0_0_30px_rgba(245,158,11,0.3)] group-hover:scale-110 transition-transform duration-500">
                        <Upload className="text-amber-500 h-10 w-10" />
                     </div>
                     <div className="space-y-4 max-w-2xl mx-auto">
                        <h3 className="text-5xl font-black tracking-tighter uppercase italic leading-none">Initialize Your Profile</h3>
                        <p className="text-white/40 text-sm font-medium leading-relaxed italic uppercase tracking-wider">
                           To activate the Xperia-Autonomous Discovery engine, you must first upload your master profile. We will analyze your skills and bridge you to high-relevance opportunities.
                        </p>
                     </div>
                     <label className={cn("inline-flex items-center gap-3 px-12 h-16 bg-white text-black rounded-2xl cursor-pointer hover:bg-amber-500 transition-all font-black uppercase tracking-widest text-xs shadow-2xl", uploading && "opacity-50 pointer-events-none")}>
                        {uploading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                        {uploading ? "Analyzing Profile..." : "Upload Master CV"}
                        <input type="file" className="hidden" onChange={handleUpload} accept=".pdf,.docx" disabled={uploading} />
                     </label>
                  </Card>
               </div>
            ) : (
               <div className="space-y-12 animate-in fade-in duration-700">
                  {/* Returning View Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                     <Card className="bg-white/5 border-white/10 rounded-[32px] p-8 space-y-4">
                        <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Active Discovery</p>
                        <h4 className="text-4xl font-black text-amber-500 tracking-tighter">159 <span className="text-xs text-white/40 italic">Jobs Syncing</span></h4>
                        <Button onClick={() => router.push('/pipeline')} variant="ghost" className="h-8 px-0 text-[9px] font-black uppercase tracking-widest text-amber-500 hover:bg-transparent hover:text-amber-400">Launch Pipeline →</Button>
                     </Card>
                     <Card className="bg-white/5 border-white/10 rounded-[32px] p-8 space-y-4">
                        <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Application Status</p>
                        <h4 className="text-4xl font-black text-white tracking-tighter">{apps.length} <span className="text-xs text-white/40 italic">Active</span></h4>
                        <Button onClick={() => router.push('/dashboard/applications')} variant="ghost" className="h-8 px-0 text-[9px] font-black uppercase tracking-widest text-white/40 hover:bg-transparent hover:text-white">View Ledger →</Button>
                     </Card>
                     <Card className="bg-white/5 border-white/10 rounded-[32px] p-8 space-y-4">
                        <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">CV Profile Strength</p>
                        <h4 className="text-4xl font-black text-white tracking-tighter">84% <span className="text-xs text-white/40 italic">Verified</span></h4>
                        <Button onClick={() => router.push('/dashboard/cv')} variant="ghost" className="h-8 px-0 text-[9px] font-black uppercase tracking-widest text-white/40 hover:bg-transparent hover:text-white">Optimize Branches →</Button>
                     </Card>
                  </div>

                  {/* Recent Activity */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                     <div className="space-y-6">
                        <div className="flex items-center justify-between">
                           <h3 className="text-2xl font-black uppercase tracking-tighter italic">Live Ledger</h3>
                           <Button onClick={() => router.push('/dashboard/applications')} variant="ghost" className="text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-white h-auto p-0">View All</Button>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-4">
                           {apps.length === 0 ? (
                              <Card className="bg-white/[0.02] border-dashed border-2 border-white/5 rounded-[32px] py-20 text-center">
                                 <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">No recent applications</p>
                              </Card>
                           ) : (
                              apps.slice(0, 3).map((app, i) => (
                                 <Card key={i} className="bg-white/5 border-white/10 rounded-2xl p-6 flex items-center justify-between group hover:bg-white/[0.08] transition-all">
                                    <div className="flex items-center gap-4">
                                       <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center font-black text-xs">
                                          {app.jobTitle?.[0]}
                                       </div>
                                       <div>
                                          <h5 className="font-bold text-white text-sm tracking-tight leading-none mb-1">{app.jobTitle}</h5>
                                          <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">{app.company}</p>
                                       </div>
                                    </div>
                                    <Badge className="bg-white/5 border-white/10 text-[8px] font-black uppercase px-3 py-1">
                                       {app.status}
                                    </Badge>
                                 </Card>
                              ))
                           )}
                        </div>
                     </div>

                     <div className="space-y-6">
                        <div className="flex items-center justify-between">
                           <h3 className="text-2xl font-black uppercase tracking-tighter italic text-amber-500">Recent Discoveries</h3>
                           <Button onClick={() => router.push('/pipeline')} variant="ghost" className="text-[9px] font-black uppercase tracking-widest text-amber-500/60 hover:text-amber-500 h-auto p-0">Open Pipeline</Button>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-4">
                           {recentJobs.length === 0 ? (
                              <Card className="bg-white/[0.02] border-dashed border-2 border-white/5 rounded-[32px] py-20 text-center">
                                 <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Awaiting Scan...</p>
                              </Card>
                           ) : (
                              recentJobs.map((job, i) => (
                                 <Card key={i} className="bg-gradient-to-br from-white/5 to-transparent border-white/10 rounded-2xl p-6 flex items-center justify-between group hover:border-amber-500/30 transition-all">
                                    <div className="flex items-center gap-4">
                                       <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center justify-center font-black text-xs text-amber-500">
                                          {job.company?.[0]}
                                       </div>
                                       <div>
                                          <div className="flex items-center gap-2">
                                             <h5 className="font-bold text-white text-sm tracking-tight leading-none">{job.title}</h5>
                                             <span className="text-[8px] font-black text-amber-500 uppercase">{job.relevanceScore}% Match</span>
                                          </div>
                                          <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mt-1">{job.company} • {job.location}</p>
                                       </div>
                                    </div>
                                    <Button onClick={() => router.push('/pipeline')} size="icon" className="w-8 h-8 rounded-lg bg-white/5 hover:bg-amber-500 hover:text-black transition-all">
                                       <ChevronRight size={14} />
                                    </Button>
                                 </Card>
                              ))
                           )}
                        </div>
                     </div>
                  </div>
               </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
