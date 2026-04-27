'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, AlertTriangle } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface Cliente {
    id: string;
    nombre: string;
}

interface EditDevolucionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    producto: any; // Ideally replace with strong type if available
}

export function EditDevolucionModal({ isOpen, onClose, onSuccess, producto }: EditDevolucionModalProps) {
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        clienteId: '',
        areaOrigen: 'Ninguna',
        descripcion: '',
        cantidadTotal: '',
        unidad: 'Unidades',
        tipoProducto: 'Bolsa',
        conImpresion: false,
        estado: 'Defectuoso',
        siguienteArea: 'Ninguna'
    });

    useEffect(() => {
        if (isOpen) {
            fetchClientes();
            if (producto) {
                setFormData({
                    clienteId: producto.clienteId || '',
                    areaOrigen: producto.areaOrigen || 'Ninguna',
                    descripcion: producto.descripcion || '',
                    cantidadTotal: producto.cantidadDisponible?.toString() || '',
                    unidad: producto.unidad || 'Unidades',
                    tipoProducto: producto.tipoProducto || 'Bolsa',
                    conImpresion: producto.conImpresion || false,
                    estado: 'Defectuoso',
                    siguienteArea: producto.siguienteArea || 'Ninguna'
                });
            } else {
                setFormData({
                    clienteId: '',
                    areaOrigen: 'Ninguna',
                    descripcion: '',
                    cantidadTotal: '',
                    unidad: 'Unidades',
                    tipoProducto: 'Bolsa',
                    conImpresion: false,
                    estado: 'Defectuoso',
                    siguienteArea: 'Ninguna'
                });
            }
        }
    }, [isOpen, producto]);

    const fetchClientes = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/clientes?limit=1000');
            const data = await res.json();
            setClientes(data.clientes || data || []);
        } catch (error) {
            console.error('Error fetching clientes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.clienteId || !formData.cantidadTotal) {
            alert('Por favor complete todos los campos requeridos.');
            return;
        }

        try {
            setSaving(true);
            const res = await fetch(`/api/producto-terminado/${producto?.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    cantidadTotal: parseFloat(formData.cantidadTotal),
                    cantidadDisponible: parseFloat(formData.cantidadTotal) // Actualizar disponible también en devolución
                })
            });

            if (res.ok) {
                onSuccess();
                onClose();
            } else {
                const err = await res.json();
                alert(err.error || 'Error al actualizar el producto defectuoso');
            }
        } catch (error) {
            console.error(error);
            alert('Ocurrió un error inesperado al actualizar.');
        } finally {
            setSaving(false);
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
                    className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-lg">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">Editar Devolución</h2>
                                <p className="text-blue-100 text-sm">Modificar detalles de la devolución</p>
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
                        {loading ? (
                            <div className="flex justify-center p-8"><LoadingSpinner /></div>
                        ) : (
                            <form id="nuevaDevolucionForm" onSubmit={handleSubmit} className="space-y-5">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-gray-700">Cliente *</label>
                                    <select
                                        required
                                        value={formData.clienteId}
                                        onChange={(e) => setFormData({ ...formData, clienteId: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:bg-white transition-all outline-none"
                                    >
                                        <option value="">Seleccione un cliente...</option>
                                        {clientes.map(c => (
                                            <option key={c.id} value={c.id}>{c.nombre}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-gray-700">Cantidad Defectuosa *</label>
                                        <input
                                            required
                                            type="number"
                                            step="0.01"
                                            min="0.1"
                                            value={formData.cantidadTotal}
                                            onChange={(e) => setFormData({ ...formData, cantidadTotal: e.target.value })}
                                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:bg-white transition-all outline-none"
                                            placeholder="Ej. 1500"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-gray-700">Unidad *</label>
                                        <select
                                            value={formData.unidad}
                                            onChange={(e) => setFormData({ ...formData, unidad: e.target.value })}
                                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:bg-white transition-all outline-none"
                                        >
                                            <option value="Unidades">Unidades</option>
                                            <option value="Kilogramos">Kilogramos</option>
                                            <option value="Metros">Metros</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-gray-700">Tipo de Producto</label>
                                        <select
                                            value={formData.tipoProducto}
                                            onChange={(e) => setFormData({ ...formData, tipoProducto: e.target.value })}
                                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:bg-white transition-all outline-none"
                                        >
                                            <option value="Bolsa">Bolsa</option>
                                            <option value="Bobina">Bobina</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-gray-700">Área Origen</label>
                                        <select
                                            value={formData.areaOrigen}
                                            onChange={(e) => setFormData({ ...formData, areaOrigen: e.target.value })}
                                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:bg-white transition-all outline-none"
                                        >
                                            <option value="Ninguna">Externa / Cliente</option>
                                            <option value="Extrusion">Extrusión</option>
                                            <option value="Sellado">Sellado</option>
                                            <option value="Serigrafia">Serigrafía</option>
                                            <option value="Refilado">Refilado</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                    <input
                                        type="checkbox"
                                        id="conImpresion"
                                        checked={formData.conImpresion}
                                        onChange={(e) => setFormData({ ...formData, conImpresion: e.target.checked })}
                                        className="w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500"
                                    />
                                    <label htmlFor="conImpresion" className="text-sm font-medium text-gray-700 cursor-pointer">
                                        ¿Producto con impresión (Serigrafía)?
                                    </label>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-gray-700">Razón / Descripción (Opcional)</label>
                                    <textarea
                                        value={formData.descripcion}
                                        onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:bg-white transition-all outline-none resize-none"
                                        rows={3}
                                        placeholder="Motivo de la devolución o detalle del defecto..."
                                    />
                                </div>

                            </form>
                        )}
                    </div>

                    {/* Footer Action */}
                    <div className="p-5 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={saving}
                            className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-all disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            form="nuevaDevolucionForm"
                            disabled={saving || loading}
                            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm hover:shadow active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            {saving ? <LoadingSpinner /> : <><Save className="w-4 h-4" /> Actualizar Devolución</>}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
