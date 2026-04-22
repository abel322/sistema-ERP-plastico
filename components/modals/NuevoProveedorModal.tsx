'use client';

import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Building2, Loader2 } from 'lucide-react';
import { FormInput } from '@/components/forms/form-input';
import { FormTextarea } from '@/components/forms/form-textarea';

interface NuevoProveedorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function NuevoProveedorModal({ isOpen, onClose, onSuccess }: NuevoProveedorModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        nombre: '',
        rif: '',
        direccion: '',
        telefono: '',
        email: '',
        contacto: '',
        condicionesPago: '',
        observaciones: '',
    });

    useEffect(() => {
        if (isOpen) {
            setFormData({
                nombre: '',
                rif: '',
                direccion: '',
                telefono: '',
                email: '',
                contacto: '',
                condicionesPago: '',
                observaciones: '',
            });
            setError('');
        }
    }, [isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/proveedores', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                onSuccess();
                onClose();
            } else {
                const data = await res.json();
                setError(data.error || 'Error al crear proveedor');
            }
        } catch (error) {
            setError('Error de conexión');
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
                        <div className="bg-gradient-to-r from-purple-600 to-indigo-700 p-6 text-white">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-lg bg-white/20 p-2">
                                        <Building2 className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold">Nuevo Proveedor</h2>
                                        <p className="text-sm text-purple-100/80">Registre un nuevo aliado comercial</p>
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
                            <form onSubmit={handleSubmit} className="space-y-4 text-gray-800">
                                {error && (
                                    <div className="rounded-lg bg-red-50 p-4 text-red-600 border border-red-100 text-sm italic">
                                        {error}
                                    </div>
                                )}

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <FormInput
                                        label="Nombre"
                                        name="nombre"
                                        value={formData.nombre}
                                        onChange={handleChange}
                                        required
                                        placeholder="Nombre del proveedor"
                                    />
                                    <FormInput
                                        label="RIF"
                                        name="rif"
                                        value={formData.rif}
                                        onChange={handleChange}
                                        required
                                        placeholder="J-12345678-9"
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <FormInput
                                        label="Teléfono"
                                        name="telefono"
                                        value={formData.telefono}
                                        onChange={handleChange}
                                        placeholder="0212-1234567"
                                    />
                                    <FormInput
                                        label="Email"
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="contacto@proveedor.com"
                                    />
                                </div>

                                <FormInput
                                    label="Persona de Contacto"
                                    name="contacto"
                                    value={formData.contacto}
                                    onChange={handleChange}
                                    placeholder="Nombre..."
                                />

                                <FormTextarea
                                    label="Dirección"
                                    name="direccion"
                                    value={formData.direccion}
                                    onChange={handleChange}
                                    rows={2}
                                    placeholder="Dirección completa"
                                />

                                <FormInput
                                    label="Condiciones de Pago"
                                    name="condicionesPago"
                                    value={formData.condicionesPago}
                                    onChange={handleChange}
                                    placeholder="Ej: 30 días, contado..."
                                />

                                <FormTextarea
                                    label="Observaciones"
                                    name="observaciones"
                                    value={formData.observaciones}
                                    onChange={handleChange}
                                    rows={2}
                                    placeholder="Notas adicionales..."
                                />

                                <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 italic">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="rounded-xl border border-gray-300 px-6 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading || !formData.nombre}
                                        className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-700 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-100 hover:from-purple-700 hover:to-indigo-800 disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="h-5 w-5 animate-spin" />
                                                Guardando...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="h-5 w-5" />
                                                Guardar Proveedor
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
