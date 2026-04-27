'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import {
  LayoutDashboard,
  Users,
  FileText,
  UserCircle,
  LogOut,
  Factory,
  Settings,
  X,
  Truck,
  TestTube2,
  Recycle,
  Package,
  Receipt,
  BarChart3,
  Wrench,
  Lightbulb,
  Building2,
  ShoppingCart,
  ClipboardCheck,
  ScrollText,
  Bell,
  PackageCheck,
  Workflow,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  userRol?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ userRol, isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();

  const menuItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: 'Clientes',
      href: '/clientes',
      icon: Users,
    },
    {
      name: 'Pedidos',
      href: '/pedidos',
      icon: FileText,
    },
    {
      name: 'Producción',
      href: '/produccion',
      icon: Factory,
    },
    {
      name: 'Flujos de Proceso',
      href: '/diagramas',
      icon: Workflow,
    },
    {
      name: 'Producto Terminado',
      href: '/producto-terminado',
      icon: PackageCheck,
    },
    {
      name: 'Devoluciones',
      href: '/devoluciones',
      icon: AlertTriangle,
    },
    {
      name: 'Despachos',
      href: '/despachos',
      icon: Truck,
    },
    {
      name: 'Muestras',
      href: '/muestras',
      icon: TestTube2,
    },
    {
      name: 'Peletizado',
      href: '/peletizado',
      icon: Recycle,
    },
    {
      name: 'Inventario',
      href: '/inventario',
      icon: Package,
    },
    {
      name: 'Facturación',
      href: '/facturas',
      icon: Receipt,
    },
    {
      name: 'Mantenimiento',
      href: '/mantenimientos',
      icon: Wrench,
    },
    {
      name: 'Mejoras',
      href: '/mejoras',
      icon: Lightbulb,
    },
    {
      name: 'Proveedores',
      href: '/proveedores',
      icon: Building2,
    },
    {
      name: 'Compras',
      href: '/compras',
      icon: ShoppingCart,
    },
    {
      name: 'Calidad',
      href: '/calidad',
      icon: ClipboardCheck,
    },
    {
      name: 'Reportes',
      href: '/reportes',
      icon: BarChart3,
    },
    {
      name: 'Auditoría',
      href: '/auditoria',
      icon: ScrollText,
    },
    {
      name: 'Máquinas',
      href: '/maquinas',
      icon: Settings,
    },
    {
      name: 'Usuarios',
      href: '/usuarios',
      icon: Users,
      adminOnly: true,
    },
    {
      name: 'Perfil',
      href: '/perfil',
      icon: UserCircle,
    },
  ];

  const filteredMenuItems = menuItems.filter(item => {
    if ((item as any).adminOnly && userRol !== 'admin') return false;
    return true;
  });

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  const handleLinkClick = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <>
      {/* Overlay para móvil - solo visible cuando isOpen es true */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 lg:hidden',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      {/* Sidebar para móvil - se desliza */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex h-screen w-64 flex-col bg-gradient-to-b from-blue-900 to-blue-800 text-white shadow-xl transition-transform duration-300 ease-in-out lg:hidden',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo y botón cerrar */}
        <div className="flex h-16 items-center justify-between border-b border-blue-700 px-4">
          <h1 className="text-xl font-bold tracking-wide">ERP Plásticos</h1>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-blue-100 hover:bg-blue-700/50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {filteredMenuItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleLinkClick}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-blue-100 hover:bg-blue-700/50 hover:text-white'
                )}
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="border-t border-blue-700 p-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-blue-100 transition-all duration-200 hover:bg-red-600 hover:text-white"
          >
            <LogOut className="h-5 w-5" />
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Sidebar para desktop - siempre visible */}
      <div className="hidden h-screen w-64 flex-shrink-0 flex-col bg-gradient-to-b from-blue-900 to-blue-800 text-white shadow-xl lg:flex">
        {/* Logo */}
        <div className="flex h-16 items-center justify-center border-b border-blue-700 px-4">
          <h1 className="text-xl font-bold tracking-wide">ERP Plásticos</h1>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {filteredMenuItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-blue-100 hover:bg-blue-700/50 hover:text-white'
                )}
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="border-t border-blue-700 p-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-blue-100 transition-all duration-200 hover:bg-red-600 hover:text-white"
          >
            <LogOut className="h-5 w-5" />
            Cerrar Sesión
          </button>
        </div>
      </div>
    </>
  );
}
