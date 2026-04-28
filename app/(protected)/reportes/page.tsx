'use client';

import { useState } from 'react';
import { FormSelect } from '@/components/forms/form-select';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { FileText, Download, FileSpreadsheet, Calendar, Filter } from 'lucide-react';
import { motion } from 'framer-motion';
import { format, subDays, startOfMonth } from 'date-fns';

const tiposReporte = [
  { value: 'produccion', label: 'Producción', description: 'Reporte detallado de producción por área' },
  { value: 'ventas', label: 'Ventas', description: 'Reporte de facturación y ventas' },
  { value: 'inventario', label: 'Inventario', description: 'Estado actual del inventario' },
];

const periodosRapidos = [
  { value: 'hoy', label: 'Hoy' },
  { value: 'semana', label: 'Última semana' },
  { value: 'mes', label: 'Este mes' },
  { value: 'custom', label: 'Personalizado' },
];

export default function ReportesPage() {
  const [tipoReporte, setTipoReporte] = useState('produccion');
  const [periodo, setPeriodo] = useState('mes');
  const [fechaInicio, setFechaInicio] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [fechaFin, setFechaFin] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);

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
      const res = await fetch('/api/reportes/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo: tipoReporte, fechaInicio, fechaFin }),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte_${tipoReporte}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
        a.click();
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const reporteSeleccionado = tiposReporte.find(t => t.value === tipoReporte);

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Reportes</h1>
          <p className="mt-1 text-sm sm:text-base text-gray-600">Genera reportes profesionales en PDF o Excel</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Panel de configuración */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Filter className="h-5 w-5 text-blue-600" />
              Configuración
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Reporte</label>
                <select
                  value={tipoReporte}
                  onChange={(e) => { setTipoReporte(e.target.value); setPreviewData(null); }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {tiposReporte.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">{reporteSeleccionado?.description}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Período</label>
                <div className="grid grid-cols-2 gap-2">
                  {periodosRapidos.map(p => (
                    <button
                      key={p.value}
                      onClick={() => handlePeriodoChange(p.value)}
                      className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                        periodo === p.value
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {periodo === 'custom' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
                    <input
                      type="date"
                      value={fechaInicio}
                      onChange={(e) => setFechaInicio(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
                    <input
                      type="date"
                      value={fechaFin}
                      onChange={(e) => setFechaFin(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              <button
                onClick={fetchPreview}
                disabled={loading}
                className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Calendar className="h-4 w-4" />
                Vista Previa
              </button>

              <div className="pt-4 border-t border-gray-200 space-y-2">
                <button
                  onClick={downloadPDF}
                  disabled={loading}
                  className="w-full py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Descargar PDF
                </button>
                <button
                  onClick={downloadCSV}
                  disabled={loading}
                  className="w-full py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Descargar CSV
                </button>
              </div>
            </div>
          </motion.div>

          {/* Panel de vista previa */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Vista Previa</h2>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <LoadingSpinner />
              </div>
            ) : previewData ? (
              <div className="space-y-6">
                {/* Totales */}
                {previewData.totales && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(previewData.totales).map(([key, value]: [string, any]) => (
                      <div key={key} className="bg-gray-50 rounded-lg p-4">
                        <div className="text-2xl font-bold text-blue-600">
                          {typeof value === 'number' ? value.toLocaleString() : value}
                        </div>
                        <div className="text-sm text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1')}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Tabla resumen */}
                {(previewData.porArea || previewData.porCliente || previewData.porCategoria) && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          {tipoReporte === 'produccion' && (
                            <><th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Área</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Cantidad</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Merma</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Registros</th></>
                          )}
                          {tipoReporte === 'ventas' && (
                            <><th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Cliente</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Facturas</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Total</th></>
                          )}
                          {tipoReporte === 'inventario' && (
                            <><th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Categoría</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Items</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Valor Total</th></>
                          )}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {tipoReporte === 'produccion' && previewData.porArea?.map((item: any, i: number) => (
                          <tr key={i}>
                            <td className="px-4 py-3 text-sm text-gray-900">{item.area}</td>
                            <td className="px-4 py-3 text-sm text-gray-900 text-right">{item.cantidadProducida.toLocaleString()}</td>
                            <td className="px-4 py-3 text-sm text-gray-900 text-right">{item.merma.toLocaleString()}</td>
                            <td className="px-4 py-3 text-sm text-gray-900 text-right">{item.registros}</td>
                          </tr>
                        ))}
                        {tipoReporte === 'ventas' && previewData.porCliente?.slice(0, 10).map((item: any, i: number) => (
                          <tr key={i}>
                            <td className="px-4 py-3 text-sm text-gray-900">{item.cliente}</td>
                            <td className="px-4 py-3 text-sm text-gray-900 text-right">{item.facturas}</td>
                            <td className="px-4 py-3 text-sm text-gray-900 text-right">Bs. {item.total.toLocaleString()}</td>
                          </tr>
                        ))}
                        {tipoReporte === 'inventario' && previewData.porCategoria?.map((item: any, i: number) => (
                          <tr key={i}>
                            <td className="px-4 py-3 text-sm text-gray-900">{item.categoria}</td>
                            <td className="px-4 py-3 text-sm text-gray-900 text-right">{item.items}</td>
                            <td className="px-4 py-3 text-sm text-gray-900 text-right">Bs. {item.valorTotal.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-20 text-gray-500">
                <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p>Selecciona las opciones y haz clic en "Vista Previa"</p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </>
  );
}
