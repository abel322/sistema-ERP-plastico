'use server';

import { AreaProduccion, EstadoMaquina, EstadoProduccion, TipoMovimiento, Turno } from '@prisma/client';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { resolverConsumoExtrusion, aplicarConsumoExtrusion, revertirConsumoExtrusion, revertirSalidasTurnoExtrusion } from '@/lib/consumo-extrusion-logic';
import { revertirMermaDeInventario } from '@/lib/merma-logic';
import { generarCodigoLoteUnico } from '@/lib/utils/lote';
import { parseLocalDateToMiddayUTC } from '@/lib/utils/dates';
import type { LineaSelladoConfig, UnificarOrdenesExtrusionParams } from '@/types/produccion';

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

/**
 * Motor de descuento de inventario en extrusión para consumos base virgen,
 * molido directo y resina virgen de enriquecimiento (ej. LDPE 3003 en tolva).
 */
export async function descontarConsumoExtrusionTurno(params: {
  produccionId: string;
  kgTurno: number;
  turno: string;
  operario?: string;
}) {
  const { produccionId, kgTurno, turno, operario } = params;
  if (kgTurno <= 0) return { success: true, message: 'Sin kilos para descontar' };

  try {
    const produccion = await prisma.produccion.findUnique({
      where: { id: produccionId },
      include: {
        pedido: {
          include: {
            productoCliente: {
              include: { peletizado: true, resinaMolido: true },
            },
          },
        },
        productoCliente: {
          include: { peletizado: true, resinaMolido: true },
        },
      },
    });

    if (!produccion) {
      return { success: false, error: 'Producción no encontrada' };
    }

    const prodCli = produccion.pedido?.productoCliente || produccion.productoCliente;
    if (!prodCli) {
      return { success: false, error: 'Producto no vinculado a la orden' };
    }

    const consumoCalculado = await resolverConsumoExtrusion(prisma, prodCli, kgTurno);
    if (!consumoCalculado) {
      return { success: false, error: 'No se pudo calcular la formulación de consumo' };
    }

    await prisma.$transaction(async (tx) => {
      await aplicarConsumoExtrusion(tx, {
        consumo: consumoCalculado,
        loteCodigo: produccion.codigoLote || produccion.id.slice(0, 8).toUpperCase(),
        turno,
        responsable: operario || 'Sistema',
      });
    });

    revalidatePath('/produccion');
    revalidatePath('/inventario');
    revalidatePath('/inventario/movimientos');

    return { success: true, consumo: consumoCalculado };
  } catch (error: any) {
    console.error('Error al descontar consumo de extrusión:', error);
    return { success: false, error: error.message || 'Error al procesar descuento' };
  }
}

/**
 * Finaliza la fase de sellado procesando el destino físico del sobrante de bobina en piso
 * (Molienda / Peletizado vs Saldo de Almacén) y liberando la máquina selladora asignada.
 */
