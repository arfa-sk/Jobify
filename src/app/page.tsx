import React from 'react';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-500/10 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full animate-pulse delay-1000" />

      <div className="z-10 text-center max-w-4xl animate-stagger">
        <div className="inline-block px-4 py-1.5 mb-6 border border-orange-500/20 bg-orange-500/5 rounded-full backdrop-blur-sm">
          <span className="text-sm font-medium text-orange-400 tracking-wide uppercase">
            Powered by Gemini AI
          </span>
        </div>
        
        <h1 className="text-6xl md:text-8xl font-bold mb-8 tracking-tight text-white leading-tight">
          Your Career, <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-rose-500">
            Augmented.
          </span>
        </h1>
        
        <p className="text-xl md:text-2xl text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed">
          Jobify is the ultimate AI assistant for job seekers. Manage applications, 
          tailor CVs, and get hired faster with state-of-the-art automation.
        </p>

        <div className="flex flex-col sm:flex-row gap-6 justify-center">
          <button className="btn-premium text-lg px-10 py-4 shadow-[0_0_40px_rgba(245,124,0,0.3)]">
            Get Started for Free
          </button>
          <button className="px-10 py-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-white font-semibold text-lg backdrop-blur-sm">
            View Demo
          </button>
        </div>
      </div>

      <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full z-10">
        <FeatureCard 
          title="Smart Tailoring" 
          description="Automatically optimize your CV for every job description in seconds."
          icon="✨"
        />
        <FeatureCard 
          title="Application Tracking" 
          description="Keep all your job applications organized in one beautiful dashboard."
          icon="📊"
        />
        <FeatureCard 
          title="AI Interview Buddy" 
          description="Practice interviews with an AI that knows your background and the job role."
          icon="🤖"
        />
      </div>
    </main>
  );
}

function FeatureCard({ title, description, icon }: { title: string, description: string, icon: string }) {
  return (
    <div className="glass-card p-8 hover:border-orange-500/30 transition-all group">
      <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">{icon}</div>
      <h3 className="text-2xl font-semibold mb-3 text-white">{title}</h3>
      <p className="text-slate-400 leading-relaxed">{description}</p>
    </div>
  );
}
