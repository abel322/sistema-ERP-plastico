import { calculateBagWeight, getPlasticDensity } from './utils/bag-weight';

export interface InfoSobrante {
  cantidadProgramada: number;
  cantidadProducida: number;
  unidad: string;
  isUnidades: boolean;
  sobranteKg: number;
  sobranteUnidades: number;
  haySobrante: boolean;
  sobranteTexto: string;
  sobranteLabel: string;
  porcentajeExcedente: number;
}

export interface ResumenSobrantesGrupo {
  sobrantesFases: Array<{
    fase: any;
    info: InfoSobrante;
  }>;
  fasesConSobrante: Array<{
    fase: any;
    info: InfoSobrante;
  }>;
  totalSobranteKg: number;
  totalSobranteUnd: number;
  tieneSobrantes: boolean;
}

/**
 * Calcula el sobrante o excedente generado en una fase de producción
 * (Extrusión, Serigrafía, Sellado, Refilado) comparando la cantidad producida
 * contra la programada/solicitada del pedido.
 */
export function calcularSobranteFase(prod: any): InfoSobrante {
  const isUnidades =
    prod.area === 'Sellado' ||
    prod.unidad?.toLowerCase().startsWith('un') ||
    prod.unidad?.toLowerCase().startsWith('ud');

  const cantidadProducida = Number(prod.cantidadProducida) || 0;

  // 1. Determinar Cantidad Programada / Requerida
  let cantidadProgramada = Number(prod.cantidadProgramada) || 0;

  if (cantidadProgramada <= 0 && prod.pedido) {
    const cantPed = Number(prod.pedido.cantidadSolicitada) || 0;
    const unidadPed = (prod.pedido.unidad || '').toLowerCase();

    if (isUnidades || unidadPed.startsWith('un') || unidadPed.startsWith('ud')) {
      if (isUnidades) {
        // En sellado, la meta directa son las unidades solicitadas
        cantidadProgramada = cantPed;
      } else {
        // Área en kg (Extrusión/Serigrafía/Refilado) pero el pedido fue solicitado en unidades
        const f = prod.productoCliente || prod.pedido.productoCliente;
        let pesoUnitarioKg = 0;

        if (f?.pesoPorUnidad && f.pesoPorUnidad > 0) {
          pesoUnitarioKg = f.pesoPorUnidad / 1000;
        } else if (f?.ancho && f?.largo && f?.calibre) {
          const densidad = getPlasticDensity(f.material);
          const pesoGramos = calculateBagWeight({
            tipoBolsa:
              f.anchoValvula && f.anchoValvula > 0
                ? 'valvula'
                : f.anchoFuelle && f.anchoFuelle > 0
                ? 'fuelle'
                : 'sencilla',
            ancho: f.ancho,
            largo: f.largo,
            calibre: f.calibre,
            fuelle: f.anchoFuelle,
            solapa: f.anchoSolapa,
            densidad,
          });
          if (pesoGramos > 0) pesoUnitarioKg = pesoGramos / 1000;
        }

        if (pesoUnitarioKg > 0 && cantPed > 0) {
          cantidadProgramada = Math.round(cantPed * pesoUnitarioKg * 100) / 100;
        } else {
          cantidadProgramada = cantidadProducida;
        }
      }
    } else {
      // Pedido en Kg
      cantidadProgramada = cantPed;
    }
  }

  // Fallback si no hay pedido ni dato programado: se asume que produjo lo programado
  if (cantidadProgramada <= 0) {
    cantidadProgramada = cantidadProducida;
  }

  // 2. Calcular Sobrante
  const diff = Math.max(0, cantidadProducida - cantidadProgramada);

  let sobranteKg = 0;
  let sobranteUnidades = 0;
  let sobranteLabel = 'Sobrante';
  let sobranteTexto = '';

  if (isUnidades) {
    sobranteUnidades =
      prod.sobranteUnidades && prod.sobranteUnidades > 0
        ? prod.sobranteUnidades
        : Math.round(diff);
    sobranteLabel = 'Sobrante Bolsas';
    sobranteTexto = `+${sobranteUnidades.toLocaleString('es-VE')} UND`;
  } else {
    sobranteKg =
      prod.sobranteKg && prod.sobranteKg > 0
        ? prod.sobranteKg
        : Math.round(diff * 100) / 100;

    if (prod.area === 'Extrusion') {
      sobranteLabel = 'Sobrante Bobina';
    } else if (prod.area === 'Serigrafia') {
      sobranteLabel = 'Sobrante Bobina Impresa';
    } else if (prod.area === 'Refilado') {
      sobranteLabel = 'Sobrante Bobina Refilada';
    } else {
      sobranteLabel = 'Sobrante Material';
    }
    sobranteTexto = `+${sobranteKg.toFixed(2)} kg`;
  }

  const haySobrante = isUnidades ? sobranteUnidades > 0 : sobranteKg > 0;
  const porcentajeExcedente =
    cantidadProgramada > 0 && haySobrante
      ? Math.round(((isUnidades ? sobranteUnidades : sobranteKg) / cantidadProgramada) * 1000) / 10
      : 0;

  return {
    cantidadProgramada,
    cantidadProducida,
    unidad: isUnidades ? 'UND' : 'kg',
    isUnidades,
    sobranteKg,
    sobranteUnidades,
    haySobrante,
    sobranteTexto,
    sobranteLabel,
    porcentajeExcedente,
  };
}

/**
 * Calcula el resumen de excedentes para un grupo de fases de una orden
 */
export function calcularResumenSobrantesGrupo(grupo: any[]): ResumenSobrantesGrupo {
  const sobrantesFases = (grupo || []).map((fase) => ({
    fase,
    info: calcularSobranteFase(fase),
  }));

  const fasesConSobrante = sobrantesFases.filter((f) => f.info.haySobrante);
  const totalSobranteKg = fasesConSobrante
    .filter((f) => !f.info.isUnidades)
    .reduce((sum, f) => sum + f.info.sobranteKg, 0);
  const totalSobranteUnd = fasesConSobrante
    .filter((f) => f.info.isUnidades)
    .reduce((sum, f) => sum + f.info.sobranteUnidades, 0);

  return {
    sobrantesFases,
    fasesConSobrante,
    totalSobranteKg,
    totalSobranteUnd,
    tieneSobrantes: fasesConSobrante.length > 0,
  };
}
