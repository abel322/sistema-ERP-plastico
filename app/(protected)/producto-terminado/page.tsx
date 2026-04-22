'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import {
  Package,
  Truck,
  Factory,
  ArrowRight,
  ArrowDown,
  CheckCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  RefreshCw,
  Play,
  Send,
  Pencil,
  Trash2
} from 'lucide-react';
import { ManualProductModal } from '@/components/modals/ManualProductModal';
import { NuevoDespachoModal } from '@/components/modals/nuevo-despacho-modal';
import { EditProductModal } from '@/components/modals/EditProductModal';

interface ProductoTerminado {
  id: string;
  produccionId: string;
  pedidoId: string | null;
  clienteId: string;
  areaOrigen: string;
  descripcion: string | null;
  cantidadTotal: number;
  cantidadDisponible: number;
  unidad: string;
  tipoProducto: string;
  conImpresion: boolean;
  estado: string;
  siguienteArea: string;
  fechaFinalizacion: string;
  fechaDespacho: string | null;
  createdAt: string;
  updatedAt: string;
  cliente: {
    id: string;
    nombre: string;
    rif: string;
    tipoProducto: string;
    conImpresion: boolean;
  };
  produccion: {
    id: string;
    fecha: string;
    turno: string;
    operario: string;
    maquina: {
      id: string;
      nombre: string;
    };
  };
}

interface Resumen {
  listosDespacho: number;
  pendientesArea: number;
  pendientesPorArea: Record<string, number>;
}

const areaColors: Record<string, string> = {
  'Extrusion': 'bg-blue-100 text-blue-800 border-blue-200',
  'Sellado': 'bg-green-100 text-green-800 border-green-200',
  'Serigrafia': 'bg-purple-100 text-purple-800 border-purple-200',
  'Refilado': 'bg-orange-100 text-orange-800 border-orange-200',
};

const areaNombres: Record<string, string> = {
  'Extrusion': 'Extrusión',
  'Sellado': 'Sellado',
  'Serigrafia': 'Serigrafía',
  'Refilado': 'Refilado',
  'Ninguna': 'Ninguna',
};

