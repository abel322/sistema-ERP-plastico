import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { EstadoMejora } from '@prisma/client';
import { authOptions } from '@/lib/auth-options';


export const dynamic = 'force-dynamic';

// GET: Listar mejoras continuas
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const maquinaId = searchParams.get('maquinaId');
    const estado = searchParams.get('estado') as EstadoMejora | null;
    const fechaInicio = searchParams.get('fechaInicio');
    const fechaFin = searchParams.get('fechaFin');
    const responsable = searchParams.get('responsable');

    const where: Record<string, unknown> = {};

    if (maquinaId) where.maquinaId = maquinaId;
    if (estado) where.estado = estado;
    if (responsable) where.responsable = { contains: responsable, mode: 'insensitive' };
    if (fechaInicio || fechaFin) {
      where.fecha = {};
      if (fechaInicio) (where.fecha as Record<string, Date>).gte = new Date(fechaInicio);
      if (fechaFin) {
        const fin = new Date(fechaFin);
        fin.setHours(23, 59, 59, 999);
        (where.fecha as Record<string, Date>).lte = fin;
      }
    }

    const [mejoras, total] = await Promise.all([
      prisma.mejoraContinua.findMany({
        where,
        include: {
          maquina: true,
        },
        orderBy: { fecha: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.mejoraContinua.count({ where }),
    ]);

    // Estadísticas
    const estadisticas = await prisma.mejoraContinua.groupBy({
      by: ['estado'],
      _count: { _all: true },
    });

    const ahorroTotal = await prisma.mejoraContinua.aggregate({
      where: { estado: 'Implementada' },
      _sum: { ahorroEstimado: true },
    });

    return NextResponse.json({
      mejoras,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      estadisticas: {
        porEstado: estadisticas,
        ahorroTotal: ahorroTotal._sum.ahorroEstimado || 0,
      },
    });
  } catch (error) {
    console.error('Error al obtener mejoras:', error);
    return NextResponse.json(
      { error: 'Error al obtener mejoras' },
      { status: 500 }
    );
  }
}

// POST: Crear nueva mejora
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const data = await request.json();
    const {
      maquinaId,
      titulo,
      descripcion,
      problema,
      solucionPropuesta,
      responsable,
      costoEstimado,
      ahorroEstimado,
      observaciones,
    } = data;

    if (!maquinaId || !titulo || !problema || !solucionPropuesta || !responsable) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    const mejora = await prisma.mejoraContinua.create({
      data: {
        maquinaId,
        titulo,
        descripcion,
        problema,
        solucionPropuesta,
        responsable,
        costoEstimado: costoEstimado ? parseFloat(costoEstimado) : null,
        ahorroEstimado: ahorroEstimado ? parseFloat(ahorroEstimado) : null,
        observaciones,
        creadoPor: (session?.user as any)?.name || (session?.user as any)?.email || 'Usuario',
        estado: 'Propuesta',
      },
      include: {
        maquina: true,
      },
    });

    return NextResponse.json(mejora, { status: 201 });
  } catch (error) {
    console.error('Error al crear mejora:', error);
    return NextResponse.json(
      { error: 'Error al crear mejora' },
      { status: 500 }
    );
  }
}
