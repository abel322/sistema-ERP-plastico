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
    <div className={`flex flex-col justify-between p-4 rounded-xl border-2 ${areaColors[producto.areaOrigen] || 'border-gray-200 bg-gray-50'}`}>
      <div>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex flex-col mb-1.5">
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md self-start uppercase tracking-wider border border-blue-100">
                Pedido {producto.pedidoId?.slice(-5).toUpperCase() || 'N/A'}
              </span>
              <button
                onClick={() => router.push(`/clientes/${producto.clienteId}`)}
                className="text-left font-semibold text-gray-900 line-clamp-1 mt-1 hover:text-blue-600 hover:underline transition-colors"
                title={producto.cliente.nombre}
              >
                {producto.cliente.nombre}
              </button>
            </div>
            <p className="text-sm font-bold text-gray-800 mt-1">
              {producto.cantidadDisponible.toFixed(1)} {unidadDisplay}
            </p>
            <div className="flex flex-wrap gap-1 mt-2 text-xs text-gray-500">
              {['bobinasRef', 'bolsasCon', 'bolsasSin'].includes(seccionId) || (seccionId === 'bobinasSin' && producto.tipoProducto === 'Bobina' && !producto.conImpresion) ? (
                <div className="flex flex-col items-start gap-1">
                  <span className={`px-2 py-0.5 rounded ${areaColors[producto.areaOrigen]}`}>
                    De: {areaNombres[producto.areaOrigen]}
                  </span>
                  <ArrowDown className="h-3 w-3 text-emerald-500 ml-3" />
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 font-bold border border-emerald-200">
                    Para: Despachar
                  </span>
                </div>
              ) : (
                <>
                  <span className={`px-2 py-0.5 rounded ${areaColors[producto.areaOrigen]}`}>
                    De: {areaNombres[producto.areaOrigen]}
                  </span>
                  {producto.siguienteArea !== 'Ninguna' && (
                    <>
                      <ArrowRight className="h-3 w-3 inline-block mx-1 mt-1" />
                      <span className="px-2 py-0.5 rounded bg-gray-200 text-gray-700">
                        Para: {areaNombres[producto.siguienteArea]}
                      </span>
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 ml-2">
            <button
              onClick={onEdit}
              className="p-2 bg-gradient-to-br from-blue-50 to-indigo-100 text-blue-600 hover:from-blue-100 hover:to-indigo-200 rounded-lg shadow-sm border border-blue-200/50 transition-all hover:scale-110"
              title="Actualizar"
            >
              <Pencil className="h-4 w-4" />
            </button>
            {userRol === 'admin' && (
              <button
                onClick={onDelete}
                disabled={eliminando}
                className="p-2 bg-gradient-to-br from-red-50 to-rose-100 text-red-600 hover:from-red-100 hover:to-rose-200 rounded-lg shadow-sm border border-red-200/50 transition-all disabled:opacity-50 hover:scale-110"
                title="Eliminar"
              >
                {eliminando ? <LoadingSpinner /> : <Trash2 className="h-4 w-4" />}
              </button>
            )}
            {producto.estado === 'ListoDespacho' && (
              <div className="p-2 bg-emerald-100 rounded-full ml-1" title="Listo para Despacho">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
              </div>
            )}
          </div>
        </div>

        {/* Enlaces rápidos */}
        <div className="mt-3 pt-3 border-t border-gray-200/50 space-y-2">
          <div className="flex gap-2">
            <button
              onClick={() => router.push(`/clientes/${producto.clienteId}/productos`)}
              className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-purple-100 text-purple-700 text-xs font-medium rounded hover:bg-purple-200 transition-colors"
              title="Ver productos del cliente"
            >
              <Package className="w-3 h-3" />
              Productos
            </button>
            {producto.pedidoId && (
              <button
                onClick={() => router.push(`/pedidos?productoId=${producto.pedidoId}`)}
                className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-blue-100 text-blue-700 text-xs font-medium rounded hover:bg-blue-200 transition-colors"
                title="Ver pedido"
              >
                <ShoppingCart className="w-3 h-3" />
                Pedido
              </button>
            )}
          </div>
          <button
            onClick={() => router.push(`/produccion?produccionId=${producto.produccionId}`)}
            className="w-full flex items-center justify-center gap-1 px-2 py-1.5 bg-orange-100 text-orange-700 text-xs font-medium rounded hover:bg-orange-200 transition-colors"
            title="Ver producción"
          >
            <Factory className="w-3 h-3" />
            Ver Producción
          </button>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100/50">
        {producto.estado === 'PendienteArea' ? (
          <button
            onClick={onProcesar}
            disabled={procesando}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:opacity-50 transition-colors"
          >
            {procesando ? (
              <LoadingSpinner />
            ) : (
              <>
                ▶ Marcar como Procesado
              </>
            )}
          </button>
        ) : producto.estado === 'ListoDespacho' ? (
          <button
            onClick={onDespacho}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            <Truck className="h-4 w-4" /> Enviar a Despacho
          </button>
        ) : null}
      </div>
    </div>
  );
}
