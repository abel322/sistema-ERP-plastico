import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const sobrantes = await prisma.productoSobrante.findMany({
      include: {
        cliente: {
          select: { id: true, nombre: true }
        },
        producto: {
          select: { id: true, nombreProducto: true }
        }
      },
      orderBy: { fecha: 'desc' }
    });

    return NextResponse.json(sobrantes);
  } catch (error) {
    console.error('Error al obtener productos sobrantes:', error);
    return NextResponse.json(
      { error: 'Error al obtener productos sobrantes' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { tipo, cantidad, unidad, descripcion, fecha, clienteId, productoId, ancho, largo, calibre } = body;

    if (!tipo || !cantidad || !unidad) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    const sobrante = await prisma.productoSobrante.create({
      data: {
        tipo,
        cantidad: parseFloat(cantidad),
        unidad,
        descripcion,
        fecha: fecha ? new Date(fecha) : new Date(),
        clienteId: clienteId || null,
        productoId: productoId || null,
        ancho: ancho ? parseFloat(ancho) : null,
        largo: largo ? parseFloat(largo) : null,
        calibre: calibre ? parseFloat(calibre) : null
      }
    });

    return NextResponse.json(sobrante, { status: 201 });
  } catch (error) {
    console.error('Error al crear producto sobrante:', error);
    return NextResponse.json(
      { error: 'Error al crear producto sobrante' },
      { status: 500 }
    );
  }
}

