import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { EstadoPedido } from '@prisma/client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

// GET - Obtener todos los pedidos con filtros para el usuario activo
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const userId = (session.user as any).id;

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

    let whereClause: any = { userId };

    if (busqueda) {
      whereClause.cliente = {
        nombre: { contains: busqueda, mode: 'insensitive' },
      };
    }

    if (estadoParam && estadoParam !== 'Todos') {
      if (estadoParam.includes(',')) {
        const estados = estadoParam.split(',').filter(e => Object.values(EstadoPedido).includes(e as EstadoPedido));
        if (estados.length > 0) {
          whereClause.estado = { in: estados };
        }
      } else {
        whereClause.estado = estadoParam;
      }
    } else {
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
  }
}

// POST - Crear nuevo pedido
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const body = await request.json();

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
        userId,
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
  }
}
