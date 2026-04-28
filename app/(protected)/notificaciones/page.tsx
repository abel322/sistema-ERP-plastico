'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Filter,
  ChevronLeft,
  ChevronRight,
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
      <div className="flex h-[50vh] w-full items-center justify-center"><LoadingSpinner /></div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-3">
              <Bell className="h-7 w-7 sm:h-8 sm:w-8 text-blue-600" />
              Notificaciones
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              {noLeidas > 0
                ? `Tienes ${noLeidas} notificación${noLeidas > 1 ? 'es' : ''} sin leer`
                : 'Todas las notificaciones leídas'}
            </p>
          </div>
          {noLeidas > 0 && (
            <button
              onClick={marcarTodasComoLeidas}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
            >
              <CheckCheck className="h-4 w-4" />
              Marcar todas como leídas
            </button>
          )}
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Filter className="h-4 w-4 inline mr-1" />
                Tipo
              </label>
              <select
                value={filtroTipo}
                onChange={(e) => {
                  setFiltroTipo(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="">Todos los tipos</option>
                {Object.entries(tipoLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {tipoIconos[key]} {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <select
                value={filtroLeida}
                onChange={(e) => {
                  setFiltroLeida(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="">Todas</option>
                <option value="false">No leídas</option>
                <option value="true">Leídas</option>
              </select>
            </div>
          </div>
        </div>

        {/* Lista de notificaciones */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {notificaciones.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Bell className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg">No hay notificaciones</p>
              <p className="text-sm mt-1">
                Las nuevas notificaciones aparecerán aquí
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notificaciones.map((notif, index) => (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-4 sm:p-5 hover:bg-gray-50 transition-colors ${
                    !notif.leida ? 'bg-blue-50/50' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <span className="text-2xl sm:text-3xl flex-shrink-0">
                      {tipoIconos[notif.tipo] || 'ℹ️'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3
                              className={`text-base sm:text-lg ${
                                !notif.leida ? 'font-semibold' : 'font-medium'
                              } text-gray-800`}
                            >
                              {notif.titulo}
                            </h3>
                            {!notif.leida && (
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                                Nueva
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {notif.mensaje}
                          </p>
                          <div className="flex flex-wrap items-center gap-3 mt-2">
                            <span className="text-xs text-gray-400">
                              {format(
                                new Date(notif.fecha),
                                "d 'de' MMMM 'a las' HH:mm",
                                { locale: es }
                              )}
                            </span>
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                              {tipoLabels[notif.tipo] || notif.tipo}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 sm:flex-shrink-0">
                          {notif.enlace && (
                            <Link
                              href={notif.enlace}
                              onClick={() => marcarComoLeida(notif.id)}
                              className="px-3 py-1.5 bg-blue-100 text-blue-700 text-sm rounded-lg hover:bg-blue-200 transition-colors"
                            >
                              Ver
                            </Link>
                          )}
                          {!notif.leida && (
                            <button
                              onClick={() => marcarComoLeida(notif.id)}
                              className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Marcar como leída"
                            >
                              <Check className="h-5 w-5" />
                            </button>
                          )}
                          <button
                            onClick={() => eliminarNotificacion(notif.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </button>
            <span className="text-sm text-gray-600">
              Página {page} de {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </>
  );
}
