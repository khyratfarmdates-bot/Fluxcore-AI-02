import React, { useState } from "react";
import { PenTool, Calendar, ListTodo, CheckSquare, Image as ImageIcon } from "lucide-react";
import { UnifiedPostManager } from "./UnifiedPostManager";
import { CalendarView } from "./CalendarView";
import { PublishingQueue } from "./PublishingQueue";
import { ApprovalWorkflow } from "./ApprovalWorkflow";
import { MediaLibrary } from "./MediaLibrary";
import { cn } from "../lib/utils";

export function PublishingView() {
  const [activeTab, setActiveTab] = useState<
    "manager" | "calendar" | "queue" | "approvals" | "media"
  >("manager");

  const tabs = [
    { id: "manager", label: "مدير النشر", icon: <PenTool size={16} /> },
    { id: "calendar", label: "التقويم", icon: <Calendar size={16} /> },
    { id: "queue", label: "قائمة الانتظار", icon: <ListTodo size={16} /> },
    { id: "approvals", label: "الموافقات", icon: <CheckSquare size={16} /> },
    { id: "media", label: "مكتبة الوسائط", icon: <ImageIcon size={16} /> },
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
        {activeTab === "manager" && <UnifiedPostManager onOpenCalendar={() => setActiveTab("calendar")} />}
        {activeTab === "calendar" && <CalendarView />}
        {activeTab === "queue" && <PublishingQueue />}
        {activeTab === "approvals" && <ApprovalWorkflow />}
        {activeTab === "media" && <MediaLibrary />}
      </div>
    </div>
  );
}
