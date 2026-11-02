import { CategoriaInventario, TipoMovimiento } from '@prisma/client';

export interface FormulacionConsumo {
  peletizadoId?: string | null;
  peletizadoPorcentaje?: number | null;
  // Resinas vírgenes
  formFB7000?: number | null;
  fb7000?: number | null;
  form3003?: number | null;
  p3003?: number | null;
  formLineal?: number | null;
  lineal?: number | null;
  form0240?: number | null;
  p0240?: number | null;
  form0348?: number | null;
  p0348?: number | null;
  form7000F?: number | null;
  p7000F?: number | null;
  // Aditivos
  formDeslizante?: number | null;
  deslizante?: number | null;
  formMasterbachBlanco?: number | null;
  masterbachBlanco?: number | null;
  formMasterbachNegro?: number | null;
  masterbachNegro?: number | null;
  formMasterbachAzul?: number | null;
  masterbachAzul?: number | null;
  formMasterbachAmarillo?: number | null;
  masterbachAmarillo?: number | null;
}

export const RESINAS_VIRGENES_CONFIG = [
  { key: 'formFB7000', altKey: 'fb7000', label: 'FB7000', searchTerms: ['FB7000', 'FB 7000', '7000'] },
  { key: 'form3003', altKey: 'p3003', label: '3003', searchTerms: ['3003', 'PEBD 3003'] },
  { key: 'formLineal', altKey: 'lineal', label: 'Lineal', searchTerms: ['Lineal', 'LLDPE'] },
  { key: 'form0240', altKey: 'p0240', label: '0240', searchTerms: ['0240'] },
  { key: 'form0348', altKey: 'p0348', label: '0348', searchTerms: ['0348'] },
  { key: 'form7000F', altKey: 'p7000F', label: '7000F', searchTerms: ['7000F', '7000 F'] },
];

export const ADITIVOS_CONFIG = [
  { key: 'formDeslizante', altKey: 'deslizante', label: 'Deslizante', codigo: 'mb-3', nombre: 'deslizante' },
  { key: 'formMasterbachBlanco', altKey: 'masterbachBlanco', label: 'Masterbach Blanco', codigo: 'mb-1', nombre: 'masterbach blanco' },
  { key: 'formMasterbachNegro', altKey: 'masterbachNegro', label: 'Masterbach Negro', codigo: 'mb-2', nombre: 'masterbach negro' },
  { key: 'formMasterbachAzul', altKey: 'masterbachAzul', label: 'Masterbach Azul', codigo: 'mb-4', nombre: 'masterbach azul' },
  { key: 'formMasterbachAmarillo', altKey: 'masterbachAmarillo', label: 'Masterbach Amarillo', codigo: 'mb-5', nombre: 'masterbach amarillo' },
];

export interface ItemConsumoResuelto {
  inventarioId: string;
  nombre: string;
  label: string;
  kg: number;
}

export interface ConsumoExtrusionResuelto {
  peletizado?: ItemConsumoResuelto;
  resinasVirgenes: ItemConsumoResuelto[];
  aditivos: ItemConsumoResuelto[];
}

/**
 * Calcula y resuelve los ítems de inventario y los kilos correspondientes
 * de Peletizado, Materias Primas Vírgenes y Aditivos a partir de los kilos netos
 * producidos en el turno específico (kgTurno) y la formulación del producto.
 */
