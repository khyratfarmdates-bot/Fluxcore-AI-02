import React, { useState, useEffect } from "react";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Clock, 
  Brain, 
  Target, 
  Zap, 
  MessageCircle, 
  Share2, 
  Eye, 
  ChevronUp, 
  ChevronDown,
  Sparkles,
  ArrowUpRight,
  Lightbulb,
  ShieldCheck
} from "lucide-react";
import { cn } from "../lib/utils";
import { intelEngine } from "./IntelligenceEngine";
import { WorkspaceIntelligence, IntelligenceInsight, PlatformStats } from "./types";
import { useWorkspace } from "../contexts/WorkspaceContext";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from "recharts";

export function IntelligenceDashboard() {
  const { activeBrand } = useWorkspace();
  const [data, setData] = useState<WorkspaceIntelligence | null>(null);
  const [insights, setInsights] = useState<IntelligenceInsight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeBrand) {
      loadIntelligence();
    }
  }, [activeBrand]);

  const loadIntelligence = async () => {
    setLoading(true);
    const intel = await intelEngine.getWorkspaceIntelligence(activeBrand!.id);
    const recs = await intelEngine.getRecommendations(activeBrand!.id);
    setData(intel);
    setInsights(recs);
    setLoading(false);
  };

  if (loading || !data) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">جمع البيانات وتحليلها...</p>
        </div>
      </div>
    );
  }

  const platformChartData = Object.entries(data.platformBreakdown)
    .filter(([_, stats]) => (stats as PlatformStats).reach > 0)
    .map(([name, stats]) => ({
      name,
      reach: (stats as PlatformStats).reach,
      engagement: (stats as PlatformStats).engagement
    }));

  const ageData = Object.entries(data.audience.ageRanges).map(([age, value]) => ({
    name: age,
    value
  }));

  const COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#f59e0b"];

  return (
    <div className="space-y-8 pb-12">
      {/* Header Info */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <ShieldCheck className="text-indigo-400" />
            Executive Intelligence Report
          </h2>
          <p className="text-slate-500 font-medium">نظرة استراتيجية شاملة مدعومة بالذكاء الاصطناعي لعلامتك التجارية</p>
        </div>
        <button 
          onClick={loadIntelligence}
          className="px-6 py-2 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded-xl font-bold text-sm hover:bg-indigo-500/20 transition-all flex items-center gap-2"
        >
          <Zap size={16} /> تحديث التحليلات
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-4 gap-6">
        <StatCard 
          label="إجمالي الوصول" 
          value={data.totalStats.reach.toLocaleString()} 
          trend="+12.5%" 
          icon={<Eye size={20} className="text-blue-400" />} 
          color="blue"
        />
        <StatCard 
          label="معدل التفاعل" 
          value={`${(data.totalStats.engagementRate * 100).toFixed(1)}%`} 
          trend="+2.1%" 
          icon={<MessageCircle size={20} className="text-indigo-400" />} 
          color="indigo"
        />
        <StatCard 
          label="النمو المتوقع" 
          value="18.2%" 
          trend="Strong" 
          icon={<TrendingUp size={20} className="text-emerald-400" />} 
          color="emerald"
        />
        <StatCard 
          label="المتابعين النشطين" 
          value="24.5K" 
          trend="+450" 
          icon={<Users size={20} className="text-amber-400" />} 
          color="amber"
        />
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Real Data Visuals */}
        <div className="col-span-2 space-y-6">
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <BarChart3 size={16} className="text-indigo-500" />
              توزيع الوصول عبر المنصات
            </h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={platformChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" axisLine={false} tickLine={false} />
                  <YAxis stroke="#64748b" axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "12px" }}
                    itemStyle={{ color: "#fff" }}
                  />
                  <Bar dataKey="reach" radius={[4, 4, 0, 0]}>
                    {platformChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} fillOpacity={0.8} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
             {/* Audience Demographics */}
             <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">الديموغرافية (العمر)</h3>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={ageData}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {ageData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 mt-4">
                   {ageData.map((item, i) => (
                     <div key={item.name} className="flex items-center justify-between text-xs font-bold">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                          <span className="text-slate-400">{item.name}</span>
                        </div>
                        <span className="text-white">{item.value}%</span>
                     </div>
                   ))}
                </div>
             </div>

             <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6">
               <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">أهم الاهتمامات</h3>
               <div className="space-y-3">
                  {data.audience.interests.map((interest, i) => (
                    <div key={i} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between group hover:border-indigo-500/50 transition-all">
                       <span className="text-sm font-bold text-slate-300">{interest}</span>
                       <Target size={14} className="text-slate-600 group-hover:text-indigo-400" />
                    </div>
                  ))}
               </div>
               <div className="mt-6 p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl">
                  <p className="text-[10px] text-indigo-300 font-bold uppercase mb-1">AI INSIGHT</p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    جمهورك يظهر اهتماماً متزايداً بـ <b>الذكاء الاصطناعي</b>، ننصح بزيادة وتيرة المحتوى التقني.
                  </p>
               </div>
             </div>
          </div>
        </div>

        {/* Intelligence Feed */}
        <div className="space-y-6">
           <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-6 text-white relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl rounded-full" />
              <Brain size={32} className="mb-4 opacity-50" />
              <h3 className="text-lg font-black leading-tight mb-2">توصيات المحرك الذكي</h3>
              <p className="text-sm text-indigo-100/80 font-medium">يتم الآن تحليل آخر 24 ساعة من التفاعل...</p>
           </div>

           <div className="space-y-4">
              {insights.map((insight) => (
                <div 
                  key={insight.id} 
                  className={cn(
                    "p-5 rounded-3xl border transition-all hover:translate-x-1",
                    insight.severity === "high" ? "bg-rose-500/5 border-rose-500/20" : "bg-slate-900/50 border-slate-800"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full",
                      insight.severity === "high" ? "bg-rose-500/20 text-rose-400" : "bg-indigo-500/20 text-indigo-400"
                    )}>
                      {insight.type}
                    </span>
                    <Sparkles size={14} className="text-indigo-400" />
                  </div>
                  <h4 className="text-sm font-bold text-white mb-2">{insight.title}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">{insight.description}</p>
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                     <p className="text-[10px] text-slate-500 font-black uppercase mb-1">AI Recommendation</p>
                     <p className="text-xs text-emerald-400 font-bold">{insight.recommendation}</p>
                  </div>
                </div>
              ))}
           </div>

           <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6">
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Clock size={16} className="text-amber-500" />
                أفضل وقت للنشر اليوم
              </h3>
              <div className="flex flex-wrap gap-2">
                 {data.audience.activePeakHours.slice(0, 3).map(hour => (
                   <div key={hour} className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm font-black text-white">
                      {hour}:00
                   </div>
                 ))}
              </div>
              <p className="text-[10px] text-slate-500 mt-4 leading-relaxed">
                تعتمد هذه الأوقات على نمط نشاط جمهورك الحقيقي في آخر 7 أيام.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, trend, icon, color }: any) {
  const isPositive = trend.startsWith('+');
  
  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 transition-all hover:bg-slate-800/80 group">
      <div className="flex items-center justify-between mb-4">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
          color === "indigo" ? "bg-indigo-500/10" : 
          color === "emerald" ? "bg-emerald-500/10" :
          color === "blue" ? "bg-blue-500/10" : "bg-amber-500/10"
        )}>
          {icon}
        </div>
        <div className={cn(
          "text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest",
          isPositive ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
        )}>
          {trend}
        </div>
      </div>
      <div>
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-2xl font-black text-white tracking-tight">{value}</p>
      </div>
    </div>
  );
}
