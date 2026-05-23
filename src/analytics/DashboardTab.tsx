import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, AreaChart, Area } from 'recharts';
import { Target, TrendingUp, Users, LayoutTemplate } from 'lucide-react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useWorkspace } from '../contexts/WorkspaceContext';

export function DashboardTab() {
  const [generationsCount, setGenerationsCount] = useState(0);
  const [publishedCount, setPublishedCount] = useState(0);
  const { activeBrand } = useWorkspace();

  const [platformData, setPlatformData] = useState([
    { name: 'هذا الشهر', tiktok: 0, instagram: 0, youtube: 0, linkedin: 0, x: 0 }
  ]);

  useEffect(() => {
    if(!activeBrand) return;

    const qGen = query(
      collection(db, 'generations'), 
      where('brandId', '==', activeBrand.id),
      where('userId', '==', auth.currentUser?.uid)
    );
    const unsubGen = onSnapshot(qGen, (snap) => setGenerationsCount(snap.size));

    const qPub = query(
      collection(db, 'publishing_queue'), 
      where('brandId', '==', activeBrand.id),
      where('userId', '==', auth.currentUser?.uid)
    );
    const unsubPub = onSnapshot(qPub, (snap) => {
      let published = 0;
      let platforms = { tiktok: 0, instagram: 0, youtube: 0, linkedin: 0, x: 0 };
      
      snap.forEach(doc => {
         const data = doc.data();
         if(data.status === 'published') published++;
         const p = (data.platform || '').toLowerCase();
         if (p === 'tiktok') platforms.tiktok++;
         if (p === 'instagram') platforms.instagram++;
         if (p === 'youtube') platforms.youtube++;
         if (p === 'linkedin') platforms.linkedin++;
         if (p === 'x') platforms.x++;
      });
      setPublishedCount(published);
      setPlatformData([{ 
        name: 'اليوم', 
        tiktok: platforms.tiktok, 
        instagram: platforms.instagram, 
        youtube: platforms.youtube, 
        linkedin: platforms.linkedin,
        x: platforms.x 
      }]);
    });

    return () => { unsubGen(); unsubPub(); }
  }, [activeBrand]);

  const mockGrowth = [
    { name: 'W1', value: 20 },
    { name: 'W2', value: 45 },
    { name: 'W3', value: 38 },
    { name: 'W4', value: 80 },
    { name: 'W5', value: 120 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
      <div>
        <h3 className="text-2xl font-black text-white">نظرة عامة على الأداء</h3>
        <p className="text-sm text-slate-400 mt-1">تتبع أداء محتواك المولد ومنصاتك عبر الزمن الحقيقي</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="إجمالي المحتوى المولد" value={(generationsCount || 0).toString()} percent="" icon={<LayoutTemplate className="text-indigo-400" />} />
        <StatCard title="المنشورات الناجحة (تمت جدولة/نشر)" value={(publishedCount || 0).toString()} percent="" icon={<Target className="text-emerald-400" />} />
        <StatCard title="أفضل منصة (تفاعلي)" value="TikTok" desc="معدل تفاعل (محاكاة)" icon={<TrendingUp className="text-pink-400" />} />
        <StatCard title="أفضل شخصية (Persona)" value="Viral Creator" desc="(محاكاة)" icon={<Users className="text-amber-400" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-950 border border-slate-800 p-6 rounded-3xl overflow-hidden hover:border-slate-700 transition-colors">
          <h4 className="font-bold text-white mb-6">نشاط النشر والتفاعل عبر المنصات</h4>
          <div className="h-64 -ml-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={platformData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip cursor={{ fill: '#0f172a' }} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }} />
                <Bar dataKey="tiktok" fill="#ec4899" radius={[4, 4, 0, 0]} />
                <Bar dataKey="instagram" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="x" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="linkedin" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 p-6 rounded-3xl overflow-hidden hover:border-slate-700 transition-colors">
          <h4 className="font-bold text-white mb-6">معدل النمو الإجمالي (محاكاة)</h4>
          <div className="h-64 -ml-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff' }} />
                <Area type="monotone" dataKey="value" stroke="#6366f1" fill="url(#colorValue)" strokeWidth={3} />
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, percent, desc }: any) {
  return (
    <div className="bg-slate-950 border border-slate-800 p-6 rounded-3xl relative overflow-hidden group hover:border-slate-700 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-slate-900 rounded-2xl ring-1 ring-slate-800/50 group-hover:scale-110 transition-transform">
          {icon}
        </div>
        {percent && <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">{percent}</span>}
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">{title}</p>
        <h4 className="text-2xl font-black text-white">{value}</h4>
        {desc && <p className="text-[10px] text-slate-400 mt-1">{desc}</p>}
      </div>
    </div>
  );
}
