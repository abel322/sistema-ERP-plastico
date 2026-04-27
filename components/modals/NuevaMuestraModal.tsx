'use client';

import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, TestTube2, Loader2 } from 'lucide-react';
import { FormInput } from '@/components/forms/form-input';
import { FormSelect } from '@/components/forms/form-select';
import { FormTextarea } from '@/components/forms/form-textarea';

const TIPOS = [
    { value: 'Produccion', label: 'Producción' },
    { value: 'ClienteNuevo', label: 'Cliente Nuevo' },
    { value: 'Reclamo', label: 'Reclamo' },
];

const UNIDADES = [
    { value: 'Unidades', label: 'Unidades' },
    { value: 'Kilogramos', label: 'Kilogramos' },
    { value: 'Metros', label: 'Metros' },
];

interface Cliente {
    id: string;
    nombre: string;
}

interface NuevaMuestraModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function NuevaMuestraModal({ isOpen, onClose, onSuccess }: NuevaMuestraModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [clientes, setClientes] = useState<Cliente[]>([]);

    const [formData, setFormData] = useState({
        clienteId: '',
        tipo: 'Produccion',
        descripcion: '',
        cantidad: '',
        unidad: 'Unidades',
        responsable: '',
        observaciones: '',
        fecha: new Date().toISOString().split('T')[0],
    });

    useEffect(() => {
        if (isOpen) {
            fetchClientes();
            setFormData({
                clienteId: '',
                tipo: 'Produccion',
                descripcion: '',
                cantidad: '',
                unidad: 'Unidades',
                responsable: '',
                observaciones: '',
                fecha: new Date().toISOString().split('T')[0],
            });
            setError('');
        }
    }, [isOpen]);

    const fetchClientes = async () => {
        try {
            const res = await fetch('/api/clientes?limit=1000');
            const data = await res.json();
            setClientes(data.clientes || []);
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/muestras', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Error al crear muestra');
            }

            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

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
                        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-lg bg-white/20 p-2">
                                        <TestTube2 className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold">Nueva Muestra</h2>
                                        <p className="text-sm text-purple-100/80">Registrar muestra de producción</p>
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

                        <div className="max-h-[80vh] overflow-y-auto p-6">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {error && (
                                    <div className="rounded-lg bg-red-50 p-4 text-red-600 border border-red-100 text-sm italic">
                                        {error}
                                    </div>
                                )}

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <FormSelect
                                        label="Cliente"
                                        value={formData.clienteId}
                                        onChange={(e) => setFormData({ ...formData, clienteId: e.target.value })}
                                        required
                                    >
                                        <option value="">Seleccione un cliente...</option>
                                        {clientes.map((c) => (
                                            <option key={c.id} value={c.id}>{c.nombre}</option>
                                        ))}
                                    </FormSelect>
                                    <FormSelect
                                        label="Tipo de Muestra"
                                        value={formData.tipo}
                                        onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                                        required
                                    >
                                        {TIPOS.map((t) => (
                                            <option key={t.value} value={t.value}>{t.label}</option>
                                        ))}
                                    </FormSelect>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <FormInput
                                        label="Fecha"
                                        type="date"
                                        value={formData.fecha}
                                        onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                                        required
                                    />
                                    <FormInput
                                        label="Responsable"
                                        value={formData.responsable}
                                        onChange={(e) => setFormData({ ...formData, responsable: e.target.value })}
                                        placeholder="Nombre del responsable"
                                        required
                                    />
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <FormInput
                                        label="Cantidad"
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        value={formData.cantidad}
                                        onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })}
                                        required
                                    />
                                    <FormSelect
                                        label="Unidad"
                                        value={formData.unidad}
                                        onChange={(e) => setFormData({ ...formData, unidad: e.target.value })}
                                    >
                                        {UNIDADES.map((u) => (
                                            <option key={u.value} value={u.value}>{u.label}</option>
                                        ))}
                                    </FormSelect>
                                </div>

                                <FormTextarea
                                    label="Descripción"
                                    value={formData.descripcion}
                                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                                    placeholder="Descripción de la muestra"
                                    rows={2}
                                />

                                <FormTextarea
                                    label="Observaciones"
                                    value={formData.observaciones}
                                    onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                                    rows={2}
                                />

                                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="rounded-xl border border-gray-300 px-6 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading || !formData.clienteId}
                                        className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-200 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="h-5 w-5 animate-spin" />
                                                Guardando...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="h-5 w-5" />
                                                Registrar Muestra
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
