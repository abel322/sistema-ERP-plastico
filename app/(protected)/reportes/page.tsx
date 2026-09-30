'use client';

import { useState, useEffect } from 'react';
import { FormSelect } from '@/components/forms/form-select';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { 
  FileText, Download, FileSpreadsheet, Calendar, Filter, BarChart3, PieChart, TrendingUp, ChevronRight,
  Layers, Cpu, Flame, Settings, Sparkles, Sun, Moon, CheckCircle2, XCircle, FlaskConical, Wrench
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

  const handlePeriodoChange = (value: string) => {
    setPeriodo(value);
    const today = new Date();
    switch (value) {
      case 'hoy':
        setFechaInicio(format(today, 'yyyy-MM-dd'));
        setFechaFin(format(today, 'yyyy-MM-dd'));
        break;
      case 'semana':
        setFechaInicio(format(subDays(today, 7), 'yyyy-MM-dd'));
        setFechaFin(format(today, 'yyyy-MM-dd'));
        break;
      case 'mes':
        setFechaInicio(format(startOfMonth(today), 'yyyy-MM-dd'));
        setFechaFin(format(today, 'yyyy-MM-dd'));
        break;
    }
  };

  const fetchPreview = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        fechaInicio,
        fechaFin,
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
      const data = await res.json();
      setPreviewData(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
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
                onClick={fetchPreview}
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
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-[0.2em]">Resumen de Datos</h2>
              {previewData && (
                <div className="flex items-center gap-2 px-4 py-1.5 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100 dark:border-indigo-900/50">
                  {fechaInicio} <ChevronRight className="h-3 w-3" /> {fechaFin}
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
                {/* KPIs */}
                {tipoReporte !== 'ficha-tecnica' && previewData.totales && (
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

                {/* Tabla de Resultados */}
                {tipoReporte !== 'ficha-tecnica' && (previewData.porArea || previewData.porCliente || previewData.porCategoria) && (
                  <div className="rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 dark:bg-slate-800/50">
                        <tr>
                          {tipoReporte === 'produccion' && (
                            <>
                              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Área</th>
                              <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-500">Cantidad</th>
                              <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-500">Merma</th>
                              <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-500">Órdenes</th>
                            </>
                          )}
                          {tipoReporte === 'ventas' && (
                            <>
                              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Cliente</th>
                              <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-500">Facturas</th>
                              <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-500">Total</th>
                            </>
                          )}
                          {tipoReporte === 'inventario' && (
                            <>
                              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Categoría</th>
                              <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-500">Items</th>
                              <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-500">Valor Estimado</th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {tipoReporte === 'produccion' && previewData.porArea?.map((item: any, i: number) => (
                          <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="px-6 py-4 text-xs font-bold text-slate-900 dark:text-slate-200 uppercase tracking-tight">{item.area}</td>
                            <td className="px-6 py-4 text-right text-sm font-black text-slate-900 dark:text-white">{item.cantidadProducida.toLocaleString()} <span className="text-[10px] text-slate-400">KG</span></td>
                            <td className="px-6 py-4 text-right text-xs font-bold text-rose-600 dark:text-rose-400">{item.merma.toLocaleString()} <span className="text-[10px] opacity-60">KG</span></td>
                            <td className="px-6 py-4 text-right text-xs font-bold text-slate-500">{item.registros}</td>
                          </tr>
                        ))}
                        {tipoReporte === 'ventas' && previewData.porCliente?.slice(0, 10).map((item: any, i: number) => (
                          <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="px-6 py-4 text-xs font-bold text-slate-900 dark:text-slate-200 uppercase tracking-tight">{item.cliente}</td>
                            <td className="px-6 py-4 text-right text-xs font-bold text-slate-500">{item.facturas}</td>
                            <td className="px-6 py-4 text-right text-sm font-black text-emerald-600 dark:text-emerald-400">Bs. {item.total.toLocaleString()}</td>
                          </tr>
                        ))}
                        {tipoReporte === 'inventario' && previewData.porCategoria?.map((item: any, i: number) => (
                          <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="px-6 py-4 text-xs font-bold text-slate-900 dark:text-slate-200 uppercase tracking-tight">{item.categoria}</td>
                            <td className="px-6 py-4 text-right text-xs font-bold text-slate-500">{item.items}</td>
                            <td className="px-6 py-4 text-right text-sm font-black text-indigo-600 dark:text-indigo-400">Bs. {item.valorTotal.toLocaleString()}</td>
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
