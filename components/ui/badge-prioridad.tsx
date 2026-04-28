'use client';

import { cn } from '@/lib/utils';
import { AlertCircle, Circle, TrendingUp } from 'lucide-react';

interface BadgePrioridadProps {
  prioridad: string;
}

const prioridadConfig: Record<
  string,
  { bg: string; text: string; label: string; icon: any }
> = {
  Baja: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Baja', icon: Circle },
  Media: {
    bg: 'bg-orange-100',
    text: 'text-orange-700',
    label: 'Media',
    icon: TrendingUp,
  },
  Alta: {
    bg: 'bg-red-100',
    text: 'text-red-700',
    label: 'Alta',
    icon: AlertCircle,
  },
};

export function BadgePrioridad({ prioridad }: BadgePrioridadProps) {
  const config = prioridadConfig[prioridad] || prioridadConfig.Media;
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium',
        config.bg,
        config.text
      )}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}
