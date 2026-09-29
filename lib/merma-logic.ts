import { CategoriaInventario, TipoMovimiento } from '@prisma/client';

export type MermaKey = 'mermaTransparenteAlta' | 'mermaBlancoPollo' | 'mermaColor' | 'mermaTransparenteBaja' | 'mermaBlancoPego';

export interface MermaItemConfig {
  key: MermaKey;
  label: string;
  shortLabel: string;
  codigo: string; // "molido 1", "molido 2", etc.
  searchTerms: string[];
  color: string;
  badgeClass: string;
  borderClass: string;
}

export interface MermaFieldConfig {
  key: MermaKey;
  label: string;
  shortLabel: string;
  molidoBadge: string;
  codigo: string;
  colorClass: string;
  badgeClass: string;
  borderClass: string;
}

export interface ProductoMermaInfo {
  material?: string | null;
  conImpresion?: boolean | null;
  llevaImpresion?: boolean | null;
  conPigmento?: boolean | null;
  color?: string | null;
  nombreProducto?: string | null;
  formMasterbachBlanco?: number | null;
  masterbachBlanco?: number | null;
  formMasterbachNegro?: number | null;
  masterbachNegro?: number | null;
  formMasterbachAzul?: number | null;
  masterbachAzul?: number | null;
  formMasterbachAmarillo?: number | null;
  masterbachAmarillo?: number | null;
  peletizadoId?: string | null;
  peletizado?: {
    id?: string;
    nombre?: string | null;
    codigo?: string | null;
  } | null;
}

export const CLASIFICACIONES_MERMA: MermaItemConfig[] = [
  {
    key: 'mermaTransparenteAlta',
    label: 'Transparente Alta',
    shortLabel: 'Transp. Alta',
    codigo: 'molido 1',
    searchTerms: ['molido 1', 'transparente alta'],
    color: 'bg-emerald-500',
    badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
    borderClass: 'border-emerald-200 dark:border-emerald-900/50 focus:ring-emerald-500',
  },
  {
    key: 'mermaBlancoPollo',
    label: 'Blanco Pollo',
    shortLabel: 'Blanco Pollo',
    codigo: 'molido 2',
    searchTerms: ['molido 2', 'blanco pollo'],
    color: 'bg-sky-500',
    badgeClass: 'bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300 border-sky-300 dark:border-sky-800',
    borderClass: 'border-sky-200 dark:border-sky-900/50 focus:ring-sky-500',
  },
  {
    key: 'mermaColor',
    label: 'Color',
    shortLabel: 'Color',
    codigo: 'molido 3',
    searchTerms: ['molido 3', 'color'],
    color: 'bg-purple-500',
    badgeClass: 'bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border-purple-300 dark:border-purple-800',
    borderClass: 'border-purple-200 dark:border-purple-900/50 focus:ring-purple-500',
  },
  {
    key: 'mermaTransparenteBaja',
    label: 'Transparente Baja',
    shortLabel: 'Transp. Baja',
    codigo: 'molido 4',
    searchTerms: ['molido 4', 'transparente baja'],
    color: 'bg-amber-500',
    badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300 dark:border-amber-800',
    borderClass: 'border-amber-200 dark:border-amber-900/50 focus:ring-amber-500',
  },
  {
    key: 'mermaBlancoPego',
    label: 'Blanco Pego',
    shortLabel: 'Blanco Pego',
    codigo: 'molido 5',
    searchTerms: ['molido 5', 'blanco pego'],
    color: 'bg-rose-500',
    badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border-rose-300 dark:border-rose-800',
    borderClass: 'border-rose-200 dark:border-rose-900/50 focus:ring-rose-500',
  },
];

/**
 * Determina la Merma Base del plástico según la Ficha Técnica del producto:
 * - Si lleva pigmento de color (Negro, Azul, Amarillo o Peletizado Color) -> mermaColor (MOLIDO 3)
 * - Si lleva pigmento blanco (Masterbach Blanco > 0 o fórmula blanca) -> mermaBlancoPollo (MOLIDO 2) o mermaBlancoPego (MOLIDO 5)
 * - Si NO lleva pigmento (Natural / Transparente):
 *     * Material === 'Alta' -> mermaTransparenteAlta (MOLIDO 1)
 *     * Material === 'Baja' -> mermaTransparenteBaja (MOLIDO 4)
 */
