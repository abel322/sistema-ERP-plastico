'use client';

import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, X, Loader2, ClipboardEdit, Info } from 'lucide-react';
import { FormInput } from '@/components/forms/form-input';
import { FormSelect } from '@/components/forms/form-select';
import { FormTextarea } from '@/components/forms/form-textarea';

interface Cliente {
    id: string;
    nombre: string;
    tipoProducto: string;
    ancho?: number;
    largo?: number;
    calibre?: number;
    unidadVenta: string;
}

interface EditarPedidoModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    pedidoId: string | null;
}

export function EditarPedidoModal({ isOpen, onClose, onSuccess, pedidoId }: EditarPedidoModalProps) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);

    const [formData, setFormData] = useState({
        clienteId: '',
        cantidadSolicitada: '',
        unidad: '',
        fechaPedido: '',
        fechaEntrega: '',
        estado: '',
        prioridad: '',
        observaciones: '',
    });

    useEffect(() => {
        if (isOpen && pedidoId) {
            fetchData();
        }
    }, [isOpen, pedidoId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            // Cargar clientes
            const resClientes = await fetch('/api/clientes?limit=1000');
            const dataClientes = await resClientes.json();
            setClientes(dataClientes?.clientes || []);

            // Cargar pedido
            const resPedido = await fetch(`/api/pedidos/${pedidoId}`);
            const dataPedido = await resPedido.json();

            if (dataPedido) {
                setFormData({
                    clienteId: dataPedido.clienteId || '',
                    cantidadSolicitada: dataPedido.cantidadSolicitada?.toString() || '',
                    unidad: dataPedido.unidad || '',
                    fechaPedido: dataPedido.fechaPedido
                        ? new Date(dataPedido.fechaPedido).toISOString().split('T')[0]
                        : '',
                    fechaEntrega: dataPedido.fechaEntrega
                        ? new Date(dataPedido.fechaEntrega).toISOString().split('T')[0]
                        : '',
                    estado: dataPedido.estado || '',
                    prioridad: dataPedido.prioridad || '',
                    observaciones: dataPedido.observaciones || '',
                });

                // Cargar información del cliente seleccionado
                const resCliente = await fetch(`/api/clientes/${dataPedido.clienteId}`);
                const dataCliente = await resCliente.json();
                setClienteSeleccionado(dataCliente);
            }
        } catch (error) {
            console.error('Error al cargar datos:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleClienteChange = async (clienteId: string) => {
        const cliente = clientes.find((c) => c?.id === clienteId);
        if (!cliente) {
            try {
                const res = await fetch(`/api/clientes/${clienteId}`);
                const fetchedCliente = await res.json();
                setClienteSeleccionado(fetchedCliente);
            } catch (e) {
                setClienteSeleccionado(null);
            }
        } else {
            setClienteSeleccionado(cliente);
        }
        setFormData({
            ...formData,
            clienteId,
            unidad: cliente?.unidadVenta || formData.unidad,
        });
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const payload = {
                clienteId: formData.clienteId,
                cantidadSolicitada: parseFloat(formData.cantidadSolicitada),
                unidad: formData.unidad,
                fechaPedido: new Date(formData.fechaPedido).toISOString(),
                fechaEntrega: new Date(formData.fechaEntrega).toISOString(),
                estado: formData.estado,
                prioridad: formData.prioridad,
                observaciones: formData.observaciones,
            };

            const res = await fetch(`/api/pedidos/${pedidoId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                onSuccess();
                onClose();
            } else {
                const error = await res.json();
                alert(error.error || 'Error al actualizar pedido');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error al actualizar pedido');
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-700 to-indigo-600 text-white">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-lg">
                                <ClipboardEdit className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Editar Pedido</h2>
                                <p className="text-blue-100 text-sm">Actualizar información del pedido existente</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/20 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Modal Content */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-4">
                                <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                                <p className="text-gray-500 font-medium">Cargando datos del pedido...</p>
                            </div>
                        ) : (
                            <form id="editarPedidoForm" onSubmit={handleSubmit} className="space-y-8">
                                {/* Selección de Cliente */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                                        <div className="w-1 h-5 bg-blue-600 rounded-full" />
                                        <h3 className="text-md font-bold text-gray-800 uppercase tracking-wider">Información del Cliente</h3>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4">
                                        <FormSelect
                                            label="Cliente"
                                            required
                                            value={formData.clienteId}
                                            onChange={(e) => handleClienteChange(e.target.value)}
                                            options={clientes.map((c) => ({
                                                value: c?.id || '',
                                                label: c?.nombre || 'Sin nombre',
                                            }))}
                                        />

                                        {clienteSeleccionado && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 shadow-sm"
                                            >
                                                <div className="flex items-center gap-2 mb-3 text-blue-900">
                                                    <Info className="w-4 h-4" />
                                                    <h4 className="text-sm font-bold uppercase tracking-tight">Información Técnica del Producto</h4>
                                                </div>
                                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                                                    <div className="flex flex-col">
                                                        <span className="text-blue-600 text-[10px] font-bold uppercase">Tipo</span>
                                                        <span className="text-blue-900 font-semibold">{clienteSeleccionado.tipoProducto || 'N/A'}</span>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-blue-600 text-[10px] font-bold uppercase">Unidad Venta</span>
                                                        <span className="text-blue-900 font-semibold">{clienteSeleccionado.unidadVenta || 'N/A'}</span>
                                                    </div>
                                                    {clienteSeleccionado?.ancho && (
                                                        <div className="flex flex-col">
                                                            <span className="text-blue-600 text-[10px] font-bold uppercase">Medidas (AxLxC)</span>
                                                            <span className="text-blue-900 font-semibold">
                                                                {clienteSeleccionado.ancho}x{clienteSeleccionado.largo}x{clienteSeleccionado.calibre}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </div>
                                </div>

                                {/* Detalles de la Orden */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                                        <div className="w-1 h-5 bg-blue-600 rounded-full" />
                                        <h3 className="text-md font-bold text-gray-800 uppercase tracking-wider">Detalles de la Orden</h3>
                                    </div>

                                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                                        <FormInput
                                            label="Cantidad Solicitada"
                                            type="number"
                                            required
                                            min="0"
                                            step="0.01"
                                            value={formData.cantidadSolicitada}
                                            onChange={(e) => setFormData({ ...formData, cantidadSolicitada: e.target.value })}
                                        />
                                        <FormSelect
                                            label="Unidad"
                                            required
                                            value={formData.unidad}
                                            onChange={(e) => setFormData({ ...formData, unidad: e.target.value })}
                                            options={[
                                                { value: 'Unidades', label: 'Unidades' },
                                                { value: 'Kilogramos', label: 'Kilogramos' },
                                                { value: 'Metros', label: 'Metros' },
                                            ]}
                                        />
                                        <FormInput
                                            label="Fecha del Pedido"
                                            type="date"
                                            required
                                            value={formData.fechaPedido}
                                            onChange={(e) => setFormData({ ...formData, fechaPedido: e.target.value })}
                                        />
                                        <FormInput
                                            label="Fecha Estimada de Entrega"
                                            type="date"
                                            required
                                            value={formData.fechaEntrega}
                                            onChange={(e) => setFormData({ ...formData, fechaEntrega: e.target.value })}
                                        />
                                        <FormSelect
                                            label="Estado Actual"
                                            required
                                            value={formData.estado}
                                            onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                                            options={[
                                                { value: 'Pendiente', label: 'Pendiente' },
                                                { value: 'EnProceso', label: 'En Proceso' },
                                                { value: 'Completado', label: 'Completado' },
                                            ]}
                                        />
                                        <FormSelect
                                            label="Prioridad"
                                            required
                                            value={formData.prioridad}
                                            onChange={(e) => setFormData({ ...formData, prioridad: e.target.value })}
                                            options={[
                                                { value: 'Baja', label: 'Baja' },
                                                { value: 'Media', label: 'Media' },
                                                { value: 'Alta', label: 'Alta' },
                                            ]}
                                        />
                                    </div>
                                    <div className="mt-2">
                                        <FormTextarea
                                            label="Observaciones"
                                            value={formData.observaciones}
                                            onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                                            placeholder="Agregue comentarios adicionales si es necesario..."
                                        />
                                    </div>
                                </div>
                            </form>
                        )}
                    </div>

                    {/* Footer Footer */}
                    <div className="p-5 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={saving}
                            className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-xl transition-all disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            form="editarPedidoForm"
                            disabled={saving || loading}
                            className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:grayscale"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Actualizando...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    Actualizar Pedido
                                </>
                            )}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
