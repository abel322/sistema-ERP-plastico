import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth-options';


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

    const despacho = await prisma.despacho.findUnique({
      where: { id: params.id },
      include: {
        pedido: {
          include: { cliente: true },
        },
        cliente: true,
        productoTerminado: {
          include: {
            produccion: {
              include: { maquina: true }
            }
          }
        }
      },
    });

    if (!despacho) {
      return NextResponse.json({ error: 'Despacho no encontrado' }, { status: 404 });
    }

    return NextResponse.json(despacho);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error al obtener despacho' }, { status: 500 });
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
    const { estado, vehiculo, conductor, destino, guiaRemision, observaciones } = body;

    const despachoAnterior = await prisma.despacho.findUnique({
      where: { id: params.id },
    });

    if (!despachoAnterior) {
      return NextResponse.json({ error: 'Despacho no encontrado' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (estado) {
      updateData.estado = estado;
      if (estado === 'Entregado' && despachoAnterior.estado !== 'Entregado') {
        updateData.entregadoAt = new Date();
      }
    }
    if (vehiculo !== undefined) updateData.vehiculo = vehiculo;
    if (conductor !== undefined) updateData.conductor = conductor;
    if (destino !== undefined) updateData.destino = destino;
    if (guiaRemision !== undefined) updateData.guiaRemision = guiaRemision;
    if (observaciones !== undefined) updateData.observaciones = observaciones;

    const despacho = await prisma.despacho.update({
      where: { id: params.id },
      data: updateData,
      include: {
        pedido: true,
        cliente: true,
        productoTerminado: true
      },
    });

    return NextResponse.json(despacho);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error al actualizar despacho' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = session.user as { rol?: string };
    if (user.rol !== 'admin') {
      return NextResponse.json({ error: 'Solo admin puede eliminar' }, { status: 403 });
    }

    const despacho = await prisma.despacho.findUnique({
      where: { id: params.id },
    });

    if (!despacho) {
      return NextResponse.json({ error: 'Despacho no encontrado' }, { status: 404 });
    }

    // Revertir cantidad en producto terminado si existe
    if (despacho.productoTerminadoId) {
      const producto = await prisma.productoTerminado.findUnique({
        where: { id: despacho.productoTerminadoId }
      });

      if (producto) {
        await prisma.productoTerminado.update({
          where: { id: despacho.productoTerminadoId },
          data: {
            cantidadDisponible: producto.cantidadDisponible + despacho.cantidadDespachada,
            estado: 'ListoDespacho',
            fechaDespacho: null
          }
        });
      }
    }

    // Revertir cantidad despachada en el pedido si existe
    if (despacho.pedidoId) {
      await prisma.pedido.update({
        where: { id: despacho.pedidoId },
        data: {
          cantidadDespachada: {
            decrement: despacho.cantidadDespachada,
          },
        },
      });
    }

    await prisma.despacho.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Despacho eliminado' });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error al eliminar despacho' }, { status: 500 });
  }
}
