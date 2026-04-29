'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { BadgeEstado } from '@/components/ui/badge-estado';
import { BadgePrioridad } from '@/components/ui/badge-prioridad';
import { Plus, Search, Edit, Trash2, Filter, PackagePlus, History, Package } from 'lucide-react';
import { format } from 'date-fns';
import { NuevoPedidoModal } from '@/components/modals/NuevoPedidoModal';
import { EditarPedidoModal } from '@/components/modals/EditarPedidoModal';

interface Pedido {
  id: string;
  cliente: { nombre: string; id: string };
  productoCliente: { 
    nombreProducto: string; 
    tipoProducto: string;
    codigoProducto?: string;
    unidadVenta: string;
    clienteId: string;
  };
  cantidadSolicitada: number;
  unidad: string;
  fechaPedido: string;
  fechaEntrega: string;
  estado: string;
  prioridad: string;
  cantidadProducida: number;
}

export default function PedidosPage() {
  const { data: session } = useSession() || {};
  const router = useRouter();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [estado, setEstado] = useState('Todos');
  const [prioridad, setPrioridad] = useState('Todas');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPedidoId, setSelectedPedidoId] = useState<string | null>(null);

  const isAdmin = (session?.user as any)?.rol === 'admin';

  useEffect(() => {
    fetchPedidos();
  }, [page, limit, busqueda, estado, prioridad]);

  const fetchPedidos = async () => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(busqueda && { busqueda }),
        ...(estado !== 'Todos' && { estado }),
        ...(prioridad !== 'Todas' && { prioridad }),
      });
      const res = await fetch(`/api/pedidos?${params}`);
      const data = await res.json();
      setPedidos(data?.pedidos || []);
      setTotalPages(data?.totalPages || 1);
    } catch (error) {
      console.error('Error al cargar pedidos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar este pedido?')) return;

    try {
      const res = await fetch(`/api/pedidos/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchPedidos();
      }
    } catch (error) {
      console.error('Error al eliminar pedido:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center"><LoadingSpinner /></div>
    );
  }

  return (
    <div className="p-8 bg-slate-50 dark:bg-slate-950 min-h-screen transition-colors duration-300">
      {/* Header Area */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200 dark:shadow-none">
              <Package className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white leading-tight">Pedidos</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-widest rounded">Gestión de Producción</span>
                <span className="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full" />
                <span className="text-slate-400 dark:text-slate-500 text-xs font-medium">{pedidos.length} pedidos activos</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Link href="/pedidos/historial">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 rounded-xl bg-slate-100 dark:bg-slate-800 px-5 py-2.5 font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all shadow-sm"
              >
                <History className="h-4 w-4" />
                HISTORIAL
              </motion.button>
            </Link>
            {isAdmin && (
              <motion.button
                whileHover={{ scale: 1.02, boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.3)' }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 font-bold text-white shadow-lg transition-all hover:bg-blue-700 active:scale-95"
              >
                <Plus className="h-4 w-4" />
                NUEVO PEDIDO
              </motion.button>
            )}
          </div>
        </div>
      </div>

        <NuevoPedidoModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => fetchPedidos()}
        />

        <EditarPedidoModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedPedidoId(null);
          }}
          onSuccess={() => fetchPedidos()}
          pedidoId={selectedPedidoId}
        />

        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
          {/* Busqueda y Filtros */}
          <div className="mb-6 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1 min-w-[300px]">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por cliente o producto..."
                  value={busqueda}
                  onChange={(e) => {
                    setBusqueda(e.target.value);
                    setPage(1);
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-700 transition-all outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                />
              </div>
              
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-r border-slate-200 dark:border-slate-700">Filtros</div>
                <select
                  value={estado}
                  onChange={(e) => {
                    setEstado(e.target.value);
                    setPage(1);
                  }}
                  className="bg-transparent px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 focus:outline-none cursor-pointer"
                >
                  <option value="Todos">Todos los estados</option>
                  <option value="Pendiente">Pendiente</option>
                  <option value="EnProceso">En Proceso</option>
                  <option value="Completado">Completado</option>
                </select>
                <div className="w-px h-4 bg-slate-200 dark:border-slate-700" />
                <select
                  value={prioridad}
                  onChange={(e) => {
                    setPrioridad(e.target.value);
                    setPage(1);
                  }}
                  className="bg-transparent px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 focus:outline-none cursor-pointer"
                >
                  <option value="Todas">Todas las prioridades</option>
                  <option value="Baja">Baja</option>
                  <option value="Media">Media</option>
                  <option value="Alta">Alta</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end xl:self-auto">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mostrar</span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 focus:outline-none"
              >
                <option value="10">10 registros</option>
                <option value="25">25 registros</option>
                <option value="50">50 registros</option>
              </select>
            </div>
          </div>

          {/* Tabla */}
          <div className="overflow-x-auto -mx-6">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-y border-slate-200 dark:border-slate-800">
                  <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Cliente
                  </th>
                  <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Producto
                  </th>
                  <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Cantidad
                  </th>
                  <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Fechas
                  </th>
                  <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Prioridad
                  </th>
                  <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {pedidos?.map((pedido) => {
                  const saldo =
                    (pedido?.cantidadSolicitada || 0) - (pedido?.cantidadProducida || 0);
                  return (
                    <tr key={pedido?.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                      <td className="px-6 py-4">
                        <button
                          onClick={() => router.push(`/clientes/${pedido?.cliente?.id}`)}
                          className="font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-sm"
                        >
                          {pedido?.cliente?.nombre || 'N/A'}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                            {pedido?.productoCliente?.nombreProducto || '-'}
                          </span>
                          {pedido?.productoCliente?.codigoProducto && (
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{pedido.productoCliente.codigoProducto}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-900 dark:text-white">
                            {pedido?.cantidadSolicitada?.toLocaleString() || 0} {pedido?.unidad || ''}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">Saldo: {saldo.toLocaleString()}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-black text-slate-400 uppercase w-10">Pedido:</span>
                            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                              {pedido?.fechaPedido ? format(new Date(pedido.fechaPedido), 'dd/MM/yyyy') : '-'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-black text-slate-400 uppercase w-10">Entrega:</span>
                            <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                              {pedido?.fechaEntrega ? format(new Date(pedido.fechaEntrega), 'dd/MM/yyyy') : '-'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <BadgeEstado estado={pedido?.estado || 'Pendiente'} />
                      </td>
                      <td className="px-6 py-4">
                        <BadgePrioridad prioridad={pedido?.prioridad || 'Media'} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {isAdmin && (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedPedidoId(pedido?.id);
                                  setIsEditModalOpen(true);
                                }}
                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all"
                                title="Editar"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(pedido?.id)}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all"
                                title="Eliminar"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => router.push(`/clientes/${pedido?.productoCliente?.clienteId}/productos`)}
                            className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg transition-all"
                            title="Ver productos"
                          >
                            <Package className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

            {pedidos?.length === 0 && (
              <div className="py-20 text-center">
                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                  <Package className="w-8 h-8" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">No se encontraron pedidos</h3>
                <p className="text-xs text-slate-500 mt-1">Intenta ajustar los filtros de búsqueda.</p>
              </div>
            )}
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
  );
}
