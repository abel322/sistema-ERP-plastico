'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cpu,
  Factory,
  Plus,
  Pencil,
  Trash2,
  Search,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  Scaling,
  FileText,
  CheckCircle,
  HelpCircle,
  Settings,
  ChevronRight,
  Info,
  Calendar,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { TipoMaquina, EstadoMaquina, AreaProduccion } from '@prisma/client';
import {
  getMaquinas,
  createMaquina,
  updateMaquina,
  deleteMaquina,
  getCompatibleProductsAndOrders,
  getMaquinaStats,
} from '@/app/actions/maquinas';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Badge } from '@/components/ui/badge';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const AREAS = [
  { value: 'Extrusion', label: 'Extrusión' },
  { value: 'Sellado', label: 'Sellado' },
  { value: 'Serigrafia', label: 'Serigrafía' },
  { value: 'Refilado', label: 'Refilado' },
];

const TIPOS_MAQUINA = [
  { value: 'Extrusora', label: 'Extrusora' },
  { value: 'Impresora', label: 'Impresora' },
  { value: 'Selladora', label: 'Selladora' },
  { value: 'Peletizadora', label: 'Peletizadora' },
  { value: 'Refiladora', label: 'Refiladora' },
];

const ESTADOS_MAQUINA = [
  { value: 'Operativa', label: 'Operativa', color: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50' },
  { value: 'Mantenimiento', label: 'En Mantenimiento', color: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50' },
  { value: 'Detenida', label: 'Detenida', color: 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/50' },
];

export default function MaquinasPage() {
  const { data: session } = useSession() || {};
  const [activeTab, setActiveTab] = useState<'activos' | 'compatibilidad' | 'oee'>('activos');
  const [maquinas, setMaquinas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingMaquina, setEditingMaquina] = useState<any | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    nombre: '',
    tipo: 'Extrusora',
    marca: '',
    modelo: '',
    estado: 'Operativa',
    capacidadNominal: 0,
    unidadCapacidad: 'kg/hora',
    anchoMaximoMm: 0,
    horasAcumuladas: 0,
    kgAcumulados: 0,
    limiteMantenimiento: 1000,
    area: 'Extrusion',
  });
  const [saving, setSaving] = useState(false);

  // Tab 2 State: Compatibility
  const [selectedMaquinaCompat, setSelectedMaquinaCompat] = useState<string>('');
  const [compatData, setCompatData] = useState<{ compatibleProducts: any[]; compatibleOrders: any[] } | null>(null);
  const [loadingCompat, setLoadingCompat] = useState(false);
  const [searchProduct, setSearchProduct] = useState('');

  // Tab 3 State: OEE Analytics
  const [selectedMaquinaStats, setSelectedMaquinaStats] = useState<string>('');
  const [statsData, setStatsData] = useState<any | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  const isAdmin = (session?.user as any)?.rol === 'admin';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await getMaquinas();
      setMaquinas(data);

      if (data.length > 0) {
        setSelectedMaquinaCompat(data[0].id);
        setSelectedMaquinaStats(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching machines:', error);
    } finally {
      setLoading(false);
    }
  };

  // Compatibility Data Loader
  useEffect(() => {
    if (activeTab === 'compatibilidad' && selectedMaquinaCompat) {
      loadCompatibility(selectedMaquinaCompat);
    }
  }, [activeTab, selectedMaquinaCompat]);

  // Stats Data Loader
  useEffect(() => {
    if (activeTab === 'oee' && selectedMaquinaStats) {
      loadStats(selectedMaquinaStats);
    }
  }, [activeTab, selectedMaquinaStats]);

  const loadCompatibility = async (id: string) => {
    try {
      setLoadingCompat(true);
      const res = await getCompatibleProductsAndOrders(id);
      setCompatData(res);
    } catch (error) {
      console.error('Error loading compatibility:', error);
    } finally {
      setLoadingCompat(false);
    }
  };

  const loadStats = async (id: string) => {
    try {
      setLoadingStats(true);
      const res = await getMaquinaStats(id);
      setStatsData(res);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingMaquina(null);
    setFormData({
      nombre: '',
      tipo: 'Extrusora',
      marca: '',
      modelo: '',
      estado: 'Operativa',
      capacidadNominal: 0,
      unidadCapacidad: 'kg/hora',
      anchoMaximoMm: 0,
      horasAcumuladas: 0,
      kgAcumulados: 0,
      limiteMantenimiento: 1000,
      area: 'Extrusion',
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (maquina: any) => {
    setEditingMaquina(maquina);
    setFormData({
      nombre: maquina.nombre,
      tipo: maquina.tipo,
      marca: maquina.marca || '',
      modelo: maquina.modelo || '',
      estado: maquina.estado || 'Operativa',
      capacidadNominal: maquina.capacidadNominal || 0,
      unidadCapacidad: maquina.unidadCapacidad || 'kg/hora',
      anchoMaximoMm: maquina.anchoMaximoMm || 0,
      horasAcumuladas: maquina.horasAcumuladas || 0,
      kgAcumulados: maquina.kgAcumulados || 0,
      limiteMantenimiento: maquina.limiteMantenimiento || 1000,
      area: maquina.area || 'Extrusion',
    });
    setShowModal(true);
  };

  const handleTipoChange = (tipo: string) => {
    let autoArea = 'Extrusion';
    let autoUnidad = 'kg/hora';
    if (tipo === 'Extrusora') { autoArea = 'Extrusion'; autoUnidad = 'kg/hora'; }
    else if (tipo === 'Impresora') { autoArea = 'Serigrafia'; autoUnidad = 'm/minuto'; }
    else if (tipo === 'Selladora') { autoArea = 'Sellado'; autoUnidad = 'golpes/minuto'; }
    else if (tipo === 'Peletizadora') { autoArea = 'Extrusion'; autoUnidad = 'kg/hora'; }
    else if (tipo === 'Refiladora') { autoArea = 'Refilado'; autoUnidad = 'm/minuto'; }

    setFormData({
      ...formData,
      tipo,
      area: autoArea,
      unidadCapacidad: autoUnidad,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...formData,
        tipo: formData.tipo as TipoMaquina,
        estado: formData.estado as EstadoMaquina,
        area: formData.area as AreaProduccion,
      };

      if (editingMaquina) {
        await updateMaquina(editingMaquina.id, payload);
      } else {
        await createMaquina(payload);
      }
      setShowModal(false);
      fetchData();
    } catch (error) {
      console.error('Error saving machine:', error);
      alert('Error al guardar la máquina: ' + (error as any).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMaquina = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar esta máquina?')) return;
    try {
      await deleteMaquina(id);
      fetchData();
    } catch (error) {
      console.error('Error deleting machine:', error);
      alert((error as any).message);
    }
  };

  // Filter logic for primary assets
  const filteredMaquinas = maquinas.filter((m) => {
    const matchesSearch = m.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (m.marca && m.marca.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (m.modelo && m.modelo.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesTipo = !filterTipo || m.tipo === filterTipo;
    return matchesSearch && matchesTipo;
  });

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 p-4 lg:p-8 space-y-8 transition-colors duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-800">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200 dark:shadow-none">
            <Cpu className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              Máquinas Operativas
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-widest rounded">Planta Industrial</span>
              <span className="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full" />
              <span className="text-slate-400 dark:text-slate-500 text-xs font-medium">{maquinas.length} Activos en Sistema</span>
            </div>
          </div>
        </div>

        {isAdmin && (
          <motion.button
            whileHover={{ scale: 1.02, boxShadow: '0 10px 15px -3px rgba(79, 70, 229, 0.3)' }}
            whileTap={{ scale: 0.98 }}
            onClick={handleOpenCreateModal}
            className="flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 font-bold text-sm text-white shadow-lg transition-all hover:bg-indigo-700 active:scale-95"
          >
            <Plus className="h-5 w-5" />
            NUEVO ACTIVO
          </motion.button>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="flex bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-sm max-w-2xl">
        <button
          onClick={() => setActiveTab('activos')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
            activeTab === 'activos'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50'
          }`}
        >
          <Factory className="w-4 h-4" />
          Registro y Activos
        </button>
        <button
          onClick={() => setActiveTab('compatibilidad')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
            activeTab === 'compatibilidad'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50'
          }`}
        >
          <Scaling className="w-4 h-4" />
          Programación y Compatibilidad
        </button>
        <button
          onClick={() => setActiveTab('oee')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
            activeTab === 'oee'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50'
          }`}
        >
          <Activity className="w-4 h-4" />
          Rendimiento y Mermas (OEE)
        </button>
      </div>

      {/* Tab Panels */}
      <div className="min-h-[500px]">
        <AnimatePresence mode="wait">
          {activeTab === 'activos' && (
            <motion.div
              key="activos"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Filter Row */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/60 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center gap-4">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar por código, marca, modelo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl py-3 pl-11 pr-4 text-sm font-semibold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 w-full md:w-auto">
                  <div className="px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-200 dark:border-slate-700">Tipo</div>
                  <select
                    value={filterTipo}
                    onChange={(e) => setFilterTipo(e.target.value)}
                    className="bg-transparent px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 focus:outline-none cursor-pointer"
                  >
                    <option value="">Todos los tipos</option>
                    {TIPOS_MAQUINA.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Table of Assets */}
              <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden border border-slate-200/60 dark:border-slate-800 shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Máquina</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Tipo / Área</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Marca y Modelo</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Estado</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Capacidad</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Ancho Máx.</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Uso Acumulado</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredMaquinas.length > 0 ? (
                        filteredMaquinas.map((m) => {
                          // Maintenance preventive alert logic
                          const hoursOverThreshold = m.limiteMantenimiento > 0 && m.horasAcumuladas >= m.limiteMantenimiento;
                          const kgOverThreshold = m.limiteMantenimiento > 0 && m.kgAcumulados >= m.limiteMantenimiento;
                          const requiresMaintenance = hoursOverThreshold || kgOverThreshold;

                          const statusStyle = ESTADOS_MAQUINA.find((e) => e.value === m.estado) || ESTADOS_MAQUINA[0];

                          return (
                            <tr key={m.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                              <td className="px-6 py-5">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400">
                                    <Cpu className="w-5 h-5" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">{m.nombre}</p>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{m.id.substring(0, 8)}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-5">
                                <span className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-wider">{m.tipo}</span>
                                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-wider">{m.area}</p>
                              </td>
                              <td className="px-6 py-5">
                                <p className="text-sm font-semibold text-slate-800 dark:text-slate-300">{m.marca || 'N/D'}</p>
                                <p className="text-xs text-slate-400 font-medium">{m.modelo || 'N/D'}</p>
                              </td>
                              <td className="px-6 py-5">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusStyle.color}`}>
                                  {statusStyle.label}
                                </span>
                              </td>
                              <td className="px-6 py-5">
                                <p className="text-sm font-black text-slate-900 dark:text-white">
                                  {m.capacidadNominal}
                                </p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none mt-0.5">{m.unidadCapacidad}</p>
                              </td>
                              <td className="px-6 py-5 text-center">
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                                  {m.anchoMaximoMm} mm
                                </span>
                              </td>
                              <td className="px-6 py-5">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{m.horasAcumuladas} hrs</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <Activity className="w-3.5 h-3.5 text-slate-400" />
                                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{m.kgAcumulados.toLocaleString()} kg</span>
                                  </div>
                                  
                                  {requiresMaintenance && (
                                    <div className="flex items-center gap-1 text-amber-500 animate-pulse mt-1">
                                      <AlertTriangle className="w-3.5 h-3.5" />
                                      <span className="text-[9px] font-black uppercase tracking-wider">MANTENIMIENTO PREVENTIVO REQUERIDO</span>
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-5 text-right">
                                <div className="flex justify-end gap-1.5">
                                  <button
                                    onClick={() => handleOpenEditModal(m)}
                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-xl transition-all"
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </button>
                                  {isAdmin && (
                                    <button
                                      onClick={() => handleDeleteMaquina(m.id)}
                                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-all"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={8} className="px-6 py-12 text-center text-slate-400 text-sm font-semibold italic">
                            No se encontraron máquinas registradas
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'compatibilidad' && (
            <motion.div
              key="compatibilidad"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Selection Bar */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/60 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center gap-6">
                <div className="w-full md:w-80 space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Seleccionar Activo</label>
                  <select
                    value={selectedMaquinaCompat}
                    onChange={(e) => setSelectedMaquinaCompat(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                  >
                    {maquinas.map((m) => (
                      <option key={m.id} value={m.id}>{m.nombre} ({m.tipo} - Max: {m.anchoMaximoMm}mm)</option>
                    ))}
                  </select>
                </div>

                <div className="flex-1 w-full space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Filtrar Productos</label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Buscar por nombre de producto..."
                      value={searchProduct}
                      onChange={(e) => setSearchProduct(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pl-11 pr-4 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {loadingCompat ? (
                <div className="flex justify-center items-center py-20">
                  <LoadingSpinner />
                </div>
              ) : compatData ? (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  {/* Left Column: Compatible Products */}
                  <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200/60 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 bg-slate-50/50 dark:bg-slate-900/50">
                      <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl text-indigo-600">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Catálogo de Productos Compatibles</h3>
                        <p className="text-xs text-slate-400 font-medium">Especificaciones del cliente compatibles con el límite físico de la máquina.</p>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto max-h-[500px]">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-slate-100 dark:border-slate-800">
                            <th className="px-6 py-3.5 text-[9px] font-black uppercase tracking-widest text-slate-400">Producto</th>
                            <th className="px-6 py-3.5 text-[9px] font-black uppercase tracking-widest text-slate-400">Cliente</th>
                            <th className="px-6 py-3.5 text-[9px] font-black uppercase tracking-widest text-slate-400 text-center">Dimensiones</th>
                            <th className="px-6 py-3.5 text-[9px] font-black uppercase tracking-widest text-slate-400 text-right">Calibre</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {compatData.compatibleProducts.filter(p => p.nombreProducto.toLowerCase().includes(searchProduct.toLowerCase())).length > 0 ? (
                            compatData.compatibleProducts
                              .filter(p => p.nombreProducto.toLowerCase().includes(searchProduct.toLowerCase()))
                              .map((p) => (
                                <tr key={p.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/10">
                                  <td className="px-6 py-4">
                                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{p.nombreProducto}</p>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{p.tipoProducto}</p>
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">{p.cliente?.nombre}</span>
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                    <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/20 px-2 py-0.5 rounded">
                                      {p.ancho || p.anchoBobina || 0}mm {p.largo ? `x ${p.largo}mm` : ''}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 text-right text-xs font-semibold text-slate-600 dark:text-slate-400">
                                    {p.calibre ? `${p.calibre} gauge` : 'N/A'}
                                  </td>
                                </tr>
                              ))
                          ) : (
                            <tr>
                              <td colSpan={4} className="px-6 py-12 text-center text-slate-400 text-xs italic">
                                Sin productos compatibles para las dimensiones de esta máquina.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Right Column: Compatible Active Orders */}
                  <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200/60 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 bg-slate-50/50 dark:bg-slate-900/50">
                      <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-emerald-600">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Órdenes de Producción Aptas</h3>
                        <p className="text-xs text-slate-400 font-medium">Pedidos pendientes y activos compatibles con este equipo para fabricar hoy.</p>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto max-h-[500px]">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-slate-100 dark:border-slate-800">
                            <th className="px-6 py-3.5 text-[9px] font-black uppercase tracking-widest text-slate-400">Pedido</th>
                            <th className="px-6 py-3.5 text-[9px] font-black uppercase tracking-widest text-slate-400">Cliente / Prod.</th>
                            <th className="px-6 py-3.5 text-[9px] font-black uppercase tracking-widest text-slate-400 text-center">Cantidad</th>
                            <th className="px-6 py-3.5 text-[9px] font-black uppercase tracking-widest text-slate-400 text-right">Entrega</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {compatData.compatibleOrders.length > 0 ? (
                            compatData.compatibleOrders.map((o) => (
                              <tr key={o.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/10">
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">OP-{o.id.substring(0, 5).toUpperCase()}</p>
                                  </div>
                                  <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">{o.estado}</p>
                                </td>
                                <td className="px-6 py-4">
                                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-300 truncate max-w-[150px]">{o.productoCliente?.nombreProducto}</p>
                                  <p className="text-[9px] text-slate-400 font-bold uppercase">{o.cliente?.nombre}</p>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-0.5 rounded-full">
                                    {o.cantidadSolicitada.toLocaleString()} {o.unidad}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-right text-xs font-medium text-slate-500">
                                  {new Date(o.fechaEntrega).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={4} className="px-6 py-12 text-center text-slate-400 text-xs italic">
                                No hay órdenes de producción pendientes compatibles.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-12 text-center text-slate-400 italic">
                  Seleccione una máquina para validar la compatibilidad.
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'oee' && (
            <motion.div
              key="oee"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              {/* Selection Bar */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/60 dark:border-slate-800 shadow-sm flex items-center justify-between gap-4">
                <div className="w-full md:w-80 space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Seleccionar Activo</label>
                  <select
                    value={selectedMaquinaStats}
                    onChange={(e) => setSelectedMaquinaStats(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                  >
                    {maquinas.map((m) => (
                      <option key={m.id} value={m.id}>{m.nombre} ({m.tipo})</option>
                    ))}
                  </select>
                </div>
                
                <button
                  onClick={() => loadStats(selectedMaquinaStats)}
                  className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                  title="Actualizar datos"
                >
                  <RefreshCw className={`w-5 h-5 ${loadingStats ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {loadingStats ? (
                <div className="flex justify-center items-center py-20">
                  <LoadingSpinner />
                </div>
              ) : statsData ? (
                <div className="space-y-8">
                  {/* Stats Cards Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Efficiency Card */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-150 dark:border-slate-800 flex items-center gap-5">
                      <div className="h-12 w-12 rounded-2xl flex items-center justify-center bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600">
                        <TrendingUp className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-2xl font-black text-slate-900 dark:text-white leading-none mb-1">
                          {statsData.overallEfficiency.toFixed(1)}%
                        </p>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Eficiencia Real (OEE)</p>
                      </div>
                    </div>

                    {/* Waste/Merma Card */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-150 dark:border-slate-800 flex items-center gap-5">
                      <div className="h-12 w-12 rounded-2xl flex items-center justify-center bg-rose-50 dark:bg-rose-950/40 text-rose-600">
                        <TrendingDown className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-2xl font-black text-slate-900 dark:text-white leading-none mb-1">
                          {statsData.overallMermaPercent.toFixed(1)}%
                        </p>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Mermas de Producción</p>
                      </div>
                    </div>

                    {/* Production Count Card */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-150 dark:border-slate-800 flex items-center gap-5">
                      <div className="h-12 w-12 rounded-2xl flex items-center justify-center bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
                        <CheckCircle className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-2xl font-black text-slate-900 dark:text-white leading-none mb-1">
                          {statsData.totalCantidadProducida.toLocaleString()}
                        </p>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Kg / Metros Totales</p>
                      </div>
                    </div>

                    {/* Usage vs Limit Card */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-150 dark:border-slate-800 flex items-center gap-5">
                      <div className="h-12 w-12 rounded-2xl flex items-center justify-center bg-amber-50 dark:bg-amber-950/40 text-amber-600">
                        <Clock className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xl font-black text-slate-900 dark:text-white leading-none mb-1">
                          {statsData.maquina.horasAcumuladas} / {statsData.maquina.limiteMantenimiento} hrs
                        </p>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1.5">
                          <div 
                            className={`h-full rounded-full ${statsData.maquina.horasAcumuladas >= statsData.maquina.limiteMantenimiento ? 'bg-rose-500' : 'bg-amber-500'}`}
                            style={{ width: `${Math.min((statsData.maquina.horasAcumuladas / (statsData.maquina.limiteMantenimiento || 1)) * 100, 100)}%` }}
                          />
                        </div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Horas para Mantenimiento</p>
                      </div>
                    </div>
                  </div>

                  {/* Analytics Section & Chart */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Historic Chart */}
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 lg:p-8 border border-slate-200/60 dark:border-slate-800 shadow-sm lg:col-span-2">
                      <h3 className="text-lg font-black text-slate-900 dark:text-white mb-6">Historial Mensual de Producción y Mermas</h3>
                      <div className="h-80">
                        {statsData.historicalData.length > 0 ? (
                          <Bar 
                            data={{
                              labels: statsData.historicalData.map((h: any) => h.month),
                              datasets: [
                                {
                                  label: 'Total Producido (kg)',
                                  data: statsData.historicalData.map((h: any) => h.totalProducido),
                                  backgroundColor: '#4f46e5',
                                  borderRadius: 8,
                                },
                                {
                                  label: 'Total Merma (kg)',
                                  data: statsData.historicalData.map((h: any) => h.totalMerma),
                                  backgroundColor: '#ef4444',
                                  borderRadius: 8,
                                }
                              ]
                            }}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: { legend: { position: 'top' } },
                              scales: {
                                y: { beginAtZero: true, grid: { color: 'rgba(148, 163, 184, 0.05)' } },
                                x: { grid: { display: false } }
                              }
                            }}
                          />
                        ) : (
                          <div className="h-full flex items-center justify-center text-slate-400 text-sm italic">
                            Sin datos históricos disponibles en este equipo.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Operational Details Card */}
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 lg:p-8 border border-slate-200/60 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                      <div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                          <Info className="w-5 h-5 text-slate-400" />
                          Ficha Técnica de Desempeño
                        </h3>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center py-2.5 border-b border-slate-100 dark:border-slate-800">
                            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Capacidad Nominal</span>
                            <span className="text-sm font-black text-slate-850 dark:text-slate-200">
                              {statsData.maquina.capacidadNominal} {statsData.maquina.unidadCapacidad}
                            </span>
                          </div>
                          <div className="flex justify-between items-center py-2.5 border-b border-slate-100 dark:border-slate-800">
                            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Turnos Registrados</span>
                            <span className="text-sm font-black text-slate-850 dark:text-slate-200">{statsData.runsCount} corridas</span>
                          </div>
                          <div className="flex justify-between items-center py-2.5 border-b border-slate-100 dark:border-slate-800">
                            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Desgaste Acumulado (kg)</span>
                            <span className="text-sm font-black text-slate-850 dark:text-slate-200">{statsData.maquina.kgAcumulados.toLocaleString()} kg</span>
                          </div>
                          <div className="flex justify-between items-center py-2.5">
                            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Estado Técnico</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${statsData.maquina.estado === 'Operativa' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                              {statsData.maquina.estado}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-indigo-50/50 dark:bg-slate-800/40 border border-indigo-100/50 dark:border-slate-800 p-4 rounded-2xl mt-6">
                        <div className="flex gap-3">
                          <Activity className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="text-xs font-black uppercase text-indigo-700 dark:text-indigo-400 tracking-wider">Diagnóstico de Producción</h4>
                            <p className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 mt-1 leading-relaxed">
                              {statsData.overallEfficiency >= 80 ? 'La eficiencia de este equipo se encuentra en niveles excelentes.' : 'Se recomienda revisar las detenciones y ajustes de velocidad para incrementar el OEE.'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Production Runs History table */}
                  <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden border border-slate-200/60 dark:border-slate-800 shadow-sm">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                      <h3 className="text-lg font-black text-slate-900 dark:text-white">Corridas Recientes</h3>
                      <p className="text-xs text-slate-400 font-medium">Registro histórico detallado de producciones, mermas y eficiencias individuales por lote.</p>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/20">
                            <th className="px-6 py-3.5 text-[9px] font-black uppercase tracking-widest text-slate-400">Fecha / Turno</th>
                            <th className="px-6 py-3.5 text-[9px] font-black uppercase tracking-widest text-slate-400">Cliente y Producto</th>
                            <th className="px-6 py-3.5 text-[9px] font-black uppercase tracking-widest text-slate-400 text-center">Cantidad Producida</th>
                            <th className="px-6 py-3.5 text-[9px] font-black uppercase tracking-widest text-slate-400 text-center">Merma (%)</th>
                            <th className="px-6 py-3.5 text-[9px] font-black uppercase tracking-widest text-slate-400 text-right">Eficiencia (OEE)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {statsData.runsStats.length > 0 ? (
                            statsData.runsStats.map((r: any) => (
                              <tr key={r.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/10">
                                <td className="px-6 py-4">
                                  <p className="text-xs font-bold text-slate-850 dark:text-slate-300">
                                    {new Date(r.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                  </p>
                                  <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded text-[9px] font-bold uppercase mt-1 inline-block">
                                    Turno: {r.turno}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{r.producto}</p>
                                  <p className="text-[9px] font-black text-slate-400 uppercase mt-0.5">{r.cliente}</p>
                                </td>
                                <td className="px-6 py-4 text-center font-bold text-slate-800 dark:text-slate-350">
                                  {r.cantidadProducida.toLocaleString()}
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <span className={`text-xs font-black ${r.mermaPercent > 5 ? 'text-red-500' : 'text-slate-600 dark:text-slate-400'}`}>
                                    {r.merma.toLocaleString()} kg ({r.mermaPercent.toFixed(1)}%)
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <span className={`text-xs font-black ${r.efficiency >= 85 ? 'text-emerald-600' : 'text-amber-600'}`}>
                                    {r.efficiency.toFixed(1)}%
                                  </span>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-xs italic">
                                Sin corridas históricas registradas en esta máquina.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-12 text-center text-slate-400 italic">
                  Seleccione un equipo para ver su OEE y reporte operativo.
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modal/Drawer Form */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-2xl rounded-[2.5rem] bg-white dark:bg-slate-900 p-8 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-y-auto max-h-[90vh] custom-scrollbar"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl flex items-center justify-center text-indigo-600">
                <Settings className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">
                  {editingMaquina ? 'Editar Activo Industrial' : 'Registrar Nuevo Activo'}
                </h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Parámetros técnicos de plástico</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Nombre */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Código/Nombre de Máquina</label>
                  <input
                    type="text"
                    required
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Ej: Extrusora 01"
                  />
                </div>

                {/* Tipo de Máquina */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Máquina</label>
                  <select
                    value={formData.tipo}
                    onChange={(e) => handleTipoChange(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    {TIPOS_MAQUINA.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>

                {/* Marca */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Marca</label>
                  <input
                    type="text"
                    value={formData.marca}
                    onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Ej: Windmöller"
                  />
                </div>

                {/* Modelo */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Modelo</label>
                  <input
                    type="text"
                    value={formData.modelo}
                    onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Ej: HeavyDuty 500"
                  />
                </div>

                {/* Estado Operativo */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Estado Operativo</label>
                  <select
                    value={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    {ESTADOS_MAQUINA.map((e) => (
                      <option key={e.value} value={e.value}>{e.label}</option>
                    ))}
                  </select>
                </div>

                {/* Área de Producción */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Área Asociada (Flujo)</label>
                  <select
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    {AREAS.map((a) => (
                      <option key={a.value} value={a.value}>{a.label}</option>
                    ))}
                  </select>
                </div>

                {/* Capacidad Nominal */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Capacidad Nominal</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formData.capacidadNominal}
                    onChange={(e) => setFormData({ ...formData, capacidadNominal: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                {/* Unidad de Capacidad */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Unidad de Capacidad</label>
                  <input
                    type="text"
                    required
                    value={formData.unidadCapacidad}
                    onChange={(e) => setFormData({ ...formData, unidadCapacidad: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Ej: kg/hora, golpes/minuto"
                  />
                </div>

                {/* Ancho Máximo de Trabajo */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ancho Máximo de Trabajo (mm)</label>
                  <input
                    type="number"
                    required
                    value={formData.anchoMaximoMm}
                    onChange={(e) => setFormData({ ...formData, anchoMaximoMm: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Capacidad de mordaza o rodillo"
                  />
                </div>

                {/* Límite Mantenimiento */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Límite para Mantenimiento (hrs/kg)</label>
                  <input
                    type="number"
                    required
                    value={formData.limiteMantenimiento}
                    onChange={(e) => setFormData({ ...formData, limiteMantenimiento: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Umbral preventivo"
                  />
                </div>

                {/* Horas Acumuladas */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Horas Operadas Acumuladas</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.horasAcumuladas}
                    onChange={(e) => setFormData({ ...formData, horasAcumuladas: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                {/* Kg Procesados Acumulados */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kg Procesados Acumulados</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.kgAcumulados}
                    onChange={(e) => setFormData({ ...formData, kgAcumulados: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-[2] py-3.5 rounded-2xl bg-indigo-600 text-xs font-black uppercase tracking-widest text-white hover:bg-indigo-700 disabled:bg-indigo-400 shadow-lg shadow-indigo-100 dark:shadow-none transition-all flex items-center justify-center gap-2"
                >
                  {saving ? 'Guardando...' : editingMaquina ? 'GUARDAR CAMBIOS' : 'REGISTRAR ACTIVO'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
