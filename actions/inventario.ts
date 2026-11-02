'use server';

import { recalcularHistoricoInventario } from '@/scripts/recalcular-inventario-historico';
import { revalidatePath } from 'next/cache';

export async function ejecutarRecalculoHistoricoAction() {
  try {
    const res = await recalcularHistoricoInventario();
    revalidatePath('/inventario');
    revalidatePath('/inventario/movimientos');
    revalidatePath('/inventario/materia-prima');
    revalidatePath('/produccion');
    return { success: true, count: res.count };
  } catch (error: any) {
    console.error('Error al recalcular:', error);
    return { success: false, error: error.message };
  }
}
