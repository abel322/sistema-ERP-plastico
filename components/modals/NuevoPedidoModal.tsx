'use client';

import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, X, Loader2, ClipboardList, Info } from 'lucide-react';
import { FormInput } from '@/components/forms/form-input';
import { FormSelect } from '@/components/forms/form-select';
import { FormTextarea } from '@/components/forms/form-textarea';

interface Cliente {
    id: string;
    nombre: string;
    rif: string;
}

interface ProductoCliente {
    id: string;
    nombreProducto: string;
    codigoProducto?: string;
    tipoProducto: string;
    conImpresion: boolean;
    ancho?: number;
    largo?: number;
    calibre?: number;
    anchoBobina?: number;
    diametroAnchoBolsa?: number;
    material?: string;
    unidadVenta: string;
    activo: boolean;
    // Campos adicionales del formulario completo
    esBolsaPego?: boolean;
    esBolsaFuelle?: boolean;
    esTermoencogible?: boolean;
    tipoSellado?: string;
    tipoBobinaCliente?: string;
    pesoPorUnidad?: number;
}

interface NuevoPedidoModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialClienteId?: string;
    initialProductoId?: string;
}

export function NuevoPedidoModal({ isOpen, onClose, onSuccess, initialClienteId, initialProductoId }: NuevoPedidoModalProps) {
    const [loading, setLoading] = useState(false);
    const [fetchingClientes, setFetchingClientes] = useState(false);
    const [fetchingProductos, setFetchingProductos] = useState(false);
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [productos, setProductos] = useState<ProductoCliente[]>([]);
    const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
    const [productoSeleccionado, setProductoSeleccionado] = useState<ProductoCliente | null>(null);

    const [formData, setFormData] = useState({
        clienteId: '',
        productoId: '',
        cantidadSolicitada: '',
        unidad: '',
        fechaPedido: new Date().toISOString().split('T')[0],
        fechaEntrega: '',
        estado: 'Pendiente',
        prioridad: 'Media',
        observaciones: '',
    });

    useEffect(() => {
        if (isOpen) {
            fetchClientes();
            // Reset form
            setFormData({
                clienteId: initialClienteId || '',
                productoId: initialProductoId || '',
                cantidadSolicitada: '',
                unidad: '',
                fechaPedido: new Date().toISOString().split('T')[0],
                fechaEntrega: '',
                estado: 'Pendiente',
                prioridad: 'Media',
                observaciones: '',
            });
            setClienteSeleccionado(null);
            setProductoSeleccionado(null);
            setProductos([]);
            
            // Si hay clienteId inicial, cargar productos
            if (initialClienteId) {
                fetchProductosCliente(initialClienteId);
            }
        }
    }, [isOpen, initialClienteId, initialProductoId]);

    const fetchClientes = async () => {
        try {
            setFetchingClientes(true);
            const res = await fetch('/api/clientes?limit=1000');
            const data = await res.json();
            setClientes(data?.clientes || []);
        } catch (error) {
            console.error('Error al cargar clientes:', error);
        } finally {
            setFetchingClientes(false);
        }
    };

    const fetchProductosCliente = async (clienteId: string) => {
        try {
            setFetchingProductos(true);
            const res = await fetch(`/api/clientes/${clienteId}/productos`);
            const data = await res.json();
            // Filtrar solo productos activos
            const productosActivos = (data || []).filter((p: ProductoCliente) => p.activo);
            setProductos(productosActivos);
        } catch (error) {
            console.error('Error al cargar productos:', error);
            setProductos([]);
        } finally {
            setFetchingProductos(false);
        }
    };

    const handleClienteChange = (clienteId: string) => {
        const cliente = clientes.find((c) => c?.id === clienteId);
        setClienteSeleccionado(cliente || null);
        setProductoSeleccionado(null);
        setProductos([]);

        setFormData({
            ...formData,
            clienteId,
            productoId: '',
            unidad: '',
        });

        // Cargar productos del cliente seleccionado
        if (clienteId) {
            fetchProductosCliente(clienteId);
        }
    };

    const handleProductoChange = (productoId: string) => {
        const producto = productos.find((p) => p?.id === productoId);
        setProductoSeleccionado(producto || null);

        setFormData({
            ...formData,
            productoId,
            unidad: producto?.unidadVenta || '',
        });
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {
                clienteId: formData.clienteId,
                productoId: formData.productoId,
                cantidadSolicitada: parseFloat(formData.cantidadSolicitada),
                unidad: formData.unidad,
                fechaPedido: new Date(formData.fechaPedido).toISOString(),
                fechaEntrega: new Date(formData.fechaEntrega).toISOString(),
                estado: formData.estado,
                prioridad: formData.prioridad,
                observaciones: formData.observaciones,
            };

            const res = await fetch('/api/pedidos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                onSuccess();
                onClose();
            } else {
                const error = await res.json();
                alert(error.error || 'Error al crear pedido');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error al crear pedido');
        } finally {
            setLoading(false);
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
                                <ClipboardList className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Nuevo Pedido</h2>
                                <p className="text-blue-100 text-sm">Registrar un nuevo pedido de producción</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/20 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Form Content */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {fetchingClientes ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-4">
                                <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                                <p className="text-gray-500 font-medium">Cargando clientes...</p>
                            </div>
                        ) : (
                            <form id="nuevoPedidoForm" onSubmit={handleSubmit} className="space-y-8">
                                {/* Sección de Cliente */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                                        <div className="w-1 h-5 bg-blue-600 rounded-full" />
                                        <h3 className="text-md font-bold text-gray-800 uppercase tracking-wider">Selección de Cliente</h3>
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

                                        {/* Selector de Producto */}
                                        {formData.clienteId && (
                                            <div>
                                                {fetchingProductos ? (
                                                    <div className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg bg-gray-50">
                                                        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                                                        <span className="text-sm text-gray-600">Cargando productos...</span>
                                                    </div>
                                                ) : productos.length > 0 ? (
                                                    <FormSelect
                                                        label="Producto"
                                                        required
                                                        value={formData.productoId}
                                                        onChange={(e) => handleProductoChange(e.target.value)}
                                                        options={productos.map((p) => ({
                                                            value: p?.id || '',
                                                            label: `${p?.nombreProducto || 'Sin nombre'}${p?.codigoProducto ? ` (${p.codigoProducto})` : ''}`,
                                                        }))}
                                                    />
                                                ) : (
                                                    <div className="p-3 border border-yellow-200 rounded-lg bg-yellow-50">
                                                        <p className="text-sm text-yellow-800">
                                                            Este cliente no tiene productos activos registrados.
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {productoSeleccionado && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 shadow-sm"
                                            >
                                                <div className="flex items-center gap-2 mb-3 text-blue-900">
                                                    <Info className="w-4 h-4" />
                                                    <h4 className="text-sm font-bold uppercase tracking-tight">Especificaciones del Producto</h4>
                                                </div>
                                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                                                    <div className="flex flex-col">
                                                        <span className="text-blue-600 text-[10px] font-bold uppercase">Tipo</span>
                                                        <span className="text-blue-900 font-semibold">{productoSeleccionado.tipoProducto}</span>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-blue-600 text-[10px] font-bold uppercase">Unidad</span>
                                                        <span className="text-blue-900 font-semibold">{productoSeleccionado.unidadVenta}</span>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-blue-600 text-[10px] font-bold uppercase">Impresión</span>
                                                        <span className="text-blue-900 font-semibold">{productoSeleccionado.conImpresion ? 'Sí' : 'No'}</span>
                                                    </div>
                                                    {productoSeleccionado.material && (
                                                        <div className="flex flex-col">
                                                            <span className="text-blue-600 text-[10px] font-bold uppercase">Material</span>
                                                            <span className="text-blue-900 font-semibold">{productoSeleccionado.material}</span>
                                                        </div>
                                                    )}
                                                    {productoSeleccionado.tipoProducto === 'Bolsa' && productoSeleccionado.ancho && productoSeleccionado.largo && (
                                                        <div className="flex flex-col">
                                                            <span className="text-blue-600 text-[10px] font-bold uppercase">Dimensiones</span>
                                                            <span className="text-blue-900 font-semibold">
                                                                {productoSeleccionado.ancho}×{productoSeleccionado.largo}×{productoSeleccionado.calibre} cm/µ
                                                            </span>
                                                        </div>
                                                    )}
                                                    {productoSeleccionado.tipoProducto === 'Bobina' && productoSeleccionado.anchoBobina && (
                                                        <div className="flex flex-col">
                                                            <span className="text-blue-600 text-[10px] font-bold uppercase">Ancho Bobina</span>
                                                            <span className="text-blue-900 font-semibold">
                                                                {productoSeleccionado.anchoBobina} cm
                                                            </span>
                                                        </div>
                                                    )}
                                                    {productoSeleccionado.pesoPorUnidad && (
                                                        <div className="flex flex-col">
                                                            <span className="text-blue-600 text-[10px] font-bold uppercase">Peso/Unidad</span>
                                                            <span className="text-blue-900 font-semibold">{productoSeleccionado.pesoPorUnidad}g</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </div>
                                </div>

                                {/* Detalles del Pedido */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                                        <div className="w-1 h-5 bg-blue-600 rounded-full" />
                                        <h3 className="text-md font-bold text-gray-800 uppercase tracking-wider">Detalles del Pedido</h3>
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
                                            placeholder="Ej. 5000"
                                        />
                                        {/* Unidad se asigna automáticamente por tipo de producto, campo oculto */}
                                        <input type="hidden" value={formData.unidad} readOnly />
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
                                            label="Estado"
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
                                            placeholder="Detalles adicionales sobre el pedido..."
                                        />
                                    </div>
                                </div>
                            </form>
                        )}
                    </div>

                    {/* Footer Action */}
                    <div className="p-5 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-xl transition-all disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            form="nuevoPedidoForm"
                            disabled={loading || fetchingClientes || fetchingProductos || !formData.clienteId || !formData.productoId}
                            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:grayscale"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Guardando Pedido...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    Guardar Pedido
                                </>
                            )}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
