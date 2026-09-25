'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText,
    ArrowLeft,
    Calendar,
    Search,
    CheckCircle,
    Clock,
    ChevronDown,
    ChevronUp,
    Package,
    Pencil,
    Trash2,
    AlertTriangle,
    Layers,
    Tag,
    Info
} from 'lucide-react';
import { EditarPedidoModal } from '@/components/modals/EditarPedidoModal';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { formatNumber } from '@/lib/utils';
import { format, isValid } from 'date-fns';
import { es } from 'date-fns/locale';

interface ProductoClienteInfo {
    id?: string;
    nombreProducto?: string;
    codigoProducto?: string;
    tipoProducto?: string;
    conImpresion?: boolean;
    conPigmento?: boolean;
    ancho?: number;
    largo?: number;
    calibre?: number;
    material?: string;
    color?: string;
    unidadVenta?: string;
}

interface Pedido {
    id: string;
    cliente: { 
        id?: string;
        nombre: string; 
        rif?: string; 
        telefono?: string;
    };
    productoCliente?: ProductoClienteInfo;
    cantidadSolicitada: number;
    unidad: string;
    fechaPedido: string;
    fechaEntrega: string;
    estado: string;
    prioridad: string;
    cantidadProducida: number;
    updatedAt: string;
    observaciones?: string;
}

