import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';



// GET: Obtener una orden
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const orden = await prisma.ordenCompra.findUnique({
      where: { id: params.id },
      include: {
        proveedor: true,
        detalles: true,
      },
    });

    if (!orden) {
      return NextResponse.json(
        { error: 'Orden no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(orden);
  } catch (error) {
    console.error('Error al obtener orden:', error);
    return NextResponse.json(
      { error: 'Error al obtener orden' },
      { status: 500 }
    );
  }
}

// PUT: Actualizar orden
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const existente = await prisma.ordenCompra.findUnique({
      where: { id: params.id },
    });

    if (!existente) {
      return NextResponse.json(
        { error: 'Orden no encontrada' },
        { status: 404 }
      );
    }

    const data = await request.json();
    const updateData: Record<string, unknown> = {};

    if (data.estado !== undefined) {
      updateData.estado = data.estado as any;
      if (data.estado === 'Recibida' && !existente.recibidaAt) {
        updateData.recibidaAt = new Date();
      }
    }

    if (data.fechaEntrega !== undefined) {
      updateData.fechaEntrega = data.fechaEntrega ? new Date(data.fechaEntrega) : null;
    }

    if (data.observaciones !== undefined) {
      updateData.observaciones = data.observaciones;
    }

    const orden = await prisma.ordenCompra.update({
      where: { id: params.id },
      data: updateData,
      include: {
        proveedor: true,
        detalles: true,
      },
    });

    return NextResponse.json(orden);
  } catch (error) {
    console.error('Error al actualizar orden:', error);
    return NextResponse.json(
      { error: 'Error al actualizar orden' },
      { status: 500 }
    );
  }
}

// DELETE: Eliminar orden
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if ((session.user as { rol?: string }).rol !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const existente = await prisma.ordenCompra.findUnique({
      where: { id: params.id },
    });

    if (!existente) {
      return NextResponse.json(
        { error: 'Orden no encontrada' },
        { status: 404 }
      );
    }

    // Solo se puede eliminar en estado Borrador o Cancelada
    if (!['Borrador', 'Cancelada'].includes(existente.estado)) {
      return NextResponse.json(
        { error: 'Solo se pueden eliminar órdenes en estado Borrador o Cancelada' },
        { status: 400 }
      );
    }

    await prisma.ordenCompra.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al eliminar orden:', error);
    return NextResponse.json(
      { error: 'Error al eliminar orden' },
      { status: 500 }
    );
  }
}
