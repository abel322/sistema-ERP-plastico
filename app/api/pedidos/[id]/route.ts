import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';


// GET - Obtener pedido por ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const pedido = await prisma.pedido.findUnique({
      where: { id: params.id },
      include: {
        cliente: true,
        productoCliente: true,
      },
    });

    if (!pedido) {
      return NextResponse.json(
        { error: 'Pedido no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(pedido);
  } catch (error) {
    console.error('Error al obtener pedido:', error);
    return NextResponse.json(
      { error: 'Error al obtener pedido' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PUT - Actualizar pedido (solo admin)
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const userRol = (session.user as any)?.rol;
    if (userRol !== 'admin') {
      return NextResponse.json({ error: 'No tiene permisos' }, { status: 403 });
    }

    const body = await request.json();

    // Validar fechas si se están actualizando
    if (body.fechaPedido && body.fechaEntrega) {
      const fechaPedido = new Date(body.fechaPedido);
      const fechaEntrega = new Date(body.fechaEntrega);

      if (fechaEntrega < fechaPedido) {
        return NextResponse.json(
          { error: 'La fecha de entrega no puede ser anterior a la fecha de pedido' },
          { status: 400 }
        );
      }
    }

    const updateData: any = {};
    if (body.clienteId !== undefined) updateData.clienteId = body.clienteId;
    if (body.productoId || body.productoClienteId) {
      updateData.productoClienteId = body.productoId || body.productoClienteId;
    }
    if (body.cantidadSolicitada !== undefined) updateData.cantidadSolicitada = body.cantidadSolicitada;
    if (body.unidad !== undefined) updateData.unidad = body.unidad;
    if (body.fechaPedido !== undefined) updateData.fechaPedido = new Date(body.fechaPedido);
    if (body.fechaEntrega !== undefined) updateData.fechaEntrega = new Date(body.fechaEntrega);
    if (body.estado !== undefined) updateData.estado = body.estado;
    if (body.prioridad !== undefined) updateData.prioridad = body.prioridad;
    if (body.observaciones !== undefined) updateData.observaciones = body.observaciones;

    const pedido = await prisma.pedido.update({
      where: { id: params.id },
      data: updateData,
      include: {
        cliente: true,
        productoCliente: true,
      },
    });

    return NextResponse.json(pedido);
  } catch (error) {
    console.error('Error al actualizar pedido:', error);
    return NextResponse.json(
      { error: 'Error al actualizar pedido' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE - Eliminar pedido (solo admin)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const userRol = (session.user as any)?.rol;
    if (userRol !== 'admin') {
      return NextResponse.json({ error: 'No tiene permisos' }, { status: 403 });
    }

    await prisma.pedido.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Pedido eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar pedido:', error);
    return NextResponse.json(
      { error: 'Error al eliminar pedido' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
