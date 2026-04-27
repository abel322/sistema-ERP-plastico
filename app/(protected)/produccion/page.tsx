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
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

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

const UNIDADES = [
  { value: 'Unidades', label: 'Unidades' },
  { value: 'Kilogramos', label: 'Kilogramos' },
  { value: 'Metros', label: 'Metros' },
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

  // Modal states
  const [showCrearModal, setShowCrearModal] = useState(false);
  const [showRegistroModal, setShowRegistroModal] = useState(false);
  const [selectedProduccion, setSelectedProduccion] = useState<Produccion | null>(null);
  const [saving, setSaving] = useState(false);

  const [isEditRegistro, setIsEditRegistro] = useState(false);
  const [editRegistroId, setEditRegistroId] = useState<string | null>(null);
  const [showRegistrosListModal, setShowRegistrosListModal] = useState(false);

  // Form data for creating production
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

  // Form data for adding registro
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
  }, []);

  useEffect(() => {
    if (formData.area) {
      setFormData(prev => ({
        ...prev,
        maquinaId: '',
        ...(isAvance ? {} : { pedidoId: '' })
      }));
    }
  }, [formData.area, isAvance]);

  useEffect(() => {
    fetchTodosLosPedidos();
  }, []);

  const fetchProducciones = async () => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        estado: 'EnProceso', // Solo mostrar producciones en proceso
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

    // Validar pedido obligatorio
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
      alert('Error al registrar producción');
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

        // If we were editing from the list, we might want to close the list or refresh it
        // Simpler: just keep it open but it will become stale, so let's close it too
        setShowRegistrosListModal(false);
      } else {
        const data = await res.json();
        alert(data.error || 'Error al guardar registro');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al guardar registro');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRegistro = async (prodId: string, regId: string) => {
    if (!confirm('¿Eliminar este registro individual?')) return;
    try {
      const res = await fetch(`/api/produccion/${prodId}/registros/${regId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchProducciones();
        setShowRegistrosListModal(false);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleFinalizar = async (id: string) => {
    if (!confirm('¿Finalizar el pedido completamente? El pedido desaparecerá de producción activa y pasará al historial.')) return;

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

  const openEditarProduccionModal = (prod: Produccion) => {
    setIsEditProduccion(true);
    setEditProduccionId(prod.id);
    setFormData({
      fecha: prod.fecha ? prod.fecha.split('T')[0] : today,
      turno: prod.turno,
      area: prod.area,
      maquinaId: prod.maquinaId || prod.maquina?.id || '',
      operario: prod.operario || '',
      pedidoId: prod.pedidoId || prod.pedido?.id || '',
      cantidadProducida: prod.cantidadProducida?.toString() || '0',
      unidad: prod.unidad || 'Kilogramos',
      merma: prod.merma?.toString() || '0',
      horaInicio: prod.horaInicio || '',
      horaFin: prod.horaFin || '',
      observaciones: prod.observaciones || '',
    });
    setShowCrearModal(true);
  };

  const openRegistrosListModal = (prod: Produccion) => {
    setSelectedProduccion(prod);
    setShowRegistrosListModal(true);
  };

  const openEditRegistroModal = (prod: Produccion, reg: RegistroProduccion) => {
    setSelectedProduccion(prod);
    setIsEditRegistro(true);
    setEditRegistroId(reg.id);
    setRegistroForm({
      turno: reg.turno,
      fecha: reg.fecha ? reg.fecha.split('T')[0] : today,
      operario: reg.operario || '',
      cantidad: reg.cantidad.toString(),
      reporte: reg.reporte || '',
      merma: reg.merma.toString(),
      mermaSinImpresion: reg.mermaSinImpresion ? reg.mermaSinImpresion.toString() : '0',
      mermaImpreso: reg.mermaImpreso ? reg.mermaImpreso.toString() : '0',
    });
    // Close list modal if it was open, just to keep UI clean
    setShowRegistrosListModal(false);
    setShowRegistroModal(true);
  };

  const openRegistroModal = (prod: Produccion) => {
    setSelectedProduccion(prod);
    setIsEditRegistro(false);
    setEditRegistroId(null);
    resetRegistroForm();
    setShowRegistroModal(true);
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

  const getAreaLabel = (area: string) =>
    AREAS.find((a) => a.value === area)?.label || area;

  const getTurnoLabel = (turno: string) =>
    TURNOS.find((t) => t.value === turno)?.label || turno;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-VE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
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

  const maquinasFiltradas = maquinas.filter((m) => m.area === formData.area);

  // Determinar si el área requiere merma subdividida (Serigrafía o Refilado)
  const requiereMermaSubdividida = (area: string) => {
    return area === 'Serigrafia' || area === 'Refilado';
  };

  const calcularTotalMerma = (registros: RegistroProduccion[]) => {
    return registros.reduce((sum, r) => sum + r.merma + (r.mermaSinImpresion || 0) + (r.mermaImpreso || 0), 0);
  };

  const calcularTotalCantidad = (registros: RegistroProduccion[]) => {
    return registros.reduce((sum, r) => sum + r.cantidad, 0);
  };

  // Helper: calcula los valores de display para una tarjeta Kanban
  const getDisplayValues = (prod: Produccion, totalProducido: number) => {
    const tipoProducto = prod.pedido?.cliente?.tipoProducto;
    const unidadPedido = prod.pedido?.unidad;
    const peso = prod.pedido?.cliente?.pesoPorUnidad || 0;
    const cliente = prod.pedido?.cliente;

    let targetAmount = prod.pedido?.cantidadSolicitada || 0;
    let displayTotal = totalProducido;
    let displayUnit = unidadPedido || prod.unidad || '';

    if (prod.area === 'Extrusion' || prod.area === 'Serigrafia' || prod.area === 'Refilado') {

      if (tipoProducto === 'Bolsa') {

        // Verificar si el cliente tiene valvulada (pego) o con fuelle activo
        const tieneValvulada = cliente?.anchoValvula && cliente?.anchoValvula > 0;
        const tieneConFuelle = cliente?.anchoFuelle && cliente?.anchoFuelle > 0 && !tieneValvulada;
        
        if (tieneValvulada && unidadPedido === 'Unidades') {
          // Fórmula para bolsas valvuladas (pego)
          const ancho = cliente?.ancho || 0;
          const largo = cliente?.largo || 0;
          const fuelle = cliente?.anchoFuelle || 0;
          const solapa = cliente?.anchoSolapa || 0;
          const calibre = cliente?.calibre || 0;
          const materialStr = cliente?.material?.toLowerCase() || '';
          const densidad = materialStr.includes('alta') || materialStr.includes('hdpe') || materialStr.includes('ad') ? 0.96 : 0.922;
          
          // Fórmula: (((ancho * 2)+(fuelle * 2) + solapa) * largo * densidad * calibre)/1000000
          const pesoUnitario = (((ancho * 2) + (fuelle * 2) + solapa) * largo * densidad * calibre) / 1000000;
          targetAmount = (pesoUnitario * targetAmount);
        } else if (tieneConFuelle && unidadPedido === 'Unidades') {
          // Fórmula para bolsas con fuelle
          const ancho = cliente?.ancho || 0;
          const largo = cliente?.largo || 0;
          const fuelle = cliente?.anchoFuelle || 0;
          const calibre = cliente?.calibre || 0;
          const materialStr = cliente?.material?.toLowerCase() || '';
          const densidad = materialStr.includes('alta') || materialStr.includes('hdpe') || materialStr.includes('ad') ? 0.96 : 0.922;
          
          // Fórmula: ((ancho + (fuelle * 2)) * largo * calibre * densidad) / 1000000
          const pesoUnitario = ((ancho + (fuelle * 2)) * largo * calibre * densidad) / 1000000;
          targetAmount = (pesoUnitario * targetAmount);
        } else if (unidadPedido === 'Unidades' && peso > 0) {
          // Fórmula original para bolsas sin valvulada ni fuelle
          const materialStr = cliente?.material?.toLowerCase() || '';
          const densidad = materialStr.includes('alta') || materialStr.includes('hdpe') || materialStr.includes('ad') ? 0.96 : 0.922;
          targetAmount = (peso * targetAmount * densidad) / 1000;
        }
        displayUnit = 'kg';
      } else if (tipoProducto === 'Bobina') {
        // Bobinas ya están en kg

        displayUnit = 'kg';
      }
    } else if (prod.area === 'Sellado') {
      if (tipoProducto === 'Bolsa') {
        // Sellado de bolsas → mantener unidades

        displayUnit = 'und';
      }
    }
    // targetAmount = peso ;
    const isCompleted = targetAmount > 0 && displayTotal >= targetAmount;

    return { targetAmount, displayTotal, displayUnit, isCompleted };
  };

  const getNextArea = (prod: Produccion): string | null => {
    if (!prod.pedido || !prod.pedido.cliente) return null;
    const { tipoProducto, conImpresion } = prod.pedido.cliente as any;

    const isBobinaSerigrafia = tipoProducto === 'Bobina' && conImpresion;

    if (prod.area === 'Extrusion') {
      if (conImpresion) return 'Serigrafia';
      if (tipoProducto === 'Bolsa') return 'Sellado';
      // Si es bobina sin nada más, termina aquí
      return null;
    }

    if (prod.area === 'Serigrafia') {
      // Regla nueva: Bobina con serigrafía SIEMPRE va a refilado después de serigrafía
      if (isBobinaSerigrafia) return 'Refilado';

      if (tipoProducto === 'Bolsa') return 'Sellado';
      return null;
    }

    if (prod.area === 'Refilado') {
      if (tipoProducto === 'Bolsa') return 'Sellado';
      // Si es bobina (ej: Bobina con serigrafía), al terminar Refilado ya finaliza (va a producto terminado)
      return null;
    }

    return null;
  };

  const handleAvanzarFase = async (prod: Produccion) => {
    const nextArea = getNextArea(prod);
    if (!nextArea) return;

    if (!confirm(`¿Finalizar en ${getAreaLabel(prod.area)} y avanzar a ${getAreaLabel(nextArea)}?`)) return;

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

  return (
    <>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Producción</h1>
            <p className="mt-1 text-sm text-gray-600 sm:text-base">Producción en proceso - Las finalizadas pasan al historial</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
            <Link
              href="/produccion/historial"
              className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              <Clock className="h-5 w-5" />
              Historial
            </Link>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowCrearModal(true)}
              className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 text-white shadow-lg hover:from-purple-700 hover:to-indigo-700"
            >
              <Plus className="h-5 w-5" />
              Registrar Producción
            </motion.button>
          </div>
        </div>

        {/* Filtros */}
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2 sm:mb-4">
            <Filter className="h-5 w-5 text-gray-500" />
            <span className="font-medium text-gray-700">Filtros</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
            <select
              value={filters.area}
              onChange={(e) => setFilters({ ...filters, area: e.target.value })}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none sm:text-base"
            >
              <option value="">Todas las áreas</option>
              {AREAS.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 flex-shrink-0 text-gray-400" />
              <input
                type="date"
                value={filters.fechaInicio}
                onChange={(e) => setFilters({ ...filters, fechaInicio: e.target.value })}
                className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">a</span>
              <input
                type="date"
                value={filters.fechaFin}
                onChange={(e) => setFilters({ ...filters, fechaFin: e.target.value })}
                className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Tablero Kanban de Producción en Proceso */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4 md:gap-4 overflow-x-auto pb-4">
          {AREAS.map((areaCol) => {
            const prodEnArea = producciones.filter(p => p.area === areaCol.value);
            return (
              <div key={areaCol.value} className="flex min-w-[280px] flex-col gap-3 rounded-xl bg-gray-50 p-3 shadow-inner">
                <div className="flex items-center justify-between rounded-lg bg-white px-3 py-2 shadow-sm border border-gray-200">
                  <h2 className="font-bold text-gray-700">{areaCol.label}</h2>
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-700">
                    {prodEnArea.length}
                  </span>
                </div>

                <div className="flex flex-col gap-3">
                  {prodEnArea.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-6 text-gray-400">
                      <Factory className="mb-2 h-8 w-8 opacity-20" />
                      <p className="text-xs font-medium">Vacío</p>
                    </div>
                  ) : (
                    prodEnArea.map((prod, index) => {
                      const nextArea = getNextArea(prod);
                      const totalProducido = calcularTotalCantidad(prod.registros);
                      // Sin stock previo = área no es extrusion y el stock disponible es 0 o no hay registro
                      const sinStock = prod.area !== 'Extrusion' && (!prod.stockPrevio || prod.stockPrevio.cantidad <= 0);
                      return (
                        <motion.div
                          key={prod.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-white p-3 shadow-sm hover:shadow-md"
                        >
                          {(() => {
                            const dv = getDisplayValues(prod, totalProducido);
                            return (
                              <>
                                {/* Header con badge de estado */}
                                <div className="flex items-start justify-between">
                                  <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-800">
                                    Pedido {prod.pedido?.id?.slice(-5).toUpperCase() || 'N/A'}
                                  </span>
                                  <span className={`rounded px-2 py-0.5 text-xs font-bold ${dv.isCompleted ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                                    {dv.isCompleted ? 'Completado' : 'En progreso'}
                                  </span>
                                </div>

                                {/* Info del cliente */}
                                <div className="flex items-center justify-between mt-1">
                                  <div>
                                    <p className="font-semibold text-gray-900 line-clamp-1" title={prod.pedido?.cliente?.nombre}>
                                      {prod.pedido?.cliente?.nombre || 'Sin Cliente'}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      Máq: <span className="font-medium text-gray-700">{prod.maquina.nombre}</span>
                                    </p>
                                    {prod.pedido?.cantidadSolicitada && (
                                      <p className="text-xs text-gray-500">
                                        Cantidad: <span className="font-medium text-gray-700">{prod.pedido.cantidadSolicitada.toLocaleString()} {prod.pedido.unidad}</span>
                                      </p>
                                    )}
                                  </div>
                                  <span className="text-xs font-medium text-gray-500">{formatDateShort(prod.fecha)}</span>
                                </div>

                                {/* Datos de producción */}
                                <div className="rounded-md bg-gray-50 p-2 text-xs">
                                  <div className="flex justify-between mb-1">
                                    <span className="text-gray-500">Total Producción:</span>
                                    <span className="font-bold text-gray-900">
                                      {`${dv.displayTotal.toFixed(2)} ${dv.displayUnit}`}
                                    </span>
                                  </div>
                                  <div className="flex justify-between mb-1">
                                    <span className="text-gray-500">Merma Total:</span>
                                    <span className="font-medium text-red-600">{calcularTotalMerma(prod.registros).toFixed(2)} kg</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Solicitado:</span>
                                    <span className="font-medium text-gray-700">
                                      {`${dv.targetAmount.toFixed(2)} ${dv.displayUnit}`}
                                    </span>
                                  </div>

                                  {prod.area !== 'Extrusion' && (
                                    <div className="flex flex-col mt-1 pt-1 border-t border-gray-200">
                                      <div className="flex justify-between">
                                        <span className="text-gray-500 text-[11px]">
                                          {prod.area === 'Sellado' ? 'Stock de material previo:' :
                                            prod.area === 'Serigrafia' ? 'Stock de Bobina S/I:' :
                                              prod.area === 'Refilado' ? 'Stock de Bobina C/I:' :
                                                'Stock de materia prima:'}
                                        </span>
                                        <span className={`font-bold text-[11px] ${(!prod.stockPrevio || prod.stockPrevio.cantidad <= 0) ? 'text-red-600' : 'text-emerald-700'}`}>
                                          {!prod.stockPrevio || prod.stockPrevio.cantidad <= 0
                                            ? '\u26a0\ufe0f Sin stock'
                                            : `${prod.stockPrevio.cantidad.toFixed(2)} ${prod.stockPrevio.unidad === 'Kilogramos' ? 'kg' : prod.stockPrevio.unidad === 'Unidades' ? 'und' : prod.stockPrevio.unidad}`
                                          }
                                        </span>
                                      </div>
                                      {/* Equivalencia en Und para Sellado */}
                                      {prod.area === 'Sellado' && prod.stockPrevio?.unidad === 'Kilogramos' && prod.pedido?.cliente?.pesoPorUnidad && prod.pedido.cliente.pesoPorUnidad > 0 && (
                                        <div className="flex justify-between mt-0.5">
                                          <span className="text-gray-400 text-[10px]">
                                            Equivalencia aproximada:
                                          </span>
                                          <span className="font-medium text-blue-600 text-[10px]">
                                            {Math.floor(((prod.stockPrevio?.cantidad || 0) * 1000) / prod.pedido.cliente.pesoPorUnidad).toLocaleString()} Und
                                          </span>
                                        </div>
                                      )}

                                      {/* Equivalencia en mts para Serigrafia y Refilado */}
                                      {['Serigrafia', 'Refilado'].includes(prod.area) && prod.stockPrevio?.unidad === 'Kilogramos' && prod.pedido?.cliente?.ancho && prod.pedido.cliente.calibre && (
                                        <div className="flex justify-between mt-0.5">
                                          <span className="text-gray-400 text-[10px]">
                                            Equivalencia aproximada:
                                          </span>
                                          <span className="font-medium text-blue-600 text-[10px]">
                                            {(() => {
                                              const ancho = prod.pedido.cliente.ancho || 1;
                                              const calibre = prod.pedido.cliente.calibre || 1;
                                              const esManga = prod.pedido.cliente.tipoBobinaCliente === 'Manga';
                                              const materialStr = (prod.pedido.cliente as any).material?.toLowerCase() || '';
                                              const densidad = materialStr.includes('alta') || materialStr.includes('hdpe') || materialStr.includes('ad') ? 0.96 : 0.922;

                                              const divisor = ancho * calibre * densidad * (esManga ? 2 : 1);
                                              const metros = divisor > 0 ? ((prod.stockPrevio?.cantidad || 0) * 100000) / divisor : 0;
                                              return `${Math.floor(metros).toLocaleString()} mts`;
                                            })()}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  {prod.pedido && (
                                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                                      <div
                                        className={`h-full transition-all duration-500 ${dv.isCompleted ? 'bg-green-500' : 'bg-amber-500'}`}
                                        style={{ width: `${Math.min(100, (dv.displayTotal / (dv.targetAmount || 1)) * 100)}%` }}
                                      />
                                    </div>
                                  )}
                                </div>
                              </>
                            );
                          })()}

                          <div className="mt-1 flex flex-col gap-2">
                            <button
                              onClick={() => openRegistroModal(prod)}
                              disabled={sinStock}
                              title={sinStock ? 'No hay stock disponible para producir' : 'Añadir un registro de producción'}
                              className={`flex w-full items-center justify-center gap-1 rounded px-2 py-1.5 text-xs font-semibold transition-all
                                ${sinStock
                                  ? 'bg-gray-100 text-gray-400 opacity-50 cursor-not-allowed'
                                  : 'bg-purple-50 text-purple-700 hover:bg-purple-100 cursor-pointer'
                                }`}
                            >
                              <Plus className="h-3 w-3" /> Añadir Registro
                            </button>

                            <div className="flex justify-between gap-1">
                              {nextArea ? (
                                <button
                                  onClick={() => handleAvanzarFase(prod)}
                                  className="flex flex-1 items-center justify-center gap-1 rounded bg-indigo-600 px-2 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 hover:shadow-md active:scale-95"
                                  title={`Terminar y avanzar a ${getAreaLabel(nextArea)}`}
                                >
                                  Avanzar a {getAreaLabel(nextArea)}
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleFinalizar(prod.id)}
                                  className="flex flex-1 items-center justify-center gap-1 rounded bg-green-600 px-2 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-green-700 hover:shadow-md active:scale-95"
                                  title="Finalizar por completo"
                                >
                                  <CheckCircle className="h-3 w-3" /> Finalizar Pedido
                                </button>
                              )}
                              {isAdmin && (
                                <button
                                  onClick={() => handleDelete(prod.id)}
                                  className="flex items-center justify-center rounded bg-red-50 p-1.5 text-red-600 outline-none transition-all hover:bg-red-100 hover:text-red-700 active:scale-95"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                              <button
                                onClick={() => openRegistrosListModal(prod)}
                                className="flex items-center justify-center rounded bg-blue-50 p-1.5 text-blue-600 outline-none transition-all hover:bg-blue-100 hover:text-blue-700 active:scale-95"
                                title="Editar Registros (Operario, Fecha, Cantidad)"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                            </div>
                          </div>

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
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
            <p className="text-sm text-gray-600">
              Página {page} de {totalPages}
            </p>
            <div className="flex w-full gap-2 sm:w-auto">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:opacity-50 sm:flex-initial"
              >
                Anterior
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:opacity-50 sm:flex-initial"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Crear Producción */}
      <AnimatePresence>
        {showCrearModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowCrearModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
            >
              {/* Header del Modal */}
              <div className="relative bg-gradient-to-r from-purple-600 to-indigo-600 p-6">
                <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
                <div className="absolute -bottom-4 -left-4 h-24 w-24 rounded-full bg-white/10" />
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-white/20 p-2">
                      <Factory className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">{isEditProduccion ? 'Actualizar Producción' : 'Registrar Producción'}</h2>
                      <p className="text-sm text-white/80">{isEditProduccion ? 'Actualice los datos de la producción' : 'Complete los datos del registro'}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setShowCrearModal(false); resetFormData(); }}
                    className="rounded-full bg-white/20 p-2 text-white hover:bg-white/30"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Formulario */}
              <form onSubmit={handleCrearProduccion} className="space-y-6 p-6">
                {/* Información Básica */}
                <div>
                  <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                    <Factory className="h-5 w-5 text-purple-600" />
                    Información Básica
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Fecha</label>
                      <input
                        type="date"
                        required
                        value={formData.fecha}
                        onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Área de Producción</label>
                      <select
                        required
                        value={formData.area}
                        onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                      >
                        {AREAS.map((a) => (
                          <option key={a.value} value={a.value}>{a.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-sm font-medium text-gray-700">Máquina</label>
                      <select
                        required
                        value={formData.maquinaId}
                        onChange={(e) => setFormData({ ...formData, maquinaId: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                      >
                        <option value="">Seleccione una máquina</option>
                        {maquinasFiltradas.map((m) => (
                          <option key={m.id} value={m.id}>{m.nombre}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Vincular Pedido - Obligatorio */}
                <div className="border-t pt-6">
                  <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                    <Package className="h-5 w-5 text-purple-600" />
                    Vincular Pedido
                    <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600">Obligatorio</span>
                  </h3>

                  {showPedidoWarning && !formData.pedidoId && (
                    <div className="mb-4 flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3">
                      <AlertTriangle className="h-5 w-5 text-amber-500" />
                      <p className="text-sm text-amber-700">
                        <strong>¡Atención!</strong> Debe seleccionar un pedido para registrar la producción.
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Seleccionar Pedido
                    </label>
                    <select
                      required
                      value={formData.pedidoId}
                      onChange={(e) => {
                        setFormData({ ...formData, pedidoId: e.target.value });
                        setShowPedidoWarning(false);
                        const pedido = pedidosFiltrados.find(p => p.id === e.target.value);
                        if (pedido) {
                          // Extrusión siempre trabaja en Kilogramos
                          const unidadProduccion = formData.area === 'Extrusion' ? 'Kilogramos' : pedido.unidad;
                          setFormData(prev => ({ ...prev, pedidoId: e.target.value, unidad: unidadProduccion }));
                        }
                      }}
                      className={`w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-1 ${showPedidoWarning && !formData.pedidoId
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:border-purple-500 focus:ring-purple-500'
                        }`}
                    >
                      <option value="">Seleccione un pedido</option>
                      {isAvance && formData.pedidoId && !pedidosFiltrados.find(p => p.id === formData.pedidoId) && (
                        <option value={formData.pedidoId}>Pedido Actual (Avanzando Fase)</option>
                      )}
                      {pedidosFiltrados.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.cliente.nombre} - {p.cantidadSolicitada - p.cantidadProducida} {p.unidad} pendientes
                        </option>
                      ))}
                    </select>
                    {pedidosFiltrados.length === 0 && (
                      <p className="mt-2 text-sm text-gray-500">
                        No hay pedidos disponibles.
                      </p>
                    )}
                  </div>
                </div>

                {/* Botones */}
                <div className="flex justify-end gap-3 border-t pt-6">
                  <button
                    type="button"
                    onClick={() => { setShowCrearModal(false); resetFormData(); }}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 text-white hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        {isEditProduccion ? 'Actualizar Producción' : 'Registrar Producción'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Agregar Registro */}
      <AnimatePresence>
        {showRegistroModal && selectedProduccion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowRegistroModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl"
            >
              {/* Header del Modal */}
              <div className="relative bg-gradient-to-r from-violet-600 to-purple-600 p-6">
                <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-white/20 p-2">
                      <ClipboardList className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">
                        {isEditRegistro ? 'Editar Registro' : 'Añadir Registro'}
                      </h2>
                      <p className="text-sm text-white/80">Área: {getAreaLabel(selectedProduccion.area)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowRegistroModal(false)}
                    className="rounded-full bg-white/20 p-2 text-white hover:bg-white/30"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Formulario de Registro */}
              <form onSubmit={handleAgregarRegistro} className="space-y-4 p-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Turno</label>
                    <select
                      required
                      value={registroForm.turno}
                      onChange={(e) => setRegistroForm({ ...registroForm, turno: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    >
                      {TURNOS.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Día</label>
                    <input
                      type="date"
                      required
                      value={registroForm.fecha}
                      onChange={(e) => setRegistroForm({ ...registroForm, fecha: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Operario</label>
                  <input
                    type="text"
                    required
                    value={registroForm.operario}
                    onChange={(e) => setRegistroForm({ ...registroForm, operario: e.target.value })}
                    placeholder="Nombre del operario"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Cantidad</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={registroForm.cantidad}
                    onChange={(e) => setRegistroForm({ ...registroForm, cantidad: e.target.value })}
                    placeholder="0.00"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Reporte</label>
                  <textarea
                    value={registroForm.reporte}
                    onChange={(e) => setRegistroForm({ ...registroForm, reporte: e.target.value })}
                    placeholder="Observaciones del turno..."
                    rows={2}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                {/* Merma según área */}
                {requiereMermaSubdividida(selectedProduccion?.area || '') ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Merma Sin Impresión (kg)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={registroForm.mermaSinImpresion}
                        onChange={(e) => setRegistroForm({ ...registroForm, mermaSinImpresion: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Merma Impreso (kg)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={registroForm.mermaImpreso}
                        onChange={(e) => setRegistroForm({ ...registroForm, mermaImpreso: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Merma/Desperdicio (kg)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={registroForm.merma}
                      onChange={(e) => setRegistroForm({ ...registroForm, merma: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                )}

                {/* Botones */}
                <div className="flex justify-end gap-3 border-t pt-4">
                  <button
                    type="button"
                    onClick={() => { setShowRegistroModal(false); resetRegistroForm(); }}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-2 text-white hover:from-violet-700 hover:to-purple-700 disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        {isEditRegistro ? 'Actualizar Registro' : 'Guardar Registro'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Lista de Registros */}
      <AnimatePresence>
        {showRegistrosListModal && selectedProduccion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowRegistrosListModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 p-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Registros de Producción</h2>
                  <p className="text-sm text-gray-500">Gestione los registros para esta producción</p>
                </div>
                <button
                  onClick={() => setShowRegistrosListModal(false)}
                  className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6">
                {selectedProduccion.registros.length === 0 ? (
                  <p className="text-center text-sm text-gray-500">No hay registros asociados a esta producción.</p>
                ) : (
                  <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                        <tr>
                          <th className="px-4 py-3 font-semibold">Fecha</th>
                          <th className="px-4 py-3 font-semibold">Turno</th>
                          <th className="px-4 py-3 font-semibold">Operario</th>
                          <th className="px-4 py-3 font-semibold text-right">Cant.</th>
                          <th className="px-4 py-3 font-semibold text-right">Merma</th>
                          <th className="px-4 py-3 font-semibold text-center">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {selectedProduccion.registros.map((reg) => (
                          <tr key={reg.id} className="transition-colors hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium text-gray-900">{formatDateShort(reg.fecha)}</td>
                            <td className="px-4 py-3 text-gray-600">{getTurnoLabel(reg.turno)}</td>
                            <td className="px-4 py-3 text-gray-600">{reg.operario}</td>
                            <td className="px-4 py-3 text-right font-medium text-gray-900">{reg.cantidad}</td>
                            <td className="px-4 py-3 text-right text-gray-600">{reg.merma}</td>
                            <td className="px-4 py-3">
                              <div className="flex justify-center gap-2">
                                <button
                                  onClick={() => openEditRegistroModal(selectedProduccion, reg)}
                                  className="rounded p-1 text-blue-600 hover:bg-blue-50"
                                  title="Editar Registro"
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>
                                {isAdmin && (
                                  <button
                                    onClick={() => handleDeleteRegistro(selectedProduccion.id, reg.id)}
                                    className="rounded p-1 text-red-600 hover:bg-red-50"
                                    title="Eliminar Registro"
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
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
