'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Package, Plus, Search, AlertTriangle, Edit, Trash2, History, Filter } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { NuevoInventarioModal } from '@/components/modals/NuevoInventarioModal';

interface Inventario {
  id: string;
  nombre: string;
  codigo: string;
  categoria: string;
  cantidad: number;
  unidad: string;
  stockMinimo: number;
  stockMaximo: number | null;
  ubicacion: string | null;
  costo: number | null;
  proveedor: string | null;
}

const categoriaLabels: Record<string, string> = {
  MateriaPrima: 'Materia Prima',
  ProductoTerminado: 'Producto Terminado',
  Insumo: 'Insumo',
  Peletizado: 'Peletizado'
};

export default function InventarioPage() {
  const { data: session } = useSession() || {};
  const [inventarios, setInventarios] = useState<Inventario[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [categoria, setCategoria] = useState('');
  const [stockBajo, setStockBajo] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [nuevoItemModalOpen, setNuevoItemModalOpen] = useState(false);

  const isAdmin = (session?.user as { rol?: string })?.rol === 'admin';

  const fetchInventarios = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (busqueda) params.set('busqueda', busqueda);
      if (categoria) params.set('categoria', categoria);
      if (stockBajo) params.set('stockBajo', 'true');
      params.set('page', page.toString());

      const res = await fetch(`/api/inventario?${params}`);
      const data = await res.json();
      setInventarios(data.inventarios || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventarios();
  }, [busqueda, categoria, stockBajo, page]);

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este item del inventario?')) return;
    try {
      await fetch(`/api/inventario/${id}`, { method: 'DELETE' });
      fetchInventarios();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Inventario</h1>
            <p className="text-sm text-gray-600 sm:text-base">Gestión de materias primas, productos e insumos</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href="/inventario/materia-prima"
              className="flex items-center justify-center gap-2 rounded-lg bg-blue-50 border border-blue-200 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors"
            >
              <Package className="h-4 w-4" />
              Materia Prima
            </Link>
            <Link
              href="/inventario/movimientos"
              className="flex items-center justify-center gap-2 rounded-lg bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 transition-colors"
            >
              <History className="h-4 w-4" />
              Movimientos
            </Link>
            <button
              onClick={() => setNuevoItemModalOpen(true)}
              className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-all active:scale-95 shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Nuevo Item
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="rounded-lg bg-white p-4 shadow-md">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre o código..."
                value={busqueda}
                onChange={(e) => { setBusqueda(e.target.value); setPage(1); }}
                className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <select
              value={categoria}
              onChange={(e) => { setCategoria(e.target.value); setPage(1); }}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="">Todas las categorías</option>
              <option value="MateriaPrima">Materia Prima</option>
              <option value="ProductoTerminado">Producto Terminado</option>
              <option value="Insumo">Insumo</option>
              <option value="Peletizado">Peletizado</option>
            </select>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={stockBajo}
                onChange={(e) => { setStockBajo(e.target.checked); setPage(1); }}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Solo stock bajo</span>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </label>
          </div>
        </div>

        {/* Contenido */}
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : inventarios.length === 0 ? (
          <div className="rounded-lg bg-white p-8 text-center shadow-md">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 text-gray-600">No hay items en el inventario</p>
          </div>
        ) : (
          <>
            {/* Vista móvil */}
            <div className="space-y-3 lg:hidden">
              {inventarios.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="rounded-lg bg-white p-4 shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{item.nombre}</h3>
                      <p className="text-sm text-gray-500">{item.codigo}</p>
                    </div>
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${item.categoria === 'MateriaPrima' ? 'bg-blue-100 text-blue-800' :
                      item.categoria === 'ProductoTerminado' ? 'bg-green-100 text-green-800' :
                        item.categoria === 'Peletizado' ? 'bg-orange-100 text-orange-800' :
                          'bg-purple-100 text-purple-800'
                      }`}>
                      {categoriaLabels[item.categoria]}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Stock:</span>
                      <span className={`ml-1 font-medium ${item.cantidad <= item.stockMinimo ? 'text-red-600' : 'text-gray-900'
                        }`}>
                        {item.cantidad} {item.unidad}
                        {item.cantidad <= item.stockMinimo && (
                          <AlertTriangle className="ml-1 inline h-4 w-4 text-amber-500" />
                        )}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Mínimo:</span>
                      <span className="ml-1 font-medium text-gray-900">{item.stockMinimo}</span>
                    </div>
                    {item.ubicacion && (
                      <div>
                        <span className="text-gray-500">Ubicación:</span>
                        <span className="ml-1 text-gray-900">{item.ubicacion}</span>
                      </div>
                    )}
                    {item.costo && (
                      <div>
                        <span className="text-gray-500">Costo:</span>
                        <span className="ml-1 text-gray-900">${item.costo.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Link
                      href={`/inventario/${item.id}/editar`}
                      className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-100"
                    >
                      <Edit className="h-4 w-4" /> Editar
                    </Link>
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="flex items-center justify-center gap-1 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Vista desktop */}
            <div className="hidden lg:block">
              <div className="overflow-x-auto rounded-lg bg-white shadow-md">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Código</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Nombre</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Categoría</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Stock</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Mín/Máx</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Ubicación</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Costo</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {inventarios.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">{item.codigo}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{item.nombre}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2 py-1 text-xs font-medium ${item.categoria === 'MateriaPrima' ? 'bg-blue-100 text-blue-800' :
                            item.categoria === 'ProductoTerminado' ? 'bg-green-100 text-green-800' :
                              item.categoria === 'Peletizado' ? 'bg-orange-100 text-orange-800' :
                                'bg-purple-100 text-purple-800'
                            }`}>
                            {categoriaLabels[item.categoria]}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-sm font-medium ${item.cantidad <= item.stockMinimo ? 'text-red-600' : 'text-gray-900'
                            }`}>
                            {item.cantidad} {item.unidad}
                            {item.cantidad <= item.stockMinimo && (
                              <AlertTriangle className="ml-1 inline h-4 w-4 text-amber-500" />
                            )}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {item.stockMinimo} / {item.stockMaximo || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{item.ubicacion || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {item.costo ? `$${item.costo.toFixed(2)}` : '-'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <Link
                              href={`/inventario/${item.id}/editar`}
                              className="rounded p-1 text-blue-600 hover:bg-blue-50"
                            >
                              <Edit className="h-4 w-4" />
                            </Link>
                            {isAdmin && (
                              <button
                                onClick={() => handleDelete(item.id)}
                                className="rounded p-1 text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:opacity-50"
                >
                  Anterior
                </button>
                <span className="text-sm text-gray-600">
                  Página {page} de {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:opacity-50"
                >
                  Siguiente
                </button>
              </div>
            )}
          </>
        )}

        <NuevoInventarioModal
          isOpen={nuevoItemModalOpen}
          onClose={() => setNuevoItemModalOpen(false)}
          onSuccess={() => {
            setNuevoItemModalOpen(false);
            fetchInventarios();
          }}
        />
      </div>
    </>
  );
}
