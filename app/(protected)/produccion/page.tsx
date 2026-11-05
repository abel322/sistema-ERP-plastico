'use client';

import { useState, useEffect, useMemo, useCallback, FormEvent, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
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
  Layers,
  Search,
  ChevronDown,
  ChevronUp,
  Edit3,
  Inbox,
} from 'lucide-react';
import ModalDetalleConsumoMP from '@/components/produccion/ModalDetalleConsumoMP';
import { ModalFinalizarSellado } from '@/components/produccion/ModalFinalizarSellado';
import { ModalUnificarOrdenes } from '@/components/produccion/ModalUnificarOrdenes';
import { ModalAvanzarSelladoMultiLinea } from '@/components/produccion/ModalAvanzarSelladoMultiLinea';
import { eliminarORevertirFaseSellado, eliminarOrdenProduccion, finalizarFaseSelladoConDestino } from '@/actions/produccion';
import { formatNumber } from '@/lib/utils';
import { calculateBagWeight, getPlasticDensity } from '@/lib/utils/bag-weight';
import { calcularDesperdicioInfo } from '@/lib/utils/merma';
import {
  CLASIFICACIONES_MERMA,
  calcularDesgloseMerma,
  determinarCamposMerma,
  MermaFieldConfig,
  ProductoMermaInfo,
} from '@/lib/merma-logic';
import { getTodayInputDate, formatUTCtoDisplayDate, formatUTCtoInputDate } from '@/lib/utils/dates';

const AREAS = [
  { value: 'Extrusion', label: 'Extrusión' },
  { value: 'Serigrafia', label: 'Serigrafía' },
  { value: 'Refilado', label: 'Refilado' },
  { value: 'Sellado', label: 'Sellado' },
];

const COLUMNAS = [
  { id: 'Extrusion', titulo: 'Extrusión' },
  { id: 'Serigrafia', titulo: 'Serigrafía' },
  { id: 'Refilado', titulo: 'Refilado' },
  { id: 'Sellado', titulo: 'Sellado' },
];

const LOCAL_STORAGE_KEY_AREAS = 'produccion_areas_abiertas_v1';

// Estado inicial por defecto (Extrusión y Sellado abiertas por defecto)
const ESTADO_DEFAULT_AREAS: Record<string, boolean> = {
  EXTRUSION: true,
  SERIGRAFIA: false,
  REFILADO: false,
  SELLADO: true,
};

const AREAS_CONFIG = [
  {
    id: 'EXTRUSION',
    areaDb: 'Extrusion',
    titulo: 'Extrusión',
    dotColor: 'bg-blue-600',
    desc: 'Fabricación y bobinado de película tubular',
  },
  {
    id: 'SERIGRAFIA',
    areaDb: 'Serigrafia',
    titulo: 'Serigrafía / Impresión',
    dotColor: 'bg-indigo-600',
    desc: 'Impresión continua de bobinas',
  },
  {
    id: 'REFILADO',
    areaDb: 'Refilado',
    titulo: 'Refilado',
    dotColor: 'bg-amber-600',
    desc: 'Corte lateral y acondicionamiento de bobina',
  },
  {
    id: 'SELLADO',
    areaDb: 'Sellado',
    titulo: 'Sellado y Confección',
    dotColor: 'bg-emerald-600',
    desc: 'Corte, sellado térmico y empaque final',
  },
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
  mermaColor?: number;
  mermaCristal?: number;
  mermaSinImpresion?: number;
  mermaImpreso?: number;
}

