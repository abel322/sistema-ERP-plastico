'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart,
  Plus,
  Eye,
  ChevronLeft,
  ChevronRight,
  Building2,
  Calendar,
  DollarSign,
  Trash2,
  Send,
  Check,
  Package,
  XCircle,
  Filter,
  Search,
  MoreVertical,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { NuevaCompraModal } from '@/components/modals/NuevaCompraModal';

interface OrdenCompra {
  id: string;
  numero: string;
  fecha: string;
  fechaEntrega?: string;
  subtotal: number;
  iva: number;
  total: number;
  estado: string;
  proveedor: {
    nombre: string;
    rif: string;
  };
  detalles: Array<{ id: string }>;
}

interface Proveedor {
  id: string;
  nombre: string;
}

const estadoConfig: Record<string, { color: string; bg: string; label: string; icon: React.ElementType }> = {
  Borrador: { color: 'text-slate-500', bg: 'bg-slate-100 dark:bg-slate-800', label: 'Borrador', icon: ShoppingCart },
  Enviada: { color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/30', label: 'Enviada', icon: Send },
  Confirmada: { color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/30', label: 'Confirmada', icon: Check },
  Recibida: { color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/30', label: 'Recibida', icon: Package },
  Cancelada: { color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-900/30', label: 'Cancelada', icon: XCircle },
};

export default function ComprasPage() {
  const { data: session } = useSession() || {};
  const [ordenes, setOrdenes] = useState<OrdenCompra[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filtroProveedor, setFiltroProveedor] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [showNuevaModal, setShowNuevaModal] = useState(false);

  const isAdmin = (session?.user as { rol?: string })?.rol === 'admin';

  const fetchOrdenes = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: page.toString(), limit: '10' });
      if (filtroProveedor) params.append('proveedorId', filtroProveedor);
      if (filtroEstado) params.append('estado', filtroEstado);

      const res = await fetch(`/api/compras?${params}`);
      if (res.ok) {
        const data = await res.json();
        setOrdenes(data.ordenes);
        setTotalPages(data.totalPages);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProveedores = async () => {
    try {
      const res = await fetch('/api/proveedores?limit=100&activo=true');
      if (res.ok) {
        const data = await res.json();
        setProveedores(data.proveedores);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  useEffect(() => {
    fetchProveedores();
  }, []);

  useEffect(() => {
    fetchOrdenes();
  }, [page, filtroProveedor, filtroEstado]);

  const cambiarEstado = async (id: string, nuevoEstado: string) => {
    try {
      const res = await fetch(`/api/compras/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      if (res.ok) fetchOrdenes();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const eliminarOrden = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar esta orden?')) return;
    try {
      const res = await fetch(`/api/compras/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchOrdenes();
      } else {
        const data = await res.json();
        alert(data.error || 'Error al eliminar');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (loading && ordenes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-slate-50 dark:bg-slate-950">
        <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Cargando órdenes de compra...</p>
      </div>
    );
  }

  return (
    <div className="p-8 bg-slate-50 dark:bg-slate-950 min-h-screen transition-colors duration-300">
      {/* Header Area */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-orange-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-200 dark:shadow-none">
              <ShoppingCart className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white leading-tight">Órdenes de Compra</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-widest rounded">Aprovisionamiento</span>
                <span className="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full" />
                <span className="text-slate-400 dark:text-slate-500 text-xs font-medium">{ordenes.length} órdenes registradas</span>
              </div>
            </div>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.02, boxShadow: '0 10px 15px -3px rgba(234, 88, 12, 0.3)' }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowNuevaModal(true)}
            className="flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-6 py-3 font-bold text-white shadow-lg transition-all hover:bg-orange-700 active:scale-95"
          >
            <Plus className="h-5 w-5" />
            NUEVA ORDEN
          </motion.button>
        </div>
      </div>

      <NuevaCompraModal
        isOpen={showNuevaModal}
        onClose={() => setShowNuevaModal(false)}
        onSuccess={() => fetchOrdenes()}
      />

      {/* Filtros */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 mb-8 transition-colors">
        <div className="flex flex-col lg:flex-row items-center gap-6">
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <Filter className="h-3 w-3 text-slate-500" />
            <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Filtros</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 w-full">
            <select
              value={filtroProveedor}
              onChange={(e) => {
                setFiltroProveedor(e.target.value);
                setPage(1);
              }}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
            >
              <option value="">Todos los proveedores</option>
              {proveedores.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
            <select
              value={filtroEstado}
              onChange={(e) => {
                setFiltroEstado(e.target.value);
                setPage(1);
              }}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
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

      {/* Lista de Órdenes */}
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
        {ordenes.length === 0 ? (
          <div className="p-20 text-center">
            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
              <ShoppingCart className="w-8 h-8" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest">No hay órdenes</h3>
            <p className="text-xs text-slate-500 mt-1">Aún no se han registrado compras.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50">
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Orden / Proveedor</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Fecha</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Total</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 text-center">Estado</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {ordenes.map((orden, index) => {
                  const config = estadoConfig[orden.estado] || estadoConfig.Borrador;
                  const Icon = config.icon;
                  return (
                    <motion.tr
                      key={orden.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group"
                    >
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{orden.numero}</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{orden.proveedor.nombre}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            {format(new Date(orden.fecha), "dd 'de' MMMM", { locale: es })}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">{format(new Date(orden.fecha), "yyyy")}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-sm font-black text-slate-900 dark:text-white">
                          ${orden.total.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border border-current/10 ${config.bg} ${config.color}`}>
                          <Icon className="h-3 w-3" />
                          {config.label}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex justify-end gap-2">
                          <Link href={`/compras/${orden.id}`}>
                            <button className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 rounded-xl transition-all border border-slate-100 dark:border-slate-700">
                              <Eye className="h-4 w-4" />
                            </button>
                          </Link>
                          {isAdmin && ['Borrador', 'Cancelada'].includes(orden.estado) && (
                            <button
                              onClick={() => eliminarOrden(orden.id)}
                              className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl transition-all border border-slate-100 dark:border-slate-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="mt-8 flex flex-col items-center gap-6 sm:flex-row sm:justify-between bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 transition-colors">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
            Página <span className="text-slate-900 dark:text-white">{page}</span> de <span className="text-slate-900 dark:text-white">{totalPages}</span>
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 transition-all"
            >
              Anterior
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 transition-all"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
