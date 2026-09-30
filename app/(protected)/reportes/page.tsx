'use client';

import { useState, useEffect } from 'react';
import { FormSelect } from '@/components/forms/form-select';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { 
  FileText, Download, FileSpreadsheet, Calendar, Filter, BarChart3, PieChart, TrendingUp, ChevronRight, ChevronLeft,
  Layers, Cpu, Flame, Settings, Sparkles, Sun, Moon, CheckCircle2, XCircle, FlaskConical, Wrench, Search,
  Package, AlertTriangle, ArrowLeftRight, ArrowDownLeft, ArrowUpRight, DollarSign, Boxes, ShieldAlert, Archive
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, subDays, startOfMonth } from 'date-fns';

const tiposReporte = [
  { value: 'produccion', label: 'Producción', description: 'Reporte detallado de producción por área', icon: BarChart3, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950/30' },
  { value: 'ventas', label: 'Ventas', description: 'Reporte de facturación y ventas', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
  { value: 'inventario', label: 'Inventario', description: 'Estado actual del inventario', icon: PieChart, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-950/30' },
  { value: 'ficha-tecnica', label: 'Ficha Técnica', description: 'Ficha técnica detallada por producto', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30' },
];

const periodosRapidos = [
  { value: 'hoy', label: 'Hoy' },
  { value: 'semana', label: 'Semana' },
  { value: 'mes', label: 'Mes' },
  { value: 'custom', label: 'Personalizado' },
];

export default function ReportesPage() {
  const [tipoReporte, setTipoReporte] = useState('produccion');
  const [periodo, setPeriodo] = useState('mes');
  const [fechaInicio, setFechaInicio] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [fechaFin, setFechaFin] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  
  // Estados para Ficha Técnica
  const [clientes, setClientes] = useState<any[]>([]);
  const [productos, setProductos] = useState<any[]>([]);
  const [clienteId, setClienteId] = useState('');
  const [productoId, setProductoId] = useState('');
  const [fichaTab, setFichaTab] = useState<'general' | 'formulacion' | 'extrusion' | 'sellado' | 'mecanica'>('general');

  // Estados para Turnos en Reporte de Producción
  const [turnosPage, setTurnosPage] = useState(1);
  const [turnosSearch, setTurnosSearch] = useState('');
  const turnosPorPagina = 8;

  // Estados para Kardex de Inventario
  const [kardexPage, setKardexPage] = useState(1);
  const [kardexSearch, setKardexSearch] = useState('');
  const [kardexTipo, setKardexTipo] = useState<'TODOS' | 'Entrada' | 'Salida'>('TODOS');
  const kardexPorPagina = 8;

  // Estados para Catálogo Completo de Inventario
  const [invTab, setInvTab] = useState<'TODAS' | 'MateriaPrima' | 'Peletizado' | 'Aditivo' | 'ProductoTerminado'>('TODAS');
  const [invSearch, setInvSearch] = useState('');
  const [invPage, setInvPage] = useState(1);
  const invPorPagina = 8;

  // Cargar clientes al montar o al cambiar a ficha técnica
  useEffect(() => {
    if (tipoReporte === 'ficha-tecnica' && clientes.length === 0) {
      fetch('/api/clientes?limit=100')
        .then(res => res.json())
        .then(data => setClientes(Array.isArray(data.clientes) ? data.clientes : []))
        .catch(err => { console.error(err); setClientes([]); });
    }
  }, [tipoReporte, clientes.length]);

  // Cargar productos cuando se selecciona un cliente
  useEffect(() => {
    if (clienteId) {
      fetch(`/api/clientes/${clienteId}/productos`)
        .then(res => res.json())
        .then(data => setProductos(Array.isArray(data) ? data : []))
        .catch(err => { console.error(err); setProductos([]); });
    } else {
      setProductos([]);
      setProductoId('');
    }
  }, [clienteId]);

  const fetchPreview = async (fInicio?: string, fFin?: string, tReporte?: string) => {
    setLoading(true);
    try {
      const inicio = typeof fInicio === 'string' ? fInicio : fechaInicio;
      const fin = typeof fFin === 'string' ? fFin : fechaFin;
      const tipo = typeof tReporte === 'string' ? tReporte : tipoReporte;

      const params = new URLSearchParams({
        fechaInicio: inicio,
        fechaFin: fin,
      });
      
      if (tipo === 'ficha-tecnica') {
        if (!productoId) {
          alert('Por favor selecciona un producto');
          setLoading(false);
          return;
        }
        params.set('productoId', productoId);
      }
      
      const res = await fetch(`/api/reportes/${tipo}?${params.toString()}`);
      const data = await res.json();
      setPreviewData(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cargar automáticamente preview al cambiar de tipo de reporte (excepto ficha técnica que requiere selección)
  useEffect(() => {
    if (tipoReporte !== 'ficha-tecnica') {
      fetchPreview(fechaInicio, fechaFin, tipoReporte);
    }
  }, [tipoReporte]);

  const handlePeriodoChange = (value: string) => {
    setPeriodo(value);
    const today = new Date();
    let newInicio = fechaInicio;
    let newFin = fechaFin;
    switch (value) {
      case 'hoy':
        newInicio = format(today, 'yyyy-MM-dd');
        newFin = format(today, 'yyyy-MM-dd');
        break;
      case 'semana':
        newInicio = format(subDays(today, 7), 'yyyy-MM-dd');
        newFin = format(today, 'yyyy-MM-dd');
        break;
      case 'mes':
        newInicio = format(startOfMonth(today), 'yyyy-MM-dd');
        newFin = format(today, 'yyyy-MM-dd');
        break;
    }
    setFechaInicio(newInicio);
    setFechaFin(newFin);
    if (value !== 'custom' && tipoReporte !== 'ficha-tecnica') {
      fetchPreview(newInicio, newFin, tipoReporte);
    }
  };


  const downloadCSV = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        fechaInicio,
        fechaFin,
        formato: 'csv',
      });
      
      if (tipoReporte === 'ficha-tecnica') {
        if (!productoId) {
          alert('Por favor selecciona un producto');
          setLoading(false);
          return;
        }
        params.set('productoId', productoId);
      }
      const res = await fetch(`/api/reportes/${tipoReporte}?${params.toString()}`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte_${tipoReporte}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    setLoading(true);
    try {
      const payload: any = { tipo: tipoReporte, fechaInicio, fechaFin };
      
      if (tipoReporte === 'ficha-tecnica') {
        if (!productoId) {
          alert('Por favor selecciona un producto');
          setLoading(false);
          return;
        }
        payload.filtros = { productoId };
      }
      
      const res = await fetch('/api/reportes/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const html = await res.text();
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.open();
          printWindow.document.write(html);
          printWindow.document.close();
          // Retraso pequeño para asegurar que el contenido se renderice
          setTimeout(() => {
            printWindow.print();
          }, 500);
        } else {
          alert('Por favor habilita las ventanas emergentes (pop-ups) para ver e imprimir el reporte.');
        }
      } else {
        const error = await res.json().catch(() => ({ error: 'Error de red' }));
        alert(`Error al generar PDF: ${error.error || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const reporteSeleccionado = tiposReporte.find(t => t.value === tipoReporte);

  return (
    <div className="p-8 bg-slate-50 dark:bg-slate-950 min-h-screen transition-colors duration-300">
      {/* Header Area */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200 dark:shadow-none">
              <FileText className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white leading-tight">Reportes</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-widest rounded">Análisis de Datos</span>
                <span className="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full" />
                <span className="text-slate-400 dark:text-slate-500 text-xs font-medium">Información exportable</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Panel Izquierdo: Configuración */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-800 p-8 transition-colors">
            <div className="flex items-center gap-2 mb-6">
              <Filter className="h-4 w-4 text-indigo-600" />
              <h2 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-[0.2em]">Configuración</h2>
            </div>

            <div className="space-y-6">
              {/* Selección de Reporte */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Tipo de Reporte</label>
                <div className="grid gap-3">
                  {tiposReporte.map((t) => {
                    const Icon = t.icon;
                    const isActive = tipoReporte === t.value;
                    return (
                      <button
                        key={t.value}
                        onClick={() => { setTipoReporte(t.value); setPreviewData(null); }}
                        className={`flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${
                          isActive 
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-100 dark:shadow-none scale-[1.02]' 
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-indigo-300 dark:hover:border-indigo-700'
                        }`}
                      >
                        <div className={`p-2.5 rounded-xl ${isActive ? 'bg-white/20' : t.bg}`}>
                          <Icon className={`h-5 w-5 ${isActive ? 'text-white' : t.color}`} />
                        </div>
                        <div>
                          <p className={`text-sm font-black uppercase tracking-tight ${isActive ? 'text-white' : 'text-slate-900 dark:text-slate-200'}`}>{t.label}</p>
                          <p className={`text-[10px] mt-0.5 line-clamp-1 ${isActive ? 'text-white/70' : 'text-slate-500'}`}>{t.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selección de Período */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Rango de Tiempo</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-700">
                  {periodosRapidos.map((p) => (
                    <button
                      key={p.value}
                      onClick={() => handlePeriodoChange(p.value)}
                      className={`px-4 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
                        periodo === p.value
                          ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <AnimatePresence>
                {tipoReporte === 'ficha-tecnica' ? (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="space-y-4 pt-2 overflow-hidden"
                  >
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Cliente</label>
                      <select
                        value={clienteId}
                        onChange={(e) => setClienteId(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                      >
                        <option value="">Seleccionar Cliente...</option>
                        {Array.isArray(clientes) && clientes.map(c => (
                          <option key={c.id} value={c.id}>{c.nombre}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Producto</label>
                      <select
                        value={productoId}
                        onChange={(e) => setProductoId(e.target.value)}
                        disabled={!clienteId}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-50"
                      >
                        <option value="">Seleccionar Producto...</option>
                        {Array.isArray(productos) && productos.map(p => (
                          <option key={p.id} value={p.id}>{p.nombreProducto}</option>
                        ))}
                      </select>
                    </div>
                  </motion.div>
                ) : (
                  periodo === 'custom' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="space-y-4 pt-2 overflow-hidden"
                    >
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Desde</label>
                          <input
                            type="date"
                            value={fechaInicio}
                            onChange={(e) => setFechaInicio(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Hasta</label>
                          <input
                            type="date"
                            value={fechaFin}
                            onChange={(e) => setFechaFin(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )
                )}
              </AnimatePresence>

              <button
                onClick={() => fetchPreview()}
                disabled={loading}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 disabled:opacity-50 transition-all font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-100 dark:shadow-none flex items-center justify-center gap-3"
              >
                {loading ? <LoadingSpinner /> : <Calendar className="h-4 w-4" />}
                Generar Vista Previa
              </button>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={downloadPDF}
              disabled={loading || !previewData}
              className="flex flex-col items-center gap-2 p-6 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 disabled:opacity-30 transition-all group"
            >
              <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded-2xl group-hover:scale-110 transition-transform">
                <FileText className="h-6 w-6" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest">PDF</span>
            </button>
            <button
              onClick={downloadCSV}
              disabled={loading || !previewData}
              className="flex flex-col items-center gap-2 p-6 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 disabled:opacity-30 transition-all group"
            >
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl group-hover:scale-110 transition-transform">
                <FileSpreadsheet className="h-6 w-6" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest">Excel / CSV</span>
            </button>
          </div>
        </div>

        {/* Panel Derecho: Vista Previa */}
        <div className="lg:col-span-8">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-slate-800 p-8 min-h-[600px] transition-colors relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <h2 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-[0.2em]">Resumen de Datos</h2>
              {previewData && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-4 py-1.5 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100 dark:border-indigo-900/50">
                    {fechaInicio} <ChevronRight className="h-3 w-3" /> {fechaFin}
                  </div>
                  <button
                    onClick={downloadPDF}
                    disabled={loading || !previewData}
                    className="flex items-center gap-2 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Descargar Reporte PDF
                  </button>
                </div>
              )}
            </div>

            {loading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm z-10">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Analizando indicadores...</p>
              </div>
            ) : previewData ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-8"
              >
                {/* KPIs para Ventas */}
                {tipoReporte === 'ventas' && previewData.totales && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {Object.entries(previewData.totales).map(([key, value]: [string, any]) => (
                      <div key={key} className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800 transition-colors">
                        <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2 leading-none">{key.replace(/([A-Z])/g, ' $1')}</span>
                        <p className="text-xl font-black text-slate-900 dark:text-white leading-none">
                          {typeof value === 'number' ? value.toLocaleString() : value}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* REPORTE DE PRODUCCIÓN INDUSTRIAL */}
                {tipoReporte === 'produccion' && (
                  <div className="space-y-6">
                    {/* 1. 4 Tarjetas Superiores */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Card 1: PRODUCCION */}
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">PRODUCCIÓN</span>
                          <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600">
                            <BarChart3 className="w-4 h-4" />
                          </div>
                        </div>
                        <p className="text-2xl font-black text-slate-900 dark:text-white leading-tight">
                          {(previewData.totales?.kilosTotales || previewData.totales?.produccion || 0).toLocaleString()} <span className="text-xs font-bold text-slate-400">KG</span>
                        </p>
                        <div className="mt-2 flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                          <span className="px-2 py-0.5 bg-indigo-100/70 dark:bg-indigo-900/50 rounded-lg">
                            {(previewData.totales?.bolsasSelladas || 0).toLocaleString()} UND
                          </span>
                          <span className="text-slate-500 font-medium text-[11px]">Bolsas</span>
                        </div>
                      </div>

                      {/* Card 2: MERMA */}
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-[2rem] border border-rose-100 dark:border-rose-950/40 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">MERMA TOTAL</span>
                          <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center text-rose-600">
                            <Flame className="w-4 h-4" />
                          </div>
                        </div>
                        <p className="text-2xl font-black text-rose-600 dark:text-rose-400 leading-tight">
                          {(previewData.totales?.mermaTotal || previewData.totales?.merma || 0).toLocaleString()} <span className="text-xs font-bold text-rose-400">KG</span>
                        </p>
                        <p className="text-[11px] font-bold text-rose-500/90 mt-2">
                          {previewData.totales?.mermaTotal && previewData.totales?.kilosTotales
                            ? `${((previewData.totales.mermaTotal / (previewData.totales.kilosTotales + previewData.totales.mermaTotal)) * 100).toFixed(1)}% tasa de merma`
                            : 'Scrap acumulado de proceso'}
                        </p>
                      </div>

                      {/* Card 3: REGISTROS */}
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">REGISTROS / TURNOS</span>
                          <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/40 flex items-center justify-center text-purple-600">
                            <Calendar className="w-4 h-4" />
                          </div>
                        </div>
                        <p className="text-2xl font-black text-slate-900 dark:text-white leading-tight">
                          {previewData.totales?.registros || 0}
                        </p>
                        <p className="text-[11px] font-medium text-slate-500 mt-2">
                          Turnos y lotes procesados
                        </p>
                      </div>

                      {/* Card 4: EFICIENCIA */}
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-[2rem] border border-emerald-100 dark:border-emerald-950/40 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">EFICIENCIA GLOBAL</span>
                          <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600">
                            <TrendingUp className="w-4 h-4" />
                          </div>
                        </div>
                        <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 leading-tight">
                          {previewData.totales?.eficienciaGlobal || 100}%
                        </p>
                        <p className="text-[11px] font-medium text-slate-500 mt-2">
                          (Producido / Entrada Total)
                        </p>
                      </div>
                    </div>

                    {/* 2. Grid de 4 Áreas */}
                    <div>
                      <div className="flex items-center justify-between mb-3 ml-1">
                        <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">
                          Rendimiento por Área de Fabricación
                        </h3>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          4 Áreas Industriales
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                          { key: 'Extrusion', label: 'Extrusión', icon: Layers, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/30' },
                          { key: 'Serigrafia', label: 'Serigrafía', icon: Cpu, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-950/30' },
                          { key: 'Sellado', label: 'Sellado', icon: Flame, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30' },
                          { key: 'Refilado', label: 'Refilado', icon: Settings, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
                        ].map(a => {
                          const Icon = a.icon;
                          const arData = previewData.resumenPorArea?.[a.key] || { producido: 0, unidad: 'KG', merma: 0, eficiencia: 100, registros: 0 };
                          return (
                            <div key={a.key} className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <div className={`p-1.5 rounded-lg ${a.bg} ${a.color}`}>
                                    <Icon className="w-4 h-4" />
                                  </div>
                                  <span className="text-xs font-black text-slate-900 dark:text-white uppercase">{a.label}</span>
                                </div>
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                  arData.eficiencia >= 95 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                                  arData.eficiencia >= 90 ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                                  'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                }`}>
                                  {arData.eficiencia}%
                                </span>
                              </div>
                              <div className="space-y-1 mt-3 text-xs">
                                <div className="flex justify-between">
                                  <span className="text-slate-400">Producido:</span>
                                  <strong className="text-slate-900 dark:text-white">{arData.producido.toLocaleString()} {arData.unidad}</strong>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-400">Merma:</span>
                                  <strong className="text-rose-500">{arData.merma.toLocaleString()} KG</strong>
                                </div>
                                <div className="flex justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700/60 text-[10px]">
                                  <span className="text-slate-400">Turnos procesados:</span>
                                  <span className="font-bold text-slate-600 dark:text-slate-300">{arData.registros}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* 3. Desglose de Recuperación de Scrap (MOLIDO 1 al 5) */}
                    <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                        <div>
                          <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">
                            Desglose de Recuperación de Scrap (MOLIDO 1 al 5)
                          </h3>
                          <p className="text-[11px] text-slate-500">Mermas clasificadas que retornan al ciclo de Peletizado</p>
                        </div>
                        <span className="text-xs font-black text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-3 py-1 rounded-full border border-rose-200 dark:border-rose-900/50">
                          Total Scrap: {(previewData.mermasPorTipo?.total || 0).toLocaleString()} KG
                        </span>
                      </div>

                      {/* Barra de Proporción Visual */}
                      {(() => {
                        const mTot = previewData.mermasPorTipo?.total || 0;
                        const pct = (val: number) => mTot > 0 ? (val / mTot) * 100 : 0;
                        const m1 = previewData.mermasPorTipo?.mermaTransparenteAlta || 0;
                        const m2 = previewData.mermasPorTipo?.mermaBlancoPollo || 0;
                        const m3 = previewData.mermasPorTipo?.mermaColor || 0;
                        const m4 = previewData.mermasPorTipo?.mermaTransparenteBaja || 0;
                        const m5 = previewData.mermasPorTipo?.mermaBlancoPego || 0;

                        return (
                          <div>
                            <div className="h-3 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex mb-4">
                              {m1 > 0 && <div style={{ width: `${pct(m1)}%` }} className="bg-emerald-500 h-full transition-all" title={`Molido 1: ${m1} kg`} />}
                              {m2 > 0 && <div style={{ width: `${pct(m2)}%` }} className="bg-sky-500 h-full transition-all" title={`Molido 2: ${m2} kg`} />}
                              {m3 > 0 && <div style={{ width: `${pct(m3)}%` }} className="bg-purple-500 h-full transition-all" title={`Molido 3: ${m3} kg`} />}
                              {m4 > 0 && <div style={{ width: `${pct(m4)}%` }} className="bg-amber-500 h-full transition-all" title={`Molido 4: ${m4} kg`} />}
                              {m5 > 0 && <div style={{ width: `${pct(m5)}%` }} className="bg-rose-500 h-full transition-all" title={`Molido 5: ${m5} kg`} />}
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                              {[
                                { mol: 'MOLIDO 1', name: 'Transparente Alta', val: m1, dot: 'bg-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/40' },
                                { mol: 'MOLIDO 2', name: 'Blanco Pollo', val: m2, dot: 'bg-sky-500', bg: 'bg-sky-500/10 border-sky-200 dark:border-sky-900/40' },
                                { mol: 'MOLIDO 3', name: 'Color', val: m3, dot: 'bg-purple-500', bg: 'bg-purple-500/10 border-purple-200 dark:border-purple-900/40' },
                                { mol: 'MOLIDO 4', name: 'Transparente Baja', val: m4, dot: 'bg-amber-500', bg: 'bg-amber-500/10 border-amber-200 dark:border-amber-900/40' },
                                { mol: 'MOLIDO 5', name: 'Blanco Pego', val: m5, dot: 'bg-rose-500', bg: 'bg-rose-500/10 border-rose-200 dark:border-rose-900/40' },
                              ].map(item => (
                                <div key={item.mol} className={`p-3 rounded-xl border ${item.bg}`}>
                                  <div className="flex items-center gap-1.5 mb-1">
                                    <span className={`w-2 h-2 rounded-full ${item.dot}`} />
                                    <span className="text-[10px] font-black uppercase text-slate-500">{item.mol}</span>
                                  </div>
                                  <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate">{item.name}</div>
                                  <div className="text-sm font-black text-slate-900 dark:text-white mt-1">
                                    {item.val.toLocaleString()} <span className="text-[10px] text-slate-400">KG</span>
                                  </div>
                                  <div className="text-[10px] font-bold text-slate-400 mt-0.5">
                                    {pct(item.val).toFixed(1)}% del scrap
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* 4. Balance de Materiales (Tolva vs Scrap) */}
                    {previewData.balanceMateriales && (
                      <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">
                            Balance de Materiales (Consumo Estimado de Materia Prima en Extrusión)
                          </h3>
                          <span className="text-[10px] font-bold text-slate-400">
                            Total Tolva: {(previewData.balanceMateriales.totalConsumo || 0).toLocaleString()} KG
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                          {/* Peletizado */}
                          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
                            <span className="text-[10px] font-black text-emerald-600 uppercase block mb-1">Peletizado Recuperado</span>
                            <div className="text-lg font-black text-slate-900 dark:text-white">
                              {(previewData.balanceMateriales.peletizado?.total || 0).toLocaleString()} <span className="text-xs font-bold text-slate-400">KG</span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1">Reutilización en circuito cerrado</p>
                          </div>
                          {/* Resinas Vírgenes */}
                          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
                            <span className="text-[10px] font-black text-blue-600 uppercase block mb-1">Resinas Vírgenes</span>
                            <div className="text-lg font-black text-slate-900 dark:text-white">
                              {(previewData.balanceMateriales.virgenes?.total || 0).toLocaleString()} <span className="text-xs font-bold text-slate-400">KG</span>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {previewData.balanceMateriales.virgenes?.desglose?.map((r: any) => (
                                <span key={r.resina} className="text-[9px] font-bold bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">
                                  {r.resina}: {r.kg} kg
                                </span>
                              ))}
                            </div>
                          </div>
                          {/* Aditivos */}
                          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
                            <span className="text-[10px] font-black text-purple-600 uppercase block mb-1">Aditivos & Masterbatch</span>
                            <div className="text-lg font-black text-slate-900 dark:text-white">
                              {(previewData.balanceMateriales.aditivos?.total || 0).toLocaleString()} <span className="text-xs font-bold text-slate-400">KG</span>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {previewData.balanceMateriales.aditivos?.desglose?.map((a: any) => (
                                <span key={a.aditivo} className="text-[9px] font-bold bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">
                                  {a.aditivo}: {a.kg} kg
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 5. Tabla Detallada de Turnos y Órdenes */}
                    <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                        <div>
                          <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">
                            Detalle de Turnos y Órdenes Procesadas
                          </h3>
                          <p className="text-[11px] text-slate-500">Historial operativo del período seleccionado</p>
                        </div>
                        {/* Buscador Rápido */}
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            placeholder="Buscar operario, orden, producto..."
                            value={turnosSearch}
                            onChange={(e) => { setTurnosSearch(e.target.value); setTurnosPage(1); }}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-64"
                          />
                        </div>
                      </div>

                      {/* Tabla */}
                      {(() => {
                        const filtered = (previewData.producciones || []).filter((p: any) => {
                          if (!turnosSearch) return true;
                          const q = turnosSearch.toLowerCase();
                          return (
                            p.orden?.toLowerCase().includes(q) ||
                            p.producto?.toLowerCase().includes(q) ||
                            p.cliente?.toLowerCase().includes(q) ||
                            p.operario?.toLowerCase().includes(q) ||
                            p.area?.toLowerCase().includes(q) ||
                            p.turno?.toLowerCase().includes(q)
                          );
                        });

                        const totalPages = Math.ceil(filtered.length / turnosPorPagina) || 1;
                        const currentPage = Math.min(turnosPage, totalPages);
                        const paginated = filtered.slice((currentPage - 1) * turnosPorPagina, currentPage * turnosPorPagina);

                        return (
                          <div>
                            <div className="rounded-xl border border-slate-200 dark:border-slate-700/60 overflow-hidden bg-white dark:bg-slate-900">
                              <table className="w-full text-left text-xs">
                                <thead className="bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-500 border-b border-slate-200 dark:border-slate-700/60">
                                  <tr>
                                    <th className="px-4 py-3">Fecha</th>
                                    <th className="px-3 py-3">Turno</th>
                                    <th className="px-3 py-3">Área</th>
                                    <th className="px-3 py-3">Orden / Lote</th>
                                    <th className="px-4 py-3">Producto / Cliente</th>
                                    <th className="px-4 py-3 text-right">Cantidad</th>
                                    <th className="px-4 py-3 text-right">Merma</th>
                                    <th className="px-4 py-3">Operario</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                  {paginated.length > 0 ? (
                                    paginated.map((p: any) => (
                                      <tr key={p.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                                        <td className="px-4 py-2.5 font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                                          {p.fechaFormatted || p.fecha}
                                        </td>
                                        <td className="px-3 py-2.5">
                                          <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-bold text-[10px] text-slate-600 dark:text-slate-300">
                                            {p.turno}
                                          </span>
                                        </td>
                                        <td className="px-3 py-2.5 font-bold text-slate-700 dark:text-slate-300">
                                          {p.area}
                                        </td>
                                        <td className="px-3 py-2.5 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                          {p.orden}
                                        </td>
                                        <td className="px-4 py-2.5 max-w-[180px]">
                                          <div className="font-bold text-slate-900 dark:text-white truncate">{p.producto}</div>
                                          <div className="text-[10px] text-slate-400 truncate">{p.cliente}</div>
                                        </td>
                                        <td className="px-4 py-2.5 text-right font-black text-slate-900 dark:text-white whitespace-nowrap">
                                          {p.cantidadProducida.toLocaleString()} <span className="text-[10px] text-slate-400 font-bold">{p.unidad}</span>
                                        </td>
                                        <td className="px-4 py-2.5 text-right font-black text-rose-500 whitespace-nowrap">
                                          {p.merma.toLocaleString()} <span className="text-[10px] opacity-70">KG</span>
                                        </td>
                                        <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300 font-medium whitespace-nowrap">
                                          {p.operario}
                                        </td>
                                      </tr>
                                    ))
                                  ) : (
                                    <tr>
                                      <td colSpan={8} className="text-center py-8 text-slate-400 text-xs">
                                        No se encontraron registros de turnos en este período.
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>

                            {/* Controles de Paginación */}
                            {filtered.length > turnosPorPagina && (
                              <div className="flex items-center justify-between mt-4 px-1 text-xs">
                                <span className="text-slate-400 font-medium text-[11px]">
                                  Mostrando {(currentPage - 1) * turnosPorPagina + 1} a {Math.min(currentPage * turnosPorPagina, filtered.length)} de {filtered.length} registros
                                </span>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => setTurnosPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage <= 1}
                                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-white dark:hover:bg-slate-800 transition-colors"
                                  >
                                    <ChevronLeft className="w-4 h-4" />
                                  </button>
                                  <span className="font-bold text-slate-700 dark:text-slate-300 text-xs">
                                    {currentPage} / {totalPages}
                                  </span>
                                  <button
                                    onClick={() => setTurnosPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage >= totalPages}
                                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-white dark:hover:bg-slate-800 transition-colors"
                                  >
                                    <ChevronRight className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* Ficha Técnica Preview con Tabs Industriales */}
                {tipoReporte === 'ficha-tecnica' && (
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-6 md:p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                    {/* Header del Producto */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-6 border-b border-slate-200 dark:border-slate-700/60">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-sm">
                            Ficha Técnica
                          </span>
                          <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded">
                            {previewData.codigoProducto ? `COD: ${previewData.codigoProducto}` : `ID: ${previewData.id?.slice(0, 8)}`}
                          </span>
                        </div>
                        <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mt-2">
                          {previewData.nombreProducto}
                        </h3>
                        <p className="text-xs text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider mt-0.5">
                          Cliente: <span className="text-blue-600 dark:text-blue-400">{previewData.cliente?.nombre || 'N/A'}</span> {previewData.cliente?.rif ? `(${previewData.cliente.rif})` : ''}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={downloadPDF}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all"
                        >
                          <FileText className="w-4 h-4" />
                          Imprimir / PDF
                        </button>
                        <button
                          onClick={downloadCSV}
                          className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all"
                        >
                          <FileSpreadsheet className="w-4 h-4" />
                          CSV
                        </button>
                      </div>
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex items-center gap-1 overflow-x-auto pb-2 mb-6 border-b border-slate-200 dark:border-slate-700/60 no-scrollbar">
                      {[
                        { id: 'general', label: '1. General & Medidas', icon: Layers },
                        { id: 'formulacion', label: '2. Formulación (Tolva)', icon: FlaskConical },
                        { id: 'extrusion', label: '3. Extrusión & Serigrafía', icon: Cpu },
                        { id: 'sellado', label: '4. Sellado (Día / Tarde)', icon: Flame },
                        { id: 'mecanica', label: '5. Mecánica & Fuelles', icon: Wrench },
                      ].map((t) => {
                        const Icon = t.icon;
                        const active = fichaTab === t.id;
                        return (
                          <button
                            key={t.id}
                            onClick={() => setFichaTab(t.id as any)}
                            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                              active
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            {t.label}
                          </button>
                        );
                      })}
                    </div>

                    {/* TAB 1: General & Dimensiones */}
                    {fichaTab === 'general' && (
                      <div className="space-y-4 text-xs">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Identificación</span>
                            <div className="space-y-1.5">
                              <p className="flex justify-between"><span className="text-slate-500">Tipo de Producto:</span><strong className="text-slate-900 dark:text-white">{previewData.tipoProducto}</strong></p>
                              <p className="flex justify-between"><span className="text-slate-500">Tipo de Bolsa:</span><strong className="text-slate-900 dark:text-white">{previewData.tipoBolsa || '-'}</strong></p>
                              <p className="flex justify-between"><span className="text-slate-500">Material Base:</span><strong className="text-slate-900 dark:text-white">{previewData.material || '-'}</strong></p>
                              <p className="flex justify-between"><span className="text-slate-500">Unidad Venta:</span><strong className="text-slate-900 dark:text-white">{previewData.unidadVenta || 'Unidades'}</strong></p>
                            </div>
                          </div>

                          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Dimensiones Nominales</span>
                            <div className="grid grid-cols-2 gap-2">
                              <p><span className="text-slate-500 block text-[10px]">Ancho:</span><strong className="text-sm font-black text-slate-900 dark:text-white">{previewData.ancho ? `${previewData.ancho} cm` : '-'}</strong></p>
                              <p><span className="text-slate-500 block text-[10px]">Largo:</span><strong className="text-sm font-black text-slate-900 dark:text-white">{previewData.largo ? `${previewData.largo} cm` : '-'}</strong></p>
                              <p><span className="text-slate-500 block text-[10px]">Calibre:</span><strong className="text-sm font-black text-slate-900 dark:text-white">{previewData.calibre ? `${previewData.calibre} µ` : '-'}</strong></p>
                              <p><span className="text-slate-500 block text-[10px]">Fuelle:</span><strong className="text-sm font-black text-slate-900 dark:text-white">{previewData.anchoFuelle || previewData.fuelleASA ? `${previewData.anchoFuelle || previewData.fuelleASA} cm` : '-'}</strong></p>
                              <p><span className="text-slate-500 block text-[10px]">Peso Unitario:</span><strong className="text-sm font-black text-blue-600 dark:text-blue-400">{previewData.pesoPorUnidad ? `${previewData.pesoPorUnidad} g` : '-'}</strong></p>
                              <p><span className="text-slate-500 block text-[10px]">Ancho Bobina:</span><strong className="text-sm font-black text-slate-900 dark:text-white">{previewData.anchoBobina ? `${previewData.anchoBobina} cm` : '-'}</strong></p>
                            </div>
                          </div>

                          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Condiciones de Fabricación</span>
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-slate-500">¿Lleva Impresión?</span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-black ${previewData.conImpresion ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-slate-100 text-slate-500'}`}>
                                  {previewData.conImpresion ? 'SÍ' : 'NO'}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-slate-500">¿Lleva Pigmento?</span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-black ${previewData.conPigmento ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-slate-100 text-slate-500'}`}>
                                  {previewData.conPigmento ? 'SÍ' : 'NO'}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-slate-500">¿Lleva Postizo?</span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-black ${previewData.llevaPostizo ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-slate-100 text-slate-500'}`}>
                                  {previewData.llevaPostizo ? 'SÍ' : 'NO'}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-slate-500">Estado de Catálogo:</span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-black ${previewData.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                  {previewData.activo ? 'ACTIVO' : 'INACTIVO'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* TAB 2: Formulación (Tolva) */}
                    {fichaTab === 'formulacion' && (
                      <div className="space-y-4 text-xs">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                            <span className="text-[10px] font-black text-sky-600 uppercase tracking-widest block mb-2">Material Recuperado / Molido</span>
                            <div className="text-2xl font-black text-sky-600">{previewData.molido ?? 0}%</div>
                            <p className="text-[10px] text-slate-400 mt-1">Porcentaje de recuperación en mezcla base</p>
                          </div>

                          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block mb-2">Peletizado Asignado</span>
                            <p className="text-xs font-black text-slate-900 dark:text-white truncate">
                              {previewData.peletizado?.nombre || (previewData.peletizadoId ? 'Peletizado Asignado' : 'Ninguno')}
                            </p>
                            <div className="text-xl font-black text-emerald-600 mt-1">{previewData.peletizadoPorcentaje ?? 0}%</div>
                          </div>

                          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block mb-2">Resinas Vírgenes (% Base)</span>
                            <div className="space-y-1">
                              {[
                                { k: 'form3003', l: '3003' }, { k: 'formLineal', l: 'Lineal' },
                                { k: 'formFB7000', l: 'FB7000' }, { k: 'form0240', l: '0240' },
                                { k: 'form0348', l: '0348' }, { k: 'form7000F', l: '7000F' }
                              ].filter(r => previewData[r.k] && Number(previewData[r.k]) > 0).map(r => (
                                <div key={r.k} className="flex justify-between items-center text-xs">
                                  <span className="font-bold text-slate-600 dark:text-slate-300">{r.l}:</span>
                                  <strong className="text-indigo-600 dark:text-indigo-400">{previewData[r.k]}%</strong>
                                </div>
                              ))}
                              {![
                                'form3003', 'formLineal', 'formFB7000', 'form0240', 'form0348', 'form7000F'
                              ].some(k => previewData[k] && Number(previewData[k]) > 0) && (
                                <span className="text-slate-400 italic">No configuradas</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Aditivos y Pigmentos (% Adicional)</span>
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                            {[
                              { k: 'formDeslizante', l: 'Deslizante' },
                              { k: 'formMasterbachBlanco', l: 'MB Blanco' },
                              { k: 'formMasterbachNegro', l: 'MB Negro' },
                              { k: 'formMasterbachAzul', l: 'MB Azul' },
                              { k: 'formMasterbachAmarillo', l: 'MB Amarillo' },
                            ].map(a => (
                              <div key={a.k} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 text-center">
                                <span className="text-[10px] text-slate-400 block font-bold">{a.l}</span>
                                <strong className="text-sm font-black text-slate-900 dark:text-white">
                                  {previewData[a.k] ? `${previewData[a.k]}%` : '-'}
                                </strong>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* TAB 3: Extrusión & Serigrafía */}
                    {fichaTab === 'extrusion' && (
                      <div className="space-y-4 text-xs">
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Parámetros de Extrusora</span>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div><span className="text-slate-400 block text-[10px]">Máquina:</span><strong className="text-slate-900 dark:text-white">{previewData.extMaquinaExtrusora || '-'}</strong></div>
                            <div><span className="text-slate-400 block text-[10px]">Diámetro Cabezal:</span><strong className="text-slate-900 dark:text-white">{previewData.extDiametroCabezal ? `${previewData.extDiametroCabezal} mm` : '-'}</strong></div>
                            <div><span className="text-slate-400 block text-[10px]">Temp. Ambiente:</span><strong className="text-slate-900 dark:text-white">{previewData.extTemperaturaAmbiente ? `${previewData.extTemperaturaAmbiente} °C` : '-'}</strong></div>
                            <div><span className="text-slate-400 block text-[10px]">Motor Principal:</span><strong className="text-slate-900 dark:text-white">{previewData.extMotorPrincipal || '-'}</strong></div>
                            <div><span className="text-slate-400 block text-[10px]">Tracción:</span><strong className="text-slate-900 dark:text-white">{previewData.extTraccion || '-'}</strong></div>
                            <div><span className="text-slate-400 block text-[10px]">Soplador Principal:</span><strong className="text-slate-900 dark:text-white">{previewData.extSopladorPrincipal || '-'}</strong></div>
                            <div><span className="text-slate-400 block text-[10px]">Abertura Blower:</span><strong className="text-slate-900 dark:text-white">{previewData.extAberturaBlower || '-'}</strong></div>
                            <div><span className="text-slate-400 block text-[10px]">Cuello Globo / Temp:</span><strong className="text-slate-900 dark:text-white">{previewData.extCuelloGlobo || '-'} ({previewData.extTemperaturaCuelloGlobo ? `${previewData.extTemperaturaCuelloGlobo} °C` : '-'})</strong></div>
                            <div><span className="text-slate-400 block text-[10px]">Tracción Rebobinador:</span><strong className="text-slate-900 dark:text-white">{previewData.extTraccionRebobinador || '-'}</strong></div>
                            <div><span className="text-slate-400 block text-[10px]">Winding 1 / 2:</span><strong className="text-slate-900 dark:text-white">{previewData.extRebobinadorWinding1 || '-'} / {previewData.extRebobinadorWinding2 || '-'}</strong></div>
                            <div><span className="text-slate-400 block text-[10px]">Tratador Corona:</span><strong className="text-slate-900 dark:text-white">{previewData.extIntensidadTratador || previewData.intensidadTratador || '-'}</strong></div>
                            <div><span className="text-slate-400 block text-[10px]">Flujo Blower:</span><strong className="text-slate-900 dark:text-white">{previewData.extOrientacionFlujoBlower || '-'}</strong></div>
                          </div>
                        </div>

                        {/* Zonas Z1 a Z20 */}
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                          <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest block mb-2">Perfil Térmico de Zonas (Z1 a Z20 en °C)</span>
                          <div className="grid grid-cols-5 md:grid-cols-10 gap-1.5">
                            {Array.from({ length: 20 }, (_, i) => i + 1).map(i => (
                              <div key={i} className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 text-center">
                                <span className="text-[8px] font-bold text-slate-400 block">Z{i}</span>
                                <strong className="text-xs font-black text-slate-900 dark:text-white">
                                  {previewData[`extTemperaturaZ${i}`] || '-'}
                                </strong>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Serigrafía */}
                        {previewData.conImpresion && (
                          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                            <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest block mb-3">Parámetros de Serigrafía</span>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                              <div><span className="text-slate-400 block text-[10px]">Tipo Impresión:</span><strong className="text-slate-900 dark:text-white">{previewData.tipoImpresion || '-'}</strong></div>
                              <div><span className="text-slate-400 block text-[10px]">Cilindro (cm):</span><strong className="text-slate-900 dark:text-white">{previewData.cilindro ? `${previewData.cilindro} cm` : '-'}</strong></div>
                              <div><span className="text-slate-400 block text-[10px]">Repeticiones:</span><strong className="text-slate-900 dark:text-white">{previewData.repeticionesImagen || '-'}</strong></div>
                              <div><span className="text-slate-400 block text-[10px]">Tratador Serigrafía:</span><strong className="text-slate-900 dark:text-white">{previewData.serigrafiaTratadorIntensidad || '-'}</strong></div>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 font-bold block mb-1">Colores de Tinta Configurados:</span>
                              <div className="flex gap-2 flex-wrap">
                                {[1, 2, 3, 4, 5, 6].filter(i => previewData[`color${i}`]).map(i => (
                                  <span key={i} className="px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-bold text-xs border border-purple-200 dark:border-purple-800">
                                    C{i}: {previewData[`color${i}`]}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* TAB 4: Sellado (Día vs Tarde) */}
                    {fichaTab === 'sellado' && (() => {
                      const regDia = previewData.parametrosSellado?.find((p: any) => p.turno === 'DIA') || previewData;
                      const regTarde = previewData.parametrosSellado?.find((p: any) => p.turno === 'TARDE') || regDia;
                      const v = (val: any) => (val !== null && val !== undefined && val !== '' ? val : '-');

                      return (
                        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden text-xs">
                          <table className="w-full text-left">
                            <thead className="bg-slate-100 dark:bg-slate-800 text-[10px] uppercase font-black tracking-wider text-slate-600 dark:text-slate-300">
                              <tr>
                                <th className="px-4 py-3">Parámetro Técnico de Sellado</th>
                                <th className="px-4 py-3 text-center bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-400 w-1/4">Turno Día ☀️</th>
                                <th className="px-4 py-3 text-center bg-indigo-50 dark:bg-indigo-950/30 text-indigo-800 dark:text-indigo-400 w-1/4">Turno Tarde 🌙</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                              <tr className="bg-slate-50 dark:bg-slate-800/40 font-bold text-slate-500 text-[10px] uppercase"><td colSpan={3} className="px-4 py-1.5">1. Temperaturas (°C)</td></tr>
                              <tr><td className="px-4 py-2 font-medium">Temperatura Superior (°C)</td><td className="px-4 py-2 text-center font-bold">{v(regDia.temperaturaSuperior)}</td><td className="px-4 py-2 text-center font-bold">{v(regTarde.temperaturaSuperior)}</td></tr>
                              <tr><td className="px-4 py-2 font-medium">Temperatura Inferior (°C)</td><td className="px-4 py-2 text-center font-bold">{v(regDia.temperaturaInferior)}</td><td className="px-4 py-2 text-center font-bold">{v(regTarde.temperaturaInferior)}</td></tr>
                              <tr><td className="px-4 py-2 font-medium">Temperatura Válvula (°C)</td><td className="px-4 py-2 text-center font-bold">{v(regDia.temperaturaValvula)}</td><td className="px-4 py-2 text-center font-bold">{v(regTarde.temperaturaValvula)}</td></tr>
                              <tr><td className="px-4 py-2 font-medium">Temperatura Cuchilla (°C)</td><td className="px-4 py-2 text-center font-bold">{v(regDia.temperaturaCuchilla)}</td><td className="px-4 py-2 text-center font-bold">{v(regTarde.temperaturaCuchilla)}</td></tr>
                              <tr><td className="px-4 py-2 font-medium">Temperatura Presellado A (°C)</td><td className="px-4 py-2 text-center font-bold">{v(regDia.preselladoA)}</td><td className="px-4 py-2 text-center font-bold">{v(regTarde.preselladoA)}</td></tr>
                              <tr><td className="px-4 py-2 font-medium">Temperatura Presellado B (°C)</td><td className="px-4 py-2 text-center font-bold">{v(regDia.preselladoB)}</td><td className="px-4 py-2 text-center font-bold">{v(regTarde.preselladoB)}</td></tr>
                              <tr><td className="px-4 py-2 font-medium">Temperatura Ambiente en Máquina (°C)</td><td className="px-4 py-2 text-center font-bold">{v(regDia.temperaturaAmbiente)}</td><td className="px-4 py-2 text-center font-bold">{v(regTarde.temperaturaAmbiente)}</td></tr>

                              <tr className="bg-slate-50 dark:bg-slate-800/40 font-bold text-slate-500 text-[10px] uppercase"><td colSpan={3} className="px-4 py-1.5">2. Tiempos y Accesorios</td></tr>
                              <tr><td className="px-4 py-2 font-medium">Tiempo Límite / Soldador (ms)</td><td className="px-4 py-2 text-center font-bold">{v(regDia.tiempoLimite)}</td><td className="px-4 py-2 text-center font-bold">{v(regTarde.tiempoLimite)}</td></tr>
                              <tr><td className="px-4 py-2 font-medium">Microperforaciones</td><td className="px-4 py-2 text-center font-bold">{v(regDia.microperforaciones)}</td><td className="px-4 py-2 text-center font-bold">{v(regTarde.microperforaciones)}</td></tr>
                              <tr><td className="px-4 py-2 font-medium">Muleteado</td><td className="px-4 py-2 text-center font-bold">{v(regDia.muleteado)}</td><td className="px-4 py-2 text-center font-bold">{v(regTarde.muleteado)}</td></tr>
                              <tr><td className="px-4 py-2 font-medium">Presión Troquel Válvula (PSI)</td><td className="px-4 py-2 text-center font-bold">{v(regDia.presionTroquelValvula)}</td><td className="px-4 py-2 text-center font-bold">{v(regTarde.presionTroquelValvula)}</td></tr>

                              <tr className="bg-slate-50 dark:bg-slate-800/40 font-bold text-slate-500 text-[10px] uppercase"><td colSpan={3} className="px-4 py-1.5">3. Velocidades y Presiones</td></tr>
                              <tr><td className="px-4 py-2 font-medium">Velocidad (GPM) | Ciclo de Trabajo (%)</td><td className="px-4 py-2 text-center font-bold">{v(regDia.gpm)} GPM | {v(regDia.cicloTrabajo)}%</td><td className="px-4 py-2 text-center font-bold">{v(regTarde.gpm)} GPM | {v(regTarde.cicloTrabajo)}%</td></tr>
                              <tr><td className="px-4 py-2 font-medium">Velocidad Transportador / Banda (cm)</td><td className="px-4 py-2 text-center font-bold">{v(regDia.velocidadTransportador)}</td><td className="px-4 py-2 text-center font-bold">{v(regTarde.velocidadTransportador)}</td></tr>
                              <tr><td className="px-4 py-2 font-medium">Rodillo Ancho Válvula (cm)</td><td className="px-4 py-2 text-center font-bold">{v(regDia.rodilloAnchoValvula)}</td><td className="px-4 py-2 text-center font-bold">{v(regTarde.rodilloAnchoValvula)}</td></tr>
                              <tr><td className="px-4 py-2 font-medium">Presión Balancín 1 | 2 | 3 (bar)</td><td className="px-4 py-2 text-center font-bold">{v(regDia.presionBalancin1)} / {v(regDia.presionBalancin2)} / {v(regDia.presionBalancin3)}</td><td className="px-4 py-2 text-center font-bold">{v(regTarde.presionBalancin1)} / {v(regTarde.presionBalancin2)} / {v(regTarde.presionBalancin3)}</td></tr>
                              <tr><td className="px-4 py-2 font-medium">Presión Soplado Arriba | Abajo (bar)</td><td className="px-4 py-2 text-center font-bold">{v(regDia.presionSopladoArriba)} / {v(regDia.presionSopladoAbajo)}</td><td className="px-4 py-2 text-center font-bold">{v(regTarde.presionSopladoArriba)} / {v(regTarde.presionSopladoAbajo)}</td></tr>
                              <tr><td className="px-4 py-2 font-medium">Presión Rodillo Servo L | Servo R (bar)</td><td className="px-4 py-2 text-center font-bold">{v(regDia.presionRodilloServoL)} / {v(regDia.presionRodilloServoR)}</td><td className="px-4 py-2 text-center font-bold">{v(regTarde.presionRodilloServoL)} / {v(regTarde.presionRodilloServoR)}</td></tr>
                              <tr><td className="px-4 py-2 font-medium">Soplar Inicio | Soplar Terminar</td><td className="px-4 py-2 text-center font-bold">{v(regDia.soplarInicio)} / {v(regDia.soplarTerminar)}</td><td className="px-4 py-2 text-center font-bold">{v(regTarde.soplarInicio)} / {v(regTarde.soplarTerminar)}</td></tr>
                            </tbody>
                          </table>
                        </div>
                      );
                    })()}

                    {/* TAB 5: Mecánica & Fuelles */}
                    {fichaTab === 'mecanica' && (() => {
                      const regDia = previewData.parametrosSellado?.find((p: any) => p.turno === 'DIA') || previewData;
                      const v = (val: any, unit = '') => (val !== null && val !== undefined && val !== '' ? `${val}${unit ? ' ' + unit : ''}` : '-');

                      return (
                        <div className="space-y-4 text-xs">
                          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Alturas y Posición de Sensores</span>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              <div><span className="text-slate-400 block text-[10px]">Cabezal Ext. Derecho:</span><strong className="text-slate-900 dark:text-white">{v(regDia.alturaCabezalExtDerecho ?? previewData.alturaCabezalExtDerecho, 'cm')}</strong></div>
                              <div><span className="text-slate-400 block text-[10px]">Cabezal Ext. Izquierdo:</span><strong className="text-slate-900 dark:text-white">{v(regDia.alturaCabezalExtIzquierdo ?? previewData.alturaCabezalExtIzquierdo, 'cm')}</strong></div>
                              <div><span className="text-slate-400 block text-[10px]">Banda Transportadora:</span><strong className="text-slate-900 dark:text-white">{v(regDia.bandaTransportadora ?? previewData.bandaTransportadora, 'cm')}</strong></div>
                              <div><span className="text-slate-400 block text-[10px]">Medida Portabobina:</span><strong className="text-slate-900 dark:text-white">{v(regDia.medidaPortabobina ?? previewData.medidaPortabobina, 'cm')}</strong></div>
                              <div><span className="text-slate-400 block text-[10px]">Ajuste Sensor Fail:</span><strong className="text-slate-900 dark:text-white">{v(regDia.ajusteSensorFail ?? previewData.ajusteSensorFail)}</strong></div>
                              <div><span className="text-slate-400 block text-[10px]">Ángulo Alim. Bolsa:</span><strong className="text-slate-900 dark:text-white">{v(regDia.feedingBagAngle ?? previewData.feedingBagAngle, '°')}</strong></div>
                              <div><span className="text-slate-400 block text-[10px]">Dist. Sensor Color:</span><strong className="text-slate-900 dark:text-white">{v(regDia.distanciaSensorRegistroColor ?? previewData.distanciaSensorRegistroColor, 'cm')}</strong></div>
                              <div><span className="text-slate-400 block text-[10px]">Dist. Sensor Movimiento:</span><strong className="text-slate-900 dark:text-white">{v(regDia.distanciaSensorMovimiento ?? previewData.distanciaSensorMovimiento, 'cm')}</strong></div>
                            </div>
                          </div>

                          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Geometría de Fuelles y Válvula</span>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              <div><span className="text-slate-400 block text-[10px]">Ancho Válvula / Solapa:</span><strong className="text-blue-600 dark:text-blue-400">{v(previewData.anchoValvula, 'cm')} / {v(previewData.anchoSolapa, 'cm')}</strong></div>
                              <div><span className="text-slate-400 block text-[10px]">Fuelle Superior (Izq / Der):</span><strong className="text-slate-900 dark:text-white">{v(regDia.fuelleSuperiorIzquierdo ?? previewData.fuelleSuperiorIzquierdo, 'cm')} / {v(regDia.fuelleSuperiorDerecho ?? previewData.fuelleSuperiorDerecho, 'cm')}</strong></div>
                              <div><span className="text-slate-400 block text-[10px]">Fuelle Inferior (Izq / Der):</span><strong className="text-slate-900 dark:text-white">{v(regDia.fuelleInferiorIzquierdo ?? previewData.fuelleInferiorIzquierdo, 'cm')} / {v(regDia.fuelleInferiorDerecho ?? previewData.fuelleInferiorDerecho, 'cm')}</strong></div>
                              <div><span className="text-slate-400 block text-[10px]">Bolsa Tras Triángulo / Long:</span><strong className="text-slate-900 dark:text-white">{v(regDia.anchoBolsaDespuesTriangulo ?? previewData.anchoBolsaDespuesTriangulo, 'cm')} / {v(regDia.longitudBolsa ?? previewData.longitudBolsa, 'cm')}</strong></div>
                            </div>

                            {(previewData.tipoBolsa === 'asa' || previewData.esBolsaASA) && (
                              <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                                <div><span className="text-slate-400 block text-[10px]">Fuelle ASA:</span><strong className="text-slate-900 dark:text-white">{v(previewData.fuelleASA, 'cm')}</strong></div>
                                <div><span className="text-slate-400 block text-[10px]">Ancho Troquel ASA:</span><strong className="text-slate-900 dark:text-white">{v(previewData.anchoTroquelASA, 'cm')}</strong></div>
                                <div><span className="text-slate-400 block text-[10px]">Largo Troquel ASA:</span><strong className="text-slate-900 dark:text-white">{v(previewData.largoTroquelASA, 'cm')}</strong></div>
                              </div>
                            )}
                          </div>

                          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Tornillería y Calibración Mecánica</span>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              <div><span className="text-slate-400 block text-[10px]">Tornillo Espárrago:</span><strong className="text-slate-900 dark:text-white">{v(regDia.tornilloEsparrago ?? previewData.tornilloEsparrago)}</strong></div>
                              <div><span className="text-slate-400 block text-[10px]">Amortiguadores (A, B, C):</span><strong className="text-slate-900 dark:text-white">{v(regDia.tornilloAmortiguadorCabezalA ?? previewData.tornilloAmortiguadorCabezalA)} / {v(regDia.tornilloAmortiguadorCabezalB ?? previewData.tornilloAmortiguadorCabezalB)} / {v(regDia.tornilloAmortiguadorCabezalC ?? previewData.tornilloAmortiguadorCabezalC)}</strong></div>
                              <div><span className="text-slate-400 block text-[10px]">Mov. Horiz. Cabezal Der (D/I):</span><strong className="text-slate-900 dark:text-white">{v(regDia.tornilloDerMovHorizCabezalDer ?? previewData.tornilloDerMovHorizCabezalDer)} / {v(regDia.tornilloIzqMovHorizCabezalDer ?? previewData.tornilloIzqMovHorizCabezalDer)}</strong></div>
                              <div><span className="text-slate-400 block text-[10px]">Mov. Horiz. Cabezal Izq (D/I):</span><strong className="text-slate-900 dark:text-white">{v(regDia.tornilloDerMovHorizCabezalIzq ?? previewData.tornilloDerMovHorizCabezalIzq)} / {v(regDia.tornilloIzqMovHorizCabezalIzq ?? previewData.tornilloIzqMovHorizCabezalIzq)}</strong></div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    <div className="mt-6 flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      <span>ERP Industrial &bull; Módulo de Fichas Técnicas</span>
                      <span>Listo para exportación a PDF oficial</span>
                    </div>
                  </div>
                )}

                {/* REPORTE DE INVENTARIO INDUSTRIAL */}
                {tipoReporte === 'inventario' && (
                  <div className="space-y-6">
                    {/* A. 5 Tarjetas Métricas Superiores */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
                      {/* Card 1: TOTAL ITEMS */}
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-[1.8rem] border border-slate-100 dark:border-slate-800 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">TOTAL ITEMS</span>
                          <div className="w-7 h-7 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600">
                            <Package className="w-3.5 h-3.5" />
                          </div>
                        </div>
                        <p className="text-2xl font-black text-slate-900 dark:text-white leading-tight">
                          {previewData.totales?.totalItems ?? previewData.inventarios?.length ?? 0}
                        </p>
                        <p className="text-[10px] font-medium text-slate-500 mt-1.5">
                          Artículos en catálogo
                        </p>
                      </div>

                      {/* Card 2: VALOR INVENTARIO */}
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-[1.8rem] border border-emerald-100 dark:border-emerald-950/40 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">VALOR INVENTARIO</span>
                          <div className="w-7 h-7 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600">
                            <TrendingUp className="w-3.5 h-3.5" />
                          </div>
                        </div>
                        <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 leading-tight">
                          {previewData.totales?.valorInventarioFormatted || '$ 0,00'}
                        </p>
                        <p className="text-[10px] font-medium text-slate-500 mt-1.5">
                          Costo estimado stock
                        </p>
                      </div>

                      {/* Card 3: ITEMS STOCK BAJO */}
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-[1.8rem] border border-rose-200 dark:border-rose-950/50 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest">STOCK CRÍTICO</span>
                          <div className="w-7 h-7 rounded-xl bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center text-rose-600 animate-pulse">
                            <AlertTriangle className="w-3.5 h-3.5" />
                          </div>
                        </div>
                        <p className="text-2xl font-black text-rose-600 dark:text-rose-400 leading-tight">
                          {previewData.totales?.itemsStockBajo ?? 0}
                        </p>
                        <p className="text-[10px] font-bold text-rose-500/90 mt-1.5">
                          Bajo nivel mínimo
                        </p>
                      </div>

                      {/* Card 4: ITEMS STOCK ÓPTIMO */}
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-[1.8rem] border border-slate-100 dark:border-slate-800 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">STOCK ÓPTIMO</span>
                          <div className="w-7 h-7 rounded-xl bg-teal-50 dark:bg-teal-950/40 flex items-center justify-center text-teal-600">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </div>
                        </div>
                        <p className="text-2xl font-black text-slate-900 dark:text-white leading-tight">
                          {previewData.totales?.itemsStockOptimo ?? 0}
                        </p>
                        <p className="text-[10px] font-medium text-slate-500 mt-1.5">
                          Niveles saludables
                        </p>
                      </div>

                      {/* Card 5: TOTAL MOVIMIENTOS */}
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-[1.8rem] border border-slate-100 dark:border-slate-800 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">TOTAL MOVIMIENTOS</span>
                          <div className="w-7 h-7 rounded-xl bg-purple-50 dark:bg-purple-950/40 flex items-center justify-center text-purple-600">
                            <ArrowLeftRight className="w-3.5 h-3.5" />
                          </div>
                        </div>
                        <p className="text-2xl font-black text-purple-600 dark:text-purple-400 leading-tight">
                          {previewData.totales?.totalMovimientos ?? 0}
                        </p>
                        <p className="text-[10px] font-medium text-slate-500 mt-1.5 truncate">
                          +{previewData.totales?.countEntradas || 0} ent | -{previewData.totales?.countSalidas || 0} sal
                        </p>
                      </div>
                    </div>

                    {/* B.1 Consolidado por Categoría (Grid de 4 bloques) */}
                    <div>
                      <div className="flex items-center justify-between mb-3 ml-1">
                        <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">
                          Consolidado de Existencias por Categoría
                        </h3>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          Almacén Central de Materias y Terminados
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Bloque 1: Materia Prima Virgen */}
                        <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600">
                                  <Boxes className="w-4 h-4" />
                                </div>
                                <span className="text-xs font-black text-slate-900 dark:text-white uppercase">Materia Prima Virgen</span>
                              </div>
                              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                                {previewData.consolidadoCategorias?.materiaPrima?.itemsCount || 0} Items
                              </span>
                            </div>
                            <div className="mt-2">
                              <span className="text-2xl font-black text-slate-900 dark:text-white">
                                {(previewData.consolidadoCategorias?.materiaPrima?.totalKg || 0).toLocaleString()}
                              </span>
                              <span className="text-xs font-bold text-slate-400 ml-1">KG</span>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-1">Resinas vírgenes en silos y sacos</p>
                          </div>
                          
                          <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60 space-y-1">
                            {previewData.consolidadoCategorias?.materiaPrima?.desglose?.slice(0, 5).map((mp: any) => (
                              <div key={mp.id} className="flex justify-between items-center text-[10px]">
                                <span className="text-slate-600 dark:text-slate-300 font-bold truncate max-w-[120px]">{mp.codigo}</span>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-black text-slate-900 dark:text-white">{mp.cantidad.toLocaleString()} kg</span>
                                  {mp.alerta && <span className="w-1.5 h-1.5 rounded-full bg-rose-500" title="Stock bajo" />}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Bloque 2: Peletizado / Recuperado */}
                        <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
                                  <Cpu className="w-4 h-4" />
                                </div>
                                <span className="text-xs font-black text-slate-900 dark:text-white uppercase">Peletizado / Recuperado</span>
                              </div>
                              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                Molido 1 al 5
                              </span>
                            </div>
                            <div className="mt-2">
                              <span className="text-2xl font-black text-slate-900 dark:text-white">
                                {(previewData.consolidadoCategorias?.peletizado?.totalKg || 0).toLocaleString()}
                              </span>
                              <span className="text-xs font-bold text-slate-400 ml-1">KG</span>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-1">Material molido retornado al proceso</p>
                          </div>

                          <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60 space-y-1">
                            {previewData.consolidadoCategorias?.peletizado?.desgloseMolidos?.map((m: any) => (
                              <div key={m.molido} className="flex justify-between items-center text-[10px]">
                                <span className="text-slate-600 dark:text-slate-300 font-bold truncate max-w-[120px]">{m.molido}: {m.tipo}</span>
                                <span className="font-black text-slate-900 dark:text-white">{m.cantidad.toLocaleString()} kg</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Bloque 3: Aditivos & Masterbatch */}
                        <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600">
                                  <FlaskConical className="w-4 h-4" />
                                </div>
                                <span className="text-xs font-black text-slate-900 dark:text-white uppercase">Aditivos & Masterbatch</span>
                              </div>
                              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                                {previewData.consolidadoCategorias?.aditivos?.itemsCount || 0} Items
                              </span>
                            </div>
                            <div className="mt-2">
                              <span className="text-2xl font-black text-slate-900 dark:text-white">
                                {(previewData.consolidadoCategorias?.aditivos?.totalKg || 0).toLocaleString()}
                              </span>
                              <span className="text-xs font-bold text-slate-400 ml-1">KG</span>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-1">Deslizante y pigmentos colorantes</p>
                          </div>

                          <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60 space-y-1">
                            {previewData.consolidadoCategorias?.aditivos?.desglose?.slice(0, 5).map((ad: any) => (
                              <div key={ad.id} className="flex justify-between items-center text-[10px]">
                                <span className="text-slate-600 dark:text-slate-300 font-bold truncate max-w-[120px] capitalize">{ad.nombre}</span>
                                <span className="font-black text-slate-900 dark:text-white">{ad.cantidad.toLocaleString()} kg</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Bloque 4: Producto Terminado */}
                        <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600">
                                  <Archive className="w-4 h-4" />
                                </div>
                                <span className="text-xs font-black text-slate-900 dark:text-white uppercase">Producto Terminado</span>
                              </div>
                              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                Despacho
                              </span>
                            </div>
                            <div className="mt-2">
                              <span className="text-2xl font-black text-slate-900 dark:text-white">
                                {previewData.consolidadoCategorias?.productoTerminado?.totalKg > 0 
                                  ? `${previewData.consolidadoCategorias.productoTerminado.totalKg.toLocaleString()} KG` 
                                  : `${(previewData.consolidadoCategorias?.productoTerminado?.totalUnidades || 0).toLocaleString()} UND`}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-1">Bolsas y bobinas listas para cliente</p>
                          </div>

                          <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60 space-y-1">
                            <div className="flex justify-between items-center text-[10px]">
                              <span className="text-slate-600 dark:text-slate-300 font-bold">Total Artículos PT:</span>
                              <span className="font-black text-slate-900 dark:text-white">{previewData.consolidadoCategorias?.productoTerminado?.itemsCount || 0}</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px]">
                              <span className="text-slate-600 dark:text-slate-300 font-bold">Estado Despacho:</span>
                              <span className="text-emerald-600 font-bold">Disponible</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* B.2 Tabla de Alertas de Stock Crítico */}
                    <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600">
                            <AlertTriangle className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">
                              Alertas de Stock Crítico y Reposición
                            </h3>
                            <p className="text-[11px] text-slate-500">Artículos con existencia menor o igual al stock mínimo requerido</p>
                          </div>
                        </div>
                        <span className="text-xs font-black text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-3 py-1 rounded-full border border-rose-200 dark:border-rose-900/50">
                          {previewData.alertasStockBajo?.length || 0} Artículos en Alerta
                        </span>
                      </div>

                      {previewData.alertasStockBajo?.length > 0 ? (
                        <div className="rounded-xl border border-rose-200 dark:border-rose-900/40 overflow-hidden bg-white dark:bg-slate-900">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-rose-50/70 dark:bg-rose-950/20 text-[10px] font-black uppercase tracking-wider text-rose-800 dark:text-rose-300 border-b border-rose-100 dark:border-rose-900/40">
                              <tr>
                                <th className="px-4 py-3">Código</th>
                                <th className="px-4 py-3">Artículo / Descripción</th>
                                <th className="px-3 py-3">Categoría</th>
                                <th className="px-4 py-3 text-right">Stock Actual</th>
                                <th className="px-4 py-3 text-right">Stock Mínimo</th>
                                <th className="px-4 py-3 text-right">Déficit</th>
                                <th className="px-4 py-3 text-center">Estado</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-rose-50 dark:divide-rose-950/30">
                              {previewData.alertasStockBajo.map((item: any) => (
                                <tr key={item.id} className="hover:bg-rose-50/30 dark:hover:bg-rose-950/20 transition-colors">
                                  <td className="px-4 py-2.5 font-mono font-bold text-slate-700 dark:text-slate-300">{item.codigo}</td>
                                  <td className="px-4 py-2.5 font-black text-slate-900 dark:text-white">{item.nombre}</td>
                                  <td className="px-3 py-2.5">
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                      {item.categoriaLabel}
                                    </span>
                                  </td>
                                  <td className="px-4 py-2.5 text-right font-black text-rose-600 dark:text-rose-400">
                                    {item.stockActual.toLocaleString()} <span className="text-[10px] text-slate-400">{item.unidad}</span>
                                  </td>
                                  <td className="px-4 py-2.5 text-right font-bold text-slate-600 dark:text-slate-300">
                                    {item.stockMinimo.toLocaleString()} {item.unidad}
                                  </td>
                                  <td className="px-4 py-2.5 text-right font-black text-rose-600 dark:text-rose-400">
                                    -{item.diferencia.toLocaleString()} {item.unidad}
                                  </td>
                                  <td className="px-4 py-2.5 text-center">
                                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase border ${
                                      item.stockActual <= 0 
                                        ? 'bg-rose-600 text-white border-rose-600' 
                                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                                    }`}>
                                      {item.estado}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                          <p className="text-xs font-bold">Todos los artículos se encuentran con existencias por encima de sus límites mínimos de seguridad.</p>
                        </div>
                      )}
                    </div>

                    {/* B.3 Kardex del Período (Entradas vs Salidas) */}
                    <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                        <div>
                          <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">
                            Kardex del Período (Entradas vs Salidas)
                          </h3>
                          <p className="text-[11px] text-slate-500">Historial cronológico de transacciones registradas</p>
                        </div>

                        {/* Buscador y Filtro de Kardex */}
                        <div className="flex items-center gap-2">
                          <div className="flex items-center bg-white dark:bg-slate-900 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 text-[10px] font-bold">
                            {(['TODOS', 'Entrada', 'Salida'] as const).map(tipo => (
                              <button
                                key={tipo}
                                onClick={() => { setKardexTipo(tipo); setKardexPage(1); }}
                                className={`px-2.5 py-1 rounded-lg transition-all ${
                                  kardexTipo === tipo 
                                    ? 'bg-indigo-600 text-white font-black' 
                                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                                }`}
                              >
                                {tipo}
                              </button>
                            ))}
                          </div>

                          <div className="relative">
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              placeholder="Buscar artículo, motivo..."
                              value={kardexSearch}
                              onChange={(e) => { setKardexSearch(e.target.value); setKardexPage(1); }}
                              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-48"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Mini Balance Kardex */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-emerald-100 dark:border-emerald-950/40 flex items-center justify-between">
                          <div>
                            <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest block">Kilos Entrantes (+)</span>
                            <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                              +{(previewData.kardex?.kilosEntrantes || 0).toLocaleString()} <span className="text-xs font-bold text-slate-400">KG</span>
                            </div>
                          </div>
                          <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
                            <ArrowDownLeft className="w-5 h-5" />
                          </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-rose-100 dark:border-rose-950/40 flex items-center justify-between">
                          <div>
                            <span className="text-[9px] font-black text-rose-600 uppercase tracking-widest block">Kilos Salientes (-)</span>
                            <div className="text-lg font-black text-rose-600 dark:text-rose-400 mt-0.5">
                              -{(previewData.kardex?.kilosSalientes || 0).toLocaleString()} <span className="text-xs font-bold text-slate-400">KG</span>
                            </div>
                          </div>
                          <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600">
                            <ArrowUpRight className="w-5 h-5" />
                          </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                          <div>
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Balance Neto</span>
                            <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                              {(previewData.kardex?.balanceNeto || 0).toLocaleString()} <span className="text-xs font-bold text-slate-400">KG</span>
                            </div>
                          </div>
                          <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600">
                            <TrendingUp className="w-5 h-5" />
                          </div>
                        </div>
                      </div>

                      {/* Tabla Paginada de Movimientos */}
                      {(() => {
                        const movList = previewData.kardex?.movimientos || [];
                        const filtered = movList.filter((m: any) => {
                          if (kardexTipo !== 'TODOS' && m.tipo !== kardexTipo) return false;
                          if (!kardexSearch) return true;
                          const q = kardexSearch.toLowerCase();
                          return (
                            m.articulo?.toLowerCase().includes(q) ||
                            m.codigo?.toLowerCase().includes(q) ||
                            m.concepto?.toLowerCase().includes(q) ||
                            m.responsable?.toLowerCase().includes(q) ||
                            m.categoriaLabel?.toLowerCase().includes(q)
                          );
                        });

                        const totalPages = Math.ceil(filtered.length / kardexPorPagina) || 1;
                        const currentPage = Math.min(kardexPage, totalPages);
                        const paginated = filtered.slice((currentPage - 1) * kardexPorPagina, currentPage * kardexPorPagina);

                        return (
                          <div>
                            <div className="rounded-xl border border-slate-200 dark:border-slate-700/60 overflow-hidden bg-white dark:bg-slate-900">
                              <table className="w-full text-left text-xs">
                                <thead className="bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-500 border-b border-slate-200 dark:border-slate-700/60">
                                  <tr>
                                    <th className="px-4 py-3">Fecha</th>
                                    <th className="px-4 py-3">Artículo</th>
                                    <th className="px-3 py-3">Código</th>
                                    <th className="px-3 py-3 text-center">Tipo</th>
                                    <th className="px-4 py-3 text-right">Cantidad</th>
                                    <th className="px-4 py-3">Concepto / Referencia</th>
                                    <th className="px-4 py-3">Responsable</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                  {paginated.length > 0 ? (
                                    paginated.map((m: any) => (
                                      <tr key={m.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                                        <td className="px-4 py-2.5 font-bold text-slate-600 dark:text-slate-400 whitespace-nowrap">{m.fechaFormatted || m.fecha}</td>
                                        <td className="px-4 py-2.5 font-black text-slate-900 dark:text-white">{m.articulo}</td>
                                        <td className="px-3 py-2.5 font-mono text-[11px] text-slate-500">{m.codigo}</td>
                                        <td className="px-3 py-2.5 text-center">
                                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase ${
                                            m.tipo === 'Entrada' 
                                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' 
                                              : m.tipo === 'Salida'
                                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                          }`}>
                                            {m.tipo}
                                          </span>
                                        </td>
                                        <td className="px-4 py-2.5 text-right font-black text-slate-900 dark:text-white">
                                          {m.tipo === 'Entrada' ? '+' : m.tipo === 'Salida' ? '-' : ''}{m.cantidad.toLocaleString()} <span className="text-[10px] text-slate-400">{m.unidad}</span>
                                        </td>
                                        <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300">{m.concepto || '-'}</td>
                                        <td className="px-4 py-2.5 text-slate-500 font-medium">{m.responsable}</td>
                                      </tr>
                                    ))
                                  ) : (
                                    <tr>
                                      <td colSpan={7} className="px-4 py-8 text-center text-slate-400 text-xs">
                                        No se encontraron movimientos registrados en este período.
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>

                            {/* Paginador Kardex */}
                            {totalPages > 1 && (
                              <div className="flex items-center justify-between mt-3 px-1">
                                <span className="text-[10px] font-bold text-slate-400">
                                  Mostrando {(currentPage - 1) * kardexPorPagina + 1} - {Math.min(currentPage * kardexPorPagina, filtered.length)} de {filtered.length} movimientos
                                </span>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => setKardexPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage <= 1}
                                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-white dark:hover:bg-slate-800 transition-colors"
                                  >
                                    <ChevronLeft className="w-4 h-4" />
                                  </button>
                                  <span className="font-bold text-slate-700 dark:text-slate-300 text-xs">
                                    {currentPage} / {totalPages}
                                  </span>
                                  <button
                                    onClick={() => setKardexPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage >= totalPages}
                                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-white dark:hover:bg-slate-800 transition-colors"
                                  >
                                    <ChevronRight className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>

                    {/* B.4 Catálogo Completo de Existencias */}
                    <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                        <div>
                          <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">
                            Catálogo Completo de Existencias (Auditoría de Almacén)
                          </h3>
                          <p className="text-[11px] text-slate-500">Listado íntegro de artículos y stocks físicos registrados</p>
                        </div>

                        {/* Filtros de Categoría y Buscador */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="flex items-center bg-white dark:bg-slate-900 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 text-[10px] font-bold overflow-x-auto">
                            {[
                              { id: 'TODAS', label: 'Todas' },
                              { id: 'MateriaPrima', label: 'Materia Prima' },
                              { id: 'Peletizado', label: 'Peletizado' },
                              { id: 'Aditivo', label: 'Aditivos' },
                              { id: 'ProductoTerminado', label: 'Terminados' },
                            ].map(tab => (
                              <button
                                key={tab.id}
                                onClick={() => { setInvTab(tab.id as any); setInvPage(1); }}
                                className={`px-2.5 py-1 rounded-lg transition-all whitespace-nowrap ${
                                  invTab === tab.id 
                                    ? 'bg-indigo-600 text-white font-black' 
                                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                                }`}
                              >
                                {tab.label}
                              </button>
                            ))}
                          </div>

                          <div className="relative">
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              placeholder="Filtrar catálogo..."
                              value={invSearch}
                              onChange={(e) => { setInvSearch(e.target.value); setInvPage(1); }}
                              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-40"
                            />
                          </div>
                        </div>
                      </div>

                      {(() => {
                        const items = previewData.inventarios || [];
                        const filtered = items.filter((i: any) => {
                          if (invTab !== 'TODAS' && i.categoria !== invTab) return false;
                          if (!invSearch) return true;
                          const q = invSearch.toLowerCase();
                          return (
                            i.nombre?.toLowerCase().includes(q) ||
                            i.codigo?.toLowerCase().includes(q) ||
                            i.categoriaLabel?.toLowerCase().includes(q)
                          );
                        });

                        const totalPages = Math.ceil(filtered.length / invPorPagina) || 1;
                        const currentPage = Math.min(invPage, totalPages);
                        const paginated = filtered.slice((currentPage - 1) * invPorPagina, currentPage * invPorPagina);

                        return (
                          <div>
                            <div className="rounded-xl border border-slate-200 dark:border-slate-700/60 overflow-hidden bg-white dark:bg-slate-900">
                              <table className="w-full text-left text-xs">
                                <thead className="bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-500 border-b border-slate-200 dark:border-slate-700/60">
                                  <tr>
                                    <th className="px-4 py-3">Código</th>
                                    <th className="px-4 py-3">Artículo</th>
                                    <th className="px-3 py-3">Categoría</th>
                                    <th className="px-4 py-3 text-right">Stock Actual</th>
                                    <th className="px-4 py-3 text-right">Stock Mínimo</th>
                                    <th className="px-4 py-3 text-right">Costo Unitario</th>
                                    <th className="px-4 py-3 text-center">Estado</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                  {paginated.length > 0 ? (
                                    paginated.map((i: any) => (
                                      <tr key={i.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                                        <td className="px-4 py-2.5 font-mono font-bold text-slate-700 dark:text-slate-300">{i.codigo}</td>
                                        <td className="px-4 py-2.5 font-black text-slate-900 dark:text-white">{i.nombre}</td>
                                        <td className="px-3 py-2.5">
                                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                            {i.categoriaLabel}
                                          </span>
                                        </td>
                                        <td className="px-4 py-2.5 text-right font-black text-slate-900 dark:text-white">
                                          {i.cantidad.toLocaleString()} <span className="text-[10px] text-slate-400">{i.unidad}</span>
                                        </td>
                                        <td className="px-4 py-2.5 text-right font-bold text-slate-600 dark:text-slate-300">
                                          {i.stockMinimo.toLocaleString()} {i.unidad}
                                        </td>
                                        <td className="px-4 py-2.5 text-right font-bold text-slate-500">
                                          {i.costo ? `$ ${i.costo}` : '-'}
                                        </td>
                                        <td className="px-4 py-2.5 text-center">
                                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                                            i.estadoStock === 'Agotado'
                                              ? 'bg-rose-600 text-white'
                                              : i.estadoStock === 'Stock Bajo'
                                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                          }`}>
                                            {i.estadoStock}
                                          </span>
                                        </td>
                                      </tr>
                                    ))
                                  ) : (
                                    <tr>
                                      <td colSpan={7} className="px-4 py-8 text-center text-slate-400 text-xs">
                                        No se encontraron artículos en este filtro.
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>

                            {totalPages > 1 && (
                              <div className="flex items-center justify-between mt-3 px-1">
                                <span className="text-[10px] font-bold text-slate-400">
                                  Mostrando {(currentPage - 1) * invPorPagina + 1} - {Math.min(currentPage * invPorPagina, filtered.length)} de {filtered.length} artículos
                                </span>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => setInvPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage <= 1}
                                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-white dark:hover:bg-slate-800 transition-colors"
                                  >
                                    <ChevronLeft className="w-4 h-4" />
                                  </button>
                                  <span className="font-bold text-slate-700 dark:text-slate-300 text-xs">
                                    {currentPage} / {totalPages}
                                  </span>
                                  <button
                                    onClick={() => setInvPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage >= totalPages}
                                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-white dark:hover:bg-slate-800 transition-colors"
                                  >
                                    <ChevronRight className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* Tabla de Resultados (Solo Ventas) */}
                {tipoReporte === 'ventas' && previewData.porCliente && (
                  <div className="rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 dark:bg-slate-800/50">
                        <tr>
                          <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Cliente</th>
                          <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-500">Facturas</th>
                          <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-500">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {previewData.porCliente?.slice(0, 10).map((item: any, i: number) => (
                          <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="px-6 py-4 text-xs font-bold text-slate-900 dark:text-slate-200 uppercase tracking-tight">{item.cliente}</td>
                            <td className="px-6 py-4 text-right text-xs font-bold text-slate-500">{item.facturas}</td>
                            <td className="px-6 py-4 text-right text-sm font-black text-emerald-600 dark:text-emerald-400">Bs. {item.total.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </motion.div>
            ) : (
              <div className="flex flex-col items-center justify-center py-32 text-center">
                <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 text-slate-200">
                  <BarChart3 className="w-10 h-10" />
                </div>
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Esperando Datos</h3>
                <p className="text-xs text-slate-400 mt-2 max-w-[240px]">Selecciona los filtros y genera una vista previa para visualizar el análisis.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
