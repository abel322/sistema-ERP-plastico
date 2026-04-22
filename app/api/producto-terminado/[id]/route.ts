import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function GET(
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
      include: {
        cliente: true,
        produccion: {
          include: {
            maquina: true,
            pedido: {
              include: {
                cliente: true
              }
            }
          }
        },
        despachos: {
          include: {
            cliente: true
          }
        }
      }
    });

    if (!producto) {
      return NextResponse.json(
        { error: 'Producto terminado no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(producto);
  } catch (error) {
    console.error('Error al obtener producto terminado:', error);
    return NextResponse.json(
      { error: 'Error al obtener producto terminado' },
      { status: 500 }
    );
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
    const {
      estado, descripcion, cantidadDisponible,
      clienteId, areaOrigen, cantidadTotal, unidad, tipoProducto, conImpresion, siguienteArea
    } = body;

    const updateData: Record<string, unknown> = {};

    if (estado !== undefined) updateData.estado = estado;
    if (descripcion !== undefined) updateData.descripcion = descripcion;
    if (cantidadDisponible !== undefined) updateData.cantidadDisponible = cantidadDisponible;
    if (clienteId !== undefined) updateData.clienteId = clienteId;
    if (areaOrigen !== undefined) updateData.areaOrigen = areaOrigen;
    if (cantidadTotal !== undefined) updateData.cantidadTotal = cantidadTotal;
    if (unidad !== undefined) updateData.unidad = unidad;
    if (tipoProducto !== undefined) updateData.tipoProducto = tipoProducto;
    if (conImpresion !== undefined) updateData.conImpresion = conImpresion;
    if (siguienteArea !== undefined) updateData.siguienteArea = siguienteArea;

    // Si se marca como despachado, registrar fecha
    if (estado === 'Despachado') {
      updateData.fechaDespacho = new Date();
    }

    const producto = await prisma.productoTerminado.update({
      where: { id: params.id },
      data: updateData,
      include: {
        cliente: true,
        produccion: {
          include: {
            maquina: true
          }
        }
      }
    });

    return NextResponse.json(producto);
  } catch (error) {
    console.error('Error al actualizar producto terminado:', error);
    return NextResponse.json(
      { error: 'Error al actualizar producto terminado' },
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
    if (!session || (session.user as { rol?: string })?.rol !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar que no tenga despachos asociados
    const producto = await prisma.productoTerminado.findUnique({
      where: { id: params.id },
      include: { despachos: true }
    });

    if (!producto) {
      return NextResponse.json(
        { error: 'Producto terminado no encontrado' },
        { status: 404 }
      );
    }

    if (producto.despachos.length > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar: tiene despachos asociados' },
        { status: 400 }
      );
    }

    await prisma.productoTerminado.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Producto terminado eliminado' });
  } catch (error) {
    console.error('Error al eliminar producto terminado:', error);
    return NextResponse.json(
      { error: 'Error al eliminar producto terminado' },
      { status: 500 }
    );
  }
}
