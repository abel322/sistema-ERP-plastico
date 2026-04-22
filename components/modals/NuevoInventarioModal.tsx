'use client';

import { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Package } from 'lucide-react';
import { FormInput } from '@/components/forms/form-input';
import { FormSelect } from '@/components/forms/form-select';
import { FormTextarea } from '@/components/forms/form-textarea';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface NuevoInventarioModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function NuevoInventarioModal({ isOpen, onClose, onSuccess }: NuevoInventarioModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        nombre: '',
        codigo: '',
        categoria: 'MateriaPrima',
        cantidad: '',
        unidad: '',
        stockMinimo: '',
        stockMaximo: '',
        ubicacion: '',
        costo: '',
        proveedor: '',
        observaciones: ''
    });

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/inventario', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    cantidad: formData.cantidad ? parseFloat(formData.cantidad) : 0,
                    stockMinimo: formData.stockMinimo ? parseFloat(formData.stockMinimo) : 0,
                    stockMaximo: formData.stockMaximo ? parseFloat(formData.stockMaximo) : null,
                    costo: formData.costo ? parseFloat(formData.costo) : null
                })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Error al crear item');
            }

            onSuccess();
            onClose();
            // Limpiar formulario para la proxima
            setFormData({
                nombre: '',
                codigo: '',
                categoria: 'MateriaPrima',
                cantidad: '',
                unidad: '',
                stockMinimo: '',
                stockMaximo: '',
                ubicacion: '',
                costo: '',
                proveedor: '',
                observaciones: ''
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al crear item');
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
                    className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-lg">
                                <Package className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">Nuevo Item</h2>
                                <p className="text-blue-100 text-sm">Agregar nuevo item al inventario</p>
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
                        <form id="nuevoInventarioForm" onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 border border-red-200">
                                    {error}
                                </div>
                            )}

                            <div className="grid gap-4 sm:grid-cols-2">
                                <FormInput
                                    label="Código"
                                    value={formData.codigo}
                                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                                    required
                                    placeholder="Ej: MP-001"
                                />
                                <FormInput
                                    label="Nombre"
                                    value={formData.nombre}
                                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                    required
                                    placeholder="Nombre del item"
                                />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <FormSelect
                                    label="Categoría"
                                    value={formData.categoria}
                                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                                    required
                                    options={[
                                        { value: 'MateriaPrima', label: 'Materia Prima' },
                                        { value: 'ProductoTerminado', label: 'Producto Terminado' },
                                        { value: 'Insumo', label: 'Insumo' },
                                        { value: 'Peletizado', label: 'Peletizado' }
                                    ]}
                                />
                                <FormInput
                                    label="Unidad"
                                    value={formData.unidad}
                                    onChange={(e) => setFormData({ ...formData, unidad: e.target.value })}
                                    required
                                    placeholder="Ej: Kg, unidades, metros"
                                />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-3">
                                <FormInput
                                    label="Cantidad Inicial"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={formData.cantidad}
                                    onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })}
                                    placeholder="0"
                                />
                                <FormInput
                                    label="Stock Mínimo"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={formData.stockMinimo}
                                    onChange={(e) => setFormData({ ...formData, stockMinimo: e.target.value })}
                                    placeholder="0"
                                />
                                <FormInput
                                    label="Stock Máximo"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={formData.stockMaximo}
                                    onChange={(e) => setFormData({ ...formData, stockMaximo: e.target.value })}
                                    placeholder="Opcional"
                                />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <FormInput
                                    label="Ubicación"
                                    value={formData.ubicacion}
                                    onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
                                    placeholder="Ej: Almacén A, Estante 3"
                                />
                                <FormInput
                                    label="Costo Unitario"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={formData.costo}
                                    onChange={(e) => setFormData({ ...formData, costo: e.target.value })}
                                    placeholder="0.00"
                                />
                            </div>

                            <FormInput
                                label="Proveedor"
                                value={formData.proveedor}
                                onChange={(e) => setFormData({ ...formData, proveedor: e.target.value })}
                                placeholder="Nombre del proveedor"
                            />

                            <FormTextarea
                                label="Observaciones"
                                value={formData.observaciones}
                                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                                rows={3}
                                placeholder="Observaciones adicionales..."
                            />
                        </form>
                    </div>

                    {/* Footer Action */}
                    <div className="p-5 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-all disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            form="nuevoInventarioForm"
                            disabled={loading}
                            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm hover:shadow active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            {loading ? <LoadingSpinner /> : <><Save className="w-4 h-4" /> Guardar Item</>}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
