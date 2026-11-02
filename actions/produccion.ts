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

/**
 * Elimina por completo una orden de producción creada por error,
 * limpiando registros vinculados y liberando la máquina asignada (Estado Operativa/Disponible).
 */
export async function eliminarOrdenProduccion(ordenId: string, forzar: boolean = false) {
  try {
    // 1. Buscar la orden completa con sus registros vinculados
    const orden = await prisma.produccion.findFirst({
      where: {
        OR: [
          { id: ordenId },
          { codigoLote: ordenId },
        ],
      },
      include: {
        registros: true,
        productoTerminado: true,
        inspeccionesCalidad: true,
        maquina: true,
      },
    });

    if (!orden) {
      return { success: false, error: 'La orden de producción no existe o ya fue eliminada.' };
    }

    // 2. Validación de seguridad:
    // Si tiene kilos reales producidos mayores a 0, exigir precaución
    const totalExtruido =
      orden.registros?.reduce(
        (acc, r) => acc + Number(r.cantidad || 0),
        0
      ) || Number(orden.cantidadProducida || 0);

    if (totalExtruido > 0 && !forzar) {
      return {
        success: false,
        error: `La orden tiene ${totalExtruido.toLocaleString('es-ES')} kg producidos registrados. Elimine primero los registros de turno o confirme la eliminación.`,
      };
    }

    // 3. Transacción atómica de eliminación
    await prisma.$transaction(async (tx) => {
      // A. Eliminar inspecciones de calidad asociadas
      if (orden.inspeccionesCalidad && orden.inspeccionesCalidad.length > 0) {
        const inspeccionIds = orden.inspeccionesCalidad.map((i) => i.id);
        await tx.resultadoParametro.deleteMany({
          where: { inspeccionId: { in: inspeccionIds } },
        });
        await tx.inspeccionCalidad.deleteMany({
          where: { produccionId: orden.id },
        });
      }

      // B. Eliminar registros de turno asociados
      if (orden.registros && orden.registros.length > 0) {
        await tx.registroProduccion.deleteMany({
          where: { produccionId: orden.id },
        });
      }

      // C. Eliminar ProductoTerminado asociado a este lote/producción
      if (orden.productoTerminado) {
        await tx.productoTerminado.delete({
          where: { id: orden.productoTerminado.id },
        });
      } else if (orden.codigoLote) {
        await tx.productoTerminado.deleteMany({
          where: { codigoLote: orden.codigoLote },
        });
      }

      // D. Eliminar fases posteriores vacías que dependan de este lote (si existen)
      if (orden.codigoLote) {
        const fasesHijas = await tx.produccion.findMany({
          where: { loteOrigen: orden.codigoLote },
          include: { registros: true, productoTerminado: true },
        });

        for (const hija of fasesHijas) {
          const cantHija =
            hija.registros?.reduce((acc, r) => acc + Number(r.cantidad || 0), 0) ||
            Number(hija.cantidadProducida || 0);
          if (cantHija === 0) {
            if (hija.registros && hija.registros.length > 0) {
              await tx.registroProduccion.deleteMany({ where: { produccionId: hija.id } });
            }
            if (hija.productoTerminado) {
              await tx.productoTerminado.delete({ where: { id: hija.productoTerminado.id } });
            }
            if (hija.maquinaId) {
              await tx.maquina.updateMany({
                where: { id: hija.maquinaId },
                data: { estado: EstadoMaquina.Operativa, activa: true },
              });
            }
            await tx.produccion.delete({ where: { id: hija.id } });
          }
        }
      }

      // E. Eliminar movimientos de inventario vinculados al lote si existen
      if (orden.codigoLote) {
        await tx.movimientoInventario.deleteMany({
          where: {
            OR: [
              { motivo: { contains: orden.codigoLote } },
              { referencia: { contains: orden.codigoLote } },
            ],
          },
        });
      }

      // F. Si estaba asociado a un pedido y acumuló cantidad producida, revertirla
      if (orden.pedidoId && orden.cantidadProducida > 0) {
        const pedido = await tx.pedido.findUnique({
          where: { id: orden.pedidoId },
        });
        if (pedido) {
          await tx.pedido.update({
            where: { id: orden.pedidoId },
            data: {
              cantidadProducida: Math.max(0, pedido.cantidadProducida - orden.cantidadProducida),
            },
          });
        }
      }

      // G. Eliminar la orden de producción principal
      await tx.produccion.delete({
        where: { id: orden.id },
      });

      // H. Liberar la máquina asignada (ej. EXTRUSORA 6) dejándola Operativa y disponible
      if (orden.maquinaId) {
        await tx.maquina.updateMany({
          where: { id: orden.maquinaId },
          data: {
            estado: EstadoMaquina.Operativa,
            activa: true,
          },
        });
      }
    });

    // 4. Revalidar vistas
    revalidatePath('/produccion');
    revalidatePath('/dashboard/maquinas');
    revalidatePath('/maquinas');
    revalidatePath('/inventario/movimientos');
    revalidatePath('/producto-terminado');

    const codigoLoteDisplay = orden.codigoLote || orden.id.slice(0, 8).toUpperCase();
    return {
      success: true,
      message: `Orden ${codigoLoteDisplay} eliminada correctamente y máquina liberada.`,
    };
  } catch (error: any) {
    console.error('Error al eliminar orden de producción:', error);
    return {
      success: false,
      error: error.message || 'Error al intentar eliminar la orden de producción.',
    };
  }
}