export async function resolverConsumoExtrusion(
  tx: any,
  formulacion: FormulacionConsumo | null | undefined,
  kgTurno: number
): Promise<ConsumoExtrusionResuelto | null> {
  const kgNetos = Number(kgTurno) || 0;
  if (!formulacion || kgNetos <= 0) return null;

  const resultado: ConsumoExtrusionResuelto = {
    resinasVirgenes: [],
    aditivos: [],
  };

  // 1. Balance Base Polímero: A. Peletizado
  const peletizadoPct = Number(formulacion.peletizadoPorcentaje) || 0;
  const kgPeletizado = peletizadoPct > 0 ? Math.round((kgNetos * (peletizadoPct / 100) + Number.EPSILON) * 100) / 100 : 0;

  if (kgPeletizado > 0) {
    let itemPeletizado: any = null;
    if (formulacion.peletizadoId) {
      itemPeletizado = await tx.inventario.findUnique({
        where: { id: formulacion.peletizadoId },
      });
    }

    if (!itemPeletizado) {
      // Fallback de búsqueda si no coincide id directo
      itemPeletizado = await tx.inventario.findFirst({
        where: {
          categoria: CategoriaInventario.Peletizado,
        },
      });
    }

    if (itemPeletizado) {
      resultado.peletizado = {
        inventarioId: itemPeletizado.id,
        nombre: itemPeletizado.nombre,
        label: itemPeletizado.nombre,
        kg: kgPeletizado,
      };
    }
  }

  // 2. Balance Base Polímero: B. Materias Primas Vírgenes Disponibles y Distribución Proporcional
  const kgPeletizadoEfectivo = resultado.peletizado ? resultado.peletizado.kg : (peletizadoPct > 0 ? kgPeletizado : 0);
  const kgVirgenTotal = kgNetos;

  const sumaVirgen = RESINAS_VIRGENES_CONFIG.reduce((sum, r) => {
    const pct = Number((formulacion as any)[r.key] ?? (formulacion as any)[r.altKey]) || 0;
    return sum + pct;
  }, 0);

  if (kgVirgenTotal > 0 && sumaVirgen > 0) {
    for (const resina of RESINAS_VIRGENES_CONFIG) {
      const resinaPct = Number((formulacion as any)[resina.key] ?? (formulacion as any)[resina.altKey]) || 0;
      if (resinaPct > 0) {
        const kgResina = Math.round((kgNetos * (resinaPct / 100) + Number.EPSILON) * 100) / 100;

        let itemMp: any = null;
        for (const term of resina.searchTerms) {
          itemMp = await tx.inventario.findFirst({
            where: {
              categoria: CategoriaInventario.MateriaPrima,
              OR: [
                { codigo: { contains: term, mode: 'insensitive' } },
                { nombre: { contains: term, mode: 'insensitive' } },
              ],
            },
          });
          if (itemMp) break;
        }

        // Fallback general por código o término si no está categorizado estrictamente
        if (!itemMp) {
          for (const term of resina.searchTerms) {
            itemMp = await tx.inventario.findFirst({
              where: {
                OR: [
                  { codigo: { contains: term, mode: 'insensitive' } },
                  { nombre: { contains: term, mode: 'insensitive' } },
                ],
              },
            });
            if (itemMp) break;
          }
        }

        if (itemMp) {
          resultado.resinasVirgenes.push({
            inventarioId: itemMp.id,
            nombre: itemMp.nombre,
            label: resina.label,
            kg: kgResina,
          });
        }
      }
    }
  }

  // 3. Aditivos (Dosificación sobre los kg producidos en el turno)
  for (const aditivo of ADITIVOS_CONFIG) {
    const aditivoPct = Number((formulacion as any)[aditivo.key] ?? (formulacion as any)[aditivo.altKey]) || 0;
    if (aditivoPct > 0) {
      const kgAditivo = Math.round((kgNetos * (aditivoPct / 100) + Number.EPSILON) * 100) / 100;

      let itemAditivo = await tx.inventario.findFirst({
        where: {
          categoria: CategoriaInventario.Aditivo,
          OR: [
            { codigo: { equals: aditivo.codigo, mode: 'insensitive' } },
            { nombre: { contains: aditivo.nombre, mode: 'insensitive' } },
          ],
        },
      });

      if (!itemAditivo) {
        itemAditivo = await tx.inventario.findFirst({
          where: {
            codigo: { equals: aditivo.codigo, mode: 'insensitive' },
          },
        });
      }

      if (itemAditivo) {
        resultado.aditivos.push({
          inventarioId: itemAditivo.id,
          nombre: itemAditivo.nombre,
          label: aditivo.label,
          kg: kgAditivo,
        });
      }
    }
  }

  return resultado;
}

/**
 * Descuenta del inventario los consumos calculados y genera los movimientos de tipo Salida.
 */
