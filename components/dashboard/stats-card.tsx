'use client';

import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  color: string;
  index: number;
}

export function StatsCard({ title, value, icon: Icon, color, index }: StatsCardProps) {
  // Map standard tailwind bg colors to soft variants
  const softBgColor = color.replace('bg-', 'bg-').replace('-600', '-50');
  const softBgColorDark = color.replace('bg-', 'dark:bg-').replace('-600', '-950/40');
  const textColor = color.replace('bg-', 'text-');
  const textColorDark = color.replace('bg-', 'dark:text-');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5, ease: "easeOut" }}
      className="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 p-5 shadow-sm border border-slate-100 dark:border-slate-800 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-slate-200 dark:hover:border-slate-700"
    >
      {/* Background Accent Ornament */}
      <div className={`absolute -right-4 -top-4 h-24 w-24 rounded-full opacity-[0.03] dark:opacity-[0.05] transition-transform duration-500 group-hover:scale-150 ${color}`} />
      
      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500 mb-2 leading-none">{title}</p>
          <div className="flex flex-wrap items-baseline gap-1">
            <span className="text-xl font-black text-slate-900 dark:text-white leading-tight tracking-tight sm:text-2xl transition-colors group-hover:text-slate-700 dark:group-hover:text-slate-200">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </span>
          </div>
        </div>
        <div
          className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl shadow-sm border border-black/5 dark:border-white/5 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 ${softBgColor} ${softBgColorDark} ${textColor} ${textColorDark}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
      
      {/* Bottom Progress Indicator (Subtle Decoration) */}
      <div className="absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r from-transparent via-current to-transparent opacity-20 transition-all duration-500 group-hover:w-full" style={{ color: textColor.replace('text-', '') }}></div>
    </motion.div>
  );
}
