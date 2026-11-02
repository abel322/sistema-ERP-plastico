'use server';

import { AreaProduccion, EstadoMaquina, EstadoProduccion } from '@prisma/client';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function eliminarORevertirFaseSellado(ordenId: string, loteSelladoCodigo?: string) {
  try {
    // 1. Localizar la orden de sellado y sus relaciones
    const orConditions: any[] = [{ id: ordenId }];
    if (loteSelladoCodigo) {
      orConditions.push({ codigoLote: loteSelladoCodigo });
    }

    const orden = await prisma.produccion.findFirst({
      where: {
        OR: orConditions,
      },
      include: {
        registros: true,
        productoTerminado: true,
        maquina: true,
      },
    });

    if (!orden) {
      return { success: false, error: 'No se encontró la orden de producción.' };
    }

    // 2. Validación de seguridad: no permitir borrar si ya tiene bolsas producidas
    const sumaTurnos =
      orden.registros?.reduce((acc, r) => acc + (Number(r.cantidad) || 0), 0) || 0;
    const totalBolsas = sumaTurnos > 0 ? sumaTurnos : Number(orden.cantidadProducida || 0);

    if (totalBolsas > 0) {
      return {
        success: false,
        error: `No se puede eliminar la fase porque ya tiene ${totalBolsas.toLocaleString()} unidades producidas. Debe eliminar los turnos primero.`,
      };
    }

    // 3. Ejecutar transacción atómica de limpieza y reversión
    await prisma.$transaction(async (tx) => {
      // A. Eliminar registros de turno vacíos (0 unidades) si existen
      if (orden.registros && orden.registros.length > 0) {
        await tx.registroProduccion.deleteMany({
          where: { produccionId: orden.id },
        });
      }

      // B. Eliminar ProductoTerminado asociado a esta fase de sellado si se creó en 0
      if (orden.productoTerminado) {
        await tx.productoTerminado.delete({
          where: { id: orden.productoTerminado.id },
        });
      }

      // C. Eliminar la orden/fase de Sellado iniciada por error (ej. SEL-20261102-6030)
      await tx.produccion.delete({
        where: { id: orden.id },
      });

      // D. Liberar la máquina Selladora en el catálogo de máquinas (Estado Operativa)
      if (orden.maquinaId) {
        await tx.maquina.updateMany({
          where: {
            id: orden.maquinaId,
          },
          data: {
            estado: EstadoMaquina.Operativa,
            activa: true,
          },
        });
      }

      // E. Si existe una orden madre en Extrusión (por loteOrigen o pedidoId) que se había finalizado al avanzar,
      // asegurar que su ProductoTerminado quede disponible y si la orden de Extrusión sigue activa, rehabilitar su avance
      if (orden.loteOrigen) {
        await tx.productoTerminado.updateMany({
          where: {
            codigoLote: orden.loteOrigen,
          },
          data: {
            estado: 'PendienteArea',
            siguienteArea: 'Sellado',
          },
        });

        // Si la orden de Extrusión había pasado a Finalizado sin tener otra fase activa, reactivarla a EnProceso
        const otrasFasesActivas = await tx.produccion.count({
          where: {
            loteOrigen: orden.loteOrigen,
            estado: EstadoProduccion.EnProceso,
          },
        });

        if (otrasFasesActivas === 0) {
          await tx.produccion.updateMany({
            where: {
              codigoLote: orden.loteOrigen,
              area: AreaProduccion.Extrusion,
              estado: EstadoProduccion.Finalizado,
            },
            data: {
              estado: EstadoProduccion.EnProceso,
            },
          });
        }
      }
    });

    // 4. Revalidar rutas para actualización instantánea
    revalidatePath('/produccion');
    revalidatePath('/dashboard/maquinas');
    revalidatePath('/producto-terminado');

    return {
      success: true,
      message:
        'Fase de sellado eliminada. La máquina quedó disponible y el botón en Extrusión ha sido rehabilitado.',
    };
  } catch (error: any) {
    console.error('Error al eliminar fase de sellado:', error);
    return {
      success: false,
      error: error.message || 'Error interno al procesar la reversión.',
    };
  }
}