export function determinarMermaBase(producto?: ProductoMermaInfo | null): MermaKey {
  // 1. Pigmento de color (Negro, Azul, Amarillo o Peletizado Color)
  const mbNegro = Number(producto?.formMasterbachNegro ?? producto?.masterbachNegro) || 0;
  const mbAzul = Number(producto?.formMasterbachAzul ?? producto?.masterbachAzul) || 0;
  const mbAmarillo = Number(producto?.formMasterbachAmarillo ?? producto?.masterbachAmarillo) || 0;
  const pelCodigo = (producto?.peletizado?.codigo || '').toLowerCase().trim();
  const pelNombre = (producto?.peletizado?.nombre || '').toLowerCase().trim();
  const colorProd = (producto?.color || '').toLowerCase().trim();

  const tienePigmentoColor =
    mbNegro > 0 ||
    mbAzul > 0 ||
    mbAmarillo > 0 ||
    pelCodigo === 'molido 3' ||
    pelNombre.includes('color') ||
    (colorProd && !['natural', 'transparente', 'blanco', 'cristal', 'sin pigmento', 's/i'].includes(colorProd));

  if (tienePigmentoColor) {
    return 'mermaColor'; // MOLIDO 3
  }

  // 2. Pigmento blanco (Masterbach Blanco > 0 o fórmula blanca)
  const mbBlanco = Number(producto?.formMasterbachBlanco ?? producto?.masterbachBlanco) || 0;
  const nombreProd = (producto?.nombreProducto || '').toLowerCase();

  const tienePigmentoBlanco =
    mbBlanco > 0 ||
    pelCodigo === 'molido 2' ||
    pelCodigo === 'molido 5' ||
    pelNombre.includes('blanco') ||
    colorProd.includes('blanco') ||
    nombreProd.includes('blanco') ||
    (Boolean(producto?.conPigmento) && (pelNombre.includes('blanco') || colorProd.includes('blanco')));

  if (tienePigmentoBlanco) {
    // Si corresponde a Blanco Pollo (MOLIDO 2) o Blanco Pego (MOLIDO 5)
    if (
      pelCodigo === 'molido 2' ||
      pelNombre.includes('pollo') ||
      nombreProd.includes('pollo') ||
      colorProd.includes('pollo')
    ) {
      return 'mermaBlancoPollo'; // MOLIDO 2
    }
    if (
      pelCodigo === 'molido 5' ||
      pelNombre.includes('pego') ||
      nombreProd.includes('pego') ||
      colorProd.includes('pego')
    ) {
      return 'mermaBlancoPego'; // MOLIDO 5
    }

    // Si no especifica en nombre ni peletizado, según material:
    const mat = (producto?.material || '').toLowerCase();
    if (mat.includes('alta') || mat.includes('pead') || mat.includes('hdpe')) {
      return 'mermaBlancoPollo'; // MOLIDO 2
    }
    return 'mermaBlancoPego'; // MOLIDO 5
  }

  // 3. Sin pigmento (Natural / Transparente):
  const mat = (producto?.material || '').toLowerCase();
  if (mat.includes('alta') || mat.includes('pead') || mat.includes('hdpe')) {
    return 'mermaTransparenteAlta'; // MOLIDO 1
  }

  // Por defecto en baja o no especificado:
  return 'mermaTransparenteBaja'; // MOLIDO 4
}

/**
 * Determina los campos de merma que físicamente aplican según el Área de Producción y la Ficha Técnica:
 * 1. EXTRUSIÓN: Solo 1 campo -> Merma Base del producto.
 * 2. SERIGRAFÍA:
 *    - Si lleva impresión: 2 campos -> Merma Base limpia (sin tinta) + Merma Color (con tinta).
 *    - Si no lleva impresión: 1 campo -> Merma Base.
 * 3. SELLADO:
 *    - Si es impreso: 1 campo -> Merma Color (MOLIDO 3).
 *    - Si no es impreso: 1 campo -> Merma Base.
 * 4. REFILADO:
 *    - 2 campos -> Merma Color (MOLIDO 3) + Merma Transparente Baja (MOLIDO 4).
 */
