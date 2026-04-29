'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Factory,
  Plus,
  Pencil,
  Trash2,
  Filter,
  CheckCircle,
  Clock,
  Calendar,
  X,
  Save,
  Loader2,
  Package,
  AlertTriangle,
  ClipboardList,
  ChevronRight,
} from 'lucide-react';

const AREAS = [
  { value: 'Extrusion', label: 'Extrusión' },
  { value: 'Sellado', label: 'Sellado' },
  { value: 'Serigrafia', label: 'Serigrafía' },
  { value: 'Refilado', label: 'Refilado' },
];

const TURNOS = [
  { value: 'Manana', label: 'Mañana (6-14h)' },
  { value: 'Tarde', label: 'Tarde (14-22h)' },
  { value: 'Noche', label: 'Noche (22-6h)' },
  { value: 'Dia12H', label: 'Día 12H (6-18h)' },
  { value: 'Noche12H', label: 'Noche 12H (18-6h)' },
];

interface RegistroProduccion {
  id: string;
  turno: string;
  fecha: string;
  operario: string;
  cantidad: number;
  reporte?: string;
  merma: number;
  mermaSinImpresion?: number;
  mermaImpreso?: number;
}

interface Produccion {
  id: string;
  fecha: string;
  turno: string;
  area: string;
  operario: string;
  cantidadProducida: number;
  unidad: string;
  merma: number;
  estado: string;
  maquinaId: string;
  pedidoId?: string | null;
  horaInicio?: string | null;
  horaFin?: string | null;
  observaciones?: string | null;
  maquina: { id: string; nombre: string };
  pedido?: {
    id: string;
    cantidadSolicitada?: number;
    unidad?: string;
    cliente: {
      nombre: string;
      tipoProducto: string;
      conImpresion?: boolean;
      pesoPorUnidad?: number;
      ancho?: number;
      largo?: number;
      calibre?: number;
      tipoBobinaCliente?: string;
      anchoValvula?: number;
      anchoSolapa?: number;
      anchoFuelle?: number;
      material?: string;
    };
  };
  registros: RegistroProduccion[];
  stockPrevio?: {
    cantidad: number;
    unidad: string;
    area: string;
    tipoProducto: string;
    conImpresion: boolean;
  } | null;
}

interface Maquina {
  id: string;
  nombre: string;
  area: string;
}

interface Pedido {
  id: string;
  cantidadSolicitada: number;
  cantidadProducida: number;
  unidad: string;
  cliente: { nombre: string; tipoProducto: string; conImpresion?: boolean; pesoPorUnidad?: number };
}

