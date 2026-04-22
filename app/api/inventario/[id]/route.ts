import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';



export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const inventario = await prisma.inventario.findUnique({
      where: { id: params.id },
      include: {
        movimientos: {
          orderBy: { fecha: 'desc' },
          take: 50
        }
      }
    });

    if (!inventario) {
      return NextResponse.json({ error: 'Item no encontrado' }, { status: 404 });
    }

    return NextResponse.json(inventario);
  } catch (error) {
    console.error('Error al obtener item:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { nombre, categoria, unidad, stockMinimo, stockMaximo, ubicacion, costo, proveedor, observaciones } = body;

    const inventario = await prisma.inventario.update({
      where: { id: params.id },
      data: {
        ...(nombre && { nombre }),
        ...(categoria && { categoria }),
        ...(unidad && { unidad }),
        ...(stockMinimo !== undefined && { stockMinimo }),
        ...(stockMaximo !== undefined && { stockMaximo }),
        ...(ubicacion !== undefined && { ubicacion }),
        ...(costo !== undefined && { costo }),
        ...(proveedor !== undefined && { proveedor }),
        ...(observaciones !== undefined && { observaciones })
      }
    });

    return NextResponse.json(inventario);
  } catch (error) {
    console.error('Error al actualizar item:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as { rol?: string })?.rol !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    await prisma.inventario.delete({ where: { id: params.id } });

    return NextResponse.json({ message: 'Item eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar item:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
