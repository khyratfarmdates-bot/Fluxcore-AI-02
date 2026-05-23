import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Lock, LogIn, Github, Chrome, Facebook, Apple, Send, UserPlus } from "lucide-react";
import { signInWithGoogle, signInWithFacebook, signInWithApple, signInWithTikTok, signInEmail, signUpEmail } from "../lib/firebase";
import { toast } from '../lib/soundToast';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("يرجى ملء كافة الحقول");
      return;
    }
    setLoading(true);
    try {
      if (mode === "login") {
        await signInEmail(email, password);
        toast.success("تم تسجيل الدخول بنجاح!");
      } else {
        await signUpEmail(email, password);
        toast.success("تم إنشاء الحساب بنجاح!");
      }
      onClose();
    } catch (err: any) {
      console.error(err);
      // Errors handled by firebase.ts or locally
    } finally {
      setLoading(false);
    }
  };

  const handleProviderLogin = async (method: () => Promise<any>) => {
    try {
      await method();
      onClose();
    } catch (err) {
      // Handled in firebase.ts
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" dir="rtl">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-[32px] overflow-hidden shadow-2xl relative z-10"
      >
        <button 
          onClick={onClose}
          className="absolute top-6 left-6 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="p-8 pt-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-black text-white mb-2">
              {mode === "login" ? "مرحباً بك مجدداً" : "انضم إلى Fluxcore AI 02"}
            </h2>
            <p className="text-slate-400 text-sm">
              {mode === "login" ? "سجل دخولك للوصول إلى استوديو الذكاء الاصطناعي الخاص بك" : "ابدأ رحلتك في صناعة المحتوى الذكي اليوم"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 mr-2">البريد الإلكتروني</label>
              <div className="relative">
                <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 pr-12 pl-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 mr-2">كلمة المرور</label>
              <div className="relative">
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 pr-12 pl-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium"
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/20 active:scale-[0.98]"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {mode === "login" ? <LogIn size={18} /> : <UserPlus size={18} />}
                  {mode === "login" ? "دخول" : "إنشاء حساب"}
                </>
              )}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-900 px-4 text-slate-500 font-bold">أو عبر المنصات</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <ProviderButton 
              icon={<Chrome size={20} className="text-white" />} 
              label="جوجل" 
              onClick={() => handleProviderLogin(signInWithGoogle)}
            />
            <ProviderButton 
              icon={<Facebook size={20} className="text-[#1877F2]" />} 
              label="فيسبوك" 
              onClick={() => handleProviderLogin(signInWithFacebook)}
            />
            <ProviderButton 
              icon={<Apple size={20} className="text-white" />} 
              label="أبل" 
              onClick={() => handleProviderLogin(signInWithApple)}
            />
            <ProviderButton 
              icon={<div className="font-black text-white text-xs">TikTok</div>} 
              label="تيك توك" 
              onClick={() => handleProviderLogin(signInWithTikTok)}
            />
          </div>

          <p className="text-center mt-8 text-sm text-slate-500 font-medium">
            {mode === "login" ? "ليس لديك حساب؟" : "لديك حساب بالفعل؟"}
            <button 
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
              className="text-indigo-400 hover:text-indigo-300 mr-2 font-bold"
            >
              {mode === "login" ? "سجل الآن مجاناً" : "سجل دخولك"}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

function ProviderButton({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="flex items-center justify-center gap-3 bg-slate-950 border border-slate-800 hover:border-slate-700 p-3.5 rounded-2xl transition-all active:scale-95 group"
    >
      {icon}
      <span className="text-xs font-bold text-slate-300 group-hover:text-white">{label}</span>
    </button>
  );
}
