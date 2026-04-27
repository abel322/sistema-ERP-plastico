'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, FileText, DollarSign, XCircle, Printer, CheckCircle, Clock } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useSession } from 'next-auth/react';

interface DetalleFactura {
  id: string;
  descripcion: string;
  cantidad: number;
  unidad: string;
  precioUnitario: number;
  subtotal: number;
}

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
  observaciones: string | null;
  pagadaAt: string | null;
  cliente: {
    id: string;
    nombre: string;
    rif: string;
    direccion: string | null;
    telefono: string | null;
    email: string | null;
  };
  detalles: DetalleFactura[];
}

const estadoConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  Borrador: { label: 'Borrador', color: 'bg-gray-100 text-gray-800', icon: <Clock className="h-5 w-5" /> },
  Emitida: { label: 'Emitida', color: 'bg-blue-100 text-blue-800', icon: <FileText className="h-5 w-5" /> },
  Pagada: { label: 'Pagada', color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-5 w-5" /> },
  Anulada: { label: 'Anulada', color: 'bg-red-100 text-red-800', icon: <XCircle className="h-5 w-5" /> }
};

export default function VerFacturaPage() {
  const { data: session } = useSession() || {};
  const params = useParams();
  const router = useRouter();
  const [factura, setFactura] = useState<Factura | null>(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = (session?.user as { rol?: string })?.rol === 'admin';

  useEffect(() => {
    const fetchFactura = async () => {
      try {
        const res = await fetch(`/api/facturas/${params.id}`);
        if (!res.ok) throw new Error('Factura no encontrada');
        const data = await res.json();
        setFactura(data);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchFactura();
  }, [params.id]);

  const handleEstadoChange = async (nuevoEstado: string) => {
    try {
      await fetch(`/api/facturas/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado })
      });
      const res = await fetch(`/api/facturas/${params.id}`);
      const data = await res.json();
      setFactura(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'USD' }).format(amount);
  };

  if (loading) {
    return (
      <>
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      </>
    );
  }

  if (!factura) {
    return (
      <>
        <div className="text-center py-12">
          <p className="text-gray-600">Factura no encontrada</p>
          <Link href="/facturas" className="mt-4 text-blue-600 hover:underline">Volver a facturas</Link>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Link href="/facturas" className="rounded-lg p-2 hover:bg-gray-100">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Factura {factura.numero}</h1>
              <p className="text-sm text-gray-600">Emitida el {new Date(factura.fecha).toLocaleDateString('es-VE')}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {factura.estado === 'Borrador' && (
              <button
                onClick={() => handleEstadoChange('Emitida')}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                <FileText className="h-4 w-4" /> Emitir Factura
              </button>
            )}
            {factura.estado === 'Emitida' && (
              <>
                <button
                  onClick={() => handleEstadoChange('Pagada')}
                  className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                >
                  <DollarSign className="h-4 w-4" /> Marcar Pagada
                </button>
                {isAdmin && (
                  <button
                    onClick={() => handleEstadoChange('Anulada')}
                    className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                  >
                    <XCircle className="h-4 w-4" /> Anular
                  </button>
                )}
              </>
            )}
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Printer className="h-4 w-4" /> Imprimir
            </button>
          </div>
        </div>

        {/* Estado */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-center gap-3 rounded-lg p-4 ${estadoConfig[factura.estado]?.color}`}
        >
          {estadoConfig[factura.estado]?.icon}
          <span className="font-medium">Estado: {estadoConfig[factura.estado]?.label}</span>
          {factura.pagadaAt && (
            <span className="ml-auto text-sm">
              Pagada el {new Date(factura.pagadaAt).toLocaleDateString('es-VE')}
            </span>
          )}
        </motion.div>

        {/* Datos del cliente y factura */}
        <div className="grid gap-6 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-lg bg-white p-6 shadow-md"
          >
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Datos del Cliente</h2>
            <div className="space-y-2">
              <p className="font-medium text-gray-900">{factura.cliente.nombre}</p>
              <p className="text-sm text-gray-600">RIF: {factura.cliente.rif}</p>
              {factura.cliente.direccion && (
                <p className="text-sm text-gray-600">{factura.cliente.direccion}</p>
              )}
              {factura.cliente.telefono && (
                <p className="text-sm text-gray-600">Tel: {factura.cliente.telefono}</p>
              )}
              {factura.cliente.email && (
                <p className="text-sm text-gray-600">{factura.cliente.email}</p>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-lg bg-white p-6 shadow-md"
          >
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Detalles de la Factura</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Número:</span>
                <span className="font-medium">{factura.numero}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Fecha:</span>
                <span>{new Date(factura.fecha).toLocaleDateString('es-VE')}</span>
              </div>
              {factura.fechaVencimiento && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Vencimiento:</span>
                  <span>{new Date(factura.fechaVencimiento).toLocaleDateString('es-VE')}</span>
                </div>
              )}
              {factura.metodoPago && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Método de pago:</span>
                  <span>{factura.metodoPago}</span>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Detalles de productos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg bg-white p-6 shadow-md"
        >
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Productos / Servicios</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Descripción</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Cantidad</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Unidad</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">P. Unit.</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {factura.detalles.map((detalle) => (
                  <tr key={detalle.id}>
                    <td className="px-4 py-3 text-sm text-gray-900">{detalle.descripcion}</td>
                    <td className="px-4 py-3 text-right text-sm text-gray-600">{detalle.cantidad}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{detalle.unidad}</td>
                    <td className="px-4 py-3 text-right text-sm text-gray-600">{formatCurrency(detalle.precioUnitario)}</td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">{formatCurrency(detalle.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totales */}
          <div className="mt-6 flex flex-col items-end space-y-2 border-t pt-4">
            <div className="flex w-full max-w-xs justify-between">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">{formatCurrency(factura.subtotal)}</span>
            </div>
            <div className="flex w-full max-w-xs justify-between">
              <span className="text-gray-600">IVA:</span>
              <span className="font-medium">{formatCurrency(factura.iva)}</span>
            </div>
            <div className="flex w-full max-w-xs justify-between border-t pt-2">
              <span className="text-xl font-bold">Total:</span>
              <span className="text-xl font-bold text-blue-600">{formatCurrency(factura.total)}</span>
            </div>
          </div>
        </motion.div>

        {/* Observaciones */}
        {factura.observaciones && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg bg-white p-6 shadow-md"
          >
            <h2 className="mb-2 text-lg font-semibold text-gray-900">Observaciones</h2>
            <p className="text-gray-600">{factura.observaciones}</p>
          </motion.div>
        )}
      </div>
    </>
  );
}
