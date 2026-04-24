"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { UserPlus, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useUser } from "@/hooks/useUser"

export default function SignupPage() {
  const router = useRouter()
  const { updateUser } = useUser()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: ""
  })

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Signup failed")
      }

      // Save to local state for instant UI update
      updateUser({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
      })

      router.push("/dashboard")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="h-screen w-full relative flex items-center justify-center overflow-hidden bg-[#0b0b14] font-outfit">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 grayscale-[0.2]"
        style={{ backgroundImage: `url('https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Fractal%20Glass%20-%204.jpg-8QPt1A02QgjJIeTqwEYV5thwZXXEGT.jpeg')` }}
      />
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />

      <Card className="relative z-10 w-full max-w-md bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-[40px] p-10 shadow-2xl overflow-hidden group">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl group-hover:bg-amber-500/20 transition-all duration-1000" />
        
        <div className="relative z-20 space-y-8">
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
                <UserPlus className="text-amber-500 h-8 w-8" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tighter uppercase">Join Jobify</h1>
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">Initialize Identity</p>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center gap-3 text-red-500 text-xs font-bold animate-in fade-in zoom-in duration-300">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">First Name</label>
                  <Input 
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    placeholder="Alex" 
                    className="bg-white/5 border-white/10 rounded-2xl h-12 text-sm placeholder:text-white/20 focus:border-amber-500/50 transition-all"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Last Name</label>
                  <Input 
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    placeholder="Rivera" 
                    className="bg-white/5 border-white/10 rounded-2xl h-12 text-sm placeholder:text-white/20 focus:border-amber-500/50 transition-all"
                    required
                  />
                </div>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Work Email</label>
                <Input 
                  type="email" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="alex@career.com" 
                  className="bg-white/5 border-white/10 rounded-2xl h-12 text-sm placeholder:text-white/20 focus:border-amber-500/50 transition-all"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Password</label>
                <Input 
                  type="password" 
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder="••••••••" 
                  className="bg-white/5 border-white/10 rounded-2xl h-12 text-sm placeholder:text-white/20 focus:border-amber-500/50 transition-all"
                  required
                />
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-white text-black font-black text-xs uppercase tracking-widest rounded-2xl h-12 mt-4 hover:bg-amber-500 transition-all border-0 shadow-xl"
            >
              {isLoading ? "Initializing..." : "Create Account"}
            </Button>
          </form>

          <div className="pt-2 text-center">
            <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">
              Already initialized?{" "}
              <Link href="/login" className="text-white/60 hover:text-amber-500 transition-colors">
                Back to Secure Terminal
              </Link>
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
