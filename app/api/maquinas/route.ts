import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { AreaProduccion } from '@prisma/client';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const { searchParams } = new URL(request.url);
    const area = searchParams.get('area') as AreaProduccion | null;
    const activa = searchParams.get('activa');

    const where: any = { userId };
    if (area) where.area = area;
    if (activa !== null && activa !== undefined && activa !== '') where.activa = activa === 'true';

    const maquinas = await prisma.maquina.findMany({
      where,
      orderBy: [{ area: 'asc' }, { nombre: 'asc' }],
    });

    return NextResponse.json(maquinas);
  } catch (error) {
    console.error('Error al obtener máquinas:', error);
    return NextResponse.json({ error: 'Error al obtener máquinas' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const body = await request.json();
    const { nombre, area } = body;

    if (!nombre || !area) {
      return NextResponse.json({ error: 'Nombre y área son requeridos' }, { status: 400 });
    }

    const maquina = await prisma.maquina.create({
      data: { userId, nombre, area },
    });

    return NextResponse.json(maquina, { status: 201 });
  } catch (error) {
    console.error('Error al crear máquina:', error);
    return NextResponse.json({ error: 'Error al crear máquina' }, { status: 500 });
  }
}
