import { calculateBagWeight, getPlasticDensity } from './bag-weight';
import { formatNumber } from '../utils';

export type NivelMerma = 'optimo' | 'precaucion' | 'critico' | 'inicial';

export interface SemaforoMermaConfig {
  nivel: NivelMerma;
  label: string;
  badgeText: string;
  colorText: string;
  colorBg: string;
  colorBorder: string;
  badgeClass: string;
  dotColor: string;
  esAlertaAlta: boolean;
}

export interface ProductoEspecificacion {
  pesoPorUnidad?: number;
  ancho?: number;
  largo?: number;
  calibre?: number;
  anchoValvula?: number;
  anchoFuelle?: number;
  anchoSolapa?: number;
  material?: string;
  tipoProducto?: string;
}

export interface CalcularDesperdicioParams {
  area: string;
  merma: number;
  producido: number;
  unidad?: string;
  targetAmount?: number;
  productoCliente?: ProductoEspecificacion | null;
  esOrdenFinalizada?: boolean;
}

export interface DesperdicioResultado {
  porcentaje: number | null;
  tienePorcentaje: boolean;
  kilosEquivalentesProducidos: number | null;
  masaTotalConsumida: number | null;
  isUnidades: boolean;
  esAjusteInicial: boolean;
  semaforo: SemaforoMermaConfig;
}

/**
 * Obtiene la configuración visual del semáforo de merma según el porcentaje y el estado de la orden.
 * Reglas de calificación estándar en manufactura plástica:
 * - Óptimo / Normal: <= 3.0% (Verde)
 * - Precaución / Monitorear: 3.1% - 5.0% (Ámbar)
 * - Crítico / Alta Merma: > 5.0% (Rojo)
 */
export function getSemaforoMerma(
  porcentaje: number | null,
  opciones?: { esAjusteInicial?: boolean }
): SemaforoMermaConfig {
  if (opciones?.esAjusteInicial) {
    return {
      nivel: 'inicial',
      label: 'Ajuste inicial',
      badgeText: 'Ajuste inicial',
      colorText: 'text-slate-500 dark:text-slate-400',
      colorBg: 'bg-slate-50 dark:bg-slate-800/60',
      colorBorder: 'border-slate-200 dark:border-slate-700',
      badgeClass: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700',
      dotColor: 'bg-slate-400',
      esAlertaAlta: false,
    };
  }

  if (porcentaje === null) {
    return {
      nivel: 'optimo',
      label: 'Normal',
      badgeText: 'Sin %',
      colorText: 'text-slate-600 dark:text-slate-400',
      colorBg: 'bg-slate-50 dark:bg-slate-800/60',
      colorBorder: 'border-slate-200 dark:border-slate-700',
      badgeClass: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700',
      dotColor: 'bg-slate-400',
      esAlertaAlta: false,
    };
  }

  if (porcentaje <= 3.0) {
    return {
      nivel: 'optimo',
      label: 'Óptima',
      badgeText: 'Óptima',
      colorText: 'text-emerald-600 dark:text-emerald-400',
      colorBg: 'bg-emerald-50 dark:bg-emerald-950/30',
      colorBorder: 'border-emerald-200 dark:border-emerald-900/50',
      badgeClass: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60',
      dotColor: 'bg-emerald-500',
      esAlertaAlta: false,
    };
  }

  if (porcentaje <= 5.0) {
    return {
      nivel: 'precaucion',
      label: 'Precaución',
      badgeText: 'Precaución',
      colorText: 'text-amber-600 dark:text-amber-400',
      colorBg: 'bg-amber-50 dark:bg-amber-950/30',
      colorBorder: 'border-amber-200 dark:border-amber-900/50',
      badgeClass: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60',
      dotColor: 'bg-amber-500',
      esAlertaAlta: false,
    };
  }

  return {
    nivel: 'critico',
    label: 'Crítica',
    badgeText: 'Merma Alta',
    colorText: 'text-rose-600 dark:text-rose-400',
    colorBg: 'bg-rose-50 dark:bg-rose-950/30',
    colorBorder: 'border-rose-200 dark:border-rose-900/50',
    badgeClass: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60',
    dotColor: 'bg-rose-500',
    esAlertaAlta: true,
  };
}

/**
 * Calcula de manera centralizada la eficiencia y porcentaje de merma.
 * Maneja diferenciación estricta de unidad de medida:
 * - KG (Extrusión, Bobinas): merma / (producidoKg + mermaKg) * 100
 * - UND (Sellado, Bolsas): convierte piezas a kilosEquivalentes según peso unitario o dimensiones.
 * Evalúa la condición de arranque para no generar falsas alarmas durante el inicio de máquina.
 */
