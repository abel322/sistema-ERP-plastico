import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

// GET - Obtener clientes del usuario activo
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const { searchParams } = new URL(request.url);
    const busqueda = searchParams.get('busqueda');
    const includeProducts = searchParams.get('includeProducts') === 'true';
    const page = parseInt(searchParams.get('page') ?? '1');
    const limit = parseInt(searchParams.get('limit') ?? '50');
    const skip = (page - 1) * limit;

    let whereClause: any = { userId };

    if (busqueda) {
      whereClause = {
        userId,
        OR: [
          { nombre: { contains: busqueda, mode: 'insensitive' } },
          { rif: { contains: busqueda, mode: 'insensitive' } },
        ],
      };
    }

    const [clientes, total] = await Promise.all([
      prisma.cliente.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { fechaRegistro: 'desc' },
        include: includeProducts ? {
          productos: {
            where: { activo: true },
            orderBy: { createdAt: 'desc' }
          }
        } : undefined
      }),
      prisma.cliente.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      clientes,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    return NextResponse.json(
      { error: 'Error al obtener clientes' },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo cliente para el usuario activo
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await request.json();

    if (!body.nombre || !body.rif) {
      return NextResponse.json({ error: 'Nombre y RIF son requeridos' }, { status: 400 });
    }

    // Verificar si el RIF ya existe para ESTE usuario
    const existingCliente = await prisma.cliente.findFirst({
      where: { userId, rif: body.rif },
    });

    if (existingCliente) {
      return NextResponse.json(
        { error: 'El RIF ya está registrado para su usuario' },
        { status: 400 }
      );
    }

    const cliente = await prisma.cliente.create({
      data: {
        userId,
        nombre: body.nombre,
        rif: body.rif,
        contacto: body.contacto || null,
        telefono: body.telefono || null,
        email: body.email || null,
        direccion: body.direccion || null,
        observaciones: body.observaciones || null,
      },
    });

    return NextResponse.json(cliente, { status: 201 });
  } catch (error) {
    console.error('Error al crear cliente:', error);
    return NextResponse.json(
      { error: 'Error al crear cliente' },
      { status: 500 }
    );
  }
}
