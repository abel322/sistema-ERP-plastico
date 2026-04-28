'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { motion } from 'framer-motion';
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

const estadoConfig: Record<string, { color: string; label: string; icon: React.ElementType }> = {
  Borrador: { color: 'bg-gray-100 text-gray-700', label: 'Borrador', icon: ShoppingCart },
  Enviada: { color: 'bg-blue-100 text-blue-700', label: 'Enviada', icon: Send },
  Confirmada: { color: 'bg-yellow-100 text-yellow-700', label: 'Confirmada', icon: Check },
  Recibida: { color: 'bg-green-100 text-green-700', label: 'Recibida', icon: Package },
  Cancelada: { color: 'bg-red-100 text-red-700', label: 'Cancelada', icon: XCircle },
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
              <ShoppingCart className="h-7 w-7 sm:h-8 sm:w-8 text-orange-600" />
              Órdenes de Compra
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              Gestione las compras a proveedores
            </p>
          </div>
          <button
            onClick={() => setShowNuevaModal(true)}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-orange-600 to-amber-700 text-white rounded-xl hover:from-orange-700 hover:to-amber-800 transition-all font-bold shadow-lg shadow-orange-100 active:scale-95"
          >
            <Plus className="h-5 w-5" />
            Nueva Orden
          </button>
        </div>

        <NuevaCompraModal
          isOpen={showNuevaModal}
          onClose={() => setShowNuevaModal(false)}
          onSuccess={() => fetchOrdenes()}
        />

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor</label>
              <select
                value={filtroProveedor}
                onChange={(e) => {
                  setFiltroProveedor(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
              >
                <option value="">Todos los proveedores</option>
                {proveedores.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
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

        {/* Lista */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {ordenes.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg">No hay órdenes de compra</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {ordenes.map((orden, index) => {
                const config = estadoConfig[orden.estado] || estadoConfig.Borrador;
                const Icon = config.icon;
                return (
                  <motion.div
                    key={orden.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 sm:p-5 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-800">
                            {orden.numero}
                          </h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${config.color}`}>
                            <Icon className="h-3 w-3" />
                            {config.label}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Building2 className="h-4 w-4" />
                            {orden.proveedor.nombre}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(orden.fecha), "d MMM yyyy", { locale: es })}
                          </span>
                          <span className="flex items-center gap-1 font-semibold text-gray-700">
                            <DollarSign className="h-4 w-4" />
                            {orden.total.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                          </span>
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {orden.detalles.length} ítems
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {orden.estado === 'Borrador' && (
                          <button
                            onClick={() => cambiarEstado(orden.id, 'Enviada')}
                            className="px-3 py-1.5 bg-blue-100 text-blue-700 text-sm rounded-lg hover:bg-blue-200 transition-colors flex items-center gap-1"
                          >
                            <Send className="h-4 w-4" />
                            Enviar
                          </button>
                        )}
                        {orden.estado === 'Enviada' && (
                          <button
                            onClick={() => cambiarEstado(orden.id, 'Confirmada')}
                            className="px-3 py-1.5 bg-yellow-100 text-yellow-700 text-sm rounded-lg hover:bg-yellow-200 transition-colors flex items-center gap-1"
                          >
                            <Check className="h-4 w-4" />
                            Confirmar
                          </button>
                        )}
                        {orden.estado === 'Confirmada' && (
                          <button
                            onClick={() => cambiarEstado(orden.id, 'Recibida')}
                            className="px-3 py-1.5 bg-green-100 text-green-700 text-sm rounded-lg hover:bg-green-200 transition-colors flex items-center gap-1"
                          >
                            <Package className="h-4 w-4" />
                            Recibir
                          </button>
                        )}
                        <Link
                          href={`/compras/${orden.id}`}
                          className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                        >
                          <Eye className="h-5 w-5" />
                        </Link>
                        {isAdmin && ['Borrador', 'Cancelada'].includes(orden.estado) && (
                          <button
                            onClick={() => eliminarOrden(orden.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </button>
            <span className="text-sm text-gray-600">Página {page} de {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
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
