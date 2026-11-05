'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Search,
  CheckCircle2,
  XCircle,
  Edit2,
  X,
  Loader2,
} from 'lucide-react';
import {
  obtenerTodosLosOperadoresAction,
  crearOperadorAction,
  actualizarOperadorAction,
  toggleEstadoOperadorAction,
} from '@/actions/operadores';
import type { AreaOperadorTipo, OperadorItem } from '@/types/operadores';
import { useToast } from '@/hooks/use-toast';

const AREAS_DISPONIBLES: { id: AreaOperadorTipo | 'TODAS'; label: string }[] = [
  { id: 'TODAS', label: 'Todas las áreas' },
  { id: 'EXTRUSION', label: 'Extrusión' },
  { id: 'SELLADO', label: 'Sellado' },
  { id: 'IMPRESION', label: 'Impresión / Serigrafía' },
  { id: 'REFILADO', label: 'Refilado' },
  { id: 'PELETIZADO', label: 'Peletizado' },
];

export default function GestionOperadoresPage() {
  const { toast } = useToast();
  const [operadores, setOperadores] = useState<OperadorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroArea, setFiltroArea] = useState<AreaOperadorTipo | 'TODAS'>('TODAS');
  const [busqueda, setBusqueda] = useState('');

  // Modal State
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [formNombre, setFormNombre] = useState('');
  const [formCedula, setFormCedula] = useState('');
  const [formArea, setFormArea] = useState<AreaOperadorTipo>('EXTRUSION');
  const [guardando, setGuardando] = useState(false);

  const cargarOperadores = async () => {
    setLoading(true);
    const res = await obtenerTodosLosOperadoresAction();
    if (res.success && res.operadores) {
      setOperadores(res.operadores as OperadorItem[]);
    } else if (res.error) {
      toast({
        title: 'Error',
        description: res.error,
        variant: 'destructive',
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    cargarOperadores();
  }, []);

  const operadoresFiltrados = useMemo(() => {
    return operadores.filter((op) => {
      const coincideArea = filtroArea === 'TODAS' || op.area === filtroArea;
      const coincideBusqueda =
        !busqueda ||
        op.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        (op.cedula && op.cedula.includes(busqueda));
      return coincideArea && coincideBusqueda;
    });
  }, [operadores, filtroArea, busqueda]);

  const abrirCrear = () => {
    setEditandoId(null);
    setFormNombre('');
    setFormCedula('');
    setFormArea('EXTRUSION');
    setModalAbierto(true);
  };

  const abrirEditar = (op: OperadorItem) => {
    setEditandoId(op.id);
    setFormNombre(op.nombre);
    setFormCedula(op.cedula || '');
    setFormArea(op.area);
    setModalAbierto(true);
  };

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNombre.trim()) {
      toast({
        title: 'Campo obligatorio',
        description: 'El nombre completo del operador es requerido.',
        variant: 'destructive',
      });
      return;
    }
    setGuardando(true);

    try {
      if (editandoId) {
        const res = await actualizarOperadorAction(editandoId, {
          nombre: formNombre,
          cedula: formCedula,
          area: formArea,
        });
        if (res.success) {
          toast({
            title: 'Operario actualizado',
            description: `Se han guardado los cambios para ${formNombre.toUpperCase()}.`,
          });
          await cargarOperadores();
          setModalAbierto(false);
        } else {
          toast({
            title: 'Error al actualizar',
            description: res.error || 'No se pudo actualizar el operario.',
            variant: 'destructive',
          });
        }
      } else {
        const res = await crearOperadorAction({
          nombre: formNombre,
          cedula: formCedula,
          area: formArea,
        });
        if (res.success) {
          toast({
            title: 'Operario registrado',
            description: `${formNombre.toUpperCase()} ha sido incorporado a la nómina de planta.`,
          });
          await cargarOperadores();
          setModalAbierto(false);
        } else {
          toast({
            title: 'Error al registrar',
            description: res.error || 'No se pudo registrar el operario.',
            variant: 'destructive',
          });
        }
      }
    } finally {
      setGuardando(false);
    }
  };

  const handleToggleActivo = async (op: OperadorItem) => {
    const nuevoEstado = !op.activo;
    const res = await toggleEstadoOperadorAction(op.id, nuevoEstado);
    if (res.success) {
      setOperadores((prev) =>
        prev.map((item) => (item.id === op.id ? { ...item, activo: nuevoEstado } : item))
      );
      toast({
        title: nuevoEstado ? 'Operario activado' : 'Operario inactivado',
        description: `${op.nombre} ahora está ${nuevoEstado ? 'activo' : 'inactivo'}.`,
      });
    } else {
      toast({
        title: 'Error',
        description: res.error || 'No se pudo cambiar el estado del operario.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-2xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">
              Nómina de Operadores de Planta
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Control de personal activo por puesto de trabajo (Extrusión, Sellado, Impresión, etc.).
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={abrirCrear}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-2xl shadow-sm transition-all cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Nuevo Operario</span>
        </button>
      </div>

      {/* Buscador y Pestañas por Área */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o cédula..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {AREAS_DISPONIBLES.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => setFiltroArea(a.id)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors whitespace-nowrap cursor-pointer ${
                filtroArea === a.id
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla de Operadores */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Operario</th>
                <th className="py-3.5 px-4">Área Asignada</th>
                <th className="py-3.5 px-4">Cédula</th>
                <th className="py-3.5 px-4 text-center">Estado</th>
                <th className="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                      <span>Cargando operadores...</span>
                    </div>
                  </td>
                </tr>
              ) : operadoresFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No se encontraron operadores registrados.
                  </td>
                </tr>
              ) : (
                operadoresFiltrados.map((op) => (
                  <tr key={op.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-black text-slate-900 dark:text-white">
                      {op.nombre}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                        {op.area}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-medium">
                      {op.cedula || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleActivo(op)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold rounded-full transition-colors cursor-pointer ${
                          op.activo
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-300'
                        }`}
                      >
                        {op.activo ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Activo</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Inactivo</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => abrirEditar(op)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-white cursor-pointer transition-colors"
                        title="Editar operador"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Crear / Editar */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {editandoId ? 'Editar Operario' : 'Registrar Nuevo Operario'}
              </h3>
              <button
                type="button"
                onClick={() => setModalAbierto(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleGuardar} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  required
                  value={formNombre}
                  onChange={(e) => setFormNombre(e.target.value)}
                  placeholder="Ej. ANGEL"
                  className="w-full px-3 py-2 text-xs font-bold uppercase rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Área de Trabajo
                </label>
                <select
                  value={formArea}
                  onChange={(e) => setFormArea(e.target.value as AreaOperadorTipo)}
                  className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 cursor-pointer outline-none"
                >
                  <option value="EXTRUSION">Extrusión</option>
                  <option value="SELLADO">Sellado</option>
                  <option value="IMPRESION">Impresión / Serigrafía</option>
                  <option value="REFILADO">Refilado</option>
                  <option value="PELETIZADO">Peletizado</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Cédula / Identificación (Opcional)
                </label>
                <input
                  type="text"
                  value={formCedula}
                  onChange={(e) => setFormCedula(e.target.value)}
                  placeholder="Ej. V-12.345.678"
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {guardando ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : editandoId ? (
                    'Guardar Cambios'
                  ) : (
                    'Registrar'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

