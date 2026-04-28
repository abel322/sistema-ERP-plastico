'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Truck,
  Plus,
  Pencil,
  Trash2,
  Filter,
  CheckCircle,
  Clock,
  MapPin,
  Calendar,
  Package,
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { NuevoDespachoModal } from '@/components/modals/nuevo-despacho-modal';
import { EditarDespachoModal } from '@/components/modals/EditarDespachoModal';
import { useSearchParams } from 'next/navigation';

const ESTADOS = [
  { value: 'Pendiente', label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'EnTransito', label: 'En Tránsito', color: 'bg-blue-100 text-blue-800' },
  { value: 'Entregado', label: 'Entregado', color: 'bg-green-100 text-green-800' },
  { value: 'Cancelado', label: 'Cancelado', color: 'bg-red-100 text-red-800' },
];

interface Despacho {
  id: string;
  fecha: string;
  cantidadDespachada: number;
  unidad: string;
  vehiculo?: string;
  conductor?: string;
  destino?: string;
  guiaRemision?: string;
  estado: string;
  entregadoAt?: string;
  pedido: { id: string; cantidadSolicitada: number };
  cliente: { id: string; nombre: string };
}

export default function DespachosPage() {
  const { data: session } = useSession() || {};
  const searchParams = useSearchParams();
  const preselectedId = searchParams.get('productoTerminadoId');
  const [isModalOpen, setIsModalOpen] = useState(!!preselectedId);
  const [despachos, setDespachos] = useState<Despacho[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    estado: '',
    fechaInicio: '',
    fechaFin: '',
    tipoProducto: '',
  });

  const [editarModalOpen, setEditarModalOpen] = useState(false);
  const [selectedDespachoId, setSelectedDespachoId] = useState<string | null>(null);

  const isAdmin = (session?.user as any)?.rol === 'admin';

  useEffect(() => {
    fetchDespachos();
  }, [page, filters]);

  const fetchDespachos = async () => {
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: '10' });
      if (filters.estado) {
        params.append('estado', filters.estado);
      } else {
        params.append('excludeEstado', 'Entregado');
      }
      if (filters.fechaInicio) params.append('fechaInicio', filters.fechaInicio);
      if (filters.fechaFin) params.append('fechaFin', filters.fechaFin);
      if (filters.tipoProducto) params.append('tipoProducto', filters.tipoProducto);

      const res = await fetch(`/api/despachos?${params}`);
      const data = await res.json();
      setDespachos(data.data || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEstado = async (id: string, estado: string) => {
    try {
      await fetch(`/api/despachos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado }),
      });
      fetchDespachos();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleEdit = (id: string) => {
    setSelectedDespachoId(id);
    setEditarModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este despacho?')) return;
    try {
      await fetch(`/api/despachos/${id}`, { method: 'DELETE' });
      fetchDespachos();
    } catch (error) {
      console.error('Error:', error);
    }
  };

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
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Despachos</h1>
            <p className="mt-1 text-sm text-gray-600 sm:text-base">Gestión de entregas y despachos</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 sm:w-auto w-full">
            <Link
              href="/despachos/historial"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-white border border-gray-200 px-4 py-2 text-gray-700 shadow-sm transition-all hover:bg-gray-50 active:scale-95 sm:w-auto font-medium"
            >
              <Clock className="h-5 w-5" />
              Historial de Despacho
            </Link>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-white shadow-md transition-all hover:scale-105 hover:shadow-lg active:scale-95 sm:w-auto font-medium"
            >
              <Plus className="h-5 w-5" />
              Nuevo Despacho
            </button>
          </div>
        </div>

        <NuevoDespachoModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            fetchDespachos();
          }}
          preselectedId={preselectedId || undefined}
        />

        {/* Categorías (Tabs) */}
        <div className="flex bg-white shadow-sm p-1 rounded-xl w-full border border-gray-100 mb-4 sm:w-fit overflow-x-auto">
          {['Todos', 'Bolsa', 'Bobina'].map((tipo) => (
            <button
              key={tipo}
              onClick={() => {
                setFilters({ ...filters, tipoProducto: tipo === 'Todos' ? '' : tipo });
                setPage(1);
              }}
              className={`px-5 py-2 text-sm font-medium rounded-lg transition-all ${(tipo === 'Todos' && !filters.tipoProducto) || filters.tipoProducto === tipo
                ? 'bg-blue-50 text-blue-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
            >
              {tipo === 'Todos' ? 'Todos los Productos' : `${tipo}s`}
            </button>
          ))}
        </div>

        {/* Filtros */}
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-500" />
            <span className="font-medium text-gray-700">Filtros</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <select
              value={filters.estado}
              onChange={(e) => setFilters({ ...filters, estado: e.target.value })}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="">Todos los estados</option>
              {ESTADOS.filter(e => e.value !== 'Entregado').map((e) => (
                <option key={e.value} value={e.value}>{e.label}</option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <input
                type="date"
                value={filters.fechaInicio}
                onChange={(e) => setFilters({ ...filters, fechaInicio: e.target.value })}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">a</span>
              <input
                type="date"
                value={filters.fechaFin}
                onChange={(e) => setFilters({ ...filters, fechaFin: e.target.value })}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Vista móvil - Tarjetas */}
        <div className="space-y-3 lg:hidden">
          {despachos.length === 0 ? (
            <div className="rounded-xl bg-white p-8 text-center text-gray-500 shadow-sm">
              No hay despachos registrados
            </div>
          ) : (
            despachos.map((despacho) => {
              const estadoInfo = getEstadoInfo(despacho.estado);
              return (
                <motion.div
                  key={despacho.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-medium text-gray-900">{despacho.cliente.nombre}</h3>
                      <p className="text-sm text-gray-600">{formatDate(despacho.fecha)}</p>
                    </div>
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${estadoInfo.color}`}>
                      {estadoInfo.label}
                    </span>
                  </div>
                  <div className="mb-3 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Cantidad:</span>
                      <p className="font-medium">{despacho.cantidadDespachada} {despacho.unidad}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Vehículo:</span>
                      <p className="font-medium">{despacho.vehiculo || '-'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Conductor:</span>
                      <p className="font-medium">{despacho.conductor || '-'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Destino:</span>
                      <p className="font-medium">{despacho.destino || '-'}</p>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    {despacho.estado === 'Pendiente' && (
                      <button
                        onClick={() => handleUpdateEstado(despacho.id, 'EnTransito')}
                        className="rounded bg-blue-100 p-2 text-blue-600 hover:bg-blue-200"
                        title="Marcar En Tránsito"
                      >
                        <Truck className="h-4 w-4" />
                      </button>
                    )}
                    {despacho.estado === 'EnTransito' && (
                      <button
                        onClick={() => handleUpdateEstado(despacho.id, 'Entregado')}
                        className="rounded bg-green-100 p-2 text-green-600 hover:bg-green-200"
                        title="Marcar Entregado"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(despacho.id)}
                      className="rounded bg-gray-100 p-2 text-gray-600 hover:bg-gray-200 transition-colors"
                      title="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(despacho.id)}
                        className="rounded bg-red-100 p-2 text-red-600 hover:bg-red-200 transition-colors"
                        title="Eliminar"
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
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Cantidad</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Vehículo</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Conductor</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Destino</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Estado</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {despachos.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                      No hay despachos registrados
                    </td>
                  </tr>
                ) : (
                  despachos.map((despacho) => {
                    const estadoInfo = getEstadoInfo(despacho.estado);
                    return (
                      <motion.tr
                        key={despacho.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-4 py-3 text-sm text-gray-900">{formatDate(despacho.fecha)}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{despacho.cliente.nombre}</td>
                        <td className="px-4 py-3 text-right text-sm text-gray-900">
                          {despacho.cantidadDespachada} {despacho.unidad}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{despacho.vehiculo || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{despacho.conductor || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{despacho.destino || '-'}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`rounded-full px-2 py-1 text-xs font-medium ${estadoInfo.color}`}>
                            {estadoInfo.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-center gap-2">
                            {despacho.estado === 'Pendiente' && (
                              <button
                                onClick={() => handleUpdateEstado(despacho.id, 'EnTransito')}
                                className="rounded p-1 text-gray-500 hover:bg-blue-100 hover:text-blue-600 transition-colors"
                                title="Marcar En Tránsito"
                              >
                                <Truck className="h-4 w-4" />
                              </button>
                            )}
                            {despacho.estado === 'EnTransito' && (
                              <button
                                onClick={() => handleUpdateEstado(despacho.id, 'Entregado')}
                                className="rounded p-1 text-gray-500 hover:bg-green-100 hover:text-green-600 transition-colors"
                                title="Marcar Entregado"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleEdit(despacho.id)}
                              className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-blue-600 transition-colors"
                              title="Editar"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            {isAdmin && (
                              <button
                                onClick={() => handleDelete(despacho.id)}
                                className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-red-600 transition-colors"
                                title="Eliminar"
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

      <EditarDespachoModal
        isOpen={editarModalOpen}
        onClose={() => setEditarModalOpen(false)}
        onSuccess={() => {
          setEditarModalOpen(false);
          fetchDespachos();
        }}
        despachoId={selectedDespachoId}
      />
    </>
  );
}
