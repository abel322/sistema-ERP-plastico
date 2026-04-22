import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { EstadoMuestra } from '@prisma/client';
import { authOptions } from '@/lib/auth-options';

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

    const muestra = await prisma.muestra.findUnique({
      where: { id: params.id },
      include: {
        cliente: true,
        pedido: true,
      },
    });

    if (!muestra) {
      return NextResponse.json({ error: 'Muestra no encontrada' }, { status: 404 });
    }

    return NextResponse.json(muestra);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error al obtener muestra' }, { status: 500 });
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
    const { estado, descripcion, responsable, observaciones } = body;

    const muestraAnterior = await prisma.muestra.findUnique({
      where: { id: params.id },
    });

    if (!muestraAnterior) {
      return NextResponse.json({ error: 'Muestra no encontrada' }, { status: 404 });
    }

    const updateData: any = {};
    if (estado) {
      updateData.estado = estado as EstadoMuestra;
      if (estado === 'Aprobada' && muestraAnterior.estado !== 'Aprobada') {
        updateData.aprobadaAt = new Date();
      }
    }
    if (descripcion !== undefined) updateData.descripcion = descripcion;
    if (responsable !== undefined) updateData.responsable = responsable;
    if (observaciones !== undefined) updateData.observaciones = observaciones;

    const muestra = await prisma.muestra.update({
      where: { id: params.id },
      data: updateData,
      include: {
        cliente: true,
        pedido: true,
      },
    });

    return NextResponse.json(muestra);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error al actualizar muestra' }, { status: 500 });
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

    const user = session.user as any;
    if (user.rol !== 'admin') {
      return NextResponse.json({ error: 'Solo admin puede eliminar' }, { status: 403 });
    }

    await prisma.muestra.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Muestra eliminada' });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error al eliminar muestra' }, { status: 500 });
  }
}
