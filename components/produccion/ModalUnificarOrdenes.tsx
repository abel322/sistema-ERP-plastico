'use client';

import React, { useState, useMemo } from 'react';
import { Layers, CheckCircle2, AlertTriangle, Loader2, X, Sparkles, Scale, Info } from 'lucide-react';
import { unificarOrdenesExtrusionAction } from '@/actions/produccion';
import { useToast } from '@/hooks/use-toast';

interface Props {
  ordenesExtrusion: any[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ModalUnificarOrdenes({
  ordenesExtrusion,
  isOpen,
  onClose,
  onSuccess,
}: Props) {
  const { toast } = useToast();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [madreId, setMadreId] = useState<string>('');
  const [nombreUnificado, setNombreUnificado] = useState('');
  const [loading, setLoading] = useState(false);

  // Filtrar solo órdenes activas de Extrusión que no estén ya unificadas
  const ordenesDisponibles = useMemo(() => {
    return ordenesExtrusion.filter(
      (o) => o.area === 'Extrusion' && o.estado === 'EnProceso' && o.estado !== 'Unificada'
    );
  }, [ordenesExtrusion]);

  if (!isOpen) return null;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const exists = prev.includes(id);
      const next = exists ? prev.filter((item) => item !== id) : [...prev, id];
      // Si la que era madre se deselecciona, reasignar a la primera disponible
      if (exists && madreId === id) {
        setMadreId(next[0] || '');
      } else if (!exists && next.length === 1) {
        setMadreId(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    const allIds = ordenesDisponibles.map((o) => o.id);
    setSelectedIds(allIds);
    if (!madreId && allIds.length > 0) {
      setMadreId(allIds[0]);
    }
  };

  const clearSelection = () => {
    setSelectedIds([]);
    setMadreId('');
  };

  // Calcular meta combinada
  const metaTotalCalculada = selectedIds.reduce((sum, id) => {
    const ord = ordenesDisponibles.find((o) => o.id === id);
    if (!ord) return sum;
    if (ord.metaKg && ord.metaKg > 0) return sum + ord.metaKg;
    if (ord.pedido?.cantidadSolicitada && ord.unidad === 'Kilogramos') return sum + ord.pedido.cantidadSolicitada;
    if (ord.pedido?.cantidadSolicitada && ord.pedido?.productoCliente?.pesoPorUnidad) {
      return sum + (ord.pedido.cantidadSolicitada * ord.pedido.productoCliente.pesoPorUnidad) / 1000;
    }
    return sum + (Number(ord.cantidadProducida) || 0);
  }, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIds.length < 2) {
      toast({
        title: 'Selección insuficiente',
        description: 'Debes seleccionar al menos 2 órdenes activas de extrusión para unificarlas.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const res = await unificarOrdenesExtrusionAction({
        ordenesIds: selectedIds,
        ordenPrincipalId: madreId || selectedIds[0],
        nombreUnificado: nombreUnificado.trim() || undefined,
      });

      if (res.success) {
        toast({
          title: 'Órdenes Unificadas',
          description: res.message || 'Se ha creado la Orden Madre y unificado las secundarias.',
        });
        onSuccess();
        onClose();
      } else {
        toast({
          title: 'Error al unificar',
          description: res.error || 'No se pudo completar la unificación.',
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      console.error('Error al unificar:', err);
      toast({
        title: 'Error',
        description: err.message || 'Ocurrió un error inesperado al unificar órdenes.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Cabecera */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                Unificar Órdenes en Extrusión
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                  Orden Madre
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Fusiona 2 o más órdenes activas en una sola corrida de extrusión con meta combinada en KG.
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

        {/* Contenido scrolleable */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-4 space-y-4">
          {/* Instrucciones y controles de selección rápida */}
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>
              Selecciona las órdenes compatibles ({selectedIds.length} seleccionada{selectedIds.length === 1 ? '' : 's'}):
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={selectAll}
                className="font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 cursor-pointer"
              >
                Seleccionar todas
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={clearSelection}
                className="font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 cursor-pointer"
              >
                Limpiar
              </button>
            </div>
          </div>

          {/* Lista de órdenes activas */}
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {ordenesDisponibles.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2 opacity-80" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  No hay órdenes activas de Extrusión para unificar
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Crea al menos dos órdenes en Extrusión para poder fusionarlas.
                </p>
              </div>
            ) : (
              ordenesDisponibles.map((ord) => {
                const isSelected = selectedIds.includes(ord.id);
                const isMadre = madreId === ord.id;
                const prodNombre =
                  ord.pedido?.productoCliente?.nombreProducto ||
                  ord.productoCliente?.nombreProducto ||
                  ord.pedido?.cliente?.nombre ||
                  'Producción Interna';
                const loteDisplay = ord.codigoLote || ord.id.slice(0, 8).toUpperCase();
                const maquinaNombre = ord.maquina?.nombre || 'Extrusora';
                const metaKg = ord.metaKg || ord.pedido?.cantidadSolicitada || 0;

                return (
                  <div
                    key={ord.id}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? isMadre
                          ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 ring-1 ring-indigo-600'
                          : 'border-slate-300 bg-slate-50 dark:bg-slate-800/60 dark:border-slate-700'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50/60 dark:hover:bg-slate-800/40'
                    }`}
                    onClick={() => toggleSelect(ord.id)}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}} // maneja el onClick del div
                        className="w-4 h-4 rounded text-indigo-600 accent-indigo-600 cursor-pointer"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-black text-slate-900 dark:text-white">
                            {loteDisplay}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {maquinaNombre}
                          </span>
                          {isMadre && (
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-indigo-600 text-white shadow-xs">
                              Principal / Madre
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 font-medium truncate max-w-sm mt-0.5" title={prodNombre}>
                          {prodNombre}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-black text-slate-900 dark:text-white block">
                        {metaKg > 0 ? `${metaKg.toLocaleString('es-ES')} KG` : `${Number(ord.cantidadProducida || 0).toFixed(2)} KG`}
                      </span>
                      {isSelected && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMadreId(ord.id);
                          }}
                          className={`text-[10px] font-bold mt-1 px-2 py-0.5 rounded-lg transition-colors cursor-pointer ${
                            isMadre
                              ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-100/70 dark:bg-indigo-900/40'
                              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 bg-slate-100 dark:bg-slate-800'
                          }`}
                        >
                          {isMadre ? '✓ Seleccionada como Madre' : 'Hacer Madre'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Nombre descriptivo opcional */}
          {selectedIds.length >= 2 && (
            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                Nombre identificador / etiqueta (opcional):
              </label>
              <input
                type="text"
                value={nombreUnificado}
                onChange={(e) => setNombreUnificado(e.target.value)}
                placeholder="ej. Cestera 60(21+21) Combinada - Lote Unificado"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          )}

          {/* Resumen del impacto de unificación */}
          {selectedIds.length >= 2 && (
            <div className="p-3.5 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-indigo-600" />
                  Meta Combinada en KG:
                </span>
                <span className="font-black text-sm text-indigo-950 dark:text-white">
                  {metaTotalCalculada.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} KG
                </span>
              </div>
              <div className="flex items-start gap-2 text-[11px] text-indigo-700 dark:text-indigo-300">
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-indigo-500" />
                <p>
                  La <strong>Orden Madre</strong> mantendrá la extrusora activa y soplara el total de {metaTotalCalculada.toFixed(2)} KG de bobina compartida. Las {selectedIds.length - 1} órdenes secundarias quedarán enlazadas y liberarán sus máquinas asignadas.
                </p>
              </div>
            </div>
          )}
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
            disabled={loading || selectedIds.length < 2}
            className="flex-[2] flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-xs font-black uppercase tracking-wider text-white disabled:opacity-50 transition-all shadow-lg shadow-indigo-100 dark:shadow-none cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Unificando Órdenes...
              </>
            ) : (
              <>
                <Layers className="w-4 h-4" />
                Unificar {selectedIds.length} Órdenes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

