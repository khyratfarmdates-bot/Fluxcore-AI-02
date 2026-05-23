import React, { useState } from 'react';
import { UnifiedOperationsDashboard } from './UnifiedOperationsDashboard';
import { WorkflowList } from './WorkflowList';
import { WorkflowBuilder } from './WorkflowBuilder';
import { ActivityLogs } from './ActivityLogs';
import { Workflow } from './types';
import { LayoutDashboard, Zap, History, Settings2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

type Tab = 'dashboard' | 'workflows' | 'logs';

export function AutomationView() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);

  if (editingWorkflow) {
    return <WorkflowBuilder workflow={editingWorkflow} onBack={() => setEditingWorkflow(null)} />;
  }

  const tabs = [
    { id: 'dashboard', label: 'المركز التشغيلي', icon: <LayoutDashboard size={18} /> },
    { id: 'workflows', label: 'سير العمل', icon: <Zap size={18} /> },
    { id: 'logs', label: 'سجل النشاط', icon: <History size={18} /> },
  ];

  return (
    <div className="h-full flex flex-col gap-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between shrink-0">
        <div className="flex bg-slate-900/50 p-1 rounded-2xl border border-slate-800">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={cn(
                "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
                activeTab === tab.id 
                  ? "bg-slate-800 text-white shadow-lg border border-slate-700" 
                  : "text-slate-500 hover:text-slate-300"
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {activeTab === 'dashboard' && <UnifiedOperationsDashboard />}
            {activeTab === 'workflows' && <WorkflowList onEdit={setEditingWorkflow} />}
            {activeTab === 'logs' && <ActivityLogs />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
