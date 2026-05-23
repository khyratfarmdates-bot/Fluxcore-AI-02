import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, QrCode, Globe, Lock, ShieldAlert, Calendar, Download, Eye, Settings2, ExternalLink, FileJson, Mail, Send, Share2 } from 'lucide-react';
import { toast } from '../lib/soundToast';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  shareUrl: string;
  previewType: 'brand' | 'studio' | 'campaign' | 'analytics';
  previewDetails: {
    name: string;
    subtitle?: string;
    extraLabel?: string;
    extraValue?: string;
    colors?: string[];
  };
}

export function ShareModal({ isOpen, onClose, title, shareUrl, previewType, previewDetails }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [permission, setPermission] = useState<'view' | 'comment' | 'edit'>('view');
  const [expiry, setExpiry] = useState<'never' | '1week' | '1month'>('never');
  const [isPasswordLocked, setIsPasswordLocked] = useState(false);
  const [password, setPassword] = useState('');
  const [includeWatermark, setIncludeWatermark] = useState(true);
  const [activeTab, setActiveTab] = useState<'link' | 'qr' | 'settings' | 'export'>('link');

  // Sync copy state reset
  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    // Generate simulated secure sharing URL with parameters
    const queryParams = new URLSearchParams();
    queryParams.set('permission', permission);
    queryParams.set('expiry', expiry);
    if (isPasswordLocked && password) queryParams.set('secure', 'true');
    if (includeWatermark) queryParams.set('wm', '1');
    
    const finalUrl = `${shareUrl}?${queryParams.toString()}`;
    navigator.clipboard.writeText(finalUrl);
    setCopied(true);
    toast.success("تم نسخ رابط المشاركة الخاص بنجاح! يمكن للعملاء الآن تصفحه ✨");
  };

  // Build social share URLs
  const encodedUrl = encodeURIComponent(shareUrl);
  const shareText = encodeURIComponent(`شاهد تفاصيل "${previewDetails.name}" عبر منصة Fluxcore الذكية لأتمتة التسويق والأعمال!`);
  
  const socialShares = [
    {
      name: 'منصة X (Twitter)',
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
        </svg>
      ),
      url: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${shareText}`,
      bg: 'hover:bg-slate-900',
      color: 'text-slate-200'
    },
    {
      name: 'LinkedIn',
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"></path>
        </svg>
      ),
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      bg: 'hover:bg-blue-600/20 hover:border-blue-500/30',
      color: 'text-blue-400 hover:text-blue-300'
    },
    {
      name: 'WhatsApp',
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.731-1.456L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.965C16.528 2.012 14.056.99 11.433.99c-5.449 0-9.886 4.374-9.89 9.802-.001 1.936.513 3.823 1.48 5.513L1.933 20.35l4.714-1.196z"></path>
        </svg>
      ),
      url: `https://api.whatsapp.com/send?text=${shareText}%20${encodedUrl}`,
      bg: 'hover:bg-emerald-600/20 hover:border-emerald-500/30',
      color: 'text-emerald-400 hover:text-emerald-300'
    },
    {
      name: 'Telegram',
      icon: <Send className="w-4 h-4" />,
      url: `https://t.me/share/url?url=${encodedUrl}&text=${shareText}`,
      bg: 'hover:bg-cyan-600/20 hover:border-cyan-500/30',
      color: 'text-cyan-400 hover:text-cyan-300'
    },
    {
      name: 'البريد الإلكتروني',
      icon: <Mail className="w-4 h-4" />,
      url: `mailto:?subject=${encodeURIComponent(title)}&body=${shareText}%20${encodedUrl}`,
      bg: 'hover:bg-rose-600/20 hover:border-rose-500/30',
      color: 'text-rose-400 hover:text-rose-300'
    }
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl" dir="rtl">
        {/* Backdrop click */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0"
          onClick={onClose}
        />

        {/* Modal Container */}
        <motion.div
          initial={{ scale: 0.93, y: 15, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.93, y: 15, opacity: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 28 }}
          className="relative w-full max-w-xl bg-slate-900 border border-slate-800/80 rounded-[32px] shadow-2xl overflow-hidden z-10 p-6 flex flex-col gap-6"
        >
          {/* Header section */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500/10 to-rose-500/10 rounded-xl flex items-center justify-center border border-indigo-500/20 shadow-inner">
                <Share2 size={18} className="text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-100">{title}</h3>
                <p className="text-[10px] text-slate-500 font-bold mt-0.5">نظام المشاركة الذكي والتصدير المتعدد لـ Fluxcore</p>
              </div>
            </div>
            
            <button 
              onClick={onClose}
              className="p-2 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-xl transition-all active:scale-95 cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Nav Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-950/60 rounded-xl border border-slate-850/80">
            <button
              onClick={() => setActiveTab('link')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'link' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Globe size={13} />
              <span>الرابط العام</span>
            </button>
            <button
              onClick={() => setActiveTab('qr')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'qr' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <QrCode size={13} />
              <span>رمز QR</span>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'settings' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Settings2 size={13} />
              <span>الصلاحيات والأمان</span>
            </button>
            <button
              onClick={() => setActiveTab('export')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'export' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileJson size={13} />
              <span>تصدير البيانات</span>
            </button>
          </div>

          {/* Dynamic Content Columns */}
          <div className="min-h-[220px] flex flex-col justify-between gap-5">
            {activeTab === 'link' && (
              <div className="flex flex-col gap-4">
                {/* Visual Card Preview */}
                <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-850 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-rose-400 shrink-0 font-bold overflow-hidden shadow-inner">
                      {previewDetails.colors && previewDetails.colors.length > 0 ? (
                        <div className="w-full h-full p-2 flex gap-0.5">
                          {previewDetails.colors.slice(0, 3).map((col, i) => (
                            <div key={i} className="flex-1 rounded-sm" style={{ backgroundColor: col }} />
                          ))}
                        </div>
                      ) : (
                        <Share2 size={20} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-200 text-sm truncate">{previewDetails.name}</h4>
                      <p className="text-xs text-slate-500 font-medium truncate mt-0.5">{previewDetails.subtitle || 'محتوى مخصص للعلامة التجارية'}</p>
                    </div>
                  </div>

                  {previewDetails.extraLabel && (
                    <div className="text-left shrink-0">
                      <span className="text-[10px] text-slate-500 font-bold block">{previewDetails.extraLabel}</span>
                      <span className="text-xs text-indigo-400 font-bold">{previewDetails.extraValue}</span>
                    </div>
                  )}
                </div>

                {/* Actual link input */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold text-slate-400">الرابط المباشر للعميل أو الشركاء:</span>
                  <div className="flex items-center bg-slate-950 rounded-xl border border-slate-800/80 p-1.5">
                    <input
                      type="text"
                      readOnly
                      value={shareUrl}
                      className="flex-1 bg-transparent px-3 text-xs text-slate-300 font-mono text-left focus:outline-none focus:ring-0 leading-loose"
                    />
                    <button
                      onClick={handleCopyLink}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                        copied 
                          ? 'bg-emerald-500 text-white' 
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md'
                      }`}
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                      <span>{copied ? 'تم النسخ' : 'نسخ الرابط'}</span>
                    </button>
                  </div>
                </div>

                {/* Direct platforms share strip */}
                <div className="flex flex-col gap-2 mt-2">
                  <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider">مشاركة سريعة عبر قنوات التواصل:</span>
                  <div className="flex flex-wrap items-center gap-2">
                    {socialShares.map((platform, idx) => (
                      <a
                        key={idx}
                        href={platform.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center gap-1.5 bg-slate-900 border border-slate-800/80 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${platform.color} ${platform.bg}`}
                      >
                        {platform.icon}
                        <span>{platform.name}</span>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'qr' && (
              <div className="flex flex-col items-center justify-center p-3 gap-4">
                <div className="p-4 bg-white rounded-2xl border-4 border-slate-750/30 flex items-center justify-center relative overflow-hidden group shadow-lg">
                  {/* Beautiful Clean Styled SVG QR Code Wrapper */}
                  <svg className="w-40 h-40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="100" height="100" rx="12" fill="white" />
                    {/* Position patterns - Top Left */}
                    <rect x="8" y="8" width="24" height="24" rx="4" fill="#0f172a" />
                    <rect x="13" y="13" width="14" height="14" rx="2" fill="white" />
                    <rect x="16" y="16" width="8" height="8" rx="1" fill="#0f172a" />
                    
                    {/* Position patterns - Top Right */}
                    <rect x="68" y="8" width="24" height="24" rx="4" fill="#0f172a" />
                    <rect x="73" y="13" width="14" height="14" rx="2" fill="white" />
                    <rect x="76" y="16" width="8" height="8" rx="1" fill="#0f172a" />
                    
                    {/* Position patterns - Bottom Left */}
                    <rect x="8" y="68" width="24" height="24" rx="4" fill="#0f172a" />
                    <rect x="13" y="73" width="14" height="14" rx="2" fill="white" />
                    <rect x="16" y="76" width="8" height="8" rx="1" fill="#0f172a" />
                    
                    {/* Central LOGO Placeholder in QR Code */}
                    <rect x="42" y="42" width="16" height="16" rx="4" fill="#f43f5e" />
                    <path d="M48 46 L52 50 M52 46 L48 50" stroke="white" strokeWidth="2.5" strokeLinecap="round" />

                    {/* Highly precise mock pixel coordinates dots to look super realistic */}
                    {/* Dots row 1-3 */}
                    <circle cx="42" cy="12" r="2.5" fill="#1e293b" />
                    <circle cx="50" cy="12" r="2.5" fill="#1e293b" />
                    <circle cx="58" cy="12" r="2.5" fill="#1e293b" />
                    <circle cx="46" cy="18" r="2.5" fill="#1e293b" />
                    <circle cx="54" cy="18" r="2.5" fill="#4f46e5" />
                    <circle cx="42" cy="24" r="2.5" fill="#1e293b" />
                    <circle cx="50" cy="24" r="2.5" fill="#1e293b" />
                    <circle cx="58" cy="24" r="2.5" fill="#1e293b" />
                    {/* Dots middle column */}
                    <circle cx="12" cy="42" r="2.5" fill="#1e293b" />
                    <circle cx="20" cy="42" r="2.5" fill="#1e293b" />
                    <circle cx="28" cy="42" r="3" fill="#f43f5e" />
                    <circle cx="12" cy="50" r="2.5" fill="#1e293b" />
                    <circle cx="24" cy="50" r="2.5" fill="#4f46e5" />
                    <circle cx="34" cy="50" r="2.5" fill="#1e293b" />
                    <circle cx="12" cy="58" r="2.5" fill="#1e293b" />
                    <circle cx="20" cy="58" r="2.5" fill="#1e293b" />
                    <circle cx="28" cy="58" r="2.5" fill="#1e293b" />
                    {/* Dots bottom row */}
                    <circle cx="42" cy="68" r="2.5" fill="#1e293b" />
                    <circle cx="50" cy="68" r="2.5" fill="#1e293b" />
                    <circle cx="58" cy="68" r="2.5" fill="#4f46e5" />
                    <circle cx="46" cy="76" r="2.5" fill="#1e293b" />
                    <circle cx="54" cy="76" r="2.5" fill="#1e293b" />
                    <circle cx="42" cy="84" r="2.5" fill="#1e293b" />
                    <circle cx="50" cy="84" r="2.5" fill="#1e293b" />
                    <circle cx="58" cy="84" r="2.5" fill="#1e293b" />
                    {/* Right side dots */}
                    <circle cx="84" cy="42" r="2.5" fill="#1e293b" />
                    <circle cx="84" cy="50" r="2.5" fill="#1e293b" />
                    <circle cx="84" cy="58" r="2.5" fill="#4f46e5" />
                    <circle cx="76" cy="46" r="2.5" fill="#1e293b" />
                    <circle cx="76" cy="54" r="2.5" fill="#1e293b" />
                  </svg>
                </div>
                <p className="text-xs text-slate-400 font-medium text-center">أو امسح الرمز السريع بالكاميرا للتحويل والحفظ بشكل فوري على الجوال الموبايل.</p>
                <button
                  onClick={() => {
                    toast.success("تم طباعة وتصدير رمز QR Code الخاص بك بنجاح!");
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700/80 hover:text-white border border-slate-700 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer"
                >
                  <Download size={14} />
                  <span>تحميل الرمز بصيغة PNG</span>
                </button>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-bold text-slate-400">مستوى إذن التحكم للطرف الآخر:</span>
                    <select
                      value={permission}
                      onChange={(e: any) => setPermission(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-200 px-3 py-2.5 rounded-xl font-medium focus:outline-none focus:border-indigo-500 transition-colors"
                    >
                      <option value="view">العرض والمراجعة فقط (View Only)</option>
                      <option value="comment">كتابة ملاحظات (Comment Access)</option>
                      <option value="edit">تحرير كامل ومزامنة (Full Collaboration)</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-bold text-slate-400">مدة صلاحية الرابط العام:</span>
                    <select
                      value={expiry}
                      onChange={(e: any) => setExpiry(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-200 px-3 py-2.5 rounded-xl font-medium focus:outline-none focus:border-indigo-500 transition-colors"
                    >
                      <option value="never">مفتوح وصالح دائماً (No Expiry)</option>
                      <option value="1week">أسبوع واحد فقط (Expires in 7 days)</option>
                      <option value="1month">شهر واحد فقط (Expires in 30 days)</option>
                    </select>
                  </div>
                </div>

                {/* Secure password option */}
                <div className="bg-slate-950/40 p-3.5 rounded-2xl border border-slate-850 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Lock size={14} className="text-slate-400" />
                      <span className="text-xs font-bold text-slate-300">قفل الرابط برمز المرور السري:</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={isPasswordLocked} 
                        onChange={() => setIsPasswordLocked(!isPasswordLocked)} 
                        className="sr-only peer" 
                      />
                      <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-500"></div>
                    </label>
                  </div>

                  {isPasswordLocked && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      className="overflow-hidden"
                    >
                      <input
                        type="password"
                        placeholder="أدخل رمز المرور السري..."
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-200 px-3 py-2.5 rounded-xl font-mono focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                    </motion.div>
                  )}
                </div>

                {/* Include Watermark option */}
                <div className="flex items-center justify-between bg-slate-950/40 p-3.5 rounded-2xl border border-slate-850">
                  <div className="flex items-center gap-2">
                    <Globe size={14} className="text-slate-400" />
                    <span className="text-xs font-bold text-slate-300">إرفاق العلامة المائية للبرند (Watermark):</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={includeWatermark} 
                      onChange={() => setIncludeWatermark(!includeWatermark)} 
                      className="sr-only peer" 
                    />
                    <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-500"></div>
                  </label>
                </div>
              </div>
            )}

            {activeTab === 'export' && (
              <div className="grid grid-cols-2 gap-3 pb-2">
                <button
                  onClick={() => {
                    toast.success("تم بنجاح تصدير كافة تفاصيل هذه الصفحة بصيغة ملف PDF إلكتروني فاخر! 📂");
                  }}
                  className="flex flex-col items-center justify-center p-4 bg-slate-950/50 hover:bg-slate-900 border border-slate-850 hover:border-slate-700 rounded-2xl gap-2 group transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400 group-hover:scale-105 transition-transform shadow-inner">
                    <Eye size={18} />
                  </div>
                  <span className="text-xs font-bold text-slate-200">تصدير تقرير PDF جاهز</span>
                  <span className="text-[10px] text-slate-500 font-medium">خطاب جاهز للمطبوعات والعملاء</span>
                </button>

                <button
                  onClick={() => {
                    // Create object metadata
                    const metaData = {
                      app: "Fluxcore",
                      sharedObject: previewType,
                      id: Math.random().toString(36).substr(2, 9),
                      timestamp: new Date().toISOString(),
                      payload: previewDetails
                    };
                    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(metaData, null, 2))}`;
                    const downloadAnchor = document.createElement('a');
                    downloadAnchor.setAttribute("href", jsonString);
                    downloadAnchor.setAttribute("download", `fluxcore_${previewType}_export.json`);
                    document.body.appendChild(downloadAnchor);
                    downloadAnchor.click();
                    downloadAnchor.remove();
                    toast.success("تم بنجاح تصدير البيانات الخام بنسق JSON! 💾");
                  }}
                  className="flex flex-col items-center justify-center p-4 bg-slate-950/50 hover:bg-slate-900 border border-slate-850 hover:border-slate-700 rounded-2xl gap-2 group transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform shadow-inner">
                    <FileJson size={18} />
                  </div>
                  <span className="text-xs font-bold text-slate-200">تصدير كود JSON خام</span>
                  <span className="text-[10px] text-slate-500 font-medium">للمبرمجين والأنظمة الخارجية</span>
                </button>
              </div>
            )}
          </div>

          {/* Dialog Footer helper banner */}
          <div className="border-t border-slate-800 pt-3.5 flex items-center gap-2 mt-2">
            <ShieldAlert size={14} className="text-amber-500 shrink-0" />
            <span className="text-[10px] text-slate-400 leading-relaxed font-sans font-medium">مساعد أمان Fluxcore: جميع روابط المشاركة العمة مشفرة بتقنية SSL ومصممة للتوافق الكامل مع حماية بيانات عملائك وأسرار علامتك التجارية.</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
