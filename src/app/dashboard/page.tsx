"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { mockJobs } from "@/lib/mockData"
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
  FileCode,
  ChevronLeft,
  Briefcase,
  MessageSquare,
  Database,
  Calendar,
  Target,
} from "lucide-react"
import Link from "next/link"

export default function Dashboard() {
  const router = useRouter()
  const pathname = usePathname()
  const [jobs] = useState(mockJobs)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { user } = useUser()

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
    { icon: Briefcase, label: "Pipeline", href: "/pipeline" },
    { icon: BrainCircuit, label: "AI Scraper", href: "/scraper" },
    { icon: Calendar, label: "Interviews", href: "/interviews" },
    { icon: Target, label: "Goals", href: "/goals" },
  ]

  const workspaceItems = [
    { icon: FileCode, label: "CV Branches", href: "/dashboard/cv" },
    { icon: MessageSquare, label: "Mock Chat", href: "/chat" },
    { icon: Database, label: "Data", href: "/data" },
  ]

  return (
    <div className="h-screen relative overflow-hidden bg-[#0b0b14] flex font-outfit">
      {/* SOLID BLACK COLLAPSABLE SIDEBAR */}
      <aside 
        className={cn(
          "h-full bg-[#05050a] border-r border-white/10 transition-all duration-500 ease-in-out flex flex-col relative z-30",
          isCollapsed ? "w-20" : "w-72"
        )}
      >
        {/* Toggle Button */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-10 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center text-black border border-white/20 hover:bg-amber-400 transition-colors z-40"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        <div className="p-6 flex-1 flex flex-col overflow-hidden">
          {/* Logo Section */}
          <div className={cn("mb-10 transition-all duration-500", isCollapsed ? "items-center" : "px-2")}>
            <div className={cn("flex items-center gap-3", isCollapsed && "justify-center")}>
              <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center border border-white/20 shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                <Zap className="text-black h-6 w-6" />
              </div>
              {!isCollapsed && (
                <div>
                  <h1 className="text-xl font-black text-white tracking-tighter leading-none">Jobify Pro</h1>
                  <p className="text-amber-500/80 text-[9px] uppercase tracking-widest font-bold mt-1">Intelligence</p>
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <div className="space-y-8 flex-1 overflow-y-auto scrollbar-hide">
            <div>
              {!isCollapsed && <h4 className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-4 px-2">Discovery</h4>}
              <nav className="space-y-1">
                {navItems.map((item, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    onClick={() => router.push(item.href)}
                    className={cn(
                      "w-full transition-all duration-300 h-11 rounded-xl group",
                      isCollapsed ? "justify-center px-0" : "justify-start px-3",
                      pathname === item.href ? "bg-white/10 text-white border border-white/20 shadow-lg" : "text-white/60 hover:bg-white/5 hover:text-white border border-transparent"
                    )}
                  >
                    <item.icon className={cn("h-4 w-4 shrink-0 transition-colors", pathname === item.href ? "text-amber-500" : "group-hover:text-amber-500")} />
                    {!isCollapsed && <span className="ml-3 text-sm font-semibold">{item.label}</span>}
                  </Button>
                ))}
              </nav>
            </div>

            <div>
              {!isCollapsed && <h4 className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-4 px-2">Workspace</h4>}
              <nav className="space-y-1">
                {workspaceItems.map((item, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    onClick={() => router.push(item.href)}
                    className={cn(
                      "w-full transition-all duration-300 h-11 rounded-xl group",
                      isCollapsed ? "justify-center px-0" : "justify-start px-3",
                      pathname === item.href ? "bg-white/10 text-white border border-white/20 shadow-lg" : "text-white/60 hover:bg-white/5 hover:text-white border border-transparent"
                    )}
                  >
                    <item.icon className={cn("h-4 w-4 shrink-0 transition-colors", pathname === item.href ? "text-amber-500" : "group-hover:text-amber-500")} />
                    {!isCollapsed && <span className="ml-3 text-sm font-semibold">{item.label}</span>}
                  </Button>
                ))}
              </nav>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="pt-6 border-t border-white/10 mt-auto">
            <nav className="space-y-1">
              <Link href="/profile">
                <Button variant="ghost" className={cn("w-full h-10 text-white/50 hover:text-white px-3", isCollapsed ? "justify-center px-0" : "justify-start")}>
                  <Settings className="h-4 w-4 shrink-0" />
                  {!isCollapsed && <span className="ml-3 text-xs font-bold">Profile Settings</span>}
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="ghost" className={cn("w-full h-10 text-white/50 hover:text-red-400 px-3", isCollapsed ? "justify-center px-0" : "justify-start")}>
                  <LogOut className="h-4 w-4 shrink-0" />
                  {!isCollapsed && <span className="ml-3 text-xs font-bold">Logout</span>}
                </Button>
              </Link>
            </nav>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 h-full overflow-hidden flex flex-col relative">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-50 pointer-events-none"
          style={{ backgroundImage: `url('https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Fractal%20Glass%20-%204.jpg-8QPt1A02QgjJIeTqwEYV5thwZXXEGT.jpeg')` }}
        />
        
        {/* Sticky Header */}
        <header className="relative z-20 backdrop-blur-md bg-black/20 border-b border-white/10 px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-white tracking-tight uppercase">Overview</h2>
            <div className="h-4 w-[1px] bg-white/20 mx-2" />
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 h-4 w-4" />
              <Input
                placeholder="Search resources..."
                className="pl-9 w-64 bg-white/10 border border-white/20 rounded-xl text-xs text-white placeholder:text-white/40 focus:border-white/40"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             <Button size="icon" variant="ghost" className="rounded-full text-white/60">
                <Bell size={20} />
             </Button>
             <Link href="/profile" className="flex items-center gap-3 pl-2 border-l border-white/10 group cursor-pointer hover:bg-white/5 p-1 rounded-xl transition-all">
                <div className="text-right">
                  <p className="text-xs font-bold text-white group-hover:text-amber-500 transition-colors">{user.firstName} {user.lastName}</p>
                  <p className="text-[10px] text-amber-500/60 uppercase font-black tracking-widest">{user.role}</p>
                </div>
                <div className="w-9 h-9 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center font-bold text-amber-500 text-xs shadow-[0_0_15px_rgba(245,158,11,0.2)] group-hover:scale-105 transition-all">
                  {user.firstName[0]}{user.lastName[0]}
                </div>
             </Link>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-8 relative z-10 scrollbar-hide">
          <div className="max-w-6xl mx-auto space-y-8">
            
            {/* APPLE-STYLE MINIMALIST STATS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { title: "APPLICATIONS", value: jobs.length, delta: "+3", color: "text-amber-500" },
                { title: "INTERVIEWS", value: "08", delta: "2 TODAY", color: "text-white" },
                { title: "RELEVANCE", value: "84%", delta: "TOP 5%", color: "text-white" },
                { title: "OFFERS", value: "02", delta: "PENDING", color: "text-amber-500" },
              ].map((stat, index) => (
                <div key={index} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-all cursor-default flex flex-col justify-between h-28 group">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">{stat.title}</span>
                    <span className={cn("text-[9px] font-black uppercase tracking-widest", stat.delta.includes('+') ? "text-amber-500" : "text-white/20")}>{stat.delta}</span>
                  </div>
                  <div>
                    <h3 className={cn("text-3xl font-black tracking-tighter", stat.color)}>{stat.value}</h3>
                  </div>
                  <div className="h-1 w-full bg-white/5 rounded-full mt-2 overflow-hidden">
                    <div className={cn("h-full transition-all duration-1000", index % 2 === 0 ? "bg-amber-500 w-2/3" : "bg-white/20 w-1/3")} />
                  </div>
                </div>
              ))}
            </div>

            {/* Main Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8 space-y-8">
                <Card className="bg-white/5 backdrop-blur-xl border border-white/15 rounded-[32px] p-8 shadow-2xl">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-2xl font-bold text-white tracking-tight uppercase">Active Applications</h3>
                      <p className="text-white/40 text-xs mt-1 font-bold uppercase tracking-widest">Track your progress across companies.</p>
                    </div>
                    <Button className="btn-premium flex items-center gap-2">
                      <Plus className="h-4 w-4" /> 
                      <span className="text-[10px] font-black uppercase tracking-widest">Add Application</span>
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {jobs.map((job, index) => (
                      <div key={index} className="flex items-center justify-between p-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all group cursor-pointer">
                        <div className="flex items-center gap-5">
                          <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center font-bold text-white text-xs group-hover:border-amber-500/40 transition-colors">
                            {job.company.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="font-bold text-white text-sm group-hover:text-amber-500 transition-colors tracking-tight">{job.title}</h4>
                            <p className="text-[10px] text-white/50 font-bold uppercase tracking-wider mt-0.5">{job.company} • {job.location}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-black text-amber-500 tracking-tighter">{job.relevanceScore}% FIT</p>
                          <Badge className="mt-1 bg-white/10 border border-white/20 text-[9px] font-black text-white/60 group-hover:text-white transition-colors uppercase">
                            {job.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              <div className="lg:col-span-4 space-y-8">
                <Card className="bg-white/5 backdrop-blur-xl border border-white/15 rounded-[32px] p-8 shadow-2xl">
                  <h3 className="text-xl font-black text-white mb-8 tracking-tighter uppercase">Performance</h3>
                  
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Weekly Target</p>
                          <p className="text-xl font-bold text-white mt-1">10 / 15 Jobs</p>
                        </div>
                        <span className="text-[10px] font-black text-amber-500">68%</span>
                      </div>
                      <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden border border-white/10">
                        <div className="h-full bg-amber-500 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.5)]" style={{ width: '68%' }} />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Skill Alignment</p>
                          <p className="text-xl font-bold text-white mt-1 tracking-tight">Ready for Roles</p>
                        </div>
                        <span className="text-[10px] font-black text-amber-500">84%</span>
                      </div>
                      <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden border border-white/10">
                        <div className="h-full bg-amber-500 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.5)]" style={{ width: '84%' }} />
                      </div>
                    </div>

                    <Card className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 text-center group cursor-pointer hover:bg-amber-500/20 transition-all">
                       <BrainCircuit className="mx-auto text-amber-500 mb-3" size={24} />
                       <h4 className="text-sm font-black text-white mb-1 uppercase tracking-widest">Xperia AI</h4>
                       <p className="text-[10px] text-white/40 leading-relaxed font-bold uppercase tracking-widest">Get real-time insights on your relevance scoring.</p>
                    </Card>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
