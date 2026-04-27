'use client';

import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Recycle } from 'lucide-react';
import { FormInput } from '@/components/forms/form-input';
import { FormSelect } from '@/components/forms/form-select';
import { FormTextarea } from '@/components/forms/form-textarea';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

const TURNOS = [
    { value: 'Manana', label: 'Mañana' },
    { value: 'Tarde', label: 'Tarde' },
    { value: 'Noche', label: 'Noche' },
];

interface Maquina {
    id: string;
    nombre: string;
    area: string;
}

interface NuevoPeletizadoModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function NuevoPeletizadoModal({ isOpen, onClose, onSuccess }: NuevoPeletizadoModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [maquinas, setMaquinas] = useState<Maquina[]>([]);

    const [formData, setFormData] = useState({
        fecha: new Date().toISOString().split('T')[0],
        turno: 'Manana',
        maquinaId: '',
        operario: '',
        materialEntrada: '',
        materialSalida: '',
        colorPelet: '',
        tipoMaterial: '',
        observaciones: '',
    });

    useEffect(() => {
        if (isOpen) {
            fetchMaquinas();
            setFormData({
                fecha: new Date().toISOString().split('T')[0],
                turno: 'Manana',
                maquinaId: '',
                operario: '',
                materialEntrada: '',
                materialSalida: '',
                colorPelet: '',
                tipoMaterial: '',
                observaciones: '',
            });
            setError('');
        }
    }, [isOpen]);

    const fetchMaquinas = async () => {
        try {
            const res = await fetch('/api/maquinas?area=Extrusion&activa=true');
            const data = await res.json();
            setMaquinas(data || []);
        } catch (error) {
            console.error('Error fetching maquinas:', error);
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/peletizado', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Error al crear registro');
            }

            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const entrada = parseFloat(formData.materialEntrada) || 0;
    const salida = parseFloat(formData.materialSalida) || 0;
    const mermaCalculada = entrada > salida ? entrada - salida : 0;
    const eficiencia = entrada > 0 ? ((salida / entrada) * 100).toFixed(1) : '0';

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
                    <div className="flex items-center justify-between p-6 bg-gradient-to-r from-green-600 to-emerald-600 text-white">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-lg">
                                <Recycle className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">Nuevo Peletizado</h2>
                                <p className="text-green-100 text-sm">Registrar proceso de peletizado</p>
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
                        <form id="nuevoPeletizadoForm" onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <div className="rounded-lg bg-red-50 p-4 text-red-600 border border-red-200">{error}</div>
                            )}

                            <div className="rounded-xl border border-green-100 bg-green-50/50 p-5">
                                <h3 className="mb-4 flex items-center gap-2 font-semibold text-green-800">
                                    Datos del Proceso
                                </h3>
                                <div className="grid gap-4 sm:grid-cols-3">
                                    <FormInput
                                        label="Fecha"
                                        type="date"
                                        value={formData.fecha}
                                        onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                                        required
                                    />
                                    <FormSelect
                                        label="Turno"
                                        value={formData.turno}
                                        onChange={(e) => setFormData({ ...formData, turno: e.target.value })}
                                        required
                                    >
                                        {TURNOS.map((t) => (
                                            <option key={t.value} value={t.value}>{t.label}</option>
                                        ))}
                                    </FormSelect>
                                    <FormSelect
                                        label="Máquina"
                                        value={formData.maquinaId}
                                        onChange={(e) => setFormData({ ...formData, maquinaId: e.target.value })}
                                        required
                                    >
                                        <option value="">Seleccione...</option>
                                        {maquinas.map((m) => (
                                            <option key={m.id} value={m.id}>{m.nombre}</option>
                                        ))}
                                    </FormSelect>
                                </div>
                            </div>

                            <FormInput
                                label="Operario"
                                value={formData.operario}
                                onChange={(e) => setFormData({ ...formData, operario: e.target.value })}
                                placeholder="Nombre del operario"
                                required
                            />

                            <div className="grid gap-4 sm:grid-cols-2">
                                <FormInput
                                    label="Material Entrada (kg)"
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    value={formData.materialEntrada}
                                    onChange={(e) => setFormData({ ...formData, materialEntrada: e.target.value })}
                                    required
                                />
                                <FormInput
                                    label="Material Salida (kg)"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={formData.materialSalida}
                                    onChange={(e) => setFormData({ ...formData, materialSalida: e.target.value })}
                                    required
                                />
                            </div>

                            {/* Resumen calculado */}
                            {entrada > 0 && salida > 0 && (
                                <div className="rounded-xl bg-gray-50 border border-gray-100 p-5">
                                    <h4 className="mb-3 font-semibold text-gray-700 text-sm uppercase tracking-wider">Resumen del Proceso</h4>
                                    <div className="grid grid-cols-3 gap-4 text-center divide-x divide-gray-200">
                                        <div>
                                            <p className="text-2xl font-bold text-gray-900">{entrada} <span className="text-sm font-normal text-gray-500">kg</span></p>
                                            <p className="text-sm font-medium text-gray-500">Entrada</p>
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold text-red-600">{mermaCalculada.toFixed(2)} <span className="text-sm font-normal text-red-400">kg</span></p>
                                            <p className="text-sm font-medium text-gray-500">Merma</p>
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold text-green-600">{eficiencia}<span className="text-sm font-normal text-green-500">%</span></p>
                                            <p className="text-sm font-medium text-gray-500">Eficiencia</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="grid gap-4 sm:grid-cols-2">
                                <FormInput
                                    label="Color del Pelet"
                                    value={formData.colorPelet}
                                    onChange={(e) => setFormData({ ...formData, colorPelet: e.target.value })}
                                    placeholder="Ej: Blanco, Negro, Natural"
                                />
                                <FormInput
                                    label="Tipo de Material"
                                    value={formData.tipoMaterial}
                                    onChange={(e) => setFormData({ ...formData, tipoMaterial: e.target.value })}
                                    placeholder="Ej: PEBD, PEAD, PP"
                                />
                            </div>

                            <FormTextarea
                                label="Observaciones"
                                value={formData.observaciones}
                                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                                rows={3}
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
                            form="nuevoPeletizadoForm"
                            disabled={loading || !formData.maquinaId}
                            className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl shadow-sm hover:shadow active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            {loading ? <LoadingSpinner /> : <><Save className="w-4 h-4" /> Registrar</>}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
