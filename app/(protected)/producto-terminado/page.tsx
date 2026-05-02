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
  Trash2,
  ShoppingCart,
  Plus
} from 'lucide-react';
import { ManualProductModal } from '@/components/modals/ManualProductModal';
import { NuevoDespachoModal } from '@/components/modals/nuevo-despacho-modal';
import { EditProductModal } from '@/components/modals/EditProductModal';
import { SobranteProductModal } from '@/components/modals/SobranteProductModal';
import { SobranteCard } from '@/components/cards/SobranteCard';

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

interface ProductoSobrante {
  id: string;
  tipo: string;
  cantidad: number;
  unidad: string;
  descripcion: string | null;
  fecha: string;
  ancho?: number | null;
  largo?: number | null;
  calibre?: number | null;
  fuelles?: number | null;
  anchoTroquel?: number | null;
  largoTroquel?: number | null;
  cliente?: { id: string, nombre: string } | null;
  producto?: { id: string, nombreProducto: string } | null;
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
  const [sobrantes, setSobrantes] = useState<ProductoSobrante[]>([]);
  const [showSobranteModal, setShowSobranteModal] = useState(false);
  const [selectedSobrante, setSelectedSobrante] = useState<ProductoSobrante | null>(null);
  const [seccionesAbiertas, setSeccionesAbiertas] = useState<Record<string, boolean>>({
    listos: true,
    bobinasCon: true,
    bobinasSin: true,
    bobinasRef: true,
    bolsasCon: true,
    bolsasSin: true,
    sobrante: true,
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
    fetchSobrantes();
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

  const fetchSobrantes = async () => {
    try {
      const res = await fetch('/api/producto-sobrante');
      const data = await res.json();
      setSobrantes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error al obtener sobrantes:', error);
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

  const handleEliminarSobrante = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este registro de sobrante?')) return;

    try {
      const res = await fetch(`/api/producto-sobrante/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchSobrantes();
      } else {
        const error = await res.json();
        alert(error.error || 'Error al eliminar');
      }
    } catch (error) {
      console.error('Error al eliminar sobrante:', error);
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
    <div className="p-8 bg-slate-50 dark:bg-slate-950 min-h-screen transition-colors duration-300">
      {/* Header Area */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200 dark:shadow-none">
              <Package className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white leading-tight">Producto Terminado</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-widest rounded">Inventario y Control</span>
                <span className="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full" />
                <span className="text-slate-400 dark:text-slate-500 text-xs font-medium">{productos.length} ítems en stock</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => router.push('/pedidos')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all font-bold text-xs uppercase tracking-widest border border-blue-100 dark:border-blue-900/50"
            >
              <ShoppingCart className="h-4 w-4" />
              PEDIDOS
            </button>
            <button
              onClick={() => router.push('/clientes')}
              className="flex items-center gap-2 px-4 py-2 bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-all font-bold text-xs uppercase tracking-widest border border-purple-100 dark:border-purple-900/50"
            >
              <Package className="h-4 w-4" />
              CLIENTES
            </button>
            <button
              onClick={() => setShowSobranteModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 text-white rounded-xl shadow-lg shadow-slate-200 dark:shadow-none hover:bg-slate-900 transition-all font-bold text-xs uppercase tracking-widest"
            >
              <Plus className="h-4 w-4" />
              PRODUCTO SOBRANTE
            </button>
            <button
              onClick={() => setShowManualModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-100 dark:shadow-none hover:bg-emerald-700 transition-all font-bold text-xs uppercase tracking-widest"
            >
              <Plus className="h-4 w-4" />
              REGISTRAR MANUAL
            </button>
            <button
              onClick={async () => {
                setIsRefreshing(true);
                await fetchProductos(true);
                setIsRefreshing(false);
              }}
              disabled={isRefreshing}
              className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
            >
              <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
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
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 mb-8">
        <div className="flex flex-col lg:flex-row items-center gap-6">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por cliente, descripción, pedido..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
            />
          </div>
          <div className="flex items-center gap-3 w-full lg:w-auto">
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 flex-1 lg:flex-none">
              <div className="px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-200 dark:border-slate-700">Estado</div>
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="bg-transparent px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 focus:outline-none cursor-pointer"
              >
                <option value="todos">Todos</option>
                <option value="ListoDespacho">Listo Despacho</option>
                <option value="PendienteArea">Pendiente Área</option>
                <option value="Despachado">Despachado</option>
              </select>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 flex-1 lg:flex-none">
              <div className="px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-200 dark:border-slate-700">Origen</div>
              <select
                value={filtroArea}
                onChange={(e) => setFiltroArea(e.target.value)}
                className="bg-transparent px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 focus:outline-none cursor-pointer"
              >
                <option value="todos">Todas</option>
                <option value="Extrusion">Extrusión</option>
                <option value="Sellado">Sellado</option>
                <option value="Serigrafia">Serigrafía</option>
                <option value="Refilado">Refilado</option>
              </select>
            </div>
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
            titulo: 'Bobinas con impresión',
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
          <div key={seccion.id} className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden mb-6 transition-colors">
            <button
              onClick={() => toggleSeccion(seccion.id)}
              className={`w-full px-8 py-5 flex items-center justify-between bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all border-b border-slate-100 dark:border-slate-800`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl ${seccion.bgIcon} shadow-lg shadow-${seccion.bgIcon.split('-')[1]}-200 dark:shadow-none`}>
                  {seccion.icono}
                </div>
                <div className="text-left">
                  <h2 className="text-lg font-black text-slate-900 dark:text-white leading-tight uppercase tracking-tight">{seccion.titulo}</h2>
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{seccion.lista.length} {seccion.lista.length === 1 ? 'producto' : 'productos'}</p>
                    {seccion.lista.length > 0 && (
                      <>
                        <span className="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full" />
                        <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                          Total: {seccion.lista.reduce((acc, p) => acc + p.cantidadDisponible, 0).toFixed(2)} {['bolsasCon', 'bolsasSin'].includes(seccion.id) ? 'Und' : (seccion.id === 'listos' ? (seccion.lista[0]?.tipoProducto === 'Bolsa' ? 'Und' : 'Kg') : 'Kg')}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl">
                {seccionesAbiertas[seccion.id] ? <ChevronUp className="h-5 w-5 text-slate-600 dark:text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-600 dark:text-slate-400" />}
              </div>
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
                    <div className="p-12 text-center">
                      <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                        <Package className="w-8 h-8" />
                      </div>
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No hay productos en esta categoría</p>
                    </div>
                  ) : (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 p-8 bg-slate-50/50 dark:bg-slate-950/20">
                      {seccion.lista.map((producto) => (
                        <ProductoTerminadoCard
                          key={producto.id}
                          producto={producto}
                          seccionId={seccion.id}
                          onEdit={() => handleEditar(producto)}
                          onDelete={() => handleEliminar(producto.id)}
                          onProcesar={() => handleProcesar(producto.id)}
                          onDespacho={() => handleEnviarDespacho(producto)}
                          eliminando={eliminando === producto.id}
                          procesando={procesando === producto.id}
                          userRol={userRol}
                        />
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}

        {/* Sección de Producto Sobrante */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden mb-6 transition-colors">
          <button
            onClick={() => toggleSeccion('sobrante')}
            className={`w-full px-8 py-5 flex items-center justify-between bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all border-b border-slate-100 dark:border-slate-800`}
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-slate-700 shadow-lg shadow-slate-200 dark:shadow-none">
                <Package className="h-5 w-5 text-white" />
              </div>
              <div className="text-left">
                <h2 className="text-lg font-black text-slate-900 dark:text-white leading-tight uppercase tracking-tight">Producto Sobrante</h2>
                <div className="flex flex-col gap-1 mt-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{sobrantes.length} {sobrantes.length === 1 ? 'registro' : 'registros'}</p>
                  {sobrantes.length > 0 && (
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/30 text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest rounded-full border border-emerald-100 dark:border-emerald-800/50">
                        {
                          sobrantes
                            .filter(s => [
                              'Bobina con impresión', 
                              'Bobina sin impresión', 
                              'Bobina refilada', 
                              'Bobinas de empaque',
                              'Bobina de ASA S/I 15Kg',
                              'Bobina de ASA S/I 10Kg'
                            ].includes(s.tipo) && s.unidad === 'Kilogramos')
                            .reduce((acc, s) => acc + s.cantidad, 0)
                            .toLocaleString(undefined, { minimumFractionDigits: 2 })
                        } Kg Total
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl">
              {seccionesAbiertas['sobrante'] ? <ChevronUp className="h-5 w-5 text-slate-600 dark:text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-600 dark:text-slate-400" />}
            </div>
          </button>

          <AnimatePresence>
            {seccionesAbiertas['sobrante'] && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                {sobrantes.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                      <Package className="w-8 h-8" />
                    </div>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No hay productos sobrantes registrados</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
                          <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Tipo / Producto</th>
                          <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Cliente</th>
                          <th className="px-8 py-5 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Medidas Básicas (cm)</th>
                          <th className="px-8 py-5 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Técnicos (Fuelle/Troq)</th>
                          <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Stock Actual</th>
                          <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                        {sobrantes.map((s) => (
                          <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all group">
                            <td className="px-8 py-5">
                              <div className="flex flex-col">
                                <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight leading-tight">{s.tipo}</span>
                                {s.producto && <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1 border-l-2 border-slate-200 dark:border-slate-700 pl-2">{s.producto.nombreProducto}</span>}
                              </div>
                            </td>
                            <td className="px-8 py-5">
                              {s.cliente ? (
                                <span className="px-2.5 py-1 bg-blue-50 dark:bg-blue-900/20 text-[10px] font-black text-blue-600 dark:text-blue-400 rounded-full uppercase tracking-widest border border-blue-100 dark:border-blue-800/50">
                                  {s.cliente.nombre}
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-300 dark:text-slate-600 font-black uppercase tracking-widest italic">General</span>
                              )}
                            </td>
                            <td className="px-8 py-5 text-center">
                              <div className="flex items-center justify-center gap-4">
                                <div className="flex flex-col items-center">
                                  <span className="text-xs font-black text-slate-900 dark:text-white leading-none mb-1">{s.ancho || '-'}</span>
                                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Ancho</span>
                                </div>
                                <div className="w-px h-4 bg-slate-200 dark:bg-slate-700" />
                                <div className="flex flex-col items-center">
                                  <span className="text-xs font-black text-slate-900 dark:text-white leading-none mb-1">{s.largo || '-'}</span>
                                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Largo</span>
                                </div>
                                <div className="w-px h-4 bg-slate-200 dark:bg-slate-700" />
                                <div className="flex flex-col items-center">
                                  <span className="text-xs font-black text-slate-900 dark:text-white leading-none mb-1">{s.calibre || '-'}</span>
                                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Cal</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-5">
                              {(s.fuelles || s.anchoTroquel || s.largoTroquel) ? (
                                <div className="flex items-center justify-center gap-2">
                                  <div className="px-2 py-1 bg-slate-50 dark:bg-slate-800 rounded-lg text-[9px] font-black text-slate-500 uppercase tracking-wider border border-slate-100 dark:border-slate-700">F: {s.fuelles || 0}</div>
                                  <div className="px-2 py-1 bg-slate-50 dark:bg-slate-800 rounded-lg text-[9px] font-black text-slate-500 uppercase tracking-wider border border-slate-100 dark:border-slate-700">T: {s.anchoTroquel || 0}x{s.largoTroquel || 0}</div>
                                </div>
                              ) : (
                                <div className="text-center">
                                  <span className="text-[10px] text-slate-200 dark:text-slate-800 font-black tracking-widest">—</span>
                                </div>
                              )}
                            </td>
                            <td className="px-8 py-5 text-right">
                              <div className="flex flex-col items-end">
                                <div className="flex items-baseline gap-1">
                                  <span className="text-lg font-black text-slate-900 dark:text-white leading-none group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                    {s.cantidad.toLocaleString(undefined, { minimumFractionDigits: 1 })}
                                  </span>
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.unidad === 'Kilogramos' ? 'Kg' : s.unidad}</span>
                                </div>
                                <div className="flex items-center gap-1.5 mt-1">
                                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                  <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">En Stock</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-5">
                              <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                <button
                                  onClick={() => { setSelectedSobrante(s); setShowSobranteModal(true); }}
                                  className="p-2.5 bg-white dark:bg-slate-800 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-all shadow-sm border border-slate-100 dark:border-slate-700"
                                  title="Editar"
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleEliminarSobrante(s.id)}
                                  className="p-2.5 bg-white dark:bg-slate-800 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-xl transition-all shadow-sm border border-slate-100 dark:border-slate-700"
                                  title="Eliminar"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
    </div>
      <ManualProductModal
        isOpen={showManualModal}
        onClose={() => setShowManualModal(false)}
        onSuccess={() => fetchProductos(true)}
      />

      <SobranteProductModal
        isOpen={showSobranteModal}
        onClose={() => {
          setShowSobranteModal(false);
          setSelectedSobrante(null);
        }}
        onSuccess={() => {
          fetchSobrantes();
        }}
        editData={selectedSobrante}
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
