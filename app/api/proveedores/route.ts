import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';



// GET: Listar proveedores
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search');
    const activo = searchParams.get('activo');

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { rif: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (activo !== null && activo !== '') {
      where.activo = activo === 'true';
    }

    const [proveedores, total] = await Promise.all([
      prisma.proveedor.findMany({
        where,
        include: {
          _count: {
            select: { ordenesCompra: true },
          },
        },
        orderBy: { nombre: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.proveedor.count({ where }),
    ]);

    return NextResponse.json({
      proveedores,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error al obtener proveedores:', error);
    return NextResponse.json(
      { error: 'Error al obtener proveedores' },
      { status: 500 }
    );
  }
}

// POST: Crear proveedor
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const data = await request.json();
    const { nombre, rif, direccion, telefono, email, contacto, condicionesPago, observaciones } = data;

    if (!nombre || !rif) {
      return NextResponse.json(
        { error: 'Nombre y RIF son requeridos' },
        { status: 400 }
      );
    }

    // Verificar RIF único
    const existente = await prisma.proveedor.findUnique({ where: { rif } });
    if (existente) {
      return NextResponse.json(
        { error: 'Ya existe un proveedor con ese RIF' },
        { status: 400 }
      );
    }

    const proveedor = await prisma.proveedor.create({
      data: {
        nombre,
        rif,
        direccion,
        telefono,
        email,
        contacto,
        condicionesPago,
        observaciones,
      },
    });

    return NextResponse.json(proveedor, { status: 201 });
  } catch (error) {
    console.error('Error al crear proveedor:', error);
    return NextResponse.json(
      { error: 'Error al crear proveedor' },
      { status: 500 }
    );
  }
}
