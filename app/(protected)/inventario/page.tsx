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
    <div className="p-8 bg-slate-50 dark:bg-slate-950 min-h-screen transition-colors duration-300">
      {/* Header Area */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200 dark:shadow-none">
              <Package className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white leading-tight">Inventario</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-widest rounded">Suministros e Insumos</span>
                <span className="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full" />
                <span className="text-slate-400 dark:text-slate-500 text-xs font-medium">{inventarios.length} artículos registrados</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/inventario/materia-prima">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center justify-center gap-2 rounded-xl bg-blue-50 dark:bg-blue-950/30 px-5 py-2.5 font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all border border-blue-100 dark:border-blue-900/50"
              >
                <Package className="h-4 w-4" />
                MATERIA PRIMA
              </motion.button>
            </Link>
            <Link href="/inventario/movimientos">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center justify-center gap-2 rounded-xl bg-slate-100 dark:bg-slate-800 px-5 py-2.5 font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700"
              >
                <History className="h-4 w-4" />
                MOVIMIENTOS
              </motion.button>
            </Link>
            <motion.button
              whileHover={{ scale: 1.02, boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.3)' }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setNuevoItemModalOpen(true)}
              className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 font-bold text-white shadow-lg transition-all hover:bg-blue-700 active:scale-95"
            >
              <Plus className="h-4 w-4" />
              NUEVO ITEM
            </motion.button>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 mb-8 transition-colors">
        <div className="flex flex-col lg:flex-row items-center gap-6">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o código..."
              value={busqueda}
              onChange={(e) => { setBusqueda(e.target.value); setPage(1); }}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-sm font-semibold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 w-full sm:w-auto">
              <div className="px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-200 dark:border-slate-700">Categoría</div>
              <select
                value={categoria}
                onChange={(e) => { setCategoria(e.target.value); setPage(1); }}
                className="bg-transparent px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 focus:outline-none cursor-pointer flex-1"
              >
                <option value="">Todas</option>
                <option value="MateriaPrima">Materia Prima</option>
                <option value="ProductoTerminado">Producto Terminado</option>
                <option value="Insumo">Insumo</option>
                <option value="Peletizado">Peletizado</option>
              </select>
            </div>

            <label className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-all w-full sm:w-auto">
              <input
                type="checkbox"
                checked={stockBajo}
                onChange={(e) => { setStockBajo(e.target.checked); setPage(1); }}
                className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-red-600 focus:ring-red-500 bg-transparent"
              />
              <span className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">Stock Bajo</span>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </label>
          </div>
        </div>
      </div>

        {/* Contenido */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Cargando inventario...</p>
          </div>
        ) : inventarios.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-20 text-center border border-slate-200 dark:border-slate-800">
            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
              <Package className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Sin resultados</h3>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No hay items en el inventario para los filtros aplicados</p>
          </div>
        ) : (
          <>
            {/* Vista móvil */}
            <div className="space-y-4 lg:hidden">
              {inventarios.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 border border-slate-200 dark:border-slate-800 shadow-sm"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-black text-slate-900 dark:text-white leading-tight">{item.nombre}</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{item.codigo}</p>
                    </div>
                    <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-lg ${item.categoria === 'MateriaPrima' ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50' :
                      item.categoria === 'ProductoTerminado' ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50' :
                        item.categoria === 'Peletizado' ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50' :
                          'bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900/50'
                      }`}>
                      {categoriaLabels[item.categoria]}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Stock Actual</span>
                      <p className={`text-sm font-black ${item.cantidad <= item.stockMinimo ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
                        {item.cantidad} {item.unidad}
                        {item.cantidad <= item.stockMinimo && (
                          <AlertTriangle className="ml-1 inline h-3 w-3 text-amber-500" />
                        )}
                      </p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Stock Mínimo</span>
                      <p className="text-sm font-black text-slate-900 dark:text-white">{item.stockMinimo} {item.unidad}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 border-t border-slate-100 dark:border-slate-800 pt-4">
                    <Link
                      href={`/inventario/${item.id}/editar`}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-50 dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700"
                    >
                      <Edit className="h-3.5 w-3.5" /> EDITAR
                    </Link>
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-xl border border-slate-200 dark:border-slate-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Vista desktop */}
            <div className="hidden lg:block bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                      <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Artículo</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Categoría</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Stock Actual</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Mín / Máx</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Ubicación</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Costo</th>
                      <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {inventarios.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-black text-slate-900 dark:text-white leading-tight">{item.nombre}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.codigo}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-lg ${item.categoria === 'MateriaPrima' ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50' :
                            item.categoria === 'ProductoTerminado' ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50' :
                              item.categoria === 'Peletizado' ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50' :
                                'bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900/50'
                            }`}>
                            {categoriaLabels[item.categoria]}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-sm font-black ${item.cantidad <= item.stockMinimo ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
                            {item.cantidad.toLocaleString()} {item.unidad}
                            {item.cantidad <= item.stockMinimo && (
                              <AlertTriangle className="ml-2 inline h-4 w-4 text-amber-500" />
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">
                            <span>{item.stockMinimo}</span>
                            <span className="text-slate-300 dark:text-slate-700">/</span>
                            <span>{item.stockMaximo || '-'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-600 dark:text-slate-400">{item.ubicacion || '-'}</td>
                        <td className="px-6 py-4 text-sm font-black text-slate-900 dark:text-white">
                          {item.costo ? `$${item.costo.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '-'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link
                              href={`/inventario/${item.id}/editar`}
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-all"
                              title="Editar"
                            >
                              <Edit className="h-4 w-4" />
                            </Link>
                            {isAdmin && (
                              <button
                                onClick={() => handleDelete(item.id)}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-all"
                                title="Eliminar"
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
              <div className="mt-8 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-6">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Página {page} de {totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 transition-all"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 text-xs font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md shadow-blue-100 dark:shadow-none"
                  >
                    Siguiente
                  </button>
                </div>
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
  );
}
