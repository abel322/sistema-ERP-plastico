'use client';

import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, ShoppingCart, Plus, Trash2, Loader2 } from 'lucide-react';
import { FormInput } from '@/components/forms/form-input';
import { FormSelect } from '@/components/forms/form-select';
import { FormTextarea } from '@/components/forms/form-textarea';

interface Proveedor {
    id: string;
    nombre: string;
}

interface DetalleOrden {
    descripcion: string;
    cantidad: number;
    unidad: string;
    precioUnitario: number;
}

interface NuevaCompraModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function NuevaCompraModal({ isOpen, onClose, onSuccess }: NuevaCompraModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [proveedores, setProveedores] = useState<Proveedor[]>([]);

    const [formData, setFormData] = useState({
        proveedorId: '',
        fechaEntrega: '',
        observaciones: '',
    });

    const [detalles, setDetalles] = useState<DetalleOrden[]>([
        { descripcion: '', cantidad: 0, unidad: 'Kg', precioUnitario: 0 },
    ]);

    useEffect(() => {
        if (isOpen) {
            fetchProveedores();
            setFormData({
                proveedorId: '',
                fechaEntrega: '',
                observaciones: '',
            });
            setDetalles([{ descripcion: '', cantidad: 0, unidad: 'Kg', precioUnitario: 0 }]);
            setError('');
        }
    }, [isOpen]);

    const fetchProveedores = async () => {
        try {
            const res = await fetch('/api/proveedores?limit=100&activo=true');
            if (res.ok) {
                const data = await res.json();
                setProveedores(data.proveedores || []);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleDetalleChange = (index: number, field: keyof DetalleOrden, value: string | number) => {
        setDetalles((prev) => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    };

    const agregarDetalle = () => {
        setDetalles((prev) => [
            ...prev,
            { descripcion: '', cantidad: 0, unidad: 'Kg', precioUnitario: 0 },
        ]);
    };

    const eliminarDetalle = (index: number) => {
        if (detalles.length === 1) return;
        setDetalles((prev) => prev.filter((_, i) => i !== index));
    };

    const calcularSubtotal = () => {
        return detalles.reduce((sum, d) => sum + d.cantidad * d.precioUnitario, 0);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const detallesValidos = detalles.filter(
            (d) => d.descripcion && d.cantidad > 0 && d.precioUnitario > 0
        );

        if (detallesValidos.length === 0) {
            setError('Debe agregar al menos un ítem válido');
            setLoading(false);
            return;
        }

        try {
            const res = await fetch('/api/compras', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    detalles: detallesValidos,
                }),
            });

            if (res.ok) {
                onSuccess();
                onClose();
            } else {
                const data = await res.json();
                setError(data.error || 'Error al crear orden');
            }
        } catch (error) {
            setError('Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    const subtotal = calcularSubtotal();
    const iva = subtotal * 0.16;
    const total = subtotal + iva;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm italic">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-orange-600 to-amber-700 p-6 text-white italic">
                            <div className="flex items-center justify-between italic">
                                <div className="flex items-center gap-3 italic">
                                    <div className="rounded-lg bg-white/20 p-2 italic">
                                        <ShoppingCart className="h-6 w-6 text-white" />
                                    </div>
                                    <div className="italic">
                                        <h2 className="text-xl font-bold">Nueva Orden</h2>
                                        <p className="text-sm text-orange-100/80">Gestión de compras y proveedores</p>
                                    </div>
                                </div>
                                <button onClick={onClose} className="rounded-full p-2 hover:bg-white/10 transition-colors italic">
                                    <X className="h-6 w-6" />
                                </button>
                            </div>
                        </div>

                        <div className="max-h-[80vh] overflow-y-auto p-6 italic">
                            <form onSubmit={handleSubmit} className="space-y-6 italic">
                                {error && (
                                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm italic">
                                        {error}
                                    </div>
                                )}

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 italic text-gray-800">
                                    <FormSelect
                                        label="Proveedor"
                                        name="proveedorId"
                                        value={formData.proveedorId}
                                        onChange={handleChange}
                                        options={proveedores.map((p) => ({ value: p.id, label: p.nombre }))}
                                        required
                                        placeholder="Seleccione..."
                                    />
                                    <FormInput
                                        label="Entrega Esperada"
                                        name="fechaEntrega"
                                        type="date"
                                        value={formData.fechaEntrega}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="space-y-4 italic">
                                    <div className="flex items-center justify-between border-b pb-2 italic">
                                        <h3 className="font-semibold text-gray-800 italic">Ítems de la Orden</h3>
                                        <button
                                            type="button"
                                            onClick={agregarDetalle}
                                            className="flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 text-sm transition-colors italic"
                                        >
                                            <Plus className="h-4 w-4" />
                                            Agregar Item
                                        </button>
                                    </div>

                                    <div className="max-h-[300px] overflow-y-auto pr-2 space-y-3 italic">
                                        {detalles.map((detalle, index) => (
                                            <div key={index} className="grid grid-cols-12 gap-2 p-3 bg-gray-50 rounded-xl items-end border border-gray-100 italic">
                                                <div className="col-span-12 sm:col-span-5 italic">
                                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block italic text-gray-800">Desc.</label>
                                                    <input
                                                        type="text"
                                                        value={detalle.descripcion}
                                                        onChange={(e) => handleDetalleChange(index, 'descripcion', e.target.value)}
                                                        className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none italic"
                                                        placeholder="Descripción..."
                                                        required
                                                    />
                                                </div>
                                                <div className="col-span-4 sm:col-span-2 italic">
                                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block italic text-gray-800">Cant.</label>
                                                    <input
                                                        type="number"
                                                        value={detalle.cantidad || ''}
                                                        onChange={(e) => handleDetalleChange(index, 'cantidad', parseFloat(e.target.value) || 0)}
                                                        className="w-full px-3 py-2 border rounded-lg text-sm italic"
                                                        min="0"
                                                        step="0.01"
                                                        required
                                                    />
                                                </div>
                                                <div className="col-span-4 sm:col-span-2 italic">
                                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block italic text-gray-800">Unid.</label>
                                                    <select
                                                        value={detalle.unidad}
                                                        onChange={(e) => handleDetalleChange(index, 'unidad', e.target.value)}
                                                        className="w-full px-3 text-gray-800 py-2 border rounded-lg text-sm italic"
                                                    >
                                                        <option value="Kg">Kg</option>
                                                        <option value="Unidades">Unidades</option>
                                                        <option value="Metros">Metros</option>
                                                        <option value="Litros">Litros</option>
                                                    </select>
                                                </div>
                                                <div className="col-span-3 sm:col-span-2 italic">
                                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block italic text-gray-800">Precio</label>
                                                    <input
                                                        type="number"
                                                        value={detalle.precioUnitario || ''}
                                                        onChange={(e) => handleDetalleChange(index, 'precioUnitario', parseFloat(e.target.value) || 0)}
                                                        className="w-full px-3 py-2 border rounded-lg text-sm italic"
                                                        min="0"
                                                        step="0.01"
                                                        required
                                                    />
                                                </div>
                                                <div className="col-span-1 flex justify-center pb-2 italic text-gray-800">
                                                    <button
                                                        type="button"
                                                        onClick={() => eliminarDetalle(index)}
                                                        disabled={detalles.length === 1}
                                                        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors italic"
                                                    >
                                                        <Trash2 className="h-5 w-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row justify-between items-start pt-4 border-t gap-4 italic">
                                    <FormTextarea
                                        label="Observaciones"
                                        name="observaciones"
                                        value={formData.observaciones}
                                        onChange={handleChange}
                                        rows={2}
                                        placeholder="Notas..."
                                        className="flex-1"
                                    />
                                    <div className="bg-orange-50 p-4 rounded-xl min-w-[200px] text-right italic">
                                        <p className="text-xs text-gray-600 italic">Subtotal: <span className="font-bold italic">${subtotal.toFixed(2)}</span></p>
                                        <p className="text-xs text-gray-600 italic">IVA (16%): <span className="font-bold italic">${iva.toFixed(2)}</span></p>
                                        <p className="text-xl font-black text-orange-600 italic mt-1">${total.toFixed(2)}</p>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-4 italic">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="rounded-xl border border-gray-300 px-6 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors italic"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading || !formData.proveedorId}
                                        className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-700 px-8 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-100 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 italic"
                                    >
                                        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                                        Crear Orden
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
