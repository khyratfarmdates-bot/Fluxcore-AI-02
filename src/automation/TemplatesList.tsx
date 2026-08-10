import React from 'react';
import { Workflow } from './types';
import { Sparkles, CalendarClock, TrendingUp, MonitorPlay, Presentation, Search, Database } from 'lucide-react';

const templates: { icon: any, color: string, template: Partial<Workflow> }[] = [
  {
    icon: <MonitorPlay size={24} />,
    color: 'emerald',
    template: {
      title: 'Daily TikTok Generator',
      description: 'يقوم بمراقبة الترند يومياً وبناء أفكار ونصوص لفيديوهات تيك توك جاهزة للتصوير.',
      steps: [
        { id: '1', type: 'trigger', actionOrTriggerType: 'Schedule', title: 'تشغيل يومي (09:00 ص)', config: {} },
        { id: '2', type: 'action', actionOrTriggerType: 'AnalyzeContent', title: 'تحليل ترند تيك توك', config: {} },
        { id: '3', type: 'action', actionOrTriggerType: 'GenerateScript', title: 'كتابة النص والخطاف', config: {} }
      ]
    }
  },
  {
    icon: <CalendarClock size={24} />,
    color: 'blue',
    template: {
      title: 'Auto Instagram Captions',
      description: 'عند رفع صورة للقسم، يقوم بكتابة كابشن احترافي مع الهاشتاغات وتخزينه كمسودة.',
      steps: [
        { id: '1', type: 'trigger', actionOrTriggerType: 'NewContent', title: 'عند إضافة وسائط جديدة', config: {} },
        { id: '2', type: 'action', actionOrTriggerType: 'GenerateCaption', title: 'توليد كابشن تفاعلي', config: {} },
        { id: '3', type: 'action', actionOrTriggerType: 'SaveDraft', title: 'حفظ كمسودة للنشر', config: {} }
      ]
    }
  },
  {
    icon: <TrendingUp size={24} />,
    color: 'amber',
    template: {
      title: 'Trend Based X Thread',
      description: 'يقرأ الأخبار اليومية المهمة في مجالك ويصيغها بشكل ثريد قوي على X.',
      steps: [
        { id: '1', type: 'trigger', actionOrTriggerType: 'Trend', title: 'عند اكتشاف ترند جديد', config: {} },
        { id: '2', type: 'action', actionOrTriggerType: 'GenerateContent', title: 'بناء الثريد', config: {} },
        { id: '3', type: 'action', actionOrTriggerType: 'SendNotification', title: 'تنبيه للمراجعة قبل النشر', config: {} }
      ]
    }
  },
  {
    icon: <Presentation size={24} />,
    color: 'pink',
    template: {
      title: 'AI Marketing Campaign',
      description: 'تدفق عمل كامل يبني أفكار ونصوص وإعلانات لحملة تسويقية متكاملة.',
      steps: [
        { id: '1', type: 'trigger', actionOrTriggerType: 'ManualIdea', title: 'إدخال فكرة الحملة', config: {} },
        { id: '2', type: 'action', actionOrTriggerType: 'GenerateContent', title: 'توليد أفكار المحتوى', config: {} },
        { id: '3', type: 'action', actionOrTriggerType: 'GenerateScript', title: 'كتابة الإعلانات', config: {} }
      ]
    }
  },
  {
    icon: <Search size={24} />,
    color: 'emerald',
    template: {
      title: 'SEO Audit & Google Sheets',
      description: 'يقوم بمراقبة سيو متجرك، وتحديث الكلمات المفتاحية الاستخباراتية وتنزيلها بـ Google Sheets تلقائياً.',
      steps: [
        { id: '1', type: 'trigger', actionOrTriggerType: 'Schedule', title: 'تشغيل أسبوعي تلقائي', config: {} },
        { id: '2', type: 'action', actionOrTriggerType: 'AnalyzeContent', title: 'فحص SEO شامل', config: {} },
        { id: '3', type: 'action', actionOrTriggerType: 'SaveDraft', title: 'حفظ التقرير في Google Sheets', config: {} }
      ]
    }
  },
  {
    icon: <Database size={24} />,
    color: 'blue',
    template: {
      title: 'Shopify Sales Alert & Telegram',
      description: 'تتبع صفقات ومبيعات متجر Shopify، وإرسال تنبيه Telegram فوري للبراند وصياغة تهنئة مميزة.',
      steps: [
        { id: '1', type: 'trigger', actionOrTriggerType: 'NewContent', title: 'عند حدوث بيعة جديدة', config: {} },
        { id: '2', type: 'action', actionOrTriggerType: 'GenerateCaption', title: 'توليد رسالة تهنئة للعميل', config: {} },
        { id: '3', type: 'action', actionOrTriggerType: 'SendNotification', title: 'تنبيه Telegram وتحديث السجلات', config: {} }
      ]
    }
  },
  {
    icon: <Sparkles size={24} />,
    color: 'pink',
    template: {
      title: 'AI Brand Character Media Auto-Gen',
      description: 'أتمتة صناعة وتوليد الصور الإعلانية الترويجية والفيديوهات المجدولة استناداً إلى ملف السمات البصرية والأفاتار الموحد لعلامتك التجارية لضمان اتساق مذهل للشخصيات وجودة فائقة.',
      steps: [
        { id: '1', type: 'trigger', actionOrTriggerType: 'Schedule', title: 'تشغيل مجدول يومي تلقائي', config: {} },
        { id: '2', type: 'action', actionOrTriggerType: 'AnalyzeContent', title: 'استدعاء السمات البصرية للأفاتار', config: {} },
        { id: '3', type: 'action', actionOrTriggerType: 'GenerateContent', title: 'توليد الصور الإعلانية وحفظها كأصل في المكتبة', config: {} }
      ]
    }
  }
];

