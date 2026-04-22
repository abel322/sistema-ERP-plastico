import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { CategoriaInventario, TipoMovimiento } from '@prisma/client';
import { authOptions } from '@/lib/auth-options';


export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const categoria = searchParams.get('categoria') as CategoriaInventario | null;
    const fechaInicio = searchParams.get('fechaInicio');
    const fechaFin = searchParams.get('fechaFin');

    // Obtener todos los items de inventario
    const whereInventario: Record<string, unknown> = {};
    if (categoria) whereInventario.categoria = categoria;

    const inventarios = await prisma.inventario.findMany({
      where: whereInventario,
      include: {
        movimientos: {
          where: {
            ...(fechaInicio || fechaFin ? {
              fecha: {
                ...(fechaInicio && { gte: new Date(fechaInicio) }),
                ...(fechaFin && { lte: new Date(fechaFin) })
              }
            } : {})
          },
          orderBy: { fecha: 'desc' }
        }
      }
    });

    // Items con stock bajo
    const stockBajo = inventarios.filter(i => i.cantidad <= i.stockMinimo);

    // Items con stock alto (si hay máximo definido)
    const stockAlto = inventarios.filter(i => i.stockMaximo && i.cantidad >= i.stockMaximo);

    // Resumen por categoría
    const resumenPorCategoria: Record<string, { items: number; valorTotal: number; stockBajo: number }> = {};
    for (const cat of Object.values(CategoriaInventario)) {
      const itemsCat = inventarios.filter(i => i.categoria === cat);
      resumenPorCategoria[cat] = {
        items: itemsCat.length,
        valorTotal: itemsCat.reduce((acc, i) => acc + (i.cantidad * (i.costo || 0)), 0),
        stockBajo: itemsCat.filter(i => i.cantidad <= i.stockMinimo).length
      };
    }

    // Movimientos recientes
    const movimientosRecientes = await prisma.movimientoInventario.findMany({
      where: {
        ...(fechaInicio || fechaFin ? {
          fecha: {
            ...(fechaInicio && { gte: new Date(fechaInicio) }),
            ...(fechaFin && { lte: new Date(fechaFin) })
          }
        } : {})
      },
      include: { inventario: true },
      orderBy: { fecha: 'desc' },
      take: 50
    });

    // Resumen de movimientos por tipo
    const resumenMovimientos: Record<string, { cantidad: number; count: number }> = {};
    for (const tipo of Object.values(TipoMovimiento)) {
      const movs = movimientosRecientes.filter(m => m.tipo === tipo);
      resumenMovimientos[tipo] = {
        cantidad: movs.reduce((acc, m) => acc + m.cantidad, 0),
        count: movs.length
      };
    }

    // Totales
    const totales = {
      totalItems: inventarios.length,
      valorInventario: inventarios.reduce((acc, i) => acc + (i.cantidad * (i.costo || 0)), 0),
      itemsStockBajo: stockBajo.length,
      itemsStockAlto: stockAlto.length,
      totalMovimientos: movimientosRecientes.length
    };

    return NextResponse.json({
      inventarios,
      stockBajo,
      stockAlto,
      resumenPorCategoria,
      movimientosRecientes,
      resumenMovimientos,
      totales
    });
  } catch (error) {
    console.error('Error al obtener reporte de inventario:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
