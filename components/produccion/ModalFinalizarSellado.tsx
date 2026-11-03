'use client';

import React, { useState } from 'react';
import { CheckCircle2, Recycle, Package, AlertTriangle, Loader2 } from 'lucide-react';

interface Props {
  orden: any;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (destino: 'MOLIENDA' | 'ALMACEN_BOBINA', sobranteKg: number) => Promise<void>;
}

export function ModalFinalizarSellado({ orden, isOpen, onClose, onConfirm }: Props) {
  const [destino, setDestino] = useState<'MOLIENDA' | 'ALMACEN_BOBINA'>('MOLIENDA');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !orden) return null;

  const sobranteKg = Number(orden.bobinaDisponibleKg ?? orden.stockPrevio?.cantidad ?? 0);
  const pc = orden.pedido?.productoCliente || orden.productoCliente;
  const productoNombre =
    pc?.nombreProducto ||
    orden.producto?.nombre ||
    (orden.pedido?.cliente as any)?.tipoProducto ||
    'Producto Sin Especificación';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onConfirm(destino, sobranteKg);
      onClose();
    } catch (error) {
      console.error('Error al confirmar finalización:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              Finalizar Fase de Sellado
            </h3>
            <p className="text-xs text-slate-500 truncate max-w-[280px]" title={productoNombre}>
              {productoNombre}
            </p>
          </div>
        </div>

        {sobranteKg > 0 ? (
          <div className="mb-5 space-y-3">
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800 dark:text-amber-200">
                <p className="font-bold">Quedan {sobranteKg.toFixed(2)} KG de bobina en piso.</p>
                <p className="text-[11px] mt-0.5 text-amber-700 dark:text-amber-300">
                  Selecciona qué hacer con este material para cuadrar el inventario físico:
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label
                onClick={() => setDestino('MOLIENDA')}
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                  destino === 'MOLIENDA'
                    ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 ring-1 ring-blue-600'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Recycle className="w-4 h-4 text-blue-600" />
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block">
                      Enviar a Molienda / Peletizado
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Suma {sobranteKg.toFixed(2)} KG al inventario de molido
                    </span>
                  </div>
                </div>
                <input
                  type="radio"
                  name="destinoSobrante"
                  checked={destino === 'MOLIENDA'}
                  onChange={() => setDestino('MOLIENDA')}
                  className="w-4 h-4 text-blue-600 cursor-pointer"
                />
              </label>

              <label
                onClick={() => setDestino('ALMACEN_BOBINA')}
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                  destino === 'ALMACEN_BOBINA'
                    ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 ring-1 ring-blue-600'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Package className="w-4 h-4 text-emerald-600" />
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block">
                      Guardar como Saldo en Almacén
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Queda guardado como remanente de bobina útil
                    </span>
                  </div>
                </div>
                <input
                  type="radio"
                  name="destinoSobrante"
                  checked={destino === 'ALMACEN_BOBINA'}
                  onChange={() => setDestino('ALMACEN_BOBINA')}
                  className="w-4 h-4 text-blue-600 cursor-pointer"
                />
              </label>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-5">
            Toda la bobina fue consumida exactamente al 100%. ¿Deseas cerrar la fase de Sellado y liberar la máquina?
          </p>
        )}

        <div className="flex items-center justify-end gap-2.5">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handleSubmit}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-xs cursor-pointer"
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Confirmar y Finalizar</span>
          </button>
        </div>
      </div>
    </div>
  );
}

