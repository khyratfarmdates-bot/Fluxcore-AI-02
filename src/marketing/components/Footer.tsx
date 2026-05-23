import React from "react";

export function Footer() {
  return (
    <footer className="bg-[#030712] border-t border-slate-800/80 pt-16 pb-8 relative z-10">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-black text-white text-lg">
                F
              </div>
              <span className="font-black text-xl tracking-tight text-white flex items-center gap-1">
                Fluxcore AI 02<span className="text-indigo-400">.</span>
              </span>
            </div>
            <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-xs">
              نحن نؤمن بأن الذكاء الاصطناعي وجد ليعزز الإبداع البشري وليس ليستبدله. انطلق في رحلتك بقوة الذكاء الاصطناعي اليوم.
            </p>
          </div>
          
          <div>
            <h4 className="font-bold text-white mb-6">المنتجات</h4>
            <ul className="space-y-4 text-sm font-medium text-slate-400">
              <li><a href="#" className="hover:text-indigo-400 transition-colors">استوديو الذكاء الاصطناعي</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">نظام الجدولة الذكي</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">هوية العلامة التجارية</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">لوحة الوكالة</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold text-white mb-6">الشركة</h4>
            <ul className="space-y-4 text-sm font-medium text-slate-400">
              <li><a href="#" className="hover:text-indigo-400 transition-colors">من نحن</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">المدونة</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">الشروط والأحكام</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">سياسة الخصوصية</a></li>
            </ul>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-slate-800 flex-col-reverse gap-4">
          <p className="text-sm font-bold text-slate-500">
            &copy; {new Date().getFullYear()} Fluxcore AI 02 Inc. جميع الحقوق محفوظة.
          </p>
          <div className="flex gap-4">
            <a href="#" className="text-slate-500 hover:text-white transition-colors">تويتر (X)</a>
            <a href="#" className="text-slate-500 hover:text-white transition-colors">لينكد إن</a>
            <a href="#" className="text-slate-500 hover:text-white transition-colors">تيك توك</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
