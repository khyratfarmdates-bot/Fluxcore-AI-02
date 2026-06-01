import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, PenTool, Sparkles, Workflow, BarChart3,
  Settings, Search, Send, Users, Wand2, Blocks, Flag,
  SearchIcon, ChevronLeft, ChevronRight, LogOut, Command
} from 'lucide-react';
import { Logo } from './Logo';
import { NotificationCenter } from '../notifications/NotificationCenter';
import { NetworkStatusIndicator } from './NetworkStatusIndicator';

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

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  hint?: string;
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

const navSections: NavSection[] = [
  {
    id: 'workspace',
    title: 'تطوير الأعمال',
    items: [
      { id: 'dashboard', label: 'الرئيسية',          icon: <LayoutDashboardIcon size={17} />, hint: 'لوحة التحكم الرئيسية' },
      { id: 'brand',     label: 'هوية العلامة',       icon: <SparklesIcon size={17} />,       hint: 'بناء هوية العلامة التجارية' },
      { id: 'analytics', label: 'الأداء والتحليلات', icon: <BarChart3Icon size={17} />,       hint: 'تحليلات الأداء' },
      { id: 'campaigns', label: 'الحملات الإعلانية', icon: <FlagIcon size={17} />,            hint: 'إدارة الحملات' },
    ],
  },
  {
    id: 'production',
    title: 'صناعة المحتوى',
    items: [
      { id: 'studio',     label: 'الاستوديو الذكي',    icon: <PenToolIcon size={17} />,    hint: 'توليد ومعالجة المحتوى' },
      { id: 'media',      label: 'مختبر الوسائط',      icon: <Wand2Icon size={17} />,      hint: 'صور وفيديو وصوت' },
      { id: 'seo',        label: 'تحسين محركات البحث', icon: <SearchIconC size={17} />,    hint: 'SEO وتحسين المحتوى' },
      { id: 'publishing', label: 'الجدولة والنشر',     icon: <SendIcon size={17} />,       hint: 'جدولة ونشر المحتوى' },
    ],
  },
  {
    id: 'system',
    title: 'الإدارة والنظام',
    items: [
      { id: 'automation',   label: 'الأتمتة والمهام', icon: <WorkflowIcon size={17} />,  hint: 'أتمتة العمليات' },
      { id: 'integrations', label: 'قنوات الربط',     icon: <BlocksIcon size={17} />,    hint: 'ربط التطبيقات الخارجية' },
      { id: 'agency',       label: 'فريق العمل',      icon: <UsersIcon size={17} />,     hint: 'إدارة الفريق' },
      { id: 'settings',     label: 'الإعدادات',       icon: <SettingsIcon size={17} />,  hint: 'إعدادات النظام' },
    ],
  },
];

const sectionColors: Record<string, string> = {
  workspace:  'rgba(99, 102, 241, 0.6)',  // indigo
  production: 'rgba(6, 182, 212, 0.6)',   // cyan
  system:     'rgba(234, 179, 8, 0.6)',   // yellow
};

export function AppSidebar({ activeModule, onNavigate, onOpenCommand, user, onLogout }: AppSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const sidebarWidth = collapsed ? 68 : 256;

  return (
    <motion.aside
      animate={{ width: sidebarWidth }}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      className="h-screen shrink-0 flex flex-col relative overflow-hidden"
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
          {/* Logo with pulse ring */}
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
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
            title={collapsed ? 'توسيع القائمة' : 'طيّ القائمة'}
          >
            {collapsed
              ? <ChevronLeftIcon size={14} />
              : <ChevronRightIcon size={14} />
            }
          </motion.button>
        </div>
      </div>

      {/* ── Navigation ─────────────────────────── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar py-2 px-2 space-y-1">
        {navSections.map((section) => (
          <div key={section.id} className="mb-1">
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
                  <div
                    className="flex items-center gap-2 px-3 py-1.5 mb-0.5"
                  >
                    <div
                      className="h-px flex-1"
                      style={{
                        background: `linear-gradient(90deg, ${sectionColors[section.id]} 0%, transparent 100%)`,
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
                const isActive = activeModule === item.id;
                const isHovered = hoveredItem === item.id;

                return (
                  <div key={item.id} className="relative">
                    {/* Active pill background — uses layoutId for smooth transition */}
                    {isActive && (
                      <motion.div
                        layoutId="nav-active-pill"
                        className="absolute inset-0 rounded-xl"
                        style={{
                          background: 'linear-gradient(135deg, rgba(99,102,241,0.18) 0%, rgba(6,182,212,0.08) 100%)',
                          border: '1px solid rgba(99,102,241,0.2)',
                          boxShadow: '0 0 12px rgba(99,102,241,0.08)',
                        }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}

                    {/* Hover glow */}
                    {isHovered && !isActive && (
                      <motion.div
                        layoutId="nav-hover-pill"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 rounded-xl"
                        style={{
                          background: 'rgba(30, 41, 59, 0.5)',
                        }}
                        transition={{ duration: 0.1 }}
                      />
                    )}

                    <button
                      onClick={() => onNavigate(item.id)}
                      onMouseEnter={() => setHoveredItem(item.id)}
                      onMouseLeave={() => setHoveredItem(null)}
                      className={`relative w-full flex items-center gap-3 rounded-xl transition-all duration-150
                        ${collapsed ? 'justify-center px-0 py-3' : 'px-3 py-2.5'}
                        ${isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200'}
                      `}
                      title={collapsed ? item.label : undefined}
                    >
                      {/* Icon */}
                      <motion.span
                        animate={isActive ? { scale: 1.1 } : { scale: 1 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        className={`shrink-0 transition-colors duration-150 ${
                          isActive
                            ? 'text-indigo-400'
                            : isHovered
                            ? 'text-slate-300'
                            : 'text-slate-500'
                        }`}
                      >
                        {item.icon}
                      </motion.span>

                      {/* Label */}
                      <AnimatePresence>
                        {!collapsed && (
                          <motion.span
                            initial={{ opacity: 0, x: -6 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -6 }}
                            transition={{ duration: 0.18 }}
                            className="text-[13px] font-bold truncate flex-1 text-right"
                          >
                            {item.label}
                          </motion.span>
                        )}
                      </AnimatePresence>

                      {/* Active dot (collapsed mode) */}
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
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Footer ─────────────────────────────── */}
      <div className="shrink-0 p-2 space-y-1 border-t border-slate-800/40">

        {/* Network status - only expanded */}
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
          className={`w-full flex items-center rounded-xl transition-all duration-150
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

        {/* User profile */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={onLogout}
          className={`w-full flex items-center rounded-xl transition-all duration-150 group
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
