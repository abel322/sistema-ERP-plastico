import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { EstadoPedido, Prioridad } from '@prisma/client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';


// GET - Obtener todos los pedidos con filtros
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const busqueda = searchParams.get('busqueda');
    const estadoParam = searchParams.get('estado');
    const prioridadParam = searchParams.get('prioridad');
    const clienteId = searchParams.get('clienteId');
    const fechaInicio = searchParams.get('fechaInicio');
    const fechaFin = searchParams.get('fechaFin');
    const page = parseInt(searchParams.get('page') ?? '1');
    const limit = parseInt(searchParams.get('limit') ?? '10');
    const skip = (page - 1) * limit;

    let whereClause: any = {};

    if (busqueda) {
      whereClause.cliente = {
        nombre: { contains: busqueda, mode: 'insensitive' },
      };
    }

    if (estadoParam && estadoParam !== 'Todos') {
      // Soportar múltiples estados separados por coma
      if (estadoParam.includes(',')) {
        const estados = estadoParam.split(',').filter(e => Object.values(EstadoPedido).includes(e as EstadoPedido));
        if (estados.length > 0) {
          whereClause.estado = { in: estados };
        }
      } else {
        whereClause.estado = estadoParam;
      }
    } else {
      // Por defecto (Todos), no mostrar los pedidos completados en la tabla principal
      whereClause.estado = { not: 'Completado' };
    }

    if (prioridadParam && prioridadParam !== 'Todas') {
      whereClause.prioridad = prioridadParam;
    }

    if (clienteId) {
      whereClause.clienteId = clienteId;
    }

    if (fechaInicio && fechaFin) {
      whereClause.fechaPedido = {
        gte: new Date(fechaInicio),
        lte: new Date(fechaFin),
      };
    }

    const [pedidos, total] = await Promise.all([
      prisma.pedido.findMany({
        where: whereClause,
        include: {
          cliente: true,
          productoCliente: true,
        },
        skip,
        take: limit,
        orderBy: { fechaPedido: 'desc' },
      }),
      prisma.pedido.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      data: pedidos,
      pedidos,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error al obtener pedidos:', error);
    return NextResponse.json(
      { error: 'Error al obtener pedidos' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST - Crear nuevo pedido (solo admin)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const userRol = (session.user as any)?.rol;
    if (userRol !== 'admin') {
      return NextResponse.json({ error: 'No tiene permisos' }, { status: 403 });
    }

    const body = await request.json();

    // Validar que la fecha de entrega no sea anterior a la fecha de pedido
    const fechaPedido = new Date(body.fechaPedido);
    const fechaEntrega = new Date(body.fechaEntrega);

    if (fechaEntrega < fechaPedido) {
      return NextResponse.json(
        { error: 'La fecha de entrega no puede ser anterior a la fecha de pedido' },
        { status: 400 }
      );
    }

    const pedido = await prisma.pedido.create({
      data: {
        clienteId: body.clienteId,
        productoClienteId: body.productoId,
        cantidadSolicitada: body.cantidadSolicitada,
        unidad: body.unidad,
        fechaPedido: body.fechaPedido,
        fechaEntrega: body.fechaEntrega,
        estado: body.estado,
        prioridad: body.prioridad,
        observaciones: body.observaciones,
      },
      include: {
        cliente: true,
        productoCliente: true,
      },
    });

    return NextResponse.json(pedido, { status: 201 });
  } catch (error) {
    console.error('Error al crear pedido:', error);
    return NextResponse.json(
      { error: 'Error al crear pedido' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
