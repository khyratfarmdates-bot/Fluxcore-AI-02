import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, PenTool, Sparkles, Workflow, BarChart3,
  Settings, Search, Send, Users, Wand2, Blocks, Flag,
  SearchIcon, ChevronLeft, ChevronRight, LogOut, Command,
  Briefcase, ChevronDown, ChevronUp, Terminal, Shield, CreditCard, Cpu, BookOpen
} from 'lucide-react';
import { Logo } from './Logo';
import { NotificationCenter } from '../notifications/NotificationCenter';
import { NetworkStatusIndicator } from './NetworkStatusIndicator';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { toast } from 'sonner';

// Cast icons to avoid React 19 type conflicts
const LayoutDashboardIcon = LayoutDashboard as any;
const PenToolIcon = PenTool as any;
const SparklesIcon = Sparkles as any;
const WorkflowIcon = Workflow as any;
const BarChart3Icon = BarChart3 as any;
const SettingsIcon = Settings as any;
const SearchCompIcon = Search as any;
const SendIcon = Send as any;
const UsersIcon = Users as any;
const Wand2Icon = Wand2 as any;
const BlocksIcon = Blocks as any;
const FlagIcon = Flag as any;
const SearchIconC = SearchIcon as any;
const ChevronLeftIcon = ChevronLeft as any;
const ChevronRightIcon = ChevronRight as any;
const LogOutIcon = LogOut as any;
const CommandIcon = Command as any;
const BriefcaseIcon = Briefcase as any;
const ChevronDownIcon = ChevronDown as any;
const ChevronUpIcon = ChevronUp as any;
const TerminalIcon = Terminal as any;
const ShieldIcon = Shield as any;
const CreditCardIcon = CreditCard as any;
const CpuIcon = Cpu as any;
const BookOpenIcon = BookOpen as any;

interface SubItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  hint?: string;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  hint?: string;
  subItems?: SubItem[];
}

interface NavSection {
  id: string;
  title: string;
  items: NavItem[];
}

interface AppSidebarProps {
  activeModule: string;
  onNavigate: (module: string) => void;
  onOpenCommand: () => void;
  user: {
    displayName?: string | null;
    photoURL?: string | null;
    email?: string | null;
  };
  onLogout: () => void;
}

const sectionColors: Record<string, string> = {
  workspace:  'rgba(99, 102, 241, 0.6)',  // indigo
  production: 'rgba(6, 182, 212, 0.6)',   // cyan
  communication: 'rgba(236, 72, 153, 0.6)', // pink
  system:     'rgba(234, 179, 8, 0.6)',   // yellow
};

