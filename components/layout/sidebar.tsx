'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { motion } from 'framer-motion';
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
  ChevronRight,
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
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Clientes', href: '/clientes', icon: Users },
    { name: 'Pedidos', href: '/pedidos', icon: FileText },
    { name: 'Producción', href: '/produccion', icon: Factory },
    { name: 'Flujos', href: '/diagramas', icon: Workflow },
    { name: 'Producto Terminado', href: '/producto-terminado', icon: PackageCheck },
    { name: 'Despachos', href: '/despachos', icon: Truck },
    { name: 'Muestras', href: '/muestras', icon: TestTube2 },
    { name: 'Peletizado', href: '/peletizado', icon: Recycle },
    { name: 'Inventario', href: '/inventario', icon: Package },
    { name: 'Facturación', href: '/facturas', icon: Receipt },
    { name: 'Mantenimiento', href: '/mantenimientos', icon: Wrench },
    { name: 'Mejoras', href: '/mejoras', icon: Lightbulb },
    { name: 'Proveedores', href: '/proveedores', icon: Building2 },
    { name: 'Compras', href: '/compras', icon: ShoppingCart },
    { name: 'Calidad', href: '/calidad', icon: ClipboardCheck },
    { name: 'Reportes', href: '/reportes', icon: BarChart3 },
    { name: 'Usuarios', href: '/usuarios', icon: Users, adminOnly: true },
    { name: 'Perfil', href: '/perfil', icon: UserCircle },
  ];

  const filteredMenuItems = menuItems.filter(item => {
    if ((item as any).adminOnly && userRol !== 'admin') return false;
    return true;
  });

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  const NavItem = ({ item, isActive }: { item: any, isActive: boolean }) => {
    const Icon = item.icon;
    return (
      <Link
        href={item.href}
        onClick={onClose}
        className={cn(
          'group relative flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-all duration-300',
          isActive
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
            : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
        )}
      >
        <Icon className={cn('h-5 w-5 transition-transform duration-300 group-hover:scale-110', isActive ? 'text-white' : 'text-slate-500 group-hover:text-blue-400')} />
        <span className="flex-1 truncate uppercase tracking-widest text-[10px]">{item.name}</span>
        {isActive && (
          <motion.div
            layoutId="active-pill"
            className="absolute right-2 h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]"
          />
        )}
      </Link>
    );
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-slate-950 text-white border-r border-slate-900 shadow-2xl">
      {/* Brand */}
      <div className="flex h-24 items-center px-8 border-b border-slate-900/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20">
            <Factory className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-[0.2em] uppercase leading-none">ERP</h1>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">Industrial</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1.5 overflow-y-auto px-4 py-8 custom-scrollbar">
        <p className="px-4 mb-4 text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">Menú Principal</p>
        {filteredMenuItems.map((item) => (
          <NavItem key={item.href} item={item} isActive={pathname === item.href} />
        ))}
      </nav>

      {/* Footer / Logout */}
      <div className="p-4 border-t border-slate-900/50 bg-slate-950/50 backdrop-blur-xl">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 transition-all duration-300 hover:bg-rose-950/30 hover:text-rose-500 group"
        >
          <LogOut className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
          Cerrar Sesión
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm transition-opacity duration-300 lg:hidden',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      {/* Mobile Sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) lg:hidden',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <SidebarContent />
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 text-slate-400 hover:text-white lg:hidden"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-72 lg:flex-shrink-0 lg:flex-col">
        <SidebarContent />
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1e293b;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #334155;
        }
      `}</style>
    </>
  );
}
