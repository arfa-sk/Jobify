"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useUser } from "@/hooks/useUser"
import { 
  ArrowLeft, 
  User, 
  Briefcase, 
  MapPin, 
  Mail, 
  Save,
  ShieldCheck,
  Zap
} from "lucide-react"
import Link from "next/link"

export default function ProfilePage() {
  const router = useRouter()
  const { user, updateUser } = useUser()
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState(user)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    updateUser(formData)
    setTimeout(() => {
      setIsSaving(false)
      router.push("/dashboard")
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-[#05050a] text-white font-outfit p-8 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px] -z-10" />
      
      <div className="max-w-4xl mx-auto space-y-8 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href="/dashboard">
            <Button variant="ghost" className="text-white/40 hover:text-white group">
              <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              Back to Terminal
            </Button>
          </Link>
          <div className="flex items-center gap-2 px-4 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full">
            <ShieldCheck className="h-3.5 w-3.5 text-amber-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">Verified Identity</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Quick Actions & Avatar */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="bg-white/5 border-white/10 rounded-[32px] p-8 text-center">
              <div className="w-24 h-24 rounded-[32px] bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(245,158,11,0.15)]">
                <span className="text-3xl font-black text-amber-500">{user.firstName[0]}{user.lastName[0]}</span>
              </div>
              <h2 className="text-2xl font-black tracking-tight">{user.firstName} {user.lastName}</h2>
              <p className="text-amber-500/60 text-[10px] font-black uppercase tracking-widest mt-1">{user.role}</p>
              
              <div className="mt-8 pt-8 border-t border-white/5 space-y-3">
                 <div className="flex items-center gap-3 text-white/40 text-xs px-2">
                    <Mail size={14} className="text-amber-500" />
                    <span>{user.email}</span>
                 </div>
                 <div className="flex items-center gap-3 text-white/40 text-xs px-2">
                    <MapPin size={14} className="text-amber-500" />
                    <span>{user.location}</span>
                 </div>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-amber-500/10 to-transparent border-white/5 rounded-[32px] p-8">
               <Zap className="text-amber-500 mb-4" size={24} />
               <h4 className="font-black text-sm uppercase tracking-widest mb-2">Pro Member</h4>
               <p className="text-xs text-white/40 leading-relaxed">You have full access to Jobify's AI Scraper and Relevance Engine.</p>
            </Card>
          </div>

          {/* Right: Edit Form */}
          <div className="lg:col-span-8">
            <Card className="bg-white/5 border-white/10 rounded-[32px] p-10">
              <h3 className="text-xl font-black tracking-tight mb-8">Career Identity</h3>
              
              <form onSubmit={handleSave} className="space-y-8">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">First Name</label>
                    <Input 
                      value={formData.firstName}
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                      className="bg-white/5 border-white/10 rounded-2xl h-12 focus:border-amber-500/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Last Name</label>
                    <Input 
                      value={formData.lastName}
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                      className="bg-white/5 border-white/10 rounded-2xl h-12 focus:border-amber-500/50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Professional Role</label>
                  <Input 
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    className="bg-white/5 border-white/10 rounded-2xl h-12 focus:border-amber-500/50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Primary Location</label>
                  <Input 
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    className="bg-white/5 border-white/10 rounded-2xl h-12 focus:border-amber-500/50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Career Bio</label>
                  <textarea 
                    value={formData.bio || ""}
                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                    placeholder="Focus on your unique value proposition..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:border-amber-500/50 min-h-[120px] transition-all"
                  />
                </div>

                <div className="pt-4">
                  <Button 
                    type="submit" 
                    disabled={isSaving}
                    className="w-full bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-widest rounded-2xl h-14 shadow-2xl shadow-amber-900/20"
                  >
                    {isSaving ? "Synchronizing..." : "Update Identity"}
                    {!isSaving && <Save className="ml-2 h-4 w-4" />}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
