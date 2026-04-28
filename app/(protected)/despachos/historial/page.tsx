'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    Filter,
    Calendar,
    Pencil,
    Trash2,
} from 'lucide-react';
import { ActionPasswordModal } from '@/components/modals/ActionPasswordModal';
import { EditarDespachoModal } from '@/components/modals/EditarDespachoModal';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

const ESTADOS = [
    { value: 'Pendiente', label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'EnTransito', label: 'En Tránsito', color: 'bg-blue-100 text-blue-800' },
    { value: 'Entregado', label: 'Entregado', color: 'bg-green-100 text-green-800' },
    { value: 'Cancelado', label: 'Cancelado', color: 'bg-red-100 text-red-800' },
];

interface Despacho {
    id: string;
    fecha: string;
    cantidadDespachada: number;
    unidad: string;
    vehiculo?: string;
    conductor?: string;
    destino?: string;
    guiaRemision?: string;
    estado: string;
    entregadoAt?: string;
    pedido: { id: string; cantidadSolicitada: number };
    cliente: { id: string; nombre: string };
}

export default function HistorialDespachosPage() {
    const [despachos, setDespachos] = useState<Despacho[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filters, setFilters] = useState({
        fechaInicio: '',
        fechaFin: '',
        tipoProducto: '',
    });
    const [actionModal, setActionModal] = useState({ isOpen: false, type: 'editar' as 'editar' | 'eliminar', id: '' });
    const [editarModalOpen, setEditarModalOpen] = useState(false);
    const [eliminando, setEliminando] = useState<string | null>(null);
    const [stats, setStats] = useState({
        totalBolsas: 0,
        totalBobinas: 0,
        totalGeneral: 0
    });

    useEffect(() => {
        fetchDespachos();
    }, [page, filters]);

    const fetchDespachos = async () => {
        try {
            const params = new URLSearchParams({ page: page.toString(), limit: '10', estado: 'Entregado' });
            if (filters.fechaInicio) params.append('fechaInicio', filters.fechaInicio);
            if (filters.fechaFin) params.append('fechaFin', filters.fechaFin);
            if (filters.tipoProducto) params.append('tipoProducto', filters.tipoProducto);

            const res = await fetch(`/api/despachos?${params}`);
            const data = await res.json();
            setDespachos(data.data || []);
            setTotalPages(data.totalPages || 1);
            setStats(data.stats || { totalBolsas: 0, totalBobinas: 0, totalGeneral: 0 });
        } catch (error) {
            console.error('Error:', error);
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
                const res = await fetch(`/api/despachos/${id}`, { method: 'DELETE' });
                if (!res.ok) throw new Error('Error al eliminar');
                fetchDespachos();
            } catch (error) {
                console.error(error);
                alert('No se pudo eliminar el despacho.');
            } finally {
                setEliminando(null);
            }
        }
    };

    const getEstadoInfo = (estado: string) =>
        ESTADOS.find((e) => e.value === estado) || ESTADOS[0];

    const formatDate = (dateStr: string) =>
        new Date(dateStr).toLocaleDateString('es-VE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });

    return (
        <>
            <div className="space-y-4 sm:space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Historial de Despacho</h1>
                        <p className="mt-1 text-sm text-gray-600 sm:text-base">Registro de despachos completados exitosamente ("Entregado")</p>
                    </div>
                    <div className="flex sm:w-auto w-full">
                        <Link
                            href="/despachos"
                            className="flex w-full items-center justify-center gap-2 rounded-lg bg-white border border-gray-200 px-4 py-2 text-gray-700 shadow-sm transition-all hover:bg-gray-50 active:scale-95 sm:w-auto font-medium"
                        >
                            <ArrowLeft className="h-5 w-5" />
                            Volver a Despachos
                        </Link>
                    </div>
                </div>

                {/* Categorías (Tabs) */}
                <div className="flex bg-white shadow-sm p-1 rounded-xl w-full border border-gray-100 mb-4 sm:w-fit overflow-x-auto">
                    {['Todos', 'Bolsa', 'Bobina'].map((tipo) => (
                        <button
                            key={tipo}
                            onClick={() => {
                                setFilters({ ...filters, tipoProducto: tipo === 'Todos' ? '' : tipo });
                                setPage(1);
                            }}
                            className={`px-5 py-2 text-sm font-medium rounded-lg transition-all ${(tipo === 'Todos' && !filters.tipoProducto) || filters.tipoProducto === tipo
                                ? 'bg-blue-50 text-blue-700 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            {tipo === 'Todos' ? 'Todos los Productos' : `${tipo}s`}
                        </button>
                    ))}
                </div>

                {/* Filtros */}
                <div className="rounded-xl bg-white p-4 shadow-sm">
                    <div className="mb-3 flex items-center gap-2">
                        <Filter className="h-5 w-5 text-gray-500" />
                        <span className="font-medium text-gray-700">Filtros</span>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <input
                                type="date"
                                value={filters.fechaInicio}
                                onChange={(e) => setFilters({ ...filters, fechaInicio: e.target.value })}
                                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-400">a</span>
                            <input
                                type="date"
                                value={filters.fechaFin}
                                onChange={(e) => setFilters({ ...filters, fechaFin: e.target.value })}
                                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Vista móvil - Tarjetas */}
                <div className="space-y-3 lg:hidden">
                    {despachos.length === 0 ? (
                        <div className="rounded-xl bg-white p-8 text-center text-gray-500 shadow-sm">
                            No hay despachos en el historial
                        </div>
                    ) : (
                        despachos.map((despacho) => {
                            const estadoInfo = getEstadoInfo(despacho.estado);
                            return (
                                <motion.div
                                    key={despacho.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                                >
                                    <div className="mb-3 flex items-start justify-between gap-2">
                                        <div>
                                            <h3 className="font-medium text-gray-900">{despacho.cliente.nombre}</h3>
                                            <p className="text-sm text-gray-600">{formatDate(despacho.fecha)}</p>
                                        </div>
                                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${estadoInfo.color}`}>
                                            {estadoInfo.label}
                                        </span>
                                    </div>
                                    <div className="mb-3 grid grid-cols-2 gap-2 text-sm">
                                        <div>
                                            <span className="text-gray-500">Cantidad:</span>
                                            <p className="font-medium">{despacho.cantidadDespachada} {despacho.unidad}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Vehículo:</span>
                                            <p className="font-medium">{despacho.vehiculo || '-'}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Conductor:</span>
                                            <p className="font-medium">{despacho.conductor || '-'}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Destino:</span>
                                            <p className="font-medium">{despacho.destino || '-'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-3">
                                        <button
                                            onClick={() => handleActionClick(despacho.id, 'editar')}
                                            className="rounded-lg bg-blue-50 p-2 text-blue-600 hover:bg-blue-100 transition-colors"
                                            title="Editar"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => handleActionClick(despacho.id, 'eliminar')}
                                            disabled={eliminando === despacho.id}
                                            className="rounded-lg bg-red-50 p-2 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                                            title="Eliminar"
                                        >
                                            {eliminando === despacho.id ? <LoadingSpinner /> : <Trash2 className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })
                    )}
                </div>

                {/* Vista desktop - Tabla */}
                <div className="hidden rounded-xl bg-white shadow-sm overflow-hidden lg:block">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Fecha de Salida</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Cliente</th>
                                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Cantidad</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Vehículo</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Conductor</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Destino</th>
                                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Estado</th>
                                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {despachos.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                                            No hay despachos en el historial
                                        </td>
                                    </tr>
                                ) : (
                                    despachos.map((despacho) => {
                                        const estadoInfo = getEstadoInfo(despacho.estado);
                                        return (
                                            <motion.tr
                                                key={despacho.id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="hover:bg-gray-50"
                                            >
                                                <td className="px-4 py-3 text-sm text-gray-900">{formatDate(despacho.fecha)}</td>
                                                <td className="px-4 py-3 text-sm font-medium text-gray-900">{despacho.cliente.nombre}</td>
                                                <td className="px-4 py-3 text-right text-sm text-gray-900">
                                                    {despacho.cantidadDespachada} {despacho.unidad}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{despacho.vehiculo || '-'}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{despacho.conductor || '-'}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{despacho.destino || '-'}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${estadoInfo.color}`}>
                                                        {estadoInfo.label}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => handleActionClick(despacho.id, 'editar')}
                                                            className="rounded-lg p-2 text-blue-600 hover:bg-blue-50 transition-colors group"
                                                            title="Editar"
                                                        >
                                                            <Pencil className="h-4 w-4 group-hover:scale-110 transition-transform" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleActionClick(despacho.id, 'eliminar')}
                                                            disabled={eliminando === despacho.id}
                                                            className="rounded-lg p-2 text-red-600 hover:bg-red-50 transition-colors group disabled:opacity-50"
                                                            title="Eliminar"
                                                        >
                                                            {eliminando === despacho.id ? <LoadingSpinner /> : <Trash2 className="h-4 w-4 group-hover:scale-110 transition-transform" />}
                                                        </button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Paginación */}
                {totalPages > 1 && (
                    <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
                        <p className="text-sm text-gray-600">Página {page} de {totalPages}</p>
                        <div className="flex w-full gap-2 sm:w-auto">
                            <button
                                onClick={() => setPage(Math.max(1, page - 1))}
                                disabled={page === 1}
                                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:opacity-50 sm:flex-initial"
                            >
                                Anterior
                            </button>
                            <button
                                onClick={() => setPage(Math.min(totalPages, page + 1))}
                                disabled={page === totalPages}
                                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:opacity-50 sm:flex-initial"
                            >
                                Siguiente
                            </button>
                        </div>
                    </div>
                )}

                {/* Sección de Totales */}
                <div className="mt-8 border-t border-gray-200 pt-6">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="rounded-xl bg-blue-50 p-6 shadow-sm border border-blue-100">
                            <p className="text-sm font-medium text-blue-600 uppercase tracking-wider mb-1">Total de Bolsas</p>
                            <p className="text-3xl font-bold text-blue-900">
                                {stats.totalBolsas.toLocaleString('es-VE')} <span className="text-lg font-semibold">unids</span>
                            </p>
                        </div>
                        <div className="rounded-xl bg-indigo-50 p-6 shadow-sm border border-indigo-100">
                            <p className="text-sm font-medium text-indigo-600 uppercase tracking-wider mb-1">Total de Bobinas</p>
                            <p className="text-3xl font-bold text-indigo-900">
                                {stats.totalBobinas.toLocaleString('es-VE')} <span className="text-lg font-semibold">Kg</span>
                            </p>
                        </div>
                    </div>
                </div>

                <ActionPasswordModal
                    isOpen={actionModal.isOpen}
                    onClose={() => setActionModal(prev => ({ ...prev, isOpen: false }))}
                    actionType={actionModal.type}
                    onSuccess={executeAction}
                />

                <EditarDespachoModal
                    isOpen={editarModalOpen}
                    onClose={() => setEditarModalOpen(false)}
                    onSuccess={() => {
                        setEditarModalOpen(false);
                        fetchDespachos();
                    }}
                    despachoId={actionModal.id}
                />
            </div>
        </>
    );
}
