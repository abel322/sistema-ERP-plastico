import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { CategoriaInventario, TipoMovimiento } from '@prisma/client';
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
    const categoria = searchParams.get('categoria') as CategoriaInventario | null;
    const busqueda = searchParams.get('busqueda');
    const stockBajo = searchParams.get('stockBajo') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: Record<string, unknown> = {};
    
    if (categoria) {
      where.categoria = categoria;
    }
    
    if (busqueda) {
      where.OR = [
        { nombre: { contains: busqueda, mode: 'insensitive' } },
        { codigo: { contains: busqueda, mode: 'insensitive' } }
      ];
    }
    
    if (stockBajo) {
      where.cantidad = { lte: prisma.inventario.fields.stockMinimo };
    }

    const [inventarios, total] = await Promise.all([
      prisma.inventario.findMany({
        where: stockBajo ? {
          ...where,
          cantidad: undefined
        } : where,
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
      prisma.inventario.count({ where: stockBajo ? { ...where, cantidad: undefined } : where })
    ]);

    // Filtrar stock bajo manualmente
    const resultado = stockBajo 
      ? inventarios.filter(i => i.cantidad <= i.stockMinimo)
      : inventarios;

    return NextResponse.json({
      inventarios: resultado,
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
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { nombre, codigo, categoria, cantidad, unidad, stockMinimo, stockMaximo, ubicacion, costo, proveedor, observaciones } = body;

    if (!nombre || !codigo || !categoria || !unidad) {
      return NextResponse.json({ error: 'Nombre, código, categoría y unidad son requeridos' }, { status: 400 });
    }

    // Verificar código único
    const existente = await prisma.inventario.findUnique({ where: { codigo } });
    if (existente) {
      return NextResponse.json({ error: 'Ya existe un item con ese código' }, { status: 400 });
    }

    const inventario = await prisma.inventario.create({
      data: {
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

    // Si hay cantidad inicial, crear movimiento de entrada
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
