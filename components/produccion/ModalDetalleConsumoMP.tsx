'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Layers,
  Printer,
  Package,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingDown,
  Factory,
  Scale,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { formatNumber } from '@/lib/utils';

interface DetalleMPItem {
  key?: string;
  label?: string;
  codigo?: string;
  nombre?: string;
  nombreInventario?: string;
  porcentaje: number;
  kgConsumido: number;
  sacasConsumidas: number;
  kgFaltante: number;
  sacasFaltantes: number;
  stockActualKg: number;
  stockActualSacas: number;
  status: 'optimo' | 'critico' | 'agotado';
  deficitKg: number;
  deficitSacas: number;
}

interface ConsumoMPData {
  orden: {
    id: string;
    codigoLote?: string | null;
    fecha: string;
    turno: string;
    area: string;
    clienteNombre: string;
    productoNombre: string;
    maquinaNombre: string;
    operario: string;
    pedidoId?: string | null;
    kgProducidos: number;
    metaKg: number;
    kgPendientes: number;
    sacasProducidas: number;
    sacasPendientes: number;
    sacasMeta: number;
    porcentajeProgreso: number;
    mermaTotal: number;
    porcentajeMerma: number;
  };
  peletizado: DetalleMPItem | null;
  resinasVirgenes: DetalleMPItem[];
  aditivos: DetalleMPItem[];
  resumenGlobal: {
    estado: 'optimo' | 'critico' | 'agotado';
    mensaje: string;
    totalSacasFaltantes: number;
    totalKgFaltantes: number;
  };
}

interface ModalDetalleConsumoMPProps {
  ordenId: string;
  onClose: () => void;
}

