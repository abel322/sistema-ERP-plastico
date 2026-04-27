'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Pencil } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface ProductoTerminado {
    id: string;
    descripcion: string | null;
    cantidadDisponible: number;
    unidad: string;
}

interface EditProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    producto: ProductoTerminado | null;
}

export function EditProductModal({ isOpen, onClose, onSuccess, producto }: EditProductModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        descripcion: '',
        cantidadDisponible: '',
    });

    useEffect(() => {
        if (isOpen && producto) {
            setFormData({
                descripcion: producto.descripcion || '',
                cantidadDisponible: producto.cantidadDisponible.toString(),
            });
        }
    }, [isOpen, producto]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!producto) return;

        try {
            setLoading(true);
            const res = await fetch(`/api/producto-terminado/${producto.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    descripcion: formData.descripcion,
                    cantidadDisponible: parseFloat(formData.cantidadDisponible),
                })
            });

            if (res.ok) {
                onSuccess();
                onClose();
            } else {
                const err = await res.json();
                alert(err.error || 'Error al actualizar el producto');
            }
        } catch (error) {
            console.error(error);
            alert('Ocurrió un error inesperado al actualizar.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !producto) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col"
                >
                    <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-600 to-indigo-500 text-white">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-lg">
                                <Pencil className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">Actualizar Producto</h2>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="p-6">
                        <form id="editProductForm" onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-gray-700">Cantidad Disponible ({producto.unidad})</label>
                                <input
                                    required
                                    type="number"
                                    step="0.01"
                                    value={formData.cantidadDisponible}
                                    onChange={(e) => setFormData({ ...formData, cantidadDisponible: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-gray-700">Descripción</label>
                                <textarea
                                    value={formData.descripcion}
                                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none resize-none"
                                    rows={3}
                                />
                            </div>
                        </form>
                    </div>

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
                            form="editProductForm"
                            disabled={loading}
                            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm hover:shadow active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            {loading ? <LoadingSpinner /> : <><Save className="w-4 h-4" /> Guardar Cambios</>}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
