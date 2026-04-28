'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Wrench, Plus, Edit, Trash2, CheckCircle, PlayCircle, Calendar, AlertTriangle } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface Mantenimiento {
  id: string;
  tipo: string;
  descripcion: string;
  fechaProgramada: string;
  fechaRealizada: string | null;
  responsable: string;
  costo: number | null;
  estado: string;
  observaciones: string | null;
  maquina: {
    id: string;
    nombre: string;
    area: string;
  };
}

const tipoLabels: Record<string, string> = {
  Preventivo: 'Preventivo',
  Correctivo: 'Correctivo',
  Calibracion: 'Calibración'
};

const estadoConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  Programado: { label: 'Programado', color: 'bg-blue-100 text-blue-800', icon: <Calendar className="h-4 w-4" /> },
  EnProceso: { label: 'En Proceso', color: 'bg-yellow-100 text-yellow-800', icon: <PlayCircle className="h-4 w-4" /> },
  Completado: { label: 'Completado', color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-4 w-4" /> },
  Cancelado: { label: 'Cancelado', color: 'bg-red-100 text-red-800', icon: <AlertTriangle className="h-4 w-4" /> }
};

export default function MantenimientosPage() {
  const { data: session } = useSession() || {};
  const [mantenimientos, setMantenimientos] = useState<Mantenimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [estado, setEstado] = useState('');
  const [tipo, setTipo] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const isAdmin = (session?.user as { rol?: string })?.rol === 'admin';

  const fetchMantenimientos = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (estado) params.set('estado', estado);
      if (tipo) params.set('tipo', tipo);
      params.set('page', page.toString());

      const res = await fetch(`/api/mantenimientos?${params}`);
      const data = await res.json();
      setMantenimientos(data.mantenimientos || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMantenimientos();
  }, [estado, tipo, page]);

  const handleEstadoChange = async (id: string, nuevoEstado: string) => {
    try {
      await fetch(`/api/mantenimientos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado })
      });
      fetchMantenimientos();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este mantenimiento?')) return;
    try {
      await fetch(`/api/mantenimientos/${id}`, { method: 'DELETE' });
      fetchMantenimientos();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const isOverdue = (fecha: string, estado: string) => {
    return estado === 'Programado' && new Date(fecha) < new Date();
  };

  return (
    <>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Mantenimiento</h1>
            <p className="text-sm text-gray-600 sm:text-base">Programación y registro de mantenimientos</p>
          </div>
          <Link
            href="/mantenimientos/nuevo"
            className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Programar Mantenimiento
          </Link>
        </div>

        {/* Filtros */}
        <div className="rounded-lg bg-white p-4 shadow-md">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <select
              value={estado}
              onChange={(e) => { setEstado(e.target.value); setPage(1); }}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="">Todos los estados</option>
              <option value="Programado">Programado</option>
              <option value="EnProceso">En Proceso</option>
              <option value="Completado">Completado</option>
              <option value="Cancelado">Cancelado</option>
            </select>
            <select
              value={tipo}
              onChange={(e) => { setTipo(e.target.value); setPage(1); }}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="">Todos los tipos</option>
              <option value="Preventivo">Preventivo</option>
              <option value="Correctivo">Correctivo</option>
              <option value="Calibracion">Calibración</option>
            </select>
          </div>
        </div>

        {/* Contenido */}
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : mantenimientos.length === 0 ? (
          <div className="rounded-lg bg-white p-8 text-center shadow-md">
            <Wrench className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 text-gray-600">No hay mantenimientos programados</p>
          </div>
        ) : (
          <>
            {/* Vista móvil */}
            <div className="space-y-3 lg:hidden">
              {mantenimientos.map((mant, index) => (
                <motion.div
                  key={mant.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`rounded-lg bg-white p-4 shadow-md ${isOverdue(mant.fechaProgramada, mant.estado) ? 'border-l-4 border-red-500' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{mant.maquina.nombre}</h3>
                      <p className="text-sm text-gray-500">{mant.maquina.area}</p>
                    </div>
                    <span className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${estadoConfig[mant.estado]?.color}`}>
                      {estadoConfig[mant.estado]?.icon}
                      {estadoConfig[mant.estado]?.label}
                    </span>
                  </div>
                  <div className="mt-2">
                    <span className={`rounded px-2 py-0.5 text-xs font-medium ${
                      mant.tipo === 'Preventivo' ? 'bg-blue-100 text-blue-800' :
                      mant.tipo === 'Correctivo' ? 'bg-orange-100 text-orange-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {tipoLabels[mant.tipo]}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">{mant.descripcion}</p>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Programado:</span>
                      <span className={`ml-1 ${isOverdue(mant.fechaProgramada, mant.estado) ? 'font-semibold text-red-600' : 'text-gray-900'}`}>
                        {new Date(mant.fechaProgramada).toLocaleDateString('es-VE')}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Responsable:</span>
                      <span className="ml-1 text-gray-900">{mant.responsable}</span>
                    </div>
                    {mant.costo && (
                      <div>
                        <span className="text-gray-500">Costo:</span>
                        <span className="ml-1 text-gray-900">${mant.costo.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {mant.estado === 'Programado' && (
                      <button
                        onClick={() => handleEstadoChange(mant.id, 'EnProceso')}
                        className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-yellow-50 px-3 py-2 text-sm font-medium text-yellow-600 hover:bg-yellow-100"
                      >
                        <PlayCircle className="h-4 w-4" /> Iniciar
                      </button>
                    )}
                    {mant.estado === 'EnProceso' && (
                      <button
                        onClick={() => handleEstadoChange(mant.id, 'Completado')}
                        className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-green-50 px-3 py-2 text-sm font-medium text-green-600 hover:bg-green-100"
                      >
                        <CheckCircle className="h-4 w-4" /> Completar
                      </button>
                    )}
                    <Link
                      href={`/mantenimientos/${mant.id}/editar`}
                      className="flex items-center justify-center gap-1 rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-100"
                    >
                      <Edit className="h-4 w-4" />
                    </Link>
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(mant.id)}
                        className="flex items-center justify-center gap-1 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100"
                      >
                        <Trash2 className="h-4 w-4" />
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
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Máquina</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Tipo</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Descripción</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Fecha Prog.</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Responsable</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Estado</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {mantenimientos.map((mant) => (
                      <tr key={mant.id} className={`hover:bg-gray-50 ${isOverdue(mant.fechaProgramada, mant.estado) ? 'bg-red-50' : ''}`}>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-900">{mant.maquina.nombre}</p>
                          <p className="text-xs text-gray-500">{mant.maquina.area}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`rounded px-2 py-0.5 text-xs font-medium ${
                            mant.tipo === 'Preventivo' ? 'bg-blue-100 text-blue-800' :
                            mant.tipo === 'Correctivo' ? 'bg-orange-100 text-orange-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {tipoLabels[mant.tipo]}
                          </span>
                        </td>
                        <td className="max-w-xs px-4 py-3 text-sm text-gray-600 truncate">{mant.descripcion}</td>
                        <td className="px-4 py-3">
                          <span className={`text-sm ${isOverdue(mant.fechaProgramada, mant.estado) ? 'font-semibold text-red-600' : 'text-gray-600'}`}>
                            {new Date(mant.fechaProgramada).toLocaleDateString('es-VE')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{mant.responsable}</td>
                        <td className="px-4 py-3">
                          <span className={`flex w-fit items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${estadoConfig[mant.estado]?.color}`}>
                            {estadoConfig[mant.estado]?.icon}
                            {estadoConfig[mant.estado]?.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            {mant.estado === 'Programado' && (
                              <button
                                onClick={() => handleEstadoChange(mant.id, 'EnProceso')}
                                className="rounded p-1 text-yellow-600 hover:bg-yellow-50"
                                title="Iniciar"
                              >
                                <PlayCircle className="h-4 w-4" />
                              </button>
                            )}
                            {mant.estado === 'EnProceso' && (
                              <button
                                onClick={() => handleEstadoChange(mant.id, 'Completado')}
                                className="rounded p-1 text-green-600 hover:bg-green-50"
                                title="Completar"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </button>
                            )}
                            <Link
                              href={`/mantenimientos/${mant.id}/editar`}
                              className="rounded p-1 text-blue-600 hover:bg-blue-50"
                            >
                              <Edit className="h-4 w-4" />
                            </Link>
                            {isAdmin && (
                              <button
                                onClick={() => handleDelete(mant.id)}
                                className="rounded p-1 text-red-600 hover:bg-red-50"
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
