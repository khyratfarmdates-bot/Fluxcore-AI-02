import React, { useState, useEffect } from "react";
import { 
  Network, 
  Share2, 
  Link2, 
  Activity, 
  Database, 
  Search,
  Maximize2,
  Box,
  Layers,
  Cpu,
  Compass,
  Zap,
  GitBranch,
  History,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  Award,
  Loader2
} from "lucide-react";
import { cn } from "../lib/utils";
import { knowledgeGraph, KnowledgeEntity, KnowledgeRelationship } from "./knowledge/KnowledgeGraphService";
import { safeStringify } from "../lib/safe-stringify";
import { useWorkspace } from "../contexts/WorkspaceContext";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "../lib/soundToast";

export function KnowledgeVisualizationDashboard() {
  const { activeBrand } = useWorkspace();
  const [graphData, setGraphData] = useState<{ nodes: KnowledgeEntity[], links: KnowledgeRelationship[] }>({ nodes: [], links: [] });
  const [selectedNode, setSelectedNode] = useState<KnowledgeEntity | null>(null);
  const [loading, setLoading] = useState(true);
  const [nodePositions, setNodePositions] = useState<Record<string, { x: number, y: number }>>({});
  const [searchTerm, setSearchTerm] = useState("");

  const fetchGraph = async (showToast = false) => {
    if (!activeBrand) return;
    setLoading(true);
    try {
      let data = await knowledgeGraph.getWorkspaceGraph(activeBrand.id);
      
      // آلية البذر التلقائي الذكية (Auto-Seeding Engine)
      // إذا كانت قاعدة المعرفة فارغة للعلامة التجارية، نبذر فوراً شبكة معرفية تأسيسية متكاملة لتبهر المستخدم
      if (data.nodes.length === 0) {
        if (showToast) toast.info("جاري تهيئة وبذر شبكة المعرفة الذكية لأول مرة...");
        
        // 1. بذر العقد الأساسية
        const brandNode = await knowledgeGraph.addEntity(
          activeBrand.id, 
          'system', 
          activeBrand.name, 
          { description: "النظام العصبي المركزي والعقل التشغيلي لهويتك الرقمية.", status: "active", coreVersion: "v2.5" }, 
          'CRITICAL'
        );
        
        const campaignNode = await knowledgeGraph.addEntity(
          activeBrand.id, 
          'campaign', 
          "حملة تمور الخير الموسمية", 
          { targetGoal: "زيادة مبيعات رمضان والوصول لـ 50 ألف مستهلك", budget: "1500$", expectedROI: "340%" }, 
          'HIGH'
        );
        
        const contentNode = await knowledgeGraph.addEntity(
          activeBrand.id, 
          'content', 
          "فيديو التمور الفاخرة بالذكاء 🎥", 
          { contentType: "video", duration: "15s", voicePersona: "وضاح اليماني", visualStyle: "realistic" }, 
          'MEDIUM'
        );
        
        const platformNode = await knowledgeGraph.addEntity(
          activeBrand.id, 
          'platform', 
          "حساب WhatsApp التسويقي", 
          { status: "connected", apiVersion: "v18.0", dailyQuota: "5000 msg" }, 
          'HIGH'
        );
        
        const decisionNode = await knowledgeGraph.addEntity(
          activeBrand.id, 
          'decision', 
          "استهداف الجمهور اليمني والخليجي", 
          { reason: "تحليل الكثافة الاستهلاكية ومؤشرات تفاعل حملة التمور السابقة", confidence: "94%" }, 
          'CRITICAL'
        );
        
        const processNode = await knowledgeGraph.addEntity(
          activeBrand.id, 
          'process', 
          "أتمتة جدولة النشر الصباحي", 
          { frequency: "daily", trigger: "08:00 AM", autoPost: true }, 
          'LOW'
        );

        // 2. ربط العلاقات وتأسيس الشبكة المضيئة
        await knowledgeGraph.linkEntities(activeBrand.id, campaignNode, brandNode, "PART_OF", 0.95, { relationship: "حملة أساسية للعلامة التجارية" });
        await knowledgeGraph.linkEntities(activeBrand.id, contentNode, campaignNode, "DERIVED_FROM", 0.88, { relationship: "محتوى إعلاني تم توليده للحملة" });
        await knowledgeGraph.linkEntities(activeBrand.id, platformNode, brandNode, "TARGETS", 0.85, { relationship: "قناة النشر والتفاعل الرسمية" });
        await knowledgeGraph.linkEntities(activeBrand.id, contentNode, platformNode, "EXECUTED_BY", 0.9, { relationship: "يتم إرساله وتوزيعه عبر القناة" });
        await knowledgeGraph.linkEntities(activeBrand.id, decisionNode, campaignNode, "AFFECTS", 0.97, { relationship: "القرار الاستراتيجي الموجه للجمهور" });
        await knowledgeGraph.linkEntities(activeBrand.id, processNode, contentNode, "TRIGGERED", 0.75, { relationship: "عملية الأتمتة المبرمجة لنشر المحتوى" });

        // إعادة السحب بعد البذر
        data = await knowledgeGraph.getWorkspaceGraph(activeBrand.id);
        if (showToast) toast.success("تم تأسيس وبذر شبكة المعرفة التشغيلية بنجاح! 🌐✨");
      }

      setGraphData(data);
    } catch (e) {
      console.error(e);
      toast.error("فشل سحب شبكة المعرفة");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGraph(true);
  }, [activeBrand]);

  // حساب وتوزيع الإحداثيات الابتدائية للعقد بشكل دائري ومنظم حول العقدة المركزية
  useEffect(() => {
    if (graphData.nodes.length > 0) {
      const positions: Record<string, { x: number, y: number }> = {};
      const centerX = 360;
      const centerY = 280;
      const radiusX = 260;
      const radiusY = 190;
      
      const nonSystemNodes = graphData.nodes.filter(n => n.type !== 'system');
      const systemNodes = graphData.nodes.filter(n => n.type === 'system');

      // العقدة المركزية (System Node) في المنتصف تماماً
      systemNodes.forEach((node) => {
        positions[node.id] = { x: centerX, y: centerY };
      });

      // توزيع بقية العقد دائرياً حول المركز لمنع التداخل
      nonSystemNodes.forEach((node, idx) => {
        const angle = (idx / nonSystemNodes.length) * 2 * Math.PI;
        positions[node.id] = {
          x: centerX + radiusX * Math.cos(angle) + (Math.random() * 20 - 10),
          y: centerY + radiusY * Math.sin(angle) + (Math.random() * 20 - 10),
        };
      });

      setNodePositions(positions);
    }
  }, [graphData]);

  // دالة التعامل مع الجر والتفاعل الفوري للعقدة
  const handleNodeDrag = (nodeId: string, info: any) => {
    setNodePositions(prev => {
      if (!prev[nodeId]) return prev;
      return {
        ...prev,
        [nodeId]: {
          x: prev[nodeId].x + info.delta.x,
          y: prev[nodeId].y + info.delta.y,
        }
      };
    });
  };

  if (!activeBrand) return (
    <div className="p-20 text-center text-slate-500 font-mono flex flex-col items-center justify-center gap-4">
      <Network size={48} className="animate-pulse text-indigo-500/40" />
      <span className="text-xs font-black uppercase tracking-widest">يرجى اختيار علامة تجارية لعرض خريطة المعرفة</span>
    </div>
  );

  const filteredNodes = graphData.nodes.filter(node => 
    node.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    node.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full bg-slate-950 font-sans text-slate-300 overflow-hidden flex flex-col select-none relative" dir="rtl">
      
      {/* ستايل الانيميشن الخاص بحركة خطوط SVG الفضائية والنبضات الحية */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes linkDash {
          to {
            stroke-dashoffset: -40;
          }
        }
        .animate-link-flow {
          stroke-dasharray: 8, 8;
          animation: linkDash 2s linear infinite;
        }
        .glow-node {
          box-shadow: 0 0 25px 2px rgba(16, 185, 129, 0.15);
        }
        .glow-pulse {
          animation: glowPulse 2s infinite alternate;
        }
        @keyframes glowPulse {
          0% { filter: drop-shadow(0 0 2px rgba(16, 185, 129, 0.2)); }
          100% { filter: drop-shadow(0 0 12px rgba(16, 185, 129, 0.6)); }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.3);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(100, 116, 139, 0.2);
          border-radius: 9px;
        }
      `}} />

      {/* Header */}
      <div className="p-6 border-b border-slate-900 bg-slate-950/80 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between shrink-0 gap-4">
         <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500/10 to-indigo-500/10 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.1)] shrink-0">
               <Network className="text-emerald-400" size={20} />
            </div>
            <div>
               <h1 className="text-base font-black tracking-tight text-white flex items-center gap-2">
                 شبكة المعرفة والوعي التشغيلي <span className="text-[9px] bg-indigo-500/20 text-indigo-400 border border-indigo-500/25 px-2 py-0.5 rounded-full font-black">LIVE GRAPH</span>
               </h1>
               <p className="text-[10px] text-slate-500 font-bold mt-0.5">خريطة تفاعلية ذكية تربط قرارات الذكاء الاصطناعي، الحملات، المحتوى، والنتائج معاً.</p>
            </div>
         </div>
         
         <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
            {/* حقل البحث السريع */}
            <div className="relative w-full sm:w-48">
              <Search className="absolute right-3 top-2.5 text-slate-600" size={13} />
              <input 
                type="text" 
                placeholder="بحث في الكيانات..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-1.5 pr-8 pl-3 text-[11px] font-bold text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/40"
              />
            </div>

            <div className="bg-slate-900/60 border border-slate-800 px-3 py-1.5 rounded-xl flex items-center gap-2.5 text-[9px] font-black tracking-wider text-slate-400 shrink-0">
               <Database size={11} className="text-slate-500" />
               <span>{graphData.nodes.length} كائن</span>
               <div className="w-[1px] h-3 bg-slate-800" />
               <Link2 size={11} className="text-slate-500" />
               <span>{graphData.links.length} رابط سحابي</span>
            </div>
         </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row min-h-0">
         
         {/* Map Visualization Area (Takes full space or left-2/3) */}
         <div className="flex-1 relative bg-slate-950 overflow-hidden border-l border-slate-900 flex items-center justify-center">
            {/* شبكة البكسلات الدائرية كخلفية خيالية */}
            <div className="absolute inset-0 opacity-25 pointer-events-none">
               <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_80%,transparent_100%)]" />
            </div>

            {loading ? (
              <div className="text-center space-y-3 z-10">
                 <Loader2 size={36} className="mx-auto text-emerald-400 animate-spin" />
                 <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">جاري تشكيل واستدعاء الخلايا المعرفية...</p>
              </div>
            ) : graphData.nodes.length === 0 ? (
              <div className="text-center space-y-6 z-10 p-6">
                 <Compass size={48} className="mx-auto text-slate-800 animate-pulse" />
                 <p className="text-xs text-slate-500 font-bold max-w-xs leading-relaxed">
                    لم نكتشف شبكة معرفة نشطة بعد. قم بإنشاء أي منشور أو حملة لبدء بذر وبناء الشبكة المعرفية تلقائياً!
                 </p>
              </div>
            ) : (
              <div className="absolute inset-0 overflow-auto custom-scrollbar flex items-center justify-center" style={{ minWidth: '800px', minHeight: '600px' }}>
                <div className="relative w-[800px] h-[600px] shrink-0">
                  
                  {/* طبقة الـ SVG المضيئة لرسم خطوط التوصيل التفاعلية مع انيميشن حركة البيانات */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                    <defs>
                      <linearGradient id="glowLinkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                        <stop offset="50%" stopColor="#4f46e5" stopOpacity="0.6" />
                        <stop offset="100%" stopColor="#a855f7" stopOpacity="0.4" />
                      </linearGradient>
                      <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                      </filter>
                    </defs>

                    {graphData.links.map((link) => {
                      const sourcePos = nodePositions[link.sourceId];
                      const targetPos = nodePositions[link.targetId];
                      if (!sourcePos || !targetPos) return null;

                      // حساب نقطة المنتصف لكل عقدة (العقدة بأبعاد عرض 190 وارتفاع 68)
                      const x1 = sourcePos.x + 95;
                      const y1 = sourcePos.y + 34;
                      const x2 = targetPos.x + 95;
                      const y2 = targetPos.y + 34;

                      const isSelected = selectedNode && (selectedNode.id === link.sourceId || selectedNode.id === link.targetId);

                      return (
                        <g key={link.id}>
                          {/* خط الوهج الخلفي العريض */}
                          <line 
                            x1={x1} 
                            y1={y1} 
                            x2={x2} 
                            y2={y2} 
                            stroke={isSelected ? "rgba(16, 185, 129, 0.25)" : "rgba(99, 102, 241, 0.08)"} 
                            strokeWidth={isSelected ? "5" : "3"} 
                            filter="url(#glowEffect)"
                          />
                          {/* خط البيانات النبضي المتحرك */}
                          <line 
                            x1={x1} 
                            y1={y1} 
                            x2={x2} 
                            y2={y2} 
                            stroke="url(#glowLinkGrad)" 
                            strokeWidth={isSelected ? "2" : "1.2"} 
                            className="animate-link-flow"
                            style={{
                              strokeDasharray: isSelected ? "6, 6" : "8, 8",
                              animationDuration: isSelected ? "1.2s" : "2.5s"
                            }}
                          />
                        </g>
                      );
                    })}
                  </svg>

                  {/* خلايا المعرفة التفاعلية القابلة للسحب والإسقاط (Interactive Draggable Nodes) */}
                  {filteredNodes.map((node) => {
                    const pos = nodePositions[node.id] || { x: 300, y: 250 };
                    const isSelected = selectedNode?.id === node.id;
                    const isSystem = node.type === 'system';

                    return (
                      <motion.div
                        key={node.id}
                        drag
                        dragMomentum={false}
                        dragElastic={0}
                        onDrag={(e, info) => handleNodeDrag(node.id, info)}
                        style={{ 
                          left: pos.x, 
                          top: pos.y,
                          position: 'absolute',
                          zIndex: isSystem ? 10 : 5
                        }}
                        whileHover={{ scale: 1.03 }}
                        onClick={() => setSelectedNode(node)}
                        className={cn(
                          "w-[190px] h-[68px] rounded-2xl border p-3 flex flex-col justify-between cursor-grab active:cursor-grabbing transition-all select-none backdrop-blur-md",
                          isSystem 
                            ? "bg-gradient-to-br from-indigo-950/80 to-slate-950/95 border-indigo-500/40 glow-pulse" 
                            : isSelected 
                              ? "bg-slate-900/90 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/30" 
                              : "bg-slate-950/80 border-slate-850 hover:border-slate-700 shadow-md"
                        )}
                      >
                        <div className="flex items-center justify-between gap-1.5 shrink-0">
                           <div className="flex items-center gap-1.5 min-w-0">
                              <span className="shrink-0">{getNodeIcon(node.type)}</span>
                              <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 truncate">{node.type}</span>
                           </div>
                           {node.priorityLevel === 'CRITICAL' && (
                             <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping shrink-0" title="أولوية قصوى" />
                           )}
                        </div>

                        <p className="text-[11px] font-black text-white tracking-tight truncate pl-1" title={node.name}>
                          {node.name}
                        </p>

                        <div className="flex items-center justify-between text-[7px] font-bold text-slate-500 mt-1 uppercase tracking-wide">
                          <span>سياق نشط</span>
                          <span className="font-mono text-emerald-400 font-black">INTEL 100%</span>
                        </div>
                      </motion.div>
                    );
                  })}

                </div>
              </div>
            )}

            {/* دليل المساعدة العائم */}
            <div className="absolute bottom-6 right-6 bg-slate-950/80 border border-slate-850 rounded-2xl p-3.5 max-w-xs shadow-2xl backdrop-blur-md z-10 text-right">
              <h4 className="text-[10px] font-black text-white flex items-center gap-1.5 mb-1.5">
                <HelpCircle size={12} className="text-emerald-400" /> إرشادات التحكم الذكي
              </h4>
              <p className="text-[9px] text-slate-400 leading-normal font-medium">
                * يمكنك **سحب وإفلات** أي عقدة لإعادة ترتيب خريطة المعرفة وتنسيق الشبكة بيدك.<br />
                * اضغط على أي عقدة لعرض **تحليلات الذكاء** والعلاقات السيمانتية المرتبطة بها في لوحة التحكم الجانبية.
              </p>
            </div>
         </div>

         {/* Sidebar: Entity Intelligence details (Takes 1/3 right column) */}
         <div className="w-full lg:w-[350px] bg-slate-950/50 backdrop-blur-xl p-6 overflow-y-auto custom-scrollbar shrink-0 border-r border-slate-900">
            <AnimatePresence mode="wait">
               {selectedNode ? (
                 <motion.div 
                   key={selectedNode.id}
                   initial={{ opacity: 0, x: -15 }}
                   animate={{ opacity: 1, x: 0 }}
                   exit={{ opacity: 0, x: 15 }}
                   className="space-y-6"
                 >
                    {/* عقدة الذكاء المحددة */}
                    <div className="pb-5 border-b border-slate-900 flex flex-col gap-3">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                             {getNodeIcon(selectedNode.type)}
                          </div>
                          <div>
                             <h2 className="text-xs font-black text-white tracking-tight uppercase leading-tight">{selectedNode.name}</h2>
                             <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mt-0.5 inline-block">{selectedNode.type} Entity</span>
                          </div>
                       </div>
                       <div className="bg-slate-950 border border-slate-900 p-2.5 rounded-xl text-[8px] font-mono text-slate-500 font-bold select-text text-left">
                          ID: {selectedNode.id}
                       </div>
                    </div>

                    {/* العلاقات السيمانتية المرتبطة */}
                    <div className="space-y-3">
                       <h3 className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1.5">
                          <Link2 size={12} className="text-emerald-400" /> الروابط التشغيلية المكتشفة
                       </h3>
                       
                       <div className="space-y-2">
                          {graphData.links.filter(l => l.sourceId === selectedNode.id || l.targetId === selectedNode.id).map((link) => {
                             const isSource = link.sourceId === selectedNode.id;
                             const partnerId = isSource ? link.targetId : link.sourceId;
                             const partnerNode = graphData.nodes.find(n => n.id === partnerId);
                             
                             return (
                               <div key={link.id} className="p-3 bg-slate-900/40 border border-slate-850 rounded-xl flex items-center justify-between group hover:border-slate-800 transition-colors gap-2">
                                  <div className="flex flex-col min-w-0">
                                     <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-0.5">{link.type}</span>
                                     <span className="text-[10px] font-black text-slate-200 truncate">
                                        {partnerNode ? partnerNode.name : "كيان غير معرف"}
                                     </span>
                                     {link.metadata?.relationship && (
                                       <span className="text-[8px] text-slate-500 font-medium mt-0.5">{link.metadata.relationship}</span>
                                     )}
                                  </div>
                                  <div className="shrink-0 text-[8px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/10 font-black">
                                     قوة {link.strength.toFixed(2)}
                                  </div>
                               </div>
                             );
                          })}

                          {graphData.links.filter(l => l.sourceId === selectedNode.id || l.targetId === selectedNode.id).length === 0 && (
                            <div className="text-[9px] text-slate-600 font-bold text-center py-4">
                               لا توجد روابط مسجلة لهذا الكيان حالياً.
                            </div>
                          )}
                       </div>
                    </div>

                    {/* بيانات تعريف الكيان (Metadata) */}
                    <div className="space-y-3">
                       <h3 className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1.5">
                          <Box size={12} className="text-indigo-500" /> تحليل المعطيات والذاكرة
                       </h3>
                       <div className="bg-slate-950 border border-slate-900 p-4 rounded-xl font-mono text-[9px] text-emerald-400 overflow-x-auto select-text text-left max-h-48 custom-scrollbar">
                          <pre>{safeStringify(selectedNode.metadata, 2)}</pre>
                       </div>
                    </div>

                    {/* أولوية الكائن وقرار التوصية */}
                    <div className="bg-slate-900/30 border border-slate-850 p-4 rounded-2xl flex flex-col gap-2">
                      <h4 className="text-[10px] font-black text-slate-300 flex items-center gap-1.5">
                        <TrendingUp size={12} className="text-amber-500" /> الاستنتاج الاستراتيجي للذكاء
                      </h4>
                      <p className="text-[9px] text-slate-400 leading-normal font-medium">
                        {selectedNode.type === 'campaign' && "الحملة مستقرة ومرتبطة بأصول النشر والجمهور المستهدف. نقترح تتبع معدلات التحويل اليومية لتعزيز قوة الروابط."}
                        {selectedNode.type === 'content' && "الأصل البصري مسجل كعلاقة نجاح، ومرتبط بقنوات النشر وحملات الاستهداف الموسمية بنجاح."}
                        {selectedNode.type === 'decision' && "القرار الاستراتيجي يحظى بنسبة ثقة عالية (94%) نظراً لاعتماده على بيانات حملات الاستهلاك التاريخية للعلامة التجارية."}
                        {selectedNode.type === 'system' && "النظام يعمل بشكل ممتاز ويراقب كافة مسارات اتخاذ القرار. لا توجد أي عقد معزولة أو فجوات تشغيلية مكتشفة."}
                        {selectedNode.type === 'platform' && "قناة النشر متصلة بالكامل ومستقرة، ومتاحة للاستلام والجدولة المستقلة بواسطة أتمتة الذكاء الاصطناعي."}
                        {selectedNode.type === 'process' && "عملية أتمتة النشر مبرمجة ونشطة وتعمل بنجاح، ومرتبطة بجدول التوليد الصباحي للمحتوى."}
                      </p>
                    </div>

                 </motion.div>
               ) : (
                 <div className="h-full flex flex-col items-center justify-center text-center opacity-50 py-12">
                    <Layers size={36} className="mb-4 text-slate-700 animate-bounce duration-1000" />
                    <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">لوحة تحليلات الكيانات</h3>
                    <p className="text-[9px] font-bold text-slate-500 max-w-[200px] leading-relaxed">
                       قم باختيار عقدة معينة من الخريطة التفاعلية لعرض الروابط والتحليلات والذاكرة العميقة لها هنا فوراً.
                    </p>
                 </div>
               )}
            </AnimatePresence>
         </div>

      </div>
    </div>
  );
}

// دالة جلب الأيقونات التعبيرية لكل نوع من الكيانات لضمان مظهر غني ومميز
function getNodeIcon(type: KnowledgeEntity['type']) {
  switch (type) {
    case 'campaign': return <Activity size={13} className="text-rose-400" />;
    case 'content': return <Box size={13} className="text-indigo-400" />;
    case 'platform': return <Share2 size={13} className="text-emerald-400" />;
    case 'audience': return <Compass size={13} className="text-amber-400" />;
    case 'process': return <Cpu size={13} className="text-purple-400" />;
    case 'system': return <Database size={13} className="text-indigo-400" />;
    case 'decision': return <GitBranch size={13} className="text-amber-500" />;
    default: return <Box size={13} className="text-slate-400" />;
  }
}