export async function finalizarFaseSelladoConDestino(
  ordenId: string,
  destinoSobrante: 'MOLIENDA' | 'ALMACEN_BOBINA',
  sobranteKg: number = 0
) {
  try {
    const orden = await prisma.produccion.findUnique({
      where: { id: ordenId },
      include: {
        maquina: true,
        pedido: {
          include: {
            cliente: true,
            productoCliente: {
              include: { peletizado: true, resinaMolido: true },
            },
          },
        },
        productoCliente: {
          include: { cliente: true, peletizado: true, resinaMolido: true },
        },
        productoTerminado: true,
        registros: true,
      },
    });

    if (!orden) {
      return { success: false, error: 'No se encontró la orden de producción.' };
    }

    const remanenteReal = Math.max(0, Number(sobranteKg) || 0);
    const prodCli = orden.pedido?.productoCliente || orden.productoCliente;
    const loteDisplay = orden.codigoLote || orden.loteOrigen || orden.id.slice(-6).toUpperCase();

    await prisma.$transaction(async (tx) => {
      // 1. Si hay sobrante físico de bobina, registrar según la elección
      if (remanenteReal > 0) {
        if (destinoSobrante === 'MOLIENDA') {
          // Buscar artículo de peletizado/molido asignado en la formulación o producto
          let peletizadoItem = null;
          if (prodCli?.peletizadoId) {
            peletizadoItem = await tx.inventario.findUnique({
              where: { id: prodCli.peletizadoId },
            });
          }

          // Fallback inteligente según tipo de material del producto si no estaba asignado
          if (!peletizadoItem) {
            const nombreProdLower = (prodCli?.nombreProducto || '').toLowerCase();
            let kw = 'transparente';
            if (nombreProdLower.includes('blanco') || nombreProdLower.includes('pollo')) {
              kw = 'blanco';
            } else if (nombreProdLower.includes('color') || nombreProdLower.includes('negro') || nombreProdLower.includes('azul')) {
              kw = 'color';
            }

            peletizadoItem = await tx.inventario.findFirst({
              where: {
                categoria: 'Peletizado',
                nombre: { contains: kw, mode: 'insensitive' },
              },
            });

            if (!peletizadoItem) {
              peletizadoItem = await tx.inventario.findFirst({
                where: {
                  categoria: 'Peletizado',
                  ...(orden.userId ? { OR: [{ userId: orden.userId }, { userId: null }] } : {}),
                },
              });
            }
          }

          if (peletizadoItem) {
            await tx.inventario.update({
              where: { id: peletizadoItem.id },
              data: { cantidad: { increment: remanenteReal } },
            });

            await tx.movimientoInventario.create({
              data: {
                inventarioId: peletizadoItem.id,
                tipo: 'Entrada',
                cantidad: remanenteReal,
                motivo: `Sobrante de Bobina en Sellado enviado a Molienda - Lote ${loteDisplay}`,
                referencia: `SELLADO-${loteDisplay}`,
                responsable: orden.operario || 'Sistema',
                fecha: new Date(),
              },
            });
          }
        } else {
          // Guardar como Saldo de Bobina en Almacén
          let itemBobina = await tx.inventario.findFirst({
            where: {
              OR: [
                { codigo: 'BOB-SALDO' },
                { nombre: { contains: 'Saldo Bobina', mode: 'insensitive' } },
              ],
            },
          });

          if (!itemBobina) {
            itemBobina = await tx.inventario.create({
              data: {
                userId: orden.userId,
                nombre: 'Saldo Bobina Huérfana / Remanente',
                codigo: 'BOB-SALDO',
                categoria: 'ProductoTerminado',
                unidad: 'Kilogramos',
                cantidad: remanenteReal,
                observaciones: 'Remanente de bobina útil resguardado en almacén',
              },
            });
          } else {
            await tx.inventario.update({
              where: { id: itemBobina.id },
              data: { cantidad: { increment: remanenteReal } },
            });
          }

          await tx.movimientoInventario.create({
            data: {
              inventarioId: itemBobina.id,
              tipo: 'Entrada',
              cantidad: remanenteReal,
              motivo: `Sobrante de Bobina reservado en Almacén - Lote ${loteDisplay} (${prodCli?.nombreProducto || 'Bobina'})`,
              referencia: `BOBINA-${loteDisplay}`,
              responsable: orden.operario || 'Sistema',
              fecha: new Date(),
            },
          });
        }

        // Actualizar el ProductoTerminado madre (bobina de origen)
        if (orden.loteOrigen) {
          await tx.productoTerminado.updateMany({
            where: { codigoLote: orden.loteOrigen },
            data: {
              cantidadDisponible: destinoSobrante === 'ALMACEN_BOBINA' ? remanenteReal : 0,
              siguienteArea: 'Ninguna',
              estado: 'ListoDespacho',
              descripcion: destinoSobrante === 'MOLIENDA'
                ? `Bobina consumida (Remanente de ${remanenteReal.toFixed(2)} KG enviado a Molienda)`
                : `Saldo de Bobina Huérfana disponible en almacén (${remanenteReal.toFixed(2)} KG)`,
            },
          });
        }
      } else if (orden.loteOrigen) {
        // Toda la bobina consumida al 100%
        await tx.productoTerminado.updateMany({
          where: { codigoLote: orden.loteOrigen },
          data: {
            cantidadDisponible: 0,
            siguienteArea: 'Ninguna',
            estado: 'ListoDespacho',
            descripcion: 'Bobina consumida al 100% en Sellado',
          },
        });
      }

      // 2. Calcular cantidad final producida en Sellado
      const sumaRegistros = orden.registros && orden.registros.length > 0
        ? orden.registros.reduce((sum, r) => sum + (Number(r.cantidad) || 0), 0)
        : 0;
      const cantidadFinal = sumaRegistros > 0 ? sumaRegistros : Number(orden.cantidadProducida || 0);

      // 3. Finalizar la orden de Sellado
      await tx.produccion.update({
        where: { id: orden.id },
        data: {
          estado: EstadoProduccion.Finalizado,
          cantidadProducida: cantidadFinal,
          finalizadoAt: new Date(),
          horaFin: new Date().toLocaleTimeString('es-VE', { hour12: false }),
        },
      });

      // 4. Upsert ProductoTerminado para los paquetes/bolsas de Sellado listas para despacho
      const clienteId = orden.pedido?.clienteId || orden.productoCliente?.clienteId;
      if (clienteId) {
        const ptData = {
          userId: orden.userId,
          codigoLote: orden.codigoLote,
          loteOrigen: orden.loteOrigen,
          pedidoId: orden.pedidoId || null,
          clienteId: clienteId,
          productoClienteId: prodCli?.id || null,
          areaOrigen: orden.area,
          descripcion: 'Bolsas terminadas en Sellado listas para despacho',
          cantidadTotal: cantidadFinal,
          cantidadDisponible: cantidadFinal,
          unidad: orden.unidad,
          tipoProducto: prodCli?.tipoProducto || 'Bolsa',
          conImpresion: Boolean(prodCli?.conImpresion),
          estado: 'ListoDespacho' as any,
          siguienteArea: 'Ninguna' as any,
          fechaFinalizacion: new Date(),
        };

        await tx.productoTerminado.upsert({
          where: { produccionId: orden.id },
          update: ptData,
          create: {
            ...ptData,
            produccionId: orden.id,
          },
        });
      }

      // 5. Si la orden está ligada a un pedido, verificar si no quedan otras fases activas
      if (orden.pedidoId) {
        const otrasFasesActivas = await tx.produccion.count({
          where: {
            pedidoId: orden.pedidoId,
            id: { not: orden.id },
            estado: EstadoProduccion.EnProceso,
          },
        });

        if (otrasFasesActivas === 0) {
          await tx.pedido.update({
            where: { id: orden.pedidoId },
            data: {
              estado: 'Completado',
              cantidadProducida: cantidadFinal,
            },
          });
        }
      }

      // 6. Liberar la máquina asignada (ej. Selladora 6)
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

    // 7. Revalidar todas las rutas afectadas
    revalidatePath('/produccion');
    revalidatePath('/inventario');
    revalidatePath('/inventario/movimientos');
    revalidatePath('/maquinas');
    revalidatePath('/dashboard/maquinas');
    revalidatePath('/producto-terminado');

    return {
      success: true,
      message: 'Fase de sellado finalizada y sobrante procesado correctamente.',
    };
  } catch (error: any) {
    console.error('Error al finalizar sellado:', error);
    return {
      success: false,
      error: error.message || 'Error interno al finalizar la fase de sellado.',
    };
  }
}

/**
 * Server action para crear un registro de turno en sellado
 * y revalidar las vistas de producción en tiempo real.
 */
export async function crearRegistroSellado(params: {
  produccionId: string;
  turno: Turno;
  operario: string;
  cantidad: number;
  merma?: number;
  reporte?: string;
  mermaColor?: number;
  mermaCristal?: number;
}) {
  try {
    const { produccionId, turno, operario, cantidad, merma = 0, reporte, mermaColor = 0, mermaCristal = 0 } = params;
    const produccion = await prisma.produccion.findUnique({
      where: { id: produccionId },
      include: {
        productoTerminado: true,
        pedido: { include: { productoCliente: true } },
        productoCliente: true,
      },
    });

    if (!produccion) {
      return { success: false, error: 'Orden de producción no encontrada' };
    }

    const reg = await prisma.registroProduccion.create({
      data: {
        produccionId,
        turno,
        operario,
        cantidad,
        merma,
        mermaColor,
        mermaCristal,
        mermaSinImpresion: mermaCristal,
        mermaImpreso: mermaColor,
        reporte,
      },
    });

    revalidatePath('/produccion');
    revalidatePath('/inventario');
    return { success: true, data: reg };
  } catch (error: any) {
    console.error('Error al crear registro de sellado:', error);
    return { success: false, error: error.message || 'Error al crear registro' };
  }
}


/**
 * Elimina un registro de turno de extrusión de forma blindada,
 * revirtiendo al 100% todos los consumos de materias primas (incluyendo
 * resina adicional de corte/enriquecimiento como LDPE 3003) mediante
 * búsqueda directa 1-a-1 de las salidas generadas, o fallback por fórmula.
 */
export async function eliminarRegistroExtrusion(registroId: string) {
  try {
    const registro = await prisma.registroProduccion.findUnique({
      where: { id: registroId },
      include: {
        produccion: {
          include: {
            pedido: {
              include: {
                productoCliente: {
                  include: {
                    peletizado: true,
                    resinaMolido: true,
                    formulacion: true,
                  },
                },
              },
            },
            productoCliente: {
              include: {
                peletizado: true,
                resinaMolido: true,
                formulacion: true,
              },
            },
            productoTerminado: true,
          },
        },
      },
    });

    if (!registro) {
      return { success: false, error: 'Registro de turno no encontrado.' };
    }

    const { produccion } = registro;
    const loteCodigo = produccion.codigoLote || produccion.id.slice(0, 8).toUpperCase();
    const turnoNombre = registro.turno || 'UNICO';
    const kgTurno = Number(registro.cantidad || 0);
    const prodCli = produccion.pedido?.productoCliente || produccion.productoCliente;
    const formula = (prodCli as any)?.formulacion || prodCli;

    await prisma.$transaction(async (tx) => {
      // 1. Revertir consumos de Extrusión (Estrategia 1: salidas directas 1 a 1; Estrategia 2: cálculo completo)
      if (produccion.area === 'Extrusion' && kgTurno > 0) {
        await revertirSalidasTurnoExtrusion(tx, {
          loteCodigo,
          turno: turnoNombre,
          responsable: registro.operario || 'Sistema',
          accion: 'Eliminación',
          registroFecha: registro.createdAt,
          formula,
          kgTurno,
        });
      }

      // 2. Revertir merma del inventario si había sido sumada
      if (registro.mermaInventarioSumada) {
        await revertirMermaDeInventario(tx, registro, {
          area: produccion.area,
          ordenId: produccion.id,
          codigoLote: produccion.codigoLote,
          responsable: registro.operario || 'Admin',
        });
      }

      // 3. Eliminar el registro del turno
      await tx.registroProduccion.delete({
        where: { id: registroId },
      });

      // 4. Recalcular acumulados en la orden de producción
      const todosRegistros = await tx.registroProduccion.findMany({
        where: { produccionId: produccion.id },
      });

      const totalCantidad = todosRegistros.reduce((sum, r) => sum + r.cantidad, 0);
      const totalMerma = todosRegistros.reduce((sum, r) => sum + (r.merma || 0), 0);
      const totalMermaAlta = todosRegistros.reduce((sum, r) => sum + ((r as any).mermaTransparenteAlta || (r as any).mermaCristal || r.mermaSinImpresion || 0), 0);
      const totalMermaPollo = todosRegistros.reduce((sum, r) => sum + ((r as any).mermaBlancoPollo || 0), 0);
      const totalMermaColor = todosRegistros.reduce((sum, r) => sum + ((r as any).mermaColor || r.mermaImpreso || 0), 0);
      const totalMermaBaja = todosRegistros.reduce((sum, r) => sum + ((r as any).mermaTransparenteBaja || 0), 0);
      const totalMermaPego = todosRegistros.reduce((sum, r) => sum + ((r as any).mermaBlancoPego || 0), 0);

      await tx.produccion.update({
        where: { id: produccion.id },
        data: {
          cantidadProducida: totalCantidad,
          merma: totalMerma,
          mermaTransparenteAlta: totalMermaAlta,
          mermaBlancoPollo: totalMermaPollo,
          mermaColor: totalMermaColor,
          mermaTransparenteBaja: totalMermaBaja,
          mermaBlancoPego: totalMermaPego,
          mermaCristal: totalMermaAlta,
        },
      });

      // 5. Actualizar producto terminado si existe
      if (produccion.productoTerminado) {
        if (produccion.area === 'Extrusion') {
          await tx.productoTerminado.update({
            where: { id: produccion.productoTerminado.id },
            data: {
              cantidadTotal: totalCantidad,
              cantidadDisponible: { increment: -kgTurno },
            },
          });
        } else {
          await tx.productoTerminado.update({
            where: { id: produccion.productoTerminado.id },
            data: {
              cantidadTotal: totalCantidad,
              cantidadDisponible: totalCantidad,
            },
          });
        }
      }
    });

    revalidatePath('/produccion');
    revalidatePath('/inventario');
    revalidatePath('/inventario/movimientos');
    revalidatePath('/produccion/historial');

    return { success: true, message: 'Turno eliminado y consumos revertidos al 100%.' };
  } catch (error: any) {
    console.error('Error al eliminar turno de extrusión:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Unifica 2 o más órdenes activas de extrusión en una Orden Madre.
 * Suma la meta combinada en KG y marca las órdenes secundarias como Unificadas,
 * liberando sus máquinas asignadas si eran distintas.
 */
export async function unificarOrdenesExtrusionAction(params: UnificarOrdenesExtrusionParams) {
  try {
    const { ordenesIds, ordenPrincipalId, nombreUnificado } = params;
    if (!ordenesIds || ordenesIds.length < 2) {
      return {
        success: false,
        error: 'Debe seleccionar al menos 2 órdenes activas de extrusión para unificar.',
      };
    }

    const ordenes = await prisma.produccion.findMany({
      where: {
        id: { in: ordenesIds },
        area: AreaProduccion.Extrusion,
      },
      include: {
        pedido: { include: { cliente: true, productoCliente: true } },
        productoCliente: true,
        registros: true,
        maquina: true,
        productoTerminado: true,
      },
    });

    if (ordenes.length < 2) {
      return {
        success: false,
        error: 'No se encontraron al menos 2 órdenes válidas en Extrusión.',
      };
    }

    // 1. Determinar orden madre como constante para narrow typing en closures
    const ordenMadre =
      (ordenPrincipalId ? ordenes.find((o) => o.id === ordenPrincipalId) : undefined) ||
      ordenes.find((o) => o.esOrdenMadre) ||
      ordenes[0];

    if (!ordenMadre) {
      return {
        success: false,
        error: 'No se pudo determinar la orden madre para la unificación.',
      };
    }

    const ordenesSecundarias = ordenes.filter((o) => o.id !== ordenMadre.id);

    // 2. Sumar meta combinada en KG
    let metaTotalKg = 0;
    for (const ord of ordenes) {
      const pc = ord.pedido?.productoCliente || ord.productoCliente;
      const pesoUnidad = pc?.pesoPorUnidad || 0;
      const cantSolicitada = ord.pedido?.cantidadSolicitada || 0;

      if (ord.metaKg && ord.metaKg > 0 && ord.metaKg < 100000) {
        metaTotalKg += ord.metaKg;
      } else if (cantSolicitada > 0) {
        if (ord.pedido?.unidad === 'Kilogramos' || ord.unidad === 'Kilogramos') {
          metaTotalKg += cantSolicitada;
        } else if (pesoUnidad > 0) {
          metaTotalKg += (cantSolicitada * pesoUnidad) / 1000;
        } else {
          metaTotalKg += cantSolicitada;
        }
      } else if (ord.cantidadProducida > 0) {
        metaTotalKg += ord.cantidadProducida;
      }
    }

    await prisma.$transaction(async (tx) => {
      // 3. Actualizar orden madre
      const obsMadre = nombreUnificado
        ? `${ordenMadre.observaciones ? ordenMadre.observaciones + ' | ' : ''}Unificada: ${nombreUnificado} (Agrupa ${ordenesSecundarias.length} órdenes)`
        : ordenMadre.observaciones;

      const prodMadreNom = ordenMadre.pedido?.productoCliente?.nombreProducto || ordenMadre.productoCliente?.nombreProducto || 'Extrusión';
      const prodSecNoms = ordenesSecundarias.map((o) => o.pedido?.productoCliente?.nombreProducto || o.productoCliente?.nombreProducto || 'Secundaria');

      let nombreVarianteMadre = nombreUnificado?.trim();
      if (!nombreVarianteMadre) {
        const todosNombres = [prodMadreNom, ...prodSecNoms].join(' ').toLowerCase();
        if (todosNombres.includes('lisa') && todosNombres.includes('perforada')) {
          nombreVarianteMadre = 'Cestera 60(21+21) [Lisa + Perforada]';
        } else {
          nombreVarianteMadre = `${prodMadreNom} + ${prodSecNoms.join(' + ')}`;
        }
      }

      await tx.produccion.update({
        where: { id: ordenMadre.id },
        data: {
          esOrdenMadre: true,
          metaKg: metaTotalKg > 0 ? Number(metaTotalKg.toFixed(2)) : (ordenMadre.metaKg || null),
          nombreVariante: nombreVarianteMadre,
          observaciones: obsMadre,
        },
      });

      // 4. Actualizar órdenes secundarias
      for (const sec of ordenesSecundarias) {
        const obsSec = `${sec.observaciones ? sec.observaciones + ' | ' : ''}Unificada en orden madre ${ordenMadre.codigoLote || ordenMadre.id.slice(0, 8).toUpperCase()}`;

        await tx.produccion.update({
          where: { id: sec.id },
          data: {
            estado: EstadoProduccion.Unificada,
            ordenExtrusionOrigenId: ordenMadre.id,
            observaciones: obsSec,
          },
        });

        // Si la orden secundaria estaba asignada a una máquina distinta, liberarla
        if (sec.maquinaId && sec.maquinaId !== ordenMadre.maquinaId) {
          await tx.maquina.updateMany({
            where: { id: sec.maquinaId },
            data: {
              estado: EstadoMaquina.Operativa,
              activa: true,
            },
          });
        }
      }
    });

    revalidatePath('/produccion');
    revalidatePath('/dashboard/maquinas');
    revalidatePath('/maquinas');

    return {
      success: true,
      message: `Órdenes unificadas exitosamente en la Orden Madre ${ordenMadre.codigoLote || ordenMadre.id.slice(0, 8)}. Meta total combinada: ${metaTotalKg.toFixed(2)} KG.`,
      ordenMadreId: ordenMadre.id,
    };
  } catch (error: any) {
    console.error('Error al unificar órdenes de extrusión:', error);
    return {
      success: false,
      error: error.message || 'Error interno al unificar órdenes.',
    };
  }
}

/**
 * Avanza una orden de extrusión distribuyendo su bobina en N líneas de sellado hijas concurrentes.
 * Todas las líneas hijas comparten el mismo pozo de bobina en tiempo real.
 */
export async function avanzarASelladoMultiLineaAction(params: {
  ordenExtrusionId: string;
  lineas: LineaSelladoConfig[];
  modoAvance?: 'paralelo' | 'finalizar';
}) {
  try {
    const { ordenExtrusionId, lineas, modoAvance = 'paralelo' } = params;

    if (!lineas || lineas.length === 0) {
      return { success: false, error: 'Debe configurar al menos una línea de sellado.' };
    }

    for (let i = 0; i < lineas.length; i++) {
      if (!lineas[i].maquinaId) {
        return { success: false, error: `La línea ${i + 1} no tiene una máquina selladora seleccionada.` };
      }
    }

    const orden = await prisma.produccion.findUnique({
      where: { id: ordenExtrusionId },
      include: {
        pedido: {
          include: {
            cliente: true,
            productoCliente: true,
          },
        },
        productoCliente: true,
        registros: true,
        productoTerminado: true,
        maquina: true,
      },
    });

    if (!orden) {
      return { success: false, error: 'Orden de extrusión no encontrada.' };
    }

    const prodCli = orden.pedido?.productoCliente || orden.productoCliente;
    const clienteId = orden.pedido?.clienteId || orden.productoCliente?.clienteId;
    const totalExtruido =
      orden.registros?.reduce((sum, r) => sum + (Number(r.cantidad) || 0), 0) ||
      Number(orden.cantidadProducida || 0);

    const todayDate = parseLocalDateToMiddayUTC(new Date().toISOString().split('T')[0]);

    await prisma.$transaction(async (tx) => {
      // 1. Marcar la orden de extrusión como madre
      const updateData: any = {
        esOrdenMadre: true,
      };

      if (modoAvance === 'finalizar') {
        updateData.estado = EstadoProduccion.Finalizado;
        updateData.finalizadoAt = new Date();
        updateData.horaFin = new Date().toLocaleTimeString('es-VE', { hour12: false });
        updateData.siguienteArea = AreaProduccion.Sellado;

        if (orden.maquinaId) {
          await tx.maquina.updateMany({
            where: { id: orden.maquinaId },
            data: {
              estado: EstadoMaquina.Operativa,
              activa: true,
            },
          });
        }
      }

      await tx.produccion.update({
        where: { id: orden.id },
        data: updateData,
      });

      // 2. Garantizar ProductoTerminado para la bobina compartida
      let pt = orden.productoTerminado;
      if (!pt && orden.codigoLote) {
        pt = await tx.productoTerminado.findFirst({
          where: { codigoLote: orden.codigoLote },
        });
      }

      if (!pt && orden.codigoLote && clienteId) {
        pt = await tx.productoTerminado.create({
          data: {
            userId: orden.userId,
            codigoLote: orden.codigoLote,
            produccionId: orden.id,
            pedidoId: orden.pedidoId,
            clienteId: clienteId,
            productoClienteId: prodCli?.id || orden.productoClienteId || null,
            areaOrigen: orden.area,
            descripcion: `Bobina WIP compartida - ${orden.codigoLote}`,
            cantidadTotal: totalExtruido,
            cantidadDisponible: totalExtruido,
            unidad: 'Kilogramos',
            tipoProducto: 'Bobina',
            conImpresion: Boolean(prodCli?.conImpresion),
            estado: 'PendienteArea' as any,
            siguienteArea: 'Sellado' as any,
          },
        });
      } else if (pt && pt.cantidadDisponible === 0 && totalExtruido > 0) {
        await tx.productoTerminado.update({
          where: { id: pt.id },
          data: {
            cantidadTotal: totalExtruido,
            cantidadDisponible: totalExtruido,
            estado: 'PendienteArea' as any,
            siguienteArea: 'Sellado' as any,
          },
        });
      }

      // Buscar órdenes secundarias unificadas vinculadas para emparejar producto/pedido exactos
      const secundariasUnificadas = await tx.produccion.findMany({
        where: { ordenExtrusionOrigenId: orden.id },
        include: {
          pedido: { include: { productoCliente: true } },
          productoCliente: true,
        },
      });

      // 3. Crear cada línea de sellado hija
      for (let i = 0; i < lineas.length; i++) {
        const linea = lineas[i];
        const loteSellado = await generarCodigoLoteUnico(tx, AreaProduccion.Sellado, new Date());

        let finalProductoClienteId = prodCli?.id || orden.productoClienteId || null;
        let finalPedidoId = orden.pedidoId || null;

        // Si la variante coincide con una orden secundaria unificada, vincular su productoCliente y pedido
        const lNom = (linea.nombreVariante || '').toLowerCase();
        const secMatch = secundariasUnificadas.find((s) => {
          const sNom = (s.pedido?.productoCliente?.nombreProducto || s.productoCliente?.nombreProducto || '').toLowerCase();
          return (sNom && lNom && (sNom.includes(lNom) || lNom.includes(sNom))) ||
            (sNom.includes('perforada') && lNom.includes('perforada')) ||
            (sNom.includes('lisa') && lNom.includes('lisa'));
        });

        if (secMatch) {
          finalProductoClienteId = secMatch.productoClienteId || secMatch.pedido?.productoClienteId || finalProductoClienteId;
          finalPedidoId = secMatch.pedidoId || finalPedidoId;
        }

        await tx.produccion.create({
          data: {
            userId: orden.userId,
            codigoLote: loteSellado,
            loteOrigen: orden.codigoLote,
            ordenExtrusionOrigenId: orden.id,
            nombreVariante: linea.nombreVariante?.trim() || null,
            metaKg: linea.metaKg ? Number(linea.metaKg) : null,
            metaUnidades: linea.metaUnidades ? Number(linea.metaUnidades) : 0,
            fecha: todayDate,
            turno: linea.turno || Turno.Manana,
            area: AreaProduccion.Sellado,
            maquinaId: linea.maquinaId,
            operario: linea.operario?.trim() || 'Operario',
            pedidoId: finalPedidoId,
            productoClienteId: finalProductoClienteId,
            cantidadProducida: 0,
            unidad: 'Unidades',
            merma: 0,
            estado: EstadoProduccion.EnProceso,
            observaciones: `Línea ${i + 1} de Sellado vinculada al lote madre ${orden.codigoLote}${linea.nombreVariante ? ` (${linea.nombreVariante})` : ''}`,
          },
        });

        // Activar máquina selladora
        await tx.maquina.updateMany({
          where: { id: linea.maquinaId },
          data: {
            estado: EstadoMaquina.Operativa,
            activa: true,
          },
        });
      }
    });

    revalidatePath('/produccion');
    revalidatePath('/dashboard/maquinas');
    revalidatePath('/maquinas');
    revalidatePath('/producto-terminado');

    return {
      success: true,
      message: `Se iniciaron exitosamente ${lineas.length} líneas de sellado compartiendo el pozo de bobina de ${orden.codigoLote}.`,
    };
  } catch (error: any) {
    console.error('Error al avanzar a sellado multi-línea:', error);
    return {
      success: false,
      error: error.message || 'Error al iniciar líneas de sellado.',
    };
  }
}