export default function ProduccionPage() {
  const { data: session } = useSession() || {};
  const [producciones, setProducciones] = useState<Produccion[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    area: '',
    fechaInicio: '',
    fechaFin: '',
  });

  const [showCrearModal, setShowCrearModal] = useState(false);
  const [showRegistroModal, setShowRegistroModal] = useState(false);
  const [selectedProduccion, setSelectedProduccion] = useState<Produccion | null>(null);
  const [saving, setSaving] = useState(false);

  const [isEditRegistro, setIsEditRegistro] = useState(false);
  const [editRegistroId, setEditRegistroId] = useState<string | null>(null);
  const [showRegistrosListModal, setShowRegistrosListModal] = useState(false);

  const [maquinas, setMaquinas] = useState<Maquina[]>([]);
  const [pedidosFiltrados, setPedidosFiltrados] = useState<Pedido[]>([]);
  const [showPedidoWarning, setShowPedidoWarning] = useState(false);
  const [isAvance, setIsAvance] = useState(false);
  const [isEditProduccion, setIsEditProduccion] = useState(false);
  const [editProduccionId, setEditProduccionId] = useState<string | null>(null);

  const today = new Date().toISOString().split('T')[0];
  const [formData, setFormData] = useState({
    fecha: today,
    turno: 'Manana',
    area: 'Extrusion',
    maquinaId: '',
    operario: '',
    pedidoId: '',
    cantidadProducida: '0',
    unidad: 'Kilogramos',
    merma: '0',
    horaInicio: '',
    horaFin: '',
    observaciones: '',
  });

  const [registroForm, setRegistroForm] = useState({
    turno: 'Manana',
    fecha: today,
    operario: '',
    cantidad: '',
    reporte: '',
    merma: '0',
    mermaSinImpresion: '0',
    mermaImpreso: '0',
  });

  const isAdmin = (session?.user as any)?.rol === 'admin';

  useEffect(() => {
    fetchProducciones();
  }, [page, filters]);

  useEffect(() => {
    fetchMaquinas();
    fetchTodosLosPedidos();
  }, []);

  const fetchProducciones = async () => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        estado: 'EnProceso',
      });
      if (filters.area) params.append('area', filters.area);
      if (filters.fechaInicio) params.append('fechaInicio', filters.fechaInicio);
      if (filters.fechaFin) params.append('fechaFin', filters.fechaFin);

      const res = await fetch(`/api/produccion?${params}`);
      const data = await res.json();
      setProducciones(data.data || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMaquinas = async () => {
    try {
      const res = await fetch('/api/maquinas?activa=true');
      const data = await res.json();
      setMaquinas(data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchTodosLosPedidos = async () => {
    try {
      const res = await fetch('/api/pedidos?estado=Pendiente,EnProceso&limit=100');
      const data = await res.json();
      setPedidosFiltrados(Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error:', error);
      setPedidosFiltrados([]);
    }
  };

  const handleCrearProduccion = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.pedidoId) {
      setShowPedidoWarning(true);
      return;
    }
    setSaving(true);
    try {
      const url = isEditProduccion ? `/api/produccion/${editProduccionId}` : '/api/produccion';
      const method = isEditProduccion ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setShowCrearModal(false);
        resetFormData();
        fetchProducciones();
      } else {
        const data = await res.json();
        alert(data.error || 'Error al registrar producción');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleAgregarRegistro = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedProduccion) return;
    setSaving(true);
    try {
      let res;
      if (isEditRegistro && editRegistroId) {
        res = await fetch(`/api/produccion/${selectedProduccion.id}/registros/${editRegistroId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(registroForm),
        });
      } else {
        res = await fetch(`/api/produccion/${selectedProduccion.id}/registros`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(registroForm),
        });
      }
      if (res.ok) {
        setShowRegistroModal(false);
        resetRegistroForm();
        fetchProducciones();
        setShowRegistrosListModal(false);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleFinalizar = async (id: string) => {
    if (!confirm('¿Finalizar el pedido completamente?')) return;
    try {
      await fetch(`/api/produccion/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'Finalizado', completarPedido: true }),
      });
      fetchProducciones();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este registro de producción?')) return;
    try {
      await fetch(`/api/produccion/${id}`, { method: 'DELETE' });
      fetchProducciones();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const resetFormData = () => {
    setIsAvance(false);
    setIsEditProduccion(false);
    setEditProduccionId(null);
    setFormData({
      fecha: today,
      turno: 'Manana',
      area: 'Extrusion',
      maquinaId: '',
      operario: '',
      pedidoId: '',
      cantidadProducida: '0',
      unidad: 'Kilogramos',
      merma: '0',
      horaInicio: '',
      horaFin: '',
      observaciones: '',
    });
    setShowPedidoWarning(false);
  };

  const openRegistroModal = (prod: Produccion) => {
    setSelectedProduccion(prod);
    setIsEditRegistro(false);
    setEditRegistroId(null);
    resetRegistroForm();
    setShowRegistroModal(true);
  };

  const openRegistrosListModal = (prod: Produccion) => {
    setSelectedProduccion(prod);
    setShowRegistrosListModal(true);
  };

  const resetRegistroForm = () => {
    setRegistroForm({
      turno: 'Manana',
      fecha: today,
      operario: '',
      cantidad: '',
      reporte: '',
      merma: '0',
      mermaSinImpresion: '0',
      mermaImpreso: '0',
    });
  };

  const handleAvanzarFase = async (prod: Produccion) => {
    const nextArea = getNextArea(prod);
    if (!nextArea) return;
    if (!confirm(`¿Avanzar a ${getAreaLabel(nextArea)}?`)) return;
    try {
      await fetch(`/api/produccion/${prod.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'Finalizado', completarPedido: false }),
      });
      setIsAvance(true);
      setFormData({
        ...formData,
        area: nextArea,
        pedidoId: prod.pedido?.id || '',
        unidad: prod.unidad,
      });
      setShowCrearModal(true);
      fetchProducciones();
    } catch (err) {
      console.error(err);
    }
  };

  const getAreaLabel = (area: string) => AREAS.find((a) => a.value === area)?.label || area;
  const getTurnoLabel = (turno: string) => TURNOS.find((t) => t.value === turno)?.label || turno;
  const formatDateShort = (dateStr: string) => new Date(dateStr).toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit' });
  const calcularTotalCantidad = (registros: RegistroProduccion[]) => registros.reduce((sum, r) => sum + r.cantidad, 0);
  const calcularTotalMerma = (registros: RegistroProduccion[]) => registros.reduce((sum, r) => sum + r.merma + (r.mermaSinImpresion || 0) + (r.mermaImpreso || 0), 0);

  const getNextArea = (prod: Produccion): string | null => {
    if (!prod.pedido || !prod.pedido.cliente) return null;
    const { tipoProducto, conImpresion } = prod.pedido.cliente as any;
    if (prod.area === 'Extrusion') {
      if (conImpresion) return 'Serigrafia';
      if (tipoProducto === 'Bolsa') return 'Sellado';
      return null;
    }
    if (prod.area === 'Serigrafia') {
      if (tipoProducto === 'Bobina' && conImpresion) return 'Refilado';
      if (tipoProducto === 'Bolsa') return 'Sellado';
      return null;
    }
    if (prod.area === 'Refilado') {
      if (tipoProducto === 'Bolsa') return 'Sellado';
      return null;
    }
    return null;
  };

  const getDisplayValues = (prod: Produccion, totalProducido: number) => {
    const cliente = prod.pedido?.cliente;
    const unidadPedido = prod.pedido?.unidad;
    const peso = cliente?.pesoPorUnidad || 0;
    let targetAmount = prod.pedido?.cantidadSolicitada || 0;
    let displayUnit = unidadPedido || prod.unidad || '';

    if (prod.area !== 'Sellado') {
      if (cliente?.tipoProducto === 'Bolsa' && unidadPedido === 'Unidades') {
        const materialStr = cliente?.material?.toLowerCase() || '';
        const densidad = materialStr.includes('alta') ? 0.96 : 0.922;
        targetAmount = (peso * targetAmount * densidad) / 1000;
      }
      displayUnit = 'kg';
    } else {
      displayUnit = 'und';
    }
    return { targetAmount, displayTotal: totalProducido, displayUnit, isCompleted: targetAmount > 0 && totalProducido >= targetAmount };
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-slate-50 dark:bg-slate-950 transition-colors">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Cargando producción...</p>
      </div>
    );
  }

  const maquinasFiltradas = maquinas.filter((m) => m.area === formData.area);

  return (
    <div className="p-8 bg-slate-50 dark:bg-slate-950 min-h-screen transition-colors duration-300">
      {/* Header Area */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200 dark:shadow-none">
              <Factory className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white leading-tight">Producción</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-widest rounded">Operaciones en Tiempo Real</span>
                <span className="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full" />
                <span className="text-slate-400 dark:text-slate-500 text-xs font-medium">{producciones.length} órdenes en proceso</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/produccion/historial">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center justify-center gap-2 rounded-xl bg-slate-100 dark:bg-slate-800 px-5 py-2.5 font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all shadow-sm"
              >
                <Clock className="h-4 w-4" />
                HISTORIAL
              </motion.button>
            </Link>
            <motion.button
              whileHover={{ scale: 1.02, boxShadow: '0 10px 15px -3px rgba(79, 70, 229, 0.3)' }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowCrearModal(true)}
              className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 font-bold text-white shadow-lg transition-all hover:bg-indigo-700 active:scale-95"
            >
              <Plus className="h-4 w-4" />
              NUEVA PRODUCCIÓN
            </motion.button>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 mb-8 transition-colors">
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <Filter className="h-3 w-3 text-slate-500" />
            <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Filtros</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1 w-full">
            <select
              value={filters.area}
              onChange={(e) => setFilters({ ...filters, area: e.target.value })}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            >
              <option value="">Todas las áreas</option>
              {AREAS.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="date"
                value={filters.fechaInicio}
                onChange={(e) => setFilters({ ...filters, fechaInicio: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-sm font-semibold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="date"
                value={filters.fechaFin}
                onChange={(e) => setFilters({ ...filters, fechaFin: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-sm font-semibold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tablero Kanban */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-4 overflow-x-auto pb-8 -mx-8 px-8">
        {AREAS.map((areaCol) => {
          const prodEnArea = producciones.filter(p => p.area === areaCol.value);
          return (
            <div key={areaCol.value} className="flex min-w-[320px] flex-col gap-6 rounded-[2.5rem] bg-slate-100 dark:bg-slate-800/40 p-5 border border-slate-200 dark:border-slate-800 transition-colors">
              <div className="flex items-center justify-between px-3">
                <h2 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-[0.2em]">{areaCol.label}</h2>
                <span className="flex h-6 w-8 items-center justify-center rounded-lg bg-white dark:bg-slate-800 text-[10px] font-black text-slate-600 dark:text-slate-400 shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
                  {prodEnArea.length}
                </span>
              </div>

              <div className="flex flex-col gap-5">
                {prodEnArea.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-300 dark:text-slate-600 border-2 border-dashed border-slate-200 dark:border-slate-800/50 rounded-3xl transition-colors">
                    <Factory className="mb-3 h-12 w-12 opacity-10" />
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Sin actividad</p>
                  </div>
                ) : (
                  prodEnArea.map((prod, index) => {
                    const nextArea = getNextArea(prod);
                    const totalProducido = calcularTotalCantidad(prod.registros);
                    const sinStock = prod.area !== 'Extrusion' && (!prod.stockPrevio || prod.stockPrevio.cantidad <= 0);
                    
                    return (
                      <motion.div
                        key={prod.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex flex-col gap-4 rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:shadow-2xl hover:scale-[1.02] hover:border-indigo-200 dark:hover:border-indigo-800 transition-all group"
                      >
                        {(() => {
                          const dv = getDisplayValues(prod, totalProducido);
                          return (
                            <>
                              <div className="flex items-start justify-between">
                                <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 text-[9px] font-black uppercase tracking-widest rounded-lg border border-indigo-100 dark:border-indigo-900/50">
                                  P-{prod.pedido?.id?.slice(-5).toUpperCase() || 'N/A'}
                                </span>
                                <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg border ${
                                  dv.isCompleted 
                                    ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50' 
                                    : 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/50'
                                }`}>
                                  {dv.isCompleted ? 'Completado' : 'En proceso'}
                                </span>
                              </div>

                              <div className="flex flex-col gap-1.5">
                                <h3 className="font-black text-slate-900 dark:text-white text-sm line-clamp-1 uppercase tracking-tight">
                                  {prod.pedido?.cliente?.nombre || 'Sin Cliente'}
                                </h3>
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                                    {prod.maquina.nombre}
                                  </span>
                                </div>
                              </div>

                              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800/50 transition-colors">
                                <div className="flex justify-between items-end mb-3">
                                  <div className="flex flex-col">
                                    <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 leading-none text-left">PRODUCIDO</span>
                                    <span className="text-lg font-black text-slate-900 dark:text-white leading-none">
                                      {dv.displayTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-[10px] text-slate-400 uppercase">{dv.displayUnit}</span>
                                    </span>
                                  </div>
                                  <div className="flex flex-col text-right">
                                    <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 leading-none">META</span>
                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400 leading-none">
                                      {dv.targetAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} {dv.displayUnit}
                                    </span>
                                  </div>
                                </div>
                                
                                <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden transition-colors">
                                  <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(100, (dv.displayTotal / (dv.targetAmount || 1)) * 100)}%` }}
                                    className={`h-full shadow-[0_0_10px_rgba(0,0,0,0.1)] ${dv.isCompleted ? 'bg-emerald-500' : 'bg-indigo-600'}`}
                                  />
                                </div>
                              </div>

                              {prod.area !== 'Extrusion' && (
                                <div className={`rounded-xl p-3 border transition-all ${
                                  sinStock 
                                    ? 'bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900/50' 
                                    : 'bg-slate-50 dark:bg-slate-800/30 border-slate-100 dark:border-slate-800/50'
                                }`}>
                                  <div className="flex justify-between items-center">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">STOCK PREVIO</span>
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${sinStock ? 'text-red-600 animate-pulse' : 'text-emerald-600'}`}>
                                      {sinStock ? '! SIN STOCK' : `${prod.stockPrevio?.cantidad.toFixed(2)} ${prod.stockPrevio?.unidad === 'Kilogramos' ? 'kg' : 'und'}`}
                                    </span>
                                  </div>
                                </div>
                              )}

                              <div className="grid grid-cols-2 gap-2 mt-2">
                                <button
                                  onClick={() => openRegistroModal(prod)}
                                  disabled={sinStock}
                                  className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-[10px] font-black uppercase tracking-widest transition-all
                                    ${sinStock
                                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                                      : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100 dark:shadow-none'
                                    }`}
                                >
                                  <Plus className="h-3.5 w-3.5" /> REGISTRO
                                </button>
                                <button
                                  onClick={() => openRegistrosListModal(prod)}
                                  className="flex items-center justify-center gap-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 py-2.5 text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                                >
                                  <Pencil className="h-3.5 w-3.5" /> EDITAR
                                </button>
                              </div>

                              <div className="mt-1">
                                {nextArea ? (
                                  <button
                                    onClick={() => handleAvanzarFase(prod)}
                                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-2.5 text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-xl"
                                  >
                                    AVANZAR A {getAreaLabel(nextArea).toUpperCase()} <ChevronRight className="h-3 w-3" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleFinalizar(prod.id)}
                                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 text-white py-2.5 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 dark:shadow-none"
                                  >
                                    <CheckCircle className="h-3.5 w-3.5" /> FINALIZAR PEDIDO
                                  </button>
                                )}
                              </div>
                            </>
                          );
                        })()}
                      </motion.div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="mt-8 flex flex-col items-center gap-6 sm:flex-row sm:justify-between bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 transition-colors">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
            Página <span className="text-slate-900 dark:text-white">{page}</span> de <span className="text-slate-900 dark:text-white">{totalPages}</span>
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 transition-all"
            >
              Anterior
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 transition-all"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {/* Modal Crear Producción */}
      <AnimatePresence>
        {showCrearModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm" onClick={() => { setShowCrearModal(false); resetFormData(); }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] bg-white dark:bg-slate-900 p-8 shadow-2xl border border-slate-200 dark:border-slate-800 transition-colors"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                  <Factory className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
                    {isEditProduccion ? 'Editar Producción' : 'Nueva Producción'}
                  </h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Control Operativo</p>
                </div>
              </div>

              <form onSubmit={handleCrearProduccion} className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Fecha de Inicio</label>
                    <input
                      type="date"
                      required
                      value={formData.fecha}
                      onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Área</label>
                    <select
                      required
                      value={formData.area}
                      onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                    >
                      {AREAS.map((a) => (
                        <option key={a.value} value={a.value}>{a.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Máquina Asignada</label>
                  <select
                    required
                    value={formData.maquinaId}
                    onChange={(e) => setFormData({ ...formData, maquinaId: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                  >
                    <option value="">Seleccione una máquina</option>
                    {maquinasFiltradas.map((m) => (
                      <option key={m.id} value={m.id}>{m.nombre}</option>
                    ))}
                  </select>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Seleccionar Pedido</label>
                    <span className="px-2 py-0.5 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-[8px] font-black uppercase tracking-widest rounded-lg border border-red-100 dark:border-red-900/50">Obligatorio</span>
                  </div>

                  {showPedidoWarning && !formData.pedidoId && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-4 p-4 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 rounded-2xl text-xs font-bold border border-amber-100 dark:border-amber-900/50 flex items-center gap-3"
                    >
                      <AlertTriangle className="h-4 w-4" />
                      Debe seleccionar un pedido para continuar
                    </motion.div>
                  )}

                  <select
                    required
                    value={formData.pedidoId}
                    onChange={(e) => {
                      setFormData({ ...formData, pedidoId: e.target.value });
                      setShowPedidoWarning(false);
                      const pedido = pedidosFiltrados.find(p => p.id === e.target.value);
                      if (pedido) {
                        const unidadProduccion = formData.area === 'Extrusion' ? 'Kilogramos' : pedido.unidad;
                        setFormData(prev => ({ ...prev, pedidoId: e.target.value, unidad: unidadProduccion }));
                      }
                    }}
                    className={`w-full bg-slate-50 dark:bg-slate-800 border rounded-2xl px-5 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all cursor-pointer ${
                      showPedidoWarning && !formData.pedidoId ? 'border-red-300 dark:border-red-900' : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <option value="">Seleccione un pedido</option>
                    {pedidosFiltrados.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.cliente.nombre} — {p.cantidadSolicitada - p.cantidadProducida} {p.unidad} pendientes
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => { setShowCrearModal(false); resetFormData(); }}
                    className="flex-1 px-6 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-[2] flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-indigo-600 text-xs font-black uppercase tracking-widest text-white hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-xl shadow-indigo-100 dark:shadow-none"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {isEditProduccion ? 'ACTUALIZAR' : 'REGISTRAR'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Agregar Registro */}
      <AnimatePresence>
        {showRegistroModal && selectedProduccion && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm" onClick={() => setShowRegistroModal(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-[2.5rem] bg-white dark:bg-slate-900 p-8 shadow-2xl border border-slate-200 dark:border-slate-800 transition-colors"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                  <ClipboardList className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
                    {isEditRegistro ? 'Editar Registro' : 'Añadir Registro'}
                  </h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{getAreaLabel(selectedProduccion.area)}</p>
                </div>
              </div>

              <form onSubmit={handleAgregarRegistro} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Turno</label>
                    <select
                      required
                      value={registroForm.turno}
                      onChange={(e) => setRegistroForm({ ...registroForm, turno: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                    >
                      {TURNOS.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Día</label>
                    <input
                      type="date"
                      required
                      value={registroForm.fecha}
                      onChange={(e) => setRegistroForm({ ...registroForm, fecha: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Operario Responsable</label>
                  <input
                    type="text"
                    required
                    value={registroForm.operario}
                    onChange={(e) => setRegistroForm({ ...registroForm, operario: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Cantidad Producida</label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={registroForm.cantidad}
                      onChange={(e) => setRegistroForm({ ...registroForm, cantidad: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3 text-sm font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase">{selectedProduccion.unidad === 'Kilogramos' ? 'KG' : 'UND'}</span>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => { setShowRegistroModal(false); resetRegistroForm(); }}
                    className="flex-1 px-6 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-[2] flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-indigo-600 text-xs font-black uppercase tracking-widest text-white hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-xl shadow-indigo-100 dark:shadow-none"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {isEditRegistro ? 'ACTUALIZAR' : 'GUARDAR'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Lista de Registros */}
      <AnimatePresence>
        {showRegistrosListModal && selectedProduccion && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm" onClick={() => setShowRegistrosListModal(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] bg-white dark:bg-slate-900 p-8 shadow-2xl border border-slate-200 dark:border-slate-800 transition-colors"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white leading-tight uppercase tracking-tight">Registros de Producción</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Gestión de datos operarios</p>
                </div>
                <button
                  onClick={() => setShowRegistrosListModal(false)}
                  className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="overflow-x-auto rounded-3xl border border-slate-100 dark:border-slate-800 transition-colors">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/50">
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Fecha</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Turno</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Operario</th>
                      <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-500">Cantidad</th>
                      <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-500">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {selectedProduccion.registros.map((reg) => (
                      <tr key={reg.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="px-6 py-4 text-xs font-bold text-slate-900 dark:text-slate-200">{formatDateShort(reg.fecha)}</td>
                        <td className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400">{getTurnoLabel(reg.turno)}</td>
                        <td className="px-6 py-4 text-xs font-bold text-slate-900 dark:text-slate-200">{reg.operario}</td>
                        <td className="px-6 py-4 text-right text-xs font-black text-slate-900 dark:text-white">{reg.cantidad}</td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center gap-2">
                            {isAdmin && (
                              <button
                                onClick={async () => {
                                  if (confirm('¿Eliminar este registro?')) {
                                    await fetch(`/api/produccion/${selectedProduccion.id}/registros/${reg.id}`, { method: 'DELETE' });
                                    fetchProducciones();
                                    setShowRegistrosListModal(false);
                                  }
                                }}
                                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-all"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
