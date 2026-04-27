import { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, PackageMinus } from 'lucide-react';
import { FormInput } from '@/components/forms/form-input';

interface RegistrarConsumoModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    inventarioId?: string;
    inventarioNombre?: string;
    stockActual?: number;
}

export function RegistrarConsumoModal({ isOpen, onClose, onSuccess, inventarioId, inventarioNombre, stockActual }: RegistrarConsumoModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        cantidad: '',
        motivo: 'Consumo en producción',
        referencia: '',
    });

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!inventarioId) {
            setError('Item de inventario no seleccionado');
            return;
        }

        const cantidadOut = parseFloat(formData.cantidad);

        if (isNaN(cantidadOut) || cantidadOut <= 0) {
            setError('La cantidad debe ser mayor a 0');
            return;
        }

        if (stockActual !== undefined && cantidadOut > stockActual) {
            setError(`No hay stock suficiente (Disponible: ${stockActual})`);
            return;
        }

        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/inventario/movimientos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    inventarioId,
                    tipo: 'Salida',
                    cantidad: cantidadOut,
                    motivo: formData.motivo,
                    referencia: formData.referencia
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Error al registrar consumo');
            }

            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || 'Error desconocido');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative"
                >
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-orange-100/50 text-orange-600">
                                <PackageMinus className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">Registrar Consumo</h2>
                                <p className="text-sm text-gray-500">Descontar material del inventario</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-4 relative z-10 bg-white">
                        {error && (
                            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100">
                                {error}
                            </div>
                        )}

                        <div className="bg-orange-50/50 border border-orange-100 rounded-xl p-4">
                            <span className="text-sm text-orange-600 font-medium block mb-1">Stock Disponible</span>
                            <div className="flex items-baseline justify-between">
                                <p className="text-gray-900 font-medium">{inventarioNombre}</p>
                                <p className="text-xl font-bold text-orange-700">{stockActual} kg</p>
                            </div>
                        </div>

                        <FormInput
                            label="Cantidad a Consumir (kg)"
                            type="number"
                            required
                            min="0.1"
                            step="0.1"
                            value={formData.cantidad}
                            onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })}
                            placeholder="Ej: 50"
                        />

                        <FormInput
                            label="Motivo o Destino"
                            type="text"
                            required
                            value={formData.motivo}
                            onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                            placeholder="Ej: Consumo en Extrusión Lote #123"
                        />

                        <FormInput
                            label="Orden de Producción Asociada (Opcional)"
                            type="text"
                            value={formData.referencia}
                            onChange={(e) => setFormData({ ...formData, referencia: e.target.value })}
                            placeholder="Ej: OP-2024-001"
                        />

                        <div className="pt-4 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={loading || !formData.cantidad}
                                className="px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors disabled:opacity-50"
                            >
                                {loading ? 'Procesando...' : 'Confirmar Consumo'}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
