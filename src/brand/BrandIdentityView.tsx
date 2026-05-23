import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, Settings2, Sparkles, Image as ImageIcon, Loader2, Plus, Palette, BookType, LayoutTemplate, Check, Globe, Users, Edit3, Trash2, ArrowLeftRight, Share2, BarChart2 } from 'lucide-react';
import { useWorkspace, BrandIdentity } from '../contexts/WorkspaceContext';
import { toast } from '../lib/soundToast';
import { ShareModal } from '../components/ShareModal';
import { ConfirmDialog } from '../components/ConfirmDialog';

type Tab = 'profiles' | 'editor' | 'usage';

export function BrandIdentityView() {
  const { brands, activeBrand, setActiveBrandId, createBrand, updateBrand, deleteBrand, loading } = useWorkspace();
  const [activeTab, setActiveTab] = useState<Tab>('profiles');
  const [isCreating, setIsCreating] = useState(false);
  const [shareBrand, setShareBrand] = useState<BrandIdentity | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });
  const [aiUrl, setAiUrl] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const [formData, setFormData] = useState<Partial<BrandIdentity>>({});

  const handleAIFill = async () => {
    if (!aiUrl) return toast.error("أدخل رابط الموقع أولاً");
    setAiLoading(true);
    try {
      const scrapeRes = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: aiUrl })
      });
      const scraped = await scrapeRes.json();
      if (scraped.error && !scraped.isFallback) throw new Error(scraped.error);
      
      const prompt = `استخرج بيانات لإنشاء "هوية علامة تجارية" من هذا النص المأخوذ من موقع إلكتروني.
النص:
${(scraped.content || '').substring(0, 4000)}

جهات اتصال مستخرجة من الروابط إن وجدت:
إيميلات: ${(scraped.technical?.emails || []).join(', ')}
أرقام: ${(scraped.technical?.phones || []).join(', ')}

قم بصياغة البيانات كـ JSON فقط بالصيغة التالية:
{
  "name": "اسم العلامة التجارية المنطقي",
  "industry": "مجال العمل باختصار شديد (كلمات مفتاحية)",
  "description": "وصف مفصل للنشاط والخدمات المتقدمة التي يقومون بها بناءً على الموقع",
  "targetAudience": "الجمهور المستهدف المتوقع",
  "preferredCta": "دعوة للإجراء مناسبة",
  "slogans": "شعار مقترح أو مأخوذ من الموقع",
  "writingStyle": "توقع أسلوب الكتابة للمنصة (رسمي، تفاعلي، ودي..)",
  "contactEmail": "البريد الإلكتروني إن وجد",
  "contactPhone": "رقم الجوال أو الهاتف للتواصل إن وجد"
}`;
      
      const aiRes = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, provider: "gemini" })
      });
      
      const aiData = await aiRes.json();
      if (aiData.error) throw new Error(aiData.error);
      
      let jsonStr = aiData.result;
      jsonStr = jsonStr.replace(/```json\n?|```/g, '').trim();
      const parsed = JSON.parse(jsonStr);
      
      setFormData(prev => ({ 
        ...prev, 
        name: parsed.name || prev.name,
        industry: parsed.industry || prev.industry,
        description: parsed.description || prev.description,
        targetAudience: parsed.targetAudience || prev.targetAudience,
        preferredCta: parsed.preferredCta || prev.preferredCta,
        slogans: parsed.slogans || prev.slogans,
        writingStyle: parsed.writingStyle || prev.writingStyle,
        contactEmail: parsed.contactEmail || prev.contactEmail,
        contactPhone: parsed.contactPhone || prev.contactPhone,
      }));
      toast.success("تم سحب وتحليل البيانات بنجاح");
    } catch (e: any) {
      toast.error("فشل استخراج البيانات: " + e.message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleEdit = (brand: BrandIdentity) => {
    setFormData(brand);
    setIsCreating(false);
    setActiveTab('editor');
  };

  const handleCreateNew = () => {
    setFormData({
      name: '', description: '', industry: '', personality: 'Modern',
      writingStyle: '', preferredWords: '', bannedWords: '',
      preferredCta: '', targetAudience: '', language: 'العربية', slogans: '', colors: ''
    });
    setIsCreating(true);
    setActiveTab('editor');
  };

  const handleSave = async () => {
    if (!formData.name) {
       toast.error('اسم العلامة التجارية مطلوب');
       return;
    }
    try {
      if (isCreating) {
        await createBrand(formData);
      } else if (formData.id) {
        await updateBrand(formData.id, formData);
      }
      setActiveTab('profiles');
      toast.success('تم حفظ هوية العلامة التجارية بنجاح');
    } catch (e: any) {
      toast.error('خطأ أثناء الحفظ: ' + e.message);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteConfirmation({ isOpen: true, id });
  };

  const confirmDelete = async () => {
    if (deleteConfirmation.id) {
      const id = deleteConfirmation.id;
      await deleteBrand(id);
      if (activeTab === 'editor' && formData.id === id) {
        setActiveTab('profiles');
      }
    }
    setDeleteConfirmation({ isOpen: false, id: null });
  };

  const personalites = ['Luxury', 'Modern', 'Minimal', 'Corporate', 'Viral', 'Gen Z', 'Arabic Marketing', 'Storytelling'];

  const [isExtractingColors, setIsExtractingColors] = useState(false);

  const extractDominantColorsFromImage = (dataUrl: string): Promise<string[]> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(['#b91c1c', '#1e293b', '#10b981']);
            return;
          }

          // Small canvas to optimize performance and grab dominant pigments
          const size = 50;
          canvas.width = size;
          canvas.height = size;
          ctx.drawImage(img, 0, 0, size, size);

          const imgData = ctx.getImageData(0, 0, size, size);
          const pixels = imgData.data;
          const colorCounts: { [hex: string]: number } = {};

          for (let i = 0; i < pixels.length; i += 4) {
            const r = pixels[i];
            const g = pixels[i + 1];
            const b = pixels[i + 2];
            const a = pixels[i + 3];

            // Ignore transparent or highly semi-transparent pixels
            if (a < 185) continue;

            // Ignore light colors/background white colors (brightness > 240)
            if (r > 238 && g > 238 && b > 238) continue;

            // Ignore extremely dark colors (near pure pitch black text)
            if (r < 20 && g < 20 && b < 20) continue;

            // Rounding for simple quantization (grouping similar colors together)
            const qr = Math.round(r / 20) * 20;
            const qg = Math.round(g / 20) * 20;
            const qb = Math.round(b / 20) * 20;

            const toHex = (c: number) => {
              const hex = Math.min(255, Math.max(0, c)).toString(16);
              return hex.length === 1 ? '0' + hex : hex;
            };
            const hex = `#${toHex(qr)}${toHex(qg)}${toHex(qb)}`;

            colorCounts[hex] = (colorCounts[hex] || 0) + 1;
          }

          const sortedColors = Object.entries(colorCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([hex]) => hex);

          // Ensure distinct color variance
          const finalColors: string[] = [];
          const isSimilar = (hex1: string, hex2: string) => {
            const parseHex = (h: string) => [
              parseInt(h.slice(1, 3), 16),
              parseInt(h.slice(3, 5), 16),
              parseInt(h.slice(5, 7), 16)
            ];
            const [r1, g1, b1] = parseHex(hex1);
            const [r2, g2, b2] = parseHex(hex2);
            const dist = Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
            return dist < 65; // Visual distance threshold
          };

          for (const col of sortedColors) {
            if (finalColors.length >= 4) break;
            const tooClose = finalColors.some(fc => isSimilar(fc, col));
            if (!tooClose) {
              finalColors.push(col);
            }
          }

          if (finalColors.length === 0) {
            // Fallback colors if the logo is entirely white/black
            finalColors.push('#f43f5e', '#3b82f6', '#10b981');
          }

          resolve(finalColors);
        } catch (err) {
          console.error("Color extraction failed, using defaults:", err);
          resolve(['#b91c1c', '#1e293b', '#10b981']);
        }
      };
      img.onerror = () => {
        resolve(['#b91c1c', '#1e293b', '#10b981']);
      };
      img.src = dataUrl;
    });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('يرجى اختيار ملف صورة صالح');
      return;
    }

    if (file.size > 800 * 1024) {
      toast.error('حجم الشعار كبير جداً (الحد الأقصى 800 كيلوبايت لتوافق النظام)');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const logoDataUrl = event.target?.result as string;
      setIsExtractingColors(true);
      
      // Update logo first
      setFormData(prev => ({ ...prev, logo: logoDataUrl }));
      toast.success('تم رفع الشعار بنجاح! جاري تفريغ وتحليل أرقام الألوان ذكياً...');

      try {
        const extracted = await extractDominantColorsFromImage(logoDataUrl);
        const colorsString = extracted.join(', ');
        
        // Auto update the colors field
        setFormData(prev => ({ ...prev, colors: colorsString }));
        toast.success(`تم استخلاص الألوان للماركة بنجاح: ${colorsString}`);
      } catch (err) {
        console.error("Error auto-extracting colors:", err);
      } finally {
        setIsExtractingColors(false);
      }
    };
    reader.readAsDataURL(file);
  };

  if (loading) {
    return <div className="h-full flex justify-center items-center"><Loader2 className="animate-spin text-indigo-500" size={48} /></div>;
  }

  return (
    <div className="flex h-full gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Sidebar Navigation */}
      <div className="w-64 shrink-0 flex flex-col gap-6">
        <div className="bg-gradient-to-br from-rose-500/10 to-rose-500/5 border border-rose-500/20 p-6 rounded-3xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/20 blur-3xl rounded-full"></div>
          <Sparkles size={32} className="text-rose-400 mb-4 relative z-10" />
          <h2 className="text-xl font-black text-white relative z-10">Brand Identity</h2>
          <p className="text-xs text-rose-300/70 mt-2 relative z-10 leading-relaxed font-medium">إدارة الذاكرة الذكية لعلاماتك التجارية. الذكاء الاصطناعي يتذكر أسلوبك دائماً.</p>
        </div>

        <nav className="flex flex-col gap-2">
          <button
            onClick={() => setActiveTab('profiles')}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
              activeTab === 'profiles' ? 'bg-slate-800 text-white shadow-lg border border-slate-700' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Briefcase size={16} className={activeTab === 'profiles' ? 'text-rose-400' : 'text-slate-500'} />
            العلامات التجارية (Workspaces)
          </button>
          
          {activeBrand && (
            <button
              onClick={() => setActiveTab('usage')}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                activeTab === 'usage' ? 'bg-slate-800 text-white shadow-lg border border-slate-700' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <BarChart2 size={16} className={activeTab === 'usage' ? 'text-rose-400' : 'text-slate-500'} />
              الاستهلاك والفواتير (Usage)
            </button>
          )}
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-slate-900/50 border border-slate-800 rounded-[32px] p-8 overflow-y-auto custom-scrollbar relative">
        <AnimatePresence mode="wait">
          {activeTab === 'profiles' && (
            <motion.div key="profiles" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} className="space-y-6">
              <div className="flex justify-between items-center bg-slate-900/80 sticky top-0 z-10 py-2 border-b border-slate-800 backdrop-blur-md">
                <div>
                  <h3 className="text-2xl font-black text-white">العلامات التجارية ومساحات العمل</h3>
                  <p className="text-sm text-slate-400 mt-1">اختر مساحة العمل أو أنشئ هوية براند جديدة</p>
                </div>
                <button onClick={handleCreateNew} className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-rose-600/20">
                  <Plus size={18} /> براند جديد
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
                {brands.length === 0 ? (
                  <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-800 rounded-3xl text-slate-500">
                    <Briefcase size={48} className="mx-auto mb-4 opacity-50" />
                    <p className="font-bold">لا يوجد مساحات عمل (Brands) حتى الآن.</p>
                  </div>
                ) : (
                  brands.map(brand => {
                    const isSelected = activeBrand?.id === brand.id;
                    const brandColors = brand.colors 
                      ? brand.colors.split(',').map((c: string) => c.trim()).filter((c: string) => c.startsWith('#')) 
                      : [];

                    return (
                      <motion.div 
                        key={brand.id}
                        whileHover={{ y: -6, scale: 1.01 }}
                        transition={{ type: "spring", stiffness: 350, damping: 25 }}
                        className={`bg-slate-950/40 backdrop-blur-md border-2 p-6 rounded-[28px] flex flex-col gap-5 relative overflow-hidden transition-all duration-300 cursor-pointer text-right group select-none ${
                          isSelected 
                            ? 'border-rose-500/80 bg-rose-500/[0.015] shadow-[0_20px_45px_-12px_rgba(244,63,94,0.18),inset_0_1px_1px_rgba(255,255,255,0.05)]' 
                            : 'border-slate-800/80 hover:border-slate-700/80 hover:bg-slate-950/80 shadow-md'
                        }`} 
                        onClick={() => {
                          setActiveBrandId(brand.id);
                          toast.success(`تم بنجاح تفعيل علامة "${brand.name}" وهويتها البصرية في كامل أنحاء النظام! ✨`);
                        }}
                        dir="rtl"
                      >
                        {/* Selected Indicator Ribbon */}
                        {isSelected ? (
                          <div className="absolute top-0 left-0 bg-rose-500 text-white text-[9px] font-black uppercase tracking-widest px-3.5 py-1.5 rounded-br-2xl flex items-center gap-1.5 shadow-sm">
                            <Check size={11} className="stroke-[3]" />
                            <span>مفعّلة ونشطة</span>
                          </div>
                        ) : (
                          <div className="absolute top-0 left-0 bg-slate-850 text-slate-400 text-[8.5px] font-black uppercase tracking-wider px-3.5 py-1.5 rounded-br-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            اضغط لتفعيل العلامة ⚡
                          </div>
                        )}

                        {/* Top Info section */}
                        <div className="flex items-start gap-4 mt-2">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center p-1 border transition-all duration-300 shrink-0 ${
                            isSelected 
                              ? 'bg-slate-900 border-rose-500/40 shadow-lg' 
                              : 'bg-slate-950 border-slate-800 group-hover:border-slate-700'
                          }`}>
                            {brand.logo ? (
                               <img src={brand.logo} alt={brand.name} className="w-full h-full object-contain rounded-lg" />
                             ) : brandColors.length > 0 ? (
                               <div className="w-full h-full rounded-lg flex items-center justify-center font-black text-white text-base shadow-inner" style={{ backgroundColor: brandColors[0] }}>
                                 {brand.name ? brand.name.charAt(0) : 'B'}
                               </div>
                             ) : (
                               <div className="w-full h-full rounded-lg bg-slate-900 flex items-center justify-center border border-slate-800">
                                 <Briefcase size={22} className="text-slate-400" />
                               </div>
                             )}
                          </div>
                          
                          <div className="min-w-0 flex-1">
                            <h4 className="font-black text-slate-100 text-lg group-hover:text-rose-400 transition-colors truncate">{brand.name}</h4>
                            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                              <span className="text-[10px] bg-slate-900 border border-slate-800 text-slate-300 px-2 py-0.5 rounded-md font-bold max-w-[120px] truncate">{brand.industry || 'عام'}</span>
                              <span className="text-[10px] bg-rose-500/10 text-rose-300 px-2.5 py-0.5 rounded-md font-bold">{brand.personality}</span>
                            </div>
                          </div>
                        </div>

                        {/* Description */}
                        <div className="min-h-[40px]">
                          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed font-sans">{brand.description || 'لم يتم كتابة وصف مخصص للبراند بعد. أضف وصفاً لمساعدة الذكاء الاصطناعي على فهم أهدافك.'}</p>
                        </div>

                        {/* Micro meta details */}
                        <div className="grid grid-cols-2 gap-2 bg-slate-900/30 p-2.5 rounded-xl border border-slate-850">
                          <div className="flex items-center gap-1.5 min-w-0" title="اللغة المستهدفة للبراند">
                            <Globe size={12.5} className="text-slate-500 shrink-0" />
                            <span className="text-[10px] text-slate-400 truncate font-medium">{brand.language || 'العربية'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 min-w-0" title="الجمهور المستهدف">
                            <Users size={12.5} className="text-slate-500 shrink-0" />
                            <span className="text-[10px] text-slate-400 truncate font-medium">{brand.targetAudience || 'جمهور عام'}</span>
                          </div>
                        </div>

                        {/* Color Palette visualization */}
                        {brandColors.length > 0 && (
                          <div className="pt-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">لوحة الألوان:</span>
                              <div className="flex items-center gap-1.5">
                                {brandColors.slice(0, 4).map((col: string, idx: number) => (
                                  <div 
                                    key={idx} 
                                    className="w-3.5 h-3.5 rounded-full border border-white/10 shadow-sm relative group/color cursor-help"
                                    style={{ backgroundColor: col }}
                                    title={col}
                                  >
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover/color:block bg-slate-950 text-white text-[8px] font-mono px-1.5 py-0.5 rounded border border-slate-800 pointer-events-none whitespace-nowrap z-10">
                                      {col}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Footer Action buttons */}
                        <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-850">
                          <span className="text-[10px] font-mono font-bold text-slate-600">ID: {brand.id.slice(0,6)}...</span>
                          
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                setShareBrand(brand); 
                              }} 
                              className="text-[10px] flex items-center gap-1.5 text-rose-400 hover:text-white bg-rose-500/5 hover:bg-rose-500 border border-rose-500/10 px-2.5 py-1.5 rounded-lg font-bold transition-all active:scale-95 cursor-pointer"
                              title="مشاركة الهوية التجارية للعملاء"
                            >
                              <Share2 size={11} />
                              <span>مشاركة</span>
                            </button>

                            <button 
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                handleEdit(brand); 
                              }} 
                              className="text-[10px] flex items-center gap-1.5 text-indigo-400 hover:text-white bg-indigo-500/5 hover:bg-indigo-600 border border-indigo-500/10 px-2.5 py-1.5 rounded-lg font-bold transition-all active:scale-95 cursor-pointer"
                              title="تعديل تفاصيل هوبة العلامة التجارية"
                            >
                              <Edit3 size={11} />
                              <span>تعديل</span>
                            </button>
                            
                            <button 
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                handleDelete(brand.id); 
                              }} 
                              className="text-[10px] flex items-center gap-1.5 text-slate-400 hover:text-white bg-slate-500/5 hover:bg-rose-600 border border-slate-500/10 px-2.5 py-1.5 rounded-lg font-bold transition-all active:scale-95 cursor-pointer"
                              title="حذف العلامة التجارية نهائياً"
                            >
                              <Trash2 size={11} />
                              <span>حذف</span>
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'editor' && (
            <motion.div key="editor" initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} exit={{opacity:0, scale:0.95}} className="space-y-8 max-w-4xl mx-auto pb-20">
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-6 sticky top-0 bg-slate-900/80 backdrop-blur-md z-20 py-4">
                 <div>
                    <h2 className="text-2xl font-black text-white">{isCreating ? 'إضافة هوية براند جديدة' : 'تعديل هوية البراند'}</h2>
                    <p className="text-xs text-slate-400 mt-1">يستخدم الذكاء الاصطناعي هذه البيانات لتخصيص كل المحتوى الذي يتم توليده ليتناسب مع شخصية العلامة التجارية.</p>
                 </div>
                 <div className="flex gap-3">
                   <button onClick={() => setActiveTab('profiles')} className="px-4 py-2 bg-slate-800 text-slate-300 hover:text-white rounded-xl text-sm font-bold transition-colors">إلغاء</button>
                   <button onClick={handleSave} className="px-6 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-sm font-bold transition-colors shadow-lg shadow-rose-600/20">حفظ ההوية</button>
                 </div>
              </div>

              <div className="bg-gradient-to-r from-rose-500/10 to-indigo-500/10 border border-slate-700/50 p-6 rounded-2xl mb-8">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                  <div className="flex-1 space-y-2 w-full">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-300 flex items-center gap-2">
                       <Globe size={14} className="text-rose-400" /> التعرف الذكي عبر رابط الموقع
                    </label>
                    <input 
                      type="url" 
                      placeholder="https://example.com" 
                      value={aiUrl} 
                      onChange={e => setAiUrl(e.target.value)} 
                      className="w-full bg-slate-950/80 border border-slate-700 rounded-xl py-3 px-4 text-sm text-slate-200 focus:border-rose-500/50 outline-none" 
                    />
                  </div>
                  <button 
                    onClick={handleAIFill}
                    disabled={aiLoading}
                    className="h-11 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-sm font-bold shadow-lg transition-all flex items-center justify-center min-w-[200px]"
                  >
                    {aiLoading ? (
                      <><Loader2 className="animate-spin ml-2" size={16}/> جاري السحب...</>
                    ) : (
                      <><Sparkles className="ml-2 text-rose-400" size={16}/> سحب البيانات تلقائياً</>
                    )}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Basic Info */}
                <div className="space-y-6">
                  <h3 className="font-black text-lg text-white flex items-center gap-2"><Briefcase className="text-rose-400" size={18}/> المعلومات الأساسية</h3>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-400">اسم العلامة التجارية *</label>
                    <input type="text" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-200 focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/50 outline-none" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-400">نوع المجال (Industry)</label>
                    <input type="text" placeholder="مثال: تسويق رقمي، مطعم، أزياء..." value={formData.industry || ''} onChange={e => setFormData({...formData, industry: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-200 focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/50 outline-none" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-400">وصف النشاط بالتفصيل</label>
                    <textarea rows={4} value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-200 focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/50 outline-none resize-none" />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-400">الجمهور المستهدف (Target Audience)</label>
                    <input type="text" placeholder="مثال: رواد الأعمال، الشباب من 18-24، أصحاب الشركات..." value={formData.targetAudience || ''} onChange={e => setFormData({...formData, targetAudience: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-200 focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/50 outline-none" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-xs font-bold uppercase tracking-widest text-slate-400">البريد الإلكتروني</label>
                       <input type="email" placeholder="البريد للتواصل..." value={formData.contactEmail || ''} onChange={e => setFormData({...formData, contactEmail: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-200 focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/50 outline-none" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs font-bold uppercase tracking-widest text-slate-400">رقم التواصل</label>
                       <input type="text" placeholder="رقم الجوال..." value={formData.contactPhone || ''} onChange={e => setFormData({...formData, contactPhone: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-200 focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/50 outline-none" />
                    </div>
                  </div>
                </div>

                {/* Voice & Personality */}
                <div className="space-y-6">
                  <h3 className="font-black text-lg text-white flex items-center gap-2"><BookType className="text-rose-400" size={18}/> شخصية البراند (Brand Voice)</h3>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-400">ملف الشخصية الأساسي (Persona Profiling)</label>
                    <div className="flex flex-wrap gap-2">
                      {personalites.map(p => (
                        <button key={p} onClick={() => setFormData({...formData, personality: p})} className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all border ${formData.personality === p ? 'bg-rose-600 border-rose-500 text-white shadow-lg' : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'}`}>
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-400">أسلوب الكتابة المفضل (Writing Style)</label>
                    <textarea rows={3} placeholder="كيف نكتب؟ مثال: جمل قصيرة ومباشرة، استخدام الجناس والطباق بشكل خفيف، عدم استخدام المبني للمجهول..." value={formData.writingStyle || ''} onChange={e => setFormData({...formData, writingStyle: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-200 focus:border-rose-500/50 outline-none resize-none" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">كلمات مفضلة (افصل بفاصلة)</label>
                      <input type="text" value={formData.preferredWords || ''} onChange={e => setFormData({...formData, preferredWords: e.target.value})} className="w-full bg-emerald-500/5 border border-emerald-500/20 rounded-xl py-2 px-3 text-sm text-slate-200 focus:border-emerald-500/50 outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">كلمات ممنوعة (افصل بفاصلة)</label>
                      <input type="text" value={formData.bannedWords || ''} onChange={e => setFormData({...formData, bannedWords: e.target.value})} className="w-full bg-rose-500/5 border border-rose-500/20 rounded-xl py-2 px-3 text-sm text-slate-200 focus:border-rose-500/50 outline-none" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-400">الدعوة للإجراء المفضلة (Preferred CTA)</label>
                    <input type="text" placeholder="مثال: احجز الآن، انضم للرحلة، تواصل معنا..." value={formData.preferredCta || ''} onChange={e => setFormData({...formData, preferredCta: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-200 focus:border-rose-500/50 outline-none" />
                  </div>

                  <div className="space-y-4 pt-4 border-t border-slate-800/80">
                    <div className="flex items-center justify-between">
                       <label className="text-xs font-bold uppercase tracking-widest text-slate-400">نبرات مخصصة (Custom Tones)</label>
                       <button onClick={() => {
                          const current = formData.customTones || [];
                          setFormData({...formData, customTones: [...current, { id: 'tone-' + Date.now() + '-' + Math.floor(Math.random() * 1000000), name: 'نبرة جديدة', prompt: '' }]});
                       }} className="text-[10px] bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white px-2 py-1 rounded transition-colors font-bold flex items-center gap-1">
                          <Plus size={12} /> إضافة نبرة مخصصة
                       </button>
                    </div>
                    {formData.customTones?.map((tone, idx) => (
                      <div key={tone.id} className="bg-slate-950 border border-slate-800 p-3 rounded-xl space-y-3 relative group">
                         <button onClick={() => {
                            const newTones = [...(formData.customTones || [])];
                            newTones.splice(idx, 1);
                            setFormData({...formData, customTones: newTones});
                         }} className="absolute top-3 left-3 text-slate-500 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2 size={14} />
                         </button>
                         <div>
                            <label className="block text-[10px] text-slate-500 mb-1">اسم النبرة</label>
                            <input value={tone.name} onChange={e => {
                               const newTones = [...(formData.customTones || [])];
                               newTones[idx].name = e.target.value;
                               setFormData({...formData, customTones: newTones});
                            }} className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-3 text-sm text-slate-200 focus:border-rose-500/50 outline-none" />
                         </div>
                         <div>
                            <label className="block text-[10px] text-slate-500 mb-1">البرومبت الخاص (التوجيهات)</label>
                            <textarea value={tone.prompt} onChange={e => {
                               const newTones = [...(formData.customTones || [])];
                               newTones[idx].prompt = e.target.value;
                               setFormData({...formData, customTones: newTones});
                            }} rows={2} className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-3 text-xs text-slate-300 focus:border-rose-500/50 outline-none resize-none" placeholder="مثال: تحدث بصفتك صديق مقرب للعميل بطريقة مرحة وعفوية جداً..." />
                         </div>
                      </div>
                    ))}
                    {(!formData.customTones || formData.customTones.length === 0) && (
                      <p className="text-[10px] text-slate-500 text-center py-2">لا توجد نبرات مخصصة مسجلة</p>
                    )}
                  </div>
                </div>

                {/* Brand Assets Placeholder */}
                <div className="col-span-1 md:col-span-2 space-y-4 pt-6 border-t border-slate-800">
                  <h3 className="font-black text-lg text-white flex items-center gap-2"><Palette className="text-rose-400" size={18}/> الأصول البصرية (Brand Assets)</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-400 block mb-2">الشعار الرئيسي (Upload Logo)</label>
                      <label className="h-24 border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-xl flex flex-col items-center justify-center text-slate-500 transition-all cursor-pointer bg-slate-900/50 group overflow-hidden relative">
                        {formData.logo ? (
                          <div className="w-full h-full relative group">
                            <img src={formData.logo} alt="Logo Preview" className="w-full h-full object-contain p-2" />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <span className="text-[10px] font-bold text-white uppercase tracking-tighter">تغيير الصورة</span>
                            </div>
                          </div>
                        ) : (
                          <>
                            <ImageIcon size={24} className="group-hover:scale-110 transition-transform mb-1" />
                            <span className="text-[10px] font-bold text-slate-500 uppercase">اضغط للرفع</span>
                          </>
                        )}
                        <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                      </label>
                    </div>
                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl relative overflow-hidden">
                      {isExtractingColors && (
                        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center gap-2">
                          <Loader2 className="animate-spin text-rose-500" size={24} />
                          <span className="text-[10px] font-bold text-rose-300">جاري استخلاص ألوان الشعار...</span>
                        </div>
                      )}
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-400 block mb-2 flex items-center justify-between">
                        <span>ألوان العلامة التجارية (Hex Codes)</span>
                        {formData.colors && (
                          <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md">مستخلصة تلقائياً ✨</span>
                        )}
                      </label>
                      <input 
                        type="text" 
                        placeholder="#FF0000, #00FF00, #10B981" 
                        value={formData.colors || ''} 
                        onChange={e => setFormData({...formData, colors: e.target.value})} 
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2 px-3 text-sm text-slate-200 outline-none focus:border-rose-500/50" 
                      />
                      
                      {/* Live Visual Palette Indicator */}
                      {formData.colors && (
                        <div className="mt-4 pt-3 border-t border-slate-800/80">
                          <span className="text-[10px] font-bold text-slate-500 block mb-2">اللوحة البصرية المفرغة النشطة:</span>
                          <div className="flex flex-wrap gap-3">
                            {formData.colors.split(',').map((color, idx) => {
                              const trimmedColor = color.trim();
                              // Simple hex format check
                              if (!trimmedColor.startsWith('#')) return null;
                              return (
                                <div key={idx} className="flex items-center gap-1.5 bg-slate-900/40 p-1.5 pr-2.5 rounded-full border border-slate-800/80 shadow-inner">
                                  <div 
                                    className="w-5 h-5 rounded-full border border-white/10 shadow-sm shrink-0" 
                                    style={{ backgroundColor: trimmedColor }}
                                  />
                                  <span className="text-[10.5px] font-mono whitespace-nowrap text-slate-300 font-medium select-all">{trimmedColor}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              </div>

            </motion.div>
          )}

          {activeTab === 'usage' && activeBrand && (
            <motion.div key="usage" initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} exit={{opacity:0, scale:0.95}} className="space-y-8 max-w-4xl mx-auto pb-20">
              <div className="border-b border-slate-800 pb-6 sticky top-0 bg-slate-900/80 backdrop-blur-md z-20 py-4">
                 <h2 className="text-2xl font-black text-white flex items-center gap-2"><BarChart2 className="text-rose-400" /> إحصائيات الاستهلاك ({activeBrand.name})</h2>
                 <p className="text-xs text-slate-400 mt-1">تتبع استهلاك واجهات برمجة التطبيقات (API) للذكاء الاصطناعي الخاص بهذه العلامة التجارية.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="bg-slate-950 border border-slate-800 p-6 rounded-3xl">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">استهلاك التوكنز التراكمي</p>
                    <div className="text-4xl font-black text-white">{activeBrand.usageStats?.tokensUsed?.toLocaleString() || 0}</div>
                    <p className="text-[10px] text-emerald-400 mt-2 font-medium bg-emerald-500/10 inline-block px-2 py-0.5 rounded">يتم احتساب توكنز (Gemini / OpenAI)</p>
                 </div>
                 <div className="bg-slate-950 border border-slate-800 p-6 rounded-3xl">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">توليد الصور</p>
                    <div className="text-4xl font-black text-white">{activeBrand.usageStats?.imageGenerations?.toLocaleString() || 0}</div>
                    <p className="text-[10px] text-rose-400 mt-2 font-medium bg-rose-500/10 inline-block px-2 py-0.5 rounded">صور تم توليدها بالذكاء الاصطناعي</p>
                 </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>

        {shareBrand && (
          <ShareModal
            isOpen={!!shareBrand}
            onClose={() => setShareBrand(null)}
            title={`مشاركة كتاب الهوية: ${shareBrand.name}`}
            shareUrl={`${window.location.origin}/shared/brand/${shareBrand.id}`}
            previewType="brand"
            previewDetails={{
              name: shareBrand.name,
              subtitle: shareBrand.industry || 'صناعة عامة',
              extraLabel: 'شخصية العلامة',
              extraValue: shareBrand.personality,
              colors: shareBrand.colors ? shareBrand.colors.split(',').map((c: string) => c.trim()) : []
            }}
          />
        )}

      <ConfirmDialog
        isOpen={deleteConfirmation.isOpen}
        title="تأكيد الحذف"
        message="هل أنت متأكد من حذف هذه العلامة التجارية؟ لا يمكن التراجع عن هذا الإجراء."
        confirmText="حذف نهائي"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirmation({ isOpen: false, id: null })}
      />
      </div>
    </div>
  );
}
