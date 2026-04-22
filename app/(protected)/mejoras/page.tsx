'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Lightbulb,
  Plus,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit,
  Trash2,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { NuevaMejoraModal } from '@/components/modals/NuevaMejoraModal';

interface Mejora {
  id: string;
  titulo: string;
  problema: string;
  solucionPropuesta: string;
  responsable: string;
  estado: string;
  fecha: string;
  costoEstimado?: number;
  ahorroEstimado?: number;
  maquina: {
    id: string;
    nombre: string;
    area: string;
  };
}

interface Maquina {
  id: string;
  nombre: string;
  area: string;
}

const estadoConfig: Record<string, { color: string; icon: React.ElementType; label: string }> = {
  Propuesta: { color: 'bg-blue-100 text-blue-700', icon: Lightbulb, label: 'Propuesta' },
  EnEvaluacion: { color: 'bg-yellow-100 text-yellow-700', icon: Clock, label: 'En Evaluación' },
  Aprobada: { color: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'Aprobada' },
  Implementada: { color: 'bg-emerald-100 text-emerald-700', icon: TrendingUp, label: 'Implementada' },
  Rechazada: { color: 'bg-red-100 text-red-700', icon: XCircle, label: 'Rechazada' },
};

export default function MejorasPage() {
  const { data: session } = useSession() || {};
  const [mejoras, setMejoras] = useState<Mejora[]>([]);
  const [maquinas, setMaquinas] = useState<Maquina[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filtroMaquina, setFiltroMaquina] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [estadisticas, setEstadisticas] = useState<{
    porEstado: Array<{ estado: string; _count: { _all: number } }>;
    ahorroTotal: number;
  }>({ porEstado: [], ahorroTotal: 0 });

  const [showNuevaModal, setShowNuevaModal] = useState(false);

  const isAdmin = (session?.user as { rol?: string })?.rol === 'admin';

  const fetchMejoras = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: page.toString(), limit: '10' });
      if (filtroMaquina) params.append('maquinaId', filtroMaquina);
      if (filtroEstado) params.append('estado', filtroEstado);

      const res = await fetch(`/api/mejoras?${params}`);
      if (res.ok) {
        const data = await res.json();
        setMejoras(data.mejoras);
        setTotalPages(data.totalPages);
        setEstadisticas(data.estadisticas);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMaquinas = async () => {
    try {
      const res = await fetch('/api/maquinas');
      if (res.ok) {
        const data = await res.json();
        setMaquinas(data);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  useEffect(() => {
    fetchMaquinas();
  }, []);

  useEffect(() => {
    fetchMejoras();
  }, [page, filtroMaquina, filtroEstado]);

  const eliminarMejora = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar esta mejora?')) return;
    try {
      const res = await fetch(`/api/mejoras/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchMejoras();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const cambiarEstado = async (id: string, nuevoEstado: string) => {
    try {
      const res = await fetch(`/api/mejoras/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      if (res.ok) {
        fetchMejoras();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (loading && mejoras.length === 0) {
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
              <Lightbulb className="h-7 w-7 sm:h-8 sm:w-8 text-yellow-500" />
              Mejoras Continuas
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              Gestione propuestas de mejora por máquina
            </p>
          </div>
          <button
            onClick={() => setShowNuevaModal(true)}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-yellow-500 to-amber-600 text-white rounded-xl hover:from-yellow-600 hover:to-amber-700 transition-all shadow-lg shadow-yellow-100 font-bold active:scale-95"
          >
            <Plus className="h-5 w-5" />
            Nueva Mejora
          </button>
        </div>

        <NuevaMejoraModal
          isOpen={showNuevaModal}
          onClose={() => setShowNuevaModal(false)}
          onSuccess={() => fetchMejoras()}
        />

        {/* Estadísticas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Object.entries(estadoConfig).slice(0, 4).map(([estado, config]) => {
            const count = estadisticas.porEstado.find((e) => e.estado === estado)?._count._all || 0;
            const Icon = config.icon;
            return (
              <motion.div
                key={estado}
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

        {/* Ahorro total */}
        {estadisticas.ahorroTotal > 0 && (
          <div className="bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl p-4 sm:p-6 text-white">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8" />
              <div>
                <p className="text-sm opacity-90">Ahorro Total por Mejoras Implementadas</p>
                <p className="text-2xl sm:text-3xl font-bold">
                  ${estadisticas.ahorroTotal.toLocaleString('es-VE')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Máquina</label>
              <select
                value={filtroMaquina}
                onChange={(e) => {
                  setFiltroMaquina(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-sm"
              >
                <option value="">Todas las máquinas</option>
                {maquinas.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nombre} ({m.area})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <select
                value={filtroEstado}
                onChange={(e) => {
                  setFiltroEstado(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-sm"
              >
                <option value="">Todos los estados</option>
                {Object.entries(estadoConfig).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Lista de mejoras */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {mejoras.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Lightbulb className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg">No hay mejoras registradas</p>
              <p className="text-sm mt-1">Comience agregando una nueva propuesta de mejora</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {mejoras.map((mejora, index) => {
                const config = estadoConfig[mejora.estado] || estadoConfig.Propuesta;
                const Icon = config.icon;
                return (
                  <motion.div
                    key={mejora.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 sm:p-5 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-800">
                            {mejora.titulo}
                          </h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${config.color}`}>
                            <Icon className="h-3 w-3" />
                            {config.label}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          <strong>Problema:</strong> {mejora.problema}
                        </p>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                          <span className="bg-gray-100 px-2 py-1 rounded">
                            {mejora.maquina.nombre} ({mejora.maquina.area})
                          </span>
                          <span>Responsable: {mejora.responsable}</span>
                          <span>
                            {format(new Date(mejora.fecha), "d MMM yyyy", { locale: es })}
                          </span>
                          {mejora.ahorroEstimado && (
                            <span className="text-green-600 font-medium">
                              Ahorro: ${mejora.ahorroEstimado.toLocaleString('es-VE')}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Botones de cambio de estado */}
                        {mejora.estado === 'Propuesta' && (
                          <button
                            onClick={() => cambiarEstado(mejora.id, 'EnEvaluacion')}
                            className="px-3 py-1.5 bg-yellow-100 text-yellow-700 text-sm rounded-lg hover:bg-yellow-200 transition-colors"
                          >
                            Evaluar
                          </button>
                        )}
                        {mejora.estado === 'EnEvaluacion' && (
                          <>
                            <button
                              onClick={() => cambiarEstado(mejora.id, 'Aprobada')}
                              className="px-3 py-1.5 bg-green-100 text-green-700 text-sm rounded-lg hover:bg-green-200 transition-colors"
                            >
                              Aprobar
                            </button>
                            <button
                              onClick={() => cambiarEstado(mejora.id, 'Rechazada')}
                              className="px-3 py-1.5 bg-red-100 text-red-700 text-sm rounded-lg hover:bg-red-200 transition-colors"
                            >
                              Rechazar
                            </button>
                          </>
                        )}
                        {mejora.estado === 'Aprobada' && (
                          <button
                            onClick={() => cambiarEstado(mejora.id, 'Implementada')}
                            className="px-3 py-1.5 bg-emerald-100 text-emerald-700 text-sm rounded-lg hover:bg-emerald-200 transition-colors"
                          >
                            Implementar
                          </button>
                        )}
                        <Link
                          href={`/mejoras/${mejora.id}`}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Ver detalle"
                        >
                          <Eye className="h-5 w-5" />
                        </Link>
                        <Link
                          href={`/mejoras/${mejora.id}/editar`}
                          className="p-2 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit className="h-5 w-5" />
                        </Link>
                        {isAdmin && (
                          <button
                            onClick={() => eliminarMejora(mejora.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
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
