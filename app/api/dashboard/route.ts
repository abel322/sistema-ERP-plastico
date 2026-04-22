import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
// Tipos de prisma omitidos para el SSR build limpio



export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const hoy = new Date();
    const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const enSieteDias = new Date(hoy.getTime() + 7 * 24 * 60 * 60 * 1000);
    const seisMesesAtras = new Date(hoy.getFullYear(), hoy.getMonth() - 5, 1);

    // Obtener estadísticas básicas
    const [
      totalClientes,
      pedidosActivos,
      pedidosCompletadosMes,
      pedidosUrgentes,
      despachosHoy,
      despachosPendientes,
      muestrasPendientes,
      peletizadoHoy,
    ] = await Promise.all([
      prisma.cliente.count(),
      prisma.pedido.count({
        where: {
          estado: { in: ['Pendiente', 'EnProceso'] },
        },
      }),
      prisma.pedido.count({
        where: {
          estado: 'Completado',
          fechaPedido: { gte: inicioMes },
        },
      }),
      prisma.pedido.count({
        where: {
          estado: { not: 'Completado' },
          fechaEntrega: { lte: enSieteDias, gte: hoy },
        },
      }),
      prisma.despacho.count({
        where: { fecha: { gte: inicioHoy } },
      }),
      prisma.despacho.count({
        where: { estado: { in: ['Pendiente', 'EnTransito'] } },
      }),
      prisma.muestra.count({
        where: { estado: 'Pendiente' },
      }),
      prisma.peletizado.aggregate({
        where: { fecha: { gte: inicioHoy } },
        _sum: { materialSalida: true, merma: true },
        _count: true,
      }),
    ]);

    // Nuevas métricas Fase 4
    const [
      facturasPendientes,
      mantenimientosProgramados,
      inventarioStockBajo,
    ] = await Promise.all([
      prisma.factura.count({
        where: { estado: 'Emitida' },
      }),
      prisma.mantenimiento.count({
        where: {
          estado: 'Programado',
          fechaProgramada: { lte: enSieteDias }
        },
      }),
      prisma.inventario.count({
        where: {
          cantidad: { lte: 0 }
        }
      }),
    ]);

    // Contar items con stock bajo manualmente (cantidad <= stockMinimo)
    const allInventario = await prisma.inventario.findMany({
      select: { cantidad: true, stockMinimo: true }
    });
    const stockBajoCount = allInventario.filter((i: any) => i.cantidad <= i.stockMinimo).length;

    // Estadísticas de producción del día
    const produccionHoy = await prisma.produccion.aggregate({
      where: { fecha: { gte: inicioHoy } },
      _sum: { cantidadProducida: true, merma: true },
      _count: true,
    });

    // Producción por área del día
    const produccionPorArea = await prisma.produccion.groupBy({
      by: ['area'],
      where: { fecha: { gte: inicioHoy } },
      _sum: { cantidadProducida: true, merma: true },
      _count: true,
    });

    // Producciones recientes
    const produccionesRecientes = await prisma.produccion.findMany({
      take: 5,
      include: { maquina: true, pedido: { include: { cliente: true } } },
      orderBy: { createdAt: 'desc' },
    });

    // Pedidos recientes
    const pedidosRecientes = await prisma.pedido.findMany({
      take: 10,
      include: { cliente: true },
      orderBy: { fechaPedido: 'desc' },
    });

    // Pedidos urgentes detallados
    const pedidosUrgentesDetalle = await prisma.pedido.findMany({
      where: {
        estado: { not: 'Completado' },
        fechaEntrega: { lte: enSieteDias, gte: hoy },
      },
      include: { cliente: true },
      orderBy: { fechaEntrega: 'asc' },
    });

    // Pedidos por estado
    const pedidosPorEstado = await prisma.pedido.groupBy({
      by: ['estado'],
      _count: true,
    });

    // Despachos recientes
    const despachosRecientes = await prisma.despacho.findMany({
      take: 5,
      include: { cliente: true, pedido: true },
      orderBy: { fecha: 'desc' },
    });

    // Pedidos por mes (últimos 6 meses)
    const pedidosPorMes = await prisma.$queryRaw<
      Array<{ mes: string; count: bigint }>
    >`
      SELECT 
        TO_CHAR("fechaPedido", 'YYYY-MM') as mes,
        COUNT(*)::int as count
      FROM "Pedido"
      WHERE "fechaPedido" >= ${seisMesesAtras}
      GROUP BY TO_CHAR("fechaPedido", 'YYYY-MM')
      ORDER BY mes ASC
    `;

    // Convertir BigInt a Number
    const pedidosPorMesConvertido = pedidosPorMes.map((item: any) => ({
      mes: item.mes,
      count: Number(item.count),
    }));

    return NextResponse.json({
      stats: {
        totalClientes,
        pedidosActivos,
        pedidosCompletadosMes,
        pedidosUrgentes,
        produccionHoy: produccionHoy._sum.cantidadProducida || 0,
        mermaHoy: produccionHoy._sum.merma || 0,
        registrosProduccionHoy: produccionHoy._count,
        despachosHoy,
        despachosPendientes,
        muestrasPendientes,
        peletizadoHoy: peletizadoHoy._sum.materialSalida || 0,
        mermaPeletizadoHoy: peletizadoHoy._sum.merma || 0,
        facturasPendientes,
        mantenimientosProgramados,
        stockBajoCount,
      },
      pedidosRecientes,
      pedidosUrgentesDetalle,
      pedidosPorEstado: pedidosPorEstado.map((item: any) => ({
        estado: item.estado,
        count: item._count,
      })),
      pedidosPorMes: pedidosPorMesConvertido,
      produccionPorArea: produccionPorArea.map((item: any) => ({
        area: item.area,
        cantidadProducida: item._sum.cantidadProducida || 0,
        merma: item._sum.merma || 0,
        registros: item._count,
      })),
      produccionesRecientes,
      despachosRecientes,
    });
  } catch (error) {
    console.error('Error al obtener datos del dashboard:', error);
    return NextResponse.json(
      { error: 'Error al obtener datos del dashboard' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
