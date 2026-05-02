'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface StatsCardProps {
  title: string;
  value: number | string | React.ReactNode;
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
      
      <div className="relative z-10 flex flex-col h-full justify-between">
        <div className="flex items-center justify-between gap-2 mb-4">
          <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500 leading-none truncate">
            {title}
          </p>
          <div
            className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl shadow-sm border border-black/5 dark:border-white/5 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 ${softBgColor} ${softBgColorDark} ${textColor} ${textColorDark}`}
          >
            <Icon className="h-4 w-4" />
          </div>
        </div>
        
        <div className="flex flex-wrap items-baseline gap-1">
          <span className="text-2xl font-black text-slate-900 dark:text-white leading-none tracking-tight sm:text-3xl transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </span>
        </div>
      </div>
      
      {/* Bottom Progress Indicator (Subtle Decoration) */}
      <div className="absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r from-transparent via-current to-transparent opacity-20 transition-all duration-500 group-hover:w-full" style={{ color: textColor.replace('text-', '') }}></div>
    </motion.div>
  );
}
