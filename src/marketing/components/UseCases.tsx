import React from "react";
import { CheckCircle2, Building, User, PenTool, LayoutTemplate } from "lucide-react";
import { cn } from "../../lib/utils";

export function UseCases() {
  return (
    <section id="usecases" className="py-24 relative z-10 bg-slate-900/20 border-y border-slate-800/50">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="flex flex-col md:flex-row items-center justify-between mb-16 gap-8">
          <div className="max-w-2xl">
            <h2 className="text-3xl md:text-5xl font-black text-white mb-6">صُمم ليتناسب مع حجم طموحك</h2>
            <p className="text-lg text-slate-400 font-medium leading-relaxed">
              سواء كنت صانع محتوى مستقل يبحث عن توفير وقته، أو وكالة تسويق تدير حسابات لعشرات العلامات التجارية، النظام يتكيف معك تماماً.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <UseCaseCard 
            title="وكالات التسويق" 
            icon={<Building size={24} />}
            color="indigo"
            desc="إدارة مساحات عمل منفصلة لكل عميل، توزيع الأدوار بين أعضاء الفريق، وإرسال المحتوى للعميل للموافقة بنقرة واحدة."
            features={["Client Mode", "Approval Pipeline", "White-label Analytics"]}
          />
          <UseCaseCard 
            title="صناع المحتوى" 
            icon={<User size={24} />}
            color="rose"
            desc="دماغ إضافي لك. توليد الأفكار، كتابة السكربتات، وجدولة المحتوى على تيك توك ويوتيوب تلقائياً دون تشتت."
            features={["AI Copilot", "Viral Ideas", "Cross-posting"]}
          />
          <UseCaseCard 
            title="الشركات والبراندات" 
            icon={<PenTool size={24} />}
            color="emerald"
            desc="حافظ على هوية علامتك التجارية في كل منشور يتم توليده. تخصيص قواميس الكلمات الكلمات ونبرة الصوت بصرامة."
            features={["Brand Voices", "Custom Dictionaries", "Team Sync"]}
          />
        </div>
      </div>
    </section>
  );
}

function UseCaseCard({ title, icon, color, desc, features }: any) {
  const colors = {
    indigo: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
    rose: "text-rose-400 bg-rose-500/10 border-rose-500/20",
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  }
  
  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-[32px] p-8 hover:-translate-y-2 transition-transform duration-300 flex flex-col h-full">
      <div className={cn("inline-flex p-4 rounded-2xl mb-6", colors[color as keyof typeof colors])}>
        {icon}
      </div>
      <h3 className="text-2xl font-bold text-white mb-4">{title}</h3>
      <p className="text-slate-400 font-medium leading-relaxed mb-8 flex-1">
        {desc}
      </p>
      
      <div className="space-y-3 pt-6 border-t border-slate-800/80">
        {features.map((f: string, i: number) => (
          <div key={i} className="flex items-center gap-3 text-sm font-bold text-slate-300">
            <CheckCircle2 size={16} className={colors[color as keyof typeof colors].split(" ")[0]} />
            {f}
          </div>
        ))}
      </div>
    </div>
  )
}
