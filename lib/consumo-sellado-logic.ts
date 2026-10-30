import { calculateBagWeight, getPlasticDensity } from '@/lib/utils/bag-weight';

export interface ConsumoBobinaCalculado {
  pesoUnitarioGramos: number;
  kgBolsas: number;
  kgMerma: number;
  kgTotalConsumido: number;
}

/**
 * Calcula con precisión los kilogramos de bobina de Extrusión consumidos
 * al procesar bolsas en Sellado (peso neto de bolsas + merma de scrap generada).
 *
 * Fórmula:
 * Kg Consumidos = (Bolsas Producidas * Peso Unitario (g) / 1000) + Merma Total (kg)
 */
export function calcularConsumoBobinaSellado(params: {
  cantidadBolsas: number;
  mermaTotal: number;
  productoCliente?: any;
}): ConsumoBobinaCalculado {
  const { cantidadBolsas = 0, mermaTotal = 0, productoCliente } = params;

  let pesoUnitarioGramos = Number(productoCliente?.pesoPorUnidad) || 0;

  // Si no viene pesoPorUnidad directo, calculamos dimensionalmente con densidad y calibre
  if (!pesoUnitarioGramos && productoCliente) {
    const ancho = Number(productoCliente.ancho) || 0;
    const largo = Number(productoCliente.largo) || 0;
    const calibre = Number(productoCliente.calibre) || 0;
    const anchoValvula = Number(productoCliente.anchoValvula) || 0;
    const anchoFuelle = Number(productoCliente.anchoFuelle) || 0;
    const anchoSolapa = Number(productoCliente.anchoSolapa) || 0;
    const anchoTroquel = Number(productoCliente.anchoTroquelASA) || 0;
    const largoTroquel = Number(productoCliente.largoTroquelASA) || 0;

    if (ancho > 0 && largo > 0 && calibre > 0) {
      const densidad = getPlasticDensity(productoCliente.material);
      const tipoBolsa =
        anchoValvula > 0
          ? 'valvula'
          : Boolean(productoCliente.esBolsaASA)
          ? 'asa'
          : anchoFuelle > 0
          ? 'fuelle'
          : 'sencilla';

      pesoUnitarioGramos = calculateBagWeight({
        tipoBolsa,
        ancho,
        largo,
        calibre,
        fuelle: anchoFuelle,
        solapa: anchoSolapa,
        anchoTroquel,
        largoTroquel,
        densidad,
      });
    }
  }

  const bolsas = Math.max(0, Number(cantidadBolsas) || 0);
  const merma = Math.max(0, Number(mermaTotal) || 0);

  const kgBolsas = pesoUnitarioGramos > 0 ? (bolsas * pesoUnitarioGramos) / 1000 : 0;
  const kgTotalConsumido = Number((kgBolsas + merma).toFixed(3));

  return {
    pesoUnitarioGramos: Number(pesoUnitarioGramos.toFixed(4)),
    kgBolsas: Number(kgBolsas.toFixed(3)),
    kgMerma: Number(merma.toFixed(3)),
    kgTotalConsumido,
  };
}

/**
 * Valida si los kilogramos de bobina requeridos para el turno caben
 * en el saldo disponible de bobina entregada por Extrusión,
 * considerando un margen de tolerancia del 5%.
 */
export function validarDisponibilidadBobina(params: {
  kgRequerido: number;
  kgDisponible: number;
  margenTolerancia?: number; // Por defecto 0.05 (5%)
}): { valido: boolean; error?: string } {
  const { kgRequerido, kgDisponible, margenTolerancia = 0.05 } = params;

  const disponible = Math.max(0, Number(kgDisponible) || 0);
  const limiteConTolerancia = disponible * (1 + margenTolerancia) + 0.05;

  if (kgRequerido > limiteConTolerancia) {
    return {
      valido: false,
      error: `No hay suficiente bobina en piso. Requerido: ${kgRequerido.toFixed(2)} kg. Disponible de Extrusión: ${disponible.toFixed(2)} kg. Extrusión debe registrar más bobinas.`,
    };
  }

  return { valido: true };
}