export function TemplatesList({ onUse }: { onUse: (w: Workflow) => void }) {
  const colors: Record<string, string> = {
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    pink: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-black text-white">قوالب جاهزة للأتمتة</h3>
        <p className="text-sm text-slate-400 mt-1">ابدأ بسرعة مع تدفقات عمل مصممة مسبقاً</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map((t, idx) => (
          <div key={idx} className="bg-slate-950 border border-slate-800 p-6 rounded-3xl flex flex-col gap-4 items-start hover:border-slate-700 transition-colors">
            <div className={`p-4 rounded-2xl border ${colors[t.color]}`}>
              {t.icon}
            </div>
            <div>
              <h4 className="font-bold text-white text-lg mb-2">{t.template.title}</h4>
              <p className="text-sm text-slate-400 leading-relaxed">{t.template.description}</p>
            </div>
            
            <div className="w-full flex items-center gap-2 mt-4 pt-4 border-t border-slate-800/50 overflow-x-auto pb-2 scrollbar-hide">
              {t.template.steps?.map((step, i) => (
                <React.Fragment key={i}>
                  <div className="shrink-0 text-[10px] font-bold uppercase py-1 px-2 bg-slate-800 text-slate-300 rounded-md whitespace-nowrap">
                    {step.title}
                  </div>
                  {i < t.template.steps!.length - 1 && <span className="text-slate-600 shrink-0">→</span>}
                </React.Fragment>
              ))}
            </div>

            <button 
              onClick={() => onUse({
                id: Date.now().toString(),
                brandId: '', // Will be assigned by workspace context when saved
                title: t.template.title || '',
                description: t.template.description || '',
                active: false,
                status: 'Idle',
                steps: t.template.steps as any
              })}
              className="mt-2 w-full flex items-center justify-center gap-2 bg-indigo-600/10 text-indigo-400 hover:bg-indigo-600 hover:text-white py-3 rounded-xl font-bold transition-all"
            >
              <Sparkles size={16} /> استخدام القالب
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
