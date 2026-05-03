import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const productoId = searchParams.get('productoId');

    if (!productoId) {
      return NextResponse.json({ error: 'ID de producto requerido' }, { status: 400 });
    }

    const producto = await prisma.productoCliente.findUnique({
      where: { id: productoId },
      include: {
        cliente: true
      }
    });

    if (!producto) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }

    return NextResponse.json(producto);
  } catch (error) {
    console.error('Error al obtener datos para ficha técnica:', error);
    return NextResponse.json(
      { error: 'Error al obtener datos' },
      { status: 500 }
    );
  }
}
