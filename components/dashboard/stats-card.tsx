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
  const textColor = color.replace('bg-', 'text-');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5, ease: "easeOut" }}
      className="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm border border-slate-100 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-slate-200"
    >
      {/* Background Accent Ornament */}
      <div className={`absolute -right-4 -top-4 h-24 w-24 rounded-full opacity-[0.03] transition-transform duration-500 group-hover:scale-150 ${color}`} />
      
      <div className="relative flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 leading-none">{title}</p>
          <p className="text-2xl font-black text-slate-900 leading-none tracking-tight sm:text-3xl">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
        </div>
        <div
          className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl shadow-inner transition-transform duration-300 group-hover:rotate-12 ${softBgColor} ${textColor}`}
        >
          <Icon className="h-6 w-6" />
        </div>
      </div>
      
      {/* Bottom Progress Indicator (Subtle Decoration) */}
      <div className="absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r from-transparent via-current to-transparent opacity-20 transition-all duration-500 group-hover:w-full" style={{ color: textColor.replace('text-', '') }}></div>
    </motion.div>
  );
}
