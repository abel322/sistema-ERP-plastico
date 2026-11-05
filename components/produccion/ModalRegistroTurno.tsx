'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  ChevronDown,
  ClipboardList,
  AlertTriangle,
  Loader2,
  Save,
  X,
} from 'lucide-react';
import { obtenerOperadoresPorAreaAction } from '@/actions/operadores';
import type { AreaOperadorTipo, OperadorItem } from '@/types/operadores';
import { calculateBagWeight, getPlasticDensity } from '@/lib/utils/bag-weight';
import {
  determinarCamposMerma,
  MermaFieldConfig,
  ProductoMermaInfo,
} from '@/lib/merma-logic';
import { getTodayInputDate } from '@/lib/utils/dates';
import { formatNumber } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export interface ModalRegistroTurnoProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  orden: any;
  isEdit?: boolean;
  editRegistroId?: string | null;
  initialData?: {
    turno?: string;
    fecha?: string;
    operario?: string;
    cantidad?: string | number;
    reporte?: string;
    mermaTransparenteAlta?: string;
    mermaBlancoPollo?: string;
    mermaColor?: string;
    mermaTransparenteBaja?: string;
    mermaBlancoPego?: string;
  };
}

function mapAreaToAreaOperador(area?: string): AreaOperadorTipo {
  if (!area) return 'EXTRUSION';
  const a = area.toUpperCase();
  if (a.includes('EXTRU')) return 'EXTRUSION';
  if (a.includes('SELLA')) return 'SELLADO';
  if (a.includes('SERI') || a.includes('IMPRE')) return 'IMPRESION';
  if (a.includes('REFI')) return 'REFILADO';
  if (a.includes('PELE')) return 'PELETIZADO';
  return 'EXTRUSION';
}

function getAreaLabel(area?: string): string {
  if (!area) return 'Producción';
  const a = area.toUpperCase();
  if (a.includes('EXTRU')) return 'Extrusión';
  if (a.includes('SELLA')) return 'Sellado';
  if (a.includes('SERI') || a.includes('IMPRE')) return 'Impresión / Serigrafía';
  if (a.includes('REFI')) return 'Refilado';
  if (a.includes('PELE')) return 'Peletizado';
  return area;
}

