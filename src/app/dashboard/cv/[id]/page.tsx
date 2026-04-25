"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useUser } from "@/hooks/useUser"
import { 
  ChevronLeft, 
  Save, 
  Sparkles, 
  FileText, 
  BrainCircuit,
  MessageSquare,
  History,
  LayoutDashboard,
  Briefcase,
  Target,
  AlertCircle,
  CheckCircle2,
  Zap,
  Trash2,
  Plus,
  Mail,
  Copy,
  Check,
  Clock,
  MapPin,
  Phone,
  Globe,
  Award,
  BookOpen,
  Languages,
  Milestone,
  Trophy,
  ExternalLink
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export default function CVBranchEditor() {
  const params = useParams()
  const router = useRouter()
  const { user } = useUser()
  const [cv, setCv] = useState<any>(null)
  const [analysis, setAnalysis] = useState<any>(null)
  const [branches, setBranches] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isTailoring, setIsTailoring] = useState(false)
  const [activeTab, setActiveTab] = useState("editor")
  const [jobDescription, setJobDescription] = useState("")
  const [targetRole, setTargetRole] = useState("")
  const [tailoringResult, setTailoringResult] = useState<any>(null)
  const [generatedComm, setGeneratedComm] = useState<any>(null)
  const [isGeneratingComm, setIsGeneratingComm] = useState(false)
  const [commType, setCommType] = useState<"cover-letter" | "networking-email">("cover-letter")
  const [copied, setCopied] = useState<string | null>(null)
  const [editingSection, setEditingSection] = useState<string | null>(null)

  const fetchAnalysis = async (cvId: string) => {
    if (isAnalyzing) return
    setIsAnalyzing(true)
    try {
      const res = await fetch("/api/cv/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, cvId, type: "full" })
      })
      const data = await res.json()
      if (data.analysis) setAnalysis(data.analysis)
    } catch (error) {
      console.error("Analysis failed", error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const fetchBranches = async () => {
    try {
      const res = await fetch(`/api/cv/branches?userId=${user.id}`)
      const data = await res.json()
      if (data.branches) setBranches(data.branches)
    } catch (error) {
      console.error("Failed to fetch branches", error)
    }
  }

  useEffect(() => {
    const fetchCV = async () => {
      if (!user.id) {
        setIsLoading(false)
        return
      }
      try {
        const res = await fetch(`/api/cv/branches/${params.id}?userId=${user.id}`)
        const data = await res.json()
        if (data.cv) {
          setCv(data.cv)
          fetchAnalysis(params.id as string)
          fetchBranches()
        }
      } catch (error) {
        console.error("Failed to fetch CV", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchCV()
  }, [params.id, user.id])

  const handleRewrite = async (sectionType: string, currentContent: string, feedback: string, idx?: number) => {
    try {
      const res = await fetch("/api/cv/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionType, currentContent, feedback })
      })
      const data = await res.json()
      if (data.improvedContent) {
        if (sectionType === "summary") {
          setCv({ ...cv, cvJson: { ...cv.cvJson, basics: { ...cv.cvJson.basics, summary: data.improvedContent } } })
        } else if (sectionType === "work" && idx !== undefined) {
          const newWork = [...cv.cvJson.work]
          newWork[idx].summary = data.improvedContent
          setCv({ ...cv, cvJson: { ...cv.cvJson, work: newWork } })
        }
      }
    } catch (error) {
      console.error("Rewrite failed", error)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await fetch(`/api/cv/branches/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, cvJson: cv.cvJson, displayName: cv.displayName })
      })
      fetchAnalysis(params.id as string)
    } catch (error) {
      console.error("Failed to save CV", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleTailor = async () => {
    if (!jobDescription) return
    setIsTailoring(true)
    try {
      const res = await fetch("/api/cv/tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, cvId: cv._id, jobDescription, targetRole })
      })
      const data = await res.json()
      if (data.success) {
        setTailoringResult(data)
        fetchBranches()
      }
    } catch (error) {
      console.error("Tailoring failed", error)
    } finally {
      setIsTailoring(false)
    }
  }

  const handleGenerateComm = async () => {
    if (!jobDescription) return
    setIsGeneratingComm(true)
    setGeneratedComm(null)
    try {
      const res = await fetch("/api/cv/generate-comm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: commType, cvJson: cv.cvJson, jobDescription, targetRole })
      })
      const data = await res.json()
      if (data.content) setGeneratedComm(data.content)
    } catch (error) {
      console.error("Comm generation failed", error)
    } finally {
      setIsGeneratingComm(false)
    }
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  if (isLoading || !cv || !cv.cvJson) {
    return (
      <div className="h-screen bg-[#0b0b14] flex items-center justify-center">
        <Zap className="text-amber-500 animate-pulse h-12 w-12" />
      </div>
    )
  }

  const SectionHeading = ({ children, icon: Icon, onAdd }: { children: React.ReactNode, icon?: any, onAdd?: () => void }) => (
    <div className="flex items-center justify-between border-b-2 border-gray-100 pb-2 mb-6 group/heading">
      <div className="flex items-center gap-3">
        {Icon && <Icon size={18} className="text-amber-500" />}
        <h2 className="text-xl font-bold uppercase tracking-normal text-gray-800">{children}</h2>
      </div>
      {onAdd && (
        <Button onClick={onAdd} variant="ghost" size="sm" className="opacity-0 group-hover/heading:opacity-100 text-amber-500 hover:bg-amber-500/10 gap-2 h-7 transition-all">
          <Plus size={12} /> <span className="text-[9px] font-semibold uppercase">Add Item</span>
        </Button>
      )}
    </div>
  )

  return (
    <div className="h-screen relative overflow-hidden bg-[#0b0b14] flex font-outfit text-white">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20 pointer-events-none"
        style={{ backgroundImage: `url('https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Fractal%20Glass%20-%204.jpg-8QPt1A02QgjJIeTqwEYV5thwZXXEGT.jpeg')` }}
      />

      <div className="flex-1 flex flex-col relative z-10">
        <header className="backdrop-blur-xl bg-black/40 border-b border-white/10 px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/dashboard/cv">
              <Button variant="ghost" size="icon" className="rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-all">
                <ChevronLeft size={20} />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-white tracking-tight">{cv.displayName}</h2>
                <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[10px] uppercase font-semibold">{cv.category || "General"}</Badge>
              </div>
              <p className="text-[10px] text-white/40 font-bold uppercase tracking-normal mt-0.5">Last edited {new Date(cv.updatedAt).toLocaleDateString()}</p>
            </div>
          </div>


        </header>

        <div className="flex-1 flex overflow-hidden">
          <aside className={cn("h-full bg-[#05050a] border-r border-white/10 transition-all duration-500 flex flex-col relative z-30 w-72")}>
            <div className="p-8 flex-1 flex flex-col overflow-hidden">
              <div className="mb-12 flex items-center gap-3 cursor-pointer" onClick={() => router.push('/dashboard')}>
                <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center border border-white/20 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
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
                  { icon: Briefcase, label: "Job Listing", href: "/dashboard/jobs" },
                  { icon: Target, label: "Track Applications", href: "/dashboard/applications" },
                ].map((item, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    onClick={() => router.push(item.href)}
                    className={cn(
                      "w-full h-12 rounded-xl group transition-all justify-start px-4",
                      item.label === "CV Management" ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" : "text-white/40 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <item.icon size={18} className={cn("shrink-0", item.label === "CV Management" ? "text-amber-500" : "group-hover:text-amber-500")} />
                    <span className="ml-4 text-xs font-bold uppercase tracking-wider">{item.label}</span>
                  </Button>
                ))}
              </nav>

              <div className="pt-8 border-t border-white/5 mt-auto space-y-2">
                 <div className="flex flex-col items-center justify-center">
                   <div className="relative h-14 w-14 flex items-center justify-center group/score mb-3">
                     <svg className="h-full w-full transform -rotate-90">
                       <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-white/5" />
                       <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray={150.8} strokeDashoffset={150.8 * (1 - (analysis?.overallScore || 0) / 100)} className="text-amber-500 transition-all duration-1000 shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                     </svg>
                     <span className="absolute text-xs font-semibold text-white group-hover:scale-110 transition-transform">{analysis?.overallScore || 0}%</span>
                   </div>
                   <span className="text-[9px] font-semibold text-amber-500/40 uppercase tracking-normal text-center leading-tight">ATS Score</span>
                 </div>
              </div>
            </div>
          </aside>

          <main className="flex-1 overflow-y-auto bg-[#0f0f1a] p-12 scrollbar-hide">
            <div className="max-w-5xl mx-auto pb-48">
              {activeTab === "editor" && (
                <div className="flex flex-col items-center animate-in fade-in zoom-in-95 duration-500">
                  <Card className="w-full bg-white text-[#1a1a1a] shadow-2xl rounded-sm p-16 font-sans min-h-[1400px] border-none relative group/artboard">
                    <header className="text-center mb-16">
                       <h1 className="text-5xl font-semibold tracking-tight mb-2 hover:text-amber-600 transition-colors cursor-pointer" onClick={() => setEditingSection("basics.name")}>
                         {editingSection === "basics.name" ? <Input autoFocus value={cv.cvJson.basics.name} onChange={(e) => setCv({ ...cv, cvJson: { ...cv.cvJson, basics: { ...cv.cvJson.basics, name: e.target.value } } })} onBlur={() => setEditingSection(null)} className="text-5xl font-semibold text-center" /> : cv.cvJson.basics.name}
                       </h1>
                       <p className="text-xl  text-gray-500 mb-6" onClick={() => setEditingSection("basics.label")}>
                         {editingSection === "basics.label" ? <Input autoFocus value={cv.cvJson.basics.label} onChange={(e) => setCv({ ...cv, cvJson: { ...cv.cvJson, basics: { ...cv.cvJson.basics, label: e.target.value } } })} onBlur={() => setEditingSection(null)} className="text-xl text-center " /> : cv.cvJson.basics.label || "Professional Title"}
                       </p>
                       <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-xs font-sans font-bold text-gray-400 uppercase tracking-normal">
                          <span className="flex items-center gap-2"><MapPin size={12} /> {cv.cvJson.basics.location?.city || "Location"}</span>
                          <span className="flex items-center gap-2"><Phone size={12} /> {cv.cvJson.basics.phone || "Phone"}</span>
                          <span className="flex items-center gap-2"><Mail size={12} /> {cv.cvJson.basics.email || "Email"}</span>
                          {cv.cvJson.basics.url && <span className="flex items-center gap-2"><Globe size={12} /> {cv.cvJson.basics.url}</span>}
                       </div>
                    </header>

                    <div className="space-y-16">
                       <section className="relative group/section">
                          <SectionHeading icon={BrainCircuit}>Professional Narrative</SectionHeading>
                          <div className="relative font-sans text-lg leading-relaxed text-gray-700 p-2 hover:bg-amber-500/5 rounded transition-colors cursor-pointer" onClick={() => setEditingSection("summary")}>
                             {editingSection === "summary" ? <textarea autoFocus value={cv.cvJson.basics.summary} onChange={(e) => setCv({ ...cv, cvJson: { ...cv.cvJson, basics: { ...cv.cvJson.basics, summary: e.target.value } } })} onBlur={() => setEditingSection(null)} className="w-full min-h-[150px] p-4 bg-transparent border-none focus:outline-none" /> : cv.cvJson.basics.summary || "Add a compelling summary..."}
                             <Button onClick={(e) => { e.stopPropagation(); handleRewrite("summary", cv.cvJson.basics.summary, "Refine for executive impact"); }} variant="ghost" size="sm" className="absolute top-2 right-2 opacity-0 group-hover/section:opacity-100 text-amber-500"><Sparkles size={14} /></Button>
                          </div>
                       </section>

                       <section className="relative group/section">
                          <SectionHeading icon={Milestone} onAdd={() => setCv({ ...cv, cvJson: { ...cv.cvJson, work: [{ name: "Company", position: "Role", summary: "", startDate: "2024", endDate: "Present" }, ...(cv.cvJson.work || [])] } })}>Work Experience</SectionHeading>
                          <div className="space-y-10">
                             {(cv.cvJson.work || []).map((job: any, idx: number) => (
                               <div key={idx} className="relative group/item font-sans">
                                  <div className="flex justify-between items-start mb-2">
                                     <div>
                                        <h3 className="text-xl font-bold text-gray-900">{job.position}</h3>
                                        <p className="text-amber-600 font-bold uppercase tracking-wider text-sm">{job.name}</p>
                                     </div>
                                     <span className="text-xs font-semibold text-gray-400 uppercase tracking-normal">{job.startDate} — {job.endDate || "Present"}</span>
                                  </div>
                                  <div className="text-gray-600 leading-relaxed text-sm hover:bg-amber-500/5 p-2 rounded cursor-pointer" onClick={() => setEditingSection(`work.${idx}`)}>
                                     {editingSection === `work.${idx}` ? <textarea autoFocus value={job.summary} onChange={(e) => { const nw = [...cv.cvJson.work]; nw[idx].summary = e.target.value; setCv({ ...cv, cvJson: { ...cv.cvJson, work: nw } }); }} onBlur={() => setEditingSection(null)} className="w-full min-h-[100px] p-2 bg-transparent border-none focus:outline-none" /> : <pre className="whitespace-pre-wrap font-sans">{job.summary || "Click to add details..."}</pre>}
                                  </div>
                               </div>
                             ))}
                          </div>
                       </section>

                       {cv.cvJson.projects?.length > 0 && (
                        <section className="relative group/section">
                          <SectionHeading icon={FileText} onAdd={() => setCv({ ...cv, cvJson: { ...cv.cvJson, projects: [{ name: "Project Name", description: "", url: "" }, ...(cv.cvJson.projects || [])] } })}>Key Projects</SectionHeading>
                          <div className="grid grid-cols-1 gap-8">
                            {cv.cvJson.projects.map((p: any, idx: number) => (
                              <div key={idx} className="font-sans">
                                <div className="flex items-center justify-between mb-1">
                                  <h3 className="font-bold text-gray-800 text-lg">{p.name}</h3>
                                  {p.url && <a href={p.url} className="text-amber-500 hover:underline flex items-center gap-1 text-[10px] font-semibold uppercase"><ExternalLink size={10} /> Link</a>}
                                </div>
                                <p className="text-sm text-gray-600 leading-relaxed">{p.description}</p>
                              </div>
                            ))}
                          </div>
                        </section>
                       )}

                       <section className="relative group/section">
                          <SectionHeading icon={Trophy}>Technical Arsenal</SectionHeading>
                          <div className="grid grid-cols-2 gap-8 font-sans">
                             {(cv.cvJson.skills || []).map((s: any, idx: number) => (
                               <div key={idx} className="flex flex-col gap-2">
                                  <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-normal">{s.name}</h4>
                                  <div className="flex flex-wrap gap-2">
                                     {(s.keywords || []).map((kw: string, i: number) => <Badge key={i} className="bg-gray-100 text-gray-700 text-[10px] font-bold border-none hover:bg-amber-100">{kw}</Badge>)}
                                  </div>
                               </div>
                             ))}
                          </div>
                       </section>

                       {cv.cvJson.certificates?.length > 0 && (
                        <section className="relative group/section">
                          <SectionHeading icon={Award}>Certifications</SectionHeading>
                          <div className="grid grid-cols-2 gap-6 font-sans">
                            {cv.cvJson.certificates.map((c: any, idx: number) => (
                              <div key={idx} className="flex justify-between border-l-2 border-amber-500/20 pl-4">
                                <div>
                                  <h4 className="font-bold text-gray-800 text-sm">{c.name}</h4>
                                  <p className="text-xs text-gray-500">{c.issuer}</p>
                                </div>
                                <span className="text-[10px] font-semibold text-gray-400">{c.date}</span>
                              </div>
                            ))}
                          </div>
                        </section>
                       )}

                       <div className="grid grid-cols-2 gap-16">
                          <section>
                            <SectionHeading icon={BookOpen}>Education</SectionHeading>
                            <div className="space-y-6 font-sans">
                              {(cv.cvJson.education || []).map((edu: any, idx: number) => (
                                <div key={idx}>
                                  <h4 className="font-bold text-gray-800 text-sm">{edu.institution}</h4>
                                  <p className="text-xs text-gray-500">{edu.studyType} in {edu.area}</p>
                                  <p className="text-[10px] font-semibold text-amber-500 mt-1 uppercase tracking-normal">{edu.endDate}</p>
                                </div>
                              ))}
                            </div>
                          </section>

                          {cv.cvJson.languages?.length > 0 && (
                            <section>
                              <SectionHeading icon={Languages}>Languages</SectionHeading>
                              <div className="space-y-4 font-sans">
                                {cv.cvJson.languages.map((l: any, idx: number) => (
                                  <div key={idx} className="flex items-center justify-between">
                                    <span className="font-bold text-sm text-gray-800">{l.language}</span>
                                    <Badge variant="outline" className="text-[9px] font-semibold uppercase text-gray-400 border-gray-200">{l.fluency}</Badge>
                                  </div>
                                ))}
                              </div>
                            </section>
                          )}
                       </div>
                    </div>
                  </Card>
                </div>
              )}

              {activeTab === "tailor" && (
                <div className="space-y-8 animate-in fade-in duration-500">
                  <div className="flex items-center gap-3 mb-6">
                      <div className="w-1.5 h-6 bg-amber-500 rounded-full" />
                      <h3 className="text-2xl font-semibold text-white uppercase tracking-tight ">Job Tailoring Engine</h3>
                  </div>
                  {!tailoringResult ? (
                    <Card className="bg-white/5 border-white/10 rounded-[32px] p-8 space-y-6">
                        <textarea value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} placeholder="Paste JD here..." className="w-full bg-black/40 border border-white/10 rounded-2xl p-6 text-sm text-white/80 min-h-[300px] focus:border-amber-500/50 focus:outline-none transition-all resize-none font-medium leading-relaxed" />
                        <div className="grid grid-cols-2 gap-4">
                          <Input value={targetRole} onChange={(e) => setTargetRole(e.target.value)} placeholder="Target Role" className="bg-black/40 border-white/10 rounded-xl h-14 text-white font-bold" />
                          <Button onClick={handleTailor} disabled={isTailoring || !jobDescription} className="w-full h-14 btn-premium group"><Sparkles className={cn("mr-2 h-5 w-5", isTailoring && "animate-spin")} /><span className="text-xs font-semibold uppercase tracking-normal">{isTailoring ? "Tailoring..." : "Tailor Now"}</span></Button>
                        </div>
                    </Card>
                  ) : (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <Card className="bg-green-500/10 border border-green-500/20 rounded-[32px] p-8 text-center"><CheckCircle2 className="mx-auto text-green-400 mb-4" size={48} /><h4 className="text-xl font-semibold text-white mb-2 ">Tailoring Complete</h4><Button onClick={() => router.push(`/dashboard/cv/${tailoringResult.branchId}`)} className="bg-green-500 hover:bg-green-600 text-black font-semibold uppercase tracking-normal px-8 rounded-xl h-12">View Branch</Button></Card>
                        <div className="space-y-4">{(tailoringResult.changes || []).map((c: any, i: number) => <Card key={i} className="bg-white/5 border-white/10 p-6 flex gap-4"><div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg"><Zap size={18} /></div><div><h5 className="text-[10px] font-semibold text-amber-500 uppercase tracking-normal">{c.section}</h5><p className="text-sm font-bold text-white">{c.description}</p></div></Card>)}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </main>

          <aside className="w-80 border-l border-white/5 bg-black/40 backdrop-blur-3xl p-8 overflow-y-auto scrollbar-hide">
            <h3 className="text-sm font-semibold text-white mb-8 tracking-normal uppercase ">Strategic Insights</h3>
            <div className="space-y-6">
               <div className="space-y-4">
                 {analysis?.detailedResults ? Object.entries(analysis.detailedResults).map(([key, value]: [string, any], i: number) => (
                   <div key={i} className={cn("p-6 rounded-2xl border transition-all hover:bg-white/5 cursor-pointer group", value.status === "fail" ? "bg-red-500/5 border-red-500/20" : value.status === "warning" ? "bg-amber-500/5 border-amber-500/20" : "bg-transparent border-white/5")}>
                     <div className="flex items-center gap-3 mb-3">
                       <div className={cn("h-2 w-2 rounded-full", value.status === "fail" ? "bg-red-500 animate-pulse" : value.status === "warning" ? "bg-amber-500 animate-pulse" : "bg-green-500/30")} />
                       <span className={cn("text-[10px] font-semibold uppercase tracking-normal", value.status === "fail" ? "text-red-500" : value.status === "warning" ? "text-amber-500" : "text-white/40")}>{value.checkName}</span>
                     </div>
                     <p className={cn("text-xs leading-relaxed font-medium mb-3", value.status === "pass" ? "text-white/30" : "text-white/90")}>{value.issues?.[0] || "Fully Optimized"}</p>
                     {value.suggestions?.[0] && (
                       <div className="bg-white/5 rounded-xl p-3 border border-white/5 group-hover:border-amber-500/30 transition-all">
                          <p className="text-[9px] text-amber-500 font-semibold uppercase tracking-normal mb-1 flex items-center gap-2"><Zap size={10}/> Quick Tip</p>
                          <p className="text-[10px] text-white/60 font-medium leading-relaxed">{value.suggestions[0]}</p>
                       </div>
                     )}
                   </div>
                 )) : <div className="text-center py-12"><BrainCircuit className="mx-auto text-white/10 mb-4 animate-pulse" size={48} /><p className="text-[10px] font-semibold text-white/20 uppercase tracking-normal">Auditing Profile...</p></div>}
               </div>
               <Button onClick={() => fetchAnalysis(cv._id)} disabled={isAnalyzing} className="w-full bg-white text-black hover:bg-amber-500 hover:text-black border-none rounded-2xl py-7 font-semibold text-xs group transition-all active:scale-95"><Sparkles className="mr-2 h-4 w-4" /><span className="uppercase tracking-normal">{isAnalyzing ? "Analyzing..." : "Refresh Insights"}</span></Button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