export function calcularDesperdicioInfo({
  area,
  merma = 0,
  producido = 0,
  unidad = '',
  targetAmount = 0,
  productoCliente,
  esOrdenFinalizada = false,
}: CalcularDesperdicioParams): DesperdicioResultado {
  const unidadLower = (unidad || '').toLowerCase();
  const isUnidades =
    unidadLower.startsWith('un') ||
    unidadLower.startsWith('ud') ||
    area === 'Sellado';

  // Condición de arranque:
  // Para evitar falsas alarmas rojas durante el arranque (calibraciones iniciales),
  // se evalúa el semáforo únicamente si la producción acumulada supera un mínimo razonable
  // (> 5% de la meta o > 50 kg / 1.000 bolsas). Si está por debajo, se marca como ajuste inicial.
  let esAjusteInicial = false;
  if (!esOrdenFinalizada) {
    const umbralUnidades = 1000;
    const umbralKg = 50;
    const superoPorcentajeMeta = targetAmount > 0 && producido >= targetAmount * 0.05;
    const superoUmbralFisico = isUnidades ? producido >= umbralUnidades : producido >= umbralKg;

    if (!superoPorcentajeMeta && !superoUmbralFisico) {
      esAjusteInicial = true;
    }
  }

  if (isUnidades) {
    let pesoUnitarioKg = 0;

    if (productoCliente?.pesoPorUnidad && productoCliente.pesoPorUnidad > 0) {
      // pesoPorUnidad en gramos -> convertir a kg
      pesoUnitarioKg = productoCliente.pesoPorUnidad / 1000;
    } else if (
      productoCliente?.ancho &&
      productoCliente?.largo &&
      productoCliente?.calibre
    ) {
      const densidad = getPlasticDensity(productoCliente.material);
      const pesoGramos = calculateBagWeight({
        tipoBolsa:
          productoCliente.anchoValvula && productoCliente.anchoValvula > 0
            ? 'valvula'
            : productoCliente.anchoFuelle && productoCliente.anchoFuelle > 0
            ? 'fuelle'
            : 'sencilla',
        ancho: productoCliente.ancho,
        largo: productoCliente.largo,
        calibre: productoCliente.calibre,
        fuelle: productoCliente.anchoFuelle,
        solapa: productoCliente.anchoSolapa,
        densidad,
      });
      if (pesoGramos > 0) {
        pesoUnitarioKg = pesoGramos / 1000;
      }
    }

    if (pesoUnitarioKg > 0) {
      const kilosEquivalentesProducidos = producido * pesoUnitarioKg;
      const masaTotalConsumida = kilosEquivalentesProducidos + (merma || 0);

      if (masaTotalConsumida > 0) {
        const porcentaje = ((merma || 0) / masaTotalConsumida) * 100;
        return {
          porcentaje,
          tienePorcentaje: true,
          kilosEquivalentesProducidos,
          masaTotalConsumida,
          isUnidades: true,
          esAjusteInicial,
          semaforo: getSemaforoMerma(porcentaje, { esAjusteInicial }),
        };
      }

      return {
        porcentaje: 0,
        tienePorcentaje: true,
        kilosEquivalentesProducidos: 0,
        masaTotalConsumida: 0,
        isUnidades: true,
        esAjusteInicial,
        semaforo: getSemaforoMerma(0, { esAjusteInicial }),
      };
    }

    // Sin peso unitario para piezas: omitir porcentaje para evitar dividir kg entre unidades
    return {
      porcentaje: null,
      tienePorcentaje: false,
      kilosEquivalentesProducidos: null,
      masaTotalConsumida: null,
      isUnidades: true,
      esAjusteInicial,
      semaforo: getSemaforoMerma(null, { esAjusteInicial }),
    };
  } else {
    // Área en KG (Extrusión, etc.)
    const masaTotalConsumida = producido + (merma || 0);
    const porcentaje =
      masaTotalConsumida > 0 ? ((merma || 0) / masaTotalConsumida) * 100 : 0;

    return {
      porcentaje,
      tienePorcentaje: true,
      kilosEquivalentesProducidos: producido,
      masaTotalConsumida,
      isUnidades: false,
      esAjusteInicial,
      semaforo: getSemaforoMerma(porcentaje, { esAjusteInicial }),
    };
  }
}