export function ModalRegistroTurno({
  isOpen,
  onClose,
  onSuccess,
  orden,
  isEdit = false,
  editRegistroId = null,
  initialData,
}: ModalRegistroTurnoProps) {
  const { toast } = useToast();

  const [turno, setTurno] = useState('Día (12h)');
  const [fecha, setFecha] = useState(getTodayInputDate());
  const [operarioSeleccionado, setOperarioSeleccionado] = useState('');
  const [operadores, setOperadores] = useState<OperadorItem[]>([]);
  const [cargandoOperadores, setCargandoOperadores] = useState(true);

  const [cantidad, setCantidad] = useState('');
  const [reporte, setReporte] = useState('');
  const [mermas, setMermas] = useState<Record<string, string>>({
    mermaTransparenteAlta: '',
    mermaBlancoPollo: '',
    mermaColor: '',
    mermaTransparenteBaja: '',
    mermaBlancoPego: '',
  });

  const [saving, setSaving] = useState(false);

  const areaActual = mapAreaToAreaOperador(orden?.areaActual || orden?.area);
  const STORAGE_KEY_OPERADOR = `ultimo_operador_${areaActual}`;

  // Cargar operadores activos del área y restaurar memoria persistente
  useEffect(() => {
    if (!isOpen || !orden) return;

    let isMounted = true;
    const cargarOperadores = async () => {
      setCargandoOperadores(true);
      const res = await obtenerOperadoresPorAreaAction(areaActual);
      if (!isMounted) return;

      if (res.success && res.operadores && res.operadores.length > 0) {
        const lista = res.operadores as OperadorItem[];
        setOperadores(lista);

        // Si estamos editando y viene un operario inicial, respetarlo
        if (isEdit && initialData?.operario) {
          setOperarioSeleccionado(initialData.operario);
        } else {
          // Intentar recuperar el último trabajador seleccionado en este navegador para esta área
          try {
            const guardado = localStorage.getItem(STORAGE_KEY_OPERADOR);
            const existeEnLista = lista.some((op) => op.nombre === guardado);

            if (guardado && existeEnLista) {
              setOperarioSeleccionado(guardado);
            } else {
              setOperarioSeleccionado(lista[0].nombre);
              localStorage.setItem(STORAGE_KEY_OPERADOR, lista[0].nombre);
            }
          } catch (err) {
            setOperarioSeleccionado(lista[0].nombre);
          }
        }
      } else {
        setOperadores([]);
        if (!isEdit || !initialData?.operario) {
          setOperarioSeleccionado('');
        }
      }
      setCargandoOperadores(false);
    };

    cargarOperadores();

    return () => {
      isMounted = false;
    };
  }, [isOpen, orden, areaActual, isEdit, initialData?.operario, STORAGE_KEY_OPERADOR]);

  // Sincronizar datos iniciales al abrir
  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      const initialTurno = initialData.turno || 'Día (12h)';
      setTurno(
        initialTurno.includes('Noche') || initialTurno === 'Noche12H'
          ? 'Noche (12h)'
          : 'Día (12h)'
      );
      setFecha(initialData.fecha || getTodayInputDate());
      if (initialData.operario) {
        setOperarioSeleccionado(initialData.operario);
      }
      setCantidad(initialData.cantidad ? String(initialData.cantidad) : '');
      setReporte(initialData.reporte || '');
      setMermas({
        mermaTransparenteAlta: initialData.mermaTransparenteAlta || '',
        mermaBlancoPollo: initialData.mermaBlancoPollo || '',
        mermaColor: initialData.mermaColor || '',
        mermaTransparenteBaja: initialData.mermaTransparenteBaja || '',
        mermaBlancoPego: initialData.mermaBlancoPego || '',
      });
    } else {
      setTurno('Día (12h)');
      setFecha(getTodayInputDate());
      setCantidad('');
      setReporte('');
      setMermas({
        mermaTransparenteAlta: '',
        mermaBlancoPollo: '',
        mermaColor: '',
        mermaTransparenteBaja: '',
        mermaBlancoPego: '',
      });
    }
  }, [isOpen, initialData]);

  // Manejador del cambio de operador que actualiza el estado y persiste en localStorage
  const handleSeleccionOperario = (nombre: string) => {
    setOperarioSeleccionado(nombre);
    if (nombre) {
      try {
        localStorage.setItem(STORAGE_KEY_OPERADOR, nombre);
      } catch (e) {
        console.error('Error al guardar operador en localStorage:', e);
      }
    }
  };

  // Determinar campos de merma aplicables
  const camposMermaVisibles: MermaFieldConfig[] = useMemo(() => {
    if (!orden) return [];
    const prodCliente = orden.pedido?.productoCliente || orden.productoCliente;
    const llevaImpresion = Boolean(
      prodCliente?.conImpresion ??
      orden.pedido?.cliente?.conImpresion ??
      orden.stockPrevio?.conImpresion ??
      orden.stockPrevio?.area === 'Serigrafia'
    );
    const productoMerma: ProductoMermaInfo = {
      ...prodCliente,
      llevaImpresion,
      conImpresion: llevaImpresion,
    };
    return determinarCamposMerma(orden.area, productoMerma);
  }, [orden]);

  // Totalizador de merma en vivo
  const mTotalLive = useMemo(() => {
    return camposMermaVisibles.reduce(
      (sum, c) => sum + (parseFloat(mermas[c.key] || '0') || 0),
      0
    );
  }, [camposMermaVisibles, mermas]);

  // Cálculo de bobina WIP si es Sellado
  const wipSellado = useMemo(() => {
    if (!orden || orden.area !== 'Sellado') return null;

    const prodCliente = orden.pedido?.productoCliente || orden.productoCliente;
    let pesoGramos = prodCliente?.pesoPorUnidad || 0;
    if (!pesoGramos && prodCliente?.ancho && prodCliente?.largo && prodCliente?.calibre) {
      const densidad = getPlasticDensity(prodCliente.material);
      pesoGramos = calculateBagWeight({
        tipoBolsa:
          prodCliente.anchoValvula && prodCliente.anchoValvula > 0
            ? 'valvula'
            : prodCliente.anchoFuelle && prodCliente.anchoFuelle > 0
            ? 'fuelle'
            : 'sencilla',
        ancho: prodCliente.ancho,
        largo: prodCliente.largo,
        calibre: prodCliente.calibre,
        fuelle: prodCliente.anchoFuelle,
        solapa: prodCliente.anchoSolapa,
        densidad,
      });
    }

    const bolsas = parseFloat(cantidad || '0') || 0;
    const kgBolsas = pesoGramos > 0 ? (bolsas * pesoGramos) / 1000 : 0;
    const kgConsumoTotal = kgBolsas + mTotalLive;
    const bobinaDisponible = orden.stockPrevio?.cantidad ?? 0;
    const maxPermitido = bobinaDisponible * 1.05; // 5% tolerancia
    const saldoInsuficiente = kgConsumoTotal > maxPermitido;
    const saldoRestanteEstimado = Math.max(0, bobinaDisponible - kgConsumoTotal);

    return {
      pesoGramos,
      bolsas,
      kgBolsas,
      kgConsumoTotal,
      bobinaDisponible,
      saldoInsuficiente,
      saldoRestanteEstimado,
    };
  }, [orden, cantidad, mTotalLive]);

  if (!isOpen || !orden) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!operarioSeleccionado.trim()) {
      toast({
        title: 'Operario requerido',
        description: 'Por favor selecciona o ingresa el operario responsable.',
        variant: 'destructive',
      });
      return;
    }

    if (wipSellado?.saldoInsuficiente) {
      toast({
        title: 'Bobina insuficiente',
        description: `El consumo estimado (${wipSellado.kgConsumoTotal.toFixed(2)} kg) supera la bobina disponible en piso (${wipSellado.bobinaDisponible.toFixed(2)} kg).`,
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const visibleKeys = new Set(camposMermaVisibles.map((c) => c.key));
      const mAlta = visibleKeys.has('mermaTransparenteAlta')
        ? parseFloat(mermas.mermaTransparenteAlta || '0') || 0
        : 0;
      const mPollo = visibleKeys.has('mermaBlancoPollo')
        ? parseFloat(mermas.mermaBlancoPollo || '0') || 0
        : 0;
      const mColor = visibleKeys.has('mermaColor')
        ? parseFloat(mermas.mermaColor || '0') || 0
        : 0;
      const mBaja = visibleKeys.has('mermaTransparenteBaja')
        ? parseFloat(mermas.mermaTransparenteBaja || '0') || 0
        : 0;
      const mPego = visibleKeys.has('mermaBlancoPego')
        ? parseFloat(mermas.mermaBlancoPego || '0') || 0
        : 0;
      const mTotal = mAlta + mPollo + mColor + mBaja + mPego;

      const payload = {
        turno,
        fecha,
        operario: operarioSeleccionado,
        cantidad: cantidad || '0',
        reporte,
        merma: mTotal.toString(),
        mermaTransparenteAlta: mAlta.toString(),
        mermaBlancoPollo: mPollo.toString(),
        mermaColor: mColor.toString(),
        mermaTransparenteBaja: mBaja.toString(),
        mermaBlancoPego: mPego.toString(),
        mermaCristal: mAlta.toString(),
        mermaSinImpresion: mAlta.toString(),
        mermaImpreso: mColor.toString(),
      };

      let res;
      if (isEdit && editRegistroId) {
        res = await fetch(`/api/produccion/${orden.id}/registros/${editRegistroId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`/api/produccion/${orden.id}/registros`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json().catch(() => ({}));

      if (res.ok || data?.success) {
        toast({
          title: 'Éxito',
          description:
            data?.message ||
            (isEdit ? 'Registro actualizado correctamente' : 'Turno registrado correctamente'),
        });
        onSuccess();
        onClose();
      } else {
        toast({
          title: 'Error',
          description: data?.error || data?.message || 'Ocurrió un error al guardar el registro',
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      console.error('Error al registrar turno:', err);
      toast({
        title: 'Error',
        description: err.message || 'Error de conexión al registrar turno',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const isBloqueado = Boolean(wipSellado?.saldoInsuficiente);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-[2.5rem] bg-white dark:bg-slate-900 p-8 shadow-2xl border border-slate-200 dark:border-slate-800 transition-colors"
      >
        {/* Cabecera */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200 dark:shadow-none">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
                {isEdit ? 'Editar Registro' : 'Añadir Registro'}
              </h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                {getAreaLabel(orden.area)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* FILA TURNO (EXCLUSIVAMENTE 12 HORAS) Y DÍA */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-[11px] font-bold tracking-wider text-slate-500 uppercase mb-1">
                Turno
              </label>
              <div className="relative">
                <select
                  value={turno}
                  onChange={(e) => setTurno(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 appearance-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="Día (12h)">Día (12 Horas)</option>
                  <option value="Noche (12h)">Noche (12 Horas)</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold tracking-wider text-slate-500 uppercase mb-1">
                Día
              </label>
              <input
                type="date"
                required
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* SELECTOR DE OPERARIO RESPONSABLE CON PERSISTENCIA */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                Operario Responsable
              </label>
              <Link
                className="text-[11px] font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                href="/operadores"
                target="_blank"
              >
                Administrar nómina
              </Link>
            </div>

            <div className="relative">
              <select
                value={operarioSeleccionado}
                disabled={cargandoOperadores}
                onChange={(e) => handleSeleccionOperario(e.target.value)}
                className="w-full px-3 py-2.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 appearance-none focus:ring-2 focus:ring-blue-500 cursor-pointer disabled:opacity-50"
              >
                {operadores.length === 0 ? (
                  <option value="">No hay operadores registrados en {areaActual}</option>
                ) : (
                  operadores.map((op) => (
                    <option key={op.id} value={op.nombre}>
                      {op.nombre}
                    </option>
                  ))
                )}
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Cantidad Producida */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
              Cantidad Producida
            </label>
            <div className="relative">
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                placeholder="0.00"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3 text-sm font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
              <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase">
                {orden.unidad === 'Kilogramos' ? 'KG' : 'UND'}
              </span>
            </div>
          </div>

          {/* Clasificación Dinámica de Merma / Scrap */}
          {camposMermaVisibles.length > 0 && (
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between ml-1">
                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  Clasificación de Merma / Scrap (kg)
                </label>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  {camposMermaVisibles.length === 1
                    ? '1 campo aplicable'
                    : `${camposMermaVisibles.length} campos aplicables`}
                </span>
              </div>

              <div
                className={`grid grid-cols-1 ${camposMermaVisibles.length > 1 ? 'sm:grid-cols-2' : ''} gap-3`}
              >
                {camposMermaVisibles.map((item) => {
                  const val = mermas[item.key] || '';
                  return (
                    <div key={item.key} className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 flex items-center justify-between px-1">
                        <span className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${item.colorClass} shrink-0`} />
                          <span className="font-semibold">{item.label}</span>
                        </span>
                        <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider shrink-0 ml-1">
                          {item.molidoBadge}
                        </span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={val}
                          onChange={(e) =>
                            setMermas((prev) => ({ ...prev, [item.key]: e.target.value }))
                          }
                          className={`w-full bg-slate-50 dark:bg-slate-800 border ${item.borderClass} rounded-2xl px-4 py-2.5 text-sm font-black text-slate-900 dark:text-white outline-none transition-all`}
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase">
                          KG
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Totalizador en Vivo de Merma */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="font-bold text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-wider">
                  Total Merma del Turno:
                </span>
                <span className="font-black text-rose-600 dark:text-rose-400 text-xs">
                  {formatNumber(mTotalLive, { minDecimals: 2, maxDecimals: 2 })} KG
                </span>
              </div>
            </div>
          )}

          {/* Cálculo Dinámico de Bobina en Proceso (WIP) para Sellado */}
          {wipSellado && (
            <div
              className={`p-4 rounded-2xl border transition-all ${
                wipSellado.saldoInsuficiente
                  ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-900/60'
                  : 'bg-indigo-50/60 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/40'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Equivalente Consumido de Bobina (WIP)
                </span>
                <span
                  className={`text-xs font-black ${
                    wipSellado.saldoInsuficiente
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-indigo-600 dark:text-indigo-400'
                  }`}
                >
                  {formatNumber(wipSellado.kgConsumoTotal, { minDecimals: 2, maxDecimals: 2 })} KG
                </span>
              </div>

              <div className="text-[10px] font-medium text-slate-600 dark:text-slate-400 space-y-1">
                <div className="flex justify-between">
                  <span>
                    Bolsas producidas ({wipSellado.bolsas.toLocaleString('es-ES')} unds ×{' '}
                    {wipSellado.pesoGramos.toFixed(2)} g):
                  </span>
                  <span className="font-bold">
                    {formatNumber(wipSellado.kgBolsas, { minDecimals: 2, maxDecimals: 2 })} kg
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Merma / Scrap de sellado:</span>
                  <span className="font-bold">
                    {formatNumber(mTotalLive, { minDecimals: 2, maxDecimals: 2 })} kg
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200/60 dark:border-slate-800">
                  <span>Bobina disponible en piso:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {formatNumber(wipSellado.bobinaDisponible, { minDecimals: 2, maxDecimals: 2 })} kg
                  </span>
                </div>
                {!wipSellado.saldoInsuficiente && (
                  <div className="flex justify-between">
                    <span>Saldo restante proyectado:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {formatNumber(wipSellado.saldoRestanteEstimado, { minDecimals: 2, maxDecimals: 2 })}{' '}
                      kg
                    </span>
                  </div>
                )}
              </div>

              {wipSellado.saldoInsuficiente && (
                <div className="mt-3 p-2.5 rounded-xl bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-200 text-xs font-bold flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                  <span>
                    No hay suficiente bobina en piso. Requerido: {wipSellado.kgConsumoTotal.toFixed(2)}{' '}
                    kg. Disponible de Extrusión: {wipSellado.bobinaDisponible.toFixed(2)} kg. Extrusión
                    debe registrar más bobinas antes de continuar.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || isBloqueado}
              className="flex-[2] flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-indigo-600 text-xs font-black uppercase tracking-widest text-white hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-xl shadow-indigo-100 dark:shadow-none cursor-pointer disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  GUARDANDO...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {isEdit ? 'ACTUALIZAR' : 'GUARDAR'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
export default ModalRegistroTurno;

