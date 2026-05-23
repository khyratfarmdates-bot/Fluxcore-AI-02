import React from "react";
import { cn } from "../../lib/utils";

const STYLES = [
  { id: "realistic", label: "واقعي (Photorealistic)", thumb: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?q=80&w=2070&auto=format&fit=crop" },
  { id: "cinematic", label: "سينمائي", thumb: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=2025&auto=format&fit=crop" },
  { id: "anime", label: "أنيمي", thumb: "https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=1974&auto=format&fit=crop" },
  { id: "3d", label: "3D (Pixar Style)", thumb: "https://images.unsplash.com/photo-1618336753974-aae8e04506aa?q=80&w=2070&auto=format&fit=crop" },
  { id: "minimal", label: "بسيط مينيمل", thumb: "https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?q=80&w=2067&auto=format&fit=crop" },
];

export function AIStylesSelect({ selected, onChange }: { selected: string; onChange: (id: string) => void }) {
  return (
    <div className="flex gap-3 overflow-x-auto custom-scrollbar pb-2 pt-1 px-1">
      {STYLES.map((style) => (
        <button
          key={style.id}
          onClick={() => onChange(style.id)}
          className={cn(
            "relative w-28 h-20 shrink-0 rounded-2xl overflow-hidden border-2 transition-all p-0 text-left group",
            selected === style.id ? "border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.4)]" : "border-slate-800 hover:border-slate-600"
          )}
        >
          <img src={style.thumb} alt={style.label} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent"></div>
          <div className="absolute bottom-2 left-2 right-2 text-[10px] font-bold text-white text-center leading-tight">
            {style.label}
          </div>
        </button>
      ))}
    </div>
  );
}
