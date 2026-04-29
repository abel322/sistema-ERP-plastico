'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Filter,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Inbox,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import Link from 'next/link';

interface Notificacion {
  id: string;
  tipo: string;
  titulo: string;
  mensaje: string;
  enlace?: string;
  leida: boolean;
  fecha: string;
}

const tipoIconos: Record<string, string> = {
  StockBajo: '📦',
  FacturaVencida: '💳',
  MantenimientoProgramado: '🔧',
  PedidoUrgente: '🚨',
  MejoraPendiente: '💡',
  CalidadNoConforme: '⚠️',
  DespachoEntregado: '🚚',
  Sistema: 'ℹ️',
};

const tipoLabels: Record<string, string> = {
  StockBajo: 'Stock Bajo',
  FacturaVencida: 'Factura Vencida',
  MantenimientoProgramado: 'Mantenimiento',
  PedidoUrgente: 'Pedido Urgente',
  MejoraPendiente: 'Mejora Pendiente',
  CalidadNoConforme: 'No Conformidad',
  DespachoEntregado: 'Despacho',
  Sistema: 'Sistema',
};

export default function NotificacionesPage() {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [noLeidas, setNoLeidas] = useState(0);
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroLeida, setFiltroLeida] = useState('');

  const fetchNotificaciones = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });
      if (filtroTipo) params.append('tipo', filtroTipo);
      if (filtroLeida) params.append('leida', filtroLeida);

      const res = await fetch(`/api/notificaciones?${params}`);
      if (res.ok) {
        const data = await res.json();
        setNotificaciones(data.notificaciones);
        setTotalPages(data.totalPages);
        setNoLeidas(data.noLeidas);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotificaciones();
  }, [page, filtroTipo, filtroLeida]);

  const marcarComoLeida = async (id: string) => {
    try {
      const res = await fetch(`/api/notificaciones/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leida: true }),
      });
      if (res.ok) {
        setNotificaciones((prev) =>
          prev.map((n) => (n.id === id ? { ...n, leida: true } : n))
        );
        setNoLeidas((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const marcarTodasComoLeidas = async () => {
    try {
      const res = await fetch('/api/notificaciones', { method: 'PATCH' });
      if (res.ok) {
        setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
        setNoLeidas(0);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const eliminarNotificacion = async (id: string) => {
    try {
      const res = await fetch(`/api/notificaciones/${id}`, { method: 'DELETE' });
      if (res.ok) {
        const notif = notificaciones.find((n) => n.id === id);
        setNotificaciones((prev) => prev.filter((n) => n.id !== id));
        if (notif && !notif.leida) {
          setNoLeidas((prev) => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (loading && notificaciones.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-slate-50 dark:bg-slate-950">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sincronizando notificaciones...</p>
      </div>
    );
  }

  return (
    <div className="p-8 bg-slate-50 dark:bg-slate-950 min-h-screen transition-colors duration-300">
      {/* Header Area */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200 dark:shadow-none relative">
              <Bell className="w-8 h-8" />
              {noLeidas > 0 && (
                <span className="absolute -top-1 -right-1 w-6 h-6 bg-rose-600 border-4 border-white dark:border-slate-900 rounded-full flex items-center justify-center text-[10px] font-black text-white">
                  {noLeidas}
                </span>
              )}
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white leading-tight">Centro de Notificaciones</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-widest rounded">Alertas y Sistema</span>
                <span className="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full" />
                <span className="text-slate-400 dark:text-slate-500 text-xs font-medium">
                  {noLeidas > 0 ? `${noLeidas} pendientes` : 'Todo al día'}
                </span>
              </div>
            </div>
          </div>
          
          {noLeidas > 0 && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={marcarTodasComoLeidas}
              className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-bold text-white shadow-lg shadow-blue-100 dark:shadow-none transition-all hover:bg-blue-700 active:scale-95 text-xs uppercase tracking-widest"
            >
              <CheckCheck className="h-4 w-4" />
              Marcar todo como leído
            </motion.button>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 mb-8 transition-colors">
        <div className="flex flex-col lg:flex-row items-center gap-6">
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <Filter className="h-3 w-3 text-slate-500" />
            <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Filtros</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 w-full">
            <select
              value={filtroTipo}
              onChange={(e) => {
                setFiltroTipo(e.target.value);
                setPage(1);
              }}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            >
              <option value="">Todos los tipos</option>
              {Object.entries(tipoLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {tipoIconos[key]} {label}
                </option>
              ))}
            </select>
            <select
              value={filtroLeida}
              onChange={(e) => {
                setFiltroLeida(e.target.value);
                setPage(1);
              }}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            >
              <option value="">Todas las notificaciones</option>
              <option value="false">No leídas</option>
              <option value="true">Leídas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Notificaciones */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
        {notificaciones.length === 0 ? (
          <div className="p-32 text-center">
            <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
              <Inbox className="w-12 h-12" />
            </div>
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Bandeja vacía</h3>
            <p className="text-xs text-slate-400 mt-2 max-w-xs mx-auto">No tienes notificaciones en este momento. Las nuevas alertas aparecerán aquí.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            <AnimatePresence mode="popLayout">
              {notificaciones.map((notif, index) => (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-6 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all group relative ${
                    !notif.leida ? 'bg-blue-50/20 dark:bg-blue-900/10' : ''
                  }`}
                >
                  <div className="flex items-start gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-2xl shadow-sm">
                      {tipoIconos[notif.tipo] || 'ℹ️'}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-3">
                          <h3 className={`text-sm ${!notif.leida ? 'font-black' : 'font-bold'} text-slate-900 dark:text-white uppercase tracking-tight`}>
                            {notif.titulo}
                          </h3>
                          {!notif.leida && (
                            <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                          )}
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                          <Clock className="h-3 w-3" />
                          {format(new Date(notif.fecha), "dd MMM, HH:mm", { locale: es })}
                        </span>
                      </div>
                      
                      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
                        {notif.mensaje}
                      </p>
                      
                      <div className="flex items-center gap-4 mt-4">
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 text-[9px] font-black uppercase tracking-widest rounded-lg">
                          {tipoLabels[notif.tipo] || notif.tipo}
                        </span>
                        
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
                          {notif.enlace && (
                            <Link
                              href={notif.enlace}
                              onClick={() => marcarComoLeida(notif.id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all border border-blue-100 dark:border-blue-900/50"
                            >
                              <ExternalLink className="h-3 w-3" />
                              Ir al detalle
                            </Link>
                          )}
                          {!notif.leida && (
                            <button
                              onClick={() => marcarComoLeida(notif.id)}
                              className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 rounded-xl transition-all border border-transparent hover:border-emerald-100"
                              title="Marcar como leída"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => eliminarNotificacion(notif.id)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition-all border border-transparent hover:border-rose-100"
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="mt-8 flex flex-col items-center gap-6 sm:flex-row sm:justify-between bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 transition-colors">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
            Página <span className="text-slate-900 dark:text-white">{page}</span> de <span className="text-slate-900 dark:text-white">{totalPages}</span>
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 transition-all"
            >
              Anterior
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 transition-all"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
