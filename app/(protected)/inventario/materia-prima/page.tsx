'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    Package,
    Search,
    AlertTriangle,
    TrendingUp,
    Plus,
    Calculator,
    Calendar,
    Layers,
    Activity,
    ArrowRight
} from 'lucide-react';

import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { RegistrarEntradaMPModal } from '@/components/modals/registrar-entrada-mp-modal';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface InventarioItem {
    id: string;
    nombre: string;
    codigo: string;
    cantidad: number;
    unidad: string;
    stockMinimo: number;
    updatedAt: string;
}

interface ProyeccionItem {
    material: string;
    cantidadKg: number;
}

export default function MateriaPrimaPage() {
    const { data: session } = useSession() || {};
    const isAdmin = (session?.user as any)?.rol === 'admin';

    const [stock, setStock] = useState<InventarioItem[]>([]);
    const [proyecciones, setProyecciones] = useState<{
        items: ProyeccionItem[];
        totalKg: number;
        pedidosActivos: number;
    }>({ items: [], totalKg: 0, pedidosActivos: 0 });

    const [datosAnalisis, setDatosAnalisis] = useState<any[]>([]);

    const [loading, setLoading] = useState(true);
    const [busqueda, setBusqueda] = useState('');

    // Custom conversion state for UI
    const [kilosPorSaco, setKilosPorSaco] = useState(25);

    const [entradaModalOpen, setEntradaModalOpen] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Stock de Materia Prima
            const resStock = await fetch('/api/inventario?categoria=MateriaPrima&limit=100');
            const dataStock = await resStock.json();
            setStock(dataStock.inventarios || []);

            // 2. Fetch Proyecciones
            const resProy = await fetch('/api/inventario/materia-prima/proyecciones');
            const dataProy = await resProy.json();
            setProyecciones({
                items: dataProy.proyecciones || [],
                totalKg: dataProy.totalKgRequeridos || 0,
                pedidosActivos: dataProy.pedidosActivos || 0
            });

            // 3. Fetch Análisis Gráfico (últimos 30 días)
            const resAnalisis = await fetch('/api/inventario/materia-prima/analisis');
            const dataAnalisis = await resAnalisis.json();
            setDatosAnalisis(dataAnalisis.data || []);

        } catch (error) {
            console.error('Error fetching materia prima data:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredStock = stock.filter(item =>
        item.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        item.codigo.toLowerCase().includes(busqueda.toLowerCase())
    );

    return (
        <>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl flex items-center gap-3">
                            <Layers className="h-8 w-8 text-blue-600" />
                            Dashboard Materia Prima
                        </h1>
                        <p className="text-sm text-gray-600 sm:text-base mt-1">
                            Control de inventario de resinas, masterbatch y aditivos
                        </p>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                        <Link
                            href="/inventario"
                            className="flex items-center justify-center gap-2 rounded-lg bg-white border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Ver Inventario General
                        </Link>
                        <button
                            onClick={() => setEntradaModalOpen(true)}
                            className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors shadow-sm"
                        >
                            <Plus className="h-4 w-4" />
                            Registrar Entrada
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <LoadingSpinner />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* Left Column: Stock List (2/3 width on desktop) */}
                        <div className="lg:col-span-2 space-y-4">

                            {/* Buscador y Config de Conversión */}
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4 justify-between items-center">
                                <div className="relative w-full sm:max-w-xs">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Buscar materia prima..."
                                        value={busqueda}
                                        onChange={(e) => setBusqueda(e.target.value)}
                                        className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none"
                                    />
                                </div>

                                <div className="flex items-center gap-3 text-sm bg-gray-50 px-3 py-2 rounded-lg border border-gray-100 w-full sm:w-auto">
                                    <Calculator className="h-4 w-4 text-gray-500" />
                                    <span className="text-gray-600">Conversión: 1 Saco =</span>
                                    <input
                                        type="number"
                                        value={kilosPorSaco}
                                        onChange={(e) => setKilosPorSaco(Number(e.target.value) || 25)}
                                        className="w-16 border border-gray-300 rounded px-2 py-1 text-center"
                                        min="1"
                                    />
                                    <span className="text-gray-600">Kg</span>
                                </div>
                            </div>

                            {/* Grid de Tarjetas de Stock */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {filteredStock.length === 0 ? (
                                    <div className="col-span-2 py-8 text-center bg-white rounded-xl border border-gray-100 shadow-sm text-gray-500">
                                        No se encontraron materiales
                                    </div>
                                ) : (
                                    filteredStock.map((item) => {
                                        const isKg = item.unidad.toLowerCase() === 'kg' || item.unidad.toLowerCase() === 'kilogramos';
                                        const sacos = isKg
                                            ? (item.cantidad / kilosPorSaco).toFixed(1)
                                            : item.cantidad;

                                        const isLowStock = item.cantidad <= item.stockMinimo;

                                        return (
                                            <motion.div
                                                key={item.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className={`bg-white rounded-xl p-5 shadow-sm border ${isLowStock ? 'border-red-200' : 'border-gray-100'
                                                    } relative overflow-hidden group`}
                                            >
                                                {isLowStock && (
                                                    <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg">
                                                        STOCK BAJO
                                                    </div>
                                                )}
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                                                            {item.nombre}
                                                            {isLowStock && <AlertTriangle className="h-4 w-4 text-red-500" />}
                                                        </h3>
                                                        <p className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded inline-block mt-1">
                                                            {item.codigo}
                                                        </p>
                                                    </div>
                                                    <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-lg flex justify-center items-center">
                                                        <Package className="h-5 w-5" />
                                                    </div>
                                                </div>

                                                <div className="bg-gray-50 rounded-lg p-3 grid grid-cols-2 gap-2 mt-4">
                                                    <div>
                                                        <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Total { item.unidad}</p>
                                                        <p className={`text-xl font-bold ${isLowStock ? 'text-red-600' : 'text-gray-900'}`}>
                                                            {item.cantidad.toLocaleString()}
                                                        </p>
                                                    </div>
                                                    <div className="border-l border-gray-200 pl-3">
                                                        <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Eq. Sacos </p>
                                                        <p className="text-xl font-bold text-blue-700">
                                                            {isKg ? sacos : '-'}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="text-[11px] text-gray-400 mt-3 flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    Actualizado: {new Date(item.updatedAt).toLocaleDateString('es-VE')}
                                                </div>
                                            </motion.div>
                                        );
                                    })
                                )}
                            </div>

                            {/* Panel Gráfico de Análisis (Últimos 30 días) */}
                            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 mt-6 hidden sm:block">
                                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <Activity className="h-5 w-5 text-indigo-500" />
                                    Balance Entradas vs Consumos (Últimos 30 días)
                                </h3>

                                <div className="h-72 w-full">
                                    {datosAnalisis.length === 0 ? (
                                        <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                                            No hay suficientes movimientos recientes para graficar.
                                        </div>
                                    ) : (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={datosAnalisis} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                                <XAxis dataKey="material" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                                                <YAxis 
                                                    tick={{ fontSize: 11, fill: '#374151', fontWeight: 600 }} 
                                                    axisLine={false} 
                                                    tickLine={false} 
                                                    width={60}
                                                    tickFormatter={(value) => value.toLocaleString()}
                                                />
                                                <Tooltip
                                                    cursor={{ fill: '#F3F4F6' }}
                                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                />
                                                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                                                <Bar dataKey="entradas" name="Entradas (Kg)" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                                <Bar dataKey="consumos" name="Consumos (Kg)" fill="#EF4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>
                            </div>

                        </div>

                        {/* Right Column: Proyecciones */}
                        <div className="space-y-4">
                            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-6 shadow-md text-white">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                                        <TrendingUp className="h-5 w-5 text-blue-400" />
                                    </div>
                                    <h3 className="font-bold text-lg">Proyección de Consumo</h3>
                                </div>

                                <p className="text-slate-300 text-sm mb-6 leading-relaxed">
                                    Material requerido para cubrir la demanda de los <strong className="text-white">{proyecciones.pedidosActivos} pedidos activos</strong> (Pendientes y En Proceso), calculado por formulación.
                                </p>

                                <div className="bg-black/20 rounded-xl p-4 mb-6 border border-white/10">
                                    <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Total Materia Prima Requerida</p>
                                    <div className="flex items-end gap-2">
                                        <span className="text-3xl font-bold text-blue-400">
                                            {proyecciones.totalKg.toLocaleString()}
                                        </span>
                                        <span className="text-slate-400 font-medium mb-1">Kg</span>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h4 className="text-xs uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-2">
                                        <Activity className="h-3 w-3" /> Desglose por Material
                                    </h4>

                                    {proyecciones.items.length === 0 ? (
                                        <div className="text-center py-4 text-slate-500 text-sm border border-dashed border-slate-700 rounded-lg">
                                            No hay demanda proyectada
                                        </div>
                                    ) : (
                                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                            {proyecciones.items.map((proy, idx) => (
                                                <div key={idx} className="flex justify-between items-center bg-white/5 hover:bg-white/10 p-3 rounded-lg border border-white/5 transition-colors">
                                                    <span className="font-medium text-slate-200 text-sm">{proy.material}</span>
                                                    <span className="font-bold text-amber-400 text-sm">
                                                        {proy.cantidadKg.toLocaleString()} Kg
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="mt-6 pt-4 border-t border-white/10">
                                    <Link href="/pedidos" className="text-xs text-blue-400 hover:text-blue-300 flex items-center justify-center gap-1 transition-colors">
                                        Ver Pedidos Pendientes <ArrowRight className="h-3 w-3" />
                                    </Link>
                                </div>
                            </div>
                        </div>

                    </div>
                )}

            </div>

            {/* Record Input Modal */}
            <RegistrarEntradaMPModal
                isOpen={entradaModalOpen}
                onClose={() => setEntradaModalOpen(false)}
                onSuccess={() => fetchData()}
                stockItems={stock}
            />

        </>
    );
}
