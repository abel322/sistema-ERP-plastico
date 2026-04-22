import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';


// GET - Obtener todos los clientes o buscar
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const busqueda = searchParams.get('busqueda');
    const page = parseInt(searchParams.get('page') ?? '1');
    const limit = parseInt(searchParams.get('limit') ?? '10');
    const skip = (page - 1) * limit;

    let whereClause: any = {};

    if (busqueda) {
      whereClause = {
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

// POST - Crear nuevo cliente (solo admin)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const userRol = (session.user as { rol?: string })?.rol;
    if (userRol !== 'admin') {
      return NextResponse.json({ error: 'No tiene permisos' }, { status: 403 });
    }

    const body = await request.json();

    // Verificar si el RIF ya existe
    const existingCliente = await prisma.cliente.findUnique({
      where: { rif: body.rif },
    });

    if (existingCliente) {
      return NextResponse.json(
        { error: 'El RIF ya está registrado' },
        { status: 400 }
      );
    }

    // Asegurar que conImpresion sea booleano
    const clienteData = {
      ...body,
      conImpresion: body.conImpresion === true || body.conImpresion === 'true'
    };

    const cliente = await prisma.cliente.create({
      data: clienteData,
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
