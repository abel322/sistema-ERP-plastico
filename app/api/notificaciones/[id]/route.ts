import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';



// GET: Obtener una notificación
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const notificacion = await prisma.notificacion.findUnique({
      where: { id: params.id },
    });

    if (!notificacion) {
      return NextResponse.json(
        { error: 'Notificación no encontrada' },
        { status: 404 }
      );
    }

    // Solo el propietario o admin puede ver
    if (notificacion.usuarioId !== (session?.user as any)?.id && (session?.user as any)?.rol !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    return NextResponse.json(notificacion);
  } catch (error) {
    console.error('Error al obtener notificación:', error);
    return NextResponse.json(
      { error: 'Error al obtener notificación' },
      { status: 500 }
    );
  }
}

// PUT: Marcar como leída/no leída
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const existente = await prisma.notificacion.findUnique({
      where: { id: params.id },
    });

    if (!existente) {
      return NextResponse.json(
        { error: 'Notificación no encontrada' },
        { status: 404 }
      );
    }

    if (existente.usuarioId !== (session?.user as any)?.id && (session?.user as any)?.rol !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const data = await request.json();
    const notificacion = await prisma.notificacion.update({
      where: { id: params.id },
      data: {
        leida: data.leida ?? true,
      },
    });

    return NextResponse.json(notificacion);
  } catch (error) {
    console.error('Error al actualizar notificación:', error);
    return NextResponse.json(
      { error: 'Error al actualizar notificación' },
      { status: 500 }
    );
  }
}

// DELETE: Eliminar notificación
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const existente = await prisma.notificacion.findUnique({
      where: { id: params.id },
    });

    if (!existente) {
      return NextResponse.json(
        { error: 'Notificación no encontrada' },
        { status: 404 }
      );
    }

    if (existente.usuarioId !== (session?.user as any)?.id && (session?.user as any)?.rol !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    await prisma.notificacion.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al eliminar notificación:', error);
    return NextResponse.json(
      { error: 'Error al eliminar notificación' },
      { status: 500 }
    );
  }
}
