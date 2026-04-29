'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Package, CheckCircle, XCircle, Settings, Trash2, ShoppingCart, Zap, FileText,
  ChevronDown, ChevronUp, Ruler, Palette, Layers, Thermometer, Gauge
} from 'lucide-react';

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
  pesoPorUnidad?: number;
  color?: string;
  anchoBobina?: number;
  anchoValvula?: number;
  anchoSolapa?: number;
  anchoFuelle?: number;
  intensidadTratador?: number;
  pesoMaximoBobina?: number;
  perforacion?: boolean;
  muleteado?: boolean;
  tipoRefilado?: string;
  bolsasPorRollo?: number;
  rollosPorBulto?: number;
  tipoSellado?: string;
  tipoSelladoEstructura?: string;
  repeticionesImagen?: number;
  tipoBobinaCliente?: string;
  laminaRebobinadorAncho?: number;
  laminaRebobinadorCalibre?: number;
  formFB7000?: number;
  form3003?: number;
  formLineal?: number;
  form0240?: number;
  form0348?: number;
  form7000F?: number;
  formDeslizante?: number;
  formMasterbachBlanco?: number;
  formMasterbachNegro?: number;
  formMasterbachAzul?: number;
  formMasterbachAmarillo?: number;
  color1?: string;
  color2?: string;
  color3?: string;
  color4?: string;
  color5?: string;
  color6?: string;
  cilindro?: string;
  tipoImpresion?: string;
  serigrafiaTratadorIntensidad?: number;
  extTemperaturaAmbiente?: number;
  extMotorPrincipal?: number;
  extTraccion?: number;
  extSopladorPrincipal?: number;
  extAberturaBlower?: number;
  extCuelloGlobo?: number;
  extTemperaturaCuelloGlobo?: number;
  extTraccionRebobinador?: number;
  extRebobinadorWinding1?: number;
  extRebobinadorWinding2?: number;
  extIntensidadTratador?: number;
  extTemperaturaZ1?: number;
  extTemperaturaZ2?: number;
  extTemperaturaZ3?: number;
  extTemperaturaZ4?: number;
  extTemperaturaZ5?: number;
  extTemperaturaZ6?: number;
  extTemperaturaZ7?: number;
  extTemperaturaZ8?: number;
  extTemperaturaZ9?: number;
  extTemperaturaZ10?: number;
  extTemperaturaZ11?: number;
  extTemperaturaZ12?: number;
  extTemperaturaZ13?: number;
  extTemperaturaZ14?: number;
  extTemperaturaZ15?: number;
  extTemperaturaZ16?: number;
  extTemperaturaZ17?: number;
  extTemperaturaZ18?: number;
  extTemperaturaZ19?: number;
  extTemperaturaZ20?: number;
  extOrientacionFlujoBlower?: number;
  sldTipoSelladora?: string;
  sldCapacidadBolsa?: number;
  sldTemperaturaAmbiente?: number;
  sldTornilloEsparrago?: number;
  sldTempSuperior?: number;
  sldTempInferior?: number;
  sldTempValvula?: number;
  sldPresellado_A?: number;
  sldPresellado_B?: number;
  sldTiempoLimite?: number;
  sldMicroperforaciones?: string;
  sldMuleteado?: string;
  sldTempCuchilla?: number;
  sldRodilloAnchoValvula?: number;
  sldGPM?: number;
  sldVelocidadTransportador?: number;
  sldCicloTrabajo?: number;
  sldPresionBalancin1?: number;
  sldPresionBalancin2?: number;
  sldPresionBalancin3?: number;
  sldPresionBalancinA1?: number;
  sldPresionBalancinA2?: number;
  sldPresionBalancinA3?: number;
  sldPresionBalancinA4?: number;
  sldPresionBalancinB1?: number;
  sldPresionBalancinB2?: number;
  sldPresionBalancinB3?: number;
  sldPresionBalancinB4?: number;
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
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2 flex-1">
            <Package className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">{producto.nombreProducto}</h3>
          </div>
          <div className="flex gap-1">
            <button onClick={onToggleActivo} className="p-1 text-gray-600 hover:text-blue-600 transition-colors">
              {producto.activo ? <CheckCircle className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-gray-400" />}
            </button>
            <button onClick={onEdit} className="p-1 text-gray-600 hover:text-purple-600 transition-colors">
              <Settings className="w-4 h-4" />
            </button>
            <button onClick={onDelete} className="p-1 text-gray-600 hover:text-red-600 transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Info básica */}
        <div className="space-y-1 text-sm text-gray-600">
          {producto.codigoProducto && <p><span className="font-medium">Código:</span> {producto.codigoProducto}</p>}
          <p><span className="font-medium">Tipo:</span> {producto.tipoProducto}</p>
          <p><span className="font-medium">Impresión:</span> {producto.conImpresion ? 'Sí' : 'No'}</p>
          {producto.ancho && producto.largo && (
            <p><span className="font-medium">Dimensiones:</span> {producto.ancho}cm x {producto.largo}cm</p>
          )}
          {producto.material && <p><span className="font-medium">Material:</span> {producto.material}</p>}
          <p><span className="font-medium">Unidad:</span> {producto.unidadVenta}</p>
        </div>

        {/* Estado */}
        <div className="mt-3">
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
            producto.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {producto.activo ? 'Activo' : 'Inactivo'}
          </span>
        </div>
      </div>

      {/* Botón Ver más información */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors border-b border-gray-100"
      >
        <span className="text-sm font-medium text-gray-700">Ver más información</span>
        {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>

      {/* Información expandida */}
      {isExpanded && (
        <div className="p-4 bg-gray-50 border-b border-gray-100">
          <p className="text-sm text-gray-600">
            Aquí se mostrará toda la información adicional del producto organizada en secciones.
          </p>
        </div>
      )}

      {/* Botones de acción */}
      <div className="p-4 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onCreatePedido}
            className="flex items-center justify-center gap-1 px-2 py-1.5 bg-blue-100 text-blue-700 text-xs font-medium rounded hover:bg-blue-200 transition-colors"
          >
            <ShoppingCart className="w-3 h-3" />
            Nuevo Pedido
          </button>
          <button
            onClick={() => router.push(`/produccion?productoId=${producto.id}&clienteId=${producto.clienteId}`)}
            className="flex items-center justify-center gap-1 px-2 py-1.5 bg-orange-100 text-orange-700 text-xs font-medium rounded hover:bg-orange-200 transition-colors"
          >
            <Zap className="w-3 h-3" />
            Producción
          </button>
        </div>
        <button
          onClick={() => router.push(`/pedidos?productoId=${producto.id}&clienteId=${producto.clienteId}`)}
          className="w-full flex items-center justify-center gap-1 px-2 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded hover:bg-gray-200 transition-colors"
        >
          <FileText className="w-3 h-3" />
          Ver Pedidos
        </button>
      </div>
    </div>
  );
}
