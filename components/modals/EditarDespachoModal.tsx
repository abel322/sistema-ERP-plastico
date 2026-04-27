'use client';

import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Save, FileText } from 'lucide-react';
import { FormInput } from '@/components/forms/form-input';
import { FormSelect } from '@/components/forms/form-select';
import { FormTextarea } from '@/components/forms/form-textarea';

const ESTADOS = [
    { value: 'Pendiente', label: 'Pendiente' },
    { value: 'EnTransito', label: 'En Tránsito' },
    { value: 'Entregado', label: 'Entregado' },
    { value: 'Cancelado', label: 'Cancelado' },
];

interface EditarDespachoModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    despachoId: string | null;
}

export function EditarDespachoModal({ isOpen, onClose, onSuccess, despachoId }: EditarDespachoModalProps) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        estado: '',
        vehiculo: '',
        conductor: '',
        destino: '',
        guiaRemision: '',
        observaciones: '',
    });

    const [despachoInfo, setDespachoInfo] = useState<any>(null);

    useEffect(() => {
        if (isOpen && despachoId) {
            fetchDespacho();
        }
    }, [isOpen, despachoId]);

    const fetchDespacho = async () => {
        try {
            setLoading(true);
            setError('');
            const res = await fetch(`/api/despachos/${despachoId}`);
            if (!res.ok) throw new Error('Despacho no encontrado');
            const data = await res.json();
            setDespachoInfo(data);
            setFormData({
                estado: data.estado,
                vehiculo: data.vehiculo || '',
                conductor: data.conductor || '',
                destino: data.destino || '',
                guiaRemision: data.guiaRemision || '',
                observaciones: data.observaciones || '',
            });
        } catch (error) {
            console.error('Error:', error);
            setError('No se pudo cargar el despacho');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        try {
            const res = await fetch(`/api/despachos/${despachoId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Error al actualizar');
            }

            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const formatDate = (dateStr: string) =>
        new Date(dateStr).toLocaleDateString('es-VE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
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
                                <FileText className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Editar Despacho</h2>
                                <p className="text-blue-100 text-sm">Actualizar información del despacho existente</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/20 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-4">
                                <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                                <p className="text-gray-500 font-medium">Cargando datos del despacho...</p>
                            </div>
                        ) : (
                            <>
                                {despachoInfo && (
                                    <div className="mb-6 rounded-lg bg-gray-50 p-4 border border-gray-100 shadow-sm">
                                        <h3 className="mb-3 font-bold text-gray-800 uppercase tracking-wider text-sm">Información Original</h3>
                                        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                                            <div>
                                                <span className="text-gray-500 block text-[10px] uppercase font-bold">Fecha</span>
                                                <p className="font-semibold text-gray-900">{formatDate(despachoInfo.fecha)}</p>
                                            </div>
                                            <div>
                                                <span className="text-gray-500 block text-[10px] uppercase font-bold">Cliente</span>
                                                <p className="font-semibold text-gray-900">{despachoInfo.cliente?.nombre}</p>
                                            </div>
                                            <div>
                                                <span className="text-gray-500 block text-[10px] uppercase font-bold">Cantidad</span>
                                                <p className="font-semibold text-gray-900">{despachoInfo.cantidadDespachada} {despachoInfo.unidad}</p>
                                            </div>
                                            {despachoInfo.entregadoAt && (
                                                <div>
                                                    <span className="text-gray-500 block text-[10px] uppercase font-bold">Entregado</span>
                                                    <p className="font-semibold text-green-600">{formatDate(despachoInfo.entregadoAt)}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <form id="editarDespachoForm" onSubmit={handleSubmit} className="space-y-6">
                                    {error && (
                                        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 font-medium border border-red-200">{error}</div>
                                    )}

                                    <FormSelect
                                        label="Estado"
                                        value={formData.estado}
                                        onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                                        required
                                    >
                                        {ESTADOS.map((e) => (
                                            <option key={e.value} value={e.value}>{e.label}</option>
                                        ))}
                                    </FormSelect>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <FormInput
                                            label="Vehículo (Placa)"
                                            value={formData.vehiculo}
                                            onChange={(e) => setFormData({ ...formData, vehiculo: e.target.value })}
                                        />
                                        <FormInput
                                            label="Conductor"
                                            value={formData.conductor}
                                            onChange={(e) => setFormData({ ...formData, conductor: e.target.value })}
                                        />
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <FormInput
                                            label="Destino"
                                            value={formData.destino}
                                            onChange={(e) => setFormData({ ...formData, destino: e.target.value })}
                                        />
                                        <FormInput
                                            label="Guía de Remisión"
                                            value={formData.guiaRemision}
                                            onChange={(e) => setFormData({ ...formData, guiaRemision: e.target.value })}
                                        />
                                    </div>

                                    <FormTextarea
                                        label="Observaciones"
                                        value={formData.observaciones}
                                        onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                                        rows={3}
                                    />
                                </form>
                            </>
                        )}
                    </div>

                    {/* Footer */}
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
                            form="editarDespachoForm"
                            disabled={saving || loading}
                            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:grayscale"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Actualizando...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    Actualizar Despacho
                                </>
                            )}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
