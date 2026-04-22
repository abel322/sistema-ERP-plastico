import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth-options';


// GET: Listar parámetros de calidad
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const activo = searchParams.get('activo');

    const where: Record<string, unknown> = {};
    if (activo !== null && activo !== '') {
      where.activo = activo === 'true';
    }

    const parametros = await prisma.parametroCalidad.findMany({
      where,
      orderBy: { nombre: 'asc' },
    });

    return NextResponse.json(parametros);
  } catch (error) {
    console.error('Error al obtener parámetros:', error);
    return NextResponse.json(
      { error: 'Error al obtener parámetros' },
      { status: 500 }
    );
  }
}

// POST: Crear parámetro
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const data = await request.json();
    const { nombre, descripcion, valorMinimo, valorMaximo, unidad } = data;

    if (!nombre || !unidad) {
      return NextResponse.json(
        { error: 'Nombre y unidad son requeridos' },
        { status: 400 }
      );
    }

    const parametro = await prisma.parametroCalidad.create({
      data: {
        nombre,
        descripcion,
        valorMinimo: valorMinimo ? parseFloat(valorMinimo) : null,
        valorMaximo: valorMaximo ? parseFloat(valorMaximo) : null,
        unidad,
      },
    });

    return NextResponse.json(parametro, { status: 201 });
  } catch (error) {
    console.error('Error al crear parámetro:', error);
    return NextResponse.json(
      { error: 'Error al crear parámetro' },
      { status: 500 }
    );
  }
}
