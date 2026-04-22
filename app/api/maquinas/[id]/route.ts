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

    const maquina = await prisma.maquina.findUnique({
      where: { id: params.id },
    });

    if (!maquina) {
      return NextResponse.json({ error: 'Máquina no encontrada' }, { status: 404 });
    }

    return NextResponse.json(maquina);
  } catch (error) {
    console.error('Error al obtener máquina:', error);
    return NextResponse.json({ error: 'Error al obtener máquina' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).rol !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { nombre, area, activa } = body;

    const maquina = await prisma.maquina.update({
      where: { id: params.id },
      data: { nombre, area, activa },
    });

    return NextResponse.json(maquina);
  } catch (error) {
    console.error('Error al actualizar máquina:', error);
    return NextResponse.json({ error: 'Error al actualizar máquina' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).rol !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    await prisma.maquina.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Máquina eliminada' });
  } catch (error) {
    console.error('Error al eliminar máquina:', error);
    return NextResponse.json({ error: 'Error al eliminar máquina' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
