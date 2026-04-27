'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Recycle,
  Plus,
  Pencil,
  Trash2,
  Filter,
  Calendar,
  Box,
  TrendingDown,
  PackageMinus,
  Activity
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { RegistrarConsumoModal } from '@/components/modals/registrar-consumo-modal';
import { NuevoPeletizadoModal } from '@/components/modals/NuevoPeletizadoModal';

const TURNOS = [
  { value: 'Manana', label: 'Mañana' },
  { value: 'Tarde', label: 'Tarde' },
  { value: 'Noche', label: 'Noche' },
];

interface Peletizado {
  id: string;
  fecha: string;
  turno: string;
  operario: string;
  materialEntrada: number;
  materialSalida: number;
  merma: number;
  colorPelet?: string;
  tipoMaterial?: string;
  observaciones?: string;
  maquina: { id: string; nombre: string };
}

interface StockItem {
  id: string;
  nombre: string;
  codigo: string;
  cantidad: number;
  unidad: string;
  updatedAt: string;
}

interface ConsumoItem {
  id: string;
  fecha: string;
  cantidad: number;
  motivo: string;
  responsable: string;
  inventario: { nombre: string; unidad: string };
}

export default function PeletizadoPage() {
  const { data: session } = useSession() || {};
  const isAdmin = (session?.user as any)?.rol === 'admin';

  const [activeTab, setActiveTab] = useState<'Stock' | 'Consumo' | 'Produccion'>('Stock');

  // Data States
  const [stock, setStock] = useState<StockItem[]>([]);
  const [consumos, setConsumos] = useState<ConsumoItem[]>([]);
  const [registros, setRegistros] = useState<Peletizado[]>([]);

  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [filters, setFilters] = useState({
    fechaInicio: '',
    fechaFin: '',
  });
  const [eliminando, setEliminando] = useState<string | null>(null);

  // Modal State
  const [consumoModal, setConsumoModal] = useState<{ isOpen: boolean, item?: StockItem }>({ isOpen: false });
  const [nuevoPeletizadoModalOpen, setNuevoPeletizadoModalOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    setPage(1);
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'Stock') fetchStock();
    else if (activeTab === 'Consumo') fetchConsumos();
    else fetchRegistros();
  }, [page, filters, activeTab]);

  const fetchStock = async () => {
    try {
      const res = await fetch(`/api/inventario?categoria=Peletizado&busqueda=PEL-&page=${page}&limit=10`);
      const data = await res.json();
      setStock(data.inventarios || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Error fetching stock:', error);
    } finally { setLoading(false); }
  };

  const fetchConsumos = async () => {
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: '10', tipo: 'Salida', busquedaInventario: 'PEL-' });
      if (filters.fechaInicio) params.append('fechaInicio', filters.fechaInicio);
      if (filters.fechaFin) params.append('fechaFin', filters.fechaFin);
      const res = await fetch(`/api/inventario/movimientos?${params}`);
      const data = await res.json();
      setConsumos(data.movimientos || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Error fetching consumos:', error);
    } finally { setLoading(false); }
  };

  const fetchRegistros = async () => {
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: '10' });
      if (filters.fechaInicio) params.append('fechaInicio', filters.fechaInicio);
      if (filters.fechaFin) params.append('fechaFin', filters.fechaFin);
      const res = await fetch(`/api/peletizado?${params}`);
      const data = await res.json();
      setRegistros(data.data || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error('Error fetching registros:', error);
    } finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este registro de producción? Esta acción no se puede deshacer.')) return;
    try {
      setEliminando(id);
      const res = await fetch(`/api/peletizado/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchRegistros();
      } else {
        const error = await res.json();
        alert(error.error || 'Error al eliminar');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error inesperado al intentar eliminar');
    } finally {
      setEliminando(null);
    }
  };

  const getTurnoLabel = (turno: string) => TURNOS.find((t) => t.value === turno)?.label || turno;

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const calcEficiencia = (entrada: number, salida: number) => {
    if (entrada === 0) return 0;
    return ((salida / entrada) * 100).toFixed(1);
  };

  return (
    <>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Peletizado</h1>
            <p className="mt-1 text-sm text-gray-600 sm:text-base">Registro de proceso de peletizado</p>
          </div>
          <button
            onClick={() => setNuevoPeletizadoModalOpen(true)}
            className="flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-all active:scale-95 shadow-sm whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nuevo Registro</span>
            <span className="sm:hidden">Nuevo</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex bg-white shadow-sm p-1 rounded-xl w-full border border-gray-100 sm:w-fit overflow-x-auto">
          {[
            { id: 'Stock', icon: Box, label: 'Stock General' },
            { id: 'Consumo', icon: TrendingDown, label: 'Consumo' },
            { id: 'Produccion', icon: Activity, label: 'Producción' }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-5 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === tab.id
                  ? 'bg-green-50 text-green-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Filtros (Only for Consumo and Produccion) */}
        {activeTab !== 'Stock' && (
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-500" />
              <span className="font-medium text-gray-700">Filtros</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <input
                  type="date"
                  value={filters.fechaInicio}
                  onChange={(e) => setFilters({ ...filters, fechaInicio: e.target.value })}
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">a</span>
                <input
                  type="date"
                  value={filters.fechaFin}
                  onChange={(e) => setFilters({ ...filters, fechaFin: e.target.value })}
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Stock View */}
        {activeTab === 'Stock' && (
          <div className="rounded-xl bg-white shadow-sm overflow-hidden border border-gray-100">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Código</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Nombre del Material</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Stock Actual</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Acción Rápida</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {stock.length === 0 ? (
                    <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">No hay peletizado en stock</td></tr>
                  ) : (
                    stock.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.codigo}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{item.nombre}</td>
                        <td className="px-6 py-4 text-right">
                          <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${item.cantidad > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                            {item.cantidad} {item.unidad}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => setConsumoModal({ isOpen: true, item })}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-orange-700 bg-orange-100 border border-transparent rounded-lg hover:bg-orange-200 transition-colors"
                          >
                            <PackageMinus className="h-4 w-4" />
                            Consumir
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Consumo View */}
        {activeTab === 'Consumo' && (
          <div className="rounded-xl bg-white shadow-sm overflow-hidden border border-gray-100">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Fecha</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Material</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Cantidad (kg)</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Responsable</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Motivo de Salida</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {consumos.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No hay consumo registrado</td></tr>
                  ) : (
                    consumos.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-900">{formatDate(item.fecha)}</td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.inventario?.nombre}</td>
                        <td className="px-6 py-4 text-right text-sm font-bold text-orange-600">
                          - {item.cantidad} {item.inventario?.unidad}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{item.responsable}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{item.motivo}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Producción View */}
        {activeTab === 'Produccion' && (
          <div className="hidden rounded-xl bg-white shadow-sm overflow-hidden lg:block">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Fecha</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Turno</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Máquina</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Operario</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Entrada (kg)</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Salida (kg)</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Merma (kg)</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Eficiencia</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {registros.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                        No hay registros de peletizado
                      </td>
                    </tr>
                  ) : (
                    registros.map((registro) => (
                      <motion.tr
                        key={registro.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-4 py-3 text-sm text-gray-900">{formatDate(registro.fecha)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{getTurnoLabel(registro.turno)}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{registro.maquina.nombre}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{registro.operario}</td>
                        <td className="px-4 py-3 text-right text-sm text-gray-900">{registro.materialEntrada}</td>
                        <td className="px-4 py-3 text-right text-sm text-gray-900">{registro.materialSalida}</td>
                        <td className="px-4 py-3 text-right text-sm text-red-600">{registro.merma}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                            {calcEficiencia(registro.materialEntrada, registro.materialSalida)}%
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-center items-center gap-2">
                            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                              <Link
                                href={`/peletizado/${registro.id}/editar`}
                                className="p-2 bg-gradient-to-br from-blue-50 to-indigo-100 text-blue-600 hover:from-blue-100 hover:to-indigo-200 rounded-lg shadow-sm border border-blue-200/50 transition-all flex items-center justify-center"
                                title="Actualizar"
                              >
                                <Pencil className="h-4 w-4" />
                              </Link>
                            </motion.div>
                            {isAdmin && (
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleDelete(registro.id)}
                                disabled={eliminando === registro.id}
                                className="p-2 bg-gradient-to-br from-red-50 to-rose-100 text-red-600 hover:from-red-100 hover:to-rose-200 rounded-lg shadow-sm border border-red-200/50 transition-all disabled:opacity-50 flex items-center justify-center"
                                title="Eliminar"
                              >
                                {eliminando === registro.id ? <LoadingSpinner /> : <Trash2 className="h-4 w-4" />}
                              </motion.button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
            <p className="text-sm text-gray-600">Página {page} de {totalPages}</p>
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

        <RegistrarConsumoModal
          isOpen={consumoModal.isOpen}
          onClose={() => setConsumoModal({ isOpen: false })}
          onSuccess={() => {
            fetchStock();
          }}
          inventarioId={consumoModal.item?.id}
          inventarioNombre={consumoModal.item?.nombre}
          stockActual={consumoModal.item?.cantidad}
        />

        <NuevoPeletizadoModal
          isOpen={nuevoPeletizadoModalOpen}
          onClose={() => setNuevoPeletizadoModalOpen(false)}
          onSuccess={() => {
            setNuevoPeletizadoModalOpen(false);
            if (activeTab === 'Produccion') fetchRegistros();
            else if (activeTab === 'Stock') fetchStock();
          }}
        />
      </div>
    </>
  );
}
