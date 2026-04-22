import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { AreaProduccion, EstadoProduccion } from '@prisma/client';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';


export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const periodo = searchParams.get('periodo') || 'semana'; // semana, mes
    const area = searchParams.get('area') as AreaProduccion | null;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Calcular fechas según el periodo
    const now = new Date();
    let fechaInicio: Date;

    if (periodo === 'semana') {
      // Inicio de la semana (lunes)
      const dayOfWeek = now.getDay();
      const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      fechaInicio = new Date(now);
      fechaInicio.setDate(now.getDate() - diff);
      fechaInicio.setHours(0, 0, 0, 0);
    } else {
      // Inicio del mes
      fechaInicio = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const where: any = {
      estado: EstadoProduccion.Finalizado,
      finalizadoAt: { gte: fechaInicio },
    };
    if (area) where.area = area;

    const [producciones, total, resumen] = await Promise.all([
      prisma.produccion.findMany({
        where,
        include: {
          maquina: true,
          pedido: { include: { cliente: true } },
          registros: {
            orderBy: { fecha: 'asc' },
          },
        },
        orderBy: { finalizadoAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.produccion.count({ where }),
      // Resumen por área
      prisma.produccion.groupBy({
        by: ['area'],
        where,
        _sum: {
          cantidadProducida: true,
          merma: true,
        },
        _count: true,
      }),
    ]);

    // Calcular totales generales
    const totales = {
      totalProducido: resumen.reduce((acc, r) => acc + (r._sum.cantidadProducida || 0), 0),
      totalMerma: resumen.reduce((acc, r) => acc + (r._sum.merma || 0), 0),
      totalRegistros: resumen.reduce((acc, r) => acc + r._count, 0),
    };

    return NextResponse.json({
      data: producciones,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      resumenPorArea: resumen,
      totales,
      periodo,
      fechaInicio: fechaInicio.toISOString(),
    });
  } catch (error) {
    console.error('Error al obtener historial:', error);
    return NextResponse.json({ error: 'Error al obtener historial' }, { status: 500 });
  }
}
