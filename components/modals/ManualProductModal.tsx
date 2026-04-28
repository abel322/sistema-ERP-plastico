'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, PackagePlus } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface Cliente {
    id: string;
    nombre: string;
}

interface ManualProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function ManualProductModal({ isOpen, onClose, onSuccess }: ManualProductModalProps) {
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        clienteId: '',
        areaOrigen: 'Extrusion',
        descripcion: '',
        cantidadTotal: '',
        unidad: 'Unidades',
        tipoProducto: 'Bobina',
        conImpresion: false,
        estado: 'ListoDespacho',
        siguienteArea: 'Ninguna'
    });

    useEffect(() => {
        if (isOpen) {
            fetchClientes();
            // Reset form
            setFormData({
                clienteId: '',
                areaOrigen: 'Extrusion',
                descripcion: '',
                cantidadTotal: '',
                unidad: 'Unidades',
                tipoProducto: 'Bobina',
                conImpresion: false,
                estado: 'ListoDespacho',
                siguienteArea: 'Ninguna'
            });
        }
    }, [isOpen]);

    const fetchClientes = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/clientes?limit=1000');
            const data = await res.json();
            setClientes(data.clientes || data || []);
        } catch (error) {
            console.error('Error fetching clientes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectCategoria = (estado: string) => {
        if (estado === 'ListoDespacho') {
            setFormData(prev => ({ ...prev, estado, siguienteArea: 'Ninguna' }));
        } else {
            setFormData(prev => ({ ...prev, estado, siguienteArea: 'Sellado' }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.clienteId || !formData.cantidadTotal) {
            alert('Por favor complete todos los campos requeridos.');
            return;
        }

        try {
            setSaving(true);
            const res = await fetch('/api/producto-terminado', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    cantidadTotal: parseFloat(formData.cantidadTotal),
                })
            });

            if (res.ok) {
                onSuccess();
                onClose();
            } else {
                const err = await res.json();
                alert(err.error || 'Error al guardar el producto');
            }
        } catch (error) {
            console.error(error);
            alert('Ocurrió un error inesperado al guardar.');
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
                    className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 bg-gradient-to-r from-emerald-600 to-green-500 text-white">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-lg">
                                <PackagePlus className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">Registrar un Producto</h2>
                                <p className="text-emerald-100 text-sm">Ingreso manual a Producto Terminado</p>
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
                        {loading ? (
                            <div className="flex justify-center p-8"><LoadingSpinner /></div>
                        ) : (
                            <form id="manualProductForm" onSubmit={handleSubmit} className="space-y-5">

                                {/* Categoría Selector Elegante */}
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">Categoría del Producto</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => handleSelectCategoria('ListoDespacho')}
                                            className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${formData.estado === 'ListoDespacho'
                                                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm'
                                                    : 'border-gray-200 hover:border-emerald-200 text-gray-600'
                                                }`}
                                        >
                                            Para Despachar
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleSelectCategoria('PendienteArea')}
                                            className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${formData.estado === 'PendienteArea'
                                                    ? 'border-amber-500 bg-amber-50 text-amber-700 shadow-sm'
                                                    : 'border-gray-200 hover:border-amber-200 text-gray-600'
                                                }`}
                                        >
                                            Pendientes Área
                                        </button>
                                    </div>
                                </div>

                                {formData.estado === 'PendienteArea' && (
                                    <div className="space-y-1.5 animate-in slide-in-from-top-2">
                                        <label className="text-sm font-medium text-gray-700">Siguiente Área</label>
                                        <select
                                            value={formData.siguienteArea}
                                            onChange={(e) => setFormData({ ...formData, siguienteArea: e.target.value })}
                                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all outline-none"
                                        >
                                            <option value="Sellado">Sellado</option>
                                            <option value="Serigrafia">Serigrafía</option>
                                            <option value="Refilado">Refilado</option>
                                        </select>
                                    </div>
                                )}

                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-gray-700">Cliente *</label>
                                    <select
                                        required
                                        value={formData.clienteId}
                                        onChange={(e) => setFormData({ ...formData, clienteId: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all outline-none"
                                    >
                                        <option value="">Seleccione un cliente...</option>
                                        {clientes.map(c => (
                                            <option key={c.id} value={c.id}>{c.nombre}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-gray-700">Cantidad Total *</label>
                                        <input
                                            required
                                            type="number"
                                            step="0.01"
                                            min="0.1"
                                            value={formData.cantidadTotal}
                                            onChange={(e) => setFormData({ ...formData, cantidadTotal: e.target.value })}
                                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all outline-none"
                                            placeholder="Ej. 1500"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-gray-700">Unidad *</label>
                                        <select
                                            value={formData.unidad}
                                            onChange={(e) => setFormData({ ...formData, unidad: e.target.value })}
                                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all outline-none"
                                        >
                                            <option value="Unidades">Unidades</option>
                                            <option value="Kilogramos">Kilogramos</option>
                                            <option value="Metros">Metros</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-gray-700">Tipo de Producto</label>
                                        <select
                                            value={formData.tipoProducto}
                                            onChange={(e) => setFormData({ ...formData, tipoProducto: e.target.value })}
                                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all outline-none"
                                        >
                                            <option value="Bobina">Bobina</option>
                                            <option value="Bolsa">Bolsa</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-gray-700">Área Origen</label>
                                        <select
                                            value={formData.areaOrigen}
                                            onChange={(e) => setFormData({ ...formData, areaOrigen: e.target.value })}
                                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all outline-none"
                                        >
                                            <option value="Extrusion">Extrusión</option>
                                            <option value="Sellado">Sellado</option>
                                            <option value="Serigrafia">Serigrafía</option>
                                            <option value="Refilado">Refilado</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                    <input
                                        type="checkbox"
                                        id="conImpresion"
                                        checked={formData.conImpresion}
                                        onChange={(e) => setFormData({ ...formData, conImpresion: e.target.checked })}
                                        className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                                    />
                                    <label htmlFor="conImpresion" className="text-sm font-medium text-gray-700 cursor-pointer">
                                        ¿Producto con impresión (Serigrafía)?
                                    </label>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-gray-700">Descripción (Opcional)</label>
                                    <textarea
                                        value={formData.descripcion}
                                        onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all outline-none resize-none"
                                        rows={2}
                                        placeholder="Detalles adicionales del producto a registrar..."
                                    />
                                </div>

                            </form>
                        )}
                    </div>

                    {/* Footer Action */}
                    <div className="p-5 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={saving}
                            className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-all disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            form="manualProductForm"
                            disabled={saving || loading}
                            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm hover:shadow active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            {saving ? <LoadingSpinner /> : <><Save className="w-4 h-4" /> Guardar Producto</>}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
