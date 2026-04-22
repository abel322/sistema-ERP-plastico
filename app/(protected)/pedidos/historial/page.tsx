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
    Users,
    BarChart3,
    Filter,
    Pencil,
    Trash2
} from 'lucide-react';
import { ActionPasswordModal } from '@/components/modals/ActionPasswordModal';
import { EditarPedidoModal } from '@/components/modals/EditarPedidoModal';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Pedido {
    id: string;
    cliente: { nombre: string; tipoProducto: string };
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
    const [periodo, setPeriodo] = useState('mes');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
    const [actionModal, setActionModal] = useState({ isOpen: false, type: 'editar' as 'editar' | 'eliminar', id: '' });
    const [editarModalOpen, setEditarModalOpen] = useState(false);
    const [eliminando, setEliminando] = useState<string | null>(null);
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
            const data = await res.json();

            setPedidos(data.data || []);
            setStats(data.stats || { totalCompletados: 0 });
            setTotalPages(data.totalPages || 1);
        } catch (error) {
            console.error('Error al cargar historial de pedidos:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleActionClick = (id: string, type: 'editar' | 'eliminar') => {
        setActionModal({ isOpen: true, type, id });
    };

    const executeAction = async () => {
        const { type, id } = actionModal;
        if (type === 'editar') {
            setEditarModalOpen(true);
        } else if (type === 'eliminar') {
            setEliminando(id);
            try {
                const res = await fetch(`/api/pedidos/${id}`, { method: 'DELETE' });
                if (!res.ok) throw new Error('Error al eliminar');
                fetchHistorial();
            } catch (error) {
                console.error(error);
                alert('No se pudo eliminar el pedido.');
            } finally {
                setEliminando(null);
            }
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

    const formatDate = (dateStr: string) => {
        return format(new Date(dateStr), "dd/MM/yyyy HH:mm", { locale: es });
    };

    const formatDateShort = (dateStr: string) => {
        return format(new Date(dateStr), "dd/MM/yyyy", { locale: es });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/pedidos" className="rounded-lg p-2 hover:bg-gray-100 transition-colors">
                        <ArrowLeft className="h-5 w-5 text-gray-600" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <FileText className="h-7 w-7 text-blue-600" />
                            Historial de Pedidos Completados
                        </h1>
                        <p className="text-gray-600">Registro de pedidos finalizados y despachados</p>
                    </div>
                </div>
            </div>

            {/* Filtros */}
            <div className="grid gap-4 md:flex md:items-center md:justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex flex-1 max-w-md relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar por cliente..."
                        value={busqueda}
                        onChange={(e) => {
                            setBusqueda(e.target.value);
                            setPage(1);
                        }}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button
                            onClick={() => { setPeriodo('semana'); setPage(1); }}
                            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${periodo === 'semana' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Esta Semana
                        </button>
                        <button
                            onClick={() => { setPeriodo('mes'); setPage(1); }}
                            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${periodo === 'mes' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Este Mes
                        </button>
                        <button
                            onClick={() => { setPeriodo('todos'); setPage(1); }}
                            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${periodo === 'todos' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Todo
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Quick View */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-xl text-white shadow-md">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <CheckCircle className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs text-blue-100 font-medium">Total Histórico</p>
                            <p className="text-xl font-bold">{stats.totalCompletados} Pedidos</p>
                        </div>
                    </div>
                </div>
                {/* Espacio para más stats si se requiere en el futuro */}
            </div>

            {/* Lista de Pedidos */}
            <div className="space-y-4">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <LoadingSpinner />
                    </div>
                ) : pedidos.length === 0 ? (
                    <div className="bg-white rounded-xl p-12 text-center border-2 border-dashed border-gray-200">
                        <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-gray-900">No se encontraron pedidos</h3>
                        <p className="text-gray-500">No hay registros que coincidan con los filtros seleccionados.</p>
                    </div>
                ) : (
                    pedidos.map((pedido, index) => (
                        <motion.div
                            key={pedido.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
                        >
                            {/* Card Header */}
                            <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-start gap-3">
                                    <div className="mt-1 p-2 bg-blue-50 rounded-lg">
                                        <Package className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900">{pedido.cliente.nombre}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs font-medium px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                                                {pedido.cliente.tipoProducto}
                                            </span>
                                            <span className="text-xs text-gray-400">•</span>
                                            <span className="text-xs text-gray-500">ID: {pedido.id.slice(-6).toUpperCase()}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-gray-900">{pedido.cantidadSolicitada.toLocaleString()} {pedido.unidad}</p>
                                        <p className="text-xs text-gray-500">Completado: {formatDateShort(pedido.updatedAt)}</p>
                                    </div>
                                    <button
                                        onClick={() => toggleExpand(pedido.id)}
                                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        {expandedCards.has(pedido.id) ? (
                                            <ChevronUp className="h-5 w-5 text-gray-400" />
                                        ) : (
                                            <ChevronDown className="h-5 w-5 text-gray-400" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="px-4 pb-3 flex items-center justify-end gap-2 border-b border-gray-50">
                                <button
                                    onClick={() => handleActionClick(pedido.id, 'editar')}
                                    className="flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-100 transition-colors"
                                    title="Editar"
                                >
                                    <Pencil className="h-4 w-4" />
                                    Editar
                                </button>
                                <button
                                    onClick={() => handleActionClick(pedido.id, 'eliminar')}
                                    disabled={eliminando === pedido.id}
                                    className="flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                                    title="Eliminar"
                                >
                                    {eliminando === pedido.id ? <LoadingSpinner /> : <Trash2 className="h-4 w-4" />}
                                    Eliminar
                                </button>
                            </div>

                            {/* Collapsible Details */}
                            <AnimatePresence>
                                {expandedCards.has(pedido.id) && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="border-t border-gray-50 bg-gray-50/30 overflow-hidden"
                                    >
                                        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="space-y-3">
                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Fechas</p>
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <Calendar className="h-4 w-4 text-gray-400" />
                                                        <span className="text-gray-600">Pedido: {formatDateShort(pedido.fechaPedido)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <Calendar className="h-4 w-4 text-gray-400" />
                                                        <span className="text-gray-600">Entrega: {formatDateShort(pedido.fechaEntrega)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm font-medium text-emerald-600">
                                                        <CheckCircle className="h-4 w-4" />
                                                        <span>Completado: {formatDate(pedido.updatedAt)}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Producción</p>
                                                <div className="space-y-2">
                                                    <p className="text-sm text-gray-600">Solicitado: <span className="font-bold">{pedido.cantidadSolicitada} {pedido.unidad}</span></p>
                                                    <p className="text-sm text-gray-600">Producido: <span className="font-bold text-emerald-600">{pedido.cantidadProducida} {pedido.unidad}</span></p>
                                                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                                                        <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '100%' }}></div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Detalles Adicionales</p>
                                                <div className="bg-white p-3 rounded-lg border border-gray-100 text-sm italic text-gray-500">
                                                    {pedido.observaciones || "Sin observaciones adicionales."}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-sm text-gray-500">Mostrando página {page} de {totalPages}</p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-colors"
                        >
                            Anterior
                        </button>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg disabled:opacity-50 hover:bg-blue-700 transition-colors shadow-sm"
                        >
                            Siguiente
                        </button>
                    </div>
                </div>
            )}

            <ActionPasswordModal
                isOpen={actionModal.isOpen}
                onClose={() => setActionModal(prev => ({ ...prev, isOpen: false }))}
                actionType={actionModal.type}
                onSuccess={executeAction}
            />

            <EditarPedidoModal
                isOpen={editarModalOpen}
                onClose={() => setEditarModalOpen(false)}
                onSuccess={() => {
                    setEditarModalOpen(false);
                    fetchHistorial();
                }}
                pedidoId={actionModal.id}
            />
        </div>
    );
}