export default function ProductoTerminadoPage() {
  const { data: session } = useSession() || {};
  const router = useRouter();
  const [productos, setProductos] = useState<ProductoTerminado[]>([]);
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [eliminando, setEliminando] = useState<string | null>(null);
  const [procesando, setProcesando] = useState<string | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [filtroArea, setFiltroArea] = useState<string>('todos');
  const [busqueda, setBusqueda] = useState('');
  const [seccionesAbiertas, setSeccionesAbiertas] = useState<Record<string, boolean>>({
    listos: true,
    bobinasCon: true,
    bobinasSin: true,
    bobinasRef: true,
    bolsasCon: true,
    bolsasSin: true,
  });
  const [showManualModal, setShowManualModal] = useState(false);
  const [despachoModalOpen, setDespachoModalOpen] = useState(false);
  const [selectedProductoId, setSelectedProductoId] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedEditProducto, setSelectedEditProducto] = useState<ProductoTerminado | null>(null);

  const toggleSeccion = (sec: string) => {
    setSeccionesAbiertas(prev => ({ ...prev, [sec]: !prev[sec] }));
  };

  const userRol = (session?.user as { rol?: string })?.rol;

  useEffect(() => {
    fetchProductos();
  }, []);

  const fetchProductos = async (isBackgroundRefresh = false) => {
    try {
      if (!isBackgroundRefresh) {
        setLoading(true);
      }
      const res = await fetch('/api/producto-terminado?limit=100', { cache: 'no-store' });
      const data = await res.json();
      setProductos(data.productos || []);
      setResumen(data.resumen || null);
    } catch (error) {
      console.error('Error al obtener productos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProcesar = async (productoId: string) => {
    if (!confirm('¿Marcar este producto como procesado en la siguiente área?')) return;

    try {
      setProcesando(productoId);
      const res = await fetch(`/api/producto-terminado/${productoId}/procesar`, {
        method: 'POST'
      });

      if (res.ok) {
        fetchProductos(true);
      } else {
        const error = await res.json();
        alert(error.error || 'Error al procesar');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setProcesando(null);
    }
  };
  const handleEnviarDespacho = (producto: ProductoTerminado) => {
    setSelectedProductoId(producto.id);
    setDespachoModalOpen(true);
  };

  const handleEditar = (producto: ProductoTerminado) => {
    setSelectedEditProducto(producto);
    setEditModalOpen(true);
  };

  const handleEliminar = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer.')) return;

    try {
      setEliminando(id);
      const res = await fetch(`/api/producto-terminado/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchProductos(true);
      } else {
        const error = await res.json();
        alert(error.error || 'Error al eliminar');
      }
    } catch (error) {
      console.error('Error al eliminar:', error);
      alert('Error inesperado al intentar eliminar');
    } finally {
      setEliminando(null);
    }
  };

  // Filtrar productos
  const productosFiltrados = productos.filter(p => {
    if (filtroEstado !== 'todos' && p.estado !== filtroEstado) return false;
    if (filtroArea !== 'todos' && p.areaOrigen !== filtroArea) return false;
    if (busqueda) {
      const search = busqueda.toLowerCase();
      return (
        p.cliente.nombre.toLowerCase().includes(search) ||
        p.descripcion?.toLowerCase().includes(search) ||
        p.tipoProducto.toLowerCase().includes(search) ||
        (p.pedidoId && p.pedidoId.toLowerCase().includes(search))
      );
    }
    return true;
  });

  const listosDespacho = productosFiltrados.filter(p => p.estado === 'ListoDespacho');
  const productosPendientes = productosFiltrados.filter(p => p.estado === 'PendienteArea');

  const bobinasConImpresion = productosPendientes.filter(p =>
    (p.areaOrigen === 'Serigrafia' && p.conImpresion) ||
    (p.areaOrigen !== 'Extrusion' && p.areaOrigen !== 'Serigrafia' && p.tipoProducto === 'Bobina' && p.conImpresion && p.areaOrigen !== 'Refilado')
  );

  const bobinasSinImpresion = productosPendientes.filter(p =>
    p.areaOrigen === 'Extrusion' || (p.tipoProducto === 'Bobina' && !p.conImpresion && p.areaOrigen !== 'Refilado')
  );

  const bobinasRefiladas = productosPendientes.filter(p => p.tipoProducto === 'Bobina' && p.areaOrigen === 'Refilado');

  const bolsasConImpresion = productosPendientes.filter(p =>
    p.areaOrigen !== 'Extrusion' && p.areaOrigen !== 'Serigrafia' && p.tipoProducto === 'Bolsa' && p.conImpresion
  );

  const bolsasSinImpresion = productosPendientes.filter(p =>
    p.areaOrigen !== 'Extrusion' && p.tipoProducto === 'Bolsa' && !p.conImpresion
  );

  if (loading) {
    return (
      <>
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner />
        </div>
      </>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Package className="h-8 w-8 text-emerald-600" />
              Producto Terminado
            </h1>
            <p className="text-gray-500 mt-1">Gestión de productos listos y pendientes de proceso</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowManualModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-700 hover:to-green-600 text-white rounded-xl shadow-sm hover:shadow-md transition-all font-medium"
            >
              <Package className="h-4 w-4" />
              Registrar un Producto
            </button>
            <button
              onClick={async () => {
                setIsRefreshing(true);
                await fetchProductos(true);
                setIsRefreshing(false);
              }}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors font-medium text-gray-700 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
              {isRefreshing ? 'Actualizando...' : 'Actualizar'}
            </button>
          </div>
        </div>

        {/* Resumen */}
        {resumen && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl p-4 text-white shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm">Listos para Despacho</p>
                  <p className="text-3xl font-bold">{resumen.listosDespacho}</p>
                </div>
                <Truck className="h-10 w-10 text-emerald-200" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-4 text-white shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-100 text-sm">Pendientes Área</p>
                  <p className="text-3xl font-bold">{resumen.pendientesArea}</p>
                </div>
                <Factory className="h-10 w-10 text-amber-200" />
              </div>
            </motion.div>

            {Object.entries(resumen.pendientesPorArea).map(([area, count], idx) => (
              <motion.div
                key={area}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + idx * 0.1 }}
                className="bg-white rounded-xl p-4 shadow border border-gray-100"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">→ {areaNombres[area]}</p>
                    <p className="text-2xl font-bold text-gray-900">{count}</p>
                  </div>
                  <div className={`p-2 rounded-lg ${areaColors[area] || 'bg-gray-100'}`}>
                    <ArrowRight className="h-5 w-5" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por cliente, descripción..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
              >
                <option value="todos">Todos los estados</option>
                <option value="ListoDespacho">Listo Despacho</option>
                <option value="PendienteArea">Pendiente Área</option>
                <option value="Despachado">Despachado</option>
              </select>
              <select
                value={filtroArea}
                onChange={(e) => setFiltroArea(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
              >
                <option value="todos">Todas las áreas</option>
                <option value="Extrusion">Extrusión</option>
                <option value="Sellado">Sellado</option>
                <option value="Serigrafia">Serigrafía</option>
                <option value="Refilado">Refilado</option>
              </select>
            </div>
          </div>
        </div>

        {/* Renderizador de Secciones Dinámicas */}
        {[
          {
            titulo: 'Listos para Despacho',
            lista: listosDespacho,
            id: 'listos',
            icono: <Truck className="h-5 w-5 text-white" />,
            bgIcon: 'bg-emerald-500',
            bgHeader: 'from-emerald-50 to-green-50 hover:from-emerald-100'
          },
          {
            titulo: 'Bobinas con impresión (Serigrafía)',
            lista: bobinasConImpresion,
            id: 'bobinasCon',
            icono: <Factory className="h-5 w-5 text-white" />,
            bgIcon: 'bg-purple-500',
            bgHeader: 'from-purple-50 to-pink-50 hover:from-purple-100'
          },
          {
            titulo: 'Bobinas sin impresión',
            lista: bobinasSinImpresion,
            id: 'bobinasSin',
            icono: <Factory className="h-5 w-5 text-white" />,
            bgIcon: 'bg-amber-500',
            bgHeader: 'from-amber-50 to-orange-50 hover:from-amber-100'
          },
          {
            titulo: 'Bobinas Refiladas',
            lista: bobinasRefiladas,
            id: 'bobinasRef',
            icono: <Factory className="h-5 w-5 text-white" />,
            bgIcon: 'bg-rose-500',
            bgHeader: 'from-rose-50 to-red-50 hover:from-rose-100'
          },
          {
            titulo: 'Bolsas con impresión',
            lista: bolsasConImpresion,
            id: 'bolsasCon',
            icono: <Package className="h-5 w-5 text-white" />,
            bgIcon: 'bg-indigo-500',
            bgHeader: 'from-indigo-50 to-violet-50 hover:from-indigo-100'
          },
          {
            titulo: 'Bolsas sin impresión',
            lista: bolsasSinImpresion,
            id: 'bolsasSin',
            icono: <Package className="h-5 w-5 text-white" />,
            bgIcon: 'bg-blue-500',
            bgHeader: 'from-blue-50 to-cyan-50 hover:from-blue-100'
          }
        ].map((seccion) => (
          <div key={seccion.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-4">
            <button
              onClick={() => toggleSeccion(seccion.id)}
              className={`w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r ${seccion.bgHeader} transition-colors`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${seccion.bgIcon}`}>
                  {seccion.icono}
                </div>
                <div className="text-left">
                  <h2 className="text-lg font-semibold text-gray-900">{seccion.titulo}</h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-sm text-gray-500">{seccion.lista.length} {seccion.lista.length === 1 ? 'producto registrado' : 'productos registrados'}</p>
                    {seccion.lista.length > 0 && (
                      <span className="text-sm uppercase font-bold text-gray-600 ml-1">
                        - Total: {seccion.lista.reduce((acc, p) => acc + p.cantidadDisponible, 0).toFixed(2)} {['bolsasCon', 'bolsasSin'].includes(seccion.id) ? 'Und' : (seccion.id === 'listos' ? (seccion.lista[0]?.tipoProducto === 'Bolsa' ? 'Und' : 'Kg') : 'Kg')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {seccionesAbiertas[seccion.id] ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>

            <AnimatePresence>
              {seccionesAbiertas[seccion.id] && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  {seccion.lista.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <p>No hay productos en esta categoría</p>
                    </div>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 p-4">
                      {seccion.lista.map((producto) => (
                        <motion.div
                          key={producto.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className={`flex flex-col justify-between p-4 rounded-xl border-2 ${areaColors[producto.areaOrigen] || 'border-gray-200 bg-gray-50'}`}
                        >
                          <div>
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex flex-col mb-1.5">
                                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md self-start uppercase tracking-wider border border-blue-100">
                                    Pedido {producto.pedidoId?.slice(-5).toUpperCase() || 'N/A'}
                                  </span>
                                  <h4 className="font-semibold text-gray-900 line-clamp-1 mt-1" title={producto.cliente.nombre}>
                                    {producto.cliente.nombre}
                                  </h4>
                                </div>
                                <p className="text-sm font-bold text-gray-800 mt-1">
                                  {producto.cantidadDisponible.toFixed(1)} {['bolsasCon', 'bolsasSin'].includes(seccion.id) ? 'Und' : (seccion.id === 'listos' ? (producto.tipoProducto === 'Bolsa' ? 'Und' : 'Kg') : 'Kg')}
                                </p>
                                <div className="flex flex-wrap gap-1 mt-2 text-xs text-gray-500">
                                  {['bobinasRef', 'bolsasCon', 'bolsasSin'].includes(seccion.id) || (seccion.id === 'bobinasSin' && producto.tipoProducto === 'Bobina' && !producto.conImpresion) ? (
                                    <div className="flex flex-col items-start gap-1">
                                      <span className={`px-2 py-0.5 rounded ${areaColors[producto.areaOrigen]}`}>
                                        De: {areaNombres[producto.areaOrigen]}
                                      </span>
                                      <ArrowDown className="h-3 w-3 text-emerald-500 ml-3" />
                                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 font-bold border border-emerald-200">
                                        Para: Despachar
                                      </span>
                                    </div>
                                  ) : (
                                    <>
                                      <span className={`px-2 py-0.5 rounded ${areaColors[producto.areaOrigen]}`}>
                                        De: {areaNombres[producto.areaOrigen]}
                                      </span>
                                      {producto.siguienteArea !== 'Ninguna' && (
                                        <>
                                          <ArrowRight className="h-3 w-3 inline-block mx-1 mt-1" />
                                          <span className="px-2 py-0.5 rounded bg-gray-200 text-gray-700">
                                            Para: {areaNombres[producto.siguienteArea]}
                                          </span>
                                        </>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 ml-2">
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => handleEditar(producto)}
                                  className="p-2 bg-gradient-to-br from-blue-50 to-indigo-100 text-blue-600 hover:from-blue-100 hover:to-indigo-200 rounded-lg shadow-sm border border-blue-200/50 transition-all"
                                  title="Actualizar"
                                >
                                  <Pencil className="h-4 w-4" />
                                </motion.button>
                                {userRol === 'admin' && (
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleEliminar(producto.id)}
                                    disabled={eliminando === producto.id}
                                    className="p-2 bg-gradient-to-br from-red-50 to-rose-100 text-red-600 hover:from-red-100 hover:to-rose-200 rounded-lg shadow-sm border border-red-200/50 transition-all disabled:opacity-50"
                                    title="Eliminar"
                                  >
                                    {eliminando === producto.id ? <LoadingSpinner /> : <Trash2 className="h-4 w-4" />}
                                  </motion.button>
                                )}
                                {producto.estado === 'ListoDespacho' && (
                                  <div className="p-2 bg-emerald-100 rounded-full ml-1" title="Listo para Despacho">
                                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 pt-3 border-t border-gray-100/50">
                            {producto.estado === 'PendienteArea' ? (
                              <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleProcesar(producto.id)}
                                disabled={procesando === producto.id}
                                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:opacity-50 transition-colors"
                              >
                                {procesando === producto.id ? (
                                  <LoadingSpinner />
                                ) : (
                                  <>
                                    <Play className="h-4 w-4 text-emerald-600" /> Marcar como Procesado
                                  </>
                                )}
                              </motion.button>
                            ) : producto.estado === 'ListoDespacho' ? (
                              <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleEnviarDespacho(producto)}
                                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                              >
                                <Send className="h-4 w-4" /> Enviar a Despacho
                              </motion.button>
                            ) : null}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      <ManualProductModal
        isOpen={showManualModal}
        onClose={() => setShowManualModal(false)}
        onSuccess={() => fetchProductos(true)}
      />

      <EditProductModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedEditProducto(null);
        }}
        onSuccess={() => {
          setEditModalOpen(false);
          setSelectedEditProducto(null);
          fetchProductos(true);
        }}
        producto={selectedEditProducto}
      />

      <NuevoDespachoModal
        isOpen={despachoModalOpen}
        onClose={() => {
          setDespachoModalOpen(false);
          setSelectedProductoId(null);
        }}
        onSuccess={() => {
          setDespachoModalOpen(false);
          setSelectedProductoId(null);
          fetchProductos(true);
        }}
        preselectedId={selectedProductoId || undefined}
      />
    </>
  );
}
