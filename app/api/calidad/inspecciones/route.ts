import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth-options';


// GET: Listar inspecciones
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const resultado = searchParams.get('resultado') as string | null;
    const fechaInicio = searchParams.get('fechaInicio');
    const fechaFin = searchParams.get('fechaFin');

    const where: Record<string, unknown> = {};

    if (resultado) where.resultado = resultado;
    if (fechaInicio || fechaFin) {
      where.fecha = {};
      if (fechaInicio) (where.fecha as Record<string, Date>).gte = new Date(fechaInicio);
      if (fechaFin) {
        const fin = new Date(fechaFin);
        fin.setHours(23, 59, 59, 999);
        (where.fecha as Record<string, Date>).lte = fin;
      }
    }

    const [inspecciones, total] = await Promise.all([
      prisma.inspeccionCalidad.findMany({
        where,
        include: {
          produccion: {
            include: {
              maquina: true,
              pedido: { include: { cliente: true } },
            },
          },
          resultadosParams: {
            include: { parametro: true },
          },
          noConformidades: true,
        },
        orderBy: { fecha: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.inspeccionCalidad.count({ where }),
    ]);

    // Estadísticas
    const estadisticas = await prisma.inspeccionCalidad.groupBy({
      by: ['resultado'],
      _count: { _all: true },
    });

    return NextResponse.json({
      inspecciones,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      estadisticas,
    });
  } catch (error) {
    console.error('Error al obtener inspecciones:', error);
    return NextResponse.json(
      { error: 'Error al obtener inspecciones' },
      { status: 500 }
    );
  }
}

// POST: Crear inspección
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const data = await request.json();
    const { produccionId, lote, inspector, resultado, observaciones, resultadosParams } = data;

    if (!inspector || !resultado) {
      return NextResponse.json(
        { error: 'Inspector y resultado son requeridos' },
        { status: 400 }
      );
    }

    const inspeccion = await prisma.inspeccionCalidad.create({
      data: {
        produccionId: produccionId || null,
        lote,
        inspector,
        resultado: resultado as any,
        observaciones,
        resultadosParams: resultadosParams ? {
          create: resultadosParams.map((r: { parametroId: string; valorMedido: number; cumple: boolean }) => ({
            parametroId: r.parametroId,
            valorMedido: r.valorMedido,
            cumple: r.cumple,
          })),
        } : undefined,
      },
      include: {
        produccion: true,
        resultadosParams: { include: { parametro: true } },
      },
    });

    return NextResponse.json(inspeccion, { status: 201 });
  } catch (error) {
    console.error('Error al crear inspección:', error);
    return NextResponse.json(
      { error: 'Error al crear inspección' },
      { status: 500 }
    );
  }
}
