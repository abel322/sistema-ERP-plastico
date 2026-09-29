'use client';

import { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
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
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  CalendarDays,
  Boxes,
  CheckCircle,
  Pencil,
  Trash2,
  Layers,
  X,
  Droplets,
  Sparkles,
} from 'lucide-react';
import { ActionPasswordModal } from '@/components/modals/ActionPasswordModal';
import { EditarProduccionModal } from '@/components/modals/EditarProduccionModal';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { formatNumber } from '@/lib/utils';
import { calcularDesperdicioInfo } from '@/lib/utils/merma';
import { agruparProduccionesPorLote } from '@/lib/utils/agrupar-producciones';
import { CLASIFICACIONES_MERMA, calcularDesgloseMerma } from '@/lib/merma-logic';
import {
  calcularSobranteFase,
  calcularResumenSobrantesGrupo,
  InfoSobrante,
  ResumenSobrantesGrupo,
} from '@/lib/sobrante-logic';

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
  mermaTransparenteAlta?: number;
  mermaBlancoPollo?: number;
  mermaColor?: number;
  mermaTransparenteBaja?: number;
  mermaBlancoPego?: number;
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
  molido?: number | null;
  formMolido?: number | null;
  formFB7000?: number | null;
  fb7000?: number | null;
  form3003?: number | null;
  p3003?: number | null;
  formLineal?: number | null;
  lineal?: number | null;
  form0240?: number | null;
  p0240?: number | null;
  form0348?: number | null;
  p0348?: number | null;
  form7000F?: number | null;
  p7000F?: number | null;
  formDeslizante?: number | null;
  deslizante?: number | null;
  formMasterbachBlanco?: number | null;
  masterbachBlanco?: number | null;
  formMasterbachNegro?: number | null;
  masterbachNegro?: number | null;
  formMasterbachAzul?: number | null;
  masterbachAzul?: number | null;
  formMasterbachAmarillo?: number | null;
  masterbachAmarillo?: number | null;
  peletizadoId?: string | null;
  peletizadoPorcentaje?: number | null;
  peletizado?: {
    id: string;
    nombre: string;
    codigo?: string;
  } | null;
  [key: string]: any;
}

const RESINAS_VIRGENES_ITEMS = [
  { key: 'formFB7000', label: 'FB7000 (%)', name: 'FB7000', color: 'bg-blue-500', barColor: 'bg-blue-500', badgeClass: 'bg-blue-100 text-blue-900 border-blue-200' },
  { key: 'form3003', label: '3003 (%)', name: '3003', color: 'bg-cyan-500', barColor: 'bg-cyan-500', badgeClass: 'bg-cyan-100 text-cyan-900 border-cyan-200' },
  { key: 'formLineal', label: 'Lineal (%)', name: 'Lineal', color: 'bg-sky-500', barColor: 'bg-sky-500', badgeClass: 'bg-sky-100 text-sky-900 border-sky-200' },
  { key: 'form0240', label: '0240 (%)', name: '0240', color: 'bg-indigo-500', barColor: 'bg-indigo-500', badgeClass: 'bg-indigo-100 text-indigo-900 border-indigo-200' },
  { key: 'form0348', label: '0348 (%)', name: '0348', color: 'bg-violet-500', barColor: 'bg-violet-500', badgeClass: 'bg-violet-100 text-violet-900 border-violet-200' },
  { key: 'form7000F', label: '7000F (%)', name: '7000F', color: 'bg-purple-500', barColor: 'bg-purple-500', badgeClass: 'bg-purple-100 text-purple-900 border-purple-200' },
];

const ADITIVOS_ITEMS = [
  { key: 'formDeslizante', label: 'Deslizante (MB-3)', name: 'Deslizante (MB-3)', color: 'bg-fuchsia-500', barColor: 'bg-fuchsia-500', badgeClass: 'bg-fuchsia-100 text-fuchsia-900 border-fuchsia-200' },
  { key: 'formMasterbachBlanco', label: 'MB Blanco (MB-1)', name: 'Masterbach Blanco (MB-1)', color: 'bg-slate-400', barColor: 'bg-slate-400', badgeClass: 'bg-slate-100 text-slate-900 border-slate-300' },
  { key: 'formMasterbachNegro', label: 'MB Negro (MB-2)', name: 'Masterbach Negro (MB-2)', color: 'bg-zinc-800', barColor: 'bg-zinc-800', badgeClass: 'bg-zinc-100 text-zinc-900 border-zinc-300' },
  { key: 'formMasterbachAzul', label: 'MB Azul (MB-4)', name: 'Masterbach Azul (MB-4)', color: 'bg-blue-700', barColor: 'bg-blue-700', badgeClass: 'bg-blue-100 text-blue-900 border-blue-300' },
  { key: 'formMasterbachAmarillo', label: 'MB Amarillo (MB-5)', name: 'Masterbach Amarillo (MB-5)', color: 'bg-amber-400', barColor: 'bg-amber-400', badgeClass: 'bg-yellow-100 text-yellow-900 border-yellow-300' },
];

interface Produccion {
  id: string;
  codigoLote?: string;
  loteOrigen?: string;
  fecha: string;
  turno: string;
  area: string;
  operario: string;
  cantidadProducida: number;
  cantidadProgramada?: number;
  sobranteKg?: number;
  sobranteUnidades?: number;
  unidad: string;
  merma: number;
  mermaTransparenteAlta?: number;
  mermaBlancoPollo?: number;
  mermaColor?: number;
  mermaTransparenteBaja?: number;
  mermaBlancoPego?: number;
  mermaCristal?: number;
  finalizadoAt: string;
  maquina: { nombre: string };
  pedido?: {
    id: string;
    cantidadSolicitada?: number;
    unidad?: string;
    cliente: { nombre: string };
    productoCliente?: ProductoEspecificacion;
  };
  productoCliente?: ProductoEspecificacion;
  registros: RegistroProduccion[];
  sobranteInfo?: InfoSobrante;
}

interface ResumenArea {
  area: string;
  _sum: { cantidadProducida: number | null; merma: number | null };
  _count: number;
}

