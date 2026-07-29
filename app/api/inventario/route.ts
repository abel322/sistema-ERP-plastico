import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { CategoriaInventario, TipoMovimiento } from '@prisma/client';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const { searchParams } = new URL(request.url);
    const categoria = searchParams.get('categoria') as CategoriaInventario | null;
    const busqueda = searchParams.get('busqueda');
    const stockBajo = searchParams.get('stockBajo') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: Record<string, unknown> = { userId };
    
    if (categoria) {
      where.categoria = categoria;
    }
    
    if (busqueda) {
      where.OR = [
        { nombre: { contains: busqueda, mode: 'insensitive' } },
        { codigo: { contains: busqueda, mode: 'insensitive' } }
      ];
    }

    const [inventarios, total] = await Promise.all([
      prisma.inventario.findMany({
        where,
        include: {
          movimientos: {
            take: 5,
            orderBy: { fecha: 'desc' }
          }
        },
        orderBy: { nombre: 'asc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.inventario.count({ where })
    ]);

    const resultado = stockBajo 
      ? inventarios.filter(i => i.cantidad <= i.stockMinimo)
      : inventarios;

    const totalsByCategory = await prisma.inventario.groupBy({
      by: ['categoria'],
      where: { userId },
      _sum: {
        cantidad: true
      }
    });

    return NextResponse.json({
      inventarios: resultado,
      totalsByCategory: totalsByCategory.map(t => ({
        categoria: t.categoria,
        total: t._sum.cantidad || 0
      })),
      pagination: {
        total: stockBajo ? resultado.length : total,
        page,
        limit,
        totalPages: Math.ceil((stockBajo ? resultado.length : total) / limit)
      }
    });
  } catch (error) {
    console.error('Error al obtener inventario:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const body = await request.json();
    const { nombre, codigo, categoria, cantidad, unidad, stockMinimo, stockMaximo, ubicacion, costo, proveedor, observaciones } = body;

    if (!nombre || !codigo || !categoria || !unidad) {
      return NextResponse.json({ error: 'Nombre, código, categoría y unidad son requeridos' }, { status: 400 });
    }

    const existente = await prisma.inventario.findFirst({ where: { userId, codigo } });
    if (existente) {
      return NextResponse.json({ error: 'Ya existe un item con ese código para su usuario' }, { status: 400 });
    }

    const inventario = await prisma.inventario.create({
      data: {
        userId,
        nombre,
        codigo,
        categoria,
        cantidad: cantidad || 0,
        unidad,
        stockMinimo: stockMinimo || 0,
        stockMaximo,
        ubicacion,
        costo,
        proveedor,
        observaciones
      }
    });

    if (cantidad && cantidad > 0) {
      await prisma.movimientoInventario.create({
        data: {
          inventarioId: inventario.id,
          tipo: TipoMovimiento.Entrada,
          cantidad,
          motivo: 'Stock inicial',
          responsable: session.user?.name || 'Sistema'
        }
      });
    }

    return NextResponse.json(inventario, { status: 201 });
  } catch (error) {
    console.error('Error al crear inventario:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
