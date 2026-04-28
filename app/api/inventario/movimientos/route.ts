import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { TipoMovimiento } from '@prisma/client';
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
    const inventarioId = searchParams.get('inventarioId');
    const tipo = searchParams.get('tipo') as TipoMovimiento | null;
    const fechaInicio = searchParams.get('fechaInicio');
    const fechaFin = searchParams.get('fechaFin');
    const busquedaInventario = searchParams.get('busquedaInventario');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: Record<string, unknown> = {};

    if (inventarioId) where.inventarioId = inventarioId;
    if (tipo) where.tipo = tipo;
    if (fechaInicio || fechaFin) {
      where.fecha = {};
      if (fechaInicio) (where.fecha as Record<string, Date>).gte = new Date(fechaInicio);
      if (fechaFin) (where.fecha as Record<string, Date>).lte = new Date(fechaFin + 'T23:59:59');
    }
    if (busquedaInventario) {
      where.inventario = {
        OR: [
          { nombre: { contains: busquedaInventario, mode: 'insensitive' } },
          { codigo: { contains: busquedaInventario, mode: 'insensitive' } }
        ]
      };
    }

    const [movimientos, total] = await Promise.all([
      prisma.movimientoInventario.findMany({
        where,
        include: {
          inventario: true
        },
        orderBy: { fecha: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.movimientoInventario.count({ where })
    ]);

    return NextResponse.json({
      movimientos,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error al obtener movimientos:', error);
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
    const { inventarioId, tipo, cantidad, motivo, referencia } = body;

    if (!inventarioId || !tipo || !cantidad) {
      return NextResponse.json({ error: 'Inventario, tipo y cantidad son requeridos' }, { status: 400 });
    }

    // Obtener el item actual
    const inventario = await prisma.inventario.findUnique({ where: { id: inventarioId } });
    if (!inventario) {
      return NextResponse.json({ error: 'Item de inventario no encontrado' }, { status: 404 });
    }

    // Calcular nueva cantidad
    let nuevaCantidad = inventario.cantidad;
    if (tipo === TipoMovimiento.Entrada || tipo === TipoMovimiento.Devolucion) {
      nuevaCantidad += cantidad;
    } else if (tipo === TipoMovimiento.Salida) {
      if (inventario.cantidad < cantidad) {
        return NextResponse.json({ error: 'Stock insuficiente' }, { status: 400 });
      }
      nuevaCantidad -= cantidad;
    } else if (tipo === TipoMovimiento.Ajuste) {
      nuevaCantidad = cantidad; // En ajuste, la cantidad es el nuevo valor
    }

    // Crear movimiento y actualizar stock en transacción
    const [movimiento] = await prisma.$transaction([
      prisma.movimientoInventario.create({
        data: {
          inventarioId,
          tipo,
          cantidad: tipo === TipoMovimiento.Ajuste ? Math.abs(cantidad - inventario.cantidad) : cantidad,
          motivo,
          referencia,
          responsable: session.user?.name || 'Sistema'
        },
        include: { inventario: true }
      }),
      prisma.inventario.update({
        where: { id: inventarioId },
        data: { cantidad: nuevaCantidad }
      })
    ]);

    return NextResponse.json(movimiento, { status: 201 });
  } catch (error) {
    console.error('Error al crear movimiento:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
