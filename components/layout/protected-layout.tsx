'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Sidebar } from './sidebar';
import { Header } from './header';

export function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Cerrar sidebar cuando cambia el tamaño de pantalla a desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
        <div className="text-center">
          <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-gray-600 dark:text-slate-400">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const handleOpenSidebar = () => {
    setSidebarOpen(true);
  };

  const handleCloseSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="flex min-h-screen w-full max-w-full overflow-x-hidden bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      <Sidebar
        userRol={(session.user as any)?.rol}
        isOpen={sidebarOpen}
        onClose={handleCloseSidebar}
      />
      <div className="flex flex-1 flex-col min-w-0 w-full max-w-full overflow-x-hidden">
        <Header onMenuClick={handleOpenSidebar} />
        <main className="flex-1 pt-16 px-4 pb-8 w-full min-w-0 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
