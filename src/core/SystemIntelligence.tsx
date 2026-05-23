import React from 'react';
import { useSystemStore } from '../store/useSystemStore';
import { 
  Activity, 
  Cpu, 
  Database, 
  AlertCircle, 
  ShieldCheck, 
  Zap, 
  TrendingUp, 
  BarChart3, 
  Clock,
  Layers,
  FlaskConical,
  DollarSign
} from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';

export function SystemIntelligence() {
  const { flags, metrics, costs, toggleFlag } = useSystemStore();

  const costData = Object.entries(costs.byProvider).map(([name, value]) => ({ name, value }));
  
  // Mock performance data based on current metrics
  const perfData = [
    { time: '10:00', ms: 450 },
    { time: '11:00', ms: 520 },
    { time: '12:00', ms: 480 },
    { time: '13:00', ms: 610 },
    { time: '14:00', ms: 550 },
  ];

  return (
    <div className="p-8 space-y-8 h-screen overflow-y-auto custom-scrollbar bg-slate-950">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tighter">System Intelligence</h2>
          <p className="text-slate-500 font-bold mt-1 uppercase text-[10px] tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Fluxcore AI 02 Operational OS v2.0-Production
          </p>
        </div>
        <div className="flex gap-4">
           <StatusPill icon={<ShieldCheck size={14}/>} label="Auth Layer" status="Secure" color="emerald" />
           <StatusPill icon={<Database size={14}/>} label="Storage" status="Operational" color="emerald" />
           <StatusPill icon={<Zap size={14}/>} label="AI Node" status="Optimized" color="indigo" />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Real-time Health Cards */}
        <div className="col-span-12 lg:col-span-8 grid grid-cols-4 gap-4">
          <MetricCard 
            title="Avg AI Response" 
            value="482ms" 
            trend="-12%" 
            icon={<Clock className="text-indigo-400" />} 
          />
          <MetricCard 
            title="Queue Throughput" 
            value="1.2k/hr" 
            trend="+5.4%" 
            icon={<Activity className="text-emerald-400" />} 
          />
          <MetricCard 
            title="Resource Gain" 
            value="24.5%" 
            trend="+2.1%" 
            icon={<Cpu className="text-purple-400" />} 
          />
          <MetricCard 
            title="Daily AI Cost" 
            value={`$${costs.dailyTotal.toFixed(3)}`} 
            trend="Active" 
            icon={<DollarSign className="text-amber-400" />} 
          />
        </div>

        {/* Feature Flags & Labs */}
        <div className="col-span-12 lg:col-span-4 bg-slate-900/50 border border-slate-800 rounded-[32px] p-6 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <FlaskConical size={20} className="text-rose-400" />
            <h3 className="font-black text-white text-sm">Feature Control & Labs</h3>
          </div>
          <div className="space-y-2">
            <FlagToggle 
              label="Experimental Labs" 
              active={flags.experimentalLabs} 
              onToggle={() => toggleFlag('experimentalLabs')} 
            />
            <FlagToggle 
              label="AI Token Optimization" 
              active={flags.aiResourceOptimization} 
              onToggle={() => toggleFlag('aiResourceOptimization')} 
            />
            <FlagToggle 
              label="Advanced Analytics Engine" 
              active={flags.advancedAnalytics} 
              onToggle={() => toggleFlag('advancedAnalytics')} 
            />
            <FlagToggle 
              label="Real-time Queue Sync" 
              active={flags.realtimeQueue} 
              onToggle={() => toggleFlag('realtimeQueue')} 
            />
          </div>
        </div>

        {/* Charts Section */}
        <div className="col-span-12 lg:col-span-8 bg-slate-900/50 border border-slate-800 rounded-[32px] p-8">
           <div className="flex items-center justify-between mb-8">
              <h3 className="font-black text-white flex items-center gap-2">
                <TrendingUp size={18} className="text-indigo-400" />
                Performance Observability
              </h3>
              <div className="flex gap-2">
                 <button className="bg-slate-950 px-3 py-1 rounded-full text-[10px] font-black text-slate-400 border border-slate-800">Latency</button>
                 <button className="bg-indigo-500/10 px-3 py-1 rounded-full text-[10px] font-black text-indigo-400 border border-indigo-500/20">Throughput</button>
              </div>
           </div>
           <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={perfData}>
                <defs>
                  <linearGradient id="colorMs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 10}} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '16px' }}
                  itemStyle={{ color: '#fff', fontSize: '10px' }}
                  labelStyle={{ display: 'none' }}
                />
                <Area type="monotone" dataKey="ms" stroke="#6366f1" fillOpacity={1} fill="url(#colorMs)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
           </div>
        </div>

        {/* AI Cost Monitoring */}
        <div className="col-span-12 lg:col-span-4 bg-slate-900/50 border border-slate-800 rounded-[32px] p-8 flex flex-col">
           <h3 className="font-black text-white flex items-center gap-2 mb-8">
              <BarChart3 size={18} className="text-amber-400" />
              Provider Cost Distribution
           </h3>
           <div className="flex-1 flex flex-col justify-center gap-8">
              <div className="h-[120px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={costData} layout="vertical">
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 'bold'}} />
                    <Tooltip cursor={{fill: 'transparent'}} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                      {costData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? '#6366f1' : '#f59e0b'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Monthly Burn</span>
                    <p className="text-xl font-black text-white">${costs.monthlyTotal.toFixed(2)}</p>
                 </div>
                 <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Token Savings</span>
                    <p className="text-xl font-black text-emerald-400">12.5%</p>
                 </div>
              </div>
           </div>
        </div>

        {/* Action Logs Layer */}
        <div className="col-span-12 bg-slate-900/50 border border-slate-800 rounded-[32px] p-8 overflow-hidden">
           <div className="flex items-center justify-between mb-6">
              <h3 className="font-black text-white flex items-center gap-2">
                <Layers size={18} className="text-slate-400" />
                Intelligence Action Trace (Observability)
              </h3>
              <button className="text-[10px] font-black uppercase text-indigo-400 hover:underline">Download Master Log</button>
           </div>
           <div className="space-y-4">
              <LogItem 
                type="SYSTEM" 
                message="Initialized Centralized Service Container [Production Hardened]" 
                time="2m ago" 
                status="success" 
              />
              <LogItem 
                type="AI_INTEL" 
                message="Optimized prompt for content generation (Saved 42 tokens)" 
                time="5m ago" 
                status="success" 
              />
              <LogItem 
                type="QUEUE" 
                message="Reprioritized Enterprise task [Job #9421] to front of queue" 
                time="12m ago" 
                status="info" 
              />
              <LogItem 
                type="AUTH" 
                message="Refreshed secure token scope for brand [khyrat-studio]" 
                time="15m ago" 
                status="success" 
              />
           </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, trend, icon }: { title: string, value: string, trend: string, icon: React.ReactNode }) {
  return (
    <div className="bg-slate-950/80 border border-slate-800 p-6 rounded-[28px] hover:border-slate-700 transition-colors group">
      <div className="flex justify-between items-start mb-4">
        {icon}
        <span className={cn(
          "text-[10px] font-black px-2 py-0.5 rounded-full",
          trend.startsWith('+') ? "bg-emerald-500/10 text-emerald-500" : 
          trend.startsWith('-') ? "bg-rose-500/10 text-rose-500" : "bg-slate-800 text-slate-400"
        )}>
          {trend}
        </span>
      </div>
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{title}</p>
      <p className="text-2xl font-black text-white mt-1">{value}</p>
    </div>
  );
}

