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
    <header className="flex h-16 items-center justify-between border-b bg-white px-4 shadow-sm sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        {/* Botón menú móvil - solo visible en pantallas pequeñas */}
        <button
          type="button"
          onClick={onMenuClick}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 lg:hidden"
          aria-label="Abrir menú"
        >
          <Menu className="h-6 w-6" />
        </button>
        <div className="hidden sm:block">
          <h2 className="text-lg font-semibold text-gray-800 sm:text-xl">Sistema de Gestión</h2>
          <p className="hidden text-sm text-gray-500 sm:block">Fabricación de Bolsas y Bobinas de Plástico</p>
        </div>
      </div>
      
      {/* Búsqueda global */}
      <div className="flex-1 flex justify-center px-4 max-w-md mx-auto">
        <GlobalSearch />
      </div>
      
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Toggle de Tema (Día/Noche) */}
        <ThemeToggle />
        
        {/* Campana de notificaciones */}
        <NotificationBell />
        
        <div className="hidden sm:block text-right">
          <p className="text-xs font-medium text-gray-700 sm:text-sm">
            {session?.user?.name || 'Usuario'}
          </p>
          <p className="text-xs text-gray-500 capitalize">
            {(session?.user as any)?.rol || 'usuario'}
          </p>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm text-white font-semibold sm:h-10 sm:w-10">
          {session?.user?.name?.charAt(0).toUpperCase() || 'U'}
        </div>
      </div>
    </header>
  );
}
