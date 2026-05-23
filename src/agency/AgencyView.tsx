import React, { useState } from "react";
import { Users, Briefcase, Activity, CreditCard, LayoutDashboard } from "lucide-react";
import { cn } from "../lib/utils";
import { AgencyDashboard } from "./AgencyDashboard";
import { TeamManager } from "./TeamManager";
import { ClientManager } from "./ClientManager";
import { ActivityTimeline } from "./ActivityTimeline";
import { BillingView } from "./BillingView";

export function AgencyView() {
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "team" | "clients" | "activity" | "billing"
  >("dashboard");

  const tabs = [
    { id: "dashboard", label: "لوحة الوكالة", icon: <LayoutDashboard size={16} /> },
    { id: "team", label: "إدارة الفريق", icon: <Users size={16} /> },
    { id: "clients", label: "العملاء والمساحات", icon: <Briefcase size={16} /> },
    { id: "activity", label: "سجل النشاط", icon: <Activity size={16} /> },
    { id: "billing", label: "الاشتراكات", icon: <CreditCard size={16} /> },
  ] as const;

  return (
    <div className="flex flex-col h-full bg-slate-950 p-6 overflow-hidden">
      <header className="flex justify-between items-center shrink-0 mb-6 relative z-10">
        <div className="flex items-center gap-1 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800/80 shadow-sm backdrop-blur-sm">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all",
                activeTab === tab.id
                  ? "bg-slate-800 text-white shadow-md shadow-slate-900/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        {activeTab === "dashboard" && <AgencyDashboard onNavigate={setActiveTab} />}
        {activeTab === "team" && <TeamManager />}
        {activeTab === "clients" && <ClientManager />}
        {activeTab === "activity" && <ActivityTimeline />}
        {activeTab === "billing" && <BillingView />}
      </div>
    </div>
  );
}
