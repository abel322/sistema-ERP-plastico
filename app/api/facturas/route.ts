import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { EstadoFactura } from '@prisma/client';
import { authOptions } from '@/lib/auth-options';


// Generar número de factura automático
async function generarNumeroFactura(): Promise<string> {
  const year = new Date().getFullYear();
  const lastFactura = await prisma.factura.findFirst({
    where: { numero: { startsWith: `F-${year}` } },
    orderBy: { numero: 'desc' }
  });
  
  if (lastFactura) {
    const lastNum = parseInt(lastFactura.numero.split('-')[2]);
    return `F-${year}-${String(lastNum + 1).padStart(5, '0')}`;
  }
  return `F-${year}-00001`;
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const estado = searchParams.get('estado') as EstadoFactura | null;
    const clienteId = searchParams.get('clienteId');
    const fechaInicio = searchParams.get('fechaInicio');
    const fechaFin = searchParams.get('fechaFin');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: Record<string, unknown> = {};
    
    if (estado) where.estado = estado;
    if (clienteId) where.clienteId = clienteId;
    if (fechaInicio || fechaFin) {
      where.fecha = {};
      if (fechaInicio) (where.fecha as Record<string, Date>).gte = new Date(fechaInicio);
      if (fechaFin) (where.fecha as Record<string, Date>).lte = new Date(fechaFin);
    }

    const [facturas, total] = await Promise.all([
      prisma.factura.findMany({
        where,
        include: {
          cliente: true,
          detalles: true
        },
        orderBy: { fecha: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.factura.count({ where })
    ]);

    return NextResponse.json({
      facturas,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error al obtener facturas:', error);
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
    const { clienteId, fechaVencimiento, detalles, metodoPago, observaciones, iva: ivaRate = 16 } = body;

    if (!clienteId || !detalles || detalles.length === 0) {
      return NextResponse.json({ error: 'Cliente y al menos un detalle son requeridos' }, { status: 400 });
    }

    // Calcular totales
    const subtotal = detalles.reduce((acc: number, d: { cantidad: number; precioUnitario: number }) => 
      acc + (d.cantidad * d.precioUnitario), 0);
    const iva = subtotal * (ivaRate / 100);
    const total = subtotal + iva;

    const numero = await generarNumeroFactura();

    const factura = await prisma.factura.create({
      data: {
        numero,
        clienteId,
        fechaVencimiento: fechaVencimiento ? new Date(fechaVencimiento) : null,
        subtotal,
        iva,
        total,
        metodoPago,
        observaciones,
        detalles: {
          create: detalles.map((d: { despachoId?: string; descripcion: string; cantidad: number; unidad: string; precioUnitario: number }) => ({
            despachoId: d.despachoId,
            descripcion: d.descripcion,
            cantidad: d.cantidad,
            unidad: d.unidad,
            precioUnitario: d.precioUnitario,
            subtotal: d.cantidad * d.precioUnitario
          }))
        }
      },
      include: {
        cliente: true,
        detalles: true
      }
    });

    // Marcar despachos como facturados
    const despachoIds = detalles
      .filter((d: { despachoId?: string }) => d.despachoId)
      .map((d: { despachoId: string }) => d.despachoId);
    
    if (despachoIds.length > 0) {
      await prisma.despacho.updateMany({
        where: { id: { in: despachoIds } },
        data: { facturado: true }
      });
    }

    return NextResponse.json(factura, { status: 201 });
  } catch (error) {
    console.error('Error al crear factura:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
