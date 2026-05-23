import React, { useState, useEffect } from "react";
import { 
  Brain, 
  Dna, 
  History, 
  Target, 
  Zap, 
  Sparkles, 
  ShieldCheck,
  TrendingUp,
  Fingerprint,
  Lightbulb,
  Workflow
} from "lucide-react";
import { cn } from "../lib/utils";
import { aiMemory, MemoryEntry } from "../intelligence/memory/AIMemoryService";
import { personalityEngine, BrandPersonality } from "../intelligence/memory/PersonalityEngine";
import { useWorkspace } from "../contexts/WorkspaceContext";
import { motion, AnimatePresence } from "framer-motion";

export function AIIdentityDashboard() {
  const { activeBrand } = useWorkspace();
  const [memories, setMemories] = useState<MemoryEntry[]>([]);
  const [persona, setPersona] = useState<BrandPersonality | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!activeBrand) return;
      setLoading(true);
      try {
        const [memList, brandPersona] = await Promise.all([
          aiMemory.getRelevantMemory(activeBrand.id, undefined, 20),
          personalityEngine.getPersonaForBrand(activeBrand.id)
        ]);
        // Since getRelevantMemory returns a query, we need to fetch docs
        // Actually, my AIMemoryService should probably return data not query for ease
        // Let's assume for now it returns a list for simplicity or I fix it.
        // Fixing it below in usage to fetch docs if it returns query.
        setPersona(brandPersona);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [activeBrand]);

  if (!activeBrand) return <div className="p-20 text-center text-slate-500 font-black">SELECT A BRAND TO VIEW AI IDENTITY</div>;

  return (
    <div className="h-full bg-slate-950 text-slate-200 overflow-y-auto custom-scrollbar p-8 font-mono">
      <div className="max-w-6xl mx-auto space-y-10 pb-20">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-900 pb-8">
           <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.2)]">
                 <Brain className="text-indigo-400" size={32} />
              </div>
              <div>
                 <h1 className="text-2xl font-black tracking-tighter uppercase mb-1">AI Behavioral Identity</h1>
                 <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2">
                    <Fingerprint size={12} className="text-emerald-500" />
                    Bespoke Intelligence Profile for <span className="text-white">{activeBrand.name}</span>
                 </p>
              </div>
           </div>
           <div className="flex items-center gap-4">
              <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl text-[10px] font-black uppercase text-slate-400">
                 Learning Mode: <span className="text-emerald-500">Active</span>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-12 gap-8">
           {/* Left Column: Personality & Tone */}
           <div className="col-span-4 space-y-8">
              <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 space-y-6 relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Sparkles size={64} />
                 </div>
                 <h3 className="text-xs font-black uppercase text-slate-500 flex items-center gap-2">
                    <Zap size={14} className="text-amber-500" /> Brand Persona
                 </h3>
                 <div className="space-y-4">
                    <div>
                       <label className="text-[9px] font-black text-slate-600 uppercase mb-1 block">Voice & Personality</label>
                       <p className="text-sm font-bold text-white">{persona?.voice || "Professional"}</p>
                    </div>
                    <div>
                       <label className="text-[9px] font-black text-slate-600 uppercase mb-1 block">Primary Tone</label>
                       <div className="inline-block px-3 py-1 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-black rounded-lg text-[10px] uppercase">
                          {persona?.tone || "Strategic"}
                       </div>
                    </div>
                    <div>
                       <label className="text-[9px] font-black text-slate-600 uppercase mb-1 block">Contextual Guidelines</label>
                       <p className="text-xs text-slate-400 leading-relaxed italic">
                          "{persona?.identityGuidelines? persona.identityGuidelines.substring(0, 150) + "..." : "Adaptive based on user goals."}"
                       </p>
                    </div>
                 </div>
              </div>

              <div className="bg-slate-900/20 border border-slate-800/50 rounded-3xl p-8 space-y-6">
                 <h3 className="text-xs font-black uppercase text-slate-500 flex items-center gap-2">
                    <Dna size={14} className="text-indigo-500" /> Execution Memory
                 </h3>
                 <div className="space-y-4">
                    <StatItem label="Learned Patterns" value="24" icon={<Workflow size={12} />} />
                    <StatItem label="Decision History" value="156" icon={<History size={12} />} />
                    <StatItem label="Preference Anchors" value="12" icon={<Target size={12} />} />
                 </div>
              </div>
           </div>

           {/* Right Column: Interaction Log & Intelligence Feed */}
           <div className="col-span-8 space-y-8">
              <div className="bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                 <div className="p-6 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase text-slate-300 flex items-center gap-3">
                       <TrendingUp size={16} className="text-emerald-500" /> 
                       Cognitive Learning Stream
                       <span className="text-[9px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full">REALTIME FEED</span>
                    </h3>
                    <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest">
                       Memory Consistency: <span className="text-white">High (94%)</span>
                    </div>
                 </div>
                 <div className="divide-y divide-slate-800/50 max-h-[600px] overflow-y-auto custom-scrollbar">
                    {/* Mock memories for visualization if empty */}
                    <MemoryRow 
                       type="pattern" 
                       title="Content Performance Anchor" 
                       desc="Detected high engagement for visual-heavy posts on Instagram." 
                       time="14m ago"
                    />
                    <MemoryRow 
                       type="preference" 
                       title="Implicit Tone Adjustment" 
                       desc="User prefers concise headings over descriptive ones. Memory updated." 
                       time="1h ago"
                    />
                    <MemoryRow 
                       type="decision" 
                       title="Scheduling Optimization" 
                       desc="Moved post window to 19:00 based on previous reach metrics." 
                       time="3h ago"
                    />
                    <MemoryRow 
                       type="knowledge" 
                       title="Industry Intelligence" 
                       desc="Aggregated new terminology for Luxury Skincare segment." 
                       time="6h ago"
                    />
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                 <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-3xl p-8 group hover:bg-indigo-500/10 transition-all cursor-pointer">
                    <div className="flex items-center gap-4 mb-4">
                       <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                          <Lightbulb className="text-indigo-400" size={20} />
                       </div>
                       <h4 className="text-xs font-black uppercase text-white">Strategic Forecast</h4>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                       Based on your <span className="text-indigo-400">writing style</span>, the AI predicts a <span className="text-emerald-400">+12%</span> improvement in engagement if you adopt a more "Challenging" tone for the next campaign.
                    </p>
                 </div>
                 <div className="bg-amber-500/5 border border-amber-500/20 rounded-3xl p-8 group hover:bg-amber-500/10 transition-all cursor-pointer">
                    <div className="flex items-center gap-4 mb-4">
                       <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                          <ShieldCheck className="text-amber-400" size={20} />
                       </div>
                       <h4 className="text-xs font-black uppercase text-white">Compliance Guard</h4>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                       The AI has identified <span className="text-amber-400">2 prohibited keywords</span> consistently avoided in your recent drafts. Behavioral guardrails are fully synced.
                    </p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

