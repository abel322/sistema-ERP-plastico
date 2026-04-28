import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET: Listar logs de actividad
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Solo admin puede ver logs
    if ((session.user as { rol?: string }).rol !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const accion = searchParams.get('accion') as string | null;
    const modulo = searchParams.get('modulo');
    const usuarioId = searchParams.get('usuarioId');
    const fechaInicio = searchParams.get('fechaInicio');
    const fechaFin = searchParams.get('fechaFin');

    const where: Record<string, unknown> = {};

    if (accion) where.accion = accion;
    if (modulo) where.modulo = modulo;
    if (usuarioId) where.usuarioId = usuarioId;
    if (fechaInicio || fechaFin) {
      where.fecha = {};
      if (fechaInicio) (where.fecha as Record<string, Date>).gte = new Date(fechaInicio);
      if (fechaFin) {
        const fin = new Date(fechaFin);
        fin.setHours(23, 59, 59, 999);
        (where.fecha as Record<string, Date>).lte = fin;
      }
    }

    const [logs, total] = await Promise.all([
      prisma.logActividad.findMany({
        where,
        orderBy: { fecha: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.logActividad.count({ where }),
    ]);

    // Obtener módulos únicos para filtros
    const modulos = await prisma.logActividad.findMany({
      select: { modulo: true },
      distinct: ['modulo'],
    });

    return NextResponse.json({
      logs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      modulos: modulos.map((m: { modulo: string }) => m.modulo),
    });
  } catch (error) {
    console.error('Error al obtener logs:', error);
    return NextResponse.json(
      { error: 'Error al obtener logs' },
      { status: 500 }
    );
  }
}

// POST: Registrar actividad (uso interno)
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { usuarioId, usuarioNombre, accion, modulo, registroId, descripcion, datosAntes, datosDespues, ip, userAgent } = data;

    const log = await prisma.logActividad.create({
      data: {
        usuarioId,
        usuarioNombre,
        accion: accion as string,
        modulo,
        registroId,
        descripcion,
        datosAntes: datosAntes ? JSON.stringify(datosAntes) : null,
        datosDespues: datosDespues ? JSON.stringify(datosDespues) : null,
        ip,
        userAgent,
      },
    });

    return NextResponse.json(log, { status: 201 });
  } catch (error) {
    console.error('Error al registrar actividad:', error);
    return NextResponse.json(
      { error: 'Error al registrar actividad' },
      { status: 500 }
    );
  }
}
