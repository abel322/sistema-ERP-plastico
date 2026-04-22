import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth-options';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const clienteId = searchParams.get('clienteId');
    const fechaInicio = searchParams.get('fechaInicio');
    const fechaFin = searchParams.get('fechaFin');
    const tipoProducto = searchParams.get('tipoProducto');

    const where: Record<string, unknown> = {
      estado: 'Entregado',
      facturado: false,
    };

    if (clienteId) {
      where.clienteId = clienteId;
    }

    if (fechaInicio || fechaFin) {
      where.entregadoAt = {};
      if (fechaInicio) (where.entregadoAt as Record<string, Date>).gte = new Date(fechaInicio);
      if (fechaFin) (where.entregadoAt as Record<string, Date>).lte = new Date(fechaFin + 'T23:59:59');
    }

    if (tipoProducto) {
      where.productoTerminado = {
        tipoProducto: tipoProducto
      };
    }

    const [despachos, total] = await Promise.all([
      prisma.despacho.findMany({
        where,
        include: {
          pedido: true,
          cliente: true,
          productoTerminado: {
            include: {
              produccion: true
            }
          }
        },
        orderBy: { entregadoAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.despacho.count({ where }),
    ]);

    return NextResponse.json({
      data: despachos,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error al obtener despachos pendientes' }, { status: 500 });
  }
}
