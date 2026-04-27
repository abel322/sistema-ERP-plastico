'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Package, Calendar, Info, CheckCircle, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ProductoTerminado {
    id: string;
    produccionId: string;
    pedidoId: string | null;
    clienteId: string;
    areaOrigen: string;
    descripcion: string | null;
    cantidadTotal: number;
    cantidadDisponible: number;
    unidad: string;
    tipoProducto: string;
    conImpresion: boolean;
    estado: string;
    siguienteArea: string;
    fechaFinalizacion: string;
    fechaDespacho: string | null;
    createdAt: string;
    updatedAt: string;
    cliente: {
        nombre: string;
    };
}

interface RegistrarDevolucionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    producto: ProductoTerminado | null;
}

const areaNombres: Record<string, string> = {
    Extrusion: 'Extrusión',
    Sellado: 'Sellado',
    Serigrafia: 'Serigrafía',
    Refilado: 'Refilado',
    Ninguna: 'Despacho'
};

export function RegistrarDevolucionModal({
    isOpen,
    onClose,
    onSuccess,
    producto
}: RegistrarDevolucionModalProps) {
    const [loading, setLoading] = useState(false);
    const [motivo, setMotivo] = useState('');

    if (!isOpen || !producto) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch(`/api/producto-terminado/${producto.id}/defectuoso`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ motivo })
            });

            if (res.ok) {
                onSuccess();
                setMotivo(''); // clear for next
            } else {
                const data = await res.json();
                alert(data.error || 'Error al registrar defecto/devolución');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error inesperado');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return 'N/A';
        return format(new Date(dateStr), "dd 'de' MMMM, yyyy HH:mm", { locale: es });
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl"
                >
                    {/* Header */}
                    <div className="relative bg-gradient-to-r from-red-600 to-orange-600 p-6">
                        <div className="absolute right-0 top-0 opacity-10">
                            <AlertTriangle className="h-32 w-32 -mr-8 -mt-8" />
                        </div>
                        <div className="relative flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="rounded-xl bg-white/20 p-2">
                                    <AlertTriangle className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">Registrar Devolución o Defecto</h2>
                                    <p className="text-sm font-medium text-white/80">Confirmar producto fallido</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="rounded-full bg-white/20 p-2 text-white hover:bg-white/30 transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6">
                        <div className="space-y-6">

                            {/* Product Info Card */}
                            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <Package className="h-4 w-4" />
                                    Información del Producto
                                </h3>

                                <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                                    <div>
                                        <label className="text-xs text-gray-500 font-medium block">Cliente</label>
                                        <p className="text-sm font-bold text-gray-900 line-clamp-2">{producto.cliente.nombre}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 font-medium block">Cantidad Total</label>
                                        <p className="text-base font-bold text-red-600">{producto.cantidadDisponible} {producto.unidad}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 font-medium block">Tipo</label>
                                        <p className="text-sm font-medium text-gray-700">{producto.tipoProducto} {producto.conImpresion ? '(Impreso)' : '(Sin Imprimir)'}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 font-medium block">Área de Origen</label>
                                        <p className="text-sm font-medium text-gray-700">{areaNombres[producto.areaOrigen]}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-xs text-gray-500 font-medium block mb-1 flex items-center gap-1">
                                            <Calendar className="h-3 w-3" /> Fecha de Registro
                                        </label>
                                        <p className="text-sm text-gray-600">{formatDate(producto.fechaFinalizacion)}</p>
                                    </div>

                                    {producto.descripcion && (
                                        <div className="col-span-2">
                                            <label className="text-xs text-gray-500 font-medium block flex items-center gap-1 mb-1">
                                                <FileText className="h-3 w-3" /> Descripción Opcional
                                            </label>
                                            <div className="text-sm text-gray-700 bg-white p-2 border border-gray-200 rounded-lg">
                                                {producto.descripcion}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Input for Reason */}
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                    Motivo o detalle del defecto (Opcional)
                                </label>
                                <textarea
                                    value={motivo}
                                    onChange={(e) => setMotivo(e.target.value)}
                                    placeholder="Describe por qué este producto se marca como defectuoso o en devolución..."
                                    className="w-full h-24 p-3 rounded-xl border border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none resize-none transition-all text-sm"
                                />
                            </div>

                            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                                <div className="flex gap-3">
                                    <Info className="h-5 w-5 text-red-600 flex-shrink-0" />
                                    <p className="text-sm text-red-800">
                                        Al confirmar, toda la cantidad de este producto pasará a la sección especial de <strong>Devoluciones y Defectuosos</strong>, y dejará de estar disponible para despacho.
                                    </p>
                                </div>
                            </div>

                        </div>

                        {/* Actions */}
                        <div className="mt-8 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-5 py-2.5 rounded-xl font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                                disabled={loading}
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex items-center gap-2 rounded-xl bg-red-600 px-6 py-2.5 font-bold text-white shadow-lg transition-all hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
                            >
                                {loading ? 'Procesando...' : (
                                    <>
                                        <CheckCircle className="h-5 w-5" />
                                        Confirmar Devolución
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
