'use client';

import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Lightbulb, Loader2 } from 'lucide-react';
import { FormInput } from '@/components/forms/form-input';
import { FormTextarea } from '@/components/forms/form-textarea';
import { FormSelect } from '@/components/forms/form-select';

interface Maquina {
    id: string;
    nombre: string;
    area: string;
}

interface NuevaMejoraModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function NuevaMejoraModal({ isOpen, onClose, onSuccess }: NuevaMejoraModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [maquinas, setMaquinas] = useState<Maquina[]>([]);

    const [formData, setFormData] = useState({
        maquinaId: '',
        titulo: '',
        descripcion: '',
        problema: '',
        solucionPropuesta: '',
        responsable: '',
        costoEstimado: '',
        ahorroEstimado: '',
        observaciones: '',
    });

    useEffect(() => {
        if (isOpen) {
            fetchMaquinas();
            setFormData({
                maquinaId: '',
                titulo: '',
                descripcion: '',
                problema: '',
                solucionPropuesta: '',
                responsable: '',
                costoEstimado: '',
                ahorroEstimado: '',
                observaciones: '',
            });
            setError('');
        }
    }, [isOpen]);

    const fetchMaquinas = async () => {
        try {
            const res = await fetch('/api/maquinas');
            if (res.ok) {
                const data = await res.json();
                setMaquinas(data);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/mejoras', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                onSuccess();
                onClose();
            } else {
                const data = await res.json();
                setError(data.error || 'Error al crear mejora');
            }
        } catch (error) {
            setError('Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    const maquinaOptions = maquinas.map((m) => ({
        value: m.id,
        label: `${m.nombre} (${m.area})`,
    }));

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-yellow-500 to-amber-600 p-6 text-white">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-lg bg-white/20 p-2">
                                        <Lightbulb className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold">Nueva Propuesta</h2>
                                        <p className="text-sm text-yellow-100/80">Registre una nueva idea de mejora</p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="rounded-full p-2 hover:bg-white/10 transition-colors"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>
                        </div>

                        <div className="max-h-[80vh] overflow-y-auto p-6 text-gray-800">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {error && (
                                    <div className="rounded-lg bg-red-50 p-4 text-red-600 border border-red-100 text-sm italic">
                                        {error}
                                    </div>
                                )}

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <FormSelect
                                        label="Máquina"
                                        name="maquinaId"
                                        value={formData.maquinaId}
                                        onChange={handleChange}
                                        options={maquinaOptions}
                                        required
                                        placeholder="Seleccione..."
                                    />
                                    <FormInput
                                        label="Responsable"
                                        name="responsable"
                                        value={formData.responsable}
                                        onChange={handleChange}
                                        required
                                        placeholder="Nombre..."
                                    />
                                </div>

                                <FormInput
                                    label="Título de la Mejora"
                                    name="titulo"
                                    value={formData.titulo}
                                    onChange={handleChange}
                                    required
                                    placeholder="Ej: Optimización de..."
                                />

                                <FormTextarea
                                    label="Problema Identificado"
                                    name="problema"
                                    value={formData.problema}
                                    onChange={handleChange}
                                    required
                                    rows={2}
                                    placeholder="¿Qué problema desea resolver?"
                                />

                                <FormTextarea
                                    label="Solución Propuesta"
                                    name="solucionPropuesta"
                                    value={formData.solucionPropuesta}
                                    onChange={handleChange}
                                    required
                                    rows={2}
                                    placeholder="¿Cuál es su propuesta?"
                                />

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <FormInput
                                        label="Costo Estimado ($)"
                                        name="costoEstimado"
                                        type="number"
                                        value={formData.costoEstimado}
                                        onChange={handleChange}
                                        placeholder="0.00"
                                        step="0.01"
                                    />
                                    <FormInput
                                        label="Ahorro Estimado ($)"
                                        name="ahorroEstimado"
                                        type="number"
                                        value={formData.ahorroEstimado}
                                        onChange={handleChange}
                                        placeholder="0.00"
                                        step="0.01"
                                    />
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 text-gray-800">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="rounded-xl border border-gray-300 px-6 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading || !formData.maquinaId}
                                        className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-yellow-100 hover:from-yellow-600 hover:to-amber-700 disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="h-5 w-5 animate-spin" />
                                                Guardando...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="h-5 w-5" />
                                                Guardar Propuesta
                                            </>
                                        )}
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
