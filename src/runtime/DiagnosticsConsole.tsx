import React, { useState, useEffect } from 'react';
import { serviceRegistry } from './ServiceRegistry';
import { ServiceInfo } from './types';
import { Shield, Activity, CheckCircle2, XCircle, AlertTriangle, Cpu, Database, Globe, Layers } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

export function DiagnosticsConsole() {
  const [services, setServices] = useState<ServiceInfo[]>([]);

  useEffect(() => {
    const unsub = serviceRegistry.subscribe(setServices);
    return () => { unsub(); };
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle2 className="text-emerald-500" size={16} />;
      case 'mocked': return <AlertTriangle className="text-amber-500" size={16} />;
      case 'disconnected': return <XCircle className="text-red-500" size={16} />;
      default: return <Activity className="text-slate-400 animate-pulse" size={16} />;
    }
  };

  const productionScore = Math.round(
    (services.filter(s => s.isReal && s.status === 'connected').length / 
    services.length) * 100
  ) || 0;

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden flex flex-col h-full font-sans">
      <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/40">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Shield className="text-indigo-500" />
            Runtime Diagnostics
          </h2>
          <p className="text-xs text-slate-500 font-bold mt-1 uppercase tracking-widest">Core Execution Monitor</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-black text-indigo-400">{productionScore}%</div>
          <div className="text-[10px] text-slate-500 font-black uppercase">Production Readiness</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Readiness Bar */}
        <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${productionScore}%` }}
            className="h-full bg-gradient-to-r from-indigo-600 to-emerald-500"
          />
        </div>

        <div className="grid grid-cols-1 gap-3">
          {services.map((service) => (
            <div key={service.id} className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl flex items-center justify-between group hover:border-indigo-500/30 transition-all">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "p-3 rounded-xl",
                  service.category === 'database' ? "bg-emerald-500/10 text-emerald-500" :
                  service.category === 'ai' ? "bg-purple-500/10 text-purple-400" :
                  "bg-indigo-500/10 text-indigo-400"
                )}>
                  {service.category === 'database' ? <Database size={20} /> : 
                   service.category === 'ai' ? <Cpu size={20} /> : <Layers size={20} />}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-200">{service.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={cn(
                      "text-[9px] px-1.5 py-0.5 rounded font-black uppercase",
                      service.isReal ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                    )}>
                      {service.isReal ? 'Real Service' : 'Mock Wrapper'}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      آخر فحص: {new Date(service.lastChecked).toLocaleTimeString('ar-SA')}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={cn(
                  "text-[10px] font-black uppercase px-2 py-1 rounded-lg border",
                  service.status === 'connected' ? "border-emerald-500/20 text-emerald-500" :
                  service.status === 'mocked' ? "border-amber-500/20 text-amber-500" :
                  "border-red-500/20 text-red-500"
                )}>
                  {service.status === 'connected' ? 'Connected' : 
                   service.status === 'mocked' ? 'Simulated' : 'Offline'}
                </span>
                {getStatusIcon(service.status)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 bg-slate-900/80 border-t border-slate-800">
        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
          <Globe size={12} className="animate-spin-slow" />
          <span>الربط العالمي نشط - جاري التحقق من تكامل العمليات...</span>
        </div>
      </div>
    </div>
  );
}
