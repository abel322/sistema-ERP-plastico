import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { TipoMantenimiento, EstadoMantenimiento } from '@prisma/client';
import { authOptions } from '@/lib/auth-options';


export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const maquinaId = searchParams.get('maquinaId');
    const tipo = searchParams.get('tipo') as TipoMantenimiento | null;
    const estado = searchParams.get('estado') as EstadoMantenimiento | null;
    const fechaInicio = searchParams.get('fechaInicio');
    const fechaFin = searchParams.get('fechaFin');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: Record<string, unknown> = {};
    
    if (maquinaId) where.maquinaId = maquinaId;
    if (tipo) where.tipo = tipo;
    if (estado) where.estado = estado;
    if (fechaInicio || fechaFin) {
      where.fechaProgramada = {};
      if (fechaInicio) (where.fechaProgramada as Record<string, Date>).gte = new Date(fechaInicio);
      if (fechaFin) (where.fechaProgramada as Record<string, Date>).lte = new Date(fechaFin);
    }

    const [mantenimientos, total] = await Promise.all([
      prisma.mantenimiento.findMany({
        where,
        include: {
          maquina: true
        },
        orderBy: { fechaProgramada: 'asc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.mantenimiento.count({ where })
    ]);

    return NextResponse.json({
      mantenimientos,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error al obtener mantenimientos:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { maquinaId, tipo, descripcion, fechaProgramada, responsable, costo, observaciones } = body;

    if (!maquinaId || !tipo || !descripcion || !fechaProgramada || !responsable) {
      return NextResponse.json({ error: 'Máquina, tipo, descripción, fecha y responsable son requeridos' }, { status: 400 });
    }

    // Verificar que la máquina existe
    const maquina = await prisma.maquina.findUnique({ where: { id: maquinaId } });
    if (!maquina) {
      return NextResponse.json({ error: 'Máquina no encontrada' }, { status: 404 });
    }

    const mantenimiento = await prisma.mantenimiento.create({
      data: {
        maquinaId,
        tipo,
        descripcion,
        fechaProgramada: new Date(fechaProgramada),
        responsable,
        costo,
        observaciones
      },
      include: {
        maquina: true
      }
    });

    return NextResponse.json(mantenimiento, { status: 201 });
  } catch (error) {
    console.error('Error al crear mantenimiento:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