function FlagToggle({ label, active, onToggle }: { label: string, active: boolean, onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between p-3 bg-slate-950/50 rounded-2xl border border-slate-800/50">
      <span className="text-xs font-bold text-slate-300">{label}</span>
      <button 
        onClick={onToggle}
        className={cn(
          "w-10 h-5 rounded-full relative transition-colors",
          active ? "bg-indigo-500" : "bg-slate-800"
        )}
      >
        <motion.div 
          animate={{ x: active ? 22 : 4 }}
          className="absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm"
        />
      </button>
    </div>
  );
}

function StatusPill({ icon, label, status, color }: { icon: React.ReactNode, label: string, status: string, color: string }) {
  return (
    <div className="bg-slate-900 border border-slate-800/50 py-1.5 px-3 rounded-full flex items-center gap-2">
       <span className={`text-${color}-400`}>{icon}</span>
       <span className="text-[10px] font-bold text-slate-500">{label}:</span>
       <span className="text-[10px] font-black text-white uppercase">{status}</span>
    </div>
  );
}

function LogItem({ type, message, time, status }: { type: string, message: string, time: string, status: 'success' | 'info' | 'error' }) {
  return (
    <div className="flex items-center gap-4 py-3 border-b border-slate-800/50 last:border-0 group">
      <span className={cn(
        "text-[9px] font-black px-2 py-0.5 rounded border uppercase tracking-widest",
        status === 'success' ? "border-emerald-500/20 text-emerald-500" :
        status === 'error' ? "border-rose-500/20 text-rose-500" : "border-slate-700 text-slate-500"
      )}>
        {type}
      </span>
      <p className="flex-1 text-xs font-medium text-slate-400 group-hover:text-slate-200 transition-colors">{message}</p>
      <span className="text-[10px] font-bold text-slate-600">{time}</span>
    </div>
  );
}

import { cn } from '../lib/utils';
