import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { EstadoProduccion, TipoProducto, SiguienteArea } from '@prisma/client';
import { authOptions } from '@/lib/auth-options';
import { determinarDestinoProducto, DestinoProducto, getNombreArea } from '@/lib/producto-terminado-logic';

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
            productoCliente: true,
          },
        },
        productoCliente: {
          include: {
            cliente: true,
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
    const sumaMermas =
      produccionActual.registros && produccionActual.registros.length > 0
        ? produccionActual.registros.reduce(
            (sum, r) =>
              sum +
              (Number(r.merma) || 0) +
              (Number(r.mermaSinImpresion) || 0) +
              (Number(r.mermaImpreso) || 0),
            0
          )
        : updateData.merma !== undefined
        ? Number(updateData.merma)
        : Number(produccionActual.merma || 0);

    const produccionUpdatePayload: any = {
      ...updateData,
      cantidadProducida: cantidadFinal,
      merma: isNaN(sumaMermas) ? 0 : sumaMermas,
    };

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

        // Crear o actualizar ProductoTerminado de forma atómica y consistente
        const ptData = {
          userId: userId || produccionActual.userId,
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
