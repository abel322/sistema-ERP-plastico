'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Settings,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Search,
  Factory,
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

const AREAS = [
  { value: 'Extrusion', label: 'Extrusión', color: 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50' },
  { value: 'Sellado', label: 'Sellado', color: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50' },
  { value: 'Serigrafia', label: 'Serigrafía', color: 'bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900/50' },
  { value: 'Refilado', label: 'Refilado', color: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50' },
];

interface Maquina {
  id: string;
  nombre: string;
  area: string;
  activa: boolean;
}

export default function MaquinasPage() {
  const { data: session } = useSession() || {};
  const router = useRouter();
  const [maquinas, setMaquinas] = useState<Maquina[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterArea, setFilterArea] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingMaquina, setEditingMaquina] = useState<Maquina | null>(null);
  const [formData, setFormData] = useState({ nombre: '', area: 'Extrusion' });
  const [saving, setSaving] = useState(false);

  const isAdmin = (session?.user as any)?.rol === 'admin';

  useEffect(() => {
    fetchMaquinas();
  }, []);

  const fetchMaquinas = async () => {
    try {
      const res = await fetch('/api/maquinas');
      const data = await res.json();
      setMaquinas(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = editingMaquina
        ? `/api/maquinas/${editingMaquina.id}`
        : '/api/maquinas';
      const method = editingMaquina ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        fetchMaquinas();
        setShowModal(false);
        setEditingMaquina(null);
        setFormData({ nombre: '', area: 'Extrusion' });
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar esta máquina?')) return;

    try {
      await fetch(`/api/maquinas/${id}`, { method: 'DELETE' });
      fetchMaquinas();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const openEditModal = (maquina: Maquina) => {
    setEditingMaquina(maquina);
    setFormData({ nombre: maquina.nombre, area: maquina.area });
    setShowModal(true);
  };

  const filteredMaquinas = maquinas.filter((m) => {
    const matchesSearch = m.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesArea = !filterArea || m.area === filterArea;
    return matchesSearch && matchesArea;
  });

  const getAreaInfo = (area: string) =>
    AREAS.find((a) => a.value === area) || AREAS[0];

  return (
    <div className="p-8 bg-slate-50 dark:bg-slate-950 min-h-screen transition-colors duration-300">
      {/* Header Area */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200 dark:shadow-none">
              <Factory className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white leading-tight">Maquinaria</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-widest rounded">Planta de Producción</span>
                <span className="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full" />
                <span className="text-slate-400 dark:text-slate-500 text-xs font-medium">{maquinas.length} máquinas instaladas</span>
              </div>
            </div>
          </div>
          
          {isAdmin && (
            <motion.button
              whileHover={{ scale: 1.02, boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.3)' }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setEditingMaquina(null);
                setFormData({ nombre: '', area: 'Extrusion' });
                setShowModal(true);
              }}
              className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 font-bold text-white shadow-lg transition-all hover:bg-blue-700 active:scale-95"
            >
              <Plus className="h-4 w-4" />
              NUEVA MÁQUINA
            </motion.button>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 mb-8 transition-colors">
        <div className="flex flex-col lg:flex-row items-center gap-6">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar máquina por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-sm font-semibold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
          
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 w-full lg:w-auto">
            <div className="px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-200 dark:border-slate-700">Filtrar por Área</div>
            <select
              value={filterArea}
              onChange={(e) => setFilterArea(e.target.value)}
              className="bg-transparent px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 focus:outline-none cursor-pointer flex-1"
            >
              <option value="">Todas las áreas</option>
              {AREAS.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Grid de Máquinas por Área */}
      <div className="space-y-8">
        {AREAS.map((area) => {
          const maquinasArea = filteredMaquinas.filter((m) => m.area === area.value);
          if (filterArea && filterArea !== area.value) return null;
          if (maquinasArea.length === 0 && filterArea !== area.value) return null;

          return (
            <motion.div
              key={area.value}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${area.color}`}>
                    <Factory className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900 dark:text-white leading-tight uppercase tracking-tight">{area.label}</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{maquinasArea.length} EQUIPOS REGISTRADOS</p>
                  </div>
                </div>
              </div>

              {maquinasArea.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-12 text-center border border-slate-200 dark:border-slate-800">
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No hay máquinas registradas en esta área</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {maquinasArea.map((maquina) => (
                    <motion.div
                      key={maquina.id}
                      whileHover={{ y: -4 }}
                      className="group bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${maquina.activa ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600' : 'bg-red-50 dark:bg-red-950/30 text-red-600'}`}>
                            <Settings className={`w-6 h-6 ${maquina.activa ? 'animate-spin-slow' : ''}`} />
                          </div>
                          <div>
                            <p className="text-base font-black text-slate-900 dark:text-white leading-tight">{maquina.nombre}</p>
                            <div className="flex items-center gap-1.5 mt-1">
                              <div className={`w-1.5 h-1.5 rounded-full ${maquina.activa ? 'bg-emerald-500' : 'bg-red-500'}`} />
                              <span className={`text-[10px] font-bold uppercase tracking-widest ${maquina.activa ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                                {maquina.activa ? 'Operativa' : 'Mantenimiento'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {isAdmin && (
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => openEditModal(maquina)}
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-all"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(maquina.id)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-all"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-md rounded-[2.5rem] bg-white dark:bg-slate-900 p-8 shadow-2xl border border-slate-200 dark:border-slate-800"
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/30 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Settings className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
                  {editingMaquina ? 'Editar Máquina' : 'Nueva Máquina'}
                </h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Configuración de equipo</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                  Nombre de la Máquina
                </label>
                <input
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="Ej: Extrusora #1"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                  Área de Producción
                </label>
                <div className="relative">
                  <select
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer"
                  >
                    {AREAS.map((a) => (
                      <option key={a.value} value={a.value}>
                        {a.label}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <Factory className="w-4 h-4" />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-6 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-[2] flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 text-xs font-black uppercase tracking-widest text-white hover:bg-blue-700 disabled:bg-blue-400 transition-all shadow-lg shadow-blue-200 dark:shadow-none"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editingMaquina ? 'GUARDAR' : 'CREAR'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
