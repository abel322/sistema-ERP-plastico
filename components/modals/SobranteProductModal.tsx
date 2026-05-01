'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, PackagePlus, User, Tag } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface SobranteProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editData?: any;
}

const TIPOS_SOBRANTE = [
    'Bobina con impresión',
    'Bobina sin impresión',
    'Bobina refilada',
    'Bolsa impresa',
    'Bolsa no impresa',
    'Bobinas de empaque',
    'Bolsa de empaque',
    'Bobina de ASA S/I 15Kg',
    'Bobina de ASA S/I 10Kg'
];

interface Cliente {
    id: string;
    nombre: string;
}

interface Producto {
    id: string;
    nombreProducto: string;
    ancho?: number;
    largo?: number;
    calibre?: number;
}

export function SobranteProductModal({ isOpen, onClose, onSuccess, editData }: SobranteProductModalProps) {
    const [saving, setSaving] = useState(false);
    const [loadingData, setLoadingData] = useState(false);
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [productos, setProductos] = useState<Producto[]>([]);

    const [formData, setFormData] = useState({
        tipo: TIPOS_SOBRANTE[0],
        cantidad: '',
        unidad: 'Kilogramos',
        descripcion: '',
        fecha: new Date().toISOString().split('T')[0],
        clienteId: '',
        productoId: '',
        ancho: '',
        largo: '',
        calibre: '',
        fuelles: '',
        anchoTroquel: '',
        largoTroquel: ''
    });

    useEffect(() => {
        if (isOpen) {
            fetchClientes();
            if (editData) {
                setFormData({
                    tipo: editData.tipo,
                    cantidad: editData.cantidad.toString(),
                    unidad: editData.unidad,
                    descripcion: editData.descripcion || '',
                    fecha: new Date(editData.fecha).toISOString().split('T')[0],
                    clienteId: editData.clienteId || '',
                    productoId: editData.productoId || '',
                    ancho: editData.ancho?.toString() || '',
                    largo: editData.largo?.toString() || '',
                    calibre: editData.calibre?.toString() || '',
                    fuelles: editData.fuelles?.toString() || '',
                    anchoTroquel: editData.anchoTroquel?.toString() || '',
                    largoTroquel: editData.largoTroquel?.toString() || ''
                });
                if (editData.clienteId) {
                    fetchProductos(editData.clienteId);
                }
            } else {
                setFormData({
                    tipo: TIPOS_SOBRANTE[0],
                    cantidad: '',
                    unidad: 'Kilogramos',
                    descripcion: '',
                    fecha: new Date().toISOString().split('T')[0],
                    clienteId: '',
                    productoId: '',
                    ancho: '',
                    largo: '',
                    calibre: '',
                    fuelles: '',
                    anchoTroquel: '',
                    largoTroquel: ''
                });
                setProductos([]);
            }
        }
    }, [isOpen, editData]);

    const fetchClientes = async () => {
        try {
            setLoadingData(true);
            const res = await fetch('/api/clientes?limit=1000');
            const data = await res.json();
            setClientes(data.clientes || data || []);
        } catch (error) {
            console.error('Error fetching clientes:', error);
        } finally {
            setLoadingData(false);
        }
    };

    const fetchProductos = async (clienteId: string) => {
        try {
            const res = await fetch(`/api/clientes/${clienteId}/productos`);
            const data = await res.json();
            setProductos(data || []);
        } catch (error) {
            console.error('Error fetching productos:', error);
        }
    };

    const handleClienteChange = (clienteId: string) => {
        setFormData(prev => ({ ...prev, clienteId, productoId: '', ancho: '', largo: '', calibre: '' }));
        if (clienteId) {
            fetchProductos(clienteId);
        } else {
            setProductos([]);
        }
    };

    const handleProductoChange = (productoId: string) => {
        const producto = productos.find(p => p.id === productoId);
        setFormData(prev => ({ 
            ...prev, 
            productoId,
            ancho: producto?.ancho?.toString() || prev.ancho,
            largo: producto?.largo?.toString() || prev.largo,
            calibre: producto?.calibre?.toString() || prev.calibre
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.cantidad) {
            alert('Por favor ingrese la cantidad.');
            return;
        }

        try {
            setSaving(true);
            const url = editData 
                ? `/api/producto-sobrante/${editData.id}` 
                : '/api/producto-sobrante';
            
            const method = editData ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    cantidad: parseFloat(formData.cantidad),
                    ancho: formData.ancho ? parseFloat(formData.ancho) : null,
                    largo: formData.largo ? parseFloat(formData.largo) : null,
                    calibre: formData.calibre ? parseFloat(formData.calibre) : null,
                    fuelles: formData.fuelles ? parseFloat(formData.fuelles) : null,
                    anchoTroquel: formData.anchoTroquel ? parseFloat(formData.anchoTroquel) : null,
                    largoTroquel: formData.largoTroquel ? parseFloat(formData.largoTroquel) : null,
                })
            });

            if (res.ok) {
                onSuccess();
                onClose();
            } else {
                const err = await res.json();
                alert(err.error || 'Error al guardar el producto sobrante');
            }
        } catch (error) {
            console.error(error);
            alert('Ocurrió un error inesperado al guardar.');
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    const isEmpaque = formData.tipo === 'Bobinas de empaque' || formData.tipo === 'Bolsa de empaque';

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 bg-gradient-to-r from-slate-800 to-slate-950 text-white">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-lg">
                                <PackagePlus className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold uppercase tracking-tight">{editData ? 'Editar' : 'Registrar'} Producto Sobrante</h2>
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Gestión de Stock Especial</p>
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
                    <div className="flex-1 overflow-y-auto p-8">
                        <form id="sobranteProductForm" onSubmit={handleSubmit} className="space-y-6">
                            
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Tag className="w-3 h-3" /> Tipo de Producto *
                                </label>
                                <select
                                    required
                                    value={formData.tipo}
                                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-slate-500 focus:bg-white dark:focus:bg-slate-800 transition-all outline-none text-slate-900 dark:text-white font-medium"
                                >
                                    {TIPOS_SOBRANTE.map(t => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                            </div>

                            {!isEmpaque && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700"
                                >
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <User className="w-3 h-3" /> Cliente
                                        </label>
                                        <select
                                            value={formData.clienteId}
                                            onChange={(e) => handleClienteChange(e.target.value)}
                                            className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-slate-500 outline-none transition-all text-sm font-medium"
                                        >
                                            <option value="">Seleccione Cliente (Opcional)</option>
                                            {clientes.map(c => (
                                                <option key={c.id} value={c.id}>{c.nombre}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <PackagePlus className="w-3 h-3" /> Producto
                                        </label>
                                        <select
                                            value={formData.productoId}
                                            onChange={(e) => handleProductoChange(e.target.value)}
                                            disabled={!formData.clienteId}
                                            className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-slate-500 outline-none transition-all text-sm font-medium disabled:opacity-50"
                                        >
                                            <option value="">Seleccione Producto (Opcional)</option>
                                            {productos.map(p => (
                                                <option key={p.id} value={p.id}>{p.nombreProducto}</option>
                                            ))}
                                        </select>
                                    </div>
                                </motion.div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ancho (cm)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={formData.ancho}
                                        onChange={(e) => setFormData({ ...formData, ancho: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-slate-500 outline-none transition-all text-sm"
                                        placeholder="0.0"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Largo (cm)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={formData.largo}
                                        onChange={(e) => setFormData({ ...formData, largo: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-slate-500 outline-none transition-all text-sm"
                                        placeholder="0.0"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Calibre</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={formData.calibre}
                                        onChange={(e) => setFormData({ ...formData, calibre: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-slate-500 outline-none transition-all text-sm"
                                        placeholder="0.0"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fuelles (cm)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={formData.fuelles}
                                        onChange={(e) => setFormData({ ...formData, fuelles: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-slate-500 outline-none transition-all text-sm"
                                        placeholder="0.0"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ancho Troquel (cm)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={formData.anchoTroquel}
                                        onChange={(e) => setFormData({ ...formData, anchoTroquel: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-slate-500 outline-none transition-all text-sm"
                                        placeholder="0.0"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Largo Troquel (cm)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={formData.largoTroquel}
                                        onChange={(e) => setFormData({ ...formData, largoTroquel: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-slate-500 outline-none transition-all text-sm"
                                        placeholder="0.0"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cantidad *</label>
                                    <input
                                        required
                                        type="number"
                                        step="0.01"
                                        min="0.1"
                                        value={formData.cantidad}
                                        onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-slate-500 outline-none transition-all text-sm font-bold"
                                        placeholder="Ej. 50.5"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Unidad *</label>
                                    <select
                                        value={formData.unidad}
                                        onChange={(e) => setFormData({ ...formData, unidad: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-slate-500 outline-none transition-all text-sm font-bold"
                                    >
                                        <option value="Kilogramos">Kilogramos</option>
                                        <option value="Unidades">Unidades</option>
                                        <option value="Metros">Metros</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha</label>
                                <input
                                    type="date"
                                    value={formData.fecha}
                                    onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-slate-500 outline-none transition-all text-sm"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Descripción / Observaciones</label>
                                <textarea
                                    value={formData.descripcion}
                                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-slate-500 outline-none resize-none transition-all text-sm"
                                    rows={2}
                                    placeholder="Detalles adicionales sobre este material sobrante..."
                                />
                            </div>

                        </form>
                    </div>

                    {/* Footer Action */}
                    <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={saving}
                            className="px-6 py-2.5 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            form="sobranteProductForm"
                            disabled={saving}
                            className="px-8 py-2.5 bg-slate-900 dark:bg-white dark:text-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            {saving ? <LoadingSpinner /> : <><Save className="w-4 h-4" /> {editData ? 'Actualizar' : 'Guardar'} Stock</>}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
