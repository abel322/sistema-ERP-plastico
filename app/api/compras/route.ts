import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';



// GET: Listar órdenes de compra
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const proveedorId = searchParams.get('proveedorId');
    const estado = searchParams.get('estado') as string | null;
    const fechaInicio = searchParams.get('fechaInicio');
    const fechaFin = searchParams.get('fechaFin');

    const where: Record<string, unknown> = {};

    if (proveedorId) where.proveedorId = proveedorId;
    if (estado) where.estado = estado;
    if (fechaInicio || fechaFin) {
      where.fecha = {};
      if (fechaInicio) (where.fecha as Record<string, Date>).gte = new Date(fechaInicio);
      if (fechaFin) {
        const fin = new Date(fechaFin);
        fin.setHours(23, 59, 59, 999);
        (where.fecha as Record<string, Date>).lte = fin;
      }
    }

    const [ordenes, total] = await Promise.all([
      prisma.ordenCompra.findMany({
        where,
        include: {
          proveedor: true,
          detalles: true,
        },
        orderBy: { fecha: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.ordenCompra.count({ where }),
    ]);

    return NextResponse.json({
      ordenes,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error al obtener órdenes:', error);
    return NextResponse.json(
      { error: 'Error al obtener órdenes' },
      { status: 500 }
    );
  }
}

// POST: Crear orden de compra
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const data = await request.json();
    const { proveedorId, fechaEntrega, detalles, observaciones } = data;

    if (!proveedorId || !detalles || detalles.length === 0) {
      return NextResponse.json(
        { error: 'Proveedor y al menos un detalle son requeridos' },
        { status: 400 }
      );
    }

    // Generar número de orden
    const ultimaOrden = await prisma.ordenCompra.findFirst({
      orderBy: { createdAt: 'desc' },
    });
    const numeroSecuencia = ultimaOrden
      ? parseInt(ultimaOrden.numero.replace('OC-', '')) + 1
      : 1;
    const numero = `OC-${String(numeroSecuencia).padStart(6, '0')}`;

    // Calcular totales
    let subtotal = 0;
    const detallesConSubtotal = detalles.map((d: { cantidad: number; precioUnitario: number; descripcion: string; unidad: string }) => {
      const sub = d.cantidad * d.precioUnitario;
      subtotal += sub;
      return { ...d, subtotal: sub };
    });
    const iva = subtotal * 0.16; // 16% IVA
    const total = subtotal + iva;

    const orden = await prisma.ordenCompra.create({
      data: {
        numero,
        proveedorId,
        fechaEntrega: fechaEntrega ? new Date(fechaEntrega) : null,
        subtotal,
        iva,
        total,
        observaciones,
        detalles: {
          create: detallesConSubtotal.map((d: { descripcion: string; cantidad: number; unidad: string; precioUnitario: number; subtotal: number; inventarioId?: string }) => ({
            descripcion: d.descripcion,
            cantidad: d.cantidad,
            unidad: d.unidad,
            precioUnitario: d.precioUnitario,
            subtotal: d.subtotal,
            inventarioId: d.inventarioId || null,
          })),
        },
      },
      include: {
        proveedor: true,
        detalles: true,
      },
    });

    return NextResponse.json(orden, { status: 201 });
  } catch (error) {
    console.error('Error al crear orden:', error);
    return NextResponse.json(
      { error: 'Error al crear orden' },
      { status: 500 }
    );
  }
}