export async function aplicarConsumoExtrusion(
  tx: any,
  params: {
    consumo: ConsumoExtrusionResuelto;
    loteCodigo: string;
    turno: string;
    responsable: string;
  }
) {
  const { consumo, loteCodigo, turno, responsable } = params;

  // 1. Peletizado
  if (consumo.peletizado && consumo.peletizado.kg > 0) {
    await tx.inventario.update({
      where: { id: consumo.peletizado.inventarioId },
      data: {
        cantidad: { decrement: consumo.peletizado.kg },
      },
    });

    await tx.movimientoInventario.create({
      data: {
        inventarioId: consumo.peletizado.inventarioId,
        tipo: TipoMovimiento.Salida,
        cantidad: consumo.peletizado.kg,
        motivo: `Consumo Peletizado (${consumo.peletizado.nombre}) en Extrusión - Lote ${loteCodigo} (Turno ${turno})`,
        referencia: loteCodigo,
        responsable: responsable || 'Sistema',
      },
    });
  }

  // 2. Resinas Vírgenes
  for (const resina of consumo.resinasVirgenes) {
    if (resina.kg > 0) {
      await tx.inventario.update({
        where: { id: resina.inventarioId },
        data: {
          cantidad: { decrement: resina.kg },
        },
      });

      await tx.movimientoInventario.create({
        data: {
          inventarioId: resina.inventarioId,
          tipo: TipoMovimiento.Salida,
          cantidad: resina.kg,
          motivo: `Consumo Materia Prima (${resina.label}) en Extrusión - Lote ${loteCodigo} (Turno ${turno})`,
          referencia: loteCodigo,
          responsable: responsable || 'Sistema',
        },
      });
    }
  }

  // 3. Aditivos
  for (const aditivo of consumo.aditivos) {
    if (aditivo.kg > 0) {
      await tx.inventario.update({
        where: { id: aditivo.inventarioId },
        data: {
          cantidad: { decrement: aditivo.kg },
        },
      });

      await tx.movimientoInventario.create({
        data: {
          inventarioId: aditivo.inventarioId,
          tipo: TipoMovimiento.Salida,
          cantidad: aditivo.kg,
          motivo: `Consumo Aditivo (${aditivo.nombre}) en Extrusión - Lote ${loteCodigo} (Turno ${turno})`,
          referencia: loteCodigo,
          responsable: responsable || 'Sistema',
        },
      });
    }
  }
}

/**
 * Revierte del inventario los consumos calculados y genera los movimientos de tipo Entrada
 * correspondientes para mantener el kardex perfectamente sincronizado en caso de edición o eliminación de turno.
 */
export async function revertirConsumoExtrusion(
  tx: any,
  params: {
    consumo: ConsumoExtrusionResuelto;
    loteCodigo: string;
    turno: string;
    responsable: string;
    accion?: 'Edición' | 'Eliminación';
  }
) {
  const { consumo, loteCodigo, turno, responsable, accion = 'Edición' } = params;

  // 1. Peletizado
  if (consumo.peletizado && consumo.peletizado.kg > 0) {
    await tx.inventario.update({
      where: { id: consumo.peletizado.inventarioId },
      data: {
        cantidad: { increment: consumo.peletizado.kg },
      },
    });

    await tx.movimientoInventario.create({
      data: {
        inventarioId: consumo.peletizado.inventarioId,
        tipo: TipoMovimiento.Entrada,
        cantidad: consumo.peletizado.kg,
        motivo: `Reversión Consumo Peletizado (${consumo.peletizado.nombre}) por ${accion} en Extrusión - Lote ${loteCodigo} (Turno ${turno})`,
        referencia: loteCodigo,
        responsable: responsable || 'Sistema',
      },
    });
  }

  // 2. Resinas Vírgenes
  for (const resina of consumo.resinasVirgenes) {
    if (resina.kg > 0) {
      await tx.inventario.update({
        where: { id: resina.inventarioId },
        data: {
          cantidad: { increment: resina.kg },
        },
      });

      await tx.movimientoInventario.create({
        data: {
          inventarioId: resina.inventarioId,
          tipo: TipoMovimiento.Entrada,
          cantidad: resina.kg,
          motivo: `Reversión Consumo Materia Prima (${resina.label}) por ${accion} en Extrusión - Lote ${loteCodigo} (Turno ${turno})`,
          referencia: loteCodigo,
          responsable: responsable || 'Sistema',
        },
      });
    }
  }

  // 3. Aditivos
  for (const aditivo of consumo.aditivos) {
    if (aditivo.kg > 0) {
      await tx.inventario.update({
        where: { id: aditivo.inventarioId },
        data: {
          cantidad: { increment: aditivo.kg },
        },
      });

      await tx.movimientoInventario.create({
        data: {
          inventarioId: aditivo.inventarioId,
          tipo: TipoMovimiento.Entrada,
          cantidad: aditivo.kg,
          motivo: `Reversión Consumo Aditivo (${aditivo.nombre}) por ${accion} en Extrusión - Lote ${loteCodigo} (Turno ${turno})`,
          referencia: loteCodigo,
          responsable: responsable || 'Sistema',
        },
      });
    }
  }
}
