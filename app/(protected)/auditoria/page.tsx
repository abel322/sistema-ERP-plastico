'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ScrollText,
  ChevronLeft,
  ChevronRight,
  User,
  Calendar,
  FileText,
  Edit,
  Trash2,
  LogIn,
  LogOut,
  Download,
  Printer,
  Plus,
  Eye,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface Log {
  id: string;
  usuarioId?: string;
  usuarioNombre?: string;
  accion: string;
  modulo: string;
  registroId?: string;
  descripcion?: string;
  ip?: string;
  fecha: string;
}

const accionConfig: Record<string, { color: string; icon: React.ElementType; label: string }> = {
  Crear: { color: 'bg-green-100 text-green-700', icon: Plus, label: 'Crear' },
  Editar: { color: 'bg-blue-100 text-blue-700', icon: Edit, label: 'Editar' },
  Eliminar: { color: 'bg-red-100 text-red-700', icon: Trash2, label: 'Eliminar' },
  Login: { color: 'bg-purple-100 text-purple-700', icon: LogIn, label: 'Inicio Sesión' },
  Logout: { color: 'bg-gray-100 text-gray-700', icon: LogOut, label: 'Cerrar Sesión' },
  Exportar: { color: 'bg-orange-100 text-orange-700', icon: Download, label: 'Exportar' },
  Imprimir: { color: 'bg-cyan-100 text-cyan-700', icon: Printer, label: 'Imprimir' },
};

export default function AuditoriaPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [modulos, setModulos] = useState<string[]>([]);
  const [filtroAccion, setFiltroAccion] = useState('');
  const [filtroModulo, setFiltroModulo] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: page.toString(), limit: '20' });
      if (filtroAccion) params.append('accion', filtroAccion);
      if (filtroModulo) params.append('modulo', filtroModulo);
      if (fechaInicio) params.append('fechaInicio', fechaInicio);
      if (fechaFin) params.append('fechaFin', fechaFin);

      const res = await fetch(`/api/auditoria?${params}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs);
        setTotalPages(data.totalPages);
        setModulos(data.modulos);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, filtroAccion, filtroModulo, fechaInicio, fechaFin]);

  if (loading && logs.length === 0) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center"><LoadingSpinner /></div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-3">
            <ScrollText className="h-7 w-7 sm:h-8 sm:w-8 text-indigo-600" />
            Auditoría del Sistema
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Historial de actividades y cambios en el sistema
          </p>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Acción</label>
              <select
                value={filtroAccion}
                onChange={(e) => {
                  setFiltroAccion(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Todas</option>
                {Object.entries(accionConfig).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Módulo</label>
              <select
                value={filtroModulo}
                onChange={(e) => {
                  setFiltroModulo(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Todos</option>
                {modulos.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => {
                  setFechaInicio(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => {
                  setFechaFin(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Lista */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {logs.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <ScrollText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg">No hay registros de actividad</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {logs.map((log, index) => {
                const config = accionConfig[log.accion] || { color: 'bg-gray-100 text-gray-700', icon: Eye, label: log.accion };
                const Icon = config.icon;
                return (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-lg ${config.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${config.color}`}>
                            {config.label}
                          </span>
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                            {log.modulo}
                          </span>
                        </div>
                        {log.descripcion && (
                          <p className="text-sm text-gray-700 mb-1">{log.descripcion}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(log.fecha), "d MMM yyyy HH:mm:ss", { locale: es })}
                          </span>
                          {log.usuarioNombre && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {log.usuarioNombre}
                            </span>
                          )}
                          {log.ip && (
                            <span className="font-mono text-gray-400">
                              IP: {log.ip}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </button>
            <span className="text-sm text-gray-600">Página {page} de {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
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
