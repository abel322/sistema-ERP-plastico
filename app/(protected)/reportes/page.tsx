'use client';

import { useState } from 'react';
import { FormSelect } from '@/components/forms/form-select';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { FileText, Download, FileSpreadsheet, Calendar, Filter, BarChart3, PieChart, TrendingUp, ChevronRight } from 'lucide-react';
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

  // Cargar clientes al montar o al cambiar a ficha técnica
  useEffect(() => {
    if (tipoReporte === 'ficha-tecnica' && clientes.length === 0) {
      fetch('/api/clientes')
        .then(res => res.json())
        .then(data => setClientes(data))
        .catch(err => console.error(err));
    }
  }, [tipoReporte, clientes.length]);

  // Cargar productos cuando se selecciona un cliente
  useEffect(() => {
    if (clienteId) {
      fetch(`/api/clientes/${clienteId}/productos`)
        .then(res => res.json())
        .then(data => setProductos(data))
        .catch(err => console.error(err));
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
                        {clientes.map(c => (
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
                        {productos.map(p => (
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

                {/* Ficha Técnica Preview */}
                {tipoReporte === 'ficha-tecnica' && (
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{previewData.nombreProducto}</h3>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">{previewData.cliente?.nombre}</p>
                      </div>
                      <div className="text-right">
                        <span className="px-3 py-1 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full">Ficha Técnica</span>
                        <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase">Cod: {previewData.codigoProducto || 'N/A'}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                      <div className="space-y-4">
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Dimensiones</p>
                          <div className="grid grid-cols-2 gap-2">
                            <p className="font-bold text-slate-700 dark:text-slate-300">Ancho: <span className="text-slate-900 dark:text-white">{previewData.ancho || '-'} cm</span></p>
                            <p className="font-bold text-slate-700 dark:text-slate-300">Largo: <span className="text-slate-900 dark:text-white">{previewData.largo || '-'} cm</span></p>
                            <p className="font-bold text-slate-700 dark:text-slate-300">Calibre: <span className="text-slate-900 dark:text-white">{previewData.calibre || '-'} µ</span></p>
                            <p className="font-bold text-slate-700 dark:text-slate-300">Peso: <span className="text-slate-900 dark:text-white">{previewData.pesoPorUnidad || '-'} g</span></p>
                          </div>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Material y Color</p>
                          <div className="grid grid-cols-2 gap-2">
                            <p className="font-bold text-slate-700 dark:text-slate-300">Material: <span className="text-slate-900 dark:text-white">{previewData.material || '-'}</span></p>
                            <p className="font-bold text-slate-700 dark:text-slate-300">Color: <span className="text-slate-900 dark:text-white">{previewData.color || '-'}</span></p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Características</p>
                          <div className="grid grid-cols-2 gap-2">
                            <p className="font-bold text-slate-700 dark:text-slate-300">Impresión: <span className={previewData.conImpresion ? 'text-emerald-600' : 'text-rose-600'}>{previewData.conImpresion ? 'SÍ' : 'NO'}</span></p>
                            <p className="font-bold text-slate-700 dark:text-slate-300">Pigmento: <span className={previewData.conPigmento ? 'text-emerald-600' : 'text-rose-600'}>{previewData.conPigmento ? 'SÍ' : 'NO'}</span></p>
                            <p className="font-bold text-slate-700 dark:text-slate-300">Bolsa ASA: <span className={previewData.esBolsaASA ? 'text-emerald-600' : 'text-rose-600'}>{previewData.esBolsaASA ? 'SÍ' : 'NO'}</span></p>
                            <p className="font-bold text-slate-700 dark:text-slate-300">Activo: <span className={previewData.activo ? 'text-emerald-600' : 'text-rose-600'}>{previewData.activo ? 'SÍ' : 'NO'}</span></p>
                          </div>
                        </div>
                        {previewData.conImpresion && (
                          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Impresión</p>
                            <p className="font-bold text-slate-700 dark:text-slate-300">Tipo: <span className="text-slate-900 dark:text-white">{previewData.tipoImpresion || '-'}</span></p>
                            <p className="font-bold text-slate-700 dark:text-slate-300 mt-1">Cilindro: <span className="text-slate-900 dark:text-white">{previewData.cilindro || '-'}</span></p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-6 flex justify-end">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Generado exitosamente para vista previa</p>
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