interface Produccion {
  id: string;
  codigoLote?: string | null;
  loteOrigen?: string | null;
  esOrdenMadre?: boolean;
  ordenExtrusionOrigenId?: string | null;
  nombreVariante?: string | null;
  metaKg?: number | null;
  metaUnidades?: number | null;
  ordenesSelladoHijas?: any[];
  ordenExtrusionOrigen?: any;
  fecha: string;
  turno: string;
  area: string;
  operario: string;
  cantidadProducida: number;
  unidad: string;
  merma: number;
  mermaColor?: number;
  mermaCristal?: number;
  estado: string;
  maquinaId: string;
  pedidoId?: string | null;
  productoClienteId?: string | null;
  horaInicio?: string | null;
  horaFin?: string | null;
  observaciones?: string | null;
  maquina: { id: string; nombre: string };
  pedido?: {
    id: string;
    cantidadSolicitada?: number;
    unidad?: string;
    cliente: {
      id?: string;
      nombre: string;
      tipoProducto?: string;
      conImpresion?: boolean;
    };
    productoCliente?: ProductoMermaInfo & {
      id?: string;
      nombreProducto?: string;
      tipoProducto?: string;
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
  productoCliente?: ProductoMermaInfo & {
    id?: string;
    nombreProducto?: string;
    tipoProducto?: string;
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
  registros: RegistroProduccion[];
  stockPrevio?: {
    id?: string;
    codigoLote?: string;
    lote?: string;
    cantidad: number;
    cantidadTotal?: number;
    unidad: string;
    area: string;
    tipoProducto: string;
    conImpresion: boolean;
  } | null;
  producidoKg?: number;
  bobinaDisponibleKg?: number;
  kgBobinaConsumidaTotal?: number;
  productoTerminado?: {
    id?: string;
    cantidadTotal?: number;
    cantidadDisponible?: number;
    estado?: string;
    siguienteArea?: string;
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

interface FilaProduccionHorizontalProps {
  orden: Produccion;
  areaId: string;
  isAvanzandoId: string | null;
  handleAbrirModalRegistro: (orden: Produccion) => void;
  handleEditar: (orden: Produccion) => void;
  handleAbrirModalConsumoMP: (orden: Produccion) => void;
  handleAvanzarFase: (orden: Produccion) => void;
  handleFinalizarExtrusion: (orden: Produccion) => void;
  handleFinalizarSellado: (orden: Produccion) => void;
  handleEliminarOrden: (orden: Produccion) => void;
  handleConfirmarEliminacionFase: (orden: Produccion) => void;
  faseParalela?: Produccion;
  getDisplayValues: (prod: Produccion, totalProducido: number) => any;
  calcularTotalCantidad: (registros: RegistroProduccion[]) => number;
}

export function FilaProduccionHorizontal({
  orden,
  areaId,
  isAvanzandoId,
  handleAbrirModalRegistro,
  handleEditar,
  handleAbrirModalConsumoMP,
  handleAvanzarFase,
  handleFinalizarExtrusion,
  handleFinalizarSellado,
  handleEliminarOrden,
  handleConfirmarEliminacionFase,
  faseParalela,
  getDisplayValues,
  calcularTotalCantidad,
}: FilaProduccionHorizontalProps) {
  const totalProducido = calcularTotalCantidad(orden.registros || []);
  const dv = getDisplayValues(orden, totalProducido);
  const isUnidades = dv.displayUnit?.toLowerCase().startsWith('un') || dv.displayUnit?.toLowerCase().startsWith('ud') || orden.area === 'Sellado';
  const metaKg = Number(dv.targetAmount || 0);
  const producidoKg = Number(dv.displayTotal || 0);
  const porcentaje = metaKg > 0 ? Math.min(100, Math.round((producidoKg / metaKg) * 100)) : (producidoKg > 0 ? 100 : 0);
  const esCompletado = dv.isCompleted || orden.estado === 'Finalizado' || orden.estado === 'COMPLETADO' || porcentaje >= 100;

  // Secuencia de avance según ficha técnica del producto
  const pc = orden.pedido?.productoCliente || orden.productoCliente;
  const llevaImpresion = Boolean(pc?.conImpresion ?? (orden.pedido?.cliente as any)?.conImpresion);
  const destinoSiguiente = llevaImpresion ? 'SERIGRAFÍA' : 'SELLADO';

  const isSellado = orden.area?.toUpperCase() === 'SELLADO' || areaId === 'SELLADO';
  const disponibleKg = orden.stockPrevio?.cantidad ?? 0;
  const sinStock = (orden.area?.toUpperCase() !== 'EXTRUSION' && areaId !== 'EXTRUSION') && (!orden.stockPrevio || orden.stockPrevio.cantidad <= 0);

  // Kilos brutos generados por la extrusora
  const totalExtruidoKg = Number((orden as any).producidoKg || totalProducido || producidoKg || 0);

  // Saldo físico real disponible en piso para seguir sellando
  const bobinaDisponibleKg = Number(
    (orden as any).bobinaDisponibleKg !== undefined
      ? (orden as any).bobinaDisponibleKg
      : (orden.productoTerminado?.cantidadDisponible !== undefined
          ? orden.productoTerminado.cantidadDisponible
          : (faseParalela?.stockPrevio?.cantidad !== undefined
              ? faseParalela.stockPrevio.cantidad
              : totalExtruidoKg))
  );

  // Kilos netos que Sellado ha descontado a la fecha mediante sus registros de turno
  const totalConsumidoSelladoKg = Number(
    (orden as any).kgBobinaConsumidaTotal !== undefined
      ? (orden as any).kgBobinaConsumidaTotal
      : Math.max(0, totalExtruidoKg - bobinaDisponibleKg)
  );

  // Determinar si la orden está corriendo simultáneamente en ambas áreas
  const estaEnParalelo = Boolean(
    faseParalela && (faseParalela.area === 'Sellado' || (faseParalela as any).area === 'SELLADO')
  ) || Boolean(
    (orden as any).faseExtrusion === 'EN_PROCESO' && (orden as any).faseSellado === 'EN_PROCESO'
  );

  const codigoPedido = orden.pedido?.id?.slice(-5).toUpperCase() || orden.pedidoId?.slice(-5).toUpperCase() || (orden as any).codigoPedido || 'OP';
  const clienteNombre = orden.pedido?.cliente?.nombre || (orden as any).cliente?.nombre || 'PRODUCCIÓN INTERNA';
  const productoNombre = pc?.nombreProducto || (orden as any).producto?.nombre || (orden.pedido?.cliente as any)?.tipoProducto || 'Bolsa / Bobina Sin Especificación';
  const maquinaNombre = orden.maquina?.nombre || 'Máquina no asignada';

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 px-5 py-4 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
      {/* 1. PRODUCTO PROTAGONISTA (RESALTADO) + CLIENTE + MÁQUINA */}
      <div className="lg:w-2/5 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-md bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300">
            P-{codigoPedido}
          </span>
          <span className={`px-2 py-0.5 text-[10px] font-black rounded-md uppercase tracking-tight ${
            esCompletado
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300'
              : orden.estado === 'Unificada'
              ? 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
              : 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300'
          }`}>
            {esCompletado ? 'COMPLETADO' : (orden.estado || 'EN PROCESO')}
          </span>
          {orden.esOrdenMadre && (
            <span className="px-2 py-0.5 text-[10px] font-black rounded-md uppercase tracking-tight bg-indigo-100 text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-300 flex items-center gap-1 border border-indigo-200 dark:border-indigo-800" title="Orden Madre de Extrusión">
              <Layers className="w-3 h-3 text-indigo-600" />
              <span>Orden Madre</span>
              {orden.ordenesSelladoHijas && orden.ordenesSelladoHijas.length > 0 && (
                <span className="ml-0.5 px-1 rounded-full bg-indigo-200 dark:bg-indigo-800 text-[9px]">
                  {orden.ordenesSelladoHijas.length} {orden.ordenesSelladoHijas.length === 1 ? 'línea' : 'líneas'}
                </span>
              )}
            </span>
          )}
          {orden.nombreVariante && (
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300 border border-purple-200 dark:border-purple-800" title={`Variante de producto: ${orden.nombreVariante}`}>
              Variante: {orden.nombreVariante}
            </span>
          )}
          {orden.loteOrigen && (
            <span className="text-[9px] font-mono text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-900/60 shrink-0" title={`Bobina de origen: ${orden.loteOrigen}`}>
              {orden.ordenExtrusionOrigenId ? `Pozo Madre: ${orden.loteOrigen}` : `Origen: ${orden.loteOrigen}`}
            </span>
          )}
          {faseParalela && (
            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 rounded text-[9px] font-bold border border-blue-200 dark:border-blue-900/60 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping shrink-0" />
              <span>Paralelo con {faseParalela.area}</span>
            </div>
          )}
        </div>

        {/* NOMBRE DEL PRODUCTO EN GRANDE Y NEGRITA (SIN LOTE VISIBLE) */}
        <h4 className="text-base font-black text-slate-900 dark:text-white tracking-tight leading-snug truncate" title={productoNombre}>
          {productoNombre}
        </h4>

        {/* Cliente y Máquina como subtexto ordenado */}
        <div className="flex items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400 mt-1">
          <span className="font-bold text-slate-700 dark:text-slate-300 truncate" title={clienteNombre}>
            {clienteNombre}
          </span>
          <span>•</span>
          <span className="inline-flex items-center gap-1.5 font-semibold text-blue-600 dark:text-blue-400 truncate">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse shrink-0"/>
            <span className="truncate">{maquinaNombre}</span>
          </span>
        </div>
      </div>

      {/* 2. PROGRESO Y KILOS (BARRA HORIZONTAL PANORÁMICA) */}
      <div className="lg:w-1/3 min-w-[240px]">
        <div className="flex items-baseline justify-between text-xs mb-1.5">
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
              {formatNumber(producidoKg, { minDecimals: isUnidades ? 0 : 1, maxDecimals: 2 })}
            </span>
            <span className="text-xs font-bold text-slate-500 uppercase">{dv.displayUnit}</span>
            <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400 ml-1">
              ({porcentaje}%)
            </span>
          </div>
          <div className="text-xs text-slate-500 font-medium">
            Meta: <strong className="text-slate-800 dark:text-slate-200">{formatNumber(metaKg, { minDecimals: isUnidades ? 0 : 0, maxDecimals: 2 })} {dv.displayUnit}</strong>
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200/70 dark:border-slate-700">
          <div
            className={`h-full transition-all duration-300 rounded-full ${porcentaje >= 100 ? 'bg-emerald-500' : 'bg-blue-600'}`}
            style={{ width: `${Math.min(100, porcentaje)}%` }}
          />
        </div>

        {/* Sellado WIP o Merma */}
        {isSellado ? (
          disponibleKg <= 0 ? (
            <div className="flex items-center gap-1 text-[10px] font-bold text-rose-600 dark:text-rose-400 mt-1">
              <AlertTriangle className="w-3 h-3 shrink-0 animate-pulse"/>
              <span>En espera de bobina (0 KG disp.)</span>
            </div>
          ) : (
            <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 mt-1">
              <span>Bobina en piso:</span>
              <strong className="text-emerald-700 dark:text-emerald-400">{formatNumber(disponibleKg, { minDecimals: 1, maxDecimals: 2 })} KG</strong>
            </div>
          )
        ) : Number(orden.merma || 0) > 0 ? (
          <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 mt-1">
            <span>Merma:</span>
            <strong className="text-slate-700 dark:text-slate-300">{formatNumber(Number(orden.merma), { minDecimals: 1, maxDecimals: 2 })} KG</strong>
          </div>
        ) : null}

        {/* Badge dinámico de balance WIP en Extrusión cuando corre en paralelo con Sellado */}
        {areaId === 'EXTRUSION' && estaEnParalelo && (
          <div className="mt-2 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 font-bold text-blue-700 dark:text-blue-300">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse shrink-0"/>
              <span>Bobina en Piso Disponible (WIP):</span>
              <span className="text-slate-900 dark:text-white font-black">
                {bobinaDisponibleKg.toLocaleString('es-VE', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} KG
              </span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Consumido por Sellado: <strong className="text-slate-700 dark:text-slate-300">{totalConsumidoSelladoKg.toFixed(1)} KG</strong>
            </div>
          </div>
        )}
      </div>

      {/* 3. BOTONES DE ACCIÓN HORIZONTALES */}
      <div className="flex items-center justify-end gap-2 shrink-0 flex-wrap">
        {/* Botón Principal para Registrar Turno */}
        <button
          type="button"
          onClick={() => handleAbrirModalRegistro(orden)}
          disabled={sinStock}
          className={`inline-flex items-center justify-center gap-1.5 py-2 px-3.5 text-xs font-extrabold rounded-xl text-white shadow-xs transition-colors cursor-pointer ${
            sinStock
              ? 'bg-slate-300 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          <Plus className="w-4 h-4"/>
          <span>+ Registro</span>
        </button>

        {/* Botón Dinámico de Secuencia Técnica */}
        {areaId === 'EXTRUSION' && (
          faseParalela ? (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleAvanzarFase(orden)}
                disabled={isAvanzandoId === orden.id}
                className="inline-flex items-center justify-center gap-1 py-2 px-2.5 text-xs font-bold rounded-xl text-indigo-700 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition-colors disabled:opacity-50 cursor-pointer"
                title="Añadir otra línea de Sellado para esta bobina"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Selladora</span>
              </button>
              <button
                type="button"
                onClick={() => handleFinalizarExtrusion(orden)}
                disabled={isAvanzandoId === orden.id}
                className="inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold rounded-xl text-white bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400"/>
                <span>Finalizar Extrusión</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => handleAvanzarFase(orden)}
              disabled={isAvanzandoId === orden.id}
              className="inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold rounded-xl text-slate-800 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <span>Avanzar a {destinoSiguiente === 'SERIGRAFÍA' ? 'Serigrafía' : 'Sellado'}</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400"/>
            </button>
          )
        )}

        {(areaId === 'SERIGRAFIA' || areaId === 'REFILADO') && (
          <button
            type="button"
            onClick={() => handleAvanzarFase(orden)}
            disabled={isAvanzandoId === orden.id}
            className="inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold rounded-xl text-slate-800 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <span>Avanzar a Sellado</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400"/>
          </button>
        )}

        {areaId === 'SELLADO' && (
          <button
            type="button"
            onClick={() => handleFinalizarSellado(orden)}
            disabled={isAvanzandoId === orden.id}
            className="inline-flex items-center justify-center gap-1.5 py-2 px-3.5 text-xs font-bold rounded-xl text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <CheckCircle className="w-4 h-4"/>
            <span>Finalizar</span>
          </button>
        )}

        {/* Acciones Secundarias Agrupadas */}
        <div className="flex items-center gap-1 pl-1 border-l border-slate-200 dark:border-slate-700">
          {areaId === 'EXTRUSION' && (
            <button
              type="button"
              title="Consumo de Materia Prima en Tiempo Real (Sacas y Tolva)"
              onClick={() => handleAbrirModalConsumoMP(orden)}
              className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Layers className="w-4 h-4"/>
            </button>
          )}

          <button
            type="button"
            title="Editar Orden / Turnos"
            onClick={() => handleEditar(orden)}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Edit3 className="w-4 h-4"/>
          </button>

          {/* Eliminación Condicional Segura (Solo si tiene 0 kg producidos) */}
          {producidoKg === 0 && (
            <button
              type="button"
              title={areaId === 'SELLADO' ? "Revertir y eliminar fase de sellado (0 KG)" : "Eliminar orden sin producción (0 KG)"}
              onClick={() => areaId === 'SELLADO' ? handleConfirmarEliminacionFase(orden) : handleEliminarOrden(orden)}
              disabled={isAvanzandoId === orden.id}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Trash2 className="w-4 h-4 text-rose-500"/>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Mantener compatibilidad temporal si es necesario
export const TarjetaProduccionCompacta = FilaProduccionHorizontal;

export function ProduccionContent() {
  const { data: session } = useSession() || {};
  const router = useRouter();
  const searchParams = useSearchParams();
  const pedidoIdParam = searchParams.get('pedidoId');
  const { toast } = useToast();
  const [producciones, setProducciones] = useState<Produccion[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    area: '',
    fechaInicio: '',
    fechaFin: '',
  });

  // Filtros rápidos en vivo
  const [busqueda, setBusqueda] = useState('');
  const [maquinaFiltro, setMaquinaFiltro] = useState('TODAS');
  const [ordenAFinalizar, setOrdenAFinalizar] = useState<Produccion | null>(null);
  const [showModalFinalizarSellado, setShowModalFinalizarSellado] = useState(false);

  // Estado de acordeones con persistencia en localStorage
  const [areasAbiertas, setAreasAbiertas] = useState<Record<string, boolean>>(ESTADO_DEFAULT_AREAS);
  const [isMounted, setIsMounted] = useState(false);

  // Cargar preferencia guardada al montar el cliente
  useEffect(() => {
    setIsMounted(true);
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_AREAS);
      if (saved) {
        setAreasAbiertas(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error al leer preferencias de áreas:', error);
    }
  }, []);

  // Función para alternar y guardar en localStorage
  const toggleArea = (areaId: string) => {
    setAreasAbiertas((prev) => {
      const nuevoEstado = { ...prev, [areaId]: !prev[areaId] };
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY_AREAS, JSON.stringify(nuevoEstado));
      } catch (error) {
        console.error('Error al guardar estado de áreas:', error);
      }
      return nuevoEstado;
    });
  };

  const obtenerOrdenesPorArea = useCallback(
    (areaId: string) => {
      return producciones.filter(
        (p) => p.area?.toUpperCase() === areaId.toUpperCase()
      );
    },
    [producciones]
  );

  const [maquinas, setMaquinas] = useState<Maquina[]>([]);
  // Listado dinámico de máquinas disponibles
  const maquinasDisponibles = useMemo(() => {
    const lista = new Set<string>();
    maquinas.forEach((m) => {
      if (m.nombre) lista.add(m.nombre);
    });
    producciones.forEach((o) => {
      if (o.maquina?.nombre) lista.add(o.maquina.nombre);
    });
    return Array.from(lista).sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
    );
  }, [maquinas, producciones]);

  // Función de filtrado reactivo instantáneo
  const filtrarOrdenes = useCallback(
    (ordenes: Produccion[]) => {
      return ordenes.filter((orden) => {
        // 1. Filtro de búsqueda textual
        const termino = busqueda.toLowerCase().trim();
        const clienteNombre =
          orden.pedido?.cliente?.nombre ||
          (orden as any).cliente?.nombre ||
          '';
        const productoNombre =
          orden.pedido?.productoCliente?.nombreProducto ||
          orden.productoCliente?.nombreProducto ||
          (orden as any).producto?.nombre ||
          '';
        const pedidoCodigo =
          orden.pedido?.id ||
          orden.pedidoId ||
          (orden as any).codigoPedido ||
          '';
        const loteCodigo =
          orden.codigoLote ||
          (orden as any).loteCodigo ||
          '';

        const coincideTexto =
          !termino ||
          loteCodigo.toLowerCase().includes(termino) ||
          clienteNombre.toLowerCase().includes(termino) ||
          productoNombre.toLowerCase().includes(termino) ||
          pedidoCodigo.toLowerCase().includes(termino);

        // 2. Filtro por máquina
        const coincideMaquina =
          maquinaFiltro === 'TODAS' || orden.maquina?.nombre === maquinaFiltro;

        return coincideTexto && coincideMaquina;
      });
    },
    [busqueda, maquinaFiltro]
  );

  const totalOrdenesFiltradas = useMemo(() => {
    return filtrarOrdenes(producciones).length;
  }, [producciones, filtrarOrdenes]);

  const [showCrearModal, setShowCrearModal] = useState(false);
  const [showRegistroModal, setShowRegistroModal] = useState(false);
  const [selectedProduccion, setSelectedProduccion] = useState<Produccion | null>(null);
  const [saving, setSaving] = useState(false);

  const [isEditRegistro, setIsEditRegistro] = useState(false);
  const [editRegistroId, setEditRegistroId] = useState<string | null>(null);
  const [showRegistrosListModal, setShowRegistrosListModal] = useState(false);

  const [showAvanzarModal, setShowAvanzarModal] = useState(false);
  const [avanzarProd, setAvanzarProd] = useState<Produccion | null>(null);
  const [showModalUnificar, setShowModalUnificar] = useState(false);
  const [showAvanzarSelladoMultiModal, setShowAvanzarSelladoMultiModal] = useState(false);
  const [ordenAvanzarMulti, setOrdenAvanzarMulti] = useState<Produccion | null>(null);
  const [modoAvance, setModoAvance] = useState<'paralelo' | 'finalizar'>('paralelo');
  const [avanzarMaquinaId, setAvanzarMaquinaId] = useState('');
  const [avanzarOperario, setAvanzarOperario] = useState('');
  const [avanzarTurno, setAvanzarTurno] = useState('Manana');

  const [ordenDetalleMP, setOrdenDetalleMP] = useState<Produccion | null>(null);

  const [pedidosFiltrados, setPedidosFiltrados] = useState<Pedido[]>([]);
  const [showPedidoWarning, setShowPedidoWarning] = useState(false);
  const [isAvance, setIsAvance] = useState(false);
  const [isEditProduccion, setIsEditProduccion] = useState(false);
  const [isAvanzandoId, setIsAvanzandoId] = useState<string | null>(null);
  const [editProduccionId, setEditProduccionId] = useState<string | null>(null);

  const today = getTodayInputDate();
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
    loteOrigen: '',
  });

  const [registroForm, setRegistroForm] = useState({
    turno: 'Manana',
    fecha: today,
    operario: '',
    cantidad: '',
    reporte: '',
    merma: '0',
    mermaTransparenteAlta: '0',
    mermaBlancoPollo: '0',
    mermaColor: '0',
    mermaTransparenteBaja: '0',
    mermaBlancoPego: '0',
    mermaCristal: '0',
    mermaSinImpresion: '0',
    mermaImpreso: '0',
  });

  const esOrdenImpresa = (prod: Produccion): boolean => {
    const pc = prod.pedido?.productoCliente || prod.productoCliente;
    if (pc?.conImpresion) return true;
    if (prod.pedido?.cliente?.conImpresion) return true;
    if (prod.stockPrevio?.conImpresion) return true;
    if (prod.stockPrevio?.area === 'Serigrafia') return true;
    return false;
  };

  const camposMermaVisibles: MermaFieldConfig[] = useMemo(() => {
    if (!selectedProduccion) return [];
    const prodCliente = selectedProduccion.pedido?.productoCliente || selectedProduccion.productoCliente;
    const llevaImpresion = esOrdenImpresa(selectedProduccion);
    const productoMerma: ProductoMermaInfo = {
      ...prodCliente,
      llevaImpresion,
      conImpresion: llevaImpresion,
    };
    return determinarCamposMerma(selectedProduccion.area, productoMerma);
  }, [selectedProduccion]);

  const isAdmin = (session?.user as any)?.rol === 'admin';

  useEffect(() => {
    fetchProducciones();
  }, [page, filters, pedidoIdParam]);

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
      if (pedidoIdParam) params.append('pedidoId', pedidoIdParam);
      if (filters.area) params.append('area', filters.area);
      if (filters.fechaInicio) params.append('fechaInicio', filters.fechaInicio);
      if (filters.fechaFin) params.append('fechaFin', filters.fechaFin);

      const res = await fetch(`/api/produccion?${params}`);
      const data = await res.json();
      const list = data.data || [];
      setProducciones(list);
      setTotalPages(data.totalPages || 1);

      if (pedidoIdParam && list.length === 0) {
        setFormData(prev => ({
          ...prev,
          pedidoId: pedidoIdParam,
        }));
        setShowCrearModal(true);
      }
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
      const prodCliente = selectedProduccion.pedido?.productoCliente || selectedProduccion.productoCliente;
      const llevaImpresion = esOrdenImpresa(selectedProduccion);
      const camposVisibles = determinarCamposMerma(selectedProduccion.area, {
        ...prodCliente,
        llevaImpresion,
        conImpresion: llevaImpresion,
      });
      const visibleKeys = new Set(camposVisibles.map((c) => c.key));

      const mAlta = visibleKeys.has('mermaTransparenteAlta')
        ? parseFloat((registroForm as any).mermaTransparenteAlta || '0') || 0
        : 0;
      const mPollo = visibleKeys.has('mermaBlancoPollo')
        ? parseFloat((registroForm as any).mermaBlancoPollo || '0') || 0
        : 0;
      const mColor = visibleKeys.has('mermaColor')
        ? parseFloat((registroForm as any).mermaColor || '0') || 0
        : 0;
      const mBaja = visibleKeys.has('mermaTransparenteBaja')
        ? parseFloat((registroForm as any).mermaTransparenteBaja || '0') || 0
        : 0;
      const mPego = visibleKeys.has('mermaBlancoPego')
        ? parseFloat((registroForm as any).mermaBlancoPego || '0') || 0
        : 0;
      const mTotal = mAlta + mPollo + mColor + mBaja + mPego;

      const payload = {
        ...registroForm,
        merma: mTotal.toString(),
        mermaTransparenteAlta: mAlta.toString(),
        mermaBlancoPollo: mPollo.toString(),
        mermaColor: mColor.toString(),
        mermaTransparenteBaja: mBaja.toString(),
        mermaBlancoPego: mPego.toString(),
        mermaCristal: mAlta.toString(),
        mermaSinImpresion: mAlta.toString(),
        mermaImpreso: mColor.toString(),
      };

      let res;
      if (isEditRegistro && editRegistroId) {
        res = await fetch(`/api/produccion/${selectedProduccion.id}/registros/${editRegistroId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`/api/produccion/${selectedProduccion.id}/registros`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json().catch(() => ({}));

      if (res.ok || data?.success) {
        setShowRegistroModal(false);
        setShowRegistrosListModal(false);
        resetRegistroForm();
        toast({
          title: "Éxito",
          description: data?.message || (isEditRegistro ? "Registro actualizado correctamente" : "Turno registrado correctamente"),
        });

        try {
          await fetchProducciones();
          router.refresh();
        } catch (err) {
          console.error("Error al actualizar la lista de producciones tras guardar el registro:", err);
        }
      } else {
        toast({
          title: "Error",
          description: data?.error || data?.message || "Ocurrió un error al guardar el registro",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Error de conexión al guardar el registro",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleFinalizar = async (prod: Produccion) => {
    let sobranteBobinaKg = 0;
    if (prod.area === 'Sellado' && prod.stockPrevio?.cantidad && prod.stockPrevio.cantidad > 0) {
      const resp = confirm(
        `Quedan ${prod.stockPrevio.cantidad.toFixed(2)} KG de bobina en piso.\n\n¿Deseas finalizar la fase y registrar este remanente como sobrante de bobina?`
      );
      if (!resp) return;
      sobranteBobinaKg = prod.stockPrevio.cantidad;
    } else {
      if (!confirm(`¿Finalizar la fase de ${getAreaLabel(prod.area)}?`)) return;
    }

    try {
      setIsAvanzandoId(prod.id);
      const res = await fetch(`/api/produccion/${prod.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          estado: 'Finalizado',
          completarPedido: true,
          sobranteBobinaKg,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Error al finalizar");
      }

      await fetchProducciones();
      router.refresh();
      toast({
        title: "Éxito",
        description: "Fase finalizada correctamente",
      });
    } catch (error: any) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: error?.message || "Error al finalizar el pedido",
        variant: "destructive",
      });
    } finally {
      setIsAvanzandoId(null);
    }
  };

  const handleOpenFinalizarSellado = (prod: Produccion) => {
    setOrdenAFinalizar(prod);
    setShowModalFinalizarSellado(true);
  };

  const handleConfirmarFinalizarSellado = async (destino: 'MOLIENDA' | 'ALMACEN_BOBINA', sobranteKg: number) => {
    if (!ordenAFinalizar) return;
    try {
      setIsAvanzandoId(ordenAFinalizar.id);
      const res = await finalizarFaseSelladoConDestino(ordenAFinalizar.id, destino, sobranteKg);
      if (res.success) {
        toast({
          title: "Fase de Sellado Finalizada",
          description: res.message || "La orden de sellado fue finalizada y la máquina liberada exitosamente.",
        });
        await fetchProducciones();
        router.refresh();
      } else {
        toast({
          title: "Error",
          description: res.error || "No se pudo finalizar la fase.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Error al finalizar sellado:', error);
      toast({
        title: "Error",
        description: error?.message || "Error al finalizar el pedido",
        variant: "destructive",
      });
    } finally {
      setIsAvanzandoId(null);
    }
  };

  const handleConfirmarEliminacionFase = async (orden: Produccion) => {
    const loteNombre = orden.codigoLote || orden.id.slice(0, 8).toUpperCase();
    const confirmacion = window.confirm(
      `¿Deseas cancelar y eliminar la fase de sellado para el lote ${loteNombre}?\n\n- Se liberará la selladora (${orden.maquina?.nombre || 'Selladora'}).\n- Se reactivará el botón "Avanzar a Sellado" en la extrusora para cuando las bobinas estén listas.`
    );

    if (!confirmacion) return;

    try {
      setIsAvanzandoId(orden.id);
      const res = await eliminarORevertirFaseSellado(orden.id, orden.codigoLote || undefined);
      if (res.success) {
        setProducciones((prev) => prev.filter((p) => p.id !== orden.id));
        toast({
          title: 'Fase de sellado eliminada',
          description: res.message || 'La máquina quedó disponible y el botón en Extrusión ha sido rehabilitado.',
        });
        await fetchProducciones();
        router.refresh();
      } else {
        alert(res.error || 'No se pudo eliminar la fase.');
      }
    } catch (error: any) {
      console.error('Error al eliminar fase de sellado:', error);
      alert(error?.message || 'No se pudo eliminar la fase.');
    } finally {
      setIsAvanzandoId(null);
    }
  };

  const handleEliminarOrden = async (orden: Produccion) => {
    const loteCodigo = orden.codigoLote || orden.id.slice(0, 8).toUpperCase();
    const productoNombre =
      orden.pedido?.productoCliente?.nombreProducto ||
      orden.productoCliente?.nombreProducto ||
      orden.pedido?.cliente?.nombre ||
      'Sin producto';

    const confirmacion = window.confirm(
      `¿Estás seguro de que deseas eliminar permanentemente la orden ${loteCodigo}?\n\n- Producto: ${productoNombre}\n- Máquina: ${orden.maquina?.nombre || 'Extrusora'}\n- Se cancelará la orden y la máquina quedará disponible.`
    );

    if (!confirmacion) return;

    try {
      setIsAvanzandoId(orden.id);
      const res = await eliminarOrdenProduccion(orden.id);
      if (res.success) {
        setProducciones((prev) => prev.filter((p) => p.id !== orden.id));
        toast({
          title: 'Orden de producción eliminada',
          description: res.message || `La orden ${loteCodigo} fue eliminada y la máquina quedó disponible.`,
        });
        await fetchProducciones();
        router.refresh();
      } else {
        alert(res.error || 'No se pudo eliminar la orden.');
      }
    } catch (error: any) {
      console.error('Error al eliminar orden de producción:', error);
      alert(error?.message || 'Error al intentar eliminar la orden.');
    } finally {
      setIsAvanzandoId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este registro de producción?')) return;
    try {
      await fetch(`/api/produccion/${id}`, { method: 'DELETE' });
      fetchProducciones();
      router.refresh();
      toast({
        title: "Éxito",
        description: "Registro eliminado correctamente",
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Error al eliminar el registro",
        variant: "destructive",
      });
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
      loteOrigen: '',
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
      mermaTransparenteAlta: '0',
      mermaBlancoPollo: '0',
      mermaColor: '0',
      mermaTransparenteBaja: '0',
      mermaBlancoPego: '0',
      mermaCristal: '0',
      mermaSinImpresion: '0',
      mermaImpreso: '0',
    });
  };

  const handleOpenAvanzarModal = (prod: Produccion) => {
    const nextArea = getNextArea(prod);
    if (nextArea === 'Sellado' || prod.area === 'Extrusion') {
      setOrdenAvanzarMulti(prod);
      setShowAvanzarSelladoMultiModal(true);
      return;
    }
    if (!nextArea) return;
    setAvanzarProd(prod);
    setModoAvance('paralelo');
    const maquinasNext = maquinas.filter((m) => m.area === nextArea);
    setAvanzarMaquinaId(maquinasNext[0]?.id || '');
    setAvanzarOperario('');
    setAvanzarTurno('Manana');
    setShowAvanzarModal(true);
  };

  const handleConfirmAvanzarFase = async (e: FormEvent) => {
    e.preventDefault();
    if (!avanzarProd) return;
    const nextArea = getNextArea(avanzarProd);
    if (!nextArea) return;
    if (!avanzarMaquinaId) {
      toast({
        title: "Atención",
        description: "Debe seleccionar una máquina para la nueva fase",
        variant: "destructive",
      });
      return;
    }

    setIsAvanzandoId(avanzarProd.id);
    setSaving(true);
    try {
      let lotePadre = avanzarProd.codigoLote || '';

      if (modoAvance === 'finalizar') {
        // Opción B: Finalizar la fase actual y transferir
        const resFinalizar = await fetch(`/api/produccion/${avanzarProd.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            estado: 'Finalizado',
            completarPedido: false,
            siguienteArea: nextArea,
          }),
        });

        if (!resFinalizar.ok) {
          const errData = await resFinalizar.json().catch(() => ({}));
          throw new Error(errData.error || "Error al finalizar la fase actual");
        }
        const dataFinalizada = await resFinalizar.json();
        lotePadre = dataFinalizada?.codigoLote || lotePadre;
      }

      // Crear la nueva producción en la fase siguiente (Sellado / Serigrafía)
      const unidadDestino = nextArea === 'Sellado' ? (avanzarProd.pedido?.unidad || 'Unidades') : 'Kilogramos';
      const payloadNuevaFase = {
        fecha: today,
        turno: avanzarTurno,
        area: nextArea,
        maquinaId: avanzarMaquinaId,
        operario: avanzarOperario || (session?.user as any)?.name || 'Operario',
        pedidoId: avanzarProd.pedidoId || avanzarProd.pedido?.id,
        cantidadProducida: '0',
        unidad: unidadDestino,
        merma: '0',
        loteOrigen: lotePadre,
      };

      const resCrear = await fetch('/api/produccion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadNuevaFase),
      });

      if (!resCrear.ok) {
        const errCrear = await resCrear.json().catch(() => ({}));
        throw new Error(errCrear.error || "Error al iniciar la nueva fase");
      }

      setShowAvanzarModal(false);
      setAvanzarProd(null);
      await fetchProducciones();
      router.refresh();

      toast({
        title: "Fase Iniciada con Éxito",
        description: modoAvance === 'paralelo'
          ? `${getAreaLabel(nextArea)} iniciada en paralelo con ${getAreaLabel(avanzarProd.area)} activa.`
          : `${getAreaLabel(avanzarProd.area)} finalizada y transferida a ${getAreaLabel(nextArea)}.`,
      });
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Error",
        description: err.message || "Error al avanzar fase",
        variant: "destructive",
      });
    } finally {
      setIsAvanzandoId(null);
      setSaving(false);
    }
  };

  const handleFinalizarExtrusion = async (prod: Produccion) => {
    if (!confirm(`¿Confirmar finalización de la fase de ${getAreaLabel(prod.area)}? La producción física se dará por concluida y las siguientes fases continuarán con las bobinas disponibles.`)) {
      return;
    }

    try {
      setIsAvanzandoId(prod.id);
      const res = await fetch(`/api/produccion/${prod.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          estado: 'Finalizado',
          completarPedido: false,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Error al finalizar la fase");
      }

      await fetchProducciones();
      router.refresh();

      toast({
        title: "Fase Finalizada",
        description: `La fase de ${getAreaLabel(prod.area)} ha sido finalizada correctamente.`,
      });
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Error",
        description: err.message || "Error al finalizar fase",
        variant: "destructive",
      });
    } finally {
      setIsAvanzandoId(null);
    }
  };

  const getAreaLabel = (area: string) => AREAS.find((a) => a.value === area)?.label || area;
  const getTurnoLabel = (turno: string) => TURNOS.find((t) => t.value === turno)?.label || turno;
  const formatDateShort = (dateStr: string) => formatUTCtoDisplayDate(dateStr);
  const calcularTotalCantidad = (registros: RegistroProduccion[]) => registros.reduce((sum, r) => sum + r.cantidad, 0);
  const calcularTotalMerma = (registros: RegistroProduccion[]) => registros.reduce((sum, r) => sum + r.merma + (r.mermaSinImpresion || 0) + (r.mermaImpreso || 0), 0);

  const getNextArea = (prod: Produccion): string | null => {
    const pc = prod.pedido?.productoCliente || prod.productoCliente;
    if (!pc) return null;
    const tipoProducto = pc.tipoProducto;
    const conImpresion = Boolean(pc.conImpresion);
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
    const productoCliente = prod.pedido?.productoCliente || prod.productoCliente;
    const unidadPedido = prod.pedido?.unidad;
    let peso = productoCliente?.pesoPorUnidad || 0;
    if (!peso && productoCliente?.ancho && productoCliente?.largo && productoCliente?.calibre) {
      const densidad = getPlasticDensity(productoCliente.material);
      peso = calculateBagWeight({
        tipoBolsa:
          productoCliente.anchoValvula && productoCliente.anchoValvula > 0
            ? 'valvula'
            : productoCliente.anchoFuelle && productoCliente.anchoFuelle > 0
            ? 'fuelle'
            : 'sencilla',
        ancho: productoCliente.ancho,
        largo: productoCliente.largo,
        calibre: productoCliente.calibre,
        fuelle: productoCliente.anchoFuelle,
        solapa: productoCliente.anchoSolapa,
        densidad,
      });
    }

    let targetAmount = prod.pedido?.cantidadSolicitada || 0;
    let originalTargetAmount = targetAmount;
    let originalDisplayUnit = unidadPedido || prod.unidad || '';
    let displayUnit = originalDisplayUnit;

    if (prod.area !== 'Sellado') {
      if (productoCliente?.tipoProducto === 'Bolsa' && unidadPedido === 'Unidades') {
        if (peso > 0) {
           targetAmount = (targetAmount * peso) / 1000;
           displayUnit = 'kg';
        } else {
           displayUnit = 'uds';
        }
      } else {
        displayUnit = 'kg';
      }
    } else {
      displayUnit = 'und';
    }
    return { targetAmount, displayTotal: totalProducido, displayUnit, isCompleted: targetAmount > 0 && totalProducido >= targetAmount, originalTargetAmount, originalDisplayUnit };
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
    <div className="p-4 sm:p-6 lg:p-8 bg-slate-50 dark:bg-slate-950 min-h-screen transition-colors duration-300 w-full max-w-[1600px] mx-auto flex flex-col space-y-4 pb-16">
      {/* Header Compacto de Planta */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2.5 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-indigo-200 dark:shadow-none">
            <Factory className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white leading-none">
                Producción
              </h1>
              <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[10px] font-extrabold uppercase tracking-widest rounded-md border border-indigo-200/60 dark:border-indigo-800">
                En Vivo
              </span>
            </div>
            <p className="text-slate-400 dark:text-slate-500 text-xs font-medium mt-0.5">
              {producciones.length} órdenes en planta · Vista compacta
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/produccion/historial">
            <button
              type="button"
              className="flex items-center justify-center gap-1.5 rounded-xl bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all shadow-xs cursor-pointer"
            >
              <Clock className="h-3.5 w-3.5" />
              <span>Historial</span>
            </button>
          </Link>
          <button
            type="button"
            onClick={() => setShowCrearModal(true)}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-3.5 py-1.5 text-xs font-bold text-white shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Nueva Producción</span>
          </button>
        </div>
      </div>

      {/* Barra Superior de Filtros Rápidos en Vivo */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs shrink-0">
        <div className="flex items-center gap-2 flex-1 min-w-[280px]">
          {/* Buscador Rápido */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar cliente, producto, lote o pedido..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
            />
            {busqueda && (
              <button
                type="button"
                onClick={() => setBusqueda('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Selector de Máquina */}
          <div className="relative min-w-[170px]">
            <Filter className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select
              value={maquinaFiltro}
              onChange={(e) => setMaquinaFiltro(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 dark:text-slate-200 font-medium cursor-pointer appearance-none"
            >
              <option value="TODAS">Todas las máquinas</option>
              {maquinasDisponibles.map((maq) => (
                <option key={maq} value={maq}>
                  {maq}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Contador de Órdenes Visibles */}
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 px-1 font-medium shrink-0">
          <span>
            Mostrando: <strong className="text-slate-800 dark:text-slate-200">{totalOrdenesFiltradas}</strong> activas
          </span>
          {(busqueda || maquinaFiltro !== 'TODAS') && (
            <button
              type="button"
              onClick={() => {
                setBusqueda('');
                setMaquinaFiltro('TODAS');
              }}
              className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 underline ml-1 cursor-pointer"
            >
              Restablecer
            </button>
          )}
        </div>
      </div>

      {/* Banner de filtro activo por Pedido (si se accede desde URL) */}
      {pedidoIdParam && (
        <div className="mb-2.5 flex items-center justify-between gap-3 rounded-xl bg-indigo-50 border border-indigo-200/80 dark:bg-indigo-950/40 dark:border-indigo-800/60 px-3.5 py-2 shrink-0">
          <div className="flex items-center gap-2.5">
            <Factory className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-bold text-indigo-950 dark:text-indigo-100">
              Filtrado por Pedido #{pedidoIdParam.slice(-6).toUpperCase()} ({producciones.length} órdenes)
            </span>
          </div>
          <button
            onClick={() => router.push('/produccion')}
            className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 underline cursor-pointer"
          >
            Ver todas las órdenes
          </button>
        </div>
      )}

      {/* Secciones Horizontales por Áreas con Acordeones Persistentes */}
      <div className="space-y-4 flex-1">
        {AREAS_CONFIG.map((area) => {
          const ordenesArea = filtrarOrdenes(obtenerOrdenesPorArea(area.id));
          const estaAbierto = isMounted ? Boolean(areasAbiertas[area.id]) : Boolean(ESTADO_DEFAULT_AREAS[area.id]);

          return (
            <div
              key={area.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden transition-all"
            >
              {/* Cabecera del Acordeón con Persistencia */}
              <button
                type="button"
                onClick={() => toggleArea(area.id)}
                className="w-full flex items-center justify-between px-5 py-3.5 bg-slate-50/90 hover:bg-slate-100/80 dark:bg-slate-800/60 dark:hover:bg-slate-800 transition-colors border-b border-slate-200/80 dark:border-slate-800 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className={`w-3 h-3 rounded-full ${area.dotColor} shadow-xs`} />
                  <h3 className="font-extrabold text-sm tracking-wider text-slate-900 dark:text-white uppercase">
                    {area.titulo}
                  </h3>
                  <span className="px-2.5 py-0.5 text-xs font-black rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                    {ordenesArea.length}
                  </span>
                  <span className="hidden md:inline text-xs text-slate-400 font-normal">
                    — {area.desc}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {area.id === 'EXTRUSION' && ordenesArea.length >= 2 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowModalUnificar(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 text-xs font-black uppercase tracking-wider border border-indigo-200 dark:border-indigo-800 transition-all cursor-pointer shadow-xs mr-2"
                      title="Fusionar 2 o más órdenes compatibles en una Orden Madre"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Unificar Órdenes</span>
                    </button>
                  )}
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {estaAbierto ? 'Ocultar' : 'Mostrar'}
                  </span>
                  {estaAbierto ? (
                    <ChevronUp className="w-4 h-4 text-slate-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                  )}
                </div>
              </button>

              {/* Listado de Filas de Producción */}
              {estaAbierto && (
                <div>
                  {ordenesArea.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-xs font-medium">
                      No hay órdenes activas en {area.titulo.toLowerCase()}.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                      {ordenesArea.map((orden) => (
                        <FilaProduccionHorizontal
                          key={orden.id}
                          orden={orden}
                          areaId={area.id}
                          isAvanzandoId={isAvanzandoId}
                          handleAbrirModalRegistro={openRegistroModal}
                          handleEditar={openRegistrosListModal}
                          handleAbrirModalConsumoMP={setOrdenDetalleMP}
                          handleAvanzarFase={handleOpenAvanzarModal}
                          handleFinalizarExtrusion={handleFinalizarExtrusion}
                          handleFinalizarSellado={handleOpenFinalizarSellado}
                          handleEliminarOrden={handleEliminarOrden}
                          handleConfirmarEliminacionFase={handleConfirmarEliminacionFase}
                          faseParalela={producciones.find(
                            (p) =>
                              p.id !== orden.id &&
                              p.estado === 'EnProceso' &&
                              ((orden.codigoLote && p.loteOrigen === orden.codigoLote) ||
                                (orden.pedidoId && p.pedidoId === orden.pedidoId))
                          )}
                          getDisplayValues={getDisplayValues}
                          calcularTotalCantidad={calcularTotalCantidad}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Paginación si aplica */}
      {totalPages > 1 && (
        <div className="mt-2 flex items-center justify-between bg-white dark:bg-slate-900 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs shrink-0">
          <p className="text-slate-400 font-medium">
            Página <span className="font-bold text-slate-800 dark:text-slate-200">{page}</span> de {totalPages}
          </p>
          <div className="flex gap-1.5">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 font-bold text-slate-600 dark:text-slate-300 disabled:opacity-30 cursor-pointer"
            >
              Anterior
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 font-bold text-slate-600 dark:text-slate-300 disabled:opacity-30 cursor-pointer"
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
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
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

                {formData.loteOrigen ? (
                  <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest">
                          Trazabilidad Madre-Hija
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Bobina / Lote Origen:</span>
                          <span className="px-2.5 py-0.5 rounded-lg bg-amber-200/80 dark:bg-amber-900/80 text-amber-900 dark:text-amber-100 font-mono font-black text-xs">
                            {formData.loteOrigen}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">
                        El stock se consumirá de este lote exacto
                      </span>
                    </div>
                  </div>
                ) : formData.area !== 'Extrusion' ? (
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                      Lote de Origen (Opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: EXT-20260925-A1B2"
                      value={formData.loteOrigen}
                      onChange={(e) => setFormData({ ...formData, loteOrigen: e.target.value.toUpperCase() })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all uppercase"
                    />
                    <p className="text-[10px] text-slate-400 mt-1 ml-1">
                      Indica el código de lote previo a consumir.
                    </p>
                  </div>
                ) : null}

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

      {/* Modal Avanzar Fase (Trabajo en Paralelo o Finalizar) */}
      <AnimatePresence>
        {showAvanzarModal && avanzarProd && (() => {
          const nextArea = getNextArea(avanzarProd);
          if (!nextArea) return null;
          const maquinasNext = maquinas.filter((m) => m.area === nextArea);
          const nombreAreaOrigen = getAreaLabel(avanzarProd.area);
          const nombreAreaDestino = getAreaLabel(nextArea);

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm" onClick={() => setShowAvanzarModal(false)}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
                className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] bg-white dark:bg-slate-900 p-8 shadow-2xl border border-slate-200 dark:border-slate-800 transition-colors"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                    <Factory className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
                      Avanzar a {nombreAreaDestino}
                    </h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                      Transición de Fase Operativa
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-800 mb-6">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 rounded-lg text-[10px] font-black uppercase tracking-wider">
                      Pedido #{avanzarProd.pedido?.id?.slice(-5).toUpperCase() || 'N/A'}
                    </span>
                    {avanzarProd.codigoLote && (
                      <span className="px-2.5 py-1 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-[10px] font-mono font-bold rounded-lg">
                        Lote: {avanzarProd.codigoLote}
                      </span>
                    )}
                  </div>
                  <h3 className="font-black text-sm text-slate-800 dark:text-slate-200">
                    {avanzarProd.pedido?.cliente?.nombre || 'Producción Interna'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {avanzarProd.pedido?.productoCliente?.nombreProducto || avanzarProd.productoCliente?.nombreProducto || 'Material Extruido'}
                  </p>
                </div>

                <form onSubmit={handleConfirmAvanzarFase} className="space-y-6">
                  {/* Selector de Modo */}
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">
                      Modalidad de Avance
                    </label>
                    <div className="grid grid-cols-1 gap-3">
                      <div
                        onClick={() => setModoAvance('paralelo')}
                        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                          modoAvance === 'paralelo'
                            ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="modoAvance"
                              checked={modoAvance === 'paralelo'}
                              onChange={() => setModoAvance('paralelo')}
                              className="accent-indigo-600 h-4 w-4"
                            />
                            <span className="text-sm font-black text-slate-900 dark:text-white">
                              Iniciar {nombreAreaDestino} en Paralelo
                            </span>
                          </div>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                            Recomendado
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 ml-6 leading-relaxed">
                          Mantiene la máquina de <strong>{nombreAreaOrigen}</strong> activa en proceso para continuar produciendo kilos mientras la máquina de <strong>{nombreAreaDestino}</strong> comienza a trabajar con las bobinas ya disponibles.
                        </p>
                      </div>

                      <div
                        onClick={() => setModoAvance('finalizar')}
                        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                          modoAvance === 'finalizar'
                            ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <input
                            type="radio"
                            name="modoAvance"
                            checked={modoAvance === 'finalizar'}
                            onChange={() => setModoAvance('finalizar')}
                            className="accent-indigo-600 h-4 w-4"
                          />
                          <span className="text-sm font-black text-slate-900 dark:text-white">
                            Finalizar {nombreAreaOrigen} y Transferir
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 ml-6 leading-relaxed">
                          Concluye definitivamente la fase de {nombreAreaOrigen} (se retira de la columna de {nombreAreaOrigen}) y activa {nombreAreaDestino} con todo el material producido.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Configuración de la Nueva Máquina */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                        Máquina de {nombreAreaDestino}
                      </label>
                      <select
                        required
                        value={avanzarMaquinaId}
                        onChange={(e) => setAvanzarMaquinaId(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                      >
                        <option value="">Seleccionar máquina</option>
                        {maquinasNext.map((m) => (
                          <option key={m.id} value={m.id}>{m.nombre}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                        Turno Inicial
                      </label>
                      <select
                        required
                        value={avanzarTurno}
                        onChange={(e) => setAvanzarTurno(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                      >
                        {TURNOS.map((t) => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                      Operario Responsable de {nombreAreaDestino} (Opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="Nombre del operario"
                      value={avanzarOperario}
                      onChange={(e) => setAvanzarOperario(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>

                  <div className="flex gap-4 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAvanzarModal(false)}
                      className="flex-1 px-6 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={saving || isAvanzandoId === avanzarProd.id}
                      className="flex-[2] flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-indigo-600 text-xs font-black uppercase tracking-widest text-white hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-xl shadow-indigo-100 dark:shadow-none"
                    >
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
                      {saving ? 'INICIANDO FASE...' : `INICIAR ${nombreAreaDestino.toUpperCase()}`}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* Modal Agregar Registro */}
      <AnimatePresence>
        {showRegistroModal && selectedProduccion && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm" onClick={() => setShowRegistroModal(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
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

                {/* Cantidad Producida */}
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

                {/* Clasificación Dinámica e Inteligente de Merma / Scrap */}
                <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-between ml-1">
                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      Clasificación de Merma / Scrap (kg)
                    </label>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                      {camposMermaVisibles.length === 1
                        ? '1 campo aplicable'
                        : `${camposMermaVisibles.length} campos aplicables`}
                    </span>
                  </div>

                  <div className={`grid grid-cols-1 ${camposMermaVisibles.length > 1 ? 'sm:grid-cols-2' : ''} gap-3`}>
                    {camposMermaVisibles.map((item) => {
                      const val = (registroForm as any)[item.key] || '';
                      return (
                        <div key={item.key} className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 flex items-center justify-between px-1">
                            <span className="flex items-center gap-1.5">
                              <span className={`w-2 h-2 rounded-full ${item.colorClass} shrink-0`} />
                              <span className="font-semibold">{item.label}</span>
                            </span>
                            <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider shrink-0 ml-1">
                              {item.molidoBadge}
                            </span>
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                              value={val}
                              onChange={(e) => setRegistroForm({ ...registroForm, [item.key]: e.target.value })}
                              className={`w-full bg-slate-50 dark:bg-slate-800 border ${item.borderClass} rounded-2xl px-4 py-2.5 text-sm font-black text-slate-900 dark:text-white outline-none transition-all`}
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase">KG</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Totalizador en Vivo de Merma */}
                  {(() => {
                    const mTotalLive = camposMermaVisibles.reduce(
                      (sum, c) => sum + (parseFloat((registroForm as any)[c.key] || '0') || 0),
                      0
                    );
                    return (
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <span className="font-bold text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-wider">
                          Total Merma del Turno:
                        </span>
                        <span className="font-black text-rose-600 dark:text-rose-400 text-xs">
                          {formatNumber(mTotalLive, { minDecimals: 2, maxDecimals: 2 })} KG
                        </span>
                      </div>
                    );
                  })()}
                </div>

                {/* Cálculo Dinámico de Bobina en Proceso (WIP) para Sellado */}
                {(() => {
                  if (selectedProduccion.area !== 'Sellado') return null;

                  const prodCliente = selectedProduccion.pedido?.productoCliente || selectedProduccion.productoCliente;
                  let pesoGramos = prodCliente?.pesoPorUnidad || 0;
                  if (!pesoGramos && prodCliente?.ancho && prodCliente?.largo && prodCliente?.calibre) {
                    const densidad = getPlasticDensity(prodCliente.material);
                    pesoGramos = calculateBagWeight({
                      tipoBolsa:
                        prodCliente.anchoValvula && prodCliente.anchoValvula > 0
                          ? 'valvula'
                          : prodCliente.anchoFuelle && prodCliente.anchoFuelle > 0
                          ? 'fuelle'
                          : 'sencilla',
                      ancho: prodCliente.ancho,
                      largo: prodCliente.largo,
                      calibre: prodCliente.calibre,
                      fuelle: prodCliente.anchoFuelle,
                      solapa: prodCliente.anchoSolapa,
                      densidad,
                    });
                  }

                  const bolsas = parseFloat(registroForm.cantidad || '0') || 0;
                  const kgBolsas = pesoGramos > 0 ? (bolsas * pesoGramos) / 1000 : 0;
                  const mTotalLive = camposMermaVisibles.reduce(
                    (sum, c) => sum + (parseFloat((registroForm as any)[c.key] || '0') || 0),
                    0
                  );
                  const kgConsumoTotal = kgBolsas + mTotalLive;
                  const bobinaDisponible = selectedProduccion.stockPrevio?.cantidad ?? 0;
                  const maxPermitido = bobinaDisponible * 1.05; // 5% de margen de tolerancia
                  const saldoInsuficiente = kgConsumoTotal > maxPermitido;
                  const saldoRestanteEstimado = Math.max(0, bobinaDisponible - kgConsumoTotal);

                  return (
                    <div className={`p-4 rounded-2xl border transition-all ${
                      saldoInsuficiente
                        ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-900/60'
                        : 'bg-indigo-50/60 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/40'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                          Equivalente Consumido de Bobina (WIP)
                        </span>
                        <span className={`text-xs font-black ${saldoInsuficiente ? 'text-rose-600 dark:text-rose-400' : 'text-indigo-600 dark:text-indigo-400'}`}>
                          {formatNumber(kgConsumoTotal, { minDecimals: 2, maxDecimals: 2 })} KG
                        </span>
                      </div>

                      <div className="text-[10px] font-medium text-slate-600 dark:text-slate-400 space-y-1">
                        <div className="flex justify-between">
                          <span>Bolsas producidas ({bolsas.toLocaleString('es-ES')} unds × {pesoGramos.toFixed(2)} g):</span>
                          <span className="font-bold">{formatNumber(kgBolsas, { minDecimals: 2, maxDecimals: 2 })} kg</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Merma / Scrap de sellado:</span>
                          <span className="font-bold">{formatNumber(mTotalLive, { minDecimals: 2, maxDecimals: 2 })} kg</span>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-slate-200/60 dark:border-slate-800">
                          <span>Bobina disponible en piso:</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{formatNumber(bobinaDisponible, { minDecimals: 2, maxDecimals: 2 })} kg</span>
                        </div>
                        {!saldoInsuficiente && (
                          <div className="flex justify-between">
                            <span>Saldo restante proyectado:</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatNumber(saldoRestanteEstimado, { minDecimals: 2, maxDecimals: 2 })} kg</span>
                          </div>
                        )}
                      </div>

                      {saldoInsuficiente && (
                        <div className="mt-3 p-2.5 rounded-xl bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-200 text-xs font-bold flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                          <span>
                            No hay suficiente bobina en piso. Requerido: {kgConsumoTotal.toFixed(2)} kg. Disponible de Extrusión: {bobinaDisponible.toFixed(2)} kg. Extrusión debe registrar más bobinas antes de continuar.
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {(() => {
                  let isBloqueado = false;
                  if (selectedProduccion.area === 'Sellado') {
                    const prodCliente = selectedProduccion.pedido?.productoCliente || selectedProduccion.productoCliente;
                    let pesoGramos = prodCliente?.pesoPorUnidad || 0;
                    if (!pesoGramos && prodCliente?.ancho && prodCliente?.largo && prodCliente?.calibre) {
                      const densidad = getPlasticDensity(prodCliente.material);
                      pesoGramos = calculateBagWeight({
                        tipoBolsa:
                          prodCliente.anchoValvula && prodCliente.anchoValvula > 0
                            ? 'valvula'
                            : prodCliente.anchoFuelle && prodCliente.anchoFuelle > 0
                            ? 'fuelle'
                            : 'sencilla',
                        ancho: prodCliente.ancho,
                        largo: prodCliente.largo,
                        calibre: prodCliente.calibre,
                        fuelle: prodCliente.anchoFuelle,
                        solapa: prodCliente.anchoSolapa,
                        densidad,
                      });
                    }
                    const bolsas = parseFloat(registroForm.cantidad || '0') || 0;
                    const kgBolsas = pesoGramos > 0 ? (bolsas * pesoGramos) / 1000 : 0;
                    const mTotalLive = camposMermaVisibles.reduce(
                      (sum, c) => sum + (parseFloat((registroForm as any)[c.key] || '0') || 0),
                      0
                    );
                    const kgConsumoTotal = kgBolsas + mTotalLive;
                    const bobinaDisponible = selectedProduccion.stockPrevio?.cantidad ?? 0;
                    if (kgConsumoTotal > bobinaDisponible * 1.05) {
                      isBloqueado = true;
                    }
                  }

                  return (
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
                        disabled={saving || isBloqueado}
                        className="flex-[2] flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-indigo-600 text-xs font-black uppercase tracking-widest text-white hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-xl shadow-indigo-100 dark:shadow-none cursor-pointer disabled:cursor-not-allowed"
                      >
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        {saving ? 'GUARDANDO...' : (isEditRegistro ? 'ACTUALIZAR' : 'GUARDAR')}
                      </button>
                    </div>
                  );
                })()}
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
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
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
                      <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-500">Desperdicio</th>
                      <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-500">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {selectedProduccion.registros.map((reg) => (
                      <tr key={reg.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="px-6 py-4 text-xs font-bold text-slate-900 dark:text-slate-200">{formatDateShort(reg.fecha)}</td>
                        <td className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400">{getTurnoLabel(reg.turno)}</td>
                        <td className="px-6 py-4 text-xs font-bold text-slate-900 dark:text-slate-200">{reg.operario}</td>
                        <td className="px-6 py-4 text-right text-xs font-black text-slate-900 dark:text-white">
                          {formatNumber(reg.cantidad, { minDecimals: selectedProduccion.unidad === 'Kilogramos' ? 2 : 0, maxDecimals: 2 })}
                        </td>
                        <td className="px-6 py-4 text-right text-xs font-black text-slate-900 dark:text-white">
                          {(() => {
                            const desglose = calcularDesgloseMerma(reg);
                            const activas = CLASIFICACIONES_MERMA.filter(c => (desglose as any)[c.key] > 0);
                            return (
                              <div>
                                <div>
                                  {formatNumber(desglose.mermaTotal, { minDecimals: 2, maxDecimals: 2 })}{' '}
                                  <span className="text-[10px] opacity-60">KG</span>
                                </div>
                                {activas.length > 0 && (
                                  <div className="flex flex-wrap justify-end gap-1 mt-1 font-semibold text-[9px]">
                                    {activas.map(c => (
                                      <span key={c.key} className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 border ${c.badgeClass}`}>
                                        {c.shortLabel}: {formatNumber((desglose as any)[c.key], { minDecimals: 2, maxDecimals: 2 })}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => {
                                setIsEditRegistro(true);
                                setEditRegistroId(reg.id);
                                const desglose = calcularDesgloseMerma(reg);
                                setRegistroForm({
                                  turno: reg.turno,
                                  fecha: reg.fecha ? formatUTCtoInputDate(reg.fecha) : today,
                                  operario: reg.operario,
                                  cantidad: reg.cantidad.toString(),
                                  reporte: reg.reporte || '',
                                  merma: desglose.mermaTotal.toString(),
                                  mermaTransparenteAlta: ((desglose as any).mermaTransparenteAlta || 0).toString(),
                                  mermaBlancoPollo: ((desglose as any).mermaBlancoPollo || 0).toString(),
                                  mermaColor: ((desglose as any).mermaColor || 0).toString(),
                                  mermaTransparenteBaja: ((desglose as any).mermaTransparenteBaja || 0).toString(),
                                  mermaBlancoPego: ((desglose as any).mermaBlancoPego || 0).toString(),
                                  mermaCristal: ((desglose as any).mermaTransparenteAlta || 0).toString(),
                                  mermaSinImpresion: ((desglose as any).mermaTransparenteAlta || 0).toString(),
                                  mermaImpreso: ((desglose as any).mermaColor || 0).toString(),
                                });
                                setShowRegistrosListModal(false);
                                setShowRegistroModal(true);
                              }}
                              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl transition-all"
                              title="Editar Registro"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            {isAdmin && (
                              <button
                                onClick={async () => {
                                  if (confirm('¿Eliminar este registro?')) {
                                    try {
                                      const res = await fetch(`/api/produccion/${selectedProduccion.id}/registros/${reg.id}`, { method: 'DELETE' });
                                      if (res.ok) {
                                        fetchProducciones();
                                        router.refresh();
                                        setShowRegistrosListModal(false);
                                        toast({
                                          title: "Éxito",
                                          description: "Registro eliminado correctamente"
                                        });
                                      } else {
                                        toast({
                                          title: "Error",
                                          description: "Error al eliminar registro",
                                          variant: "destructive"
                                        });
                                      }
                                    } catch (err) {
                                      toast({
                                        title: "Error",
                                        description: "Error de conexión al eliminar registro",
                                        variant: "destructive"
                                      });
                                    }
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

      {/* Modal Finalizar Sellado con Destino de Sobrante */}
      <ModalFinalizarSellado
        isOpen={showModalFinalizarSellado}
        orden={ordenAFinalizar}
        onClose={() => {
          setShowModalFinalizarSellado(false);
          setOrdenAFinalizar(null);
        }}
        onConfirm={handleConfirmarFinalizarSellado}
      />

      {/* Modal Unificar Órdenes en Extrusión */}
      <ModalUnificarOrdenes
        isOpen={showModalUnificar}
        ordenesExtrusion={producciones.filter((p) => p.area === 'Extrusion')}
        onClose={() => setShowModalUnificar(false)}
        onSuccess={() => {
          fetchProducciones();
          router.refresh();
        }}
      />

      {/* Modal Avanzar a Sellado Multi-Línea con Pozo Compartido */}
      <ModalAvanzarSelladoMultiLinea
        isOpen={showAvanzarSelladoMultiModal}
        ordenExtrusion={ordenAvanzarMulti}
        maquinas={maquinas}
        onClose={() => {
          setShowAvanzarSelladoMultiModal(false);
          setOrdenAvanzarMulti(null);
        }}
        onSuccess={() => {
          fetchProducciones();
          router.refresh();
        }}
      />

      {/* Modal Detalle de Consumo de Materia Prima y Sacas */}
      {ordenDetalleMP && (
        <ModalDetalleConsumoMP
          ordenId={ordenDetalleMP.id}
          onClose={() => setOrdenDetalleMP(null)}
        />
      )}
    </div>
  );
}

export default function ProduccionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Cargando producción...</p>
        </div>
      </div>
    }>
      <ProduccionContent />
    </Suspense>
  );
}
