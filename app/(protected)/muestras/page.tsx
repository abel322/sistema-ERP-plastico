'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  TestTube2,
  Plus,
  Pencil,
  Trash2,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { NuevaMuestraModal } from '@/components/modals/NuevaMuestraModal';

const TIPOS = [
  { value: 'Produccion', label: 'Producción' },
  { value: 'ClienteNuevo', label: 'Cliente Nuevo' },
  { value: 'Reclamo', label: 'Reclamo' },
];

const ESTADOS = [
  { value: 'Pendiente', label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  { value: 'Aprobada', label: 'Aprobada', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  { value: 'Rechazada', label: 'Rechazada', color: 'bg-red-100 text-red-800', icon: XCircle },
];

interface Muestra {
  id: string;
  fecha: string;
  tipo: string;
  descripcion?: string;
  cantidad: number;
  unidad: string;
  responsable: string;
  estado: string;
  aprobadaAt?: string;
  observaciones?: string;
  cliente: { id: string; nombre: string };
  pedido?: { id: string };
}

export default function MuestrasPage() {
  const { data: session } = useSession() || {};
  const [muestras, setMuestras] = useState<Muestra[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    tipo: '',
    estado: '',
    fechaInicio: '',
    fechaFin: '',
  });

  const [showNuevaModal, setShowNuevaModal] = useState(false);

  const isAdmin = (session?.user as any)?.rol === 'admin';

  useEffect(() => {
    fetchMuestras();
  }, [page, filters]);

  const fetchMuestras = async () => {
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: '10' });
      if (filters.tipo) params.append('tipo', filters.tipo);
      if (filters.estado) params.append('estado', filters.estado);
      if (filters.fechaInicio) params.append('fechaInicio', filters.fechaInicio);
      if (filters.fechaFin) params.append('fechaFin', filters.fechaFin);

      const res = await fetch(`/api/muestras?${params}`);
      const data = await res.json();
      setMuestras(data.data || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEstado = async (id: string, estado: string) => {
    try {
      await fetch(`/api/muestras/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado }),
      });
      fetchMuestras();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta muestra?')) return;
    try {
      await fetch(`/api/muestras/${id}`, { method: 'DELETE' });
      fetchMuestras();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const getTipoLabel = (tipo: string) =>
    TIPOS.find((t) => t.value === tipo)?.label || tipo;

  const getEstadoInfo = (estado: string) =>
    ESTADOS.find((e) => e.value === estado) || ESTADOS[0];

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('es-VE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

  return (
    <>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Muestras</h1>
            <p className="mt-1 text-sm text-gray-600 sm:text-base">Control de muestras de producción</p>
          </div>
          <button
            onClick={() => setShowNuevaModal(true)}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-2.5 text-white shadow-lg shadow-purple-200 hover:from-purple-700 hover:to-indigo-700 transition-all active:scale-95 sm:w-auto"
          >
            <Plus className="h-5 w-5" />
            Nueva Muestra
          </button>
        </div>

        <NuevaMuestraModal
          isOpen={showNuevaModal}
          onClose={() => setShowNuevaModal(false)}
          onSuccess={() => fetchMuestras()}
        />

        {/* Filtros */}
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-500" />
            <span className="font-medium text-gray-700">Filtros</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <select
              value={filters.tipo}
              onChange={(e) => setFilters({ ...filters, tipo: e.target.value })}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
            >
              <option value="">Todos los tipos</option>
              {TIPOS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <select
              value={filters.estado}
              onChange={(e) => setFilters({ ...filters, estado: e.target.value })}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
            >
              <option value="">Todos los estados</option>
              {ESTADOS.map((e) => (
                <option key={e.value} value={e.value}>{e.label}</option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <input
                type="date"
                value={filters.fechaInicio}
                onChange={(e) => setFilters({ ...filters, fechaInicio: e.target.value })}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">a</span>
              <input
                type="date"
                value={filters.fechaFin}
                onChange={(e) => setFilters({ ...filters, fechaFin: e.target.value })}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Vista móvil - Tarjetas */}
        <div className="space-y-3 lg:hidden">
          {muestras.length === 0 ? (
            <div className="rounded-xl bg-white p-8 text-center text-gray-500 shadow-sm">
              No hay muestras registradas
            </div>
          ) : (
            muestras.map((muestra) => {
              const estadoInfo = getEstadoInfo(muestra.estado);
              const EstadoIcon = estadoInfo.icon;
              return (
                <motion.div
                  key={muestra.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-medium text-gray-900">{muestra.cliente.nombre}</h3>
                      <p className="text-sm text-gray-600">{formatDate(muestra.fecha)}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${estadoInfo.color}`}>
                      <EstadoIcon className="h-3 w-3" />
                      {estadoInfo.label}
                    </span>
                  </div>
                  <div className="mb-3 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Tipo:</span>
                      <p className="font-medium">{getTipoLabel(muestra.tipo)}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Cantidad:</span>
                      <p className="font-medium">{muestra.cantidad} {muestra.unidad}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-500">Responsable:</span>
                      <p className="font-medium">{muestra.responsable}</p>
                    </div>
                    {muestra.descripcion && (
                      <div className="col-span-2">
                        <span className="text-gray-500">Descripción:</span>
                        <p className="font-medium">{muestra.descripcion}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end gap-2">
                    {muestra.estado === 'Pendiente' && (
                      <>
                        <button
                          onClick={() => handleUpdateEstado(muestra.id, 'Aprobada')}
                          className="rounded bg-green-100 p-2 text-green-600 hover:bg-green-200"
                          title="Aprobar"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleUpdateEstado(muestra.id, 'Rechazada')}
                          className="rounded bg-red-100 p-2 text-red-600 hover:bg-red-200"
                          title="Rechazar"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </>
                    )}
                    <Link
                      href={`/muestras/${muestra.id}/editar`}
                      className="rounded bg-gray-100 p-2 text-gray-600 hover:bg-gray-200"
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(muestra.id)}
                        className="rounded bg-red-100 p-2 text-red-600 hover:bg-red-200"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Vista desktop - Tabla */}
        <div className="hidden rounded-xl bg-white shadow-sm overflow-hidden lg:block">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Fecha</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Cliente</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Tipo</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Cantidad</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Responsable</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Estado</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {muestras.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      No hay muestras registradas
                    </td>
                  </tr>
                ) : (
                  muestras.map((muestra) => {
                    const estadoInfo = getEstadoInfo(muestra.estado);
                    const EstadoIcon = estadoInfo.icon;
                    return (
                      <motion.tr
                        key={muestra.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-4 py-3 text-sm text-gray-900">{formatDate(muestra.fecha)}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{muestra.cliente.nombre}</td>
                        <td className="px-4 py-3">
                          <span className="rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-800">
                            {getTipoLabel(muestra.tipo)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-gray-900">
                          {muestra.cantidad} {muestra.unidad}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{muestra.responsable}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${estadoInfo.color}`}>
                            <EstadoIcon className="h-3 w-3" />
                            {estadoInfo.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-center gap-2">
                            {muestra.estado === 'Pendiente' && (
                              <>
                                <button
                                  onClick={() => handleUpdateEstado(muestra.id, 'Aprobada')}
                                  className="rounded p-1 text-gray-500 hover:bg-green-100 hover:text-green-600"
                                  title="Aprobar"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleUpdateEstado(muestra.id, 'Rechazada')}
                                  className="rounded p-1 text-gray-500 hover:bg-red-100 hover:text-red-600"
                                  title="Rechazar"
                                >
                                  <XCircle className="h-4 w-4" />
                                </button>
                              </>
                            )}
                            <Link
                              href={`/muestras/${muestra.id}/editar`}
                              className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-blue-600"
                            >
                              <Pencil className="h-4 w-4" />
                            </Link>
                            {isAdmin && (
                              <button
                                onClick={() => handleDelete(muestra.id)}
                                className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
            <p className="text-sm text-gray-600">Página {page} de {totalPages}</p>
            <div className="flex w-full gap-2 sm:w-auto">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:opacity-50 sm:flex-initial"
              >
                Anterior
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:opacity-50 sm:flex-initial"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