export function AppSidebar({ activeModule, onNavigate, onOpenCommand, user, onLogout }: AppSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [openSubMenus, setOpenSubMenus] = useState<Record<string, boolean>>({ advanced_control: false });
  const [isBrandDropdownOpen, setIsBrandDropdownOpen] = useState(false);
  const { brands, activeBrand, setActiveBrandId } = useWorkspace();

  const sidebarWidth = collapsed ? 68 : 256;

  // Auto-expand advanced control if a child is active
  useEffect(() => {
    const isSubItemActive = ['core', 'agency', 'runtime', 'dev', 'admin', 'billing'].includes(activeModule);
    if (isSubItemActive) {
      setOpenSubMenus(prev => ({ ...prev, advanced_control: true }));
    }
  }, [activeModule]);

  const navSections: NavSection[] = [
    {
      id: 'workspace',
      title: 'التطوير والاستراتيجية',
      items: [
        { id: 'dashboard',    label: 'الرئيسية',          icon: <LayoutDashboardIcon size={17} />, hint: 'لوحة التحكم والمتابعة العامة' },
        { id: 'platform_bio', label: 'سيرة المنصة',       icon: <BookOpenIcon size={17} />,        hint: 'رؤية وهيكلية وإمكانيات منصة Fluxcore AI' },
        { id: 'brand',        label: 'هوية العلامة',       icon: <SparklesIcon size={17} />,       hint: 'الأفاتار والمكتبة المعرفية والهوية الصوتية' },
        { id: 'campaigns',    label: 'الحملات الإعلانية', icon: <FlagIcon size={17} />,            hint: 'التخطيط وإدارة حملات التسويق' },
        { id: 'analytics',    label: 'الأداء والتحليلات', icon: <BarChart3Icon size={17} />,       hint: 'إحصائيات المبيعات والأداء والتحويل' },
      ],
    },
    {
      id: 'production',
      title: 'استوديو الإنتاج',
      items: [
        { id: 'studio',     label: 'الاستوديو الذكي',    icon: <PenToolIcon size={17} />,    hint: 'توليد النصوص وصناعة السيناريوهات والبرومبتات' },
        { id: 'media',      label: 'مختبر الوسائط',      icon: <Wand2Icon size={17} />,      hint: 'توليد الصور والفيديوهات وتحرير الوسائط بـ AI' },
        { id: 'seo',        label: 'تحسين السيو',        icon: <SearchIconC size={17} />,    hint: 'تدقيق الموقع وتصدر محركات البحث' },
        { id: 'publishing', label: 'الجدولة والنشر',     icon: <SendIcon size={17} />,       hint: 'جدولة المنشورات التلقائية على منصات التواصل' },
      ],
    },
    {
      id: 'communication',
      title: 'الاتصال والأتمتة',
      items: [
        { id: 'channels',     label: 'قنوات التواصل',    icon: <SearchCompIcon size={17} />,  hint: 'إدارة قنوات تيليجرام ووتساب وحسابات التواصل' },
        { id: 'integrations', label: 'قنوات الربط',       icon: <BlocksIcon size={17} />,      hint: 'ربط متاجر سلة وشوبيفاي والخدمات الخارجية' },
        { id: 'automation',   label: 'أتمتة العمليات',   icon: <WorkflowIcon size={17} />,    hint: 'قوالب الأتمتة الذكية والجدولة بالخلفية' },
      ],
    },
    {
      id: 'system',
      title: 'النواة والتحكم المتقدم',
      items: [
        {
          id: 'advanced_control',
          label: 'التحكم المتقدم',
          icon: <CpuIcon size={17} />,
          hint: 'النواة الذكية، سجل التشخيص، المطورين والإدارة',
          subItems: [
            { id: 'core',    label: 'النواة العصبية AIOS', icon: <CpuIcon size={13} />,        hint: 'إعداد نماذج الذكاء وتوجيه الاستجابة' },
            { id: 'agency',  label: 'فريق العمل والوكلاء',  icon: <UsersIcon size={13} />,       hint: 'إدارة صلاحيات المساعدين والفريق' },
            { id: 'runtime', label: 'سجلات التشغيل الحية',  icon: <TerminalIcon size={13} />,    hint: 'مراقبة العمليات الحية واستهلاك الـ API' },
            { id: 'dev',     label: 'كونسول التطوير',      icon: <TerminalIcon size={13} />,    hint: 'منطقة اختبار المطورين البرمجية' },
            { id: 'admin',   label: 'إدارة المنصة الشاملة', icon: <ShieldIcon size={13} />,      hint: 'لوحة التحكم الإدارية الكبرى' },
            { id: 'billing', label: 'الاشتراكات والفوترة',  icon: <CreditCardIcon size={13} />,  hint: 'إدارة خطط الدفع والفواتير' },
          ]
        },
        { id: 'settings', label: 'الإعدادات العامة', icon: <SettingsIcon size={17} />, hint: 'تكوين المنصة العام ومفاتيح الوصول' }
      ]
    }
  ];

  const toggleSubMenu = (id: string) => {
    setOpenSubMenus(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <motion.aside
      animate={{ width: sidebarWidth }}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      className="h-screen shrink-0 flex flex-col relative overflow-hidden z-40"
      style={{
        background: 'linear-gradient(180deg, rgba(9,11,24,0.98) 0%, rgba(7,9,20,1) 100%)',
        borderLeft: '1px solid rgba(99,102,241,0.1)',
      }}
    >
      {/* Ambient background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 40% at 50% 0%, rgba(99,102,241,0.06) 0%, transparent 60%)',
        }}
      />

      {/* Gradient border on the left (for RTL: right side visually) */}
      <div
        className="absolute top-0 left-0 bottom-0 w-px pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, transparent 0%, rgba(99,102,241,0.25) 30%, rgba(6,182,212,0.15) 70%, transparent 100%)',
        }}
      />

      {/* ── Header ─────────────────────────────── */}
      <div className="relative flex items-center justify-between p-3 pb-2 mt-1 shrink-0">
        {/* Logo + Title */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative shrink-0">
            <div
              className="absolute inset-0 rounded-full animate-breathe"
              style={{ background: 'rgba(99,102,241,0.15)', filter: 'blur(6px)' }}
            />
            <Logo size={32} />
          </div>

          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="min-w-0"
              >
                <h1 className="font-black text-[15px] tracking-tight text-white leading-tight whitespace-nowrap">
                  Fluxcore{' '}
                  <span
                    className="animate-gradient"
                    style={{
                      background: 'linear-gradient(90deg, #818cf8, #22d3ee, #818cf8)',
                      backgroundSize: '200% auto',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    AI 02
                  </span>
                </h1>
                <p className="text-[9px] text-slate-500 font-medium tracking-widest uppercase whitespace-nowrap">
                  منصة الذكاء التسويقي
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Notification + Collapse toggle */}
        <div className="flex items-center gap-1 shrink-0">
          {!collapsed && <NotificationCenter />}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setCollapsed((v) => !v)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors cursor-pointer"
            title={collapsed ? 'توسيع القائمة' : 'طيّ القائمة'}
          >
            {collapsed
              ? <ChevronLeftIcon size={14} />
              : <ChevronRightIcon size={14} />
            }
          </motion.button>
        </div>
      </div>

      {/* ── Active Brand Card & Selector ───────── */}
      {activeBrand && (
        <div className="px-3 py-1.5 shrink-0 relative">
          {collapsed ? (
            <div className="relative flex justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onMouseEnter={() => setHoveredItem('brand-selector-collapsed')}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={() => setIsBrandDropdownOpen(!isBrandDropdownOpen)}
                className="w-10 h-10 rounded-xl overflow-hidden bg-slate-900 border border-slate-800/80 flex items-center justify-center cursor-pointer shadow-lg hover:border-indigo-500/30 transition-all focus:outline-none"
              >
                {activeBrand.logo ? (
                  <img src={activeBrand.logo} alt={activeBrand.name} className="w-full h-full object-contain p-1" />
                ) : (
                  <BriefcaseIcon size={18} className="text-indigo-400" />
                )}
              </motion.button>

              {/* Tooltip for collapsed brand badge */}
              <AnimatePresence>
                {hoveredItem === 'brand-selector-collapsed' && !isBrandDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    style={{ left: 'auto', right: '100%', marginRight: '12px' }}
                    className="absolute top-1/2 -translate-y-1/2 z-50 glass-dropdown-premium px-3 py-1.5 rounded-lg pointer-events-none whitespace-nowrap animate-tooltip-pop text-right"
                  >
                    <div className="text-[11px] font-black text-slate-100">{activeBrand.name}</div>
                    <div className="text-[9px] text-slate-500 mt-0.5">انقر لتبديل العلامة التجارية النشطة</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <button
              onClick={() => setIsBrandDropdownOpen(!isBrandDropdownOpen)}
              className="w-full text-right p-2 rounded-xl brand-card-premium flex items-center justify-between gap-2.5 cursor-pointer focus:outline-none"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {activeBrand.logo ? (
                  <img src={activeBrand.logo} alt={activeBrand.name} className="w-8 h-8 rounded-lg object-contain bg-slate-950 p-1 border border-slate-850 shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shrink-0">
                    <BriefcaseIcon size={14} className="text-indigo-400" />
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-[11.5px] font-black text-slate-100 truncate">{activeBrand.name}</div>
                  <div className="text-[9px] text-slate-500 truncate mt-0.5">{activeBrand.industry || 'علامة تجارية'}</div>
                </div>
              </div>
              <ChevronDownIcon size={13} className={`text-slate-400 transition-transform duration-300 ${isBrandDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
          )}

          {/* Brand Dropdown Menu */}
          <AnimatePresence>
            {isBrandDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40 cursor-default" onClick={() => setIsBrandDropdownOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  style={collapsed ? { left: 'auto', right: '100%', marginRight: '12px' } : undefined}
                  className={`absolute z-50 glass-dropdown-premium rounded-xl p-1.5 w-64 ${
                    collapsed ? 'top-0' : 'right-3 left-3 top-full mt-1'
                  }`}
                >
                  <div className="px-2.5 py-1.5 border-b border-white/5 flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-black text-slate-400">تبديل العلامة التجارية</span>
                    <span className="text-[9px] font-mono bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded">إجمالي: {brands.length}</span>
                  </div>
                  <div className="max-h-56 overflow-y-auto custom-scrollbar space-y-1">
                    {brands.map((brand) => {
                      const isSelected = brand.id === activeBrand.id;
                      return (
                        <button
                          key={brand.id}
                          onClick={() => {
                            setActiveBrandId(brand.id);
                            setIsBrandDropdownOpen(false);
                            toast.success(`تم التبديل إلى: ${brand.name}`);
                          }}
                          className={`w-full text-right p-2 rounded-lg flex items-center gap-2.5 transition-all cursor-pointer border ${
                            isSelected
                              ? 'bg-indigo-500/10 border-indigo-500/20 text-white'
                              : 'hover:bg-white/5 border-transparent text-slate-450 hover:text-white'
                          }`}
                        >
                          {brand.logo ? (
                            <img src={brand.logo} alt={brand.name} className="w-6.5 h-6.5 rounded-md object-contain bg-slate-950 p-0.5 border border-slate-800 shrink-0" />
                          ) : (
                            <div className="w-6.5 h-6.5 rounded-md bg-slate-950 flex items-center justify-center border border-slate-800 shrink-0">
                              <BriefcaseIcon size={12} className={isSelected ? 'text-indigo-400' : 'text-slate-500'} />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="text-[11px] font-black truncate">{brand.name}</div>
                            <div className="text-[8.5px] text-slate-500 truncate mt-0.5">{brand.personality || 'شخصية عامة'}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ── Navigation ─────────────────────────── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar py-2 px-2 space-y-1">
        {navSections.map((section) => (
          <div key={section.id} className="mb-2">
            {/* Section Label */}
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-center gap-2 px-3 py-1.5 mb-0.5">
                    <div
                      className="h-px flex-1"
                      style={{
                        background: `linear-gradient(90deg, ${sectionColors[section.id] || 'rgba(99,102,241,0.6)'} 0%, transparent 100%)`,
                        opacity: 0.4,
                      }}
                    />
                    <span className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-500 whitespace-nowrap">
                      {section.title}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Items */}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const hasSubItems = !!item.subItems;
                const isSubMenuOpen = !!openSubMenus[item.id];
                
                // Determine if this item or any of its subItems is active
                const isItemActive = activeModule === item.id;
                const isChildActive = hasSubItems && item.subItems!.some(child => activeModule === child.id);
                const isActive = isItemActive || isChildActive;
                
                const isHovered = hoveredItem === item.id;

                return (
                  <div key={item.id} className="relative">
                    {/* Collapsed Tooltip */}
                    <AnimatePresence>
                      {collapsed && hoveredItem === item.id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          style={{ left: 'auto', right: '100%', marginRight: '12px' }}
                          className="absolute top-1/2 -translate-y-1/2 z-50 glass-dropdown-premium px-3 py-1.5 rounded-lg pointer-events-none whitespace-nowrap animate-tooltip-pop text-right"
                        >
                          <div className="text-[11px] font-black text-slate-100">{item.label}</div>
                          {item.hint && <div className="text-[9px] text-slate-500 mt-0.5">{item.hint}</div>}
                          {hasSubItems && (
                            <div className="text-[8.5px] text-indigo-400 mt-1 font-bold">
                              يحتوي على {item.subItems!.length} أدوات فرعية (انقر للعرض)
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="relative">
                      {/* Active pill background */}
                      {isActive && (
                        <motion.div
                          layoutId="nav-active-pill"
                          className="absolute inset-0 rounded-xl glow-nav-active"
                          style={{
                            background: 'linear-gradient(135deg, rgba(99,102,241,0.18) 0%, rgba(6,182,212,0.08) 100%)',
                            border: '1px solid rgba(99,102,241,0.2)',
                          }}
                          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        />
                      )}

                      {/* Hover background */}
                      {isHovered && !isActive && (
                        <motion.div
                          layoutId="nav-hover-pill"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 rounded-xl"
                          style={{
                            background: 'rgba(30, 41, 59, 0.4)',
                            border: '1px solid rgba(255, 255, 255, 0.03)',
                          }}
                          transition={{ duration: 0.1 }}
                        />
                      )}

                      <button
                        onClick={() => {
                          if (hasSubItems) {
                            if (collapsed) {
                              // If collapsed, expand the sidebar first to show sub-menus
                              setCollapsed(false);
                              setOpenSubMenus(prev => ({ ...prev, [item.id]: true }));
                            } else {
                              toggleSubMenu(item.id);
                            }
                          } else {
                            onNavigate(item.id);
                          }
                        }}
                        onMouseEnter={() => setHoveredItem(item.id)}
                        onMouseLeave={() => setHoveredItem(null)}
                        className={`relative w-full flex items-center gap-3 rounded-xl transition-all duration-150 cursor-pointer focus:outline-none
                          ${collapsed ? 'justify-center px-0 py-3' : 'px-3 py-2.5'}
                          ${isActive ? 'text-white font-black' : 'text-slate-400 hover:text-slate-200'}
                        `}
                      >
                        {/* Icon */}
                        <motion.span
                          animate={isActive ? { scale: 1.1 } : { scale: 1 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                          className={`shrink-0 transition-colors duration-150 ${
                            isActive
                              ? 'text-indigo-400 animate-pulse-ring'
                              : isHovered
                              ? 'text-slate-300'
                              : 'text-slate-500'
                          }`}
                        >
                          {item.icon}
                        </motion.span>

                        {/* Label */}
                        {!collapsed && (
                          <span className="text-[13px] font-bold truncate flex-1 text-right">
                            {item.label}
                          </span>
                        )}

                        {/* Chevron Indicator for sub-menus */}
                        {hasSubItems && !collapsed && (
                          <span className="shrink-0 text-slate-500 hover:text-slate-300">
                            {isSubMenuOpen ? <ChevronUpIcon size={13} /> : <ChevronDownIcon size={13} />}
                          </span>
                        )}

                        {/* Active dot in collapsed mode */}
                        {isActive && collapsed && (
                          <span
                            className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-indigo-400"
                          />
                        )}

                        {/* Badge */}
                        {item.badge && item.badge > 0 && !collapsed && (
                          <span className="shrink-0 text-[9px] font-black bg-indigo-500 text-white rounded-full w-4 h-4 flex items-center justify-center">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    </div>

                    {/* Sub-menu rendering (Expanded Sidebar only) */}
                    {hasSubItems && !collapsed && (
                      <AnimatePresence initial={false}>
                        {isSubMenuOpen && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.25, ease: 'easeInOut' }}
                            className="overflow-hidden bg-slate-950/40 rounded-b-xl border-r border-slate-900 pr-3.5 mr-2.5 mt-0.5 space-y-0.5"
                          >
                            {item.subItems!.map((subItem) => {
                              const isSubActive = activeModule === subItem.id;
                              return (
                                <button
                                  key={subItem.id}
                                  onClick={() => onNavigate(subItem.id)}
                                  className={`w-full text-right py-2 px-3 rounded-lg text-[12px] font-medium flex items-center gap-2 transition-all cursor-pointer focus:outline-none
                                    ${isSubActive 
                                      ? 'text-indigo-400 bg-indigo-500/5 font-black subitem-glow-line' 
                                      : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                                    }
                                  `}
                                  title={subItem.hint}
                                >
                                  <span className="shrink-0 opacity-70">{subItem.icon}</span>
                                  <span className="truncate flex-1">{subItem.label}</span>
                                </button>
                              );
                            })}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    )}

                    {/* Collapsed sub-menu Floating Menu on Click/Hover */}
                    {hasSubItems && collapsed && isBrandDropdownOpen && (
                      // Handle collapsed floating menu integration if clicked
                      <div className="hidden" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Footer ─────────────────────────────── */}
      <div className="shrink-0 p-2 space-y-1 border-t border-slate-800/40">
        {/* Network status */}
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <NetworkStatusIndicator />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Command bar button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={onOpenCommand}
          className={`w-full flex items-center rounded-xl transition-all duration-150 cursor-pointer focus:outline-none
            ${collapsed
              ? 'justify-center py-3 px-0 hover:bg-slate-800/50'
              : 'gap-3 px-3 py-2.5 bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800/60'
            }
            text-slate-400 hover:text-slate-200
          `}
          title="بحث بالأوامر (Ctrl+K)"
        >
          <CommandIcon size={15} className="shrink-0 text-slate-500" />
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex items-center justify-between min-w-0"
              >
                <span className="text-[12px] font-bold">بحث بالأوامر</span>
                <div className="flex gap-1 text-[9px] font-mono opacity-50">
                  <span className="bg-slate-800 px-1 py-0.5 rounded">⌘</span>
                  <span className="bg-slate-800 px-1 py-0.5 rounded">K</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>

        {/* User profile / Logout */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={onLogout}
          className={`w-full flex items-center rounded-xl transition-all duration-150 group cursor-pointer focus:outline-none
            ${collapsed
              ? 'justify-center py-3 px-0 hover:bg-rose-500/10'
              : 'gap-3 px-3 py-2 hover:bg-rose-500/8'
            }
            text-slate-400 hover:text-rose-400
          `}
          title={collapsed ? `${user.displayName || 'مستخدم'} — تسجيل خروج` : undefined}
        >
          {/* Avatar with online indicator */}
          <div className="relative shrink-0">
            <img
              src={
                user.photoURL ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'U')}&background=312e81&color=a5b4fc&bold=true`
              }
              alt="Avatar"
              className="w-8 h-8 rounded-full border border-slate-700/60 object-cover"
            />
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-slate-900 animate-status-blink" />
          </div>

          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.18 }}
                className="min-w-0 flex-1 text-right"
              >
                <div className="text-[12px] font-black text-slate-300 group-hover:text-rose-400 truncate transition-colors">
                  {user.displayName || 'مستخدم'}
                </div>
                <div className="text-[9.5px] text-slate-500 group-hover:text-rose-500/70 truncate transition-colors flex items-center gap-1 justify-end">
                  <LogOutIcon size={9} />
                  تسجيل خروج
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </motion.aside>
  );
}
