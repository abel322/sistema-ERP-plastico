'use client';

import { cn } from '@/lib/utils';

interface BadgeEstadoProps {
  estado: string;
}

const estadoConfig: Record<string, { bg: string; text: string; label: string }> = {
  Pendiente: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pendiente' },
  EnProceso: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'En Proceso' },
  Completado: { bg: 'bg-green-100', text: 'text-green-800', label: 'Completado' },
};

export function BadgeEstado({ estado }: BadgeEstadoProps) {
  const config = estadoConfig[estado] || estadoConfig.Pendiente;
  
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium',
        config.bg,
        config.text
      )}
    >
      {config.label}
    </span>
  );
}