export default function ModalDetalleConsumoMP({ ordenId, onClose }: ModalDetalleConsumoMPProps) {
  const [data, setData] = useState<ConsumoMPData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modoImpresion, setModoImpresion] = useState(false);

  useEffect(() => {
    fetchConsumoMP();
  }, [ordenId]);

  // Cierre con la tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const fetchConsumoMP = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/produccion/${ordenId}/consumo-mp`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Error al obtener consumo de materia prima');
      }
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleImprimir = () => {
    window.print();
  };

  const renderBadgeDisponibilidad = (item: DetalleMPItem) => {
    if (item.status === 'agotado') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
          <XCircle className="w-3 h-3 text-rose-600 dark:text-rose-400 shrink-0" />
          Agotado
        </span>
      );
    }
    if (item.status === 'critico') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
          <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
          Déficit: -{formatNumber(item.deficitSacas, { minDecimals: 1, maxDecimals: 1 })} sacas
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
        <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
        Suficiente
      </span>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm print:p-0 print:bg-white print:static"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-[2.5rem] bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 transition-colors print:max-w-full print:max-h-full print:shadow-none print:border-none print:p-4 print:text-black"
      >
        {/* Cabecera del Modal */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800 print:border-b-2 print:border-black">
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-200 dark:shadow-none print:hidden">
              <Layers className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-[10px] font-black uppercase tracking-wider border border-blue-200 dark:border-blue-900/60">
                  Extrusión
                </span>
                {data?.orden.codigoLote && (
                  <span className="px-2.5 py-0.5 rounded-lg bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-mono font-bold text-[10px] tracking-wider">
                    Lote: {data.orden.codigoLote}
                  </span>
                )}
                {data?.orden.pedidoId && (
                  <span className="text-[10px] font-bold text-slate-400">
                    Pedido #{data.orden.pedidoId.slice(-5).toUpperCase()}
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1 leading-tight">
                Balance de Materia Prima y Control de Sacas
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Desglose dinámico de formulación técnica vs. disponibilidad física en almacén
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center print:hidden">
            <button
              onClick={fetchConsumoMP}
              disabled={loading}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              title="Refrescar datos de inventario"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleImprimir}
              disabled={loading || !data}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-black uppercase tracking-wider transition-all shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Imprimir Vale MP</span>
            </button>
            <button
              onClick={onClose}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">
              Calculando balance y auditando almacén...
            </p>
          </div>
        ) : error || !data ? (
          <div className="py-16 text-center">
            <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
              {error || 'No se pudo cargar la información'}
            </p>
            <button
              onClick={fetchConsumoMP}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
            >
              Reintentar
            </button>
          </div>
        ) : (
          <div className="space-y-6 mt-6">
            {/* Ficha Informativa de la Orden */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cliente / Destino</span>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
                  {data.orden.clienteNombre}
                </h3>
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {data.orden.productoNombre}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-slate-600 dark:text-slate-300 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-200/60 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Factory className="w-4 h-4 text-blue-500 shrink-0" />
                  <div>
                    <p className="text-[9px] font-black uppercase text-slate-400">Máquina</p>
                    <p className="font-bold text-slate-800 dark:text-slate-200">{data.orden.maquinaNombre}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Scale className="w-4 h-4 text-indigo-500 shrink-0" />
                  <div>
                    <p className="text-[9px] font-black uppercase text-slate-400">Meta Programada</p>
                    <p className="font-bold text-slate-800 dark:text-slate-200">
                      {formatNumber(data.orden.metaKg, { minDecimals: 2, maxDecimals: 2 })} KG{' '}
                      <span className="text-[10px] text-slate-400">
                        (~{formatNumber(data.orden.sacasMeta, { minDecimals: 1, maxDecimals: 1 })} sacas)
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Barra de Progreso Físico */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-600 dark:text-slate-400">
                  Progreso Global de Extrusión:
                </span>
                <span className="font-black text-slate-900 dark:text-white">
                  {formatNumber(data.orden.kgProducidos, { minDecimals: 2, maxDecimals: 2 })} KG de{' '}
                  {formatNumber(data.orden.metaKg, { minDecimals: 2, maxDecimals: 2 })} KG ({formatNumber(data.orden.porcentajeProgreso, { minDecimals: 1, maxDecimals: 1 })}%)
                </span>
              </div>
              <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200/60 dark:border-slate-700">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, data.orden.porcentajeProgreso)}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <span>Procesado: ~{formatNumber(data.orden.sacasProducidas, { minDecimals: 1, maxDecimals: 1 })} sacas de 25 kg</span>
                <span>Faltante: ~{formatNumber(data.orden.sacasPendientes, { minDecimals: 1, maxDecimals: 1 })} sacas de 25 kg</span>
              </div>
            </div>

            {/* Banner de Estado Global de Almacén */}
            <div
              className={`p-4 rounded-2xl border flex items-start gap-3 transition-colors ${
                data.resumenGlobal.estado === 'agotado'
                  ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200'
                  : data.resumenGlobal.estado === 'critico'
                  ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-200'
                  : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-200'
              }`}
            >
              {data.resumenGlobal.estado === 'agotado' ? (
                <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              ) : data.resumenGlobal.estado === 'critico' ? (
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="text-xs font-black uppercase tracking-wider">
                  {data.resumenGlobal.estado === 'agotado'
                    ? 'Déficit Crítico de Almacén'
                    : data.resumenGlobal.estado === 'critico'
                    ? 'Alerta de Suministro en Almacén'
                    : 'Disponibilidad Óptima en Almacén'}
                </p>
                <p className="text-xs mt-0.5 opacity-90">{data.resumenGlobal.mensaje}</p>
                {data.resumenGlobal.totalSacasFaltantes > 0 && (
                  <p className="text-[11px] font-bold mt-1">
                    Requerimiento total pendiente de retiro: ~{formatNumber(data.resumenGlobal.totalSacasFaltantes, { minDecimals: 1, maxDecimals: 1 })} sacas ({formatNumber(data.resumenGlobal.totalKgFaltantes, { minDecimals: 2, maxDecimals: 2 })} KG)
                  </p>
                )}
              </div>
            </div>

            {/* 4 KPIs Métricos */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Total Extruido</span>
                <p className="text-lg font-black text-slate-900 dark:text-white mt-1">
                  {formatNumber(data.orden.kgProducidos, { minDecimals: 2, maxDecimals: 2 })} <span className="text-xs text-slate-400">KG</span>
                </p>
                <p className="text-[10px] font-bold text-slate-500 mt-0.5">
                  ~{formatNumber(data.orden.sacasProducidas, { minDecimals: 1, maxDecimals: 1 })} sacas de 25 kg
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Merma / Scrap</span>
                <p className="text-lg font-black text-rose-600 dark:text-rose-400 mt-1">
                  {formatNumber(data.orden.mermaTotal, { minDecimals: 2, maxDecimals: 2 })} <span className="text-xs text-slate-400">KG</span>
                </p>
                <p className="text-[10px] font-bold text-slate-500 mt-0.5">
                  {formatNumber(data.orden.porcentajeMerma, { minDecimals: 1, maxDecimals: 1 })}% del proceso
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Pendiente a Meta</span>
                <p className="text-lg font-black text-indigo-600 dark:text-indigo-400 mt-1">
                  {formatNumber(data.orden.kgPendientes, { minDecimals: 2, maxDecimals: 2 })} <span className="text-xs text-slate-400">KG</span>
                </p>
                <p className="text-[10px] font-bold text-slate-500 mt-0.5">
                  ~{formatNumber(data.orden.sacasPendientes, { minDecimals: 1, maxDecimals: 1 })} sacas de 25 kg
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Estado Almacén</span>
                <p
                  className={`text-sm font-black mt-2 uppercase tracking-wider ${
                    data.resumenGlobal.estado === 'agotado'
                      ? 'text-rose-600 dark:text-rose-400'
                      : data.resumenGlobal.estado === 'critico'
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {data.resumenGlobal.estado === 'agotado'
                    ? 'Agotado'
                    : data.resumenGlobal.estado === 'critico'
                    ? 'Alerta Déficit'
                    : '100% Cubierto'}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Auditoría física en vivo
                </p>
              </div>
            </div>

            {/* TABLA 1: Peletizado / Recuperado */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  1. PELETIZADO / RECUPERADO (AÑADIDURA DIRECTA EN TOLVA)
                </h4>
                {data.peletizado && (
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    Dosificación: {data.peletizado.porcentaje}%
                  </span>
                )}
              </div>

              {data.peletizado ? (
                <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase text-[9px] font-black tracking-wider">
                      <tr>
                        <th className="px-4 py-3">Material</th>
                        <th className="px-3 py-3 text-center">% Tolva</th>
                        <th className="px-4 py-3 text-right">Consumo Real</th>
                        <th className="px-4 py-3 text-right">Sacas Usadas</th>
                        <th className="px-4 py-3 text-right">Faltante a Meta</th>
                        <th className="px-4 py-3 text-right">Stock Almacén</th>
                        <th className="px-4 py-3 text-center">Estado Almacén</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold">
                      <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                        <td className="px-4 py-3">
                          <p className="font-bold text-slate-900 dark:text-white">{data.peletizado.nombre}</p>
                          <span className="text-[9px] text-slate-400 font-mono">{data.peletizado.codigo}</span>
                        </td>
                        <td className="px-3 py-3 text-center font-bold text-emerald-600 dark:text-emerald-400">
                          {data.peletizado.porcentaje}%
                        </td>
                        <td className="px-4 py-3 text-right font-black text-slate-800 dark:text-slate-200">
                          {formatNumber(data.peletizado.kgConsumido, { minDecimals: 2, maxDecimals: 2 })} KG
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-slate-600 dark:text-slate-300">
                          {formatNumber(data.peletizado.sacasConsumidas, { minDecimals: 1, maxDecimals: 1 })} sacas
                        </td>
                        <td className="px-4 py-3 text-right font-black text-indigo-600 dark:text-indigo-400">
                          {formatNumber(data.peletizado.kgFaltante, { minDecimals: 2, maxDecimals: 2 })} KG
                          <span className="block text-[10px] text-slate-400 font-normal">
                            (~{formatNumber(data.peletizado.sacasFaltantes, { minDecimals: 1, maxDecimals: 1 })} sacas)
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <p className="font-black text-slate-900 dark:text-white">
                            {formatNumber(data.peletizado.stockActualKg, { minDecimals: 2, maxDecimals: 2 })} KG
                          </p>
                          <span className="text-[10px] text-slate-400 font-normal">
                            (~{formatNumber(data.peletizado.stockActualSacas, { minDecimals: 1, maxDecimals: 1 })} sacas)
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {renderBadgeDisponibilidad(data.peletizado)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/30 text-xs text-slate-400 italic text-center">
                  Esta formulación no contempla peletizado (100% Resina Virgen).
                </div>
              )}
            </div>

            {/* TABLA 2: Resinas Vírgenes */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  2. RESINAS VÍRGENES (FORMULACIÓN BASE)
                </h4>
                <span className="text-[10px] text-slate-400 font-bold uppercase">
                  {data.resinasVirgenes.length} componente(s)
                </span>
              </div>

              {data.resinasVirgenes.length > 0 ? (
                <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase text-[9px] font-black tracking-wider">
                      <tr>
                        <th className="px-4 py-3">Resina Virgen</th>
                        <th className="px-3 py-3 text-center">% Base</th>
                        <th className="px-4 py-3 text-right">Consumo Real</th>
                        <th className="px-4 py-3 text-right">Sacas Usadas</th>
                        <th className="px-4 py-3 text-right">Faltante a Meta</th>
                        <th className="px-4 py-3 text-right">Stock Almacén</th>
                        <th className="px-4 py-3 text-center">Estado Almacén</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold">
                      {data.resinasVirgenes.map((resina) => (
                        <tr key={resina.key} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                          <td className="px-4 py-3">
                            <p className="font-bold text-slate-900 dark:text-white">{resina.label}</p>
                            <span className="text-[9px] text-slate-400 font-mono">{resina.nombreInventario}</span>
                          </td>
                          <td className="px-3 py-3 text-center font-bold text-blue-600 dark:text-blue-400">
                            {resina.porcentaje}%
                          </td>
                          <td className="px-4 py-3 text-right font-black text-slate-800 dark:text-slate-200">
                            {formatNumber(resina.kgConsumido, { minDecimals: 2, maxDecimals: 2 })} KG
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-slate-600 dark:text-slate-300">
                            {formatNumber(resina.sacasConsumidas, { minDecimals: 1, maxDecimals: 1 })} sacas
                          </td>
                          <td className="px-4 py-3 text-right font-black text-indigo-600 dark:text-indigo-400">
                            {formatNumber(resina.kgFaltante, { minDecimals: 2, maxDecimals: 2 })} KG
                            <span className="block text-[10px] text-slate-400 font-normal">
                              (~{formatNumber(resina.sacasFaltantes, { minDecimals: 1, maxDecimals: 1 })} sacas)
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <p className="font-black text-slate-900 dark:text-white">
                              {formatNumber(resina.stockActualKg, { minDecimals: 2, maxDecimals: 2 })} KG
                            </p>
                            <span className="text-[10px] text-slate-400 font-normal">
                              (~{formatNumber(resina.stockActualSacas, { minDecimals: 1, maxDecimals: 1 })} sacas)
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {renderBadgeDisponibilidad(resina)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/30 text-xs text-slate-400 italic text-center">
                  No hay resinas vírgenes configuradas en esta orden.
                </div>
              )}
            </div>

            {/* TABLA 3: Aditivos y Masterbatch */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                  3. Aditivos y Masterbatch (Dosificación Directa)
                </h4>
                <span className="text-[10px] text-slate-400 font-bold uppercase">
                  {data.aditivos.length} aditivo(s)
                </span>
              </div>

              {data.aditivos.length > 0 ? (
                <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase text-[9px] font-black tracking-wider">
                      <tr>
                        <th className="px-4 py-3">Aditivo / Masterbatch</th>
                        <th className="px-3 py-3 text-center">% Dosis</th>
                        <th className="px-4 py-3 text-right">Consumo Real</th>
                        <th className="px-4 py-3 text-right">Equivalencia Sacas</th>
                        <th className="px-4 py-3 text-right">Faltante a Meta</th>
                        <th className="px-4 py-3 text-right">Stock Almacén</th>
                        <th className="px-4 py-3 text-center">Estado Almacén</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold">
                      {data.aditivos.map((aditivo) => (
                        <tr key={aditivo.key} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                          <td className="px-4 py-3">
                            <p className="font-bold text-slate-900 dark:text-white">{aditivo.label}</p>
                            <span className="text-[9px] text-slate-400 font-mono">{aditivo.nombreInventario}</span>
                          </td>
                          <td className="px-3 py-3 text-center font-bold text-purple-600 dark:text-purple-400">
                            {aditivo.porcentaje}%
                          </td>
                          <td className="px-4 py-3 text-right font-black text-slate-800 dark:text-slate-200">
                            {formatNumber(aditivo.kgConsumido, { minDecimals: 2, maxDecimals: 2 })} KG
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-slate-600 dark:text-slate-300">
                            ~{formatNumber(aditivo.sacasConsumidas, { minDecimals: 1, maxDecimals: 1 })} sacas
                          </td>
                          <td className="px-4 py-3 text-right font-black text-indigo-600 dark:text-indigo-400">
                            {formatNumber(aditivo.kgFaltante, { minDecimals: 2, maxDecimals: 2 })} KG
                            <span className="block text-[10px] text-slate-400 font-normal">
                              (~{formatNumber(aditivo.sacasFaltantes, { minDecimals: 1, maxDecimals: 1 })} sacas)
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <p className="font-black text-slate-900 dark:text-white">
                              {formatNumber(aditivo.stockActualKg, { minDecimals: 2, maxDecimals: 2 })} KG
                            </p>
                            <span className="text-[10px] text-slate-400 font-normal">
                              (~{formatNumber(aditivo.stockActualSacas, { minDecimals: 1, maxDecimals: 1 })} sacas)
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {renderBadgeDisponibilidad(aditivo)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/30 text-xs text-slate-400 italic text-center">
                  Esta orden no lleva aditivos ni masterbatch adicionales.
                </div>
              )}
            </div>

            {/* VISTA IMPRIMIBLE: VALE DE REQUISICIÓN DE MATERIA PRIMA */}
            <div className="hidden print:block pt-8 mt-8 border-t-2 border-black">
              <div className="text-center mb-6">
                <h2 className="text-lg font-black uppercase tracking-wider">
                  VALE DE REQUISICIÓN DE MATERIA PRIMA - EXTRUSIÓN
                </h2>
                <p className="text-xs text-gray-600">
                  Documento de Retiro y Control de Sacas para Planta
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs mb-6 border p-4 rounded-lg">
                <div>
                  <p><strong>Lote:</strong> {data.orden.codigoLote || 'N/A'}</p>
                  <p><strong>Cliente:</strong> {data.orden.clienteNombre}</p>
                  <p><strong>Producto:</strong> {data.orden.productoNombre}</p>
                </div>
                <div>
                  <p><strong>Máquina:</strong> {data.orden.maquinaNombre}</p>
                  <p><strong>Fecha Impresión:</strong> {new Date().toLocaleDateString('es-VE')} {new Date().toLocaleTimeString('es-VE')}</p>
                  <p><strong>Meta Programada:</strong> {formatNumber(data.orden.metaKg)} KG (~{formatNumber(data.orden.sacasMeta, { minDecimals: 1, maxDecimals: 1 })} sacas)</p>
                </div>
              </div>

              <table className="w-full text-xs text-left border border-collapse mb-12">
                <thead>
                  <tr className="bg-gray-100 border-b">
                    <th className="p-2 border">Tipo / Material</th>
                    <th className="p-2 border text-center">% Dosis</th>
                    <th className="p-2 border text-right">Kg Requeridos Faltantes</th>
                    <th className="p-2 border text-right">Sacas a Retirar (25 kg)</th>
                    <th className="p-2 border text-center">Stock Almacén</th>
                    <th className="p-2 border text-center">Verificación Almacén</th>
                  </tr>
                </thead>
                <tbody>
                  {data.peletizado && (
                    <tr className="border-b">
                      <td className="p-2 border font-bold">Peletizado: {data.peletizado.nombre}</td>
                      <td className="p-2 border text-center">{data.peletizado.porcentaje}%</td>
                      <td className="p-2 border text-right">{formatNumber(data.peletizado.kgFaltante)} KG</td>
                      <td className="p-2 border text-right font-black">{formatNumber(data.peletizado.sacasFaltantes, { minDecimals: 1, maxDecimals: 1 })} sacas</td>
                      <td className="p-2 border text-center">{formatNumber(data.peletizado.stockActualKg)} KG</td>
                      <td className="p-2 border text-center">[ ] Conforme</td>
                    </tr>
                  )}
                  {data.resinasVirgenes.map((r) => (
                    <tr key={r.key} className="border-b">
                      <td className="p-2 border font-bold">Resina Virgen: {r.label}</td>
                      <td className="p-2 border text-center">{r.porcentaje}%</td>
                      <td className="p-2 border text-right">{formatNumber(r.kgFaltante)} KG</td>
                      <td className="p-2 border text-right font-black">{formatNumber(r.sacasFaltantes, { minDecimals: 1, maxDecimals: 1 })} sacas</td>
                      <td className="p-2 border text-center">{formatNumber(r.stockActualKg)} KG</td>
                      <td className="p-2 border text-center">[ ] Conforme</td>
                    </tr>
                  ))}
                  {data.aditivos.map((a) => (
                    <tr key={a.key} className="border-b">
                      <td className="p-2 border font-bold">Aditivo: {a.label}</td>
                      <td className="p-2 border text-center">{a.porcentaje}%</td>
                      <td className="p-2 border text-right">{formatNumber(a.kgFaltante)} KG</td>
                      <td className="p-2 border text-right font-black">{formatNumber(a.sacasFaltantes, { minDecimals: 1, maxDecimals: 1 })} sacas</td>
                      <td className="p-2 border text-center">{formatNumber(a.stockActualKg)} KG</td>
                      <td className="p-2 border text-center">[ ] Conforme</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="grid grid-cols-3 gap-8 text-center text-xs mt-16 pt-8">
                <div className="border-t border-black pt-2">
                  <p className="font-bold">Supervisor de Producción</p>
                  <p className="text-[10px] text-gray-500">Solicitante</p>
                </div>
                <div className="border-t border-black pt-2">
                  <p className="font-bold">Encargado de Almacén</p>
                  <p className="text-[10px] text-gray-500">Despacho de Sacas</p>
                </div>
                <div className="border-t border-black pt-2">
                  <p className="font-bold">Operador de Extrusora</p>
                  <p className="text-[10px] text-gray-500">Recepción en Planta</p>
                </div>
              </div>
            </div>

            {/* Botón de Cierre Inferior */}
            <div className="pt-4 flex justify-end print:hidden">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-black uppercase tracking-wider transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
