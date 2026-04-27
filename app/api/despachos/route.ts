import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { EstadoDespacho } from '@prisma/client';
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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const estado = searchParams.get('estado');
    const clienteId = searchParams.get('clienteId');
    const pedidoId = searchParams.get('pedidoId');
    const productoTerminadoId = searchParams.get('productoTerminadoId');
    const fechaInicio = searchParams.get('fechaInicio');
    const fechaFin = searchParams.get('fechaFin');
    const tipoProducto = searchParams.get('tipoProducto');
    const excludeEstado = searchParams.get('excludeEstado');

    const where: Record<string, unknown> = {};

    if (estado) {
      where.estado = estado as EstadoDespacho;
    } else if (excludeEstado) {
      where.estado = { not: excludeEstado as EstadoDespacho };
    }
    if (clienteId) {
      where.clienteId = clienteId;
    }
    if (pedidoId) {
      where.pedidoId = pedidoId;
    }
    if (productoTerminadoId) {
      where.productoTerminadoId = productoTerminadoId;
    }
    if (fechaInicio || fechaFin) {
      where.fecha = {};
      if (fechaInicio) (where.fecha as Record<string, Date>).gte = new Date(fechaInicio);
      if (fechaFin) (where.fecha as Record<string, Date>).lte = new Date(fechaFin + 'T23:59:59');
    }

    if (tipoProducto) {
      where.productoTerminado = {
        tipoProducto: tipoProducto
      };
    }

    const [despachos, total, stats] = await Promise.all([
      prisma.despacho.findMany({
        where,
        include: {
          pedido: true,
          cliente: true,
          productoTerminado: {
            include: {
              produccion: {
                include: {
                  maquina: true
                }
              }
            }
          }
        },
        orderBy: { fecha: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.despacho.count({ where }),
      prisma.despacho.aggregate({
        where,
        _sum: {
          cantidadDespachada: true
        }
      })
    ]);

    // Calcular totales por tipo si no se ha filtrado por tipo, o usar el total general si sí
    const [bolsasRes, bobinasRes] = await Promise.all([
      prisma.despacho.aggregate({
        where: { ...where, productoTerminado: { tipoProducto: 'Bolsa' } },
        _sum: { cantidadDespachada: true }
      }),
      prisma.despacho.aggregate({
        where: { ...where, productoTerminado: { tipoProducto: 'Bobina' } },
        _sum: { cantidadDespachada: true }
      })
    ]);

    return NextResponse.json({
      data: despachos,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      stats: {
        totalBolsas: bolsasRes._sum.cantidadDespachada || 0,
        totalBobinas: bobinasRes._sum.cantidadDespachada || 0,
        totalGeneral: stats._sum.cantidadDespachada || 0
      }
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error al obtener despachos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const {
      productoTerminadoId,
      pedidoId,
      clienteId,
      cantidadDespachada,
      unidad,
      vehiculo,
      conductor,
      destino,
      guiaRemision,
      observaciones,
      precioUnitario,
      fecha,
    } = body;


    // Validar que se proporcione producto terminado
    if (!productoTerminadoId || !cantidadDespachada || !unidad) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos (productoTerminadoId, cantidadDespachada, unidad)' },
        { status: 400 }
      );
    }

    // Obtener producto terminado
    const productoTerminado = await prisma.productoTerminado.findUnique({
      where: { id: productoTerminadoId },
      include: { cliente: true }
    });

    if (!productoTerminado) {
      return NextResponse.json(
        { error: 'Producto terminado no encontrado' },
        { status: 404 }
      );
    }

    if (productoTerminado.estado !== 'ListoDespacho') {
      return NextResponse.json(
        { error: 'El producto no está listo para despacho' },
        { status: 400 }
      );
    }

    const cantidadFloat = parseFloat(cantidadDespachada);

    if (cantidadFloat > productoTerminado.cantidadDisponible) {
      return NextResponse.json(
        { error: `Cantidad insuficiente. Disponible: ${productoTerminado.cantidadDisponible}` },
        { status: 400 }
      );
    }

    // Crear despacho
    const despacho = await prisma.despacho.create({
      data: {
        productoTerminadoId,
        pedidoId: pedidoId || productoTerminado.pedidoId,
        clienteId: clienteId || productoTerminado.clienteId,
        cantidadDespachada: cantidadFloat,
        unidad,
        vehiculo,
        conductor,
        destino,
        guiaRemision,
        observaciones,
        precioUnitario: precioUnitario ? parseFloat(precioUnitario) : null,
        valorTotal: precioUnitario ? parseFloat(precioUnitario) * cantidadFloat : null,
        fecha: fecha ? new Date(fecha) : new Date(),
      },
      include: {
        pedido: true,
        cliente: true,
        productoTerminado: true
      },
    });

    // Actualizar cantidad disponible en producto terminado
    const nuevaCantidadDisponible = productoTerminado.cantidadDisponible - cantidadFloat;

    await prisma.productoTerminado.update({
      where: { id: productoTerminadoId },
      data: {
        cantidadDisponible: nuevaCantidadDisponible,
        estado: nuevaCantidadDisponible <= 0 ? 'Despachado' : 'ListoDespacho',
        fechaDespacho: nuevaCantidadDisponible <= 0 ? new Date() : undefined
      }
    });

    // Si tiene pedido asociado, actualizar cantidad despachada
    if (despacho.pedidoId) {
      await prisma.pedido.update({
        where: { id: despacho.pedidoId },
        data: {
          cantidadDespachada: {
            increment: cantidadFloat,
          },
        },
      });
    }

    return NextResponse.json(despacho, { status: 201 });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error al crear despacho' }, { status: 500 });
  }
}
