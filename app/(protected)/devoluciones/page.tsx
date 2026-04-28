'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import {
    Package,
    ArrowRight,
    ChevronDown,
    ChevronUp,
    Search,
    RefreshCw,
    AlertTriangle,
    RotateCcw,
    PlusCircle,
    Calendar,
    Hash,
    TrendingUp,
    Users,
    Pencil,
    Trash2
} from 'lucide-react';
import { NuevaDevolucionModal } from '@/components/modals/NuevaDevolucionModal';
import { EditDevolucionModal } from '@/components/modals/EditDevolucionModal';

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
        nombre: string;
    };
}

const areaNombres: Record<string, string> = {
    Extrusion: 'Extrusión',
    Sellado: 'Sellado',
    Serigrafia: 'Serigrafía',
    Refilado: 'Refilado',
    Ninguna: 'Despacho'
};

const areaColors: Record<string, string> = {
    Extrusion: 'bg-orange-100 text-orange-700',
    Sellado: 'bg-emerald-100 text-emerald-700',
    Serigrafia: 'bg-purple-100 text-purple-700',
    Refilado: 'bg-blue-100 text-blue-700',
    Ninguna: 'bg-gray-100 text-gray-700'
};

export default function DevolucionesPage() {
    const { data: session } = useSession() || {};
    const [productos, setProductos] = useState<ProductoTerminado[]>([]);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showNuevaDevolucionModal, setShowNuevaDevolucionModal] = useState(false);
    const [busqueda, setBusqueda] = useState('');
    const [submitting, setSubmitting] = useState<string | null>(null);
    const [eliminando, setEliminando] = useState<string | null>(null);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [selectedEditProducto, setSelectedEditProducto] = useState<ProductoTerminado | null>(null);

    const fetchProductos = async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            const res = await fetch('/api/producto-terminado?estado=Defectuoso');
            const data = await res.json();

            if (data.productos && Array.isArray(data.productos)) {
                setProductos(data.productos);
            } else if (Array.isArray(data)) {
                setProductos(data.filter((p: any) => p.estado === 'Defectuoso'));
            }
        } catch (error) {
            console.error('Error al cargar productos defectuosos:', error);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        fetchProductos();
    }, []);

    const handleRestaurar = async (productoId: string) => {
        if (!confirm('¿Restaurar este producto y enviarlo a su Área de Origen (Pendiente)?')) return;

        try {
            setSubmitting(productoId);
            // Podemos reaprovechar la API actualizando el estado de nuevo a PendienteArea o ListoDespacho
            const res = await fetch(`/api/producto-terminado/${productoId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado: 'PendienteArea' })
            });

            if (res.ok) {
                fetchProductos(true);
            } else {
                const error = await res.json();
                alert(error.error || 'Error al restaurar');
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setSubmitting(null);
        }
    };

    const handleEditar = (producto: ProductoTerminado) => {
        // EditProductModal espera el tipo completo, hacemos un cast
        setSelectedEditProducto(producto as any);
        setEditModalOpen(true);
    };

    const handleEliminar = async (id: string) => {
        if (!confirm('¿Estás seguro de que deseas eliminar este registro? Esta acción no se puede deshacer.')) return;

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

    const productosFiltrados = productos.filter(p => {
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

    const totalDevoluciones = productosFiltrados.length;
    const totalCantidad = productosFiltrados.reduce((acc, p) => acc + p.cantidadDisponible, 0);

    const clientesCount = productosFiltrados.reduce((acc, p) => {
        acc[p.cliente.nombre] = (acc[p.cliente.nombre] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    const clienteMasFrecuente = Object.entries(clientesCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    const areasCount = productosFiltrados.reduce((acc, p) => {
        const nombreArea = areaNombres[p.areaOrigen] || p.areaOrigen;
        acc[nombreArea] = (acc[nombreArea] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    const areaMasProblematica = Object.entries(areasCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
                        <AlertTriangle className="h-8 w-8 text-red-600" />
                        Devoluciones y Defectuosos
                    </h1>
                    <p className="text-gray-500 mt-1">Gestión de productos fuera del ciclo estándar marcados como defectuosos</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowNuevaDevolucionModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600 text-white rounded-xl shadow-sm hover:shadow-md transition-all font-medium"
                    >
                        <PlusCircle className="h-4 w-4" />
                        Registrar Devolución
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
                        <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-red-600' : ''}`} />
                        {isRefreshing ? 'Actualizando...' : 'Actualizar'}
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-2">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar por cliente, descripción..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        />
                    </div>
                </div>
            </div>

            {/* Tarjetas Estadísticas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div className="bg-white rounded-xl shadow-sm border border-red-100 p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-red-100 rounded-lg text-red-600"><AlertTriangle className="h-5 w-5" /></div>
                        <h3 className="text-gray-500 text-sm font-medium">Total Devoluciones</h3>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{totalDevoluciones}</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-orange-100 p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-orange-100 rounded-lg text-orange-600"><Hash className="h-5 w-5" /></div>
                        <h3 className="text-gray-500 text-sm font-medium">Cantidad Total</h3>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{totalCantidad.toFixed(2)}</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><Users className="h-5 w-5" /></div>
                        <h3 className="text-gray-500 text-sm font-medium whitespace-nowrap">Cliente c/ Más Devoluciones</h3>
                    </div>
                    <p className="text-lg font-bold text-gray-900 truncate" title={clienteMasFrecuente}>{clienteMasFrecuente}</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-purple-100 p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-purple-100 rounded-lg text-purple-600"><TrendingUp className="h-5 w-5" /></div>
                        <h3 className="text-gray-500 text-sm font-medium whitespace-nowrap">Área Más Problemática</h3>
                    </div>
                    <p className="text-lg font-bold text-gray-900 truncate" title={areaMasProblematica}>{areaMasProblematica}</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {productosFiltrados.length === 0 ? (
                    <div className="text-center py-10">
                        <AlertTriangle className="mx-auto h-12 w-12 text-gray-300" />
                        <h3 className="mt-2 text-sm font-semibold text-gray-900">No hay productos</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            No se encontraron devoluciones o registros defectuosos.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 font-medium min-w-[120px]">Fecha</th>
                                    <th className="px-6 py-4 font-medium">Cliente</th>
                                    <th className="px-6 py-4 font-medium">Producto</th>
                                    <th className="px-6 py-4 font-medium">Cantidad</th>
                                    <th className="px-6 py-4 font-medium">Área Origen</th>
                                    <th className="px-6 py-4 font-medium">Descripción</th>
                                    <th className="px-6 py-4 font-medium text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {productosFiltrados.map((producto, idx) => (
                                    <motion.tr
                                        key={producto.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.02 }}
                                        className="hover:bg-gray-50/80 transition-colors"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-gray-400" />
                                                {new Date(producto.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-gray-900 max-w-[200px] truncate" title={producto.cliente.nombre}>
                                            {producto.cliente.nombre}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <Package className="h-4 w-4 text-gray-400" />
                                                {producto.tipoProducto} {producto.conImpresion && <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">Impreso</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-baseline gap-1">
                                                <span className="font-bold text-gray-900">{producto.cantidadDisponible.toFixed(2)}</span>
                                                <span className="text-xs font-medium text-gray-500">{producto.unidad}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 rounded text-xs font-medium border border-transparent ${areaColors[producto.areaOrigen] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                                                {areaNombres[producto.areaOrigen] || producto.areaOrigen}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 max-w-[250px] truncate" title={producto.descripcion || ''}>
                                            {producto.descripcion || <span className="text-gray-400 italic">Sin descripción</span>}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <motion.button
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => handleEditar(producto)}
                                                    className="p-2 bg-gradient-to-br from-blue-50 to-indigo-100 text-blue-600 hover:from-blue-100 hover:to-indigo-200 rounded-lg shadow-sm border border-blue-200/50 transition-all"
                                                    title="Actualizar"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </motion.button>
                                                {session?.user && (session.user as any).rol === 'admin' ? (
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
                                                ) : null}
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <NuevaDevolucionModal
                isOpen={showNuevaDevolucionModal}
                onClose={() => setShowNuevaDevolucionModal(false)}
                onSuccess={() => fetchProductos(true)}
            />

            <EditDevolucionModal
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
        </div>
    );
}