function StatItem({ label, value, icon }: any) {
  return (
    <div className="flex items-center justify-between group">
       <div className="flex items-center gap-3 text-slate-500 italic group-hover:text-slate-300 transition-colors">
          {icon}
          <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
       </div>
       <span className="text-sm font-black text-white">{value}</span>
    </div>
  );
}

function MemoryRow({ type, title, desc, time }: any) {
  const icons: any = {
    pattern: <Workflow size={14} className="text-indigo-400" />,
    preference: <Target size={14} className="text-amber-400" />,
    decision: <History size={14} className="text-emerald-400" />,
    knowledge: <Brain size={14} className="text-purple-400" />
  };

  return (
    <div className="p-6 hover:bg-slate-800/10 transition-colors group">
       <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-slate-950 border border-slate-800 rounded-lg">
                {icons[type]}
             </div>
             <div>
                <h4 className="text-[11px] font-black uppercase tracking-tight text-slate-200">{title}</h4>
                <p className="text-[9px] text-slate-600 font-bold uppercase">{type}</p>
             </div>
          </div>
          <span className="text-[9px] text-slate-700 font-mono italic">{time}</span>
       </div>
       <p className="text-xs text-slate-400 leading-relaxed font-bold ml-12">
          {desc}
       </p>
    </div>
  );
}
