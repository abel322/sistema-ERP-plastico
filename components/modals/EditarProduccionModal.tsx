'use client';

import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Save, X, Factory } from 'lucide-react';
import { FormInput } from '@/components/forms/form-input';
import { FormSelect } from '@/components/forms/form-select';
import { FormTextarea } from '@/components/forms/form-textarea';

const TURNOS = [
    { value: 'Manana', label: 'Mañana' },
    { value: 'Tarde', label: 'Tarde' },
    { value: 'Noche', label: 'Noche' },
];

const UNIDADES = [
    { value: 'Unidades', label: 'Unidades' },
    { value: 'Kilogramos', label: 'Kilogramos' },
    { value: 'Metros', label: 'Metros' },
];

interface EditarProduccionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    produccionId: string | null;
}

export function EditarProduccionModal({ isOpen, onClose, onSuccess, produccionId }: EditarProduccionModalProps) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        turno: '',
        operario: '',
        cantidadProducida: '',
        unidad: '',
        merma: '',
        horaInicio: '',
        horaFin: '',
        observaciones: '',
    });

    const [produccion, setProduccion] = useState<any>(null);

    useEffect(() => {
        if (isOpen && produccionId) {
            fetchProduccion();
        }
    }, [isOpen, produccionId]);

    const fetchProduccion = async () => {
        try {
            setLoading(true);
            setError('');
            const res = await fetch(`/api/produccion/${produccionId}`);
            if (!res.ok) throw new Error('Producción no encontrada');
            const data = await res.json();
            setProduccion(data);
            setFormData({
                turno: data.turno,
                operario: data.operario,
                cantidadProducida: data.cantidadProducida.toString(),
                unidad: data.unidad,
                merma: data.merma.toString(),
                horaInicio: data.horaInicio || '',
                horaFin: data.horaFin || '',
                observaciones: data.observaciones || '',
            });
        } catch (error) {
            console.error('Error:', error);
            setError('No se pudo cargar la producción');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        try {
            const res = await fetch(`/api/produccion/${produccionId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    cantidadProducida: parseFloat(formData.cantidadProducida),
                    merma: parseFloat(formData.merma),
                }),
            });

            if (res.ok) {
                onSuccess();
                onClose();
            } else {
                const data = await res.json();
                throw new Error(data.error || 'Error al actualizar');
            }
        } catch (err: any) {
            console.error('Error:', err);
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

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
                    <div className="flex items-center justify-between p-6 bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-lg">
                                <Factory className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Editar Producción</h2>
                                <p className="text-emerald-100 text-sm">
                                    {produccion?.maquina?.nombre} - {produccion?.fecha && new Date(produccion.fecha).toLocaleDateString('es-VE')}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/20 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-4">
                                <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
                                <p className="text-gray-500 font-medium">Cargando producción...</p>
                            </div>
                        ) : (
                            <form id="editarProduccionForm" onSubmit={handleSubmit} className="space-y-6">
                                {error && (
                                    <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 font-medium border border-red-200">{error}</div>
                                )}

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <FormSelect
                                        label="Turno"
                                        value={formData.turno}
                                        onChange={(e) => setFormData({ ...formData, turno: e.target.value })}
                                        options={TURNOS}
                                    />
                                    <FormInput
                                        label="Operario"
                                        value={formData.operario}
                                        onChange={(e) => setFormData({ ...formData, operario: e.target.value })}
                                    />
                                    <FormInput
                                        label="Cantidad Producida"
                                        type="number"
                                        step="0.01"
                                        value={formData.cantidadProducida}
                                        onChange={(e) => setFormData({ ...formData, cantidadProducida: e.target.value })}
                                    />
                                    <FormSelect
                                        label="Unidad"
                                        value={formData.unidad}
                                        onChange={(e) => setFormData({ ...formData, unidad: e.target.value })}
                                        options={UNIDADES}
                                    />
                                    <FormInput
                                        label="Merma (kg)"
                                        type="number"
                                        step="0.01"
                                        value={formData.merma}
                                        onChange={(e) => setFormData({ ...formData, merma: e.target.value })}
                                    />
                                    <div className="hidden sm:block"></div>
                                    <FormInput
                                        label="Hora Inicio"
                                        type="time"
                                        value={formData.horaInicio}
                                        onChange={(e) => setFormData({ ...formData, horaInicio: e.target.value })}
                                    />
                                    <FormInput
                                        label="Hora Fin"
                                        type="time"
                                        value={formData.horaFin}
                                        onChange={(e) => setFormData({ ...formData, horaFin: e.target.value })}
                                    />
                                </div>

                                <FormTextarea
                                    label="Observaciones"
                                    value={formData.observaciones}
                                    onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                                    rows={3}
                                />
                            </form>
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
                            form="editarProduccionForm"
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
                                    Actualizar Producción
                                </>
                            )}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
