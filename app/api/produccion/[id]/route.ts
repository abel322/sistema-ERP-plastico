import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { EstadoProduccion, TipoProducto, SiguienteArea, TipoMovimiento, CategoriaInventario } from '@prisma/client';
import { authOptions } from '@/lib/auth-options';
import { determinarDestinoProducto, DestinoProducto, getNombreArea } from '@/lib/producto-terminado-logic';
import { generarCodigoLoteUnico } from '@/lib/utils/lote';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const produccion = await prisma.produccion.findUnique({
      where: { id: params.id },
      include: {
        maquina: true,
        pedido: { include: { cliente: true, productoCliente: true } },
        productoCliente: { include: { cliente: true } },
        productoTerminado: true,
        registros: { orderBy: { fecha: 'desc' } },
      },
    });

    if (!produccion) {
      return NextResponse.json({ error: 'Producción no encontrada' }, { status: 404 });
    }

    return NextResponse.json(produccion);
  } catch (error) {
    console.error('Error al obtener producción:', error);
    return NextResponse.json({ error: 'Error al obtener producción' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const userId = (session.user as any)?.id;

    const body = await request.json();
    const { estado, completarPedido, siguienteArea, ...updateData } = body;

    // Obtener la producción actual con todas sus relaciones relevantes
    const produccionActual = await prisma.produccion.findUnique({
      where: { id: params.id },
      include: {
        maquina: true,
        pedido: {
          include: {
            cliente: true,
            productoCliente: {
              include: { peletizado: true },
            },
          },
        },
        productoCliente: {
          include: {
            cliente: true,
            peletizado: true,
          },
        },
        productoTerminado: true,
        registros: {
          orderBy: { fecha: 'desc' },
        },
      },
    });

    if (!produccionActual) {
      return NextResponse.json({ error: 'Producción no encontrada' }, { status: 404 });
    }

    // Verificar si se está finalizando
    const esRecienFinalizado =
      estado === EstadoProduccion.Finalizado &&
      produccionActual.estado !== EstadoProduccion.Finalizado;
    const esFinalizado =
      estado === EstadoProduccion.Finalizado ||
      produccionActual.estado === EstadoProduccion.Finalizado;

    // Calcular la cantidad producida real: suma de registros si existen, o la cantidad enviada/actual
    const sumaRegistros =
      produccionActual.registros && produccionActual.registros.length > 0
        ? produccionActual.registros.reduce((sum, r) => sum + (Number(r.cantidad) || 0), 0)
        : 0;

    let cantidadFinal =
      sumaRegistros > 0
        ? sumaRegistros
        : updateData.cantidadProducida !== undefined
        ? Number(updateData.cantidadProducida)
        : Number(produccionActual.cantidadProducida || 0);

    if (isNaN(cantidadFinal) || cantidadFinal < 0) {
      cantidadFinal = 0;
    }

    // Recalcular mermas si existen registros
    const tieneRegistros = produccionActual.registros && produccionActual.registros.length > 0;
    const sumaMermas = tieneRegistros
      ? produccionActual.registros.reduce(
          (sum, r) =>
            sum +
            (Number(r.merma) || (Number((r as any).mermaColor || r.mermaImpreso || 0) + Number((r as any).mermaCristal || r.mermaSinImpresion || 0))),
          0
        )
      : updateData.merma !== undefined
      ? Number(updateData.merma)
      : Number(produccionActual.merma || 0);

    const sumaMermaColor = tieneRegistros
      ? produccionActual.registros.reduce(
          (sum, r) => sum + (Number((r as any).mermaColor) || Number(r.mermaImpreso) || 0),
          0
        )
      : updateData.mermaColor !== undefined
      ? Number(updateData.mermaColor)
      : Number((produccionActual as any).mermaColor || 0);

    const sumaMermaCristal = tieneRegistros
      ? produccionActual.registros.reduce(
          (sum, r) => sum + (Number((r as any).mermaCristal) || Number(r.mermaSinImpresion) || 0),
          0
        )
      : updateData.mermaCristal !== undefined
      ? Number(updateData.mermaCristal)
      : Number((produccionActual as any).mermaCristal || 0);

    const produccionUpdatePayload: any = {
      ...updateData,
      cantidadProducida: cantidadFinal,
      merma: isNaN(sumaMermas) ? 0 : sumaMermas,
      mermaColor: isNaN(sumaMermaColor) ? 0 : sumaMermaColor,
      mermaCristal: isNaN(sumaMermaCristal) ? 0 : sumaMermaCristal,
    };

    // Asegurar que la producción cuente con un código de lote único
    if (!produccionActual.codigoLote && !produccionUpdatePayload.codigoLote) {
      produccionUpdatePayload.codigoLote = await generarCodigoLoteUnico(prisma, produccionActual.area, produccionActual.fecha);
    }

    if (esRecienFinalizado) {
      produccionUpdatePayload.estado = EstadoProduccion.Finalizado;
      produccionUpdatePayload.finalizadoAt = new Date();
    } else if (estado) {
      produccionUpdatePayload.estado = estado;
    }

    // Si la orden está en estado Finalizado o se está finalizando ahora, persistir en ProductoTerminado
    if (esFinalizado) {
      // 1. Resolver Cliente
      let clienteId: string | null =
        produccionActual.pedido?.clienteId ||
        produccionActual.pedido?.cliente?.id ||
        produccionActual.productoCliente?.clienteId ||
        produccionActual.productoCliente?.cliente?.id ||
        null;

      if (!clienteId) {
        let genericClient = await prisma.cliente.findFirst({
          where: { nombre: 'Cliente Interno Genérico' },
        });
        if (!genericClient) {
          genericClient = await prisma.cliente.create({
            data: {
              userId: userId || produccionActual.userId,
              nombre: 'Cliente Interno Genérico',
              rif: 'J-00000000-0',
            },
          });
        }
        clienteId = genericClient.id;
      }

      // 2. Resolver Producto y Especificaciones
      const prodCli =
        produccionActual.pedido?.productoCliente || produccionActual.productoCliente;
      const productoClienteId =
        prodCli?.id ||
        produccionActual.productoClienteId ||
        produccionActual.pedido?.productoClienteId ||
        null;

      let tipoProducto: TipoProducto = 'Bolsa';
      if (prodCli?.tipoProducto) {
        tipoProducto = prodCli.tipoProducto;
      } else if (
        produccionActual.unidad === 'Kilogramos' ||
        produccionActual.area === 'Extrusion'
      ) {
        tipoProducto = 'Bobina';
      }

      let conImpresion = false;
      if (prodCli?.conImpresion !== undefined && prodCli?.conImpresion !== null) {
        conImpresion = Boolean(prodCli.conImpresion);
      }

      // 3. Determinar Destino y Siguiente Área
      let destino: DestinoProducto;
      const siguienteAreaValida = ['Sellado', 'Serigrafia', 'Refilado', 'Ninguna'].includes(
        siguienteArea
      )
        ? (siguienteArea as SiguienteArea)
        : null;

      if (completarPedido) {
        destino = {
          estado: 'ListoDespacho',
          siguienteArea: 'Ninguna',
          descripcionDestino: 'Producto finalizado listo para despacho',
        };
      } else if (siguienteAreaValida && siguienteAreaValida !== 'Ninguna') {
        destino = {
          estado: 'PendienteArea',
          siguienteArea: siguienteAreaValida,
          descripcionDestino: `${tipoProducto} de ${produccionActual.area} para ${getNombreArea(
            siguienteAreaValida
          )}`,
        };
      } else {
        destino = determinarDestinoProducto(
          produccionActual.area,
          tipoProducto,
          conImpresion
        );
      }

      // 4. Ejecutar transacción atómica en Prisma
      const resultado = await prisma.$transaction(async (tx) => {
        // Actualizar registro de Producción
        const prodActualizada = await tx.produccion.update({
          where: { id: params.id },
          data: produccionUpdatePayload,
          include: {
            maquina: true,
            pedido: {
              include: {
                cliente: true,
                productoCliente: true,
              },
            },
            productoCliente: {
              include: {
                cliente: true,
              },
            },
            productoTerminado: true,
          },
        });

        // Crear o actualizar ProductoTerminado de forma atómica y consistente con el lote
        const ptData = {
          userId: userId || produccionActual.userId,
          codigoLote: prodActualizada.codigoLote,
          loteOrigen: prodActualizada.loteOrigen,
          pedidoId: produccionActual.pedidoId || null,
          clienteId: clienteId!,
          productoClienteId: productoClienteId,
          areaOrigen: produccionActual.area,
          descripcion: destino.descripcionDestino,
          cantidadTotal: cantidadFinal,
          cantidadDisponible: cantidadFinal,
          unidad: produccionActual.unidad,
          tipoProducto: tipoProducto,
          conImpresion: conImpresion,
          estado: destino.estado,
          siguienteArea: destino.siguienteArea,
          fechaFinalizacion: new Date(),
        };

        const prodTerminado = await tx.productoTerminado.upsert({
          where: { produccionId: produccionActual.id },
          update: ptData,
          create: {
            ...ptData,
            produccionId: produccionActual.id,
          },
        });

        // Actualizar el Pedido a 'Completado' automáticamente si viene completarPedido en true
        if (prodActualizada.pedidoId && completarPedido) {
          await tx.pedido.update({
            where: { id: prodActualizada.pedidoId },
            data: {
              estado: 'Completado',
              cantidadProducida: cantidadFinal,
            },
          });
        }

        // 5. Descuento Automático en Inventario para Extrusión (Idempotente)
        if (produccionActual.area === 'Extrusion' && !produccionActual.consumoMpDescontado) {
          const kgBobinasTerminadas = Number(cantidadFinal) || 0;
          const kgMermaExtrusion = Number(produccionUpdatePayload.merma) || 0;
          const kgExtrusion = kgBobinasTerminadas + kgMermaExtrusion;

          const formulacion = prodCli;

          if (formulacion && kgExtrusion > 0) {
            const loteReferencia = prodActualizada.codigoLote || prodActualizada.id;
            const responsableNombre = (session?.user as any)?.name || prodActualizada.operario || 'Sistema';

            // 1. Balance Base Polímero (100% = kgExtrusion)
            // A. Peletizado
            const peletizadoId = formulacion.peletizadoId;
            const peletizadoPct = Number(formulacion.peletizadoPorcentaje) || 0;
            const kgPeletizado = peletizadoPct > 0 ? kgExtrusion * (peletizadoPct / 100) : 0;

            if (peletizadoId && kgPeletizado > 0) {
              const itemPeletizado = await tx.inventario.findUnique({
                where: { id: peletizadoId },
              });

              if (itemPeletizado) {
                await tx.inventario.update({
                  where: { id: itemPeletizado.id },
                  data: {
                    cantidad: { decrement: kgPeletizado },
                  },
                });

                await tx.movimientoInventario.create({
                  data: {
                    inventarioId: itemPeletizado.id,
                    tipo: TipoMovimiento.Salida,
                    cantidad: kgPeletizado,
                    motivo: `Consumo Peletizado (${itemPeletizado.nombre}) en Extrusión - Lote ${loteReferencia}`,
                    referencia: loteReferencia,
                    responsable: responsableNombre,
                  },
                });
              }
            }

            // B. Materia Prima Virgen Disponible y Distribución Proporcional
            const kgVirgenTotal = Math.max(0, kgExtrusion - kgPeletizado);

            const resinasFormulacion = [
              { key: 'formFB7000', altKey: 'fb7000', label: 'FB7000', searchTerms: ['FB7000', 'FB 7000', '7000'] },
              { key: 'form3003', altKey: 'p3003', label: '3003', searchTerms: ['3003', 'PEBD 3003'] },
              { key: 'formLineal', altKey: 'lineal', label: 'Lineal', searchTerms: ['Lineal', 'LLDPE'] },
              { key: 'form0240', altKey: 'p0240', label: '0240', searchTerms: ['0240'] },
              { key: 'form0348', altKey: 'p0348', label: '0348', searchTerms: ['0348'] },
              { key: 'form7000F', altKey: 'p7000F', label: '7000F', searchTerms: ['7000F', '7000 F'] },
            ];

            const sumaVirgen = resinasFormulacion.reduce((sum, r) => {
              const pct = Number((formulacion as any)[r.key] ?? (formulacion as any)[r.altKey]) || 0;
              return sum + pct;
            }, 0);

            if (kgVirgenTotal > 0 && sumaVirgen > 0) {
              for (const resina of resinasFormulacion) {
                const resinaPct = Number((formulacion as any)[resina.key] ?? (formulacion as any)[resina.altKey]) || 0;
                if (resinaPct > 0) {
                  const kgResina = kgVirgenTotal * (resinaPct / sumaVirgen);

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

                  if (itemMp) {
                    await tx.inventario.update({
                      where: { id: itemMp.id },
                      data: {
                        cantidad: { decrement: kgResina },
                      },
                    });

                    await tx.movimientoInventario.create({
                      data: {
                        inventarioId: itemMp.id,
                        tipo: TipoMovimiento.Salida,
                        cantidad: kgResina,
                        motivo: `Consumo Resina (${resina.label}) en Extrusión - Lote ${loteReferencia}`,
                        referencia: loteReferencia,
                        responsable: responsableNombre,
                      },
                    });
                  }
                }
              }
            }

            // C. Descuento de Aditivos (Categoría ADITIVO, códigos MB-1 a MB-5)
            const aditivosFormulacion = [
              { key: 'formDeslizante', altKey: 'deslizante', label: 'Deslizante', codigo: 'mb-3', nombre: 'deslizante' },
              { key: 'formMasterbachBlanco', altKey: 'masterbachBlanco', label: 'Masterbach Blanco', codigo: 'mb-1', nombre: 'masterbach blanco' },
              { key: 'formMasterbachNegro', altKey: 'masterbachNegro', label: 'Masterbach Negro', codigo: 'mb-2', nombre: 'masterbach negro' },
              { key: 'formMasterbachAzul', altKey: 'masterbachAzul', label: 'Masterbach Azul', codigo: 'mb-4', nombre: 'masterbach azul' },
              { key: 'formMasterbachAmarillo', altKey: 'masterbachAmarillo', label: 'Masterbach Amarillo', codigo: 'mb-5', nombre: 'masterbach amarillo' },
            ];

            for (const aditivo of aditivosFormulacion) {
              const aditivoPct = Number((formulacion as any)[aditivo.key] ?? (formulacion as any)[aditivo.altKey]) || 0;
              if (aditivoPct > 0) {
                const kgAditivo = kgExtrusion * (aditivoPct / 100);

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
                  await tx.inventario.update({
                    where: { id: itemAditivo.id },
                    data: {
                      cantidad: { decrement: kgAditivo },
                    },
                  });

                  await tx.movimientoInventario.create({
                    data: {
                      inventarioId: itemAditivo.id,
                      tipo: TipoMovimiento.Salida,
                      cantidad: kgAditivo,
                      motivo: `Consumo Aditivo (${itemAditivo.nombre}) en Extrusión - Lote ${loteReferencia}`,
                      referencia: loteReferencia,
                      responsable: responsableNombre,
                    },
                  });
                }
              }
            }

            // Marcar como descontado para idempotencia
            await tx.produccion.update({
              where: { id: prodActualizada.id },
              data: { consumoMpDescontado: true },
            });
            prodActualizada.consumoMpDescontado = true;
          }
        }

        return {
          ...prodActualizada,
          productoTerminado: prodTerminado,
        };
      });

      return NextResponse.json(resultado);
    }

    // Actualización regular cuando no está finalizado
    const produccion = await prisma.produccion.update({
      where: { id: params.id },
      data: produccionUpdatePayload,
      include: {
        maquina: true,
        pedido: {
          include: {
            cliente: true,
            productoCliente: true,
          },
        },
        productoCliente: {
          include: {
            cliente: true,
          },
        },
        productoTerminado: true,
      },
    });

    return NextResponse.json(produccion);
  } catch (error) {
    console.error('Error al actualizar producción:', error);
    return NextResponse.json({ error: 'Error al actualizar producción' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as { rol?: string })?.rol !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener la producción para revertir cantidad en pedido si aplica
    const produccion = await prisma.produccion.findUnique({
      where: { id: params.id },
      include: { productoTerminado: true }
    });

    if (!produccion) {
      return NextResponse.json({ error: 'Producción no encontrada' }, { status: 404 });
    }

    // Eliminar producto terminado asociado si existe
    if (produccion.productoTerminado) {
      await prisma.productoTerminado.delete({
        where: { id: produccion.productoTerminado.id }
      });
    }

    if (produccion.pedidoId) {
      const pedido = await prisma.pedido.findUnique({
        where: { id: produccion.pedidoId },
      });
      if (pedido) {
        await prisma.pedido.update({
          where: { id: produccion.pedidoId },
          data: {
            cantidadProducida: Math.max(0, pedido.cantidadProducida - produccion.cantidadProducida),
          },
        });
      }
    }

    await prisma.produccion.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Producción eliminada' });
  } catch (error) {
    console.error('Error al eliminar producción:', error);
    return NextResponse.json({ error: 'Error al eliminar producción' }, { status: 500 });
  }
}
