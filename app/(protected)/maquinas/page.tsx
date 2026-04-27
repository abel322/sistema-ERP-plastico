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
  { value: 'Extrusion', label: 'Extrusión', color: 'bg-blue-100 text-blue-800' },
  { value: 'Sellado', label: 'Sellado', color: 'bg-green-100 text-green-800' },
  { value: 'Serigrafia', label: 'Serigrafía', color: 'bg-purple-100 text-purple-800' },
  { value: 'Refilado', label: 'Refilado', color: 'bg-orange-100 text-orange-800' },
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
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Máquinas</h1>
            <p className="text-gray-600">Gestión de máquinas por área de producción</p>
          </div>
          {isAdmin && (
            <button
              onClick={() => {
                setEditingMaquina(null);
                setFormData({ nombre: '', area: 'Extrusion' });
                setShowModal(true);
              }}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              <Plus className="h-5 w-5" />
              Nueva Máquina
            </button>
          )}
        </div>

        {/* Filtros */}
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar máquina..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <select
            value={filterArea}
            onChange={(e) => setFilterArea(e.target.value)}
            className="rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
          >
            <option value="">Todas las áreas</option>
            {AREAS.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>
        </div>

        {/* Grid de Máquinas por Área */}
        {AREAS.map((area) => {
          const maquinasArea = filteredMaquinas.filter((m) => m.area === area.value);
          if (filterArea && filterArea !== area.value) return null;
          if (maquinasArea.length === 0 && filterArea !== area.value) return null;

          return (
            <motion.div
              key={area.value}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl bg-white p-6 shadow-sm"
            >
              <div className="mb-4 flex items-center gap-3">
                <div className={`rounded-lg p-2 ${area.color}`}>
                  <Factory className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">{area.label}</h2>
                <span className="rounded-full bg-gray-100 px-2 py-1 text-sm text-gray-600">
                  {maquinasArea.length} máquinas
                </span>
              </div>

              {maquinasArea.length === 0 ? (
                <p className="text-center text-gray-500 py-4">No hay máquinas en esta área</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {maquinasArea.map((maquina) => (
                    <div
                      key={maquina.id}
                      className="flex items-center justify-between rounded-lg border border-gray-200 p-4 hover:border-blue-300"
                    >
                      <div className="flex items-center gap-3">
                        <Settings className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900">{maquina.nombre}</p>
                          <p className={`text-xs ${maquina.activa ? 'text-green-600' : 'text-red-600'}`}>
                            {maquina.activa ? 'Activa' : 'Inactiva'}
                          </p>
                        </div>
                      </div>
                      {isAdmin && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditModal(maquina)}
                            className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-blue-600"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(maquina.id)}
                            className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          );
        })}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
            >
              <h2 className="mb-4 text-xl font-semibold">
                {editingMaquina ? 'Editar Máquina' : 'Nueva Máquina'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Nombre de la Máquina
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                    placeholder="Ej: Extrusora #1"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Área de Producción
                  </label>
                  <select
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                  >
                    {AREAS.map((a) => (
                      <option key={a.value} value={a.value}>
                        {a.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-blue-400"
                  >
                    {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                    {editingMaquina ? 'Guardar Cambios' : 'Crear Máquina'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </>
  );
}
