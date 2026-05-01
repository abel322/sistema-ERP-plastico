'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, PackagePlus } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface SobranteProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editData?: any;
}

const TIPOS_SOBRANTE = [
    'Bobina con impresión',
    'Bobina sin impresión',
    'Bobina refilada',
    'Bolsa impresa',
    'Bolsa no impresa'
];

export function SobranteProductModal({ isOpen, onClose, onSuccess, editData }: SobranteProductModalProps) {
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        tipo: TIPOS_SOBRANTE[0],
        cantidad: '',
        unidad: 'Kilogramos',
        descripcion: '',
        fecha: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        if (isOpen) {
            if (editData) {
                setFormData({
                    tipo: editData.tipo,
                    cantidad: editData.cantidad.toString(),
                    unidad: editData.unidad,
                    descripcion: editData.descripcion || '',
                    fecha: new Date(editData.fecha).toISOString().split('T')[0]
                });
            } else {
                setFormData({
                    tipo: TIPOS_SOBRANTE[0],
                    cantidad: '',
                    unidad: 'Kilogramos',
                    descripcion: '',
                    fecha: new Date().toISOString().split('T')[0]
                });
            }
        }
    }, [isOpen, editData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.cantidad) {
            alert('Por favor ingrese la cantidad.');
            return;
        }

        try {
            setSaving(true);
            const url = editData 
                ? `/api/producto-sobrante/${editData.id}` 
                : '/api/producto-sobrante';
            
            const method = editData ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    cantidad: parseFloat(formData.cantidad),
                })
            });

            if (res.ok) {
                onSuccess();
                onClose();
            } else {
                const err = await res.json();
                alert(err.error || 'Error al guardar el producto sobrante');
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
                    <div className="flex items-center justify-between p-6 bg-gradient-to-r from-slate-700 to-slate-900 text-white">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-lg">
                                <PackagePlus className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">{editData ? 'Editar' : 'Registrar'} Producto Sobrante</h2>
                                <p className="text-slate-300 text-sm">Inventario de material sobrante</p>
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
                        <form id="sobranteProductForm" onSubmit={handleSubmit} className="space-y-5">
                            
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-gray-700">Tipo de Producto *</label>
                                <select
                                    required
                                    value={formData.tipo}
                                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:bg-white transition-all outline-none"
                                >
                                    {TIPOS_SOBRANTE.map(t => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-gray-700">Cantidad *</label>
                                    <input
                                        required
                                        type="number"
                                        step="0.01"
                                        min="0.1"
                                        value={formData.cantidad}
                                        onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:bg-white transition-all outline-none"
                                        placeholder="Ej. 50.5"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-gray-700">Unidad *</label>
                                    <select
                                        value={formData.unidad}
                                        onChange={(e) => setFormData({ ...formData, unidad: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:bg-white transition-all outline-none"
                                    >
                                        <option value="Kilogramos">Kilogramos</option>
                                        <option value="Unidades">Unidades</option>
                                        <option value="Metros">Metros</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-gray-700">Fecha</label>
                                <input
                                    type="date"
                                    value={formData.fecha}
                                    onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:bg-white transition-all outline-none"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-gray-700">Descripción (Opcional)</label>
                                <textarea
                                    value={formData.descripcion}
                                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:bg-white transition-all outline-none resize-none"
                                    rows={3}
                                    placeholder="Detalles sobre el material sobrante..."
                                />
                            </div>

                        </form>
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
                            form="sobranteProductForm"
                            disabled={saving}
                            className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-sm font-semibold rounded-xl shadow-sm hover:shadow active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            {saving ? <LoadingSpinner /> : <><Save className="w-4 h-4" /> {editData ? 'Actualizar' : 'Guardar'} Sobrante</>}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
