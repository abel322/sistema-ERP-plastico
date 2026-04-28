'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Plus, Trash2, Calculator, Users, Calendar, CreditCard, Percent, Package, Building2, ShoppingBag } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface Cliente {
  id: string;
  nombre: string;
  rif: string;
}

interface Despacho {
  id: string;
  fecha: string;
  cantidadDespachada: number;
  unidad: string;
  pedido: {
    id: string;
    cliente: { nombre: string };
  };
}

interface DetalleForm {
  despachoId?: string;
  descripcion: string;
  cantidad: string;
  unidad: string;
  precioUnitario: string;
}

export default function NuevaFacturaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState('');
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [despachos, setDespachos] = useState<Despacho[]>([]);
  const [clienteId, setClienteId] = useState('');
  const [fechaVencimiento, setFechaVencimiento] = useState('');
  const [metodoPago, setMetodoPago] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [ivaRate, setIvaRate] = useState('16');
  const [detalles, setDetalles] = useState<DetalleForm[]>([{
    descripcion: '',
    cantidad: '',
    unidad: 'Unidades',
    precioUnitario: ''
  }]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientesRes, despachosRes] = await Promise.all([
          fetch('/api/clientes?limit=1000'),
          fetch('/api/despachos?estado=Entregado&limit=50')
        ]);
        const clientesData = await clientesRes.json();
        const despachosData = await despachosRes.json();
        setClientes(clientesData.clientes || []);
        setDespachos(despachosData.despachos || []);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
  }, []);

  const addDetalle = () => {
    setDetalles([...detalles, { descripcion: '', cantidad: '', unidad: 'Unidades', precioUnitario: '' }]);
  };

  const removeDetalle = (index: number) => {
    if (detalles.length > 1) {
      setDetalles(detalles.filter((_, i) => i !== index));
    }
  };

  const updateDetalle = (index: number, field: keyof DetalleForm, value: string) => {
    const newDetalles = [...detalles];
    newDetalles[index][field] = value;
    setDetalles(newDetalles);
  };

  const calcularSubtotal = () => {
    return detalles.reduce((acc, d) => {
      const cant = parseFloat(d.cantidad) || 0;
      const precio = parseFloat(d.precioUnitario) || 0;
      return acc + (cant * precio);
    }, 0);
  };

  const subtotal = calcularSubtotal();
  const iva = subtotal * (parseFloat(ivaRate) / 100);
  const total = subtotal + iva;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!clienteId) {
      setError('Seleccione un cliente');
      return;
    }

    const detallesValidos = detalles.filter(d =>
      d.descripcion && d.cantidad && d.precioUnitario
    );

    if (detallesValidos.length === 0) {
      setError('Agregue al menos un detalle válido');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/facturas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clienteId,
          fechaVencimiento: fechaVencimiento || null,
          metodoPago: metodoPago || null,
          observaciones: observaciones || null,
          iva: parseFloat(ivaRate),
          detalles: detallesValidos.map(d => ({
            despachoId: d.despachoId || null,
            descripcion: d.descripcion,
            cantidad: parseFloat(d.cantidad),
            unidad: d.unidad,
            precioUnitario: parseFloat(d.precioUnitario)
          }))
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al crear factura');
      }

      router.push('/facturas');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear factura');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'USD' }).format(amount);
  };

  if (loadingData) {
    return (
      <>
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      </>
    );
  }

  return (
    <>
      <div className="mx-auto max-w-5xl space-y-6">

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative flex w-full flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">

          {/* Header Moderno */}
          <div className="flex-shrink-0 bg-gradient-to-r from-gray-900 to-gray-800 px-6 py-5 text-white flex justify-between items-center shadow-md">
            <div className="flex items-center gap-4">
              <Link href="/facturas" className="rounded-full bg-white/10 p-2 border border-white/20 hover:bg-white/20 transition-all">
                <ArrowLeft className="h-5 w-5 text-purple-300" />
              </Link>
              <div>
                <h2 className="text-xl font-bold tracking-tight">Nueva Factura</h2>
                <p className="text-xs text-gray-400 mt-0.5">Crear factura de venta o cobro</p>
              </div>
            </div>
            <div className="rounded-full bg-indigo-500/20 px-4 py-1.5 border border-indigo-400/30 flex items-center gap-2">
              <Calculator className="h-4 w-4 text-indigo-300" />
              <span className="text-sm font-semibold text-indigo-100">{formatCurrency(total)}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col bg-gray-50">
            <div className="p-6 sm:p-8 space-y-8">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center gap-2">
                  <div className="w-1.5 h-full bg-red-500 rounded-l-full"></div>{error}
                </div>
              )}

              {/* Datos Generales de la Factura */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-5 border-b border-gray-100 pb-3">
                  <Building2 className="h-5 w-5 text-purple-600" />
                  <h2 className="text-lg font-bold text-gray-900">Datos de la Factura</h2>
                </div>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="sm:col-span-2">
                    <label className="text-xs font-bold tracking-wide text-gray-500 uppercase mb-1.5 block flex items-center gap-2"><Users className="h-3 w-3" /> Cliente <span className="text-red-500">*</span></label>
                    <select required value={clienteId} onChange={(e) => setClienteId(e.target.value)} className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none font-medium text-gray-800">
                      <option value="">Seleccione al Cliente...</option>
                      {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre} (RIF: {c.rif})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold tracking-wide text-gray-500 uppercase mb-1.5 block flex items-center gap-2"><Calendar className="h-3 w-3" /> Fecha Venc.</label>
                    <input type="date" value={fechaVencimiento} onChange={(e) => setFechaVencimiento(e.target.value)} className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none text-gray-800" />
                  </div>
                  <div>
                    <label className="text-xs font-bold tracking-wide text-gray-500 uppercase mb-1.5 block flex items-center gap-2"><CreditCard className="h-3 w-3" /> Método Pago</label>
                    <select value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)} className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none text-gray-800">
                      <option value="">Sin especificar</option>
                      <option value="Efectivo">Efectivo</option>
                      <option value="Transferencia">Transferencia</option>
                      <option value="Credito">Crédito</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Detalles */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-5 border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-3">
                    <ShoppingBag className="h-5 w-5 text-indigo-500" />
                    <h2 className="text-lg font-bold text-gray-900">Líneas de Facturación</h2>
                  </div>
                  <button type="button" onClick={addDetalle} className="flex items-center gap-2 rounded-xl bg-indigo-50 px-4 py-2 text-sm font-bold text-indigo-700 hover:bg-indigo-100 transition-colors border border-indigo-100">
                    <Plus className="h-4 w-4" /> Agregar Ítem
                  </button>
                </div>

                <div className="space-y-4">
                  {detalles.map((detalle, index) => (
                    <div key={index} className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 transition-all hover:border-indigo-200 hover:shadow-sm">
                      <div className="flex items-center justify-between mb-3 lg:hidden">
                        <span className="text-xs font-bold bg-gray-200 text-gray-700 px-2 py-1 rounded-md">Ítem #{index + 1}</span>
                        {detalles.length > 1 && (
                          <button type="button" onClick={() => removeDetalle(index)} className="rounded-lg p-1.5 text-red-500 hover:bg-red-100 transition-colors"><Trash2 className="h-4 w-4" /></button>
                        )}
                      </div>

                      <div className="grid gap-4 lg:grid-cols-12 items-end">
                        <div className="lg:col-span-5">
                          <label className="text-xs font-bold tracking-wide text-gray-500 uppercase mb-1.5 block">Descripción</label>
                          <input required type="text" placeholder="Ej: Bolsas transparentes..." value={detalle.descripcion} onChange={(e) => updateDetalle(index, 'descripcion', e.target.value)} className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none" />
                        </div>
                        <div className="lg:col-span-2">
                          <label className="text-xs font-bold tracking-wide text-gray-500 uppercase mb-1.5 block">Cantidad</label>
                          <input required type="number" step="0.01" min="0" placeholder="0" value={detalle.cantidad} onChange={(e) => updateDetalle(index, 'cantidad', e.target.value)} className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none" />
                        </div>
                        <div className="lg:col-span-2">
                          <label className="text-xs font-bold tracking-wide text-gray-500 uppercase mb-1.5 block">Unidad</label>
                          <select value={detalle.unidad} onChange={(e) => updateDetalle(index, 'unidad', e.target.value)} className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none">
                            <option value="Unidades">Unidades</option>
                            <option value="Kilogramos">Kilogramos</option>
                            <option value="Metros">Metros</option>
                          </select>
                        </div>
                        <div className="lg:col-span-2">
                          <label className="text-xs font-bold tracking-wide text-gray-500 uppercase mb-1.5 block">Precio Unit ($)</label>
                          <input required type="number" step="0.01" min="0" placeholder="0.00" value={detalle.precioUnitario} onChange={(e) => updateDetalle(index, 'precioUnitario', e.target.value)} className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none" />
                        </div>
                        <div className="hidden lg:flex lg:col-span-1 justify-center pb-1">
                          {detalles.length > 1 && (
                            <button type="button" onClick={() => removeDetalle(index)} className="rounded-lg p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Eliminar ítem">
                              <Trash2 className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 flex justify-end gap-2 border-t border-gray-200/60 pt-2">
                        <span className="text-xs text-gray-500 mt-1 font-medium">Subtotal Línea:</span>
                        <span className="text-sm font-bold text-gray-900">{formatCurrency((parseFloat(detalle.cantidad) || 0) * (parseFloat(detalle.precioUnitario) || 0))}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Section: Totals & Observaciones */}
              <div className="grid md:grid-cols-2 gap-6">

                {/* Observaciones */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                  <label className="text-xs font-bold tracking-wide text-gray-500 uppercase mb-3 block">Términos y Observaciones</label>
                  <textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} rows={4} className="w-full rounded-xl bg-gray-50 border border-gray-200 p-4 text-sm focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none resize-none flex-1" placeholder="Información adicional, cuentas bancarias, etc..." />
                </div>

                {/* Totales Card */}
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-2xl shadow-sm border border-indigo-100/50">
                  <h3 className="text-sm font-bold text-indigo-900 mb-4 border-b border-indigo-200 pb-2">Resumen de Importes</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-indigo-800 font-medium">Subtotal</span>
                      <span className="font-semibold text-gray-900">{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-indigo-800 font-medium">IVA / Impuesto</span>
                        <input type="number" min="0" max="100" value={ivaRate} onChange={(e) => setIvaRate(e.target.value)} className="w-16 rounded bg-white px-2 py-0.5 border border-indigo-200 text-xs text-center outline-none focus:border-indigo-500" /> <span className="text-xs text-indigo-600">%</span>
                      </div>
                      <span className="font-semibold text-gray-900">{formatCurrency(iva)}</span>
                    </div>
                    <div className="pt-4 border-t border-indigo-200/60 flex justify-between items-end mt-2">
                      <span className="text-lg font-black text-indigo-950">TOTAL NETO</span>
                      <span className="text-2xl font-black text-indigo-600">{formatCurrency(total)}</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Submit Footer Panel */}
            <div className="flex-shrink-0 border-t border-gray-200 bg-white px-6 py-4 flex justify-between items-center sm:flex-row flex-col gap-3">
              <p className="text-xs text-gray-500 hidden sm:block">Verifique los montos e ítems ingresados antes de facturar.</p>
              <div className="flex gap-3 w-full sm:w-auto">
                <Link href="/facturas" className="flex-1 sm:flex-none text-center px-6 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-900 rounded-xl transition-all shadow-sm">Cancelar</Link>
                <button type="submit" disabled={loading} className="flex-1 sm:flex-none flex justify-center items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 px-8 py-2.5 text-sm font-bold tracking-wide text-white rounded-xl shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 disabled:opacity-60 transition-all">
                  <Save className="h-4 w-4" />
                  {loading ? 'Procesando...' : 'Generar Factura'}
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </>
  );
}
