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
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="rounded-xl bg-white p-3 shadow-md transition-all duration-300 hover:shadow-xl sm:p-4 lg:p-6"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-gray-600 sm:text-sm">{title}</p>
          <p className="mt-1 truncate text-xl font-bold text-gray-900 sm:mt-2 sm:text-2xl lg:text-3xl">{value}</p>
        </div>
        <div
          className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full sm:h-12 sm:w-12 lg:h-14 lg:w-14 ${color}`}
        >
          <Icon className="h-5 w-5 text-white sm:h-6 sm:w-6 lg:h-7 lg:w-7" />
        </div>
      </div>
    </motion.div>
  );
}
