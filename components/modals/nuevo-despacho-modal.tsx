import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Truck, Package, CheckCircle, UploadCloud } from 'lucide-react';
import { FormInput } from '@/components/forms/form-input';
import { FormTextarea } from '@/components/forms/form-textarea';

interface ProductoTerminado {
    id: string;
    cantidadTotal: number;
    cantidadDisponible: number;
    unidad: string;
    tipoProducto: string;
    areaOrigen: string;
    descripcion: string | null;
    estado: string;
    cliente: {
        id: string;
        nombre: string;
        direccion?: string;
    };
}

const areaNombres: Record<string, string> = {
    'Extrusion': 'Extrusión',
    'Sellado': 'Sellado',
    'Serigrafia': 'Serigrafía',
    'Refilado': 'Refilado',
};

interface NuevoDespachoModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    preselectedId?: string;
}

export function NuevoDespachoModal({ isOpen, onClose, onSuccess, preselectedId }: NuevoDespachoModalProps) {
    const [loading, setLoading] = useState(false);
    const [loadingProductos, setLoadingProductos] = useState(true);
    const [error, setError] = useState('');
    const [productos, setProductos] = useState<ProductoTerminado[]>([]);
    const [selectedProducto, setSelectedProducto] = useState<ProductoTerminado | null>(null);

    const [formData, setFormData] = useState({
        productoTerminadoId: '',
        cantidadDespachada: '',
        unidad: 'Unidades',
        precioMillar: '', // Para bolsas (precio por 1000 unidades)
        precioKg: '', // Para bobinas (precio por kg)
        vehiculo: '',
        conductor: '',
        destino: '',
        guiaRemision: '',
        observaciones: '',
        fecha: new Date().toISOString().split('T')[0],
    });

    useEffect(() => {
        if (isOpen) {
            fetchProductosTerminados();
            // Reset form on open
            setFormData(prev => ({
                ...prev,
                cantidadDespachada: '',
                precioMillar: '',
                precioKg: '',
                vehiculo: '',
                conductor: '',
                destino: '',
                guiaRemision: '',
                observaciones: '',
                fecha: new Date().toISOString().split('T')[0],
            }));
            setError('');
        }
    }, [isOpen]);

    useEffect(() => {
        if (preselectedId && productos.length > 0) {
            handleProductoChange(preselectedId);
        }
    }, [preselectedId, productos]);

    const fetchProductosTerminados = async () => {
        try {
            setLoadingProductos(true);
            const res = await fetch('/api/producto-terminado?estado=ListoDespacho&limit=500');
            if (res.ok) {
                const data = await res.json();
                setProductos(data.productos || []);
            }
        } catch (error) {
            console.error('Error fetching productos:', error);
        } finally {
            setLoadingProductos(false);
        }
    };

    const handleProductoChange = (productoId: string) => {
        const producto = productos.find((p) => p.id === productoId);
        setSelectedProducto(producto || null);
        if (producto) {
            setFormData({
                ...formData,
                productoTerminadoId: productoId,
                unidad: producto.unidad,
                destino: producto.cliente.direccion || '',
                cantidadDespachada: producto.cantidadDisponible.toString(),
                precioMillar: '', // Reset precio al cambiar producto
                precioKg: '', // Reset precio al cambiar producto
            });
        }
    };

    // Calcular valor total según el tipo de producto
    const calcularValorTotal = (): number => {
        const cantidad = parseFloat(formData.cantidadDespachada || '0');
        
        if (!selectedProducto) return 0;

        if (selectedProducto.tipoProducto === 'Bolsa') {
            // Regla de tres: Si 1000 unidades cuestan X, entonces cantidad unidades cuestan Y
            const precioMillar = parseFloat(formData.precioMillar || '0');
            return (cantidad * precioMillar) / 1000;
        } else if (selectedProducto.tipoProducto === 'Bobina') {
            // Precio directo por kg
            const precioKg = parseFloat(formData.precioKg || '0');
            return cantidad * precioKg;
        }

        return 0;
    };

    const valorTotal = calcularValorTotal().toFixed(2);

    // Calcular precio unitario real para enviar al backend
    const calcularPrecioUnitario = (): number | undefined => {
        if (!selectedProducto) return undefined;

        if (selectedProducto.tipoProducto === 'Bolsa') {
            const precioMillar = parseFloat(formData.precioMillar || '0');
            if (precioMillar === 0) return undefined;
            // Precio unitario = precio millar / 1000
            return precioMillar / 1000;
        } else if (selectedProducto.tipoProducto === 'Bobina') {
            const precioKg = parseFloat(formData.precioKg || '0');
            if (precioKg === 0) return undefined;
            // Precio unitario = precio por kg
            return precioKg;
        }

        return undefined;
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const precioUnitario = calcularPrecioUnitario();
            
            const payload = {
                productoTerminadoId: formData.productoTerminadoId,
                cantidadDespachada: parseFloat(formData.cantidadDespachada),
                unidad: formData.unidad,
                precioUnitario: precioUnitario,
                vehiculo: formData.vehiculo,
                conductor: formData.conductor,
                destino: formData.destino,
                guiaRemision: formData.guiaRemision,
                observaciones: formData.observaciones,
                fecha: formData.fecha,
            };

            const res = await fetch('/api/despachos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Error al crear despacho');
            }

            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || 'Error desconocido');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
                >
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                <Truck className="h-5 w-5" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">Registrar Nuevo Despacho</h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 rounded-lg transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Form Content */}
                    <div className="p-6 overflow-y-auto bg-gray-50/50">
                        <form id="despacho-form" onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm border border-red-100">
                                    {error}
                                </div>
                            )}

                            {/* Selección de Producto */}
                            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                                <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <Package className="h-4 w-4 text-emerald-600" />
                                    1. Selección de Producto Terminado
                                </h3>

                                {loadingProductos ? (
                                    <p className="text-sm text-gray-500 text-center py-4">Cargando inventario listo para despacho...</p>
                                ) : productos.length === 0 ? (
                                    <p className="text-sm text-red-500 text-center py-4">No hay productos en estado Listo para Despacho.</p>
                                ) : (
                                    <>
                                        <select
                                            value={formData.productoTerminadoId}
                                            onChange={(e) => handleProductoChange(e.target.value)}
                                            required
                                            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                                        >
                                            <option value="">Seleccione un producto disponible...</option>
                                            {productos.map((p) => (
                                                <option key={p.id} value={p.id}>
                                                    {p.cliente.nombre} - {p.tipoProducto} - Disp: {p.cantidadDisponible} {p.unidad}
                                                </option>
                                            ))}
                                        </select>

                                        {selectedProducto && (
                                            <div className="mt-4 bg-emerald-50 border border-emerald-100 p-4 rounded-lg flex items-start gap-3">
                                                <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5" />
                                                <div className="flex-1">
                                                    <p className="font-medium text-emerald-900">{selectedProducto.cliente.nombre}</p>
                                                    <div className="mt-2 text-sm text-emerald-800 grid grid-cols-2 gap-2 sm:grid-cols-4">
                                                        <div><span className="opacity-75">Tipo:</span> {selectedProducto.tipoProducto}</div>
                                                        <div><span className="opacity-75">Origen:</span> {areaNombres[selectedProducto.areaOrigen]}</div>
                                                        <div><span className="opacity-75">Disponible:</span> <strong>{selectedProducto.cantidadDisponible} {selectedProducto.unidad}</strong></div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Detalles Cuantitativos */}
                            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                                <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <Truck className="h-4 w-4 text-blue-600" />
                                    2. Detalles de Salida y Facturación
                                </h3>

                                <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3">
                                    <FormInput
                                        label="Cantidad a Despachar"
                                        type="number"
                                        step="any"
                                        min="0"
                                        max={selectedProducto ? selectedProducto.cantidadDisponible : undefined}
                                        value={formData.cantidadDespachada}
                                        onChange={(e) => setFormData({ ...formData, cantidadDespachada: e.target.value })}
                                        required
                                    />
                                    
                                    {/* Campo dinámico según tipo de producto */}
                                    {selectedProducto?.tipoProducto === 'Bolsa' ? (
                                        <div>
                                            <FormInput
                                                label="Precio Millar (Opcional)"
                                                type="number"
                                                step="any"
                                                min="0"
                                                value={formData.precioMillar}
                                                onChange={(e) => setFormData({ ...formData, precioMillar: e.target.value })}
                                                placeholder="Precio por 1000 unidades"
                                            />
                                            <p className="mt-1 text-xs text-gray-500">
                                                Precio por cada 1000 unidades
                                            </p>
                                        </div>
                                    ) : selectedProducto?.tipoProducto === 'Bobina' ? (
                                        <div>
                                            <FormInput
                                                label="Precio por Kg (Opcional)"
                                                type="number"
                                                step="any"
                                                min="0"
                                                value={formData.precioKg}
                                                onChange={(e) => setFormData({ ...formData, precioKg: e.target.value })}
                                                placeholder="Precio por kilogramo"
                                            />
                                            <p className="mt-1 text-xs text-gray-500">
                                                Precio por cada kilogramo
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center text-sm text-gray-400">
                                            Seleccione un producto
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Valor Total Calculado</label>
                                        <div className="px-4 py-2.5 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg text-green-900 font-bold text-lg h-[42px] flex items-center">
                                            $ {Number.isNaN(parseFloat(valorTotal)) ? '0.00' : valorTotal}
                                        </div>
                                        {selectedProducto && (
                                            <p className="mt-1 text-xs text-gray-500">
                                                {selectedProducto.tipoProducto === 'Bolsa' 
                                                    ? `${formData.cantidadDespachada || 0} unidades × $${formData.precioMillar || 0}/1000`
                                                    : `${formData.cantidadDespachada || 0} kg × $${formData.precioKg || 0}/kg`
                                                }
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Logística */}
                            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                                <h3 className="text-sm font-semibold text-gray-900 mb-4">3. Información Logística</h3>
                                <div className="grid gap-5 sm:grid-cols-2">
                                    <FormInput label="Destino" value={formData.destino} onChange={e => setFormData({ ...formData, destino: e.target.value })} />
                                    <FormInput label="Guía de Remisión" value={formData.guiaRemision} onChange={e => setFormData({ ...formData, guiaRemision: e.target.value })} />
                                    <FormInput label="Vehículo (Placa)" value={formData.vehiculo} onChange={e => setFormData({ ...formData, vehiculo: e.target.value })} />
                                    <FormInput label="Conductor" value={formData.conductor} onChange={e => setFormData({ ...formData, conductor: e.target.value })} />
                                    <FormInput label="Fecha" type="date" value={formData.fecha} onChange={e => setFormData({ ...formData, fecha: e.target.value })} required />
                                </div>
                            </div>

                            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                                <FormTextarea label="Observaciones" value={formData.observaciones} onChange={e => setFormData({ ...formData, observaciones: e.target.value })} rows={2} />
                            </div>

                        </form>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-gray-100 bg-white flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Cancelar
                        </button>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            form="despacho-form"
                            disabled={loading || !formData.productoTerminadoId}
                            className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-lg shadow-md disabled:opacity-50 transition-all hover:shadow-lg"
                        >
                            <UploadCloud className="h-4 w-4" />
                            {loading ? 'Procesando...' : 'Confirmar Salida'}
                        </motion.button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
