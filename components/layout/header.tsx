'use client';

import { useSession } from 'next-auth/react';
import { Menu } from 'lucide-react';
import { NotificationBell } from '@/components/notificaciones/notification-bell';
import { GlobalSearch } from '@/components/search/global-search';
import { ThemeToggle } from '@/components/ui/theme-toggle';

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { data: session } = useSession() || {};

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between w-full h-full px-4 max-w-7xl mx-auto">
        {/* Izquierda: Menú */}
        <div className="shrink-0 flex items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 lg:hidden"
            aria-label="Abrir menú"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="hidden sm:block">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-slate-100 sm:text-xl">Sistema de Gestión</h2>
            <p className="hidden text-sm text-gray-500 dark:text-slate-400 sm:block">Fabricación de Bolsas y Bobinas de Plástico</p>
          </div>
        </div>

        {/* Centro: Buscador flexible (sin empujar los laterales) */}
        <div className="flex-1 max-w-xs mx-2 min-w-0 flex justify-center">
          <GlobalSearch />
        </div>

        {/* Derecha: Acciones siempre visibles */}
        <div className="shrink-0 flex items-center gap-2">
          {/* Toggle de tema (Sol/Luna) */}
          <ThemeToggle />

          {/* Campana de notificaciones */}
          <NotificationBell />

          {/* Avatar y nombre del usuario */}
          <div className="hidden sm:block text-right">
            <p className="text-xs font-medium text-gray-700 dark:text-slate-200 sm:text-sm">
              {session?.user?.name || 'Usuario'}
            </p>
            <p className="text-xs text-gray-500 dark:text-slate-400 capitalize">
              {(session?.user as any)?.rol || 'usuario'}
            </p>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm text-white font-semibold sm:h-10 sm:w-10">
            {session?.user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
        </div>
      </div>
    </header>
  );
}
