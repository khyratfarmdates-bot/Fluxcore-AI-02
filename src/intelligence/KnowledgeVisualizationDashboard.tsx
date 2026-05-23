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
  AlertCircle
} from "lucide-react";
import { cn } from "../lib/utils";
import { knowledgeGraph, KnowledgeEntity, KnowledgeRelationship } from "./knowledge/KnowledgeGraphService";
import { safeStringify } from "../lib/safe-stringify";
import { knowledgeQueryEngine } from "./knowledge/KnowledgeQueryEngine";
import { useWorkspace } from "../contexts/WorkspaceContext";
import { motion, AnimatePresence } from "framer-motion";
import * as ReactWindow from 'react-window';
const { FixedSizeList: List } = ReactWindow as any;

export function KnowledgeVisualizationDashboard() {
  const { activeBrand } = useWorkspace();
  const [graphData, setGraphData] = useState<{ nodes: KnowledgeEntity[], links: KnowledgeRelationship[] }>({ nodes: [], links: [] });
  const [selectedNode, setSelectedNode] = useState<KnowledgeEntity | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchGraph() {
      if (!activeBrand) return;
      setLoading(true);
      try {
        const data = await knowledgeGraph.getWorkspaceGraph(activeBrand.id);
        setGraphData(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchGraph();
  }, [activeBrand]);

  if (!activeBrand) return <div className="p-20 text-center text-slate-500 font-black">SELECT BRAND FOR KNOWLEDGE MAPPING</div>;

  return (
    <div className="h-full bg-slate-950 font-mono text-slate-300 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-8 border-b border-slate-900 bg-slate-950/80 backdrop-blur-md flex items-center justify-between shrink-0">
         <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.1)]">
               <Network className="text-emerald-400" size={24} />
            </div>
            <div>
               <h1 className="text-xl font-black tracking-tighter uppercase">Operational Knowledge Graph</h1>
               <div className="flex items-center gap-3 mt-1">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">System Awareness:</span>
                  <span className="text-[9px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase">Cognitive Link Active</span>
               </div>
            </div>
         </div>
         <div className="flex items-center gap-4">
            <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl flex items-center gap-3">
               <Database size={14} className="text-slate-500" />
               <span className="text-[10px] font-black text-slate-400">{graphData.nodes.length} ENTITIES</span>
               <div className="w-[1px] h-3 bg-slate-800" />
               <Link2 size={14} className="text-slate-500" />
               <span className="text-[10px] font-black text-slate-400">{graphData.links.length} RELATIONSHIPS</span>
            </div>
         </div>
      </div>

      <div className="flex-1 overflow-hidden grid grid-cols-12">
         {/* Map Visualization Area (Placeholder for actual graph) */}
         <div className="col-span-8 relative bg-slate-950 overflow-hidden border-r border-slate-900">
            <div className="absolute inset-0 opacity-20 pointer-events-none">
               <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
            </div>

            <div className="absolute inset-0 p-10 flex flex-wrap gap-8 items-center justify-center content-center overflow-auto custom-scrollbar">
{graphData.nodes.length === 0 ? (
                 <div className="text-center space-y-6">
                    <Compass size={64} className="mx-auto text-slate-800 animate-pulse" />
                    <p className="text-xs text-slate-600 font-black uppercase tracking-widest leading-relaxed">
                       No knowledge nodes detected yet.<br />Execute an operation to seed the graph.
                    </p>
                 </div>
               ) : (
                 graphData.nodes.map((node) => (
                   <motion.button
                     key={node.id}
                     whileHover={{ scale: 1.05, y: -5 }}
                     onClick={() => setSelectedNode(node)}
                     className={cn(
                       "relative p-6 rounded-3xl border transition-all duration-300 min-w-[200px] text-left group",
                       selectedNode?.id === node.id 
                         ? "bg-emerald-500/10 border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.2)]" 
                         : "bg-slate-900/50 border-slate-800 hover:border-slate-600"
                     )}
                   >
                     <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Maximize2 size={12} className="text-slate-500" />
                     </div>
                     <div className="flex items-center gap-3 mb-3">
                        {getNodeIcon(node.type)}
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{node.type}</span>
                     </div>
                     <p className="text-sm font-black text-white tracking-tight">{node.name}</p>
                     <div className="mt-4 flex items-center gap-2">
                        <div className="h-0.5 flex-1 bg-slate-800 rounded-full overflow-hidden">
                           <div className="h-full w-2/3 bg-emerald-500/40" />
                        </div>
                        <span className="text-[8px] font-mono text-slate-600">INTEL 67%</span>
                     </div>
                   </motion.button>
                 ))
               )}
            </div>

            {/* Float Controls */}
            <div className="absolute bottom-6 left-6 flex items-center gap-2">
               <button className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors"><Search size={16}/></button>
               <button className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors"><Activity size={16}/></button>
               <button className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors"><Share2 size={16}/></button>
            </div>
         </div>

         {/* Sidebar: Entity Intelligence */}
         <div className="col-span-4 bg-slate-950/50 backdrop-blur-xl p-8 overflow-y-auto custom-scrollbar">
            <AnimatePresence mode="wait">
               {selectedNode ? (
                 <motion.div 
                   key={selectedNode.id}
                   initial={{ opacity: 0, x: 20 }}
                   animate={{ opacity: 1, x: 0 }}
                   exit={{ opacity: 0, x: -20 }}
                   className="space-y-8"
                 >
                    <div className="pb-8 border-b border-slate-900">
                       <div className="flex items-center gap-4 mb-4">
                          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center">
                             {getNodeIcon(selectedNode.type)}
                          </div>
                          <div>
                             <h2 className="text-lg font-black text-white tracking-tighter uppercase">{selectedNode.name}</h2>
                             <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{selectedNode.type} Entity</span>
                          </div>
                       </div>
                       <p className="text-xs text-slate-500 leading-relaxed font-bold">
                          Operational ID: {selectedNode.id}
                       </p>
                    </div>

                    <div className="space-y-6">
                       <h3 className="text-[11px] font-black uppercase text-slate-400 flex items-center gap-2">
                          <Link2 size={14} className="text-emerald-500" /> Semantic Relationships
                       </h3>
                       <div className="space-y-3">
                          {graphData.links.filter(l => l.sourceId === selectedNode.id || l.targetId === selectedNode.id).map((link) => (
                             <div key={link.id} className="p-4 bg-slate-900/50 border border-slate-800 rounded-2xl flex items-center justify-between group hover:border-slate-600 transition-colors">
                                <div className="flex flex-col">
                                   <span className="text-[9px] font-black text-slate-600 uppercase mb-1">{link.type}</span>
                                   <span className="text-xs font-bold text-slate-300">
                                      {link.sourceId === selectedNode.id ? "Linked to Target" : "Sourced from Origin"}
                                   </span>
                                </div>
                                <div className="flex items-center gap-3">
                                   <div className="text-[10px] font-mono text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">
                                      STR {link.strength.toFixed(1)}
                                   </div>
                                </div>
                             </div>
                          ))}
                       </div>
                    </div>

                    <div className="space-y-6">
                       <h3 className="text-[11px] font-black uppercase text-slate-400 flex items-center gap-2">
                          <Box size={14} className="text-indigo-500" /> Metadata Intelligence
                       </h3>
                       <div className="bg-slate-950 border border-slate-800 p-6 rounded-2xl font-mono text-[10px] text-slate-600 overflow-x-auto">
                          <pre>{safeStringify(selectedNode.metadata, 2)}</pre>
                       </div>
                    </div>
                 </motion.div>
               ) : (
                 <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                    <Layers size={48} className="mb-6 text-slate-700" />
                    <p className="text-xs font-black uppercase tracking-widest text-slate-600 max-w-[200px] leading-relaxed">
                       Select an entity node to investigate intelligence relationships.
                    </p>
                 </div>
               )}
            </AnimatePresence>
         </div>
      </div>
    </div>
  );
}

function getNodeIcon(type: KnowledgeEntity['type']) {
  switch (type) {
    case 'campaign': return <Activity size={18} className="text-rose-400" />;
    case 'content': return <Box size={18} className="text-indigo-400" />;
    case 'platform': return <Share2 size={18} className="text-emerald-400" />;
    case 'audience': return <Compass size={18} className="text-amber-400" />;
    case 'process': return <Cpu size={18} className="text-purple-400" />;
    case 'system': return <Database size={18} className="text-slate-400" />;
    case 'decision': return <GitBranch size={18} className="text-amber-500" />;
    default: return <Box size={18} className="text-slate-400" />;
  }
}