export function HistorialProduccionContent() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [produccionesGrupadas, setProduccionesGrupadas] = useState<Produccion[][]>([]);
  const [producciones, setProducciones] = useState<Produccion[]>([]);
  const [resumenPorArea, setResumenPorArea] = useState<ResumenArea[]>([]);
  const [totales, setTotales] = useState<{
    totalProducido: number;
    totalMerma: number;
    totalMermaColor: number;
    totalMermaCristal: number;
    mermaTransparenteAlta?: number;
    mermaBlancoPollo?: number;
    mermaColor?: number;
    mermaTransparenteBaja?: number;
    mermaBlancoPego?: number;
    desgloseMermas?: Array<{
      key: string;
      label: string;
      shortLabel: string;
      codigo: string;
      cantidadKg: number;
      color: string;
      badgeClass: string;
    }>;
    totalRegistros: number;
    totalProducidoExtrusion: number;
    totalProducidoSellado: number;
    totalSobranteKg?: number;
    totalSobranteUnidades?: number;
    consumoMateriasPrimasExtrusion?: Record<string, number>;
    consumoPeletizados?: Array<{ id: string; nombre: string; codigo?: string; cantidadKg: number }>;
  }>({
    totalProducido: 0,
    totalMerma: 0,
    totalMermaColor: 0,
    totalMermaCristal: 0,
    totalRegistros: 0,
    totalProducidoExtrusion: 0,
    totalProducidoSellado: 0,
    totalSobranteKg: 0,
    totalSobranteUnidades: 0,
  });
  const [showConsumoDropdown, setShowConsumoDropdown] = useState(false);
  const consumoDropdownRef = useRef<HTMLDivElement>(null);

  // Parámetros y estado de filtrado temporal histórico
  const [periodo, setPeriodo] = useState<string>(() => searchParams.get('periodo') || 'semana');
  const [offset, setOffset] = useState<number>(() => parseInt(searchParams.get('offset') || '0', 10));
  const [desde, setDesde] = useState<string>(() => searchParams.get('desde') || '');
  const [hasta, setHasta] = useState<string>(() => searchParams.get('hasta') || '');
  const [customDesde, setCustomDesde] = useState<string>(() => searchParams.get('desde') || '');
  const [customHasta, setCustomHasta] = useState<string>(() => searchParams.get('hasta') || '');
  const [periodoLabel, setPeriodoLabel] = useState<string>('');
  const [fechaInicio, setFechaInicio] = useState<string>('');
  const [fechaFin, setFechaFin] = useState<string>('');
  const [showCustomRange, setShowCustomRange] = useState<boolean>(() => !!(searchParams.get('desde') && searchParams.get('hasta')));
  const [filterArea, setFilterArea] = useState<string>(() => searchParams.get('area') || '');

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [actionModal, setActionModal] = useState({ isOpen: false, type: 'editar' as 'editar' | 'eliminar', id: '' });
  const [editarModalOpen, setEditarModalOpen] = useState(false);
  const [eliminando, setEliminando] = useState<string | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (consumoDropdownRef.current && !consumoDropdownRef.current.contains(event.target as Node)) {
        setShowConsumoDropdown(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setShowConsumoDropdown(false);
      }
    }
    if (showConsumoDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showConsumoDropdown]);

  // Sincronización en URL sin recarga completa
  const updateUrl = (p: string, off: number, d?: string, h?: string, a?: string) => {
    const params = new URLSearchParams();
    if (d && h) {
      params.set('desde', d);
      params.set('hasta', h);
    } else {
      params.set('periodo', p);
      if (off !== 0) params.set('offset', off.toString());
    }
    const areaVal = a !== undefined ? a : filterArea;
    if (areaVal) params.set('area', areaVal);

    const query = params.toString();
    const newUrl = query ? `${pathname}?${query}` : pathname;
    window.history.replaceState(null, '', newUrl);
  };

  const fetchHistorial = async (override?: {
    periodo?: string;
    offset?: number;
    desde?: string;
    hasta?: string;
    area?: string;
    page?: number;
  }) => {
    try {
      setLoading(true);
      const activePeriodo = override?.periodo !== undefined ? override.periodo : periodo;
      const activeOffset = override?.offset !== undefined ? override.offset : offset;
      const activeDesde = override?.desde !== undefined ? override.desde : desde;
      const activeHasta = override?.hasta !== undefined ? override.hasta : hasta;
      const activeArea = override?.area !== undefined ? override.area : filterArea;
      const activePage = override?.page !== undefined ? override.page : page;

      const params = new URLSearchParams({
        page: activePage.toString(),
        limit: '10',
      });

      if (activeDesde && activeHasta) {
        params.append('desde', activeDesde);
        params.append('hasta', activeHasta);
      } else {
        params.append('periodo', activePeriodo);
        if (activeOffset !== 0) {
          params.append('offset', activeOffset.toString());
        }
      }

      if (activeArea) params.append('area', activeArea);

      const res = await fetch(`/api/produccion/historial?${params}`);
      const data = await res.json();

      setProducciones(data.data || []);
      const grupos = agruparProduccionesPorLote(data.data || []);
      setProduccionesGrupadas(grupos);

      setResumenPorArea(data.resumenPorArea || []);
      setTotales(data.totales || {
        totalProducido: 0,
        totalMerma: 0,
        totalMermaColor: 0,
        totalMermaCristal: 0,
        totalRegistros: 0,
        totalProducidoExtrusion: 0,
        totalProducidoSellado: 0,
        totalSobranteKg: 0,
        totalSobranteUnidades: 0,
      });
      setTotalPages(data.totalPages || 1);
      setFechaInicio(data.fechaInicio || '');
      setFechaFin(data.fechaFin || '');
      setPeriodoLabel(data.periodoLabel || '');
    } catch (error) {
      console.error('Error al obtener historial:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistorial();
  }, [page]);

  // Manejo de navegación temporal (Anterior / Siguiente)
  const navegarPeriodo = (dir: -1 | 1) => {
    if (periodo === 'personalizado') {
      const newOffset = dir;
      setPeriodo('semana');
      setOffset(newOffset);
      setDesde('');
      setHasta('');
      setPage(1);
      updateUrl('semana', newOffset, '', '', filterArea);
      fetchHistorial({ periodo: 'semana', offset: newOffset, desde: '', hasta: '', page: 1 });
      return;
    }

    const newOffset = offset + dir;
    if (newOffset > 0) return; // No permitir navegar al futuro

    setOffset(newOffset);
    setDesde('');
    setHasta('');
    setPage(1);
    updateUrl(periodo, newOffset, '', '', filterArea);
    fetchHistorial({ periodo, offset: newOffset, desde: '', hasta: '', page: 1 });
  };

  const seleccionarPeriodoRapido = (tipo: 'semana' | 'mes') => {
    setPeriodo(tipo);
    setOffset(0);
    setDesde('');
    setHasta('');
    setShowCustomRange(false);
    setPage(1);
    updateUrl(tipo, 0, '', '', filterArea);
    fetchHistorial({ periodo: tipo, offset: 0, desde: '', hasta: '', page: 1 });
  };

  const restablecerActual = () => {
    setPeriodo('semana');
    setOffset(0);
    setDesde('');
    setHasta('');
    setShowCustomRange(false);
    setPage(1);
    updateUrl('semana', 0, '', '', filterArea);
    fetchHistorial({ periodo: 'semana', offset: 0, desde: '', hasta: '', page: 1 });
  };

  const aplicarRangoPersonalizado = () => {
    if (!customDesde || !customHasta) {
      alert('Por favor selecciona una fecha Desde y una fecha Hasta.');
      return;
    }

    let dIni = customDesde;
    let dFin = customHasta;
    if (dIni > dFin) {
      const tmp = dIni;
      dIni = dFin;
      dFin = tmp;
      setCustomDesde(dIni);
      setCustomHasta(dFin);
    }

    setDesde(dIni);
    setHasta(dFin);
    setPeriodo('personalizado');
    setOffset(0);
    setPage(1);
    updateUrl('personalizado', 0, dIni, dFin, filterArea);
    fetchHistorial({ periodo: 'personalizado', offset: 0, desde: dIni, hasta: dFin, page: 1 });
  };

  const aplicarAtajoFechas = (diasAtras: number) => {
    const hoy = new Date();
    const fechaFinStr = hoy.toISOString().split('T')[0];
    const fechaIniDate = new Date();
    fechaIniDate.setDate(hoy.getDate() - diasAtras);
    const fechaIniStr = fechaIniDate.toISOString().split('T')[0];

    setCustomDesde(fechaIniStr);
    setCustomHasta(fechaFinStr);
    setDesde(fechaIniStr);
    setHasta(fechaFinStr);
    setPeriodo('personalizado');
    setOffset(0);
    setPage(1);
    updateUrl('personalizado', 0, fechaIniStr, fechaFinStr, filterArea);
    fetchHistorial({ periodo: 'personalizado', offset: 0, desde: fechaIniStr, hasta: fechaFinStr, page: 1 });
  };

  const cambiarArea = (nuevaArea: string) => {
    setFilterArea(nuevaArea);
    setPage(1);
    updateUrl(periodo, offset, desde, hasta, nuevaArea);
    fetchHistorial({ area: nuevaArea, page: 1 });
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

  const calcularMetricasGrupo = (grupo: Produccion[]) => {
    if (!grupo || grupo.length === 0) return null;

    // Asumimos que el grupo ya está ordenado secuencialmente en agruparProduccionesPorLote
    // (Extrusión -> Serigrafía -> Refilado -> Sellado).
    // La última etapa alcanzada será el último elemento del arreglo.
    const ultimaFase = grupo[grupo.length - 1];

    const cantidadTotal = ultimaFase.registros && ultimaFase.registros.length > 0
      ? calcularTotalCantidad(ultimaFase.registros)
      : ultimaFase.cantidadProducida;

    const itemsParaMerma = grupo.flatMap(p => (p.registros && p.registros.length > 0 ? p.registros : [p]));
    const desgloseGrupo = calcularDesgloseMerma(itemsParaMerma);
    const mermaTotal = desgloseGrupo.mermaTotal;
    const mermaColor = desgloseGrupo.mermaColor;
    const mermaCristal = desgloseGrupo.mermaTransparenteAlta;

    // Obtener datos del pedido o producto para el título
    const pedido = grupo.find(p => p.pedido)?.pedido;
    const productoCliente = pedido?.productoCliente || grupo.find(p => p.productoCliente)?.productoCliente;
    const clienteNombre = pedido?.cliente?.nombre || 'Cliente Interno Genérico';
    const productoNombre = productoCliente?.tipoProducto || 'Producto No Especificado';

    let titulo = '';
    if (pedido) {
      // Usar ID corto del pedido si existe
      titulo = `Orden #${pedido.id.slice(0, 6).toUpperCase()} - ${clienteNombre} - ${productoNombre}`;
    } else {
      // Usar lote raíz como referencia
      const loteRaiz = grupo[0].codigoLote || grupo[0].id.slice(0, 6).toUpperCase();
      titulo = `Lote: ${loteRaiz} · ${clienteNombre} - ${productoNombre}`;
    }

    const isUnidades = ultimaFase.area === 'Sellado' || ultimaFase.unidad?.toLowerCase().startsWith('un') || ultimaFase.unidad?.toLowerCase().startsWith('ud');
    const resumenSobrantes = calcularResumenSobrantesGrupo(grupo);

    return {
      ultimaFase,
      cantidadTotal,
      mermaTotal,
      mermaColor,
      mermaCristal,
      titulo,
      isUnidades,
      resumenSobrantes,
    };
  };

  // Consolidado de consumo de materias primas procesadas en Extrusión
  const {
    consumosMateriaPrima,
    resinasConsumidas,
    peletizadosConsumidos,
    aditivosConsumidos,
    subtotalResinas,
    subtotalPeletizados,
    subtotalAditivos,
    totalBaseExtruida,
    totalGeneralMaterial,
  } = useMemo(() => {
    const totalesCalc: Record<string, number> = {
      formFB7000: 0,
      form3003: 0,
      formLineal: 0,
      form0240: 0,
      form0348: 0,
      form7000F: 0,
      formDeslizante: 0,
      formMasterbachBlanco: 0,
      formMasterbachNegro: 0,
      formMasterbachAzul: 0,
      formMasterbachAmarillo: 0,
    };

    // Mapa de peletizados específicos { id: { name, cantidadKg } }
    const peletizadosMap: Record<string, { id: string; name: string; cantidadKg: number }> = {};

    // 1. Si el backend envió consumoPeletizados específico
    if (totales.consumoPeletizados && Array.isArray(totales.consumoPeletizados) && totales.consumoPeletizados.length > 0) {
      totales.consumoPeletizados.forEach((pel: any) => {
        const kg = Number(pel.cantidadKg) || 0;
        if (kg > 0.001) {
          const key = pel.id || pel.nombre;
          peletizadosMap[key] = {
            id: key,
            name: pel.nombre || 'Material Recuperado',
            cantidadKg: (peletizadosMap[key]?.cantidadKg || 0) + kg,
          };
        }
      });
    }

    // 2. Procesar resinas y aditivos desde totales
    if (totales.consumoMateriasPrimasExtrusion && Object.keys(totales.consumoMateriasPrimasExtrusion).length > 0) {
      Object.entries(totales.consumoMateriasPrimasExtrusion).forEach(([k, v]) => {
        if (k !== 'molido') {
          totalesCalc[k] = (totalesCalc[k] || 0) + (Number(v) || 0);
        }
      });

      // Si hubo molido pero ningún peletizado específico en consumoPeletizados:
      const molidoBackend = Number(totales.consumoMateriasPrimasExtrusion.molido) || 0;
      if (Object.keys(peletizadosMap).length === 0 && molidoBackend > 0.001) {
        peletizadosMap['general'] = {
          id: 'general',
          name: 'Material Recuperado / Molido',
          cantidadKg: molidoBackend,
        };
      }
    } else {
      // Cálculo de respaldo directamente desde las producciones cargadas
      const ordenesExtrusion = producciones.filter((p) => p.area === 'Extrusion');
      ordenesExtrusion.forEach((ord) => {
        const kgBobinas = ord.registros && ord.registros.length > 0
          ? ord.registros.reduce((acc, r) => acc + (Number(r.cantidad) || 0), 0)
          : (Number(ord.cantidadProducida) || 0);
        // La base de consumo son estrictamente los kilos netos de bobinas producidas (sin merma)
        const kgExtrusion = kgBobinas;

        if (kgExtrusion <= 0) return;

        const f = ord.productoCliente || ord.pedido?.productoCliente;
        if (!f) return;

        // 1. Balance Base Polímero: Peletizado
        const peletizadoPct = Number(f.peletizadoPorcentaje ?? f.molido ?? f.formMolido ?? 0);
        const kgPel = peletizadoPct > 0 ? kgExtrusion * (peletizadoPct / 100) : 0;
        if (kgPel > 0) {
          const pelNombre = f.peletizado?.nombre || 'Material Recuperado / Molido';
          const pelId = f.peletizadoId || pelNombre;
          if (!peletizadosMap[pelId]) {
            peletizadosMap[pelId] = {
              id: pelId,
              name: pelNombre,
              cantidadKg: 0,
            };
          }
          peletizadosMap[pelId].cantidadKg += kgPel;
        }

        // 2. Balance Base Polímero: Resinas Vírgenes (distribución proporcional sobre kgVirgenTotal)
        const kgVirgenTotal = Math.max(0, kgExtrusion - kgPel);

        const resinaPcts = {
          formFB7000: Number(f.formFB7000 ?? f.fb7000 ?? 0),
          form3003: Number(f.form3003 ?? f.p3003 ?? 0),
          formLineal: Number(f.formLineal ?? f.lineal ?? 0),
          form0240: Number(f.form0240 ?? f.p0240 ?? 0),
          form0348: Number(f.form0348 ?? f.p0348 ?? 0),
          form7000F: Number(f.form7000F ?? f.p7000F ?? 0),
        };

        const sumaVirgen = Object.values(resinaPcts).reduce((acc, val) => acc + val, 0);

        if (kgVirgenTotal > 0 && sumaVirgen > 0) {
          totalesCalc.formFB7000 += kgVirgenTotal * (resinaPcts.formFB7000 / sumaVirgen);
          totalesCalc.form3003 += kgVirgenTotal * (resinaPcts.form3003 / sumaVirgen);
          totalesCalc.formLineal += kgVirgenTotal * (resinaPcts.formLineal / sumaVirgen);
          totalesCalc.form0240 += kgVirgenTotal * (resinaPcts.form0240 / sumaVirgen);
          totalesCalc.form0348 += kgVirgenTotal * (resinaPcts.form0348 / sumaVirgen);
          totalesCalc.form7000F += kgVirgenTotal * (resinaPcts.form7000F / sumaVirgen);
        }

        // 3. Aditivos: dosificación externa al 100% sobre kgExtrusion
        totalesCalc.formDeslizante += kgExtrusion * ((Number(f.formDeslizante ?? f.deslizante ?? 0)) / 100);
        totalesCalc.formMasterbachBlanco += kgExtrusion * ((Number(f.formMasterbachBlanco ?? f.masterbachBlanco ?? 0)) / 100);
        totalesCalc.formMasterbachNegro += kgExtrusion * ((Number(f.formMasterbachNegro ?? f.masterbachNegro ?? 0)) / 100);
        totalesCalc.formMasterbachAzul += kgExtrusion * ((Number(f.formMasterbachAzul ?? f.masterbachAzul ?? 0)) / 100);
        totalesCalc.formMasterbachAmarillo += kgExtrusion * ((Number(f.formMasterbachAmarillo ?? f.masterbachAmarillo ?? 0)) / 100);
      });
    }

    // 1. Resinas Vírgenes
    const resinas = RESINAS_VIRGENES_ITEMS
      .map((m) => ({
        ...m,
        cantidadKg: totalesCalc[m.key] || 0,
        tipo: 'resina' as const,
      }))
      .filter((m) => m.cantidadKg > 0.001);

    // 2. Peletizados
    const peletizados = Object.values(peletizadosMap)
      .filter((p) => p.cantidadKg > 0.001)
      .map((p, idx) => ({
        key: `pel_${p.id}_${idx}`,
        label: `${p.name} (%)`,
        name: p.name,
        cantidadKg: p.cantidadKg,
        color: 'bg-amber-500',
        barColor: 'bg-amber-500',
        badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
        tipo: 'peletizado' as const,
      }));

    // 3. Aditivos
    const aditivos = ADITIVOS_ITEMS
      .map((m) => ({
        ...m,
        cantidadKg: totalesCalc[m.key] || 0,
        tipo: 'aditivo' as const,
      }))
      .filter((m) => m.cantidadKg > 0.001);

    const subtotalResinas = resinas.reduce((acc, m) => acc + m.cantidadKg, 0);
    const subtotalPeletizados = peletizados.reduce((acc, m) => acc + m.cantidadKg, 0);
    const subtotalAditivos = aditivos.reduce((acc, m) => acc + m.cantidadKg, 0);

    // Base extruida (100% de polímero = Resinas + Peletizado)
    const totalBaseExtruida = subtotalResinas + subtotalPeletizados;
    const todos = [...resinas, ...peletizados, ...aditivos];
    const totalGeneralMaterial = totalBaseExtruida + subtotalAditivos;

    return {
      consumosMateriaPrima: todos,
      resinasConsumidas: resinas,
      peletizadosConsumidos: peletizados,
      aditivosConsumidos: aditivos,
      subtotalResinas,
      subtotalPeletizados,
      subtotalAditivos,
      totalBaseExtruida,
      totalGeneralMaterial,
    };
  }, [totales.consumoMateriasPrimasExtrusion, totales.consumoPeletizados, producciones]);

  // Clasificaciones de merma activas (> 0 kg) en el período filtrado para la tarjeta roja
  const mermasActivasPeriodo = useMemo(() => {
    if (totales.desgloseMermas && totales.desgloseMermas.length > 0) {
      return totales.desgloseMermas.filter((m) => (m.cantidadKg || 0) > 0);
    }
    return CLASIFICACIONES_MERMA.map((c) => ({
      key: c.key,
      label: c.label,
      shortLabel: c.shortLabel,
      cantidadKg: Number((totales as any)[c.key]) || 0,
    })).filter((m) => m.cantidadKg > 0);
  }, [totales]);

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

        {/* Filtros de Período y Navegación Histórica */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {/* Botones rápidos: Esta Semana / Este Mes */}
              <div className="flex rounded-xl border border-gray-200 bg-white p-1 shadow-xs">
                <button
                  type="button"
                  onClick={() => seleccionarPeriodoRapido('semana')}
                  className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold transition-all ${
                    periodo === 'semana' && offset === 0 && !desde
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Calendar className="h-4 w-4" />
                  Esta Semana
                </button>
                <button
                  type="button"
                  onClick={() => seleccionarPeriodoRapido('mes')}
                  className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold transition-all ${
                    periodo === 'mes' && offset === 0 && !desde
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Calendar className="h-4 w-4" />
                  Este Mes
                </button>
              </div>

              {/* Navegador de período temporal con flechas (< y >) */}
              <div className="flex items-center rounded-xl border border-gray-200 bg-white p-1 shadow-xs">
                <button
                  type="button"
                  onClick={() => navegarPeriodo(-1)}
                  className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 active:scale-95 transition-all"
                  title="Retroceder al período anterior"
                  aria-label="Período anterior"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <div className="px-3 py-1 text-center min-w-[140px] sm:min-w-[190px]">
                  <span className="text-xs sm:text-sm font-bold text-gray-800 flex items-center justify-center gap-1.5">
                    {periodoLabel || (periodo === 'semana' ? 'Esta Semana' : 'Este Mes')}
                    {offset !== 0 && (
                      <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full border border-amber-200">
                        {offset < 0 ? `${offset}` : `+${offset}`}
                      </span>
                    )}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => navegarPeriodo(1)}
                  disabled={offset >= 0 && !desde && !hasta}
                  className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-all"
                  title="Avanzar al período siguiente"
                  aria-label="Período siguiente"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* Botón de restablecer a período actual si está desfasado */}
              {(offset !== 0 || !!desde) && (
                <button
                  type="button"
                  onClick={restablecerActual}
                  className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 active:scale-95 transition-all shadow-xs"
                  title="Restablecer a la semana actual"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Volver a Hoy</span>
                </button>
              )}

              {/* Botón para abrir / cerrar selector de rango personalizado */}
              <button
                type="button"
                onClick={() => setShowCustomRange(!showCustomRange)}
                className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-sm font-semibold transition-all ${
                  showCustomRange || (desde && hasta)
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-xs'
                    : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 shadow-xs'
                }`}
              >
                <CalendarDays className="h-4 w-4" />
                <span>Rango Libre</span>
              </button>
            </div>

            {/* Selector de Área */}
            <div className="flex items-center gap-2">
              <select
                value={filterArea}
                onChange={(e) => cambiarArea(e.target.value)}
                className="rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-gray-800 shadow-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="">Todas las áreas</option>
                {AREAS.map((a) => (
                  <option key={a.value} value={a.value}>{a.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Panel Desplegable de Rango Personalizado */}
          <AnimatePresence>
            {showCustomRange && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3 mb-3">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm font-bold text-gray-900">Seleccionar Rango de Fechas Histórico</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => aplicarAtajoFechas(7)}
                      className="px-2.5 py-1 text-xs font-medium rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                    >
                      Últimos 7 días
                    </button>
                    <button
                      type="button"
                      onClick={() => aplicarAtajoFechas(30)}
                      className="px-2.5 py-1 text-xs font-medium rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                    >
                      Últimos 30 días
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const hoy = new Date();
                        const primerDiaMesAnt = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
                        const ultimoDiaMesAnt = new Date(hoy.getFullYear(), hoy.getMonth(), 0);
                        const d1 = primerDiaMesAnt.toISOString().split('T')[0];
                        const d2 = ultimoDiaMesAnt.toISOString().split('T')[0];
                        setCustomDesde(d1);
                        setCustomHasta(d2);
                        setDesde(d1);
                        setHasta(d2);
                        setPeriodo('personalizado');
                        setOffset(0);
                        setPage(1);
                        updateUrl('personalizado', 0, d1, d2, filterArea);
                        fetchHistorial({ periodo: 'personalizado', offset: 0, desde: d1, hasta: d2, page: 1 });
                      }}
                      className="px-2.5 py-1 text-xs font-medium rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                    >
                      Mes Anterior
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-gray-600">Desde:</label>
                    <input
                      type="date"
                      value={customDesde}
                      onChange={(e) => setCustomDesde(e.target.value)}
                      className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-800 shadow-xs focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-gray-600">Hasta:</label>
                    <input
                      type="date"
                      value={customHasta}
                      onChange={(e) => setCustomHasta(e.target.value)}
                      className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-800 shadow-xs focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={aplicarRangoPersonalizado}
                      className="rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700 active:scale-95 transition-all shadow-xs"
                    >
                      Filtrar Período
                    </button>

                    {(desde || hasta) && (
                      <button
                        type="button"
                        onClick={restablecerActual}
                        className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                      >
                        Limpiar
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Tarjetas de Resumen */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 p-6 text-white shadow-lg flex flex-col justify-between"
          >
            {/* Fila superior: Icono + Título completo y botón solo en móvil (< sm) */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3 min-w-0">
                <div className="rounded-lg bg-white/20 p-3 shrink-0">
                  <Package className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white/90 whitespace-nowrap">Total Producido</p>
                </div>
              </div>

              {/* Botón arriba exclusivamente en móvil (< sm) */}
              <button
                type="button"
                onClick={() => setShowConsumoDropdown(true)}
                className="flex sm:hidden items-center gap-1 text-xs py-1 px-2.5 rounded-md font-medium shrink-0 bg-white/20 hover:bg-white/30 text-white border border-white/25 active:scale-95 transition-all shadow-sm"
                title="Ver desglose de resinas y molido extruidos"
                aria-label="Ver desglose de materias primas"
              >
                <Layers className="h-3.5 w-3.5 shrink-0" />
                <span>Consumo MP</span>
              </button>
            </div>

            {/* Valor en KG / UND con espacio visual amplio */}
            <div className="mt-2 flex-1">
              {!filterArea ? (
                <>
                  <p className="text-2xl font-bold tracking-tight text-white">
                    {formatNumber(totales.totalProducidoExtrusion || 0, { minDecimals: 2, maxDecimals: 2 })} KG
                  </p>
                  <p className="text-xs text-white/90 mt-0.5 font-medium">
                    Terminado: {formatNumber(totales.totalProducidoSellado || 0, { minDecimals: 0, maxDecimals: 0 })} UND
                  </p>
                </>
              ) : (
                <p className="text-2xl font-bold tracking-tight text-white">
                  {formatNumber(totales.totalProducido, {
                    minDecimals: getUnidadForArea(filterArea) === 'UND' ? 0 : 2,
                    maxDecimals: getUnidadForArea(filterArea) === 'UND' ? 0 : 2
                  })} {getUnidadForArea(filterArea)}
                </p>
              )}

              {/* Indicador de excedente/sobrante consolidado en el período */}
              {((totales.totalSobranteKg || 0) > 0 || (totales.totalSobranteUnidades || 0) > 0) && (
                <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-white/20 backdrop-blur-xs px-2.5 py-1 text-xs font-semibold text-yellow-200 border border-white/20 shadow-xs">
                  <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
                  <span>
                    Excedente: {(totales.totalSobranteKg || 0) > 0 ? `+${formatNumber(totales.totalSobranteKg, { minDecimals: 2, maxDecimals: 2 })} kg` : ''} {(totales.totalSobranteUnidades || 0) > 0 ? `+${formatNumber(totales.totalSobranteUnidades, { minDecimals: 0, maxDecimals: 0 })} UND` : ''}
                  </span>
                </div>
              )}
            </div>

            {/* Botón Consumo MP al pie en pantallas sm, md y lg */}
            <button
              type="button"
              onClick={() => setShowConsumoDropdown(true)}
              className="hidden sm:flex items-center justify-center gap-1.5 w-full mt-2.5 py-1 px-2.5 rounded-lg text-xs font-semibold bg-white/20 hover:bg-white/30 text-white border border-white/25 active:scale-95 transition-all shadow-sm"
              title="Ver desglose de resinas y molido extruidos"
              aria-label="Ver desglose de materias primas"
            >
              <Layers className="h-3.5 w-3.5 shrink-0" />
              <span>Consumo MP</span>
            </button>
          </motion.div>

          {/* Modal Centrado de Consumo de Materia Prima con Backdrop */}
          <AnimatePresence>
            {showConsumoDropdown && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                onClick={() => setShowConsumoDropdown(false)}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  ref={consumoDropdownRef}
                  onClick={(e: React.MouseEvent) => e.stopPropagation()}
                  className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 overflow-hidden"
                >
                  {/* Cabecera del Modal */}
                  <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3.5 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 rounded-xl shrink-0">
                        <Layers className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-gray-900 dark:text-white leading-tight">
                          Consumo de Materia Prima
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          Procesado en Extrusión · {periodo === 'semana' ? 'Esta Semana' : 'Este Mes'}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowConsumoDropdown(false)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                      aria-label="Cerrar modal"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Lista de consumos agrupada */}
                  {consumosMateriaPrima.length === 0 ? (
                    <div className="py-8 text-center text-xs text-gray-500 dark:text-gray-400">
                      <p className="font-semibold text-sm text-gray-700 dark:text-gray-300">Sin consumos registrados</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 max-w-xs mx-auto">
                        No hay órdenes de extrusión con formulación registrada mayor a 0 kg en este período.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[22rem] overflow-y-auto pr-1">
                      {/* Grupo 1: Resinas Vírgenes */}
                      {resinasConsumidas.length > 0 && (
                        <div>
                          <div className="flex items-center justify-between px-1 mb-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                              <Package className="h-3.5 w-3.5" />
                              Resinas Vírgenes
                            </span>
                            <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400">
                              {formatNumber(subtotalResinas, { minDecimals: 2, maxDecimals: 2 })} kg
                              {totalBaseExtruida > 0 && ` (${((subtotalResinas / totalBaseExtruida) * 100).toFixed(1)}%)`}
                            </span>
                          </div>
                          <div className="space-y-2">
                            {resinasConsumidas.map((item) => {
                              const pct = totalBaseExtruida > 0
                                ? ((item.cantidadKg / totalBaseExtruida) * 100).toFixed(1)
                                : '0.0';
                              return (
                                <div
                                  key={item.key}
                                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 hover:bg-slate-100/80 dark:hover:bg-slate-800 transition-colors"
                                >
                                  <div className="flex items-center justify-between gap-3 text-xs mb-1.5">
                                    <span className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2 min-w-0">
                                      <span className={`w-2 h-2 rounded-full shrink-0 ${item.color}`} />
                                      <span className="truncate">{item.name}</span>
                                    </span>
                                    <div className="text-right shrink-0">
                                      <span className="font-bold text-gray-900 dark:text-white text-xs">
                                        {formatNumber(item.cantidadKg, { minDecimals: 2, maxDecimals: 2 })} kg
                                      </span>
                                      <span className="text-[11px] text-gray-500 dark:text-gray-400 ml-1.5 font-medium">
                                        ({pct}%)
                                      </span>
                                    </div>
                                  </div>
                                  <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full ${item.barColor} transition-all duration-300 rounded-full`}
                                      style={{ width: `${Math.min(100, Math.max(2, Number(pct)))}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Grupo 2: Peletizado / Recuperado */}
                      {peletizadosConsumidos.length > 0 && (
                        <div>
                          <div className="flex items-center justify-between px-1 mb-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                              <Droplets className="h-3.5 w-3.5" />
                              Peletizado / Recuperado
                            </span>
                            <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400">
                              {formatNumber(subtotalPeletizados, { minDecimals: 2, maxDecimals: 2 })} kg
                              {totalBaseExtruida > 0 && ` (${((subtotalPeletizados / totalBaseExtruida) * 100).toFixed(1)}%)`}
                            </span>
                          </div>
                          <div className="space-y-2">
                            {peletizadosConsumidos.map((item) => {
                              const pct = totalBaseExtruida > 0
                                ? ((item.cantidadKg / totalBaseExtruida) * 100).toFixed(1)
                                : '0.0';
                              return (
                                <div
                                  key={item.key}
                                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 hover:bg-slate-100/80 dark:hover:bg-slate-800 transition-colors"
                                >
                                  <div className="flex items-center justify-between gap-3 text-xs mb-1.5">
                                    <span className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2 min-w-0">
                                      <span className={`w-2 h-2 rounded-full shrink-0 ${item.color}`} />
                                      <span className="truncate">{item.name}</span>
                                      <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 shrink-0">
                                        Recuperado
                                      </span>
                                    </span>
                                    <div className="text-right shrink-0">
                                      <span className="font-bold text-gray-900 dark:text-white text-xs">
                                        {formatNumber(item.cantidadKg, { minDecimals: 2, maxDecimals: 2 })} kg
                                      </span>
                                      <span className="text-[11px] text-gray-500 dark:text-gray-400 ml-1.5 font-medium">
                                        ({pct}%)
                                      </span>
                                    </div>
                                  </div>
                                  <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full ${item.barColor} transition-all duration-300 rounded-full`}
                                      style={{ width: `${Math.min(100, Math.max(2, Number(pct)))}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Grupo 3: Aditivos */}
                      {aditivosConsumidos.length > 0 && (
                        <div>
                          <div className="flex items-center justify-between px-1 mb-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-fuchsia-700 dark:text-fuchsia-400 flex items-center gap-1.5">
                              <Sparkles className="h-3.5 w-3.5" />
                              Aditivos (Dosificación Adicional)
                            </span>
                            <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400">
                              {formatNumber(subtotalAditivos, { minDecimals: 2, maxDecimals: 2 })} kg
                            </span>
                          </div>
                          <div className="space-y-2">
                            {aditivosConsumidos.map((item) => {
                              const pct = totalBaseExtruida > 0
                                ? ((item.cantidadKg / totalBaseExtruida) * 100).toFixed(1)
                                : '0.0';
                              return (
                                <div
                                  key={item.key}
                                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 hover:bg-slate-100/80 dark:hover:bg-slate-800 transition-colors"
                                >
                                  <div className="flex items-center justify-between gap-3 text-xs mb-1.5">
                                    <span className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2 min-w-0">
                                      <span className={`w-2 h-2 rounded-full shrink-0 ${item.color}`} />
                                      <span className="truncate">{item.name}</span>
                                      <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-950 dark:text-fuchsia-300 shrink-0">
                                        Aditivo
                                      </span>
                                    </span>
                                    <div className="text-right shrink-0">
                                      <span className="font-bold text-gray-900 dark:text-white text-xs">
                                        {formatNumber(item.cantidadKg, { minDecimals: 2, maxDecimals: 2 })} kg
                                      </span>
                                      <span className="text-[11px] text-fuchsia-600 dark:text-fuchsia-400 ml-1.5 font-semibold">
                                        ({pct}% dosificado)
                                      </span>
                                    </div>
                                  </div>
                                  <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full ${item.barColor} transition-all duration-300 rounded-full`}
                                      style={{ width: `${Math.min(100, Math.max(4, Number(pct) * 10))}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Resumen footer */}
                  {consumosMateriaPrima.length > 0 && (
                    <div className="mt-4 pt-3.5 border-t border-gray-100 dark:border-slate-800 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                          Base Extruida (100%):
                        </span>
                        <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                          {formatNumber(totalBaseExtruida, { minDecimals: 2, maxDecimals: 2 })} kg
                        </span>
                      </div>
                      {subtotalAditivos > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-fuchsia-500 shrink-0" />
                            Aditivos dosificados:
                          </span>
                          <span className="font-extrabold text-fuchsia-600 dark:text-fuchsia-400 text-sm">
                            {formatNumber(subtotalAditivos, { minDecimals: 2, maxDecimals: 2 })} kg
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl bg-gradient-to-br from-rose-500 to-red-600 p-6 text-white shadow-lg flex flex-col justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-white/20 p-3 shrink-0">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white/90">Total Merma</p>
                <p className="text-2xl font-bold tracking-tight text-white">
                  {formatNumber(totales.totalMerma, { minDecimals: 2, maxDecimals: 2 })} kg
                </p>
              </div>
            </div>

            {/* Subtítulo: Filtra y muestra únicamente clasificaciones con > 0 kg en el período */}
            <div className="mt-2 text-xs opacity-90 truncate max-w-full font-medium" title={mermasActivasPeriodo.map(m => `${m.label}: ${formatNumber(m.cantidadKg, { minDecimals: 2, maxDecimals: 2 })} kg`).join(' · ')}>
              {mermasActivasPeriodo.length > 0 ? (
                <span>
                  {mermasActivasPeriodo.map((m, idx) => (
                    <span key={m.key}>
                      {m.shortLabel || m.label}: <strong className="font-semibold">{formatNumber(m.cantidadKg, { minDecimals: 2, maxDecimals: 2 })} kg</strong>
                      {idx < mermasActivasPeriodo.length - 1 ? ' · ' : ''}
                    </span>
                  ))}
                </span>
              ) : (
                <span>0,00 kg</span>
              )}
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
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Producciones Finalizadas</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Período consultado:{' '}
                <strong className="text-emerald-700 font-semibold">
                  {periodoLabel || (fechaInicio ? new Date(fechaInicio).toLocaleDateString('es-VE') : 'Actual')}
                </strong>
              </p>
            </div>
            {fechaInicio && fechaFin && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 border border-gray-200">
                <Calendar className="h-3.5 w-3.5 text-gray-500" />
                {new Date(fechaInicio).toLocaleDateString('es-VE')} al {new Date(fechaFin).toLocaleDateString('es-VE')}
              </span>
            )}
          </div>

          {produccionesGrupadas.length === 0 ? (
            <div className="rounded-xl bg-white p-8 text-center text-gray-500 shadow-sm">
              <History className="mx-auto mb-4 h-12 w-12 text-gray-300" />
              <p className="text-lg font-medium">No hay producciones finalizadas en este período</p>
            </div>
          ) : (
            produccionesGrupadas.map((grupo, grupoIndex) => {
              const metricas = calcularMetricasGrupo(grupo);
              if (!metricas) return null;

              const { titulo, cantidadTotal, mermaTotal, mermaColor, mermaCristal, isUnidades, ultimaFase, resumenSobrantes } = metricas;
              const grupoId = `grupo-${grupo[0].id}`;
              const isExpanded = expandedCards.has(grupoId);

              return (
                <motion.div
                  key={grupoId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: grupoIndex * 0.03 }}
                  className="overflow-hidden rounded-xl bg-white shadow-md border border-gray-200"
                >
                  {/* Cabecera del Grupo Principal */}
                  <div className="bg-gray-50 px-5 py-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-col gap-1">
                      <h3 className="text-xl font-bold text-gray-900">{titulo}</h3>
                      <div className="flex flex-wrap items-center gap-2.5 text-sm text-gray-600">
                        <span className="inline-flex items-center gap-1 font-medium text-emerald-700 bg-emerald-100/50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle className="h-4 w-4" />
                          Completado
                        </span>
                        <span>
                          Finalizado: <strong className="text-gray-900">{formatNumber(cantidadTotal, { minDecimals: isUnidades ? 0 : 2, maxDecimals: 2 })} {isUnidades ? 'unidades' : ultimaFase.unidad}</strong>
                        </span>
                        <span className="text-gray-300">|</span>
                        <span>
                          Merma Total: <strong className="text-red-600">{formatNumber(mermaTotal, { minDecimals: 2, maxDecimals: 2 })} kg</strong>
                        </span>
                        {resumenSobrantes?.tieneSobrantes && (
                          <>
                            <span className="text-gray-300">|</span>
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 border border-amber-300 px-2.5 py-0.5 text-xs font-bold text-amber-900 shadow-xs">
                              <Sparkles className="h-3 w-3 text-amber-600" />
                              Sobrante:{' '}
                              {resumenSobrantes.totalSobranteKg > 0 ? `+${formatNumber(resumenSobrantes.totalSobranteKg, { minDecimals: 2, maxDecimals: 2 })} kg` : ''}
                              {resumenSobrantes.totalSobranteKg > 0 && resumenSobrantes.totalSobranteUnd > 0 ? ' · ' : ''}
                              {resumenSobrantes.totalSobranteUnd > 0 ? `+${formatNumber(resumenSobrantes.totalSobranteUnd, { minDecimals: 0, maxDecimals: 0 })} UND` : ''}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => toggleExpand(grupoId)}
                      className="flex items-center gap-2 rounded-xl bg-white border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 shadow-sm transition-colors"
                    >
                      {isExpanded ? (
                        <><ChevronUp className="h-4 w-4" /> Ocultar Fases</>
                      ) : (
                        <><ChevronDown className="h-4 w-4" /> Ver Fases ({grupo.length})</>
                      )}
                    </button>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-gray-100 p-4 space-y-4"
                      >
                        {grupo.map((prod, indexFase) => {
                          const cantidadTotal = prod.registros && prod.registros.length > 0
                            ? calcularTotalCantidad(prod.registros)
                            : prod.cantidadProducida;

                          const isUnidades = prod.area === 'Sellado' || prod.unidad?.toLowerCase().startsWith('un') || prod.unidad?.toLowerCase().startsWith('ud');
                          const sobrante = prod.sobranteInfo || calcularSobranteFase(prod);

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
                              transition={{ delay: indexFase * 0.03 }}
                              className="overflow-hidden rounded-xl bg-gradient-to-br from-emerald-50 via-white to-gray-50 shadow-lg border border-emerald-100"
                            >
                              {/* Encabezado */}
                              <div className={`bg-gradient-to-r ${getAreaInfo(prod.area).gradient || 'from-gray-600 to-gray-400'} p-4`}>
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                  <div className="flex items-center gap-3 flex-wrap">
                                    <h3 className="text-xl font-bold text-white">
                                      Fase {indexFase + 1}: {getAreaInfo(prod.area).label}
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
                                    {sobrante.haySobrante && (
                                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 hover:bg-amber-600 border border-amber-300 px-3 py-1 text-xs font-bold text-white shadow-sm transition-all">
                                        <Sparkles className="h-3.5 w-3.5 text-yellow-200" />
                                        {sobrante.sobranteLabel}: {sobrante.sobranteTexto}
                                        {sobrante.porcentajeExcedente > 0 && (
                                          <span className="text-yellow-100 font-normal">
                                            (+{sobrante.porcentajeExcedente}%)
                                          </span>
                                        )}
                                      </span>
                                    )}
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
                                        <><ChevronUp className="h-4 w-4" /> Ocultar Tablas</>) : (
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
                                <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-white/90">
                                  <span>Máquina: <strong>{prod.maquina.nombre}</strong></span>
                                  <span>Cliente: <strong>{prod.pedido?.cliente?.nombre || 'Sin pedido'}</strong></span>
                                  <span>
                                    Programado: <strong>{formatNumber(sobrante.cantidadProgramada, { minDecimals: isUnidades ? 0 : 2, maxDecimals: 2 })} {isUnidades ? 'UND' : prod.unidad}</strong>
                                  </span>
                                  <span>
                                    Producido: <strong>{formatNumber(cantidadTotal, { minDecimals: isUnidades ? 0 : 2, maxDecimals: 2 })} {isUnidades ? 'UND' : prod.unidad}</strong>
                                  </span>
                                  {sobrante.haySobrante && (
                                    <span className="inline-flex items-center gap-1 rounded bg-amber-400/30 px-2 py-0.5 text-xs font-bold text-amber-100 border border-amber-300/40">
                                      <Sparkles className="h-3 w-3 text-yellow-300" />
                                      {sobrante.sobranteLabel}: {sobrante.sobranteTexto}
                                    </span>
                                  )}
                                  {prod.area === 'Extrusion' && (prod.productoCliente?.peletizado || prod.pedido?.productoCliente?.peletizado) && (
                                    <span className="inline-flex items-center gap-1 rounded bg-amber-400/25 px-2 py-0.5 text-xs font-semibold text-amber-100 border border-amber-300/30">
                                      Peletizado: {prod.productoCliente?.peletizado?.nombre || prod.pedido?.productoCliente?.peletizado?.nombre} ({prod.productoCliente?.peletizadoPorcentaje || prod.pedido?.productoCliente?.peletizadoPorcentaje}%)
                                    </span>
                                  )}
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
                                                 <th className="px-3 py-2 text-left font-semibold text-gray-700">Clasificación Merma</th>
                                                <th className="px-3 py-2 text-right font-semibold text-gray-900">Total Merma</th>
                                              </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                              {prod.registros.map((reg) => {
                                                 const desgloseReg = calcularDesgloseMerma(reg);
                                                 const activasReg = CLASIFICACIONES_MERMA.filter(c => desgloseReg[c.key] > 0);
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
                                                     <td className="px-3 py-2 text-left">
                                                       {activasReg.length > 0 ? (
                                                         <div className="flex flex-wrap gap-1.5">
                                                           {activasReg.map(c => (
                                                             <span key={c.key} className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-semibold border ${c.badgeClass}`}>
                                                               {c.shortLabel}: {formatNumber(desgloseReg[c.key], { minDecimals: 2, maxDecimals: 2 })} kg
                                                             </span>
                                                           ))}
                                                         </div>
                                                       ) : (
                                                         <span className="text-gray-400 text-xs">-</span>
                                                       )}
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
                                                 <td className="px-3 py-2 text-left">
                                                   {(() => {
                                                     const desgloseFase = calcularDesgloseMerma(prod.registros);
                                                     const activasFase = CLASIFICACIONES_MERMA.filter(c => desgloseFase[c.key] > 0);
                                                     if (activasFase.length === 0) return <span className="text-gray-400 font-normal text-xs">-</span>;
                                                     return (
                                                       <div className="flex flex-wrap gap-1.5">
                                                         {activasFase.map(c => (
                                                           <span key={c.key} className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-bold border ${c.badgeClass}`}>
                                                             {c.shortLabel}: {formatNumber(desgloseFase[c.key], { minDecimals: 2, maxDecimals: 2 })} kg
                                                           </span>
                                                         ))}
                                                       </div>
                                                     );
                                                   })()}
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
                                <div className="flex flex-wrap items-center gap-3">
                                  <div className="text-lg font-bold text-gray-800">
                                    Total:{' '}
                                    <span className="text-emerald-600">
                                      {formatNumber(cantidadTotal, { minDecimals: isUnidades ? 0 : 2, maxDecimals: 2 })}
                                    </span>{' '}
                                    {prod.area === 'Sellado' ? 'unidades' : prod.unidad}
                                  </div>
                                  {sobrante.haySobrante && (
                                    <div className="flex items-center gap-1.5 bg-amber-100 border border-amber-300 text-amber-900 px-3 py-1 rounded-xl text-xs font-bold shadow-xs">
                                      <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                                      <span>{sobrante.sobranteLabel}: <strong className="text-amber-800">{sobrante.sobranteTexto}</strong></span>
                                      {sobrante.porcentajeExcedente > 0 && (
                                        <span className="text-amber-700 font-medium text-[11px]">
                                          ({sobrante.porcentajeExcedente}% sobre pedido)
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                                <div className="flex flex-wrap items-center gap-3">
                                  <div className="flex flex-wrap items-center gap-2 bg-white/90 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold">
                                    <span className="text-gray-700">
                                      Total Merma: <strong className="text-gray-900 font-bold">{formatNumber(prod.merma, { minDecimals: 2, maxDecimals: 2 })} kg</strong>
                                    </span>
                                    {(() => {
                                      const desglose = calcularDesgloseMerma(prod.registros && prod.registros.length > 0 ? prod.registros : prod);
                                      const activas = CLASIFICACIONES_MERMA.filter(c => desglose[c.key] > 0);
                                      if (activas.length === 0) return null;
                                      return (
                                        <>
                                          <span className="text-gray-300">|</span>
                                          {activas.map((c, i) => (
                                            <span key={c.key} className="text-gray-600">
                                              {c.shortLabel}: <strong className="text-gray-900">{formatNumber(desglose[c.key], { minDecimals: 2, maxDecimals: 2 })} kg</strong>
                                              {i < activas.length - 1 ? ' · ' : ''}
                                            </span>
                                          ))}
                                        </>
                                      );
                                    })()}
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
                        })}

                        {/* Resumen de Sobrantes / Excedentes de la Orden */}
                        {resumenSobrantes?.tieneSobrantes && (
                          <div className="rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 via-yellow-50/80 to-amber-50 p-4 shadow-sm">
                            <div className="flex flex-wrap items-center justify-between gap-3 mb-2.5">
                              <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-amber-200 rounded-xl text-amber-800 shrink-0">
                                  <Boxes className="h-5 w-5" />
                                </div>
                                <div>
                                  <h4 className="text-sm font-bold text-amber-950">
                                    Resumen de Material Sobrante / Excedente en Planta
                                  </h4>
                                  <p className="text-xs text-amber-800 mt-0.5">
                                    Material terminado que superó la cantidad programada y quedó disponible en planta:
                                  </p>
                                </div>
                              </div>
                              <span className="rounded-full bg-amber-200/90 border border-amber-300 px-3 py-1 text-xs font-extrabold text-amber-900 shadow-xs">
                                Disponible en Planta
                              </span>
                            </div>
                            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                              {resumenSobrantes.fasesConSobrante.map((item, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between p-3 rounded-xl bg-white border border-amber-200/90 shadow-xs"
                                >
                                  <div>
                                    <p className="text-xs font-bold text-gray-800">
                                      {item.fase.area}
                                    </p>
                                    <p className="text-[11px] text-gray-500 font-medium">
                                      {item.info.sobranteLabel}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm font-extrabold text-amber-600">
                                      {item.info.sobranteTexto}
                                    </p>
                                    {item.info.porcentajeExcedente > 0 && (
                                      <p className="text-[10px] text-amber-700 font-semibold">
                                        +{item.info.porcentajeExcedente}% sobre orden
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
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

export default function HistorialProduccionPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-96 items-center justify-center">
          <LoadingSpinner />
        </div>
      }
    >
      <HistorialProduccionContent />
    </Suspense>
  );
}
