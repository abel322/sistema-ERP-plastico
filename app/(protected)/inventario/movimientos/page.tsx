'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowDownCircle, ArrowUpCircle, RefreshCw, Undo2, Filter } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface Movimiento {
  id: string;
  tipo: string;
  cantidad: number;
  motivo: string | null;
  responsable: string;
  fecha: string;
  inventario: {
    id: string;
    nombre: string;
    codigo: string;
    unidad: string;
  };
}

const tipoIcons: Record<string, React.ReactNode> = {
  Entrada: <ArrowDownCircle className="h-5 w-5 text-green-600" />,
  Salida: <ArrowUpCircle className="h-5 w-5 text-red-600" />,
  Ajuste: <RefreshCw className="h-5 w-5 text-yellow-600" />,
  Devolucion: <Undo2 className="h-5 w-5 text-blue-600" />
};

const tipoLabels: Record<string, string> = {
  Entrada: 'Entrada',
  Salida: 'Salida',
  Ajuste: 'Ajuste',
  Devolucion: 'Devolución'
};

export default function MovimientosPage() {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [tipo, setTipo] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchMovimientos = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (tipo) params.set('tipo', tipo);
      if (fechaInicio) params.set('fechaInicio', fechaInicio);
      if (fechaFin) params.set('fechaFin', fechaFin);
      params.set('page', page.toString());
      params.set('limit', '30');

      const res = await fetch(`/api/inventario/movimientos?${params}`);
      const data = await res.json();
      setMovimientos(data.movimientos || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovimientos();
  }, [tipo, fechaInicio, fechaFin, page]);

  return (
    <>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/inventario" className="rounded-lg p-2 hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Movimientos de Inventario</h1>
            <p className="text-sm text-gray-600 sm:text-base">Historial de entradas, salidas y ajustes</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="rounded-lg bg-white p-4 shadow-md">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <select
              value={tipo}
              onChange={(e) => { setTipo(e.target.value); setPage(1); }}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="">Todos los tipos</option>
              <option value="Entrada">Entrada</option>
              <option value="Salida">Salida</option>
              <option value="Ajuste">Ajuste</option>
              <option value="Devolucion">Devolución</option>
            </select>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => { setFechaInicio(e.target.value); setPage(1); }}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => { setFechaFin(e.target.value); setPage(1); }}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
            <button
              onClick={() => { setTipo(''); setFechaInicio(''); setFechaFin(''); setPage(1); }}
              className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
            >
              <Filter className="h-4 w-4" /> Limpiar
            </button>
          </div>
        </div>

        {/* Contenido */}
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : movimientos.length === 0 ? (
          <div className="rounded-lg bg-white p-8 text-center shadow-md">
            <RefreshCw className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 text-gray-600">No hay movimientos registrados</p>
          </div>
        ) : (
          <>
            {/* Vista móvil */}
            <div className="space-y-3 lg:hidden">
              {movimientos.map((mov, index) => (
                <motion.div
                  key={mov.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="rounded-lg bg-white p-4 shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {tipoIcons[mov.tipo]}
                      <div>
                        <p className="font-semibold text-gray-900">{mov.inventario.nombre}</p>
                        <p className="text-sm text-gray-500">{mov.inventario.codigo}</p>
                      </div>
                    </div>
                    <span className={`text-lg font-bold ${
                      mov.tipo === 'Entrada' || mov.tipo === 'Devolucion' ? 'text-green-600' : 
                      mov.tipo === 'Salida' ? 'text-red-600' : 'text-yellow-600'
                    }`}>
                      {mov.tipo === 'Salida' ? '-' : '+'}{mov.cantidad} {mov.inventario.unidad}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm text-gray-500">
                    <span>{tipoLabels[mov.tipo]}</span>
                    <span>{new Date(mov.fecha).toLocaleDateString('es-VE')}</span>
                  </div>
                  {mov.motivo && (
                    <p className="mt-2 text-sm text-gray-600">{mov.motivo}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-400">Por: {mov.responsable}</p>
                </motion.div>
              ))}
            </div>

            {/* Vista desktop */}
            <div className="hidden lg:block">
              <div className="overflow-x-auto rounded-lg bg-white shadow-md">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Fecha</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Tipo</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Item</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Cantidad</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Motivo</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Responsable</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {movimientos.map((mov) => (
                      <tr key={mov.id} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                          {new Date(mov.fecha).toLocaleDateString('es-VE')}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {tipoIcons[mov.tipo]}
                            <span className="text-sm font-medium">{tipoLabels[mov.tipo]}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Link href={`/inventario/${mov.inventario.id}/editar`} className="hover:text-blue-600">
                            <p className="text-sm font-medium text-gray-900">{mov.inventario.nombre}</p>
                            <p className="text-xs text-gray-500">{mov.inventario.codigo}</p>
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-sm font-semibold ${
                            mov.tipo === 'Entrada' || mov.tipo === 'Devolucion' ? 'text-green-600' : 
                            mov.tipo === 'Salida' ? 'text-red-600' : 'text-yellow-600'
                          }`}>
                            {mov.tipo === 'Salida' ? '-' : '+'}{mov.cantidad} {mov.inventario.unidad}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{mov.motivo || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{mov.responsable}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

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
          </>
        )}
      </div>
    </>
  );
}
