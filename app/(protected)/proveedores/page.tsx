'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Building2,
  Plus,
  Search,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
  MapPin,
  ShoppingCart,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { NuevoProveedorModal } from '@/components/modals/NuevoProveedorModal';

interface Proveedor {
  id: string;
  nombre: string;
  rif: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  contacto?: string;
  condicionesPago?: string;
  activo: boolean;
  _count: {
    ordenesCompra: number;
  };
}

export default function ProveedoresPage() {
  const { data: session } = useSession() || {};
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [filtroActivo, setFiltroActivo] = useState('');
  const [showNuevoModal, setShowNuevoModal] = useState(false);

  const isAdmin = (session?.user as { rol?: string })?.rol === 'admin';

  const fetchProveedores = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: page.toString(), limit: '10' });
      if (search) params.append('search', search);
      if (filtroActivo) params.append('activo', filtroActivo);

      const res = await fetch(`/api/proveedores?${params}`);
      if (res.ok) {
        const data = await res.json();
        setProveedores(data.proveedores);
        setTotalPages(data.totalPages);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProveedores();
  }, [page, filtroActivo]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchProveedores();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const toggleActivo = async (id: string, activo: boolean) => {
    try {
      const res = await fetch(`/api/proveedores/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: !activo }),
      });
      if (res.ok) fetchProveedores();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const eliminarProveedor = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar este proveedor?')) return;
    try {
      const res = await fetch(`/api/proveedores/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchProveedores();
      } else {
        const data = await res.json();
        alert(data.error || 'Error al eliminar');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (loading && proveedores.length === 0) {
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
              <Building2 className="h-7 w-7 sm:h-8 sm:w-8 text-purple-600" />
              Proveedores
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              Gestione sus proveedores de materia prima
            </p>
          </div>
          <button
            onClick={() => setShowNuevoModal(true)}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-700 text-white rounded-xl hover:from-purple-700 hover:to-indigo-800 transition-all font-bold shadow-lg shadow-purple-100 active:scale-95"
          >
            <Plus className="h-5 w-5" />
            Nuevo Proveedor
          </button>
        </div>

        <NuevoProveedorModal
          isOpen={showNuevoModal}
          onClose={() => setShowNuevoModal(false)}
          onSuccess={() => fetchProveedores()}
        />

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre o RIF..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            <select
              value={filtroActivo}
              onChange={(e) => {
                setFiltroActivo(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="">Todos</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </select>
          </div>
        </div>

        {/* Lista */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {proveedores.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Building2 className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg">No hay proveedores registrados</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {proveedores.map((proveedor, index) => (
                <motion.div
                  key={proveedor.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-4 sm:p-5 hover:bg-gray-50 transition-colors ${!proveedor.activo ? 'opacity-60' : ''
                    }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-gray-800">
                          {proveedor.nombre}
                        </h3>
                        {!proveedor.activo && (
                          <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs rounded-full">
                            Inactivo
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 font-mono">
                        RIF: {proveedor.rif}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-500">
                        {proveedor.telefono && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-4 w-4" />
                            {proveedor.telefono}
                          </span>
                        )}
                        {proveedor.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-4 w-4" />
                            {proveedor.email}
                          </span>
                        )}
                        {proveedor.direccion && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {proveedor.direccion.substring(0, 30)}...
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-purple-600">
                          <ShoppingCart className="h-4 w-4" />
                          {proveedor._count.ordenesCompra} órdenes
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleActivo(proveedor.id, proveedor.activo)}
                        className={`p-2 rounded-lg transition-colors ${proveedor.activo
                          ? 'text-green-600 hover:bg-green-50'
                          : 'text-gray-400 hover:bg-gray-100'
                          }`}
                        title={proveedor.activo ? 'Desactivar' : 'Activar'}
                      >
                        {proveedor.activo ? (
                          <ToggleRight className="h-6 w-6" />
                        ) : (
                          <ToggleLeft className="h-6 w-6" />
                        )}
                      </button>
                      <Link
                        href={`/proveedores/${proveedor.id}/editar`}
                        className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                      >
                        <Edit className="h-5 w-5" />
                      </Link>
                      {isAdmin && proveedor._count.ordenesCompra === 0 && (
                        <button
                          onClick={() => eliminarProveedor(proveedor.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
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
