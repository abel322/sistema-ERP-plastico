import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { determinarDestinoProducto } from '@/lib/producto-terminado-logic';
import { AreaProduccion } from '@prisma/client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST: Marca un producto como procesado en su siguiente área.
 * Esto actualiza el producto terminado existente con la nueva área de origen
 * y recalcula su destino.
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const producto = await prisma.productoTerminado.findUnique({
      where: { id: params.id },
      include: { cliente: true }
    });

    if (!producto) {
      return NextResponse.json(
        { error: 'Producto terminado no encontrado' },
        { status: 404 }
      );
    }

    if (producto.estado !== 'PendienteArea') {
      return NextResponse.json(
        { error: 'El producto no está pendiente de procesar en otra área' },
        { status: 400 }
      );
    }

    if (producto.siguienteArea === 'Ninguna') {
      return NextResponse.json(
        { error: 'El producto no tiene siguiente área definida' },
        { status: 400 }
      );
    }

    // La nueva área de origen es la siguiente área del producto
    const nuevaAreaOrigen = producto.siguienteArea as AreaProduccion;

    // Recalcular el destino basado en la nueva área
    const nuevoDestino = determinarDestinoProducto(
      nuevaAreaOrigen,
      producto.tipoProducto,
      producto.conImpresion
    );

    // Actualizar el producto terminado
    const productoActualizado = await prisma.productoTerminado.update({
      where: { id: params.id },
      data: {
        areaOrigen: nuevaAreaOrigen,
        estado: nuevoDestino.estado,
        siguienteArea: nuevoDestino.siguienteArea,
        descripcion: nuevoDestino.descripcionDestino,
        updatedAt: new Date()
      },
      include: {
        cliente: true,
        produccion: {
          include: {
            maquina: true
          }
        }
      }
    });

    return NextResponse.json({
      message: `Producto procesado en ${nuevaAreaOrigen}`,
      producto: productoActualizado,
      nuevoDestino: nuevoDestino
    });
  } catch (error) {
    console.error('Error al procesar producto:', error);
    return NextResponse.json(
      { error: 'Error al procesar producto' },
      { status: 500 }
    );
  }
}
