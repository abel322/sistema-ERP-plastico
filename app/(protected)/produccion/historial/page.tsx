'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  History,
  ArrowLeft,
  Calendar,
  Factory,
  TrendingUp,
  AlertTriangle,
  Package,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Pencil,
  Trash2,
} from 'lucide-react';
import { ActionPasswordModal } from '@/components/modals/ActionPasswordModal';
import { EditarProduccionModal } from '@/components/modals/EditarProduccionModal';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { formatNumber } from '@/lib/utils';
import { calcularDesperdicioInfo } from '@/lib/utils/merma';

const AREAS = [
  { value: 'Extrusion', label: 'Extrusión', color: 'bg-blue-500', gradient: 'from-blue-600 via-blue-500 to-indigo-500' },
  { value: 'Sellado', label: 'Sellado', color: 'bg-green-500', gradient: 'from-emerald-600 via-green-500 to-teal-500' },
  { value: 'Serigrafia', label: 'Serigrafía', color: 'bg-purple-500', gradient: 'from-purple-600 via-fuchsia-500 to-pink-500' },
  { value: 'Refilado', label: 'Refilado', color: 'bg-orange-500', gradient: 'from-orange-600 via-amber-500 to-yellow-500' },
];

const TURNOS = [
  { value: 'Manana', label: 'Mañana' },
  { value: 'Tarde', label: 'Tarde' },
  { value: 'Noche', label: 'Noche' },
  { value: 'Dia12H', label: 'Día 12H' },
  { value: 'Noche12H', label: 'Noche 12H' },
];

interface RegistroProduccion {
  id: string;
  turno: string;
  fecha: string;
  operario: string;
  cantidad: number;
  reporte?: string;
  merma: number;
  mermaColor?: number;
  mermaCristal?: number;
  mermaSinImpresion?: number;
  mermaImpreso?: number;
}

interface ProductoEspecificacion {
  pesoPorUnidad?: number;
  ancho?: number;
  largo?: number;
  calibre?: number;
  anchoValvula?: number;
  anchoFuelle?: number;
  anchoSolapa?: number;
  material?: string;
  tipoProducto?: string;
}

interface Produccion {
  id: string;
  codigoLote?: string;
  loteOrigen?: string;
  fecha: string;
  turno: string;
  area: string;
  operario: string;
  cantidadProducida: number;
  unidad: string;
  merma: number;
  mermaColor?: number;
  mermaCristal?: number;
  finalizadoAt: string;
  maquina: { nombre: string };
  pedido?: {
    cliente: { nombre: string };
    productoCliente?: ProductoEspecificacion;
  };
  productoCliente?: ProductoEspecificacion;
  registros: RegistroProduccion[];
}

interface ResumenArea {
  area: string;
  _sum: { cantidadProducida: number | null; merma: number | null };
  _count: number;
}

