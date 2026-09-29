import { CategoriaInventario, TipoMovimiento } from '@prisma/client';

export interface MermaItemConfig {
  key: 'mermaTransparenteAlta' | 'mermaBlancoPollo' | 'mermaColor' | 'mermaTransparenteBaja' | 'mermaBlancoPego';
  label: string;
  shortLabel: string;
  codigo: string; // "molido 1", "molido 2", etc.
  searchTerms: string[];
  color: string;
  badgeClass: string;
  borderClass: string;
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
