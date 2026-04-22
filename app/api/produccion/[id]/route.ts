import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { EstadoProduccion } from '@prisma/client';
import { authOptions } from '@/lib/auth-options';
import { determinarDestinoProducto } from '@/lib/producto-terminado-logic';

export const dynamic = 'force-dynamic';


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
        pedido: { include: { cliente: true } },
        productoTerminado: true,
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

    const body = await request.json();
    const { estado, completarPedido, ...updateData } = body;

    // Obtener la producción actual con su pedido y cliente
    const produccionActual = await prisma.produccion.findUnique({
      where: { id: params.id },
      include: {
        pedido: { include: { cliente: true } },
        productoTerminado: true
      }
    });

    if (!produccionActual) {
      return NextResponse.json({ error: 'Producción no encontrada' }, { status: 404 });
    }

    // Si se está finalizando la producción por primera vez
    const esRecienFinalizado = estado === EstadoProduccion.Finalizado && produccionActual.estado !== EstadoProduccion.Finalizado;

    if (esRecienFinalizado) {
      updateData.estado = estado;
      updateData.finalizadoAt = new Date();
    }

    const produccion = await prisma.produccion.update({
      where: { id: params.id },
      data: updateData,
      include: {
        maquina: true,
        pedido: { include: { cliente: true } },
        productoTerminado: true,
      },
    });

    // Si recién se finalizó, gestionamos las transiciones de inventario de producto terminado
    if (esRecienFinalizado) {
      // Obtener datos del cliente
      let clienteId: string | null = null;
      let tipoProducto = 'Bolsa';
      let conImpresion = false;

      if (produccion.pedido?.cliente) {
        clienteId = produccion.pedido.cliente.id;
        tipoProducto = produccion.pedido.cliente.tipoProducto;
        conImpresion = produccion.pedido.cliente.conImpresion || false;
      }

      if (clienteId) {
        // Determinar el destino FINAL
        const destino = determinarDestinoProducto(
          produccion.area,
          tipoProducto as 'Bolsa' | 'Bobina',
          conImpresion
        );

        if (produccionActual.productoTerminado) {
          // Si ya existía dinámica (porque fuimos añadiendo registros) => lo actualizamos a su estado FINAL
          await prisma.productoTerminado.update({
            where: { id: produccionActual.productoTerminado.id },
            data: {
              estado: destino.estado,
              siguienteArea: destino.siguienteArea,
              descripcion: destino.descripcionDestino, // Quitar el "(En Proceso)"
              fechaFinalizacion: new Date(),
              cantidadTotal: produccion.cantidadProducida,
              cantidadDisponible: produccion.cantidadProducida
            }
          });
        } else {
          // Si finalizó sin tener producto aún, lo creamos de cero
          await prisma.productoTerminado.create({
            data: {
              produccionId: produccion.id,
              pedidoId: produccion.pedidoId,
              clienteId: clienteId,
              areaOrigen: produccion.area,
              descripcion: destino.descripcionDestino,
              cantidadTotal: produccion.cantidadProducida,
              cantidadDisponible: produccion.cantidadProducida,
              unidad: produccion.unidad,
              tipoProducto: tipoProducto as 'Bolsa' | 'Bobina',
              conImpresion: conImpresion,
              estado: destino.estado,
              siguienteArea: destino.siguienteArea,
              fechaFinalizacion: new Date()
            }
          });
        }

        // Recargar producción con producto terminado
        const produccionConProducto = await prisma.produccion.findUnique({
          where: { id: params.id },
          include: {
            maquina: true,
            pedido: { include: { cliente: true } },
            productoTerminado: true,
          },
        });

        // Actualizar el Pedido a 'Completado' automáticamente al finalizar la producción
        // SOLO si viene el flag completarPedido en true
        if (produccionConProducto?.pedidoId && completarPedido) {
          await prisma.pedido.update({
            where: { id: produccionConProducto.pedidoId },
            data: {
              estado: 'Completado',
              cantidadProducida: produccionConProducto.cantidadProducida // Se asume la producción final como la cantidad
            }
          });
        }

        return NextResponse.json(produccionConProducto);
      }
    }

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
