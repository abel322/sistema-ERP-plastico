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
        <div className="bg-gray-50 border-b border-gray-100 divide-y divide-gray-200">

          {/* Especificaciones adicionales */}
          {(producto.anchoBobina || producto.anchoValvula || producto.anchoSolapa || producto.anchoFuelle ||
            producto.pesoPorUnidad || producto.pesoMaximoBobina || producto.bolsasPorRollo ||
            producto.rollosPorBulto || producto.tipoSellado || producto.tipoRefilado ||
            producto.repeticionesImagen || producto.tipoBobinaCliente ||
            producto.laminaRebobinadorAncho || producto.laminaRebobinadorCalibre ||
            producto.perforacion || producto.muleteado) && (
            <div className="p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                <Ruler className="w-3 h-3" /> Especificaciones Técnicas
              </p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-700">
                {producto.anchoBobina && <InfoRow label="Ancho Bobina" value={`${producto.anchoBobina} cm`} />}
                {producto.anchoValvula && <InfoRow label="Ancho Válvula" value={`${producto.anchoValvula} cm`} />}
                {producto.anchoSolapa && <InfoRow label="Ancho Solapa" value={`${producto.anchoSolapa} cm`} />}
                {producto.anchoFuelle && <InfoRow label="Ancho Fuelle" value={`${producto.anchoFuelle} cm`} />}
                {producto.pesoPorUnidad && <InfoRow label="Peso/Unidad" value={`${producto.pesoPorUnidad} kg`} />}
                {producto.pesoMaximoBobina && <InfoRow label="Peso Máx. Bobina" value={`${producto.pesoMaximoBobina} kg`} />}
                {producto.bolsasPorRollo && <InfoRow label="Bolsas/Rollo" value={producto.bolsasPorRollo} />}
                {producto.rollosPorBulto && <InfoRow label="Rollos/Bulto" value={producto.rollosPorBulto} />}
                {producto.tipoSellado && <InfoRow label="Tipo Sellado" value={producto.tipoSellado} />}
                {producto.tipoSelladoEstructura && <InfoRow label="Estructura Sellado" value={producto.tipoSelladoEstructura} />}
                {producto.tipoRefilado && <InfoRow label="Tipo Refilado" value={producto.tipoRefilado} />}
                {producto.repeticionesImagen && <InfoRow label="Repeticiones Imagen" value={producto.repeticionesImagen} />}
                {producto.tipoBobinaCliente && <InfoRow label="Tipo Bobina" value={producto.tipoBobinaCliente} />}
                {producto.laminaRebobinadorAncho && <InfoRow label="Lámina Ancho" value={`${producto.laminaRebobinadorAncho} cm`} />}
                {producto.laminaRebobinadorCalibre && <InfoRow label="Lámina Calibre" value={`${producto.laminaRebobinadorCalibre} µ`} />}
                {producto.perforacion !== undefined && <InfoRow label="Perforación" value={producto.perforacion ? 'Sí' : 'No'} />}
                {producto.muleteado !== undefined && <InfoRow label="Muleteado" value={producto.muleteado ? 'Sí' : 'No'} />}
                {producto.intensidadTratador && <InfoRow label="Intensidad Tratador" value={producto.intensidadTratador} />}
              </div>
            </div>
          )}

          {/* Formulación */}
          {(producto.formFB7000 || producto.form3003 || producto.formLineal || producto.form0240 ||
            producto.form0348 || producto.form7000F || producto.formDeslizante ||
            producto.formMasterbachBlanco || producto.formMasterbachNegro ||
            producto.formMasterbachAzul || producto.formMasterbachAmarillo) && (
            <div className="p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                <Layers className="w-3 h-3" /> Formulación de Materia Prima
              </p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-700">
                {producto.formFB7000 && <InfoRow label="FB7000" value={`${producto.formFB7000}%`} />}
                {producto.form3003 && <InfoRow label="3003" value={`${producto.form3003}%`} />}
                {producto.formLineal && <InfoRow label="Lineal" value={`${producto.formLineal}%`} />}
                {producto.form0240 && <InfoRow label="0240" value={`${producto.form0240}%`} />}
                {producto.form0348 && <InfoRow label="0348" value={`${producto.form0348}%`} />}
                {producto.form7000F && <InfoRow label="7000F" value={`${producto.form7000F}%`} />}
                {producto.formDeslizante && <InfoRow label="Deslizante" value={`${producto.formDeslizante}%`} />}
                {producto.formMasterbachBlanco && <InfoRow label="MB Blanco" value={`${producto.formMasterbachBlanco}%`} />}
                {producto.formMasterbachNegro && <InfoRow label="MB Negro" value={`${producto.formMasterbachNegro}%`} />}
                {producto.formMasterbachAzul && <InfoRow label="MB Azul" value={`${producto.formMasterbachAzul}%`} />}
                {producto.formMasterbachAmarillo && <InfoRow label="MB Amarillo" value={`${producto.formMasterbachAmarillo}%`} />}
              </div>
            </div>
          )}

          {/* Serigrafía */}
          {producto.conImpresion && (producto.color1 || producto.color2 || producto.cilindro || producto.tipoImpresion) && (
            <div className="p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                <Palette className="w-3 h-3" /> Serigrafía e Impresión
              </p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-700">
                {producto.tipoImpresion && <InfoRow label="Tipo Impresión" value={producto.tipoImpresion} />}
                {producto.cilindro && <InfoRow label="Cilindro" value={producto.cilindro} />}
                {producto.serigrafiaTratadorIntensidad && <InfoRow label="Intensidad Tratador" value={producto.serigrafiaTratadorIntensidad} />}
                {producto.color1 && <InfoRow label="Color 1" value={producto.color1} />}
                {producto.color2 && <InfoRow label="Color 2" value={producto.color2} />}
                {producto.color3 && <InfoRow label="Color 3" value={producto.color3} />}
                {producto.color4 && <InfoRow label="Color 4" value={producto.color4} />}
                {producto.color5 && <InfoRow label="Color 5" value={producto.color5} />}
                {producto.color6 && <InfoRow label="Color 6" value={producto.color6} />}
              </div>
            </div>
          )}

          {/* Parámetros de Extrusión */}
          {(producto.extTemperaturaAmbiente || producto.extMotorPrincipal || producto.extTraccion ||
            producto.extTemperaturaZ1 || producto.extTemperaturaZ2) && (
            <div className="p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                <Thermometer className="w-3 h-3" /> Parámetros de Extrusión
              </p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-700">
                {producto.extTemperaturaAmbiente && <InfoRow label="Temp. Ambiente" value={`${producto.extTemperaturaAmbiente}°C`} />}
                {producto.extMotorPrincipal && <InfoRow label="Motor Principal" value={producto.extMotorPrincipal} />}
                {producto.extTraccion && <InfoRow label="Tracción" value={producto.extTraccion} />}
                {producto.extSopladorPrincipal && <InfoRow label="Soplador Principal" value={producto.extSopladorPrincipal} />}
                {producto.extAberturaBlower && <InfoRow label="Abertura Blower" value={producto.extAberturaBlower} />}
                {producto.extCuelloGlobo && <InfoRow label="Cuello Globo" value={producto.extCuelloGlobo} />}
                {producto.extTemperaturaCuelloGlobo && <InfoRow label="Temp. Cuello Globo" value={`${producto.extTemperaturaCuelloGlobo}°C`} />}
                {producto.extTraccionRebobinador && <InfoRow label="Tracción Rebobinador" value={producto.extTraccionRebobinador} />}
                {producto.extRebobinadorWinding1 && <InfoRow label="Winding 1" value={producto.extRebobinadorWinding1} />}
                {producto.extRebobinadorWinding2 && <InfoRow label="Winding 2" value={producto.extRebobinadorWinding2} />}
                {producto.extIntensidadTratador && <InfoRow label="Intensidad Tratador" value={producto.extIntensidadTratador} />}
                {producto.extOrientacionFlujoBlower && <InfoRow label="Orientación Flujo" value={producto.extOrientacionFlujoBlower} />}
              </div>
              {/* Zonas de temperatura */}
              {producto.extTemperaturaZ1 && (
                <div className="mt-2">
                  <p className="text-xs text-gray-500 mb-1">Temperaturas por Zona:</p>
                  <div className="grid grid-cols-5 gap-1">
                    {[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20].map(i => {
                      const val = (producto as any)[`extTemperaturaZ${i}`];
                      return val ? (
                        <div key={i} className="bg-white border border-gray-200 rounded px-1 py-0.5 text-center text-xs">
                          <span className="text-gray-400">Z{i}</span><br/>{val}°
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Parámetros de Sellado */}
          {(producto.sldTipoSelladora || producto.sldTempSuperior || producto.sldTempInferior ||
            producto.sldCapacidadBolsa || producto.sldGPM) && (
            <div className="p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                <Gauge className="w-3 h-3" /> Parámetros de Sellado
              </p>
              {producto.sldTipoSelladora && (
                <p className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded mb-2 inline-block font-medium">
                  {producto.sldTipoSelladora}
                </p>
              )}
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-700">
                {producto.sldCapacidadBolsa && <InfoRow label="Capacidad Bolsa" value={producto.sldCapacidadBolsa} />}
                {producto.sldTemperaturaAmbiente && <InfoRow label="Temp. Ambiente" value={`${producto.sldTemperaturaAmbiente}°C`} />}
                {producto.sldTornilloEsparrago && <InfoRow label="Tornillo Espárrago" value={producto.sldTornilloEsparrago} />}
                {producto.sldTempSuperior && <InfoRow label="Temp. Superior" value={`${producto.sldTempSuperior}°C`} />}
                {producto.sldTempInferior && <InfoRow label="Temp. Inferior" value={`${producto.sldTempInferior}°C`} />}
                {producto.sldTempValvula && <InfoRow label="Temp. Válvula" value={`${producto.sldTempValvula}°C`} />}
                {producto.sldPresellado_A && <InfoRow label="Presellado A" value={producto.sldPresellado_A} />}
                {producto.sldPresellado_B && <InfoRow label="Presellado B" value={producto.sldPresellado_B} />}
                {producto.sldTiempoLimite && <InfoRow label="Tiempo Límite" value={producto.sldTiempoLimite} />}
                {producto.sldTempCuchilla && <InfoRow label="Temp. Cuchilla" value={`${producto.sldTempCuchilla}°C`} />}
                {producto.sldRodilloAnchoValvula && <InfoRow label="Rodillo Ancho Válvula" value={producto.sldRodilloAnchoValvula} />}
                {producto.sldGPM && <InfoRow label="GPM" value={producto.sldGPM} />}
                {producto.sldVelocidadTransportador && <InfoRow label="Vel. Transportador" value={producto.sldVelocidadTransportador} />}
                {producto.sldCicloTrabajo && <InfoRow label="Ciclo Trabajo" value={producto.sldCicloTrabajo} />}
                {producto.sldPresionBalancin1 && <InfoRow label="Balancín 1" value={producto.sldPresionBalancin1} />}
                {producto.sldPresionBalancin2 && <InfoRow label="Balancín 2" value={producto.sldPresionBalancin2} />}
                {producto.sldPresionBalancin3 && <InfoRow label="Balancín 3" value={producto.sldPresionBalancin3} />}
                {producto.sldPresionBalancinA1 && <InfoRow label="Balancín A1" value={producto.sldPresionBalancinA1} />}
                {producto.sldPresionBalancinA2 && <InfoRow label="Balancín A2" value={producto.sldPresionBalancinA2} />}
                {producto.sldPresionBalancinA3 && <InfoRow label="Balancín A3" value={producto.sldPresionBalancinA3} />}
                {producto.sldPresionBalancinA4 && <InfoRow label="Balancín A4" value={producto.sldPresionBalancinA4} />}
                {producto.sldPresionBalancinB1 && <InfoRow label="Balancín B1" value={producto.sldPresionBalancinB1} />}
                {producto.sldPresionBalancinB2 && <InfoRow label="Balancín B2" value={producto.sldPresionBalancinB2} />}
                {producto.sldPresionBalancinB3 && <InfoRow label="Balancín B3" value={producto.sldPresionBalancinB3} />}
                {producto.sldPresionBalancinB4 && <InfoRow label="Balancín B4" value={producto.sldPresionBalancinB4} />}
              </div>
            </div>
          )}

          {/* Si no hay datos adicionales */}
          {!producto.anchoBobina && !producto.formFB7000 && !producto.extTemperaturaAmbiente && !producto.sldTipoSelladora && (
            <div className="p-4 text-center text-xs text-gray-400">
              No hay información adicional registrada para este producto.
            </div>
          )}
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

function InfoRow({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex justify-between gap-2 py-0.5 border-b border-gray-100 last:border-0">
      <span className="text-gray-500 shrink-0">{label}:</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}
