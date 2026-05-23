import React, { useState, useEffect } from "react";
import { 
  Puzzle, 
  ShoppingBag, 
  ShieldCheck, 
  Zap, 
  Settings, 
  Plus, 
  ExternalLink, 
  Download,
  Star,
  Users,
  Code2,
  Lock,
  Search,
  Grid
} from "lucide-react";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { extensionRuntime } from "./Runtime";

export function MarketplaceDashboard() {
  const [view, setView] = useState<'marketplace' | 'installed' | 'developer'>('marketplace');
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    // Simulated marketplace items
    setItems([
      { id: 'ext-1', name: 'Web-Search Agent', type: 'agent', desc: 'Adds real-time web search capabilities to Executive AI.', rating: 4.8, users: '1.2k', price: 'Free' },
      { id: 'ext-2', name: 'WhatsApp Connector', type: 'integration', desc: 'Direct publishing and chat integration with WhatsApp Business.', rating: 4.9, users: '3.4k', price: '$29/mo' },
      { id: 'ext-3', name: 'Brand Tone Guard', type: 'tool', desc: 'Real-time NLP check to ensure brand voice consistency.', rating: 4.7, users: '800', price: 'Free' },
      { id: 'ext-4', name: 'Custom UI Widgets', type: 'ui', desc: 'New dashboard components for specialized metrics.', rating: 4.5, users: '500', price: 'Free' },
    ]);
  }, []);

  return (
    <div className="h-full bg-slate-950 text-slate-200 flex flex-col font-mono overflow-hidden">
      {/* Dynamic Header */}
      <div className="p-8 border-b border-white/5 bg-slate-950/80 backdrop-blur-md flex items-center justify-between shrink-0">
         <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-[2rem] bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.1)]">
               <Puzzle className="text-emerald-400" size={32} />
            </div>
            <div>
               <h1 className="text-2xl font-black tracking-tighter uppercase mb-1">AI Marketplace & Ecosystem</h1>
               <div className="flex items-center gap-4">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2">
                     <Grid size={12} className="text-emerald-500" /> Catalog Registry: <span className="text-white">Live</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2">
                     <Lock size={12} className="text-amber-500" /> Sandbox Isolation: <span className="text-white">Enforced</span>
                  </span>
               </div>
            </div>
         </div>

         <div className="flex gap-2 bg-slate-900/50 p-1 rounded-2xl border border-white/5">
            <TabButton active={view === 'marketplace'} onClick={() => setView('marketplace')} icon={<ShoppingBag size={14}/>} label="Catalog" />
            <TabButton active={view === 'installed'} onClick={() => setView('installed')} icon={<Puzzle size={14}/>} label="My Apps" />
            <TabButton active={view === 'developer'} onClick={() => setView('developer')} icon={<Code2 size={14}/>} label="Dev Console" />
         </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
        <div className="max-w-6xl mx-auto">
          {view === 'marketplace' && (
            <div className="space-y-10">
               {/* Hero Banner Internal */}
               <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-[3rem] p-10 relative overflow-hidden group">
                  <div className="relative z-10 max-w-lg">
                     <h2 className="text-3xl font-black text-white tracking-tighter uppercase mb-4 leading-none">Extend Fluxcore AI 02 <br/> With AI Agents</h2>
                     <p className="text-sm text-slate-400 font-bold mb-8">Download specialized agents, tools, and UI extensions from our internal enterprise registry.</p>
                     <button className="px-8 py-3 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl text-xs font-black uppercase transition-all shadow-[0_0_30px_rgba(99,102,241,0.3)]">
                        Explore SDK Docs
                     </button>
                  </div>
                  <div className="absolute right-[-5%] top-[-10%] opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-1000">
                     <Zap size={300} />
                  </div>
               </div>

               <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase text-slate-500 tracking-widest flex items-center gap-3">
                     <Grid size={16} className="text-emerald-500" /> Featured Extensions
                  </h3>
                  <div className="relative">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
                     <input type="text" placeholder="Search Marketplace..." className="bg-slate-900 border border-white/5 rounded-xl pl-10 pr-4 py-2 text-[10px] font-bold outline-none focus:border-emerald-500/30 transition-all w-64" />
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-8">
                  {items.map(item => (
                    <MarketItemCard key={item.id} item={item} />
                  ))}
               </div>
            </div>
          )}

          {view === 'installed' && (
            <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase text-slate-500 tracking-widest">Active System Extensions</h3>
                  <div className="text-[9px] font-black text-slate-600 uppercase">3 Extensions Running</div>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {extensionRuntime.getActiveExtensions().map(ext => (
                    <InstalledExtCard key={ext.id} ext={ext} />
                  ))}
                  {extensionRuntime.getActiveExtensions().length === 0 && (
                    <div className="py-20 text-center border-2 border-dashed border-slate-900 rounded-[3rem]">
                        <Puzzle size={40} className="mx-auto text-slate-800 mb-4" />
                        <p className="text-xs font-black text-slate-600 uppercase tracking-widest">No 3rd-party extensions installed.</p>
                    </div>
                  )}
                </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MarketItemCard({ item }: any) {
  return (
    <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-8 group hover:bg-slate-900/60 hover:border-white/10 transition-all relative">
       <div className="flex items-center justify-between mb-6">
          <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-white/5 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
             {item.type === 'agent' ? <Zap size={22}/> : <Settings size={22}/>}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-black text-amber-500 italic">
             <Star size={12} fill="currentColor" /> {item.rating}
          </div>
       </div>
       <h4 className="text-md font-black text-white uppercase tracking-tight mb-2">{item.name}</h4>
       <p className="text-[11px] text-slate-500 leading-relaxed font-bold mb-6 h-10 line-clamp-2">
          {item.desc}
       </p>
       <div className="flex items-center justify-between pt-6 border-t border-white/5">
          <div className="flex items-center gap-4">
             <span className="text-[9px] font-black text-white uppercase">{item.price}</span>
             <span className="flex items-center gap-1.5 text-[8px] font-black text-slate-600 uppercase"><Users size={10}/> {item.users}</span>
          </div>
          <button className="p-2.5 bg-white text-slate-950 rounded-xl hover:scale-105 transition-all">
             <Download size={16} />
          </button>
       </div>
    </div>
  );
}

function InstalledExtCard({ ext }: any) {
  return (
    <div className="p-6 bg-slate-900/40 border border-white/5 rounded-3xl flex items-center justify-between group">
       <div className="flex items-center gap-6">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
             <Puzzle size={24} />
          </div>
          <div>
             <h4 className="text-xs font-black text-white uppercase tracking-tight">{ext.name} <span className="text-slate-600 ml-2">v{ext.version}</span></h4>
             <div className="flex items-center gap-4 mt-1">
                <span className="text-[8px] font-black text-emerald-500 uppercase flex items-center gap-1.5">
                   <ShieldCheck size={10} /> Verified
                </span>
                <span className="text-[8px] font-black text-slate-600 uppercase italic">{ext.type} EXTENSION</span>
             </div>
          </div>
       </div>
       <div className="flex items-center gap-3">
          <button className="p-2 border border-white/5 rounded-lg text-slate-500 hover:text-white hover:border-white/10 transition-all"><Settings size={14}/></button>
          <div className="h-6 w-12 bg-emerald-500/20 border border-emerald-500/40 rounded-full relative p-1 cursor-pointer">
             <div className="h-4 w-4 bg-emerald-500 rounded-full absolute right-1" />
          </div>
       </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: any) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap",
        active ? "bg-white text-slate-950 shadow-[0_0_20px_rgba(255,255,255,0.1)]" : "text-slate-500 hover:text-white"
      )}
    >
      {icon} {label}
    </button>
  );
}
