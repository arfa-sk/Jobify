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
  Building2
} from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

export default function ApplicationTracker() {
  const router = useRouter()
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
      {/* Background Ambient */}
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20 pointer-events-none" style={{ backgroundImage: `url('https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Fractal%20Glass%20-%204.jpg-8QPt1A02QgjJIeTqwEYV5thwZXXEGT.jpeg')` }} />
      
      {/* Main Artboard Area */}
      <main className="flex-1 overflow-hidden flex flex-col relative z-10">
        <header className="h-24 backdrop-blur-xl bg-black/40 border-b border-white/10 px-12 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-500/20 rounded-2xl border border-amber-500/30">
                 <Target size={24} className="text-amber-500" />
              </div>
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tighter italic leading-none">Application Ledger</h2>
                <p className="text-amber-500/60 text-[9px] font-black uppercase tracking-widest mt-1">Registry of Targeted Opportunities</p>
              </div>
           </div>

           <div className="flex items-center gap-4">
              <div className="relative">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 h-4 w-4" />
                 <input placeholder="Filter by company..." className="bg-white/5 border border-white/10 rounded-xl h-12 pl-12 pr-6 text-xs w-64 focus:border-amber-500/40 outline-none" />
              </div>
              <Button variant="ghost" className="h-12 w-12 rounded-xl bg-white/5 border border-white/10"><Filter size={18} /></Button>
           </div>
        </header>

        <div className="flex-1 overflow-y-auto p-12 scrollbar-hide">
           <div className="max-w-6xl mx-auto space-y-8">
              {loading ? (
                [1,2,3].map(i => <div key={i} className="h-32 bg-white/5 border border-white/5 rounded-3xl animate-pulse" />)
              ) : apps.length === 0 ? (
                <Card className="bg-white/[0.02] border-2 border-dashed border-white/5 rounded-[40px] py-48 text-center space-y-6">
                   <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                      <History size={32} className="text-white/10" />
                   </div>
                   <h3 className="text-2xl font-black text-white/40 uppercase tracking-tighter italic">No Active Applications</h3>
                   <Button onClick={() => router.push('/pipeline')} className="btn-premium">Go to Discovery Artboard</Button>
                </Card>
              ) : (
                <div className="space-y-6">
                   {apps.map((app, idx) => (
                     <Card key={idx} className="bg-white/5 border-white/10 rounded-[32px] p-8 hover:bg-white/[0.08] transition-all group relative overflow-hidden flex flex-col md:flex-row items-center gap-10">
                        <div className="flex-1 flex items-center gap-8">
                           <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center font-black text-2xl text-white group-hover:border-amber-500/30 border border-white/10 transition-all shrink-0">
                              {app.company[0]}
                           </div>
                           <div className="space-y-2">
                              <div className="flex items-center gap-4">
                                 <h4 className="text-2xl font-black tracking-tight leading-none group-hover:text-amber-500 transition-colors uppercase italic">{app.jobTitle}</h4>
                                 <Badge className={cn("bg-amber-500/10 text-amber-500 border-amber-500/20 text-[9px] font-black uppercase tracking-widest px-4 py-1", app.status !== 'APPLIED' && "text-white/40 bg-white/5 border-white/10")}>
                                    {app.status}
                                 </Badge>
                              </div>
                              <div className="flex items-center gap-6 text-[10px] font-black text-white/30 uppercase tracking-widest">
                                 <span className="flex items-center gap-2"><Building2 size={12} className="text-amber-500" /> {app.company}</span>
                                 <span className="flex items-center gap-2"><MapPin size={12} className="text-amber-500" /> {app.location}</span>
                                 <span className="flex items-center gap-2"><Calendar size={12} className="text-amber-500" /> Applied {new Date(app.appliedAt).toLocaleDateString()}</span>
                              </div>
                           </div>
                        </div>

                        <div className="flex items-center gap-4">
                           <Button onClick={() => router.push(`/dashboard/cv/${app.cvId}`)} className="h-12 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-6 text-[10px] font-black uppercase tracking-widest">
                              <FileText size={16} className="mr-3 text-amber-500" /> Branch
                           </Button>
                           {app.coverLetter && (
                              <Button className="h-12 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-6 text-[10px] font-black uppercase tracking-widest">
                                 <Mail size={16} className="mr-3 text-amber-500" /> Outreach
                              </Button>
                           )}
                           <div className="w-[1px] h-10 bg-white/10" />
                           <Button variant="ghost" className="h-12 w-12 rounded-xl text-white/20 hover:text-white"><MoreVertical size={18} /></Button>
                        </div>

                        {/* Hover Gradient */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity" />
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

