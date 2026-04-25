"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useUser } from "@/hooks/useUser"
import { 
  Target, 
  Search, 
  Filter, 
  MapPin, 
  Clock, 
  ExternalLink, 
  FileText, 
  Mail, 
  CheckCircle2, 
  Zap,
  Loader2,
  ChevronRight,
  MoreVertical,
  Calendar,
  History,
  Building2,
  ArrowLeft,
  LayoutDashboard,
  Briefcase
} from "lucide-react"
import { useRouter, usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export default function ApplicationTracker() {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useUser()
  const [apps, setApps] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user.id) {
        fetchApplications()
    }
  }, [user])

  const fetchApplications = async () => {
    try {
      const res = await fetch(`/api/applications?userId=${user.id || '000000000000000000000001'}`)
      const data = await res.json()
      setApps(data.applications || [])
    } catch (err) {
      console.error("Failed to fetch applications", err)
    } finally {
      setLoading(false)
    }
  }

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

        <header className="relative z-20 backdrop-blur-xl bg-black/40 border-b border-white/10 px-12 h-20 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <h2 className="text-xl font-semibold text-white uppercase tracking-tight ">Application Ledger</h2>
              <div className="h-6 w-[1px] bg-white/10" />
              <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 h-4 w-4" />
                 <input placeholder="Filter registry..." className="bg-white/5 border border-white/10 rounded-xl h-10 pl-10 pr-4 text-xs focus:border-amber-500/40 w-64 placeholder:text-white/20 outline-none" />
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

        <div className="flex-1 overflow-y-auto p-12 relative z-10 scrollbar-hide">
           <div className="max-w-6xl mx-auto space-y-8">
              <div className="flex items-center justify-between mb-4">
                  <div>
                    <h1 className="text-4xl font-semibold tracking-tight uppercase leading-none">Activity Feed</h1>
                    <p className="text-white/40 text-[10px] font-bold uppercase tracking-normal mt-2">Historical log of all outbound transmissions.</p>
                  </div>
                  <div className="flex gap-3">
                     <Button variant="ghost" className="h-10 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold uppercase"><Filter size={14} className="mr-2" /> Filter</Button>
                  </div>
              </div>

              {loading ? (
                [1,2,3].map(i => <div key={i} className="h-32 bg-white/5 border border-white/5 rounded-3xl animate-pulse" />)
              ) : apps.length === 0 ? (
                <Card className="bg-white/[0.02] border-2 border-dashed border-white/5 rounded-[40px] py-48 text-center space-y-6">
                   <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                      <History size={32} className="text-white/10" />
                   </div>
                   <h3 className="text-2xl font-semibold text-white/40 uppercase tracking-tight ">No Active Applications</h3>
                   <Button onClick={() => router.push('/pipeline')} className="h-12 px-8 bg-amber-500 text-black font-bold uppercase rounded-xl">Go to Job Listing</Button>
                </Card>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                   {apps.map((app, idx) => (
                      <Card key={app._id || idx} className="bg-white/5 border-white/10 rounded-[24px] p-6 hover:bg-white/[0.08] transition-all group border-l-4 border-l-amber-500/20 hover:border-l-amber-500">
                         <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex items-center gap-6">
                               <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 group-hover:border-amber-500/30 transition-all">
                                  <Building2 size={24} className="text-slate-400 group-hover:text-amber-500" />
                               </div>
                               <div>
                                  <h3 className="text-xl font-bold text-white uppercase tracking-tight">{app.company}</h3>
                                  <div className="flex items-center gap-3 text-[10px] font-bold text-white/30 uppercase tracking-normal mt-1">
                                     <Briefcase size={12} className="text-amber-500" /> {app.jobTitle}
                                  </div>
                               </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-8">
                               <div className="space-y-1">
                                  <p className="text-[8px] font-bold text-white/20 uppercase tracking-normal">Status</p>
                                  <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[9px] font-bold uppercase">Applied</Badge>
                               </div>
                               <div className="space-y-1">
                                  <p className="text-[8px] font-bold text-white/20 uppercase tracking-normal">Date</p>
                                  <p className="text-xs font-bold text-white/60">{new Date(app.createdAt).toLocaleDateString()}</p>
                               </div>
                               <div className="flex gap-2">
                                  <Button variant="ghost" className="h-12 w-12 rounded-xl bg-white/5 border border-white/10 hover:text-amber-500"><Mail size={18} /></Button>
                                  <Button variant="ghost" className="h-12 w-12 rounded-xl bg-white/5 border border-white/10 hover:text-amber-500"><ExternalLink size={18} /></Button>
                               </div>
                            </div>
                         </div>
                      </Card>
                   ))}
                </div>
              )}
           </div>
        </div>
      </main>
    </div>
  )
}
