import { randomBytes } from 'crypto';

export type AreaName = 'Extrusion' | 'Serigrafia' | 'Sellado' | 'Refilado' | string;

const AREA_PREFIXES: Record<string, string> = {
  Extrusion: 'EXT',
  Serigrafia: 'SER',
  Sellado: 'SEL',
  Refilado: 'REF',
};

/**
 * Obtiene el prefijo de lote de acuerdo al área de producción.
 */
export function getAreaPrefix(area: AreaName): string {
  return AREA_PREFIXES[area] || 'PRD';
}

/**
 * Formatea una fecha a YYYYMMDD.
 */
export function formatFechaLote(dateInput?: Date | string): string {
  const d = dateInput ? new Date(dateInput) : new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

/**
 * Genera un código de lote único y legible con el formato:
 * PREFIX-YYYYMMDD-XXXX
 * Ejemplo: EXT-20260925-9A4B
 */
export function generarCodigoLote(area: AreaName, fecha?: Date | string): string {
  const prefix = getAreaPrefix(area);
  const fechaStr = formatFechaLote(fecha);
  const randomSuffix = randomBytes(2).toString('hex').toUpperCase(); // 4 caracteres hexadecimales (ej. A1B2)
  return `${prefix}-${fechaStr}-${randomSuffix}`;
}

/**
 * Genera un código de lote garantizando que no colisione con registros existentes en la base de datos.
 */
export async function generarCodigoLoteUnico(
  prismaClient: any,
  area: AreaName,
  fecha?: Date | string
): Promise<string> {
  const maxAttempts = 10;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const candidate = generarCodigoLote(area, fecha);
    
    // Verificar si existe en Produccion o ProductoTerminado
    const [existenteProd, existentePt] = await Promise.all([
      prismaClient.produccion.findUnique({
        where: { codigoLote: candidate },
        select: { id: true },
      }),
      prismaClient.productoTerminado.findUnique({
        where: { codigoLote: candidate },
        select: { id: true },
      }),
    ]);

    if (!existenteProd && !existentePt) {
      return candidate;
    }
  }

  // Fallback con timestamp y más entropía en el rarísimo caso de colisión
  const prefix = getAreaPrefix(area);
  const fechaStr = formatFechaLote(fecha);
  const extraSuffix = randomBytes(4).toString('hex').toUpperCase();
  return `${prefix}-${fechaStr}-${extraSuffix}`;
}
