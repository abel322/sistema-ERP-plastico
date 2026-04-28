'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ClipboardCheck,
  Plus,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  AlertCircle,
  Settings,
  Calendar,
  User,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { NuevaInspeccionModal } from '@/components/modals/NuevaInspeccionModal';

interface Inspeccion {
  id: string;
  lote?: string;
  fecha: string;
  inspector: string;
  resultado: string;
  observaciones?: string;
  produccion?: {
    id: string;
    maquina: { nombre: string; area: string };
    pedido?: { cliente: { nombre: string } };
  };
  resultadosParams: Array<{
    cumple: boolean;
    parametro: { nombre: string };
  }>;
  noConformidades: Array<{ id: string }>;
}

const resultadoConfig: Record<string, { color: string; icon: React.ElementType; label: string }> = {
  Aprobado: { color: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'Aprobado' },
  Rechazado: { color: 'bg-red-100 text-red-700', icon: XCircle, label: 'Rechazado' },
  AprobadoConObservaciones: { color: 'bg-yellow-100 text-yellow-700', icon: AlertCircle, label: 'Con Observaciones' },
};

export default function CalidadPage() {
  const [inspecciones, setInspecciones] = useState<Inspeccion[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filtroResultado, setFiltroResultado] = useState('');
  const [estadisticas, setEstadisticas] = useState<Array<{ resultado: string; _count: { _all: number } }>>([]);

  const [showNuevaModal, setShowNuevaModal] = useState(false);

  const fetchInspecciones = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: page.toString(), limit: '10' });
      if (filtroResultado) params.append('resultado', filtroResultado);

      const res = await fetch(`/api/calidad/inspecciones?${params}`);
      if (res.ok) {
        const data = await res.json();
        setInspecciones(data.inspecciones);
        setTotalPages(data.totalPages);
        setEstadisticas(data.estadisticas);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInspecciones();
  }, [page, filtroResultado]);

  if (loading && inspecciones.length === 0) {
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
              <ClipboardCheck className="h-7 w-7 sm:h-8 sm:w-8 text-teal-600" />
              Control de Calidad
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              Inspecciones y parámetros de calidad
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/calidad/parametros"
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              <Settings className="h-5 w-5" />
              Parámetros
            </Link>
            <button
              onClick={() => setShowNuevaModal(true)}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-700 text-white rounded-xl hover:from-teal-700 hover:to-emerald-800 transition-all font-bold shadow-lg shadow-teal-100 active:scale-95"
            >
              <Plus className="h-5 w-5" />
              Nueva Inspección
            </button>
          </div>
        </div>

        <NuevaInspeccionModal
          isOpen={showNuevaModal}
          onClose={() => setShowNuevaModal(false)}
          onSuccess={() => fetchInspecciones()}
        />

        {/* Estadísticas */}
        <div className="grid grid-cols-3 gap-4">
          {Object.entries(resultadoConfig).map(([key, config]) => {
            const count = estadisticas.find((e) => e.resultado === key)?._count._all || 0;
            const Icon = config.icon;
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-sm p-4 border border-gray-100"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${config.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-800">{count}</p>
                    <p className="text-xs text-gray-500">{config.label}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Resultado</label>
              <select
                value={filtroResultado}
                onChange={(e) => {
                  setFiltroResultado(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
              >
                <option value="">Todos</option>
                {Object.entries(resultadoConfig).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Lista */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {inspecciones.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <ClipboardCheck className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg">No hay inspecciones registradas</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {inspecciones.map((inspeccion, index) => {
                const config = resultadoConfig[inspeccion.resultado] || resultadoConfig.Aprobado;
                const Icon = config.icon;
                const cumplidos = inspeccion.resultadosParams.filter((r) => r.cumple).length;
                const totalParams = inspeccion.resultadosParams.length;

                return (
                  <motion.div
                    key={inspeccion.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 sm:p-5 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${config.color}`}>
                            <Icon className="h-3 w-3" />
                            {config.label}
                          </span>
                          {inspeccion.lote && (
                            <span className="text-sm font-mono bg-gray-100 px-2 py-0.5 rounded">
                              Lote: {inspeccion.lote}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(inspeccion.fecha), "d MMM yyyy HH:mm", { locale: es })}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {inspeccion.inspector}
                          </span>
                          {inspeccion.produccion && (
                            <span className="bg-teal-50 text-teal-700 px-2 py-0.5 rounded text-xs">
                              {inspeccion.produccion.maquina.nombre}
                            </span>
                          )}
                          {totalParams > 0 && (
                            <span className={`px-2 py-0.5 rounded text-xs ${cumplidos === totalParams ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                              }`}>
                              {cumplidos}/{totalParams} parámetros OK
                            </span>
                          )}
                          {inspeccion.noConformidades.length > 0 && (
                            <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs">
                              {inspeccion.noConformidades.length} no conformidades
                            </span>
                          )}
                        </div>
                        {inspeccion.observaciones && (
                          <p className="text-sm text-gray-600 mt-2 line-clamp-1">
                            {inspeccion.observaciones}
                          </p>
                        )}
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
