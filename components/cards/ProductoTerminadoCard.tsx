'use client';

import { useRouter } from 'next/navigation';
import { Truck, Factory, ArrowRight, ArrowDown, CheckCircle, Pencil, Trash2, ShoppingCart, Package } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface ProductoTerminado {
  id: string;
  produccionId: string;
  pedidoId: string | null;
  clienteId: string;
  areaOrigen: string;
  descripcion: string | null;
  cantidadTotal: number;
  cantidadDisponible: number;
  unidad: string;
  tipoProducto: string;
  conImpresion: boolean;
  estado: string;
  siguienteArea: string;
  fechaFinalizacion: string;
  fechaDespacho: string | null;
  createdAt: string;
  updatedAt: string;
  cliente: {
    id: string;
    nombre: string;
    rif: string;
    tipoProducto: string;
    conImpresion: boolean;
  };
  produccion: {
    id: string;
    fecha: string;
    turno: string;
    operario: string;
    maquina: {
      id: string;
      nombre: string;
    };
  };
}

const areaColors: Record<string, string> = {
  'Extrusion': 'bg-blue-100 text-blue-800 border-blue-200',
  'Sellado': 'bg-green-100 text-green-800 border-green-200',
  'Serigrafia': 'bg-purple-100 text-purple-800 border-purple-200',
  'Refilado': 'bg-orange-100 text-orange-800 border-orange-200',
};

const areaNombres: Record<string, string> = {
  'Extrusion': 'Extrusión',
  'Sellado': 'Sellado',
  'Serigrafia': 'Serigrafía',
  'Refilado': 'Refilado',
  'Ninguna': 'Ninguna',
};

interface ProductoTerminadoCardProps {
  producto: ProductoTerminado;
  seccionId: string;
  onEdit?: () => void;
  onDelete?: () => void;
  onProcesar?: () => void;
  onDespacho?: () => void;
  eliminando?: boolean;
  procesando?: boolean;
  userRol?: string;
}

export function ProductoTerminadoCard({
  producto,
  seccionId,
  onEdit,
  onDelete,
  onProcesar,
  onDespacho,
  eliminando = false,
  procesando = false,
  userRol,
}: ProductoTerminadoCardProps) {
  const router = useRouter();

  const unidadDisplay = ['bolsasCon', 'bolsasSin'].includes(seccionId) 
    ? 'Und' 
    : (seccionId === 'listos' 
      ? (producto.tipoProducto === 'Bolsa' ? 'Und' : 'Kg') 
      : 'Kg');

  return (
    <div className={`flex flex-col justify-between p-5 rounded-2xl border-2 transition-all hover:shadow-xl dark:bg-slate-900 ${areaColors[producto.areaOrigen] || 'border-slate-200 dark:border-slate-800 bg-white'}`}>
      <div>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex flex-col mb-3">
              <span className="text-[9px] font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 px-2 py-0.5 rounded-lg self-start uppercase tracking-widest border border-blue-100 dark:border-blue-900/50">
                P-{producto.pedidoId?.slice(-5).toUpperCase() || 'N/A'}
              </span>
              <button
                onClick={() => router.push(`/clientes/${producto.clienteId}`)}
                className="text-left font-black text-slate-900 dark:text-white text-base leading-tight mt-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors line-clamp-2"
                title={producto.cliente.nombre}
              >
                {producto.cliente.nombre}
              </button>
            </div>
            
            <div className="flex items-end gap-1.5 mb-4">
              <p className="text-2xl font-black text-slate-900 dark:text-white">
                {producto.cantidadDisponible.toLocaleString(undefined, { minimumFractionDigits: 1 })}
              </p>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{unidadDisplay}</p>
            </div>

            <div className="flex flex-col gap-2">
              {['bobinasRef', 'bolsasCon', 'bolsasSin'].includes(seccionId) || (seccionId === 'bobinasSin' && producto.tipoProducto === 'Bobina' && !producto.conImpresion) ? (
                <div className="flex items-center gap-2">
                  <div className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${areaColors[producto.areaOrigen]}`}>
                    {areaNombres[producto.areaOrigen]}
                  </div>
                  <ArrowRight className="h-3 w-3 text-slate-400" />
                  <div className="px-2 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider border border-emerald-200 dark:border-emerald-900/50">
                    DESPACHO
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${areaColors[producto.areaOrigen]}`}>
                    {areaNombres[producto.areaOrigen]}
                  </div>
                  {producto.siguienteArea !== 'Ninguna' && (
                    <>
                      <ArrowRight className="h-3 w-3 text-slate-400" />
                      <div className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-black uppercase tracking-wider">
                        {areaNombres[producto.siguienteArea]}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={onEdit}
              className="p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl border border-slate-200 dark:border-slate-700 transition-all hover:scale-105"
              title="Actualizar"
            >
              <Pencil className="h-4 w-4" />
            </button>
            {userRol === 'admin' && (
              <button
                onClick={onDelete}
                disabled={eliminando}
                className="p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-xl border border-slate-200 dark:border-slate-700 transition-all disabled:opacity-50 hover:scale-105"
                title="Eliminar"
              >
                {eliminando ? <div className="h-4 w-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" /> : <Trash2 className="h-4 w-4" />}
              </button>
            )}
            {producto.estado === 'ListoDespacho' && (
              <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl flex items-center justify-center border border-emerald-100 dark:border-emerald-900/50" title="Listo para Despacho">
                <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
            )}
          </div>
        </div>

        {/* Links Area */}
        <div className="mt-6 grid grid-cols-2 gap-2">
          <button
            onClick={() => router.push(`/clientes/${producto.clienteId}/productos`)}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all border border-slate-100 dark:border-slate-800"
          >
            <Package className="w-3.5 h-3.5" />
            CLIENTE
          </button>
          {producto.pedidoId && (
            <button
              onClick={() => router.push(`/pedidos?productoId=${producto.pedidoId}`)}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all border border-slate-100 dark:border-slate-800"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              PEDIDO
            </button>
          )}
          <button
            onClick={() => router.push(`/produccion?produccionId=${producto.produccionId}`)}
            className="col-span-2 flex items-center justify-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all border border-slate-100 dark:border-slate-800"
          >
            <Factory className="w-3.5 h-3.5" />
            VER PRODUCCIÓN
          </button>
        </div>
      </div>

      <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
        {producto.estado === 'PendienteArea' ? (
          <button
            onClick={onProcesar}
            disabled={procesando}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-[0.98] disabled:opacity-50 shadow-sm"
          >
            {procesando ? (
              <div className="h-4 w-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <ArrowRight className="h-4 w-4" /> MARCAR PROCESADO
              </>
            )}
          </button>
        ) : producto.estado === 'ListoDespacho' ? (
          <button
            onClick={onDespacho}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-100 dark:shadow-none hover:bg-emerald-700 transition-all active:scale-[0.98]"
          >
            <Truck className="h-4 w-4" /> ENVIAR A DESPACHO
          </button>
        ) : null}
      </div>
    </div>
  );
}