export default function HistorialPedidosPage() {
    const [loading, setLoading] = useState(true);
    const [pedidos, setPedidos] = useState<Pedido[]>([]);
    const [busqueda, setBusqueda] = useState('');
    const [periodo, setPeriodo] = useState('todos');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
    
    // Modal de edición
    const [editarModalOpen, setEditarModalOpen] = useState(false);
    const [selectedPedidoId, setSelectedPedidoId] = useState<string>('');
    
    // Confirmación de eliminación
    const [pedidoAEliminar, setPedidoAEliminar] = useState<{ id: string; codigo: string; cliente: string } | null>(null);
    const [eliminando, setEliminando] = useState(false);
    const [stats, setStats] = useState({ totalCompletados: 0 });

    useEffect(() => {
        fetchHistorial();
    }, [periodo, busqueda, page]);

    const fetchHistorial = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                periodo,
                busqueda,
                page: page.toString(),
                limit: '10',
            });

            const res = await fetch(`/api/pedidos/historial?${params}`);
            if (!res.ok) {
                throw new Error('Error en la respuesta del servidor');
            }
            const data = await res.json();

            setPedidos(data.data || []);
            setStats(data.stats || { totalCompletados: 0 });
            setTotalPages(data.totalPages || 1);
        } catch (error) {
            console.error('Error al cargar historial de pedidos:', error);
            setPedidos([]);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmarEliminacion = async () => {
        if (!pedidoAEliminar) return;

        try {
            setEliminando(true);
            const res = await fetch(`/api/pedidos/${pedidoAEliminar.id}`, { 
                method: 'DELETE' 
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || 'Error al eliminar pedido');
            }

            setPedidoAEliminar(null);
            await fetchHistorial();
        } catch (error: any) {
            console.error('Error al eliminar:', error);
            alert(error.message || 'No se pudo eliminar el pedido.');
        } finally {
            setEliminando(false);
        }
    };

    const toggleExpand = (id: string) => {
        setExpandedCards(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return 'N/A';
        try {
            const date = new Date(dateStr);
            return isValid(date) ? format(date, "dd/MM/yyyy HH:mm", { locale: es }) : 'N/A';
        } catch {
            return 'N/A';
        }
    };

    const formatDateShort = (dateStr?: string) => {
        if (!dateStr) return 'N/A';
        try {
            const date = new Date(dateStr);
            return isValid(date) ? format(date, "dd/MM/yyyy", { locale: es }) : 'N/A';
        } catch {
            return 'N/A';
        }
    };

    return (
        <div className="space-y-6 p-4 sm:p-6 md:p-8 bg-slate-50/50 dark:bg-slate-950 min-h-screen transition-colors duration-300">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-800">
                <div className="flex items-center gap-4">
                    <Link 
                        href="/pedidos" 
                        className="rounded-2xl p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        title="Volver a Pedidos Activos"
                    >
                        <ArrowLeft className="h-5 w-5 text-slate-700 dark:text-slate-300" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
                            <div className="p-2 bg-blue-600 rounded-xl text-white">
                                <FileText className="h-6 w-6" />
                            </div>
                            Historial de Pedidos Completados
                        </h1>
                        <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                            Auditoría y trazabilidad de pedidos cerrados y producciones finalizadas
                        </p>
                    </div>
                </div>

                {/* Quick KPI Badge */}
                <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-950/40 px-5 py-3 rounded-2xl border border-emerald-200 dark:border-emerald-800/50">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold">
                        <CheckCircle className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Total Histórico</p>
                        <p className="text-lg font-black text-emerald-900 dark:text-emerald-100">{stats.totalCompletados} Pedidos</p>
                    </div>
                </div>
            </div>

            {/* Filtros */}
            <div className="grid gap-4 md:flex md:items-center md:justify-between bg-white dark:bg-slate-900 p-4 rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-800">
                <div className="flex flex-1 max-w-md relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar por cliente, producto o código (P-XXXXX)..."
                        value={busqueda}
                        onChange={(e) => {
                            setBusqueda(e.target.value);
                            setPage(1);
                        }}
                        className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200/60 dark:border-slate-700">
                        <button
                            onClick={() => { setPeriodo('semana'); setPage(1); }}
                            className={`px-4 py-1.5 text-xs font-black rounded-xl transition-all ${
                                periodo === 'semana' 
                                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm' 
                                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                            }`}
                        >
                            Esta Semana
                        </button>
                        <button
                            onClick={() => { setPeriodo('mes'); setPage(1); }}
                            className={`px-4 py-1.5 text-xs font-black rounded-xl transition-all ${
                                periodo === 'mes' 
                                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm' 
                                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                            }`}
                        >
                            Este Mes
                        </button>
                        <button
                            onClick={() => { setPeriodo('todos'); setPage(1); }}
                            className={`px-4 py-1.5 text-xs font-black rounded-xl transition-all ${
                                periodo === 'todos' 
                                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm' 
                                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                            }`}
                        >
                            Todo
                        </button>
                    </div>
                </div>
            </div>

            {/* Lista de Pedidos */}
            <div className="space-y-4">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800">
                        <LoadingSpinner />
                        <p className="text-xs font-bold text-slate-400 mt-4 uppercase tracking-widest">Cargando pedidos completados...</p>
                    </div>
                ) : pedidos.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800">
                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400">
                            <Package className="h-8 w-8" />
                        </div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white">No se encontraron pedidos</h3>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                            No hay pedidos completados que coincidan con el periodo o la búsqueda seleccionada.
                        </p>
                        {periodo !== 'todos' && (
                            <button
                                onClick={() => setPeriodo('todos')}
                                className="mt-4 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                            >
                                Ver Todo el Histórico
                            </button>
                        )}
                    </div>
                ) : (
                    pedidos.map((pedido, index) => {
                        const codigoPedido = `P-${pedido.id.slice(-5).toUpperCase()}`;
                        const nombreProducto = pedido.productoCliente?.nombreProducto || 'Producto General';
                        const tipoProducto = pedido.productoCliente?.tipoProducto || 'Bolsa';
                        const esImpreso = Boolean(pedido.productoCliente?.conImpresion);

                        return (
                            <motion.div
                                key={pedido.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.04 }}
                                className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-800 overflow-hidden hover:shadow-md transition-all"
                            >
                                {/* Card Body */}
                                <div className="p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                                    {/* Left: Code, Client & Product */}
                                    <div className="flex items-start gap-4 flex-1">
                                        <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-2xl text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5">
                                            <Package className="h-6 w-6" />
                                        </div>
                                        <div className="space-y-1.5 flex-1 min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="px-2.5 py-0.5 bg-blue-600 text-white font-mono font-black text-xs rounded-lg shadow-sm">
                                                    {codigoPedido}
                                                </span>
                                                <h3 className="font-black text-slate-900 dark:text-white text-base sm:text-lg truncate">
                                                    {pedido.cliente?.nombre || 'Cliente Desconocido'}
                                                </h3>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-2 text-xs">
                                                <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                                                    <Tag className="w-3.5 h-3.5 text-slate-400" />
                                                    {nombreProducto}
                                                </span>
                                                <span className="text-slate-300 dark:text-slate-600">•</span>
                                                <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-md text-[11px]">
                                                    {tipoProducto}
                                                </span>
                                                {esImpreso ? (
                                                    <span className="px-2 py-0.5 bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 font-extrabold rounded-md text-[10px]">
                                                        Impreso
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium rounded-md text-[10px]">
                                                        Neutro
                                                    </span>
                                                )}
                                                {pedido.cliente?.rif && (
                                                    <>
                                                        <span className="text-slate-300 dark:text-slate-600">•</span>
                                                        <span className="text-slate-400 text-[11px]">RIF: {pedido.cliente.rif}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Middle: Cantidad / Meta Producida */}
                                    <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl flex flex-col justify-center min-w-[210px] border border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Cantidad Producida</span>
                                            <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400">100% Meta</span>
                                        </div>
                                        <div className="flex items-baseline gap-1.5">
                                            <span className="text-lg font-black text-slate-900 dark:text-white">
                                                {formatNumber(pedido.cantidadProducida > 0 ? pedido.cantidadProducida : pedido.cantidadSolicitada)}
                                            </span>
                                            <span className="text-xs font-bold text-slate-400 uppercase">
                                                / {formatNumber(pedido.cantidadSolicitada)} {pedido.unidad}
                                            </span>
                                        </div>
                                        <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-2">
                                            <div className="bg-emerald-500 h-full rounded-full" style={{ width: '100%' }} />
                                        </div>
                                    </div>

                                    {/* Right: Badge Completado, Fecha & Acciones */}
                                    <div className="flex items-center justify-between lg:justify-end gap-3 flex-wrap sm:flex-nowrap">
                                        <div className="flex flex-col items-start lg:items-end">
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                                                Completado
                                            </span>
                                            <span className="text-[11px] font-medium text-slate-400 mt-1 flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                Finalizado: {formatDateShort(pedido.updatedAt)}
                                            </span>
                                        </div>

                                        {/* Action buttons */}
                                        <div className="flex items-center gap-1.5">
                                            <button
                                                onClick={() => {
                                                    setSelectedPedidoId(pedido.id);
                                                    setEditarModalOpen(true);
                                                }}
                                                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30 text-slate-600 dark:text-slate-300 transition-colors border border-slate-200/60 dark:border-slate-700"
                                                title="Editar Pedido"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </button>

                                            <button
                                                onClick={() => setPedidoAEliminar({
                                                    id: pedido.id,
                                                    codigo: codigoPedido,
                                                    cliente: pedido.cliente?.nombre || 'Cliente'
                                                })}
                                                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/30 text-slate-600 dark:text-slate-300 transition-colors border border-slate-200/60 dark:border-slate-700"
                                                title="Eliminar Pedido"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>

                                            <button
                                                onClick={() => toggleExpand(pedido.id)}
                                                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors border border-slate-200/60 dark:border-slate-700 ml-1"
                                                title={expandedCards.has(pedido.id) ? "Ocultar detalles" : "Ver detalles completos"}
                                            >
                                                {expandedCards.has(pedido.id) ? (
                                                    <ChevronUp className="h-4 w-4" />
                                                ) : (
                                                    <ChevronDown className="h-4 w-4" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Collapsible Details */}
                                <AnimatePresence>
                                    {expandedCards.has(pedido.id) && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 overflow-hidden"
                                        >
                                            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                                                {/* Fechas */}
                                                <div className="space-y-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                                                    <p className="font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                                        <Calendar className="w-3.5 h-3.5 text-blue-500" />
                                                        Registro de Fechas
                                                    </p>
                                                    <div className="space-y-2 text-slate-600 dark:text-slate-300">
                                                        <div className="flex justify-between">
                                                            <span className="text-slate-400">Creación:</span>
                                                            <span className="font-bold">{formatDateShort(pedido.fechaPedido)}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-slate-400">Compromiso:</span>
                                                            <span className="font-bold">{formatDateShort(pedido.fechaEntrega)}</span>
                                                        </div>
                                                        <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                                                            <span>Finalizado:</span>
                                                            <span>{formatDate(pedido.updatedAt)}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Especificaciones */}
                                                <div className="space-y-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                                                    <p className="font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                                        <Layers className="w-3.5 h-3.5 text-indigo-500" />
                                                        Ficha Técnica
                                                    </p>
                                                    <div className="space-y-2 text-slate-600 dark:text-slate-300">
                                                        <div className="flex justify-between">
                                                            <span className="text-slate-400">Material:</span>
                                                            <span className="font-bold">{pedido.productoCliente?.material || 'Polietileno estándar'}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-slate-400">Medidas:</span>
                                                            <span className="font-bold">
                                                                {pedido.productoCliente?.ancho && pedido.productoCliente?.largo 
                                                                    ? `${pedido.productoCliente.ancho} x ${pedido.productoCliente.largo} cm` 
                                                                    : 'Estándar'}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-slate-400">Calibre:</span>
                                                            <span className="font-bold">{pedido.productoCliente?.calibre ? `${pedido.productoCliente.calibre} micras` : 'N/A'}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Observaciones */}
                                                <div className="space-y-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                                                    <p className="font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                                        <Info className="w-3.5 h-3.5 text-amber-500" />
                                                        Observaciones
                                                    </p>
                                                    <p className="text-slate-500 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50">
                                                        {pedido.observaciones || "Sin observaciones registradas al momento del cierre."}
                                                    </p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between bg-white dark:bg-slate-900 px-6 py-4 rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-800">
                    <p className="text-xs font-bold text-slate-400">
                        Mostrando página <span className="text-slate-800 dark:text-slate-200">{page}</span> de <span className="text-slate-800 dark:text-slate-200">{totalPages}</span>
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-4 py-2 text-xs font-bold border border-slate-200 dark:border-slate-700 rounded-xl disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300"
                        >
                            Anterior
                        </button>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="px-4 py-2 text-xs font-bold bg-blue-600 text-white rounded-xl disabled:opacity-40 hover:bg-blue-700 transition-colors shadow-sm"
                        >
                            Siguiente
                        </button>
                    </div>
                </div>
            )}

            {/* Modal de Confirmación de Eliminación */}
            {pedidoAEliminar && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md p-6 overflow-hidden"
                    >
                        <div className="flex items-center gap-3.5 mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-900 dark:text-white">¿Eliminar Pedido?</h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{pedidoAEliminar.codigo}</p>
                            </div>
                        </div>

                        <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                            ¿Estás seguro de que deseas eliminar permanentemente el pedido <strong className="text-slate-900 dark:text-white">{pedidoAEliminar.codigo}</strong> de <strong className="text-slate-900 dark:text-white">{pedidoAEliminar.cliente}</strong>?
                            <br /><br />
                            <span className="text-xs text-rose-600 dark:text-rose-400 font-semibold">
                                Esta acción desvinculará sus registros y actualizará automáticamente las métricas del Dashboard restando este pedido.
                            </span>
                        </p>

                        <div className="flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setPedidoAEliminar(null)}
                                disabled={eliminando}
                                className="px-5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmarEliminacion}
                                disabled={eliminando}
                                className="px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md shadow-rose-600/20 transition-all flex items-center gap-2"
                            >
                                {eliminando ? (
                                    <>
                                        <LoadingSpinner />
                                        <span>Eliminando...</span>
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="w-4 h-4" />
                                        <span>Sí, Eliminar Pedido</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Modal de Edición */}
            {editarModalOpen && (
                <EditarPedidoModal
                    isOpen={editarModalOpen}
                    onClose={() => setEditarModalOpen(false)}
                    onSuccess={() => {
                        setEditarModalOpen(false);
                        fetchHistorial();
                    }}
                    pedidoId={selectedPedidoId}
                />
            )}
        </div>
    );
}
