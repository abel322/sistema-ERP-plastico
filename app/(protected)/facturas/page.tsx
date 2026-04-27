'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { FileText, Plus, Eye, Trash2, DollarSign, CheckCircle, XCircle, Clock, Truck, Package, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface Factura {
  id: string;
  numero: string;
  fecha: string;
  fechaVencimiento: string | null;
  subtotal: number;
  iva: number;
  total: number;
  estado: string;
  metodoPago: string | null;
  cliente: {
    id: string;
    nombre: string;
    rif: string;
  };
}

interface DespachoPendiente {
  id: string;
  fecha: string;
  entregadoAt: string;
  cantidadDespachada: number;
  unidad: string;
  precioUnitario: number | null;
  valorTotal: number | null;
  cliente: {
    id: string;
    nombre: string;
    rif: string;
  };
  productoTerminado: {
    descripcion: string | null;
    tipoProducto: string;
  } | null;
}

const estadoConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  Borrador: { label: 'Borrador', color: 'bg-gray-100 text-gray-800', icon: <Clock className="h-4 w-4" /> },
  Emitida: { label: 'Emitida', color: 'bg-blue-100 text-blue-800', icon: <FileText className="h-4 w-4" /> },
  Pagada: { label: 'Pagada', color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-4 w-4" /> },
  Anulada: { label: 'Anulada', color: 'bg-red-100 text-red-800', icon: <XCircle className="h-4 w-4" /> }
};

