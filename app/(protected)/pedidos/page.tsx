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
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Pedidos</h1>
            <p className="mt-1 text-gray-600">Gestión de pedidos de producción</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/pedidos/historial">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 rounded-xl bg-gray-100 px-5 py-2.5 font-bold text-gray-700 hover:bg-gray-200 transition-all focus:outline-none focus:ring-2 focus:ring-gray-300 shadow-sm"
              >
                <History className="h-5 w-5" />
                Historial
              </motion.button>
            </Link>
            {isAdmin && (
              <motion.button
                whileHover={{ scale: 1.02, boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.3)' }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 font-bold text-white shadow-lg transition-all hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <PackagePlus className="h-5 w-5" />
                Nuevo Pedido
              </motion.button>
            )}
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

        <div className="rounded-xl bg-white p-6 shadow-md">
          {/* Busqueda y Filtros */}
          <div className="mb-6 space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar por cliente..."
                    value={busqueda}
                    onChange={(e) => {
                      setBusqueda(e.target.value);
                      setPage(1);
                    }}
                    className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="10">10 por página</option>
                <option value="25">25 por página</option>
                <option value="50">50 por página</option>
              </select>
            </div>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Filtros:</span>
              </div>
              <select
                value={estado}
                onChange={(e) => {
                  setEstado(e.target.value);
                  setPage(1);
                }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="Todos">Todos los estados</option>
                <option value="Pendiente">Pendiente</option>
                <option value="EnProceso">En Proceso</option>
                <option value="Completado">Completado</option>
              </select>
              <select
                value={prioridad}
                onChange={(e) => {
                  setPrioridad(e.target.value);
                  setPage(1);
                }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="Todas">Todas las prioridades</option>
                <option value="Baja">Baja</option>
                <option value="Media">Media</option>
                <option value="Alta">Alta</option>
              </select>
            </div>
          </div>

          {/* Tabla */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-600">
                    Cliente
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-600">
                    Producto
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-600">
                    Cantidad
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-600">
                    Fecha Pedido
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-600">
                    Fecha Entrega
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-600">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-600">
                    Prioridad
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-600">
                    Saldo
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-600">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {pedidos?.map((pedido) => {
                  const saldo =
                    (pedido?.cantidadSolicitada || 0) - (pedido?.cantidadProducida || 0);
                  return (
                    <tr key={pedido?.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        <button
                          onClick={() => router.push(`/clientes/${pedido?.cliente?.id}`)}
                          className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                        >
                          {pedido?.cliente?.nombre || 'N/A'}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        <button
                          onClick={() => router.push(`/clientes/${pedido?.productoCliente?.clienteId}/productos`)}
                          className="text-purple-600 hover:text-purple-800 hover:underline transition-colors"
                        >
                          {pedido?.productoCliente?.nombreProducto || '-'}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {pedido?.cantidadSolicitada || 0} {pedido?.unidad || ''}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {pedido?.fechaPedido
                          ? format(new Date(pedido.fechaPedido), 'dd/MM/yyyy')
                          : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {pedido?.fechaEntrega
                          ? format(new Date(pedido.fechaEntrega), 'dd/MM/yyyy')
                          : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <BadgeEstado estado={pedido?.estado || 'Pendiente'} />
                      </td>
                      <td className="px-4 py-3">
                        <BadgePrioridad prioridad={pedido?.prioridad || 'Media'} />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {saldo} {pedido?.unidad || ''}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          {isAdmin && (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedPedidoId(pedido?.id);
                                  setIsEditModalOpen(true);
                                }}
                                className="rounded-lg bg-blue-100 p-2 text-blue-600 transition-colors hover:bg-blue-200"
                                title="Editar"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(pedido?.id)}
                                className="rounded-lg bg-red-100 p-2 text-red-600 transition-colors hover:bg-red-200"
                                title="Eliminar"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => router.push(`/clientes/${pedido?.productoCliente?.clienteId}/productos`)}
                            className="rounded-lg bg-purple-100 p-2 text-purple-600 transition-colors hover:bg-purple-200"
                            title="Ver productos del cliente"
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

            {pedidos?.length === 0 && (
              <div className="py-12 text-center text-gray-500">
                No se encontraron pedidos
              </div>
            )}
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
              >
                Anterior
              </button>
              <span className="text-sm text-gray-600">
                Página {page} de {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
