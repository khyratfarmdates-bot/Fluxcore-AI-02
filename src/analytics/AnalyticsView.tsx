import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, TrendingUp, Lightbulb, Activity, BarChart2, ShieldCheck } from 'lucide-react';
import { DashboardTab } from './DashboardTab';
import { InsightsTab } from './InsightsTab';
import { TrendsTab } from './TrendsTab';
import { IntelligenceDashboard } from './IntelligenceDashboard';

type Tab = 'dashboard' | 'intelligence' | 'insights' | 'trends';

export function AnalyticsView() {
  const [activeTab, setActiveTab] = useState<Tab>('intelligence');

  const tabs = [
    { id: 'intelligence', label: 'الذكاء التنفيذي', icon: <ShieldCheck size={16} /> },
    { id: 'dashboard', label: 'لوحة القيادة', icon: <BarChart3 size={16} /> },
    { id: 'insights', label: 'تحليلات التعلم AI', icon: <Lightbulb size={16} /> },
    { id: 'trends', label: 'مراقبة الترند', icon: <TrendingUp size={16} /> },
  ];

  return (
    <div className="flex h-full gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="w-64 shrink-0 flex flex-col gap-6">
        <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 p-6 rounded-3xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 blur-3xl rounded-full"></div>
          <BarChart2 size={32} className="text-purple-400 mb-4 relative z-10" />
          <h2 className="text-xl font-black text-white relative z-10">تحليلات الذكاء</h2>
          <p className="text-xs text-purple-300/70 mt-2 relative z-10 leading-relaxed font-medium">تحليل، فهم، وتحسين المحتوى باستمرار عبر نظام التعلم الذكي.</p>
        </div>

        <nav className="flex flex-col gap-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                activeTab === tab.id 
                  ? 'bg-slate-800 text-white shadow-lg border border-slate-700' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <span className={activeTab === tab.id ? 'text-purple-400' : 'text-slate-500'}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex-1 bg-slate-900/50 border border-slate-800 rounded-[32px] p-8 overflow-y-auto custom-scrollbar">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {activeTab === 'intelligence' && <IntelligenceDashboard />}
            {activeTab === 'dashboard' && <DashboardTab />}
            {activeTab === 'insights' && <InsightsTab />}
            {activeTab === 'trends' && <TrendsTab />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
