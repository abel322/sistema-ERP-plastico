import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { tipo, cantidad, unidad, descripcion, fecha, clienteId, productoId, ancho, largo, calibre, fuelles, anchoTroquel, largoTroquel } = body;

    const sobrante = await prisma.productoSobrante.update({
      where: { id },
      data: {
        tipo,
        cantidad: cantidad ? parseFloat(cantidad) : undefined,
        unidad,
        descripcion,
        fecha: fecha ? new Date(fecha) : undefined,
        clienteId: clienteId === undefined ? undefined : (clienteId || null),
        productoId: productoId === undefined ? undefined : (productoId || null),
        ancho: ancho === undefined ? undefined : (ancho ? parseFloat(ancho) : null),
        largo: largo === undefined ? undefined : (largo ? parseFloat(largo) : null),
        calibre: calibre === undefined ? undefined : (calibre ? parseFloat(calibre) : null),
        fuelles: fuelles === undefined ? undefined : (fuelles ? parseFloat(fuelles) : null),
        anchoTroquel: anchoTroquel === undefined ? undefined : (anchoTroquel ? parseFloat(anchoTroquel) : null),
        largoTroquel: largoTroquel === undefined ? undefined : (largoTroquel ? parseFloat(largoTroquel) : null)
      }
    });


    return NextResponse.json(sobrante);
  } catch (error) {
    console.error('Error al actualizar producto sobrante:', error);
    return NextResponse.json(
      { error: 'Error al actualizar producto sobrante' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = params;

    await prisma.productoSobrante.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar producto sobrante:', error);
    return NextResponse.json(
      { error: 'Error al eliminar producto sobrante' },
      { status: 500 }
    );
  }
}
