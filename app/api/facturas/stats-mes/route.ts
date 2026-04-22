import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }


    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString());

    // Primer y último día del mes
    const primerDia = new Date(year, month - 1, 1);
    const ultimoDia = new Date(year, month, 0, 23, 59, 59);

    const [
      totalFacturado,
      facturasEmitidas,
      facturasPagadas,
      despachosPendientes
    ] = await Promise.all([
      // Total facturado en el mes (solo facturas emitidas y pagadas)
      prisma.factura.aggregate({
        where: {
          fecha: { gte: primerDia, lte: ultimoDia },
          estado: { in: ['Emitida', 'Pagada'] }
        },
        _sum: { total: true }
      }),
      // Cantidad de facturas emitidas
      prisma.factura.count({
        where: {
          fecha: { gte: primerDia, lte: ultimoDia },
          estado: { in: ['Emitida', 'Pagada'] }
        }
      }),
      // Cantidad de facturas pagadas
      prisma.factura.count({
        where: {
          fecha: { gte: primerDia, lte: ultimoDia },
          estado: 'Pagada'
        }
      }),
      // Despachos entregados pendientes de facturar
      prisma.despacho.count({
        where: {
          estado: 'Entregado',
          facturado: false
        }
      })
    ]);

    return NextResponse.json({
      mes: month,
      anio: year,
      totalFacturado: totalFacturado._sum.total || 0,
      facturasEmitidas,
      facturasPagadas,
      despachosPendientes
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error al obtener estadísticas' }, { status: 500 });
  }
}