export default function HistorialProduccionPage() {
  const [loading, setLoading] = useState(true);
  const [producciones, setProducciones] = useState<Produccion[]>([]);
  const [resumenPorArea, setResumenPorArea] = useState<ResumenArea[]>([]);
  const [totales, setTotales] = useState({ 
    totalProducido: 0, 
    totalMerma: 0, 
    totalMermaColor: 0, 
    totalMermaCristal: 0, 
    totalRegistros: 0, totalProducidoExtrusion: 0, totalProducidoSellado: 0
  });
  const [periodo, setPeriodo] = useState('semana');
  const [filterArea, setFilterArea] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [actionModal, setActionModal] = useState({ isOpen: false, type: 'editar' as 'editar' | 'eliminar', id: '' });
  const [editarModalOpen, setEditarModalOpen] = useState(false);
  const [eliminando, setEliminando] = useState<string | null>(null);

  useEffect(() => {
    fetchHistorial();
  }, [periodo, filterArea, page]);

  const fetchHistorial = async () => {
    try {
      const params = new URLSearchParams({
        periodo,
        page: page.toString(),
        limit: '10',
      });
      if (filterArea) params.append('area', filterArea);

      const res = await fetch(`/api/produccion/historial?${params}`);
      const data = await res.json();

      setProducciones(data.data || []);
      setResumenPorArea(data.resumenPorArea || []);
      setTotales(data.totales || { totalProducido: 0, totalMerma: 0, totalMermaColor: 0, totalMermaCristal: 0, totalRegistros: 0, totalProducidoExtrusion: 0, totalProducidoSellado: 0 });
      setTotalPages(data.totalPages || 1);
      setFechaInicio(data.fechaInicio || '');
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleActionClick = (id: string, type: 'editar' | 'eliminar') => {
    setActionModal({ isOpen: true, type, id });
  };

  const executeAction = async () => {
    const { type, id } = actionModal;
    if (type === 'editar') {
      setEditarModalOpen(true);
    } else if (type === 'eliminar') {
      setEliminando(id);
      try {
        const res = await fetch(`/api/produccion/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Error al eliminar');
        fetchHistorial();
      } catch (error) {
        console.error(error);
        alert('No se pudo eliminar la producción.');
      } finally {
        setEliminando(null);
      }
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const getAreaInfo = (area: string) =>
    AREAS.find((a) => a.value === area) || AREAS[0];

  const getTurnoLabel = (turno: string) =>
    TURNOS.find((t) => t.value === turno)?.label || turno;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-VE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDateShort = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-VE', {
      day: '2-digit',
      month: '2-digit',
    });
  };

  const formatDayOfWeek = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = date.toLocaleDateString('es-ES', { weekday: 'long' });
    return day.charAt(0).toUpperCase() + day.slice(1);
  };

  const calcularEficiencia = () => {
    if (totales.totalProducido === 0) return 0;
    return ((totales.totalProducido / (totales.totalProducido + totales.totalMerma)) * 100).toFixed(1);
  };

  const requiereMermaSubdividida = (area: string) => {
    return area === 'Serigrafia' || area === 'Refilado';
  };

    const getUnidadForArea = (areaName: string) => {
    if (areaName === 'Sellado') return 'UND'; // Default fallback
    const prods = producciones.filter(p => p.area === areaName);
    if (prods.length > 0 && prods[0].unidad) {
      const u = prods[0].unidad.toLowerCase();
      if (u.startsWith('un') || u.startsWith('ud') || u.startsWith('bol') || u.startsWith('pz')) return 'UND';
      return 'KG';
    }
    return 'KG'; // Default fallback
  };

  const calcularTotalCantidad = (registros: RegistroProduccion[]) => {
    return registros.reduce((sum, r) => sum + r.cantidad, 0);
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Link href="/produccion" className="rounded-lg p-2 hover:bg-gray-100">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Historial de Producción</h1>
              <p className="text-gray-600">Producciones finalizadas con todos sus registros</p>
            </div>
          </div>
        </div>

        {/* Filtros de Período */}
        <div className="flex flex-wrap gap-4">
          <div className="flex rounded-lg border border-gray-200 bg-white p-1">
            <button
              onClick={() => { setPeriodo('semana'); setPage(1); }}
              className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${periodo === 'semana'
                ? 'bg-emerald-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
                }`}
            >
              <Calendar className="h-4 w-4" />
              Esta Semana
            </button>
            <button
              onClick={() => { setPeriodo('mes'); setPage(1); }}
              className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${periodo === 'mes'
                ? 'bg-emerald-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
                }`}
            >
              <Calendar className="h-4 w-4" />
              Este Mes
            </button>
          </div>
          <select
            value={filterArea}
            onChange={(e) => { setFilterArea(e.target.value); setPage(1); }}
            className="rounded-lg border border-gray-300 px-4 py-2 focus:border-emerald-500 focus:outline-none"
          >
            <option value="">Todas las áreas</option>
            {AREAS.map((a) => (
              <option key={a.value} value={a.value}>{a.label}</option>
            ))}
          </select>
        </div>

        {/* Tarjetas de Resumen */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 p-6 text-white shadow-lg"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-white/20 p-3">
                <Package className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-white/80">Total Producido</p>
                {!filterArea ? (
                  <>
                    <p className="text-2xl font-bold">
                      {formatNumber(totales.totalProducidoExtrusion || 0, { minDecimals: 2, maxDecimals: 2 })} KG
                    </p>
                    <p className="text-sm text-white/90 mt-1">
                      Terminado: {formatNumber(totales.totalProducidoSellado || 0, { minDecimals: 0, maxDecimals: 0 })} UND
                    </p>
                  </>
                ) : (
                  <p className="text-2xl font-bold">
                    {formatNumber(totales.totalProducido, {
                      minDecimals: getUnidadForArea(filterArea) === 'UND' ? 0 : 2,
                      maxDecimals: getUnidadForArea(filterArea) === 'UND' ? 0 : 2
                    })} {getUnidadForArea(filterArea)}
                  </p>
                )}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl bg-gradient-to-br from-rose-500 to-red-600 p-6 text-white shadow-lg"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-white/20 p-3">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-white/80">Total Merma</p>
                <p className="text-2xl font-bold">
                  {formatNumber(totales.totalMerma, { minDecimals: 2, maxDecimals: 2 })} kg
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-white/90">
                  <span>Color: <strong>{formatNumber(totales.totalMermaColor, { minDecimals: 2, maxDecimals: 2 })} kg</strong></span>
                  <span>·</span>
                  <span>Cristal: <strong>{formatNumber(totales.totalMermaCristal, { minDecimals: 2, maxDecimals: 2 })} kg</strong></span>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 p-6 text-white shadow-lg"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-white/20 p-3">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-white/80">Eficiencia</p>
                <p className="text-2xl font-bold">{calcularEficiencia()}%</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 p-6 text-white shadow-lg"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-white/20 p-3">
                <History className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-white/80">Registros</p>
                <p className="text-2xl font-bold">{totales.totalRegistros}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Resumen por Área */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Resumen por Área</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {AREAS.map((area) => {
              const resumen = resumenPorArea.find((r) => r.area === area.value);
              return (
                <div key={area.value} className="rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`h-3 w-3 rounded-full ${area.color}`}></div>
                    <span className="font-medium text-gray-900">{area.label}</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Producido: <span className="font-semibold">{formatNumber(resumen?._sum.cantidadProducida || 0, { minDecimals: getUnidadForArea(area.value) === 'UND' ? 0 : 2, maxDecimals: getUnidadForArea(area.value) === 'UND' ? 0 : 2 })} {getUnidadForArea(area.value)}</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Merma: <span className="font-semibold text-red-600">{formatNumber(resumen?._sum.merma, { minDecimals: 2, maxDecimals: 2 })} kg</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Registros: <span className="font-semibold">{resumen?._count || 0}</span>
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tarjetas de Producciones Finalizadas */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Producciones Finalizadas</h2>
            {fechaInicio && (
              <p className="text-sm text-gray-500">
                Desde: {new Date(fechaInicio).toLocaleDateString('es-VE', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            )}
          </div>

          {producciones.length === 0 ? (
            <div className="rounded-xl bg-white p-8 text-center text-gray-500 shadow-sm">
              <History className="mx-auto mb-4 h-12 w-12 text-gray-300" />
              <p className="text-lg font-medium">No hay producciones finalizadas en este período</p>
            </div>
          ) : (
            producciones.map((prod, index) => {
              const cantidadTotal = prod.registros && prod.registros.length > 0
                ? calcularTotalCantidad(prod.registros)
                : prod.cantidadProducida;

              const isUnidades = prod.area === 'Sellado' || prod.unidad?.toLowerCase().startsWith('un') || prod.unidad?.toLowerCase().startsWith('ud');

              const desperdicio = calcularDesperdicioInfo({
                area: prod.area,
                merma: prod.merma,
                producido: cantidadTotal,
                unidad: isUnidades ? 'und' : prod.unidad,
                productoCliente: prod.pedido?.productoCliente || prod.productoCliente,
                esOrdenFinalizada: true,
              });

              return (
                <motion.div
                  key={prod.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="overflow-hidden rounded-xl bg-gradient-to-br from-emerald-50 via-white to-gray-50 shadow-lg border border-emerald-100"
                >
                  {/* Encabezado */}
                  <div className={`bg-gradient-to-r ${getAreaInfo(prod.area).gradient || 'from-gray-600 to-gray-400'} p-4`}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-xl font-bold text-white">
                          Producción N° {index + 1}
                        </h3>
                        {prod.codigoLote && (
                          <span className="rounded-lg bg-black/40 border border-white/20 px-2.5 py-0.5 text-xs font-mono font-bold text-white shadow-sm">
                            Lote: {prod.codigoLote}
                          </span>
                        )}
                        {prod.loteOrigen && (
                          <span className="rounded-lg bg-amber-500/80 border border-amber-300/40 px-2.5 py-0.5 text-xs font-mono font-bold text-white shadow-sm">
                            Bobina Origen: {prod.loteOrigen}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-white/20 px-3 py-1 text-sm font-medium text-white">
                          {formatDate(prod.finalizadoAt)}
                        </span>
                        <span className={`rounded-full px-3 py-1 text-sm font-medium text-white ${getAreaInfo(prod.area).color}`}>
                          {getAreaInfo(prod.area).label}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-400 px-3 py-1 text-sm font-medium text-green-900">
                          <CheckCircle className="h-3 w-3" />
                          Finalizado
                        </span>
                        {desperdicio.tienePorcentaje && desperdicio.porcentaje !== null && (
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold shadow-sm ${desperdicio.semaforo.badgeClass}`}>
                            <span className={`w-2 h-2 rounded-full ${desperdicio.semaforo.dotColor}`} />
                            Merma: {formatNumber(desperdicio.porcentaje, { minDecimals: 1, maxDecimals: 1 })}% · {desperdicio.semaforo.label}
                          </span>
                        )}
                        <button
                          onClick={() => toggleExpand(prod.id)}
                          className="flex items-center gap-1 rounded-lg bg-white/20 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/30"
                        >
                          {expandedCards.has(prod.id) ? (
                            <><ChevronUp className="h-4 w-4" /> Ocultar</>) : (
                            <><ChevronDown className="h-4 w-4" /> Ver Registros</>)}
                        </button>
                        <button
                          onClick={() => handleActionClick(prod.id, 'editar')}
                          className="flex items-center gap-1 rounded-lg bg-white/20 px-2 py-1.5 text-sm font-medium text-white hover:bg-white/30 transition-colors"
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleActionClick(prod.id, 'eliminar')}
                          disabled={eliminando === prod.id}
                          className="flex items-center gap-1 rounded-lg bg-red-500/80 px-2 py-1.5 text-sm font-medium text-white hover:bg-red-500 transition-colors disabled:opacity-50"
                          title="Eliminar"
                        >
                          {eliminando === prod.id ? <LoadingSpinner /> : <Trash2 className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-4 text-sm text-white/90">
                      <span>Máquina: <strong>{prod.maquina.nombre}</strong></span>
                      <span>Cliente: <strong>{prod.pedido?.cliente?.nombre || 'Sin pedido'}</strong></span>
                    </div>
                  </div>

                  {/* Body - Tabla de Registros (Colapsable) */}
                  <AnimatePresence>
                    {expandedCards.has(prod.id) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4">
                          {prod.registros && prod.registros.length > 0 ? (
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="border-b border-gray-200 bg-gray-50">
                                    <th className="px-3 py-2 text-left font-semibold text-gray-700">Turno</th>
                                    <th className="px-3 py-2 text-left font-semibold text-gray-700">Día</th>
                                    <th className="px-3 py-2 text-left font-semibold text-gray-700">Operario</th>
                                    <th className="px-3 py-2 text-right font-semibold text-gray-700">
                                      {prod.area === 'Sellado' ? 'Cantidad (Und)' : 'Cantidad'}
                                    </th>
                                    <th className="px-3 py-2 text-left font-semibold text-gray-700">Reporte</th>
                                    <th className="px-3 py-2 text-right font-semibold text-purple-700">Merma Color (kg)</th>
                                    <th className="px-3 py-2 text-right font-semibold text-cyan-700">Merma Cristal (kg)</th>
                                    <th className="px-3 py-2 text-right font-semibold text-gray-900">Total Merma</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                  {prod.registros.map((reg) => {
                                    const regColor = (reg.mermaColor !== undefined && reg.mermaColor !== null) ? reg.mermaColor : (reg.mermaImpreso || 0);
                                    const regCristal = (reg.mermaCristal !== undefined && reg.mermaCristal !== null) ? reg.mermaCristal : (reg.mermaSinImpresion || 0);
                                    const regTotal = reg.merma || (regColor + regCristal);
                                    return (
                                      <tr key={reg.id} className="hover:bg-emerald-50/50">
                                        <td className="px-3 py-2 text-gray-600">{getTurnoLabel(reg.turno)}</td>
                                        <td className="px-3 py-2 text-gray-600">{formatDayOfWeek(reg.fecha)}</td>
                                        <td className="px-3 py-2 text-gray-900">{reg.operario}</td>
                                        <td className="px-3 py-2 text-right font-medium text-gray-900">
                                          {formatNumber(reg.cantidad, { minDecimals: isUnidades ? 0 : 2, maxDecimals: 2 })}
                                        </td>
                                        <td className="px-3 py-2 text-gray-600">{reg.reporte || '-'}</td>
                                        <td className="px-3 py-2 text-right font-medium text-purple-700">
                                          {formatNumber(regColor, { minDecimals: 2, maxDecimals: 2 })}
                                        </td>
                                        <td className="px-3 py-2 text-right font-medium text-cyan-700">
                                          {formatNumber(regCristal, { minDecimals: 2, maxDecimals: 2 })}
                                        </td>
                                        <td className="px-3 py-2 text-right font-bold text-red-600">
                                          {formatNumber(regTotal, { minDecimals: 2, maxDecimals: 2 })}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                                <tfoot className="border-t-2 border-gray-200 bg-gray-50/80 font-bold">
                                  <tr>
                                    <td colSpan={3} className="px-3 py-2 text-gray-700">Total Producción</td>
                                    <td className="px-3 py-2 text-right text-gray-900">
                                      {formatNumber(cantidadTotal, { minDecimals: isUnidades ? 0 : 2, maxDecimals: 2 })}
                                    </td>
                                    <td className="px-3 py-2">
                                      {desperdicio.tienePorcentaje && desperdicio.porcentaje !== null && (
                                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border ${desperdicio.semaforo.badgeClass}`}>
                                          <span className={`w-1.5 h-1.5 rounded-full ${desperdicio.semaforo.dotColor}`} />
                                          {formatNumber(desperdicio.porcentaje, { minDecimals: 1, maxDecimals: 1 })}% · {desperdicio.semaforo.label}
                                        </span>
                                      )}
                                    </td>
                                    <td className="px-3 py-2 text-right font-bold text-purple-700">
                                      {formatNumber(prod.registros.reduce((acc, r) => acc + ((r as any).mermaColor ?? r.mermaImpreso ?? 0), 0), { minDecimals: 2, maxDecimals: 2 })}
                                    </td>
                                    <td className="px-3 py-2 text-right font-bold text-cyan-700">
                                      {formatNumber(prod.registros.reduce((acc, r) => acc + ((r as any).mermaCristal ?? r.mermaSinImpresion ?? 0), 0), { minDecimals: 2, maxDecimals: 2 })}
                                    </td>
                                    <td className="px-3 py-2 text-right font-bold text-red-600">
                                      {formatNumber(prod.merma, { minDecimals: 2, maxDecimals: 2 })}
                                    </td>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>
                          ) : (
                            <div className="py-4 text-center text-gray-400">
                              No hay registros detallados para esta producción
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Footer - Total y Semáforo de Merma */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-emerald-100 bg-gradient-to-r from-emerald-50 to-gray-50 px-4 py-3">
                    <div className="text-lg font-bold text-gray-800">
                      Total:{' '}
                      <span className="text-emerald-600">
                        {formatNumber(cantidadTotal, { minDecimals: isUnidades ? 0 : 2, maxDecimals: 2 })}
                      </span>{' '}
                      {prod.area === 'Sellado' ? 'unidades' : prod.unidad}
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex flex-wrap items-center gap-2 bg-white/90 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold">
                        <span className="text-gray-700">
                          Total Merma: <strong className="text-gray-900 font-bold">{formatNumber(prod.merma, { minDecimals: 2, maxDecimals: 2 })} kg</strong>
                        </span>
                        <span className="text-gray-300">|</span>
                        <span className="text-purple-700">
                          Color: <strong>{formatNumber(prod.mermaColor || prod.registros?.reduce((acc, r) => acc + ((r as any).mermaColor ?? r.mermaImpreso ?? 0), 0) || 0, { minDecimals: 2, maxDecimals: 2 })} kg</strong>
                        </span>
                        <span className="text-gray-300">|</span>
                        <span className="text-cyan-700">
                          Cristal: <strong>{formatNumber(prod.mermaCristal || prod.registros?.reduce((acc, r) => acc + ((r as any).mermaCristal ?? r.mermaSinImpresion ?? 0), 0) || 0, { minDecimals: 2, maxDecimals: 2 })} kg</strong>
                        </span>
                      </div>
                      {desperdicio.tienePorcentaje && desperdicio.porcentaje !== null && (
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border shadow-sm ${desperdicio.semaforo.badgeClass}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${desperdicio.semaforo.dotColor}`} />
                          Merma: {formatNumber(desperdicio.porcentaje, { minDecimals: 1, maxDecimals: 1 })}% · {desperdicio.semaforo.label}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-600">
              Página {page} de {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm disabled:opacity-50 hover:bg-gray-50"
              >
                Anterior
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm disabled:opacity-50 hover:bg-gray-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      <ActionPasswordModal
        isOpen={actionModal.isOpen}
        onClose={() => setActionModal(prev => ({ ...prev, isOpen: false }))}
        actionType={actionModal.type}
        onSuccess={executeAction}
      />

      <EditarProduccionModal
        isOpen={editarModalOpen}
        onClose={() => setEditarModalOpen(false)}
        onSuccess={() => {
          setEditarModalOpen(false);
          fetchHistorial();
        }}
        produccionId={actionModal.id}
      />
    </>
  );
}
