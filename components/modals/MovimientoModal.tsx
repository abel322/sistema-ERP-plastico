'use client';

import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, ArrowLeftRight } from 'lucide-react';
import { FormInput } from '@/components/forms/form-input';
import { FormSelect } from '@/components/forms/form-select';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface MovimientoModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    itemId: string;
    itemName: string;
    itemUnidad: string;
    editData?: {
        id: string;
        tipo: string;
        cantidad: number;
        motivo: string | null;
    };
}

export function MovimientoModal({ isOpen, onClose, onSuccess, itemId, itemName, itemUnidad, editData }: MovimientoModalProps) {
    const isEdit = !!editData;
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        tipo: editData?.tipo || 'Entrada',
        cantidad: editData?.cantidad.toString() || '',
        motivo: editData?.motivo || ''
    });

    // Actualizar form si cambia editData
    useEffect(() => {
        if (editData) {
            setFormData({
                tipo: editData.tipo,
                cantidad: editData.cantidad.toString(),
                motivo: editData.motivo || ''
            });
        } else {
            setFormData({
                tipo: 'Entrada',
                cantidad: '',
                motivo: ''
            });
        }
    }, [editData, isOpen]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const url = isEdit ? `/api/inventario/movimientos/${editData.id}` : '/api/inventario/movimientos';
            const method = isEdit ? 'PATCH' : 'POST';
            
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    inventarioId: itemId,
                    tipo: formData.tipo,
                    cantidad: parseFloat(formData.cantidad),
                    motivo: formData.motivo
                })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || `Error al ${isEdit ? 'actualizar' : 'registrar'} movimiento`);
            }

            onSuccess();
            onClose();
            // Limpiar formulario
            setFormData({ tipo: 'Entrada', cantidad: '', motivo: '' });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al registrar movimiento');
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
                    className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-lg">
                                <ArrowLeftRight className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">{isEdit ? 'Editar Movimiento' : 'Registrar Movimiento'}</h2>
                                <p className="text-blue-100 text-sm truncate max-w-[200px]">{itemName}</p>
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
                    <div className="p-6">
                        <form id="movimientoForm" onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <div className="rounded-lg bg-red-50 dark:bg-red-900/30 p-4 text-sm text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800">
                                    {error}
                                </div>
                            )}

                            <FormSelect
                                label="Tipo de Movimiento"
                                value={formData.tipo}
                                onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                                required
                                disabled={isEdit}
                                options={[
                                    { value: 'Entrada', label: 'Entrada' },
                                    { value: 'Salida', label: 'Salida' },
                                    { value: 'Ajuste', label: 'Ajuste (nuevo stock)' },
                                    { value: 'Devolucion', label: 'Devolución' }
                                ]}
                            />

                            <FormInput
                                label={formData.tipo === 'Ajuste' ? `Nueva Cantidad (${itemUnidad})` : `Cantidad (${itemUnidad})`}
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.cantidad}
                                onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })}
                                required
                                placeholder="0.00"
                            />

                            <FormInput
                                label="Motivo"
                                value={formData.motivo}
                                onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                                placeholder="Descripción del movimiento"
                            />
                        </form>
                    </div>

                    {/* Footer Action */}
                    <div className="p-5 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-slate-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-all disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            form="movimientoForm"
                            disabled={loading}
                            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm hover:shadow active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            {loading ? <LoadingSpinner /> : <><Save className="w-4 h-4" /> Registrar</>}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