export function determinarCamposMerma(
  area: string,
  producto?: ProductoMermaInfo | null
): MermaFieldConfig[] {
  const areaNorm = (area || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim();
  const llevaImpresion = Boolean(
    producto?.llevaImpresion ??
    producto?.conImpresion ??
    false
  );

  const mermaBaseKey = determinarMermaBase(producto);
  const configMap = new Map<MermaKey, MermaFieldConfig>(
    CLASIFICACIONES_MERMA.map((c) => [
      c.key,
      {
        key: c.key,
        label: c.label,
        shortLabel: c.shortLabel,
        molidoBadge: c.codigo.toUpperCase(),
        codigo: c.codigo,
        colorClass: c.color,
        badgeClass: c.badgeClass,
        borderClass: c.borderClass,
      },
    ])
  );

  const getField = (k: MermaKey) => configMap.get(k)!;

  // 1. ÁREA EXTRUSIÓN: No hay tinta. Solo 1 campo: Merma Base.
  if (areaNorm === 'EXTRUSION') {
    return [getField(mermaBaseKey)];
  }

  // 2. ÁREA SERIGRAFÍA:
  if (areaNorm === 'SERIGRAFIA') {
    if (llevaImpresion) {
      if (mermaBaseKey === 'mermaColor') {
        return [getField('mermaColor')];
      }
      return [
        {
          ...getField(mermaBaseKey),
          label: `${getField(mermaBaseKey).label} (Sin Tinta / Limpia)`,
        },
        {
          ...getField('mermaColor'),
          label: 'Merma Color (Con Tinta)',
        },
      ];
    }
    return [getField(mermaBaseKey)];
  }

  // 3. ÁREA SELLADO:
  if (areaNorm === 'SELLADO') {
    if (llevaImpresion) {
      return [
        {
          ...getField('mermaColor'),
          label: 'Merma Color (Con Tinta)',
        },
      ];
    }
    return [getField(mermaBaseKey)];
  }

  // 4. ÁREA REFILADO:
  // En Refilado NUNCA se genera merma blanca ni merma transparente alta.
  if (areaNorm === 'REFILADO') {
    return [
      getField('mermaColor'),
      getField('mermaTransparenteBaja'),
    ];
  }

  return [getField(mermaBaseKey)];
}

export function calcularDesgloseMerma(data: any): {
  mermaTotal: number;
  mermaTransparenteAlta: number;
  mermaBlancoPollo: number;
  mermaColor: number;
  mermaTransparenteBaja: number;
  mermaBlancoPego: number;
} {
  if (Array.isArray(data)) {
    return data.reduce(
      (acc, item) => {
        const itemDesglose = calcularDesgloseMerma(item);
        return {
          mermaTotal: acc.mermaTotal + itemDesglose.mermaTotal,
          mermaTransparenteAlta: acc.mermaTransparenteAlta + itemDesglose.mermaTransparenteAlta,
          mermaBlancoPollo: acc.mermaBlancoPollo + itemDesglose.mermaBlancoPollo,
          mermaColor: acc.mermaColor + itemDesglose.mermaColor,
          mermaTransparenteBaja: acc.mermaTransparenteBaja + itemDesglose.mermaTransparenteBaja,
          mermaBlancoPego: acc.mermaBlancoPego + itemDesglose.mermaBlancoPego,
        };
      },
      {
        mermaTotal: 0,
        mermaTransparenteAlta: 0,
        mermaBlancoPollo: 0,
        mermaColor: 0,
        mermaTransparenteBaja: 0,
        mermaBlancoPego: 0,
      }
    );
  }

  const alta = Number(data?.mermaTransparenteAlta) || 0;
  const pollo = Number(data?.mermaBlancoPollo) || 0;
  const color = Number(data?.mermaColor) || 0;
  const baja = Number(data?.mermaTransparenteBaja) || 0;
  const pego = Number(data?.mermaBlancoPego) || 0;

  const suma5 = alta + pollo + color + baja + pego;

  // Si no se han ingresado campos nuevos pero hay datos legados en merma / mermaCristal:
  if (suma5 === 0 && (Number(data?.merma) || Number(data?.mermaCristal))) {
    const mCristal = Number(data?.mermaCristal) || Number(data?.mermaSinImpresion) || 0;
    const mColor = Number(data?.mermaColor) || Number(data?.mermaImpreso) || 0;
    const mTotal = Number(data?.merma) || (mCristal + mColor);
    return {
      mermaTotal: mTotal,
      mermaTransparenteAlta: mCristal,
      mermaBlancoPollo: 0,
      mermaColor: mColor,
      mermaTransparenteBaja: 0,
      mermaBlancoPego: 0,
    };
  }

  return {
    mermaTotal: suma5,
    mermaTransparenteAlta: alta,
    mermaBlancoPollo: pollo,
    mermaColor: color,
    mermaTransparenteBaja: baja,
    mermaBlancoPego: pego,
  };
}

export async function aplicarMermaAInventario(
  tx: any,
  mermaData: {
    mermaTransparenteAlta?: number | null;
    mermaBlancoPollo?: number | null;
    mermaColor?: number | null;
    mermaTransparenteBaja?: number | null;
    mermaBlancoPego?: number | null;
  },
  contexto: {
    area: string;
    ordenId: string;
    codigoLote?: string | null;
    responsable: string;
  }
) {
  for (const item of CLASIFICACIONES_MERMA) {
    const kg = Number((mermaData as any)[item.key]) || 0;
    if (kg > 0) {
      let inventarioItem = await tx.inventario.findFirst({
        where: {
          categoria: CategoriaInventario.Peletizado,
          OR: [
            { codigo: { equals: item.codigo, mode: 'insensitive' } },
            { nombre: { contains: item.searchTerms[1], mode: 'insensitive' } },
          ],
        },
      });

      if (!inventarioItem) {
        inventarioItem = await tx.inventario.findFirst({
          where: {
            categoria: CategoriaInventario.Peletizado,
            codigo: { equals: item.codigo, mode: 'insensitive' },
          },
        });
      }

      if (inventarioItem) {
        await tx.inventario.update({
          where: { id: inventarioItem.id },
          data: {
            cantidad: { increment: kg },
          },
        });

        const ordenCorta = contexto.ordenId.slice(0, 6).toUpperCase();
        const loteRef = contexto.codigoLote || ordenCorta;
        await tx.movimientoInventario.create({
          data: {
            inventarioId: inventarioItem.id,
            tipo: TipoMovimiento.Entrada,
            cantidad: kg,
            motivo: `Recuperación de merma desde ${contexto.area} - Orden #${ordenCorta}`,
            referencia: loteRef,
            responsable: contexto.responsable || 'Sistema',
          },
        });
      }
    }
  }
}

export async function revertirMermaDeInventario(
  tx: any,
  mermaData: {
    mermaTransparenteAlta?: number | null;
    mermaBlancoPollo?: number | null;
    mermaColor?: number | null;
    mermaTransparenteBaja?: number | null;
    mermaBlancoPego?: number | null;
  },
  contexto: {
    area: string;
    ordenId: string;
    codigoLote?: string | null;
    responsable: string;
  }
) {
  for (const item of CLASIFICACIONES_MERMA) {
    const kg = Number((mermaData as any)[item.key]) || 0;
    if (kg > 0) {
      const inventarioItem = await tx.inventario.findFirst({
        where: {
          categoria: CategoriaInventario.Peletizado,
          OR: [
            { codigo: { equals: item.codigo, mode: 'insensitive' } },
            { nombre: { contains: item.searchTerms[1], mode: 'insensitive' } },
          ],
        },
      });

      if (inventarioItem) {
        await tx.inventario.update({
          where: { id: inventarioItem.id },
          data: {
            cantidad: { decrement: kg },
          },
        });

        const ordenCorta = contexto.ordenId.slice(0, 6).toUpperCase();
        const loteRef = contexto.codigoLote || ordenCorta;
        await tx.movimientoInventario.create({
          data: {
            inventarioId: inventarioItem.id,
            tipo: TipoMovimiento.Ajuste,
            cantidad: -kg,
            motivo: `Ajuste/Reversión de merma (${item.label}) en ${contexto.area} - Orden #${ordenCorta}`,
            referencia: loteRef,
            responsable: contexto.responsable || 'Sistema',
          },
        });
      }
    }
  }
}
