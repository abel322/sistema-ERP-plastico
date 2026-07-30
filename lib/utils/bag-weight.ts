export type TipoBolsa = 'fuelle' | 'valvula' | 'sencilla' | 'asa';

export interface CalculateBagWeightInput {
  tipoBolsa: TipoBolsa;
  ancho: number;
  largo: number;
  calibre: number;
  fuelle?: number;
  solapa?: number;
  anchoTroquel?: number;
  largoTroquel?: number;
  densidad?: number;
  divisorFactor?: number;
}

/**
 * Obtiene la densidad del plástico basada en el material especificado.
 * @param material Nombre o sigla del material (ej: PEBD, PEAD, PP)
 * @returns Factor de densidad del plástico
 */
export function getPlasticDensity(material?: string): number {
  if (!material) return 1.0;
  const mat = material.toLowerCase();
  if (mat.includes('pebd') || mat.includes('ldpe') || mat.includes('baja')) {
    return 0.92;
  }
  if (mat.includes('pead') || mat.includes('hdpe') || mat.includes('alta')) {
    return 0.95;
  }
  if (mat.includes('pp') || mat.includes('polipropileno')) {
    return 0.90;
  }
  return 1.0;
}

/**
 * Calcula el peso unitario para bolsas según la lógica de negocio especificada:
 * - fuelle: (ancho + (fuelle * 2)) * largo * calibre
 * - valvula: ((ancho * 2) + (fuelle * 2) + solapa) * largo * calibre
 * - sencilla: ancho * largo * calibre
 * - asa: ((ancho + (fuelle * 2)) * largo * calibre) - (anchoTroquel * largoTroquel * calibre)
 * 
 * Luego aplica el factor de densidad y divisor de conversión (por defecto / 1000).
 */
export function calculateBagWeight(input: CalculateBagWeightInput): number {
  const {
    tipoBolsa,
    ancho = 0,
    largo = 0,
    calibre = 0,
    fuelle = 0,
    solapa = 0,
    anchoTroquel = 0,
    largoTroquel = 0,
    densidad = 1.0,
    divisorFactor = 1000,
  } = input;

  if (!ancho || !largo || !calibre) {
    return 0;
  }

  let rawWeight = 0;

  switch (tipoBolsa) {
    case 'fuelle':
      rawWeight = (ancho + (fuelle * 2)) * largo * calibre;
      break;

    case 'valvula':
      rawWeight = ((ancho * 2) + (fuelle * 2) + solapa) * largo * calibre;
      break;

    case 'sencilla':
      rawWeight = ancho * largo * calibre;
      break;

    case 'asa':
      const baseArea = (ancho + (fuelle * 2)) * largo * calibre;
      const troquelArea = (anchoTroquel * largoTroquel * calibre);
      rawWeight = baseArea - troquelArea;
      break;

    default:
      rawWeight = ancho * largo * calibre;
      break;
  }

  const densityFactor = densidad || 1.0;
  const divisor = divisorFactor || 1000;

  const pesoFinal = (rawWeight * densityFactor) / divisor;
  return Math.max(0, parseFloat(pesoFinal.toFixed(4)));
}