export default function FacturasPage() {
  const { data: session } = useSession() || {};
  const [activeTab, setActiveTab] = useState<'facturas' | 'pendientes'>('facturas');
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [despachosPendientes, setDespachosPendientes] = useState<DespachoPendiente[]>([]);
  const [loading, setLoading] = useState(true);
  const [estado, setEstado] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Estados del modal de tipo de documento
  const [showModalTipoDoc, setShowModalTipoDoc] = useState(false);
  const [despachoSeleccionado, setDespachoSeleccionado] = useState<DespachoPendiente | null>(null);
  const [procesandoFactura, setProcesandoFactura] = useState(false);

  // Estados del modal de eliminar
  const [showModalEliminar, setShowModalEliminar] = useState(false);
  const [facturaAEliminar, setFacturaAEliminar] = useState<string | null>(null);
  const [passwordEliminar, setPasswordEliminar] = useState('');
  const [errorPassword, setErrorPassword] = useState('');
  const [procesandoEliminar, setProcesandoEliminar] = useState(false);

  const isAdmin = (session?.user as { rol?: string })?.rol === 'admin';

  useEffect(() => {
    if (activeTab === 'facturas') {
      fetchFacturas();
    } else {
      fetchDespachosPendientes();
    }
  }, [activeTab, estado, fechaInicio, fechaFin, page]);

  const fetchFacturas = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (estado) params.set('estado', estado);
      if (fechaInicio) params.set('fechaInicio', fechaInicio);
      if (fechaFin) params.set('fechaFin', fechaFin);
      params.set('page', page.toString());

      const res = await fetch(`/api/facturas?${params}`);
      const data = await res.json();
      setFacturas(data.facturas || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDespachosPendientes = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (fechaInicio) params.set('fechaInicio', fechaInicio);
      if (fechaFin) params.set('fechaFin', fechaFin);
      params.set('page', page.toString());

      const res = await fetch(`/api/despachos/pendientes-facturar?${params}`);
      const data = await res.json();
      setDespachosPendientes(data.data || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEstadoChange = async (id: string, nuevoEstado: string) => {
    try {
      await fetch(`/api/facturas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado })
      });
      fetchFacturas();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleAbrirModalEliminar = (id: string) => {
    setFacturaAEliminar(id);
    setPasswordEliminar('');
    setErrorPassword('');
    setShowModalEliminar(true);
  };

  const handleEliminarFactura = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!facturaAEliminar) return;

    setErrorPassword('');
    setProcesandoEliminar(true);

    try {
      const res = await fetch(`/api/facturas/${facturaAEliminar}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordEliminar })
      });

      if (res.ok) {
        alert('Factura eliminada exitosamente');
        setShowModalEliminar(false);
        setFacturaAEliminar(null);
        setPasswordEliminar('');
        fetchFacturas();
      } else {
        const error = await res.json();
        setErrorPassword(error.error || 'Error al eliminar factura');
      }
    } catch (error) {
      console.error('Error:', error);
      setErrorPassword('Error al eliminar factura');
    } finally {
      setProcesandoEliminar(false);
    }
  };

  const handleAbrirModalFacturar = (despacho: DespachoPendiente) => {
    setDespachoSeleccionado(despacho);
    setShowModalTipoDoc(true);
  };

  const handleFacturarDespacho = async (tipoDocumento: 'factura' | 'nota') => {
    if (!despachoSeleccionado) return;

    setProcesandoFactura(true);
    try {
      const descripcion = despachoSeleccionado.productoTerminado?.descripcion || 
        `${despachoSeleccionado.productoTerminado?.tipoProducto || 'Producto'} - Despacho`;
      
      const precioUnitario = despachoSeleccionado.precioUnitario || 0;
      const ivaRate = tipoDocumento === 'factura' ? 16 : 0;
      
      const res = await fetch('/api/facturas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clienteId: despachoSeleccionado.cliente.id,
          iva: ivaRate,
          observaciones: tipoDocumento === 'nota' ? 'Nota de Entrega (Sin IVA)' : null,
          detalles: [{
            despachoId: despachoSeleccionado.id,
            descripcion,
            cantidad: despachoSeleccionado.cantidadDespachada,
            unidad: despachoSeleccionado.unidad,
            precioUnitario
          }]
        })
      });

      if (res.ok) {
        alert(`${tipoDocumento === 'factura' ? 'Factura' : 'Nota de Entrega'} creada exitosamente`);
        setShowModalTipoDoc(false);
        setDespachoSeleccionado(null);
        fetchDespachosPendientes();
      } else {
        const error = await res.json();
        alert(error.error || 'Error al crear documento');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al crear documento');
    } finally {
      setProcesandoFactura(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-VE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Facturación</h1>
          <p className="text-sm text-gray-600 sm:text-base">Gestión de facturas y cobros</p>
        </div>
        <Link
          href="/facturas/nueva"
          className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Nueva Factura
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex bg-white shadow-sm p-1 rounded-xl w-full border border-gray-100 mb-4 sm:w-fit overflow-x-auto">
        <button
          onClick={() => { setActiveTab('facturas'); setPage(1); }}
          className={`px-5 py-2 text-sm font-medium rounded-lg transition-all ${
            activeTab === 'facturas'
              ? 'bg-blue-50 text-blue-700 shadow-sm'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Facturas
          </div>
        </button>
        <button
          onClick={() => { setActiveTab('pendientes'); setPage(1); }}
          className={`px-5 py-2 text-sm font-medium rounded-lg transition-all ${
            activeTab === 'pendientes'
              ? 'bg-blue-50 text-blue-700 shadow-sm'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Despachos por Facturar
          </div>
        </button>
      </div>

      {/* Filtros */}
      <div className="rounded-lg bg-white p-4 shadow-md">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {activeTab === 'facturas' && (
            <select
              value={estado}
              onChange={(e) => { setEstado(e.target.value); setPage(1); }}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="">Todos los estados</option>
              <option value="Borrador">Borrador</option>
              <option value="Emitida">Emitida</option>
              <option value="Pagada">Pagada</option>
              <option value="Anulada">Anulada</option>
            </select>
          )}
          <input
            type="date"
            value={fechaInicio}
            onChange={(e) => { setFechaInicio(e.target.value); setPage(1); }}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            placeholder="Desde"
          />
          <input
            type="date"
            value={fechaFin}
            onChange={(e) => { setFechaFin(e.target.value); setPage(1); }}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            placeholder="Hasta"
          />
        </div>
      </div>

      {/* Contenido */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : activeTab === 'facturas' ? (
        /* Vista de Facturas */
        facturas.length === 0 ? (
          <div className="rounded-lg bg-white p-8 text-center shadow-md">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 text-gray-600">No hay facturas registradas</p>
          </div>
        ) : (
          <>
            {/* Vista móvil */}
            <div className="space-y-3 lg:hidden">
              {facturas.map((factura, index) => (
                <motion.div
                  key={factura.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="rounded-lg bg-white p-4 shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{factura.numero}</h3>
                      <p className="text-sm text-gray-500">{factura.cliente.nombre}</p>
                    </div>
                    <span className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${estadoConfig[factura.estado]?.color}`}>
                      {estadoConfig[factura.estado]?.icon}
                      {estadoConfig[factura.estado]?.label}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Fecha:</span>
                      <span className="ml-1 text-gray-900">{formatDate(factura.fecha)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Total:</span>
                      <span className="ml-1 font-semibold text-gray-900">{formatCurrency(factura.total)}</span>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link
                      href={`/facturas/${factura.id}`}
                      className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-gray-50 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
                    >
                      <Eye className="h-4 w-4" /> Ver
                    </Link>
                    {factura.estado === 'Borrador' && (
                      <button
                        onClick={() => handleEstadoChange(factura.id, 'Emitida')}
                        className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-100"
                      >
                        <FileText className="h-4 w-4" /> Emitir
                      </button>
                    )}
                    {factura.estado === 'Emitida' && (
                      <button
                        onClick={() => handleEstadoChange(factura.id, 'Pagada')}
                        className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-green-50 px-3 py-2 text-sm font-medium text-green-600 hover:bg-green-100"
                      >
                        <DollarSign className="h-4 w-4" /> Pagada
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        onClick={() => handleAbrirModalEliminar(factura.id)}
                        className="flex items-center justify-center gap-1 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100"
                      >
                        <Trash2 className="h-4 w-4" /> Eliminar
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Vista desktop */}
            <div className="hidden lg:block">
              <div className="overflow-x-auto rounded-lg bg-white shadow-md">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Número</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Cliente</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Fecha</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Subtotal</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">IVA</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Total</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Estado</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {facturas.map((factura) => (
                      <tr key={factura.id} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">{factura.numero}</td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-900">{factura.cliente.nombre}</p>
                          <p className="text-xs text-gray-500">{factura.cliente.rif}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{formatDate(factura.fecha)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{formatCurrency(factura.subtotal)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{formatCurrency(factura.iva)}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900">{formatCurrency(factura.total)}</td>
                        <td className="px-4 py-3">
                          <span className={`flex w-fit items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${estadoConfig[factura.estado]?.color}`}>
                            {estadoConfig[factura.estado]?.icon}
                            {estadoConfig[factura.estado]?.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <Link
                              href={`/facturas/${factura.id}`}
                              className="rounded p-1 text-gray-600 hover:bg-gray-100"
                              title="Ver"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                            {factura.estado === 'Borrador' && (
                              <button
                                onClick={() => handleEstadoChange(factura.id, 'Emitida')}
                                className="rounded p-1 text-blue-600 hover:bg-blue-50"
                                title="Emitir"
                              >
                                <FileText className="h-4 w-4" />
                              </button>
                            )}
                            {factura.estado === 'Emitida' && (
                              <>
                                <button
                                  onClick={() => handleEstadoChange(factura.id, 'Pagada')}
                                  className="rounded p-1 text-green-600 hover:bg-green-50"
                                  title="Marcar como pagada"
                                >
                                  <DollarSign className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleEstadoChange(factura.id, 'Anulada')}
                                  className="rounded p-1 text-orange-600 hover:bg-orange-50"
                                  title="Anular"
                                >
                                  <XCircle className="h-4 w-4" />
                                </button>
                              </>
                            )}
                            {isAdmin && (
                              <button
                                onClick={() => handleAbrirModalEliminar(factura.id)}
                                className="rounded p-1 text-red-600 hover:bg-red-50"
                                title="Eliminar"
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
            </div>
          </>
        )
      ) : (
        /* Vista de Despachos Pendientes */
        despachosPendientes.length === 0 ? (
          <div className="rounded-lg bg-white p-8 text-center shadow-md">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 text-gray-600">No hay despachos pendientes de facturar</p>
          </div>
        ) : (
          <>
            {/* Vista móvil */}
            <div className="space-y-3 lg:hidden">
              {despachosPendientes.map((despacho, index) => (
                <motion.div
                  key={despacho.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="rounded-lg bg-white p-4 shadow-md border-l-4 border-orange-500"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{despacho.cliente.nombre}</h3>
                      <p className="text-xs text-gray-500">{despacho.cliente.rif}</p>
                    </div>
                    <span className="rounded-full bg-orange-100 px-2 py-1 text-xs font-medium text-orange-800">
                      Pendiente
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    <div>
                      <span className="text-gray-500">Entregado:</span>
                      <p className="font-medium">{formatDate(despacho.entregadoAt)}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Cantidad:</span>
                      <p className="font-medium">{despacho.cantidadDespachada} {despacho.unidad}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Precio Unit.:</span>
                      <p className="font-medium">{formatCurrency(despacho.precioUnitario || 0)}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Total:</span>
                      <p className="font-semibold text-blue-600">{formatCurrency(despacho.valorTotal || 0)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAbrirModalFacturar(despacho)}
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    <FileText className="h-4 w-4" />
                    Generar Factura
                  </button>
                </motion.div>
              ))}
            </div>

            {/* Vista desktop */}
            <div className="hidden lg:block">
              <div className="overflow-x-auto rounded-lg bg-white shadow-md">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Fecha Entrega</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Cliente</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Producto</th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Cantidad</th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Precio Unit.</th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Total</th>
                      <th className="px-4 py-3 text-center text-xs font-medium uppercase text-gray-500">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {despachosPendientes.map((despacho) => (
                      <tr key={despacho.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-600">{formatDate(despacho.entregadoAt)}</td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-900">{despacho.cliente.nombre}</p>
                          <p className="text-xs text-gray-500">{despacho.cliente.rif}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {despacho.productoTerminado?.descripcion || despacho.productoTerminado?.tipoProducto || '-'}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-gray-900">
                          {despacho.cantidadDespachada} {despacho.unidad}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-gray-600">
                          {formatCurrency(despacho.precioUnitario || 0)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-semibold text-blue-600">
                          {formatCurrency(despacho.valorTotal || 0)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleAbrirModalFacturar(despacho)}
                            className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                          >
                            <FileText className="h-3 w-3" />
                            Facturar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )
      )}

      {/* Modal de Tipo de Documento */}
      <AnimatePresence>
        {showModalTipoDoc && despachoSeleccionado && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            onClick={() => !procesandoFactura && setShowModalTipoDoc(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-blue-100 p-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Tipo de Documento</h3>
                    <p className="text-xs text-gray-500">Seleccione el tipo de documento a generar</p>
                  </div>
                </div>
                <button
                  onClick={() => !procesandoFactura && setShowModalTipoDoc(false)}
                  disabled={procesandoFactura}
                  className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6">
                {/* Información del Despacho */}
                <div className="mb-6 rounded-lg bg-gray-50 p-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Despacho a facturar:</p>
                  <div className="space-y-1 text-sm">
                    <p className="text-gray-900">
                      <span className="font-semibold">Cliente:</span> {despachoSeleccionado.cliente.nombre}
                    </p>
                    <p className="text-gray-900">
                      <span className="font-semibold">Cantidad:</span> {despachoSeleccionado.cantidadDespachada} {despachoSeleccionado.unidad}
                    </p>
                    <p className="text-gray-900">
                      <span className="font-semibold">Total:</span> {formatCurrency(despachoSeleccionado.valorTotal || 0)}
                    </p>
                  </div>
                </div>

                {/* Opciones */}
                <div className="space-y-3">
                  <button
                    onClick={() => handleFacturarDespacho('factura')}
                    disabled={procesandoFactura}
                    className="w-full flex flex-col items-start gap-2 rounded-xl border-2 border-blue-200 bg-blue-50 p-4 text-left transition-all hover:border-blue-400 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      <span className="font-bold text-blue-900">Factura con IVA</span>
                    </div>
                    <p className="text-xs text-blue-700">
                      Se generará una factura con IVA del 16% incluido
                    </p>
                    <div className="mt-1 text-sm font-semibold text-blue-900">
                      Total: {formatCurrency((despachoSeleccionado.valorTotal || 0) * 1.16)}
                    </div>
                  </button>

                  <button
                    onClick={() => handleFacturarDespacho('nota')}
                    disabled={procesandoFactura}
                    className="w-full flex flex-col items-start gap-2 rounded-xl border-2 border-green-200 bg-green-50 p-4 text-left transition-all hover:border-green-400 hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center gap-2">
                      <Truck className="h-5 w-5 text-green-600" />
                      <span className="font-bold text-green-900">Nota de Entrega (Sin IVA)</span>
                    </div>
                    <p className="text-xs text-green-700">
                      Se generará una nota de entrega sin IVA
                    </p>
                    <div className="mt-1 text-sm font-semibold text-green-900">
                      Total: {formatCurrency(despachoSeleccionado.valorTotal || 0)}
                    </div>
                  </button>
                </div>

                {procesandoFactura && (
                  <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-600">
                    <LoadingSpinner />
                    <span>Generando documento...</span>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-gray-200 px-6 py-4">
                <button
                  onClick={() => setShowModalTipoDoc(false)}
                  disabled={procesandoFactura}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Eliminar Factura */}
      <AnimatePresence>
        {showModalEliminar && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            onClick={() => !procesandoEliminar && setShowModalEliminar(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-red-100 p-2">
                    <Trash2 className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Eliminar Factura</h3>
                    <p className="text-xs text-gray-500">Esta acción no se puede deshacer</p>
                  </div>
                </div>
                <button
                  onClick={() => !procesandoEliminar && setShowModalEliminar(false)}
                  disabled={procesandoEliminar}
                  className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Body */}
              <form onSubmit={handleEliminarFactura} className="p-6">
                <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4">
                  <p className="text-sm font-medium text-red-800 mb-2">
                    ⚠️ Advertencia
                  </p>
                  <p className="text-sm text-red-700">
                    Está a punto de eliminar esta factura permanentemente. Esta acción no se puede revertir.
                  </p>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contraseña de Acción <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={passwordEliminar}
                    onChange={(e) => {
                      setPasswordEliminar(e.target.value);
                      setErrorPassword('');
                    }}
                    placeholder="Ingrese su contraseña de acción"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                    required
                    disabled={procesandoEliminar}
                    autoFocus
                  />
                  {errorPassword && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <XCircle className="h-4 w-4" />
                      {errorPassword}
                    </p>
                  )}
                </div>

                {procesandoEliminar && (
                  <div className="mb-4 flex items-center justify-center gap-2 text-sm text-gray-600">
                    <LoadingSpinner />
                    <span>Eliminando factura...</span>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModalEliminar(false)}
                    disabled={procesandoEliminar}
                    className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={procesandoEliminar || !passwordEliminar}
                    className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Eliminar Factura
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:opacity-50"
          >
            Anterior
          </button>
          <span className="text-sm text-gray-600">
            Página {page} de {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}
