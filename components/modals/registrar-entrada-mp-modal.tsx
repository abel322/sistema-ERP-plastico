import { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, PackagePlus, AlertCircle } from 'lucide-react';
import { FormInput } from '@/components/forms/form-input';

interface InventarioItem {
    id: string;
    nombre: string;
    codigo: string;
    unidad: string;
}

interface RegistrarEntradaMPModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    stockItems: InventarioItem[];
}

export function RegistrarEntradaMPModal({ isOpen, onClose, onSuccess, stockItems }: RegistrarEntradaMPModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const [formData, setFormData] = useState({
        inventarioId: '',
        cantidad: '',
        lote: '',
        tipo: '',
        fluidez: '',
        densidad: '',
        fecha: new Date().toISOString().split('T')[0]
    });

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!formData.inventarioId) {
            setError('Debes seleccionar un material');
            return;
        }

        const qty = parseFloat(formData.cantidad);
        if (isNaN(qty) || qty <= 0) {
            setError('La cantidad debe ser mayor a 0');
            return;
        }

        setLoading(true);
        setError('');
        setSuccessMsg('');

        try {
            const res = await fetch('/api/inventario/materia-prima/entrada', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Error al registrar entrada');
            }

            setSuccessMsg('Entrada registrada exitosamente');
            onSuccess();
            setTimeout(() => {
                onClose();
                // Reset form
                setFormData({
                    inventarioId: '',
                    cantidad: '',
                    lote: '',
                    tipo: '',
                    fluidez: '',
                    densidad: '',
                    fecha: new Date().toISOString().split('T')[0]
                });
                setSuccessMsg('');
            }, 1500);

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
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden relative"
                >
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-blue-100/50 text-blue-600">
                                <PackagePlus className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">Registrar Entrada MP</h2>
                                <p className="text-sm text-gray-500">Ingreso de resinas y aditivos al almacén</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="max-h-[75vh] overflow-y-auto p-6 relative z-10 bg-white custom-scrollbar">
                        <form onSubmit={handleSubmit} className="space-y-5">

                            {error && (
                                <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100 flex items-start gap-2">
                                    <AlertCircle className="h-4 w-4 mt-0.5" />
                                    <span>{error}</span>
                                </div>
                            )}

                            {successMsg && (
                                <div className="p-3 text-sm text-green-700 bg-green-50 rounded-lg border border-green-200">
                                    {successMsg}
                                </div>
                            )}

                            <div className="space-y-4">
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium text-gray-700">Material <span className="text-red-500">*</span></label>
                                    <select
                                        required
                                        value={formData.inventarioId}
                                        onChange={(e) => setFormData({ ...formData, inventarioId: e.target.value })}
                                        className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                                    >
                                        <option value="">Seleccione el material recibido</option>
                                        {stockItems.map(item => (
                                            <option key={item.id} value={item.id}>
                                                {item.nombre} ({item.codigo}) - En: {item.unidad}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <FormInput
                                        label="Cantidad (Kg)"
                                        type="number"
                                        required
                                        min="1"
                                        step="0.1"
                                        value={formData.cantidad}
                                        onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })}
                                        placeholder="Ej: 500"
                                    />
                                    <FormInput
                                        label="Lote / Referencia"
                                        type="text"
                                        required
                                        value={formData.lote}
                                        onChange={(e) => setFormData({ ...formData, lote: e.target.value })}
                                        placeholder="Ej: L-2024-001"
                                    />
                                </div>

                                <div className="text-xs font-semibold uppercase text-gray-400 tracking-wider mt-4">
                                    Parámetros de Calidad (Opcional)
                                </div>

                                <div className="grid grid-cols-3 gap-3">
                                    <FormInput
                                        label="Tipo"
                                        type="text"
                                        value={formData.tipo}
                                        onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                                        placeholder="Ej: Virgen"
                                    />
                                    <FormInput
                                        label="Índ. Fluidez"
                                        type="text"
                                        value={formData.fluidez}
                                        onChange={(e) => setFormData({ ...formData, fluidez: e.target.value })}
                                        placeholder="Ej: 1.2"
                                    />
                                    <FormInput
                                        label="Densidad"
                                        type="text"
                                        value={formData.densidad}
                                        onChange={(e) => setFormData({ ...formData, densidad: e.target.value })}
                                        placeholder="Ej: 0.920"
                                    />
                                </div>

                                <FormInput
                                    label="Fecha de Recepción"
                                    type="date"
                                    required
                                    value={formData.fecha}
                                    onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                                />
                            </div>

                            <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading || !formData.inventarioId || successMsg !== ''}
                                    className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    {loading ? (
                                        <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : null}
                                    {loading ? 'Procesando...' : 'Registrar Ingreso'}
                                </button>
                            </div>
                        </form>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
