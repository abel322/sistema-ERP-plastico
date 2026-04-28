import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET - Obtener un producto específico
export async function GET(
  request: Request,
  { params }: { params: { id: string; productoId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const producto = await prisma.productoCliente.findUnique({
      where: { 
        id: params.productoId,
        clienteId: params.id
      }
    });

    if (!producto) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(producto);
  } catch (error) {
    console.error('Error al obtener producto:', error);
    return NextResponse.json(
      { error: 'Error al obtener producto' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar un producto
export async function PUT(
  request: Request,
  { params }: { params: { id: string; productoId: string } }
) {
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

    // Verificar que el producto existe y pertenece al cliente
    const existingProducto = await prisma.productoCliente.findFirst({
      where: {
        id: params.productoId,
        clienteId: params.id
      }
    });

    if (!existingProducto) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      );
    }

    // Actualizar producto
    const producto = await prisma.productoCliente.update({
      where: { id: params.productoId },
      data: {
        nombreProducto: body.nombreProducto,
        codigoProducto: body.codigoProducto || null,
        activo: body.activo !== undefined ? body.activo : true,
        tipoProducto: body.tipoProducto,
        conImpresion: body.conImpresion || false,
        ancho: body.ancho || null,
        largo: body.largo || null,
        calibre: body.calibre || null,
        diametroAnchoBolsa: body.diametroAnchoBolsa || null,
        material: body.material || null,
        unidadVenta: body.unidadVenta || 'Unidades',
      }
    });

    return NextResponse.json(producto);
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    return NextResponse.json(
      { error: 'Error al actualizar producto' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar un producto
export async function DELETE(
  request: Request,
  { params }: { params: { id: string; productoId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const userRol = (session.user as { rol?: string })?.rol;
    if (userRol !== 'admin') {
      return NextResponse.json({ error: 'No tiene permisos' }, { status: 403 });
    }

    // Verificar que el producto existe y pertenece al cliente
    const existingProducto = await prisma.productoCliente.findFirst({
      where: {
        id: params.productoId,
        clienteId: params.id
      }
    });

    if (!existingProducto) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      );
    }

    // Verificar si el producto está siendo usado en pedidos, producción, etc.
    const [pedidos, producciones, despachos, muestras, productosTerminados] = await Promise.all([
      prisma.pedido.count({ where: { productoClienteId: params.productoId } }),
      prisma.produccion.count({ where: { productoClienteId: params.productoId } }),
      prisma.despacho.count({ where: { productoClienteId: params.productoId } }),
      prisma.muestra.count({ where: { productoClienteId: params.productoId } }),
      prisma.productoTerminado.count({ where: { productoClienteId: params.productoId } })
    ]);

    const totalReferencias = pedidos + producciones + despachos + muestras + productosTerminados;

    if (totalReferencias > 0) {
      return NextResponse.json(
        { 
          error: 'No se puede eliminar el producto porque está siendo usado en otros registros',
          referencias: {
            pedidos,
            producciones,
            despachos,
            muestras,
            productosTerminados
          }
        },
        { status: 400 }
      );
    }

    // Eliminar producto
    await prisma.productoCliente.delete({
      where: { id: params.productoId }
    });

    return NextResponse.json({ message: 'Producto eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    return NextResponse.json(
      { error: 'Error al eliminar producto' },
      { status: 500 }
    );
  }
}
