import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const hoy = new Date();
    const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const enSieteDias = new Date(hoy.getTime() + 7 * 24 * 60 * 60 * 1000);
    const seisMesesAtras = new Date(hoy.getFullYear(), hoy.getMonth() - 5, 1);

    // Obtener estadísticas básicas filtradas por el usuario
    const [
      totalClientes,
      pedidosActivos,
      pedidosCompletadosMes,
      pedidosUrgentes,
      despachosHoy,
      despachosPendientes,
      muestrasPendientes,
      peletizadoHoy,
      totalMateriaPrima,
      pedidosPendientesCount,
    ] = await Promise.all([
      prisma.cliente.count({ where: { userId } }),
      prisma.pedido.count({
        where: {
          userId,
          estado: { in: ['Pendiente', 'EnProceso'] },
        },
      }),
      prisma.pedido.count({
        where: {
          userId,
          estado: 'Completado',
          fechaPedido: { gte: inicioMes },
        },
      }),
      prisma.pedido.count({
        where: {
          userId,
          estado: { not: 'Completado' },
          fechaEntrega: { lte: enSieteDias, gte: hoy },
        },
      }),
      prisma.despacho.count({
        where: { userId, fecha: { gte: inicioHoy } },
      }),
      prisma.despacho.count({
        where: { userId, estado: { in: ['Pendiente', 'EnTransito'] } },
      }),
      prisma.muestra.count({
        where: { userId, estado: 'Pendiente' },
      }),
      prisma.peletizado.aggregate({
        where: { userId, fecha: { gte: inicioHoy } },
        _sum: { materialSalida: true, merma: true },
        _count: true,
      }),
      prisma.inventario.aggregate({
        where: { userId, categoria: 'MateriaPrima' },
        _sum: { cantidad: true }
      }),
      prisma.pedido.count({
        where: { userId, estado: 'Pendiente' }
      }),
    ]);

    // Métricas adicionales filtradas por usuario
    const [
      facturasPendientes,
      mantenimientosProgramados,
      inventarioStockBajo,
    ] = await Promise.all([
      prisma.factura.count({
        where: { userId, estado: 'Emitida' },
      }),
      prisma.mantenimiento.count({
        where: {
          userId,
          estado: 'Programado',
          fechaProgramada: { lte: enSieteDias }
        },
      }),
      prisma.inventario.count({
        where: {
          userId,
          cantidad: { lte: 0 }
        }
      }),
    ]);

    // Contar items con stock bajo del usuario (cantidad <= stockMinimo)
    const allInventario = await prisma.inventario.findMany({
      where: { userId },
      select: { cantidad: true, stockMinimo: true }
    });
    const stockBajoCount = allInventario.filter((i: any) => i.cantidad <= i.stockMinimo).length;

    // Estadísticas de producción del día
    const produccionHoy = await prisma.produccion.aggregate({
      where: { userId, fecha: { gte: inicioHoy } },
      _sum: { cantidadProducida: true, merma: true },
      _count: true,
    });

    // Producción por área del día
    const produccionPorArea = await prisma.produccion.groupBy({
      by: ['area'],
      where: { userId, fecha: { gte: inicioHoy } },
      _sum: { cantidadProducida: true, merma: true },
      _count: true,
    });

    // Producciones recientes
    const produccionesRecientes = await prisma.produccion.findMany({
      take: 5,
      where: { userId },
      include: { maquina: true, pedido: { include: { cliente: true } } },
      orderBy: { createdAt: 'desc' },
    });

    // Pedidos recientes
    const pedidosRecientes = await prisma.pedido.findMany({
      take: 10,
      where: { userId },
      include: { cliente: true },
      orderBy: { fechaPedido: 'desc' },
    });

    // Pedidos urgentes detallados
    const pedidosUrgentesDetalle = await prisma.pedido.findMany({
      where: {
        userId,
        estado: { not: 'Completado' },
        fechaEntrega: { lte: enSieteDias, gte: hoy },
      },
      include: { cliente: true },
      orderBy: { fechaEntrega: 'asc' },
    });

    // Pedidos por estado
    const pedidosPorEstado = await prisma.pedido.groupBy({
      by: ['estado'],
      where: { userId },
      _count: true,
    });

    // Despachos recientes
    const despachosRecientes = await prisma.despacho.findMany({
      take: 5,
      where: { userId },
      include: { cliente: true, pedido: true },
      orderBy: { fecha: 'desc' },
    });

    // Detalle de Materia Prima (Resumen)
    const materiaPrimaDetalle = await prisma.inventario.findMany({
      where: { userId, categoria: 'MateriaPrima' },
      select: { nombre: true, codigo: true, cantidad: true, unidad: true },
      take: 5,
      orderBy: { cantidad: 'desc' }
    });

    // Detalle de Pedidos Pendientes (Resumen)
    const pedidosPendientesDetalle = await prisma.pedido.findMany({
      where: { userId, estado: 'Pendiente' },
      include: { cliente: true },
      take: 5,
      orderBy: { fechaPedido: 'desc' }
    });

    // Detalle de Producto Terminado
    const productoTerminadoDetalle = await prisma.inventario.findMany({
      where: { userId, categoria: 'ProductoTerminado' },
      select: { nombre: true, cantidad: true, unidad: true },
      take: 5,
      orderBy: { cantidad: 'desc' }
    });

    // Producción en Proceso
    const produccionEnProcesoDetalle = await prisma.produccion.findMany({
      where: { 
        userId,
        pedido: {
          estado: 'EnProceso'
        }
      },
      include: { 
        pedido: { include: { cliente: true } },
        maquina: true 
      },
      take: 5,
      orderBy: { createdAt: 'desc' }
    });

    // Próximas Entregas (48 horas)
    const proximasEntregas = await prisma.pedido.findMany({
      where: {
        userId,
        estado: { in: ['Pendiente', 'EnProceso'] },
        fechaEntrega: { lte: new Date(hoy.getTime() + 48 * 60 * 60 * 1000), gte: hoy }
      },
      include: { cliente: true },
      take: 5,
      orderBy: { fechaEntrega: 'asc' }
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
        AND "userId" = ${userId}
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
        totalMateriaPrima: totalMateriaPrima._sum.cantidad || 0,
        pedidosPendientes: pedidosPendientesCount,
        eficienciaHoy: produccionHoy._sum.cantidadProducida && (produccionHoy._sum.cantidadProducida + (produccionHoy._sum.merma || 0)) > 0 
          ? (produccionHoy._sum.cantidadProducida / (produccionHoy._sum.cantidadProducida + (produccionHoy._sum.merma || 0))) * 100 
          : 0,
      },
      pedidosRecientes,
      pedidosUrgentesDetalle,
      proximasEntregas,
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
      materiaPrimaDetalle,
      pedidosPendientesDetalle,
      productoTerminadoDetalle,
      produccionEnProcesoDetalle,
    });
  } catch (error) {
    console.error('Error al obtener datos del dashboard:', error);
    return NextResponse.json(
      { error: 'Error al obtener datos del dashboard' },
      { status: 500 }
    );
  }
}
