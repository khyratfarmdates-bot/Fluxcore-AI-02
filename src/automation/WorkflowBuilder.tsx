import React, { useState } from 'react';
import { Workflow, WorkflowStep, TriggerType, ActionType } from './types';
import { ArrowLeft, Plus, Save, Settings, Trash2, Zap, Clock, TrendingUp, PlaySquare, Image as ImageIcon, CheckCircle, Target, FileText, Hash, Send, BarChart2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '../lib/soundToast';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { automationService } from '../services/automation';

import { validateWorkflow } from '../lib/validation';

export function WorkflowBuilder({ workflow, onBack }: { workflow: Workflow, onBack: () => void }) {
  const [currentWorkflow, setCurrentWorkflow] = useState<Workflow>(workflow);
  const [activeNode, setActiveNode] = useState<string | null>(null);
  const { activeBrand } = useWorkspace();
  const [saving, setSaving] = useState(false);

  const addNode = (type: 'trigger' | 'action') => {
    const newNode: WorkflowStep = {
      id: Date.now().toString(),
      type,
      actionOrTriggerType: type === 'trigger' ? 'Schedule' : 'GenerateContent',
      title: type === 'trigger' ? 'مشغل جديد' : 'إجراء جديد',
      config: {}
    };
    setCurrentWorkflow({
      ...currentWorkflow,
      steps: [...currentWorkflow.steps, newNode]
    });
    setActiveNode(newNode.id);
  };

  const updateNode = (id: string, updates: Partial<WorkflowStep>) => {
    setCurrentWorkflow({
      ...currentWorkflow,
      steps: currentWorkflow.steps.map(s => s.id === id ? { ...s, ...updates } : s)
    });
  };

  const removeNode = (id: string) => {
    setCurrentWorkflow({
      ...currentWorkflow,
      steps: currentWorkflow.steps.filter(s => s.id !== id)
    });
    if (activeNode === id) setActiveNode(null);
  };

  const saveWorkflow = async () => {
    const errors = validateWorkflow(currentWorkflow);
    if (errors.length > 0) {
      errors.forEach(e => toast.error(e));
      return;
    }

    if (!activeBrand) return;
    setSaving(true);
    try {
      const isNew = !workflow.title || workflow.id.length > 15; // Checking if it's a mock temp ID
      
      const workflowData = {
        ...currentWorkflow,
        brandId: activeBrand.id,
      };

      if (workflow.id && !isNew) {
        await automationService.update(workflow.id, workflowData);
      } else {
        await automationService.create(workflowData);
      }
      
      toast.success('تم حفظ الأتمتة بنجاح');
      onBack();
    } catch(err:any) {
      toast.error('خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-full gap-6 relative animate-in fade-in zoom-in-95 duration-300">
      
      {/* Builder Canvas area */}
      <div className="flex-1 flex flex-col bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden relative">
        {/* Header */}
        <div className="h-20 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-6 flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 transition-colors">
              <ArrowLeft size={20} />
            </button>
            <div className="flex flex-col">
              <input 
                type="text" 
                value={currentWorkflow.title}
                onChange={e => setCurrentWorkflow({...currentWorkflow, title: e.target.value})}
                className="bg-transparent text-lg font-black text-white focus:outline-none border-b border-transparent focus:border-indigo-500/50"
                placeholder="اسم الأتمتة"
              />
              <span className="text-[10px] text-emerald-500 uppercase tracking-widest font-bold">حالة التعديل النشط</span>
            </div>
          </div>
          <button onClick={saveWorkflow} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/20">
            <Save size={18} /> حفظ وتفعيل
          </button>
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-y-auto p-12 flex flex-col items-center custom-scrollbar relative">
          
          <div className="w-[2px] bg-slate-800 absolute top-12 bottom-12 left-1/2 -translate-x-1/2 z-0"></div>

          <div className="w-full max-w-xl relative flex flex-col gap-6 z-10">
            <AnimatePresence>
              {currentWorkflow.steps.map((step, index) => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  key={step.id} 
                  className={`bg-slate-950 border-2 rounded-2xl p-4 flex gap-4 items-center group cursor-pointer transition-all ${activeNode === step.id ? (step.type === 'trigger' ? 'border-amber-500/50 shadow-lg shadow-amber-500/10' : 'border-indigo-500/50 shadow-lg shadow-indigo-500/10') : 'border-slate-800 hover:border-slate-700'}`}
                  onClick={() => setActiveNode(step.id)}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${step.type === 'trigger' ? 'bg-amber-500/10 text-amber-500' : 'bg-indigo-500/10 text-indigo-400'}`}>
                    {step.type === 'trigger' ? <Zap size={24} /> : <Target size={24} />}
                  </div>
                  
                  <div className="flex-1">
                    <span className="text-[10px] uppercase font-black tracking-widest text-slate-500 mb-1 block">
                      {step.type === 'trigger' ? 'المشغل (Trigger)' : `إجراء (Step ${index})`}
                    </span>
                    <h4 className="font-bold text-white mb-1">{step.title}</h4>
                    <p className="text-xs text-slate-400">{step.actionOrTriggerType}</p>
                  </div>

                  <button 
                    onClick={(e) => { e.stopPropagation(); removeNode(step.id); }}
                    className="p-2 text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
            
            <div className="flex justify-center mt-4">
              {currentWorkflow.steps.length === 0 ? (
                <button 
                  onClick={() => addNode('trigger')}
                  className="flex flex-col items-center gap-3 p-8 border-2 border-dashed border-slate-700 hover:border-amber-500 rounded-3xl text-slate-500 hover:text-amber-500 transition-colors w-full group"
                >
                  <div className="w-16 h-16 rounded-full bg-slate-800 group-hover:bg-amber-500/20 flex items-center justify-center transition-colors">
                    <Zap size={24} />
                  </div>
                  <span className="font-bold">إضافة مشغل (Trigger) لبدء سير العمل</span>
                </button>
              ) : (
                <button 
                  onClick={() => addNode('action')}
                  className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-indigo-600/20 border border-slate-700 hover:border-indigo-500/50 text-slate-300 hover:text-indigo-400 rounded-full font-bold transition-all z-10 shadow-xl"
                >
                  <Plus size={18} /> إضافة خطوة جديدة
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Configuration Sidebar */}
      <AnimatePresence>
        {activeNode && (
          <motion.div 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 340, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="shrink-0 bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden flex flex-col"
          >
            {currentWorkflow.steps.map(step => {
              if (step.id !== activeNode) return null;
              
              const isTrigger = step.type === 'trigger';

              return (
                <React.Fragment key={step.id}>
                  <div className={`p-4 border-b border-slate-800 flex items-center gap-3 ${isTrigger ? 'bg-amber-500/5' : 'bg-indigo-500/5'}`}>
                    <Settings className={isTrigger ? 'text-amber-500' : 'text-indigo-500'} size={20} />
                    <div>
                      <h3 className="font-black text-white">إعدادات {isTrigger ? 'المشغل' : 'الإجراء'}</h3>
                      <p className="text-[10px] text-slate-400">تخصيص الخصائص والمتغيرات</p>
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-5 space-y-6">
                    <div className="space-y-2">
                       <label className="text-xs font-bold uppercase tracking-widest text-slate-400">الاسم الظاهر</label>
                       <input 
                         type="text" 
                         value={step.title}
                         onChange={(e) => updateNode(step.id, { title: e.target.value })}
                         className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50"
                       />
                    </div>

                    <div className="space-y-2">
                       <label className="text-xs font-bold uppercase tracking-widest text-slate-400">النوع</label>
                       <select 
                         value={step.actionOrTriggerType}
                         onChange={(e) => updateNode(step.id, { actionOrTriggerType: e.target.value as any })}
                         className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50"
                       >
                         {isTrigger ? (
                           <>
                             <option value="Schedule">جدول زمني (Schedule)</option>
                             <option value="Trend">ترند جديد (Trend Alert)</option>
                             <option value="NewContent">محتوى جديد (New Content)</option>
                             <option value="ManualIdea">إدخال يدوي للفكرة</option>
                           </>
                         ) : (
                           <>
                             <option value="GenerateContent">توليد محتوى</option>
                             <option value="GenerateScript">توليد سكربت/نص</option>
                             <option value="GenerateCaption">توليد كابشن</option>
                             <option value="AnalyzeContent">تحليل أداء/ترند</option>
                             <option value="SaveDraft">حفظ كمسودة</option>
                             <option value="PublishPost">نشر تلقائي</option>
                             <option value="SendNotification">إرسال تنبيه</option>
                           </>
                         )}
                       </select>
                    </div>
                    
                    {/* Real config fields based on type */}
                    <div className="p-4 bg-slate-950/50 border border-slate-800/50 rounded-2xl space-y-4">
                       {step.actionOrTriggerType === 'Schedule' && (
                         <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-500 uppercase">تكرار التنفيذ</label>
                           <select 
                             value={step.config.frequency || 'daily'} 
                             onChange={(e) => updateNode(step.id, { config: { ...step.config, frequency: e.target.value } })}
                             className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 px-3 text-xs text-white"
                           >
                             <option value="hourly">كل ساعة</option>
                             <option value="daily">يومياً</option>
                             <option value="weekly">أسبوعياً</option>
                           </select>
                         </div>
                       )}

                       {step.actionOrTriggerType === 'GenerateContent' && (
                         <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-500 uppercase">قالب الذكاء الاصطناعي</label>
                           <select 
                             value={step.config.template || 'standard'} 
                             onChange={(e) => updateNode(step.id, { config: { ...step.config, template: e.target.value } })}
                             className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 px-3 text-xs text-white"
                           >
                             <option value="creative">إبداعي (Creative)</option>
                             <option value="educational">تعليمي (Educational)</option>
                             <option value="promotional">تسويقي (Promotional)</option>
                           </select>
                         </div>
                       )}

                       {step.actionOrTriggerType === 'PublishPost' && (
                         <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-500 uppercase">المنصة المستهدفة</label>
                           <select 
                             value={step.config.platform || 'twitter'} 
                             onChange={(e) => updateNode(step.id, { config: { ...step.config, platform: e.target.value } })}
                             className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 px-3 text-xs text-white"
                           >
                             <option value="twitter">Twitter (X)</option>
                             <option value="instagram">Instagram</option>
                             <option value="linkedin">LinkedIn</option>
                           </select>
                         </div>
                       )}

                       {!['Schedule', 'GenerateContent', 'PublishPost'].includes(step.actionOrTriggerType) && (
                         <div className="text-center text-slate-500 text-[10px] py-4 italic">
                           إعدادات افتراضية مفعلة لـ {step.actionOrTriggerType}
                         </div>
                       )}
                    </div>
                  </div>
                </React.Fragment>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
