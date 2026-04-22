'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, Check, CheckCheck, Trash2, X, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

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

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotificaciones = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/notificaciones?limit=10&soloNoLeidas=false');
      if (res.ok) {
        const data = await res.json();
        setNotificaciones(data.notificaciones);
        setNoLeidas(data.noLeidas);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotificaciones();
    // Polling cada 30 segundos
    const interval = setInterval(fetchNotificaciones, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
      console.error('Error marking notification as read:', error);
    }
  };

  const marcarTodasComoLeidas = async () => {
    try {
      const res = await fetch('/api/notificaciones', {
        method: 'PATCH',
      });
      if (res.ok) {
        setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
        setNoLeidas(0);
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const eliminarNotificacion = async (id: string) => {
    try {
      const res = await fetch(`/api/notificaciones/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        const notif = notificaciones.find((n) => n.id === id);
        setNotificaciones((prev) => prev.filter((n) => n.id !== id));
        if (notif && !notif.leida) {
          setNoLeidas((prev) => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
        aria-label="Notificaciones"
      >
        <Bell className="h-5 w-5 sm:h-6 sm:w-6" />
        {noLeidas > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium"
          >
            {noLeidas > 99 ? '99+' : noLeidas}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white flex items-center justify-between">
              <h3 className="font-semibold">Notificaciones</h3>
              <div className="flex items-center gap-2">
                {noLeidas > 0 && (
                  <button
                    onClick={marcarTodasComoLeidas}
                    className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded transition-colors flex items-center gap-1"
                    title="Marcar todas como leídas"
                  >
                    <CheckCheck className="h-3 w-3" />
                    <span className="hidden sm:inline">Leer todas</span>
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="hover:bg-white/20 p-1 rounded transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Lista de notificaciones */}
            <div className="max-h-96 overflow-y-auto">
              {loading && notificaciones.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                  Cargando...
                </div>
              ) : notificaciones.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>No hay notificaciones</p>
                </div>
              ) : (
                notificaciones.map((notif) => (
                  <div
                    key={notif.id}
                    className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                      !notif.leida ? 'bg-blue-50/50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-xl">
                        {tipoIconos[notif.tipo] || 'ℹ️'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm ${!notif.leida ? 'font-semibold' : ''} text-gray-800`}>
                            {notif.titulo}
                          </p>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {!notif.leida && (
                              <button
                                onClick={() => marcarComoLeida(notif.id)}
                                className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                                title="Marcar como leída"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              onClick={() => eliminarNotificacion(notif.id)}
                              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                          {notif.mensaje}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDistanceToNow(new Date(notif.fecha), {
                            addSuffix: true,
                            locale: es,
                          })}
                        </p>
                        {notif.enlace && (
                          <Link
                            href={notif.enlace}
                            onClick={() => {
                              marcarComoLeida(notif.id);
                              setIsOpen(false);
                            }}
                            className="text-xs text-blue-600 hover:text-blue-800 mt-1 inline-block"
                          >
                            Ver detalles →
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <Link
                href="/notificaciones"
                onClick={() => setIsOpen(false)}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Ver todas
              </Link>
              <Link
                href="/perfil#notificaciones"
                onClick={() => setIsOpen(false)}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                <Settings className="h-4 w-4" />
                Configurar
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
