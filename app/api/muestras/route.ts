import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { TipoMuestra, EstadoMuestra } from '@prisma/client';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';



export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const tipo = searchParams.get('tipo');
    const estado = searchParams.get('estado');
    const clienteId = searchParams.get('clienteId');
    const fechaInicio = searchParams.get('fechaInicio');
    const fechaFin = searchParams.get('fechaFin');

    const where: any = {};

    if (tipo) {
      where.tipo = tipo as TipoMuestra;
    }
    if (estado) {
      where.estado = estado as EstadoMuestra;
    }
    if (clienteId) {
      where.clienteId = clienteId;
    }
    if (fechaInicio || fechaFin) {
      where.fecha = {};
      if (fechaInicio) where.fecha.gte = new Date(fechaInicio);
      if (fechaFin) where.fecha.lte = new Date(fechaFin + 'T23:59:59');
    }

    const [muestras, total] = await Promise.all([
      prisma.muestra.findMany({
        where,
        include: {
          cliente: true,
          pedido: true,
        },
        orderBy: { fecha: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.muestra.count({ where }),
    ]);

    return NextResponse.json({
      data: muestras,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error al obtener muestras' }, { status: 500 });
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
      clienteId,
      pedidoId,
      tipo,
      descripcion,
      cantidad,
      unidad,
      responsable,
      observaciones,
      fecha,
    } = body;

    if (!clienteId || !tipo || !cantidad || !responsable) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    const muestra = await prisma.muestra.create({
      data: {
        clienteId,
        pedidoId: pedidoId || null,
        tipo: tipo as TipoMuestra,
        descripcion,
        cantidad: parseFloat(cantidad),
        unidad: unidad || 'Unidades',
        responsable,
        observaciones,
        fecha: fecha ? new Date(fecha) : new Date(),
      },
      include: {
        cliente: true,
        pedido: true,
      },
    });

    return NextResponse.json(muestra, { status: 201 });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error al crear muestra' }, { status: 500 });
  }
}
