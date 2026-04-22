import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { EstadoMantenimiento } from '@prisma/client';
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

    const mantenimiento = await prisma.mantenimiento.findUnique({
      where: { id: params.id },
      include: {
        maquina: true
      }
    });

    if (!mantenimiento) {
      return NextResponse.json({ error: 'Mantenimiento no encontrado' }, { status: 404 });
    }

    return NextResponse.json(mantenimiento);
  } catch (error) {
    console.error('Error al obtener mantenimiento:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
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
    const { estado, descripcion, responsable, costo, observaciones, fechaRealizada } = body;

    const updateData: Record<string, unknown> = {};
    
    if (estado) {
      updateData.estado = estado;
      if (estado === EstadoMantenimiento.Completado && !fechaRealizada) {
        updateData.fechaRealizada = new Date();
      }
    }
    if (fechaRealizada) updateData.fechaRealizada = new Date(fechaRealizada);
    if (descripcion !== undefined) updateData.descripcion = descripcion;
    if (responsable !== undefined) updateData.responsable = responsable;
    if (costo !== undefined) updateData.costo = costo;
    if (observaciones !== undefined) updateData.observaciones = observaciones;

    const mantenimiento = await prisma.mantenimiento.update({
      where: { id: params.id },
      data: updateData,
      include: {
        maquina: true
      }
    });

    return NextResponse.json(mantenimiento);
  } catch (error) {
    console.error('Error al actualizar mantenimiento:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
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

    await prisma.mantenimiento.delete({ where: { id: params.id } });

    return NextResponse.json({ message: 'Mantenimiento eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar mantenimiento:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
