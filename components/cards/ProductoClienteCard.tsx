'use client';

import { useRouter } from 'next/navigation';
import { Package, CheckCircle, XCircle, Settings, Edit, Trash2, ShoppingCart, Zap, FileText } from 'lucide-react';

interface ProductoCliente {
  id: string;
  clienteId: string;
  nombreProducto: string;
  codigoProducto?: string;
  activo: boolean;
  tipoProducto: string;
  conImpresion: boolean;
  ancho?: number;
  largo?: number;
  calibre?: number;
  diametroAnchoBolsa?: number;
  material?: string;
  unidadVenta: string;
}

interface ProductoClienteCardProps {
  producto: ProductoCliente;
  onEdit?: () => void;
  onDelete?: () => void;
  onToggleActivo?: () => void;
  onCreatePedido?: () => void;
}

export function ProductoClienteCard({
  producto,
  onEdit,
  onDelete,
  onToggleActivo,
  onCreatePedido,
}: ProductoClienteCardProps) {
  const router = useRouter();

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow ${
        !producto.activo ? 'opacity-60 border-gray-300' : 'border-gray-200'
      }`}
    >
      {/* Header con nombre y acciones rápidas */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 flex-1">
          <Package className={`w-5 h-5 ${producto.activo ? 'text-blue-600' : 'text-gray-400'}`} />
          <h3 className="font-semibold text-gray-900">{producto.nombreProducto}</h3>
        </div>
        <div className="flex gap-1">
          <button
            onClick={onToggleActivo}
            className="p-1 text-gray-600 hover:text-blue-600 transition-colors"
            title={producto.activo ? 'Desactivar' : 'Activar'}
          >
            {producto.activo ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : (
              <XCircle className="w-4 h-4 text-gray-400" />
            )}
          </button>
          <button
            onClick={onEdit}
            className="p-1 text-gray-600 hover:text-purple-600 transition-colors"
            title="Editar Completo"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-1 text-gray-600 hover:text-red-600 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Información del producto */}
      <div className="space-y-1 text-sm text-gray-600 mb-3">
        {producto.codigoProducto && (
          <p><span className="font-medium">Código:</span> {producto.codigoProducto}</p>
        )}
        <p><span className="font-medium">Tipo:</span> {producto.tipoProducto}</p>
        <p><span className="font-medium">Impresión:</span> {producto.conImpresion ? 'Sí' : 'No'}</p>
        {producto.ancho && producto.largo && producto.calibre && (
          <p><span className="font-medium">Dimensiones:</span> {producto.ancho}cm x {producto.largo}cm x {producto.calibre}µ</p>
        )}
        {producto.material && (
          <p><span className="font-medium">Material:</span> {producto.material}</p>
        )}
        <p><span className="font-medium">Unidad:</span> {producto.unidadVenta}</p>
      </div>

      {/* Botones de acción */}
      <div className="space-y-2 border-t border-gray-200 pt-3">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onCreatePedido}
            className="flex items-center justify-center gap-1 px-2 py-1.5 bg-blue-100 text-blue-700 text-xs font-medium rounded hover:bg-blue-200 transition-colors"
            title="Crear nuevo pedido"
          >
            <ShoppingCart className="w-3 h-3" />
            Nuevo Pedido
          </button>
          <button
            onClick={() => router.push(`/produccion?productoId=${producto.id}&clienteId=${producto.clienteId}`)}
            className="flex items-center justify-center gap-1 px-2 py-1.5 bg-orange-100 text-orange-700 text-xs font-medium rounded hover:bg-orange-200 transition-colors"
            title="Ver producción"
          >
            <Zap className="w-3 h-3" />
            Producción
          </button>
        </div>
        <button
          onClick={() => router.push(`/pedidos?productoId=${producto.id}&clienteId=${producto.clienteId}`)}
          className="w-full flex items-center justify-center gap-1 px-2 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded hover:bg-gray-200 transition-colors"
          title="Ver pedidos de este producto"
        >
          <FileText className="w-3 h-3" />
          Ver Pedidos
        </button>
      </div>

      {/* Estado */}
      <div className="mt-3 pt-3 border-t border-gray-200">
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
          producto.activo 
            ? 'bg-green-100 text-green-800' 
            : 'bg-gray-100 text-gray-800'
        }`}>
          {producto.activo ? 'Activo' : 'Inactivo'}
        </span>
      </div>
    </div>
  );
}
