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
  return (
    <div className="group bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 hover:shadow-xl dark:hover:border-blue-900 transition-all duration-300 overflow-hidden">
      {/* Top Banner Accent */}
      <div className={`h-1.5 w-full ${producto.activo ? 'bg-blue-500' : 'bg-slate-300'}`} />
      
      {/* Header Section */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className={`p-2.5 rounded-lg ${producto.activo ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'} group-hover:scale-110 transition-transform duration-300`}>
              <Package className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-slate-900 dark:text-white text-lg leading-tight truncate" title={producto.nombreProducto}>
                {producto.nombreProducto}
              </h3>
              {producto.codigoProducto && (
                <span className="inline-block mt-0.5 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider rounded">
                  {producto.codigoProducto}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0 bg-slate-50 dark:bg-slate-800 p-1 rounded-lg border border-slate-100 dark:border-slate-700">
            <button 
              onClick={onToggleActivo} 
              className={`p-1.5 rounded-md transition-all ${producto.activo ? 'text-green-600 hover:bg-green-50' : 'text-slate-400 hover:bg-slate-200'}`}
              title={producto.activo ? 'Desactivar' : 'Activar'}
            >
              {producto.activo ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            </button>
            <button 
              onClick={onEdit} 
              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all"
              title="Configuración"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button 
              onClick={onDelete} 
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all"
              title="Eliminar"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Info Grid */}
        <div className="grid grid-cols-2 gap-y-3 gap-x-4 mb-4">
          <QuickInfo label="Tipo" value={producto.tipoProducto} />
          <QuickInfo label="Unidad" value={producto.unidadVenta} />
          {producto.ancho && producto.largo && (
            <QuickInfo label="Dimensiones" value={`${producto.ancho}x${producto.largo} cm`} />
          )}
          {producto.material && (
            <QuickInfo label="Material" value={producto.material} />
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
            producto.activo ? 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${producto.activo ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`} />
            {producto.activo ? 'Activo' : 'Inactivo'}
          </div>
          {producto.conImpresion && (
            <div className="flex items-center gap-1 px-3 py-1 bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 rounded-full text-xs font-semibold border border-purple-100 dark:border-purple-900/50">
              <Palette className="w-3 h-3" />
              Impresión
            </div>
          )}
        </div>
      </div>

      {/* Expand/Collapse Trigger */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full px-5 py-3 flex items-center justify-between transition-colors ${
          isExpanded ? 'bg-slate-50 dark:bg-slate-800/50 border-y border-slate-100 dark:border-slate-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800'
        }`}
      >
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 flex items-center justify-center rounded-lg ${isExpanded ? 'bg-blue-600 text-white' : 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400'}`}>
            <FileText className="w-4 h-4" />
          </div>
          <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Especificaciones Detalladas</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-slate-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-400" />
        )}
      </button>

      {/* Expanded Content Area */}
      {isExpanded && (
        <div className="bg-white dark:bg-slate-900">
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            
            {/* Technical Specs Section */}
            <DetailSection 
              title="Especificaciones Técnicas" 
              icon={<Ruler className="w-4 h-4" />}
              accentColor="blue"
            >
              <div className="grid grid-cols-1 gap-y-0.5">
                {producto.calibre && <InfoRow label="Calibre" value={`${producto.calibre} µ`} />}
                {producto.color && <InfoRow label="Color" value={producto.color} />}
                {producto.diametroAnchoBolsa && <InfoRow label="Diámetro Ancho" value={`${producto.diametroAnchoBolsa} cm`} />}
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
                {producto.repeticionesImagen && <InfoRow label="Repeticiones" value={producto.repeticionesImagen} />}
                {producto.tipoBobinaCliente && <InfoRow label="Tipo Bobina" value={producto.tipoBobinaCliente} />}
                {producto.laminaRebobinadorAncho && <InfoRow label="Lámina Ancho" value={`${producto.laminaRebobinadorAncho} cm`} />}
                {producto.laminaRebobinadorCalibre && <InfoRow label="Lámina Calibre" value={`${producto.laminaRebobinadorCalibre} µ`} />}
                {producto.perforacion !== undefined && <InfoRow label="Perforación" value={producto.perforacion ? 'Sí' : 'No'} />}
                {producto.muleteado !== undefined && <InfoRow label="Muleteado" value={producto.muleteado ? 'Sí' : 'No'} />}
                {producto.intensidadTratador && <InfoRow label="Intensidad Tratador" value={producto.intensidadTratador} />}
              </div>
            </DetailSection>

            {/* Formulation Section */}
            {(producto.formFB7000 || producto.form3003 || producto.formLineal || producto.form0240) && (
              <DetailSection 
                title="Formulación Materia Prima" 
                icon={<Layers className="w-4 h-4" />}
                accentColor="emerald"
              >
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {producto.formFB7000 && <FormTag label="FB7000" value={producto.formFB7000} />}
                  {producto.form3003 && <FormTag label="3003" value={producto.form3003} />}
                  {producto.formLineal && <FormTag label="Lineal" value={producto.formLineal} />}
                  {producto.form0240 && <FormTag label="0240" value={producto.form0240} />}
                  {producto.form0348 && <FormTag label="0348" value={producto.form0348} />}
                  {producto.form7000F && <FormTag label="7000F" value={producto.form7000F} />}
                  {producto.formDeslizante && <FormTag label="Desliz." value={producto.formDeslizante} />}
                  {producto.formMasterbachBlanco && <FormTag label="MB Blanco" value={producto.formMasterbachBlanco} />}
                  {producto.formMasterbachNegro && <FormTag label="MB Negro" value={producto.formMasterbachNegro} />}
                </div>
              </DetailSection>
            )}

            {/* Print Section */}
            {producto.conImpresion && (
              <DetailSection 
                title="Serigrafía e Impresión" 
                icon={<Palette className="w-4 h-4" />}
                accentColor="purple"
              >
                <div className="grid grid-cols-1 gap-y-0.5">
                  {producto.tipoImpresion && <InfoRow label="Tipo Impresión" value={producto.tipoImpresion} />}
                  {producto.cilindro && <InfoRow label="Cilindro" value={producto.cilindro} />}
                  {producto.serigrafiaTratadorIntensidad && <InfoRow label="Intensidad Tratador" value={producto.serigrafiaTratadorIntensidad} />}
                  <div className="col-span-full mt-2 flex flex-wrap gap-2">
                    {[1,2,3,4,5,6].map(i => {
                      const color = (producto as any)[`color${i}`];
                      return color ? (
                        <span key={i} className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold rounded border border-slate-200 dark:border-slate-700">
                          Color {i}: {color}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              </DetailSection>
            )}

            {/* Extrusion Params */}
            {(producto.extTemperaturaAmbiente || producto.extMotorPrincipal) && (
              <DetailSection 
                title="Parámetros Extrusión" 
                icon={<Thermometer className="w-4 h-4" />}
                accentColor="orange"
              >
                <div className="grid grid-cols-1 gap-y-0.5">
                  {producto.extTemperaturaAmbiente && <InfoRow label="Temp. Ambiente" value={`${producto.extTemperaturaAmbiente}°C`} />}
                  {producto.extMotorPrincipal && <InfoRow label="Motor Principal" value={producto.extMotorPrincipal} />}
                  {producto.extTraccion && <InfoRow label="Tracción" value={producto.extTraccion} />}
                  {producto.extSopladorPrincipal && <InfoRow label="Soplador" value={producto.extSopladorPrincipal} />}
                </div>
                {producto.extTemperaturaZ1 && (
                  <div className="mt-3 overflow-x-auto pb-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Temperaturas por Zona</p>
                    <div className="flex gap-1.5">
                      {[1,2,3,4,5,6,7,8,9,10,11,12].map(i => {
                        const val = (producto as any)[`extTemperaturaZ${i}`];
                        return val ? (
                          <div key={i} className="flex-shrink-0 w-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded py-1 text-center">
                            <span className="block text-[8px] text-slate-400 dark:text-slate-500 font-bold uppercase">Z{i}</span>
                            <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200">{val}°</span>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              </DetailSection>
            )}
          </div>
        </div>
      )}

      {/* Footer Actions */}
      <div className="p-4 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onCreatePedido}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 shadow-sm hover:shadow-md transition-all active:scale-95"
          >
            <ShoppingCart className="w-4 h-4" />
            NUEVO PEDIDO
          </button>
          <button
            onClick={() => router.push(`/produccion?productoId=${producto.id}&clienteId=${producto.clienteId}`)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500 text-white text-xs font-bold rounded-lg hover:bg-orange-600 shadow-sm hover:shadow-md transition-all active:scale-95"
          >
            <Zap className="w-4 h-4" />
            PRODUCCIÓN
          </button>
        </div>
        <button
          onClick={() => router.push(`/pedidos?productoId=${producto.id}&clienteId=${producto.clienteId}`)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 transition-all active:scale-[0.98]"
        >
          <FileText className="w-4 h-4 text-blue-500" />
          VER HISTORIAL DE PEDIDOS
        </button>
      </div>
    </div>
  );
}

// Helper Components
function QuickInfo({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col min-w-0">
      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">{label}</span>
      <span className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{value}</span>
    </div>
  );
}

function DetailSection({ title, icon, children, accentColor }: { title: string; icon: React.ReactNode; children: React.ReactNode; accentColor: string }) {
  const accentClasses = {
    blue: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30',
    emerald: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30',
    purple: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30',
    orange: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30',
  }[accentColor] || 'text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800';

  return (
    <div className="p-6">
      <h4 className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest mb-5">
        <div className={`p-2 rounded-lg ${accentClasses}`}>
          {icon}
        </div>
        {title}
      </h4>
      <div className="space-y-1">
        {children}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex items-baseline justify-between py-2 border-b border-slate-50 dark:border-slate-800 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-800 px-2 rounded-lg transition-colors group">
      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium mr-4 whitespace-nowrap">{label}</span>
      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 text-right break-words">{value}</span>
    </div>
  );
}

function FormTag({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center justify-center p-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl hover:border-emerald-200 dark:hover:border-emerald-900/50 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all group shadow-sm">
      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase group-hover:text-emerald-600 transition-colors mb-1">{label}</span>
      <span className="text-base font-black text-slate-800 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">{value}%</span>
    </div>
  );
}
