'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import type { AreaOperadorTipo, FormOperadorInput } from '@/types/operadores';

export async function obtenerTodosLosOperadoresAction() {
  try {
    const operadores = await prisma.operador.findMany({
      orderBy: [{ area: 'asc' }, { nombre: 'asc' }],
    });
    return { success: true, operadores };
  } catch (error: any) {
    console.error('Error al obtener operadores:', error);
    return { success: false, error: 'Error al consultar catálogo de operadores', operadores: [] };
  }
}

export async function obtenerOperadoresPorAreaAction(area: AreaOperadorTipo) {
  try {
    const operadores = await prisma.operador.findMany({
      where: {
        area: area as any,
        activo: true,
      },
      orderBy: { nombre: 'asc' },
    });
    return { success: true, operadores };
  } catch (error: any) {
    console.error('Error al obtener operadores por área:', error);
    return { success: false, operadores: [] };
  }
}

export async function crearOperadorAction(data: FormOperadorInput) {
  try {
    const nombreLimpio = data.nombre.trim().toUpperCase();
    if (!nombreLimpio) {
      return { success: false, error: 'El nombre es obligatorio.' };
    }

    const operador = await prisma.operador.create({
      data: {
        nombre: nombreLimpio,
        cedula: data.cedula?.trim() || null,
        area: data.area as any,
        activo: true,
      },
    });

    revalidatePath('/operadores');
    revalidatePath('/produccion');
    return { success: true, operador };
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { success: false, error: 'Ya existe un operario registrado con este nombre.' };
    }
    return { success: false, error: error.message || 'Error al guardar operario.' };
  }
}

export async function actualizarOperadorAction(id: string, data: Partial<FormOperadorInput>) {
  try {
    const operador = await prisma.operador.update({
      where: { id },
      data: {
        ...(data.nombre && { nombre: data.nombre.trim().toUpperCase() }),
        ...(data.cedula !== undefined && { cedula: data.cedula?.trim() || null }),
        ...(data.area && { area: data.area as any }),
      },
    });

    revalidatePath('/operadores');
    revalidatePath('/produccion');
    return { success: true, operador };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al actualizar operador.' };
  }
}

export async function toggleEstadoOperadorAction(id: string, nuevoEstado: boolean) {
  try {
    const operador = await prisma.operador.update({
      where: { id },
      data: { activo: nuevoEstado },
    });

    revalidatePath('/operadores');
    revalidatePath('/produccion');
    return { success: true, operador };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al cambiar estado.' };
  }
}

