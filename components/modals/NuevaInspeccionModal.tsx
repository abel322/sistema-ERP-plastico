'use client';

import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, ClipboardCheck, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { FormInput } from '@/components/forms/form-input';
import { FormSelect } from '@/components/forms/form-select';
import { FormTextarea } from '@/components/forms/form-textarea';

interface Parametro {
    id: string;
    nombre: string;
    valorMinimo?: number;
    valorMaximo?: number;
    unidad: string;
}

interface NuevaInspeccionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function NuevaInspeccionModal({ isOpen, onClose, onSuccess }: NuevaInspeccionModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [parametros, setParametros] = useState<Parametro[]>([]);

    const [formData, setFormData] = useState({
        lote: '',
        inspector: '',
        resultado: 'Aprobado',
        observaciones: '',
    });

    const [valoresParametros, setValoresParametros] = useState<Record<string, number>>({});

    useEffect(() => {
        if (isOpen) {
            fetchParametros();
            setFormData({
                lote: '',
                inspector: '',
                resultado: 'Aprobado',
                observaciones: '',
            });
            setValoresParametros({});
            setError('');
        }
    }, [isOpen]);

    const fetchParametros = async () => {
        try {
            const res = await fetch('/api/calidad/parametros?activo=true');
            if (res.ok) {
                const data = await res.json();
                setParametros(data);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleParametroChange = (parametroId: string, valor: number) => {
        setValoresParametros((prev) => ({ ...prev, [parametroId]: valor }));
    };

    const verificarCumplimiento = (parametro: Parametro, valor: number): boolean => {
        if (parametro.valorMinimo != null && valor < parametro.valorMinimo) return false;
        if (parametro.valorMaximo != null && valor > parametro.valorMaximo) return false;
        return true;
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const resultadosParams = Object.entries(valoresParametros).map(([parametroId, valor]) => {
            const param = parametros.find((p) => p.id === parametroId);
            return {
                parametroId,
                valorMedido: valor,
                cumple: param ? verificarCumplimiento(param, valor) : true,
            };
        });

        try {
            const res = await fetch('/api/calidad/inspecciones', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    resultadosParams,
                }),
            });

            if (res.ok) {
                onSuccess();
                onClose();
            } else {
                const data = await res.json();
                setError(data.error || 'Error al crear inspección');
            }
        } catch (error) {
            setError('Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    const resultadoOptions = [
        { value: 'Aprobado', label: 'Aprobado' },
        { value: 'AprobadoConObservaciones', label: 'Aprobado con Observaciones' },
        { value: 'Rechazado', label: 'Rechazado' },
    ];

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
                        <div className="bg-gradient-to-r from-teal-600 to-emerald-700 p-6 text-white">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-lg bg-white/20 p-2">
                                        <ClipboardCheck className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold">Nueva Inspección</h2>
                                        <p className="text-sm text-teal-100/80">Control de calidad y cumplimiento</p>
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
                            <form onSubmit={handleSubmit} className="space-y-6 text-gray-800">
                                {error && (
                                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm italic">
                                        {error}
                                    </div>
                                )}

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 italic text-gray-800">
                                    <FormInput
                                        label="Lote"
                                        name="lote"
                                        value={formData.lote}
                                        onChange={handleChange}
                                        placeholder="N° de lote..."
                                    />
                                    <FormInput
                                        label="Inspector"
                                        name="inspector"
                                        value={formData.inspector}
                                        onChange={handleChange}
                                        required
                                        placeholder="Nombre..."
                                    />
                                </div>

                                <FormSelect
                                    label="Resultado de Inspección"
                                    name="resultado"
                                    value={formData.resultado}
                                    onChange={handleChange}
                                    options={resultadoOptions}
                                    required
                                />

                                <div className="space-y-4 italic">
                                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider italic">Parámetros a Evaluar</h3>
                                    <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2 italic">
                                        {parametros.map((param) => {
                                            const valor = valoresParametros[param.id] || 0;
                                            const cumple = verificarCumplimiento(param, valor);
                                            const hasValue = valoresParametros[param.id] !== undefined;

                                            return (
                                                <div key={param.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 italic text-gray-800">
                                                    <div className="flex-1 italic">
                                                        <p className="text-sm font-semibold text-gray-800 italic">{param.nombre}</p>
                                                        <p className="text-[10px] text-gray-500 italic">
                                                            Rango: {param.valorMinimo ?? '-'} a {param.valorMaximo ?? '-'} {param.unidad}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2 italic">
                                                        <div className="relative w-24 italic">
                                                            <input
                                                                type="number"
                                                                value={valoresParametros[param.id] || ''}
                                                                onChange={(e) => handleParametroChange(param.id, parseFloat(e.target.value) || 0)}
                                                                className="w-full px-2 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none italic"
                                                                step="0.01"
                                                                placeholder="0.00"
                                                            />
                                                        </div>
                                                        <span className="text-[10px] font-bold text-gray-400 w-8 italic text-gray-800">{param.unidad}</span>
                                                        {hasValue && (
                                                            <motion.div
                                                                initial={{ scale: 0 }}
                                                                animate={{ scale: 1 }}
                                                                className={`p-1 rounded-full ${cumple ? 'bg-green-100' : 'bg-red-100'} italic`}
                                                            >
                                                                {cumple ? (
                                                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                                                ) : (
                                                                    <AlertCircle className="h-4 w-4 text-red-600" />
                                                                )}
                                                            </motion.div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <FormTextarea
                                    label="Observaciones"
                                    name="observaciones"
                                    value={formData.observaciones}
                                    onChange={handleChange}
                                    rows={2}
                                    placeholder="Detalles adicionales..."
                                />

                                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 italic text-gray-800">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="rounded-xl border border-gray-300 px-6 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors italic"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading || !formData.inspector}
                                        className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-700 px-8 py-2.5 text-sm font-semibold text-white shadow-lg shadow-teal-100 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 italic"
                                    >
                                        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                                        Guardar Inspección
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
