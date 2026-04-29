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
    <div className="p-8 bg-slate-50 dark:bg-slate-950 min-h-screen transition-colors duration-300">
      {/* Header Area */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200 dark:shadow-none">
              <Truck className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white leading-tight">Despachos</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-widest rounded">Logística y Entregas</span>
                <span className="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full" />
                <span className="text-slate-400 dark:text-slate-500 text-xs font-medium">{despachos.length} entregas activas</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/despachos/historial">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center justify-center gap-2 rounded-xl bg-slate-100 dark:bg-slate-800 px-5 py-2.5 font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all shadow-sm"
              >
                <Clock className="h-4 w-4" />
                HISTORIAL
              </motion.button>
            </Link>
            <motion.button
              whileHover={{ scale: 1.02, boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.3)' }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsModalOpen(true)}
              className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 font-bold text-white shadow-lg transition-all hover:bg-blue-700 active:scale-95"
            >
              <Plus className="h-4 w-4" />
              NUEVO DESPACHO
            </motion.button>
          </div>
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

      {/* Categorías y Filtros Wrapper */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 mb-8 transition-colors">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Tabs */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl w-fit">
            {['Todos', 'Bolsa', 'Bobina'].map((tipo) => (
              <button
                key={tipo}
                onClick={() => {
                  setFilters({ ...filters, tipoProducto: tipo === 'Todos' ? '' : tipo });
                  setPage(1);
                }}
                className={`px-6 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${(tipo === 'Todos' && !filters.tipoProducto) || filters.tipoProducto === tipo
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-md'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-700/50'
                  }`}
              >
                {tipo === 'Todos' ? 'Todos' : `${tipo}s`}
              </button>
            ))}
          </div>

          <div className="h-px lg:h-10 lg:w-px bg-slate-100 dark:bg-slate-800" />

          {/* Filtros */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-200 dark:border-slate-700">Estado</div>
              <select
                value={filters.estado}
                onChange={(e) => setFilters({ ...filters, estado: e.target.value })}
                className="bg-transparent px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 focus:outline-none cursor-pointer flex-1"
              >
                <option value="">Todos los estados</option>
                {ESTADOS.filter(e => e.value !== 'Entregado').map((e) => (
                  <option key={e.value} value={e.value}>{e.label}</option>
                ))}
              </select>
            </div>
            
            <div className="relative">
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="date"
                value={filters.fechaInicio}
                onChange={(e) => setFilters({ ...filters, fechaInicio: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-sm font-semibold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="date"
                value={filters.fechaFin}
                onChange={(e) => setFilters({ ...filters, fechaFin: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-sm font-semibold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Vista móvil - Tarjetas */}
      <div className="space-y-4 lg:hidden">
        {despachos.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-12 text-center border border-slate-200 dark:border-slate-800">
            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
              <Truck className="w-8 h-8" />
            </div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No hay despachos registrados</p>
          </div>
        ) : (
          despachos.map((despacho) => {
            const estadoInfo = getEstadoInfo(despacho.estado);
            return (
              <motion.div
                key={despacho.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 border border-slate-200 dark:border-slate-800 shadow-sm"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h3 className="font-black text-slate-900 dark:text-white leading-tight">{despacho.cliente.nombre}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{formatDate(despacho.fecha)}</p>
                  </div>
                  <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-lg ${estadoInfo.color}`}>
                    {estadoInfo.label}
                  </span>
                </div>
                
                <div className="mb-6 grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Cantidad</span>
                    <p className="text-sm font-black text-slate-900 dark:text-white">{despacho.cantidadDespachada} {despacho.unidad}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Vehículo</span>
                    <p className="text-sm font-black text-slate-900 dark:text-white">{despacho.vehiculo || '-'}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Conductor</span>
                    <p className="text-sm font-black text-slate-900 dark:text-white line-clamp-1">{despacho.conductor || '-'}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Destino</span>
                    <p className="text-sm font-black text-slate-900 dark:text-white line-clamp-1">{despacho.destino || '-'}</p>
                  </div>
                </div>

                <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-4">
                  {despacho.estado === 'Pendiente' && (
                    <button
                      onClick={() => handleUpdateEstado(despacho.id, 'EnTransito')}
                      className="p-2.5 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-100 dark:border-blue-900/50"
                      title="Marcar En Tránsito"
                    >
                      <Truck className="h-4 w-4" />
                    </button>
                  )}
                  {despacho.estado === 'EnTransito' && (
                    <button
                      onClick={() => handleUpdateEstado(despacho.id, 'Entregado')}
                      className="p-2.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-100 dark:border-emerald-900/50"
                      title="Marcar Entregado"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleEdit(despacho.id)}
                    className="p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-blue-600 rounded-xl border border-slate-200 dark:border-slate-700"
                    title="Editar"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(despacho.id)}
                      className="p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-red-600 rounded-xl border border-slate-200 dark:border-slate-700"
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
      <div className="hidden lg:block bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Fecha</th>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Cliente</th>
                <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Cantidad</th>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Conductor / Vehículo</th>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Destino</th>
                <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Estado</th>
                <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {despachos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center">
                    <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                      <Truck className="w-8 h-8" />
                    </div>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No hay despachos registrados</p>
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
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                    >
                      <td className="px-6 py-4 text-sm font-bold text-slate-600 dark:text-slate-400">{formatDate(despacho.fecha)}</td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-black text-slate-900 dark:text-white">{despacho.cliente.nombre}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-black text-slate-900 dark:text-white">{despacho.cantidadDespachada} {despacho.unidad}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-700 dark:text-slate-200">{despacho.conductor || 'N/A'}</span>
                          <span className="text-[10px] uppercase tracking-widest">{despacho.vehiculo || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 line-clamp-1">{despacho.destino || '-'}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-lg ${estadoInfo.color}`}>
                          {estadoInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {despacho.estado === 'Pendiente' && (
                            <button
                              onClick={() => handleUpdateEstado(despacho.id, 'EnTransito')}
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-all"
                              title="Marcar En Tránsito"
                            >
                              <Truck className="h-4 w-4" />
                            </button>
                          )}
                          {despacho.estado === 'EnTransito' && (
                            <button
                              onClick={() => handleUpdateEstado(despacho.id, 'Entregado')}
                              className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-xl transition-all"
                              title="Marcar Entregado"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleEdit(despacho.id)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-all"
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => handleDelete(despacho.id)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-all"
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
        <div className="mt-8 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-6">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Página {page} de {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 transition-all"
            >
              Anterior
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md shadow-blue-100 dark:shadow-none"
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
