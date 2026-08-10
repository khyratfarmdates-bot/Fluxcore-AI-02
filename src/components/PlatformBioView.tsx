import React from 'react';
import { motion } from 'framer-motion';
import { 
  Sparkles, Cpu, Bot, ShieldCheck, Zap, 
  Search, Flag, Layers, Globe, CheckCircle2, Award
} from 'lucide-react';

const SparklesIcon = Sparkles as any;
const CpuIcon = Cpu as any;
const BotIcon = Bot as any;
const ShieldCheckIcon = ShieldCheck as any;
const ZapIcon = Zap as any;
const SearchIcon = Search as any;
const FlagIcon = Flag as any;
const LayersIcon = Layers as any;
const GlobeIcon = Globe as any;
const CheckCircle2Icon = CheckCircle2 as any;
const AwardIcon = Award as any;

export function PlatformBioView() {
  const agentList = [
    {
      title: "وكيل الذكاء التسويقي وتصدر محركات البحث (SEO & Google Intelligence)",
      desc: "يقوم بفحص السيو البنيوي، تحليل نية البحث، اكتشاف الكلمات المفتاحية الاستراتيجية، ومنافسة النتائج الأولى على جوجل.",
      icon: <SearchIcon className="w-6 h-6 text-cyan-400" />
    },
    {
      title: "وكيل إعلانات جوجل وتخطيط الحملات (Google Ads & Autonomous Campaigns)",
      desc: "يقوم بصياغة الإعلانات عالية التحويل، استهداف الجمهور التجاري، ومراقبة جودة صفحات الهبوط ومعدل التحويل (E-E-A-T).",
      icon: <FlagIcon className="w-6 h-6 text-indigo-400" />
    },
    {
      title: "الوكيل التنفيذي والنواة العصبية (Executive AIOS Kernel)",
      desc: "المساعد الإداري الذي يربط بين جميع أدوات المنصة، ينفذ المهام التلقائية، ويدير الهوية البصرية وصوت العلامة التجاري.",
      icon: <CpuIcon className="w-6 h-6 text-purple-400" />
    },
    {
      title: "مساعد الرفيق الحي والتفاعل المكاني 3D (Spatial & Living Companion)",
      desc: "التفاعل اللحظي بالصوت والمكان في بيئة ثلاثية الأبعاد وتقديم التوجيه الحقيقي أثناء العمل.",
      icon: <BotIcon className="w-6 h-6 text-emerald-400" />
    }
  ];

  const coreCapabilities = [
    "توليد المحتوى التسويقي والنصوص الإعلانية والسيناريوهات المتقدمة.",
    "جدولة والنشر التلقائي الموحد عبر المنصات الاجتماعية المعتمدة.",
    "مختبر الوسائط بالذكاء الاصطناعي وصناعة الصور والبرومبتات الفنية.",
    "قوالب أتمتة الأعمال السحابية وتكاملات المتاجر الإلكترونية (سلة، شوبيفاي، Google Sheets).",
    "لوحة تحكم إدارية شاملة ومراقبة ميزانيات الاستهلاك واستهلاك الـ API."
  ];

  return (
    <div className="min-h-full bg-slate-950 text-slate-100 p-6 md:p-10 space-y-10 font-sans" dir="rtl">
      {/* Header Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900/60 via-purple-900/40 to-slate-900/80 p-8 md:p-12 border border-indigo-500/20 shadow-2xl backdrop-blur-xl"
      >
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
            <SparklesIcon className="w-4 h-4 text-indigo-400" />
            <span>السيرة الذاتية والنشرة التعريفية الرسمية</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white italic">
            منصة <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400">Fluxcore AI 02</span>
          </h1>
          <p className="text-slate-300 text-base md:text-lg leading-relaxed">
            الجيل المتقدم من منصات الذكاء الاصطناعي الإدارية والتسويقية والمستقلة، المصممة لقيادة العلامات التجارية والمتاجر الإلكترونية ونماذج الذكاء المستقل بكفاءة عالية.
          </p>
        </div>
      </motion.div>

      {/* Overview Specs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-indigo-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">اسم النظام</span>
            <AwardIcon className="w-5 h-5" />
          </div>
          <p className="text-xl font-bold text-white">Fluxcore AI 02</p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-purple-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">الإصدار المعماري</span>
            <LayersIcon className="w-5 h-5" />
          </div>
          <p className="text-xl font-bold text-white">v0.0.0 (Enterprise Multi-Agent)</p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">محركات AI المدمجة</span>
            <ZapIcon className="w-5 h-5" />
          </div>
          <p className="text-xl font-bold text-white">Gemini 1.5 + OpenAI + Fal.ai</p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-cyan-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">البيئة وقاعدة البيانات</span>
            <GlobeIcon className="w-5 h-5" />
          </div>
          <p className="text-xl font-bold text-white">Firebase Firestore + Express Node</p>
        </div>
      </div>

      {/* Agents Resume Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <BotIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">فريق الوكلاء المستقلين (Agents Roster)</h2>
            <p className="text-slate-400 text-sm">منظومة الوكلاء المدمجين في نواة Fluxcore AI 02 ووظائفهم التخصصية</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {agentList.map((ag, i) => (
            <motion.div 
              key={i}
              whileHover={{ y: -4 }}
              className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-indigo-500/30 transition-all space-y-3"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                  {ag.icon}
                </div>
                <h3 className="font-bold text-white text-base leading-snug">{ag.title}</h3>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed pr-2">
                {ag.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Key Capabilities */}
      <div className="p-8 rounded-3xl bg-slate-900/40 border border-slate-800 space-y-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <ShieldCheckIcon className="w-6 h-6 text-indigo-400" />
          <span>إمكانيات المنصة ووظائف الأتمتة الرئيسية</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {coreCapabilities.map((cap, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <CheckCircle2Icon className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <span className="text-slate-200 text-sm">{cap}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
