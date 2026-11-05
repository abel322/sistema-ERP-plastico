'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Split,
  Plus,
  Trash2,
  AlertTriangle,
  Loader2,
  X,
  Workflow,
  Sparkles,
  Layers,
  ChevronRight,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { avanzarASelladoMultiLineaAction } from '@/actions/produccion';
import type { LineaSelladoConfig } from '@/types/produccion';
import { useToast } from '@/hooks/use-toast';

interface Props {
  ordenExtrusion: any;
  maquinas: any[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface LineaFormState {
  id: string;
  nombreVariante: string;
  maquinaId: string;
  metaKg: string;
  metaUnidades: string;
  operario: string;
  turno: 'Manana' | 'Tarde' | 'Noche';
}

const TURNOS = [
  { value: 'Manana', label: 'Mañana' },
  { value: 'Tarde', label: 'Tarde' },
  { value: 'Noche', label: 'Noche' },
];

export function ModalAvanzarSelladoMultiLinea({
  ordenExtrusion,
  maquinas,
  isOpen,
  onClose,
  onSuccess,
}: Props) {
  const { toast } = useToast();
  const [modoAvance, setModoAvance] = useState<'paralelo' | 'finalizar'>('paralelo');
  const [lineas, setLineas] = useState<LineaFormState[]>([]);
  const [loading, setLoading] = useState(false);

  // Filtrar máquinas selladoras
  const selladoras = useMemo(() => {
    return maquinas.filter((m) => m.area === 'Sellado');
  }, [maquinas]);

  // Inicializar líneas al abrir modal
  useEffect(() => {
    if (!isOpen || !ordenExtrusion) return;

    const prodNombre =
      ordenExtrusion.pedido?.productoCliente?.nombreProducto ||
      ordenExtrusion.productoCliente?.nombreProducto ||
      ordenExtrusion.pedido?.cliente?.nombre ||
      'Bolsas';

    const nombreVar = (ordenExtrusion.nombreVariante || '').toLowerCase();
    const esCesteraUnificada =
      (nombreVar.includes('lisa') && nombreVar.includes('perforada')) ||
      (ordenExtrusion.esOrdenMadre && prodNombre.toLowerCase().includes('cestera'));

    if (esCesteraUnificada) {
      setLineas([
        {
          id: 'linea-1',
          nombreVariante: 'Cestera lisa 60(21+21)C3',
          maquinaId: selladoras[0]?.id || '',
          metaKg: '3488.40',
          metaUnidades: '200000',
          operario: ordenExtrusion.operario || '',
          turno: 'Manana',
        },
        {
          id: 'linea-2',
          nombreVariante: 'Cestera 60(21+21) perforada',
          maquinaId: selladoras[1]?.id || selladoras[0]?.id || '',
          metaKg: '3052.35',
          metaUnidades: '150000',
          operario: ordenExtrusion.operario || '',
          turno: 'Manana',
        },
      ]);
    } else if (ordenExtrusion.ordenesSelladoHijas && ordenExtrusion.ordenesSelladoHijas.some((h: any) => h.estado === 'Unificada')) {
      const secundarias = ordenExtrusion.ordenesSelladoHijas.filter((h: any) => h.estado === 'Unificada');
      const metaMadreLimpia = ordenExtrusion.metaKg && Number(ordenExtrusion.metaKg) < 100000
        ? Number(ordenExtrusion.metaKg).toFixed(2)
        : '';
      const lineasAuto: LineaFormState[] = [
        {
          id: 'linea-1',
          nombreVariante: prodNombre,
          maquinaId: selladoras[0]?.id || '',
          metaKg: metaMadreLimpia,
          metaUnidades: ordenExtrusion.pedido?.cantidadSolicitada ? String(ordenExtrusion.pedido.cantidadSolicitada) : '',
          operario: ordenExtrusion.operario || '',
          turno: 'Manana',
        },
      ];
      secundarias.forEach((sec: any, sIdx: number) => {
        const secNom = sec.pedido?.productoCliente?.nombreProducto || sec.productoCliente?.nombreProducto || `Variante ${sIdx + 2}`;
        const secSelladora = selladoras[sIdx + 1]?.id || selladoras[0]?.id || '';
        const secMetaLimpia = sec.metaKg && Number(sec.metaKg) < 100000 ? Number(sec.metaKg).toFixed(2) : '';
        lineasAuto.push({
          id: `linea-${sIdx + 2}`,
          nombreVariante: secNom,
          maquinaId: secSelladora,
          metaKg: secMetaLimpia,
          metaUnidades: sec.pedido?.cantidadSolicitada ? String(sec.pedido.cantidadSolicitada) : '',
          operario: sec.operario || ordenExtrusion.operario || '',
          turno: 'Manana',
        });
      });
      setLineas(lineasAuto);
    } else {
      const metaLimpia = ordenExtrusion.metaKg && Number(ordenExtrusion.metaKg) < 100000 && Number(ordenExtrusion.metaKg) > 0
        ? Number(ordenExtrusion.metaKg).toFixed(2)
        : '';
      setLineas([
        {
          id: 'linea-1',
          nombreVariante: ordenExtrusion.nombreVariante || prodNombre,
          maquinaId: selladoras[0]?.id || '',
          metaKg: metaLimpia,
          metaUnidades: ordenExtrusion.pedido?.unidad === 'Unidades' && ordenExtrusion.pedido?.cantidadSolicitada
            ? String(ordenExtrusion.pedido.cantidadSolicitada)
            : '',
          operario: ordenExtrusion.operario || '',
          turno: 'Manana',
        },
      ]);
    }
    setModoAvance('paralelo');
  }, [isOpen, ordenExtrusion, selladoras]);

  if (!isOpen || !ordenExtrusion) return null;

  const loteDisplay = ordenExtrusion.codigoLote || ordenExtrusion.id.slice(0, 8).toUpperCase();
  const prodNombre =
    ordenExtrusion.pedido?.productoCliente?.nombreProducto ||
    ordenExtrusion.productoCliente?.nombreProducto ||
    ordenExtrusion.pedido?.cliente?.nombre ||
    'Bobina Extruida';

  const bobinaDisponibleKg = Number(
    ordenExtrusion.bobinaDisponibleKg ?? ordenExtrusion.stockPrevio?.cantidad ?? ordenExtrusion.cantidadProducida ?? 0
  );

  const handleAgregarLinea = () => {
    const nextIndex = lineas.length + 1;
    // Asignar preferentemente una selladora no usada aún
    const maquinasUsadas = new Set(lineas.map((l) => l.maquinaId));
    const selladoraLibre = selladoras.find((s) => !maquinasUsadas.has(s.id)) || selladoras[0];

    const sugerenciaVariante = `${prodNombre} - Variante ${nextIndex}`;

    setLineas((prev) => [
      ...prev,
      {
        id: `linea-${Date.now()}-${nextIndex}`,
        nombreVariante: sugerenciaVariante,
        maquinaId: selladoraLibre?.id || '',
        metaKg: '',
        metaUnidades: '',
        operario: '',
        turno: 'Manana',
      },
    ]);
  };

  const handleEliminarLinea = (id: string) => {
    if (lineas.length <= 1) return;
    setLineas((prev) => prev.filter((l) => l.id !== id));
  };

  const handleActualizarLinea = (id: string, campo: keyof LineaFormState, valor: any) => {
    setLineas((prev) =>
      prev.map((l) => (l.id === id ? { ...l, [campo]: valor } : l))
    );
  };

  // Suma de KGs asignados
  const totalKgAsignados = lineas.reduce((acc, l) => {
    const kg = parseFloat(l.metaKg);
    return acc + (isNaN(kg) ? 0 : kg);
  }, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar líneas
    for (let i = 0; i < lineas.length; i++) {
      if (!lineas[i].maquinaId) {
        toast({
          title: 'Máquina requerida',
          description: `Selecciona una Selladora para la Línea ${i + 1}.`,
          variant: 'destructive',
        });
        return;
      }
    }

    setLoading(true);
    try {
      const lineasConfig: LineaSelladoConfig[] = lineas.map((l) => ({
        nombreVariante: l.nombreVariante.trim() || prodNombre,
        maquinaId: l.maquinaId,
        metaKg: l.metaKg ? parseFloat(l.metaKg) : undefined,
        metaUnidades: l.metaUnidades ? parseInt(l.metaUnidades, 10) : undefined,
        operario: l.operario.trim() || undefined,
        turno: l.turno as any,
      }));

      const res = await avanzarASelladoMultiLineaAction({
        ordenExtrusionId: ordenExtrusion.id,
        lineas: lineasConfig,
        modoAvance,
      });

      if (res.success) {
        toast({
          title: 'Líneas de Sellado Iniciadas',
          description: res.message || 'Se han creado las fases de sellado vinculadas a la bobina compartida.',
        });
        onSuccess();
        onClose();
      } else {
        toast({
          title: 'Error al avanzar a Sellado',
          description: res.error || 'No se pudieron iniciar las líneas de sellado.',
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      console.error('Error al avanzar a sellado multi-línea:', err);
      toast({
        title: 'Error',
        description: err.message || 'Ocurrió un error inesperado.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full p-6 shadow-2xl flex flex-col max-h-[92vh]">
        {/* Cabecera */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300">
              <Split className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                Avanzar a Sellado (Distribución Multi-Línea)
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  Pozo WIP Compartido
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Lote Madre: <strong className="font-mono text-slate-800 dark:text-slate-200">{loteDisplay}</strong> ({prodNombre})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario y líneas */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-4 space-y-5">
          {/* Tarjeta de estado de bobina disponible */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Bobina Disponible en Piso (Extrusión)
              </span>
              <span className="text-lg font-black text-slate-900 dark:text-white">
                {bobinaDisponibleKg.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} KG
              </span>
            </div>

            {/* Selector de Modo de Avance */}
            <div className="flex bg-slate-200 dark:bg-slate-700/60 p-1 rounded-xl gap-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setModoAvance('paralelo')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  modoAvance === 'paralelo'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Modo Paralelo (Recomendado)
              </button>
              <button
                type="button"
                onClick={() => setModoAvance('finalizar')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  modoAvance === 'finalizar'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Finalizar Extrusión
              </button>
            </div>
          </div>

          {/* Listado dinámico de líneas de Sellado */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Workflow className="w-4 h-4 text-indigo-600" />
                Líneas de Sellado a Iniciar ({lineas.length})
              </h4>
              <button
                type="button"
                onClick={handleAgregarLinea}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition-all border border-indigo-200 dark:border-indigo-800 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                + Añadir Línea de Sellado
              </button>
            </div>

            <div className="space-y-3">
              {lineas.map((linea, idx) => (
                <div
                  key={linea.id}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-indigo-600 text-white flex items-center gap-1">
                      Línea {idx + 1}
                    </span>

                    {lineas.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleEliminarLinea(linea.id)}
                        className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Eliminar esta línea"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Nombre de la Variante / Producto Final */}
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                        Variante / Producto Final:
                      </label>
                      <input
                        type="text"
                        required
                        value={linea.nombreVariante}
                        onChange={(e) => handleActualizarLinea(linea.id, 'nombreVariante', e.target.value)}
                        placeholder="ej. Cestera 60(21+21) Perforada"
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>

                    {/* Máquina Selladora */}
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                        Máquina Selladora Destino:
                      </label>
                      <select
                        required
                        value={linea.maquinaId}
                        onChange={(e) => handleActualizarLinea(linea.id, 'maquinaId', e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                      >
                        <option value="">Seleccionar Selladora...</option>
                        {selladoras.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.nombre}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Meta en KG (Opcional) */}
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                        Meta en KG para esta Línea (opcional):
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={linea.metaKg}
                        onChange={(e) => handleActualizarLinea(linea.id, 'metaKg', e.target.value)}
                        placeholder="ej. 250.00"
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>

                    {/* Meta en Unidades (Bolsas, opcional) */}
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                        Meta en Unidades / Bolsas (opcional):
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={linea.metaUnidades}
                        onChange={(e) => handleActualizarLinea(linea.id, 'metaUnidades', e.target.value)}
                        placeholder="ej. 5000"
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Información del pozo compartido */}
          <div className="p-3.5 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 rounded-2xl flex items-start gap-2.5">
            <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div className="text-xs text-indigo-900 dark:text-indigo-200 space-y-1">
              <p className="font-bold">
                Pozo de Bobina Compartido en Tiempo Real:
              </p>
              <p className="text-[11px] text-indigo-700 dark:text-indigo-300">
                Las <strong>{lineas.length} selladoras</strong> consumirán bobina del mismo lote madre <strong className="font-mono">{loteDisplay}</strong>. A medida que cualquiera de las selladoras registre paquetes cortados, el inventario de bobina se descontará sincronizadamente del mismo saldo disponible.
              </p>
            </div>
          </div>
        </form>

        {/* Botones de acción */}
        <div className="flex gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="flex-[2] flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-xs font-black uppercase tracking-wider text-white disabled:opacity-50 transition-all shadow-lg shadow-indigo-100 dark:shadow-none cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Iniciando Líneas...
              </>
            ) : (
              <>
                <Split className="w-4 h-4" />
                Iniciar {lineas.length} Línea{lineas.length === 1 ? '' : 's'} de Sellado
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

