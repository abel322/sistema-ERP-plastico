import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET - Obtener un cliente específico
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const includeProducts = searchParams.get('includeProducts') === 'true';

    const cliente = await prisma.cliente.findUnique({
      where: { id: params.id },
      include: includeProducts ? {
        productos: {
          where: { activo: true },
          orderBy: { createdAt: 'desc' }
        }
      } : undefined
    });

    if (!cliente) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(cliente);
  } catch (error) {
    console.error('Error al obtener cliente:', error);
    return NextResponse.json(
      { error: 'Error al obtener cliente' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar un cliente
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
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

    // Verificar si el RIF ya existe en otro cliente
    if (body.rif) {
      const existingCliente = await prisma.cliente.findFirst({
        where: {
          rif: body.rif,
          id: { not: params.id }
        }
      });

      if (existingCliente) {
        return NextResponse.json(
          { error: 'El RIF ya está registrado en otro cliente' },
          { status: 400 }
        );
      }
    }

    const cliente = await prisma.cliente.update({
      where: { id: params.id },
      data: {
        nombre: body.nombre,
        rif: body.rif,
        contacto: body.contacto || null,
        telefono: body.telefono || null,
        email: body.email || null,
        direccion: body.direccion || null,
        observaciones: body.observaciones || null,
      }
    });

    return NextResponse.json(cliente);
  } catch (error) {
    console.error('Error al actualizar cliente:', error);
    return NextResponse.json(
      { error: 'Error al actualizar cliente' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar un cliente
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
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

    // Verificar si el cliente tiene productos
    const productosCount = await prisma.productoCliente.count({
      where: { clienteId: params.id }
    });

    if (productosCount > 0) {
      return NextResponse.json(
        { error: `No se puede eliminar el cliente porque tiene ${productosCount} producto(s) registrado(s)` },
        { status: 400 }
      );
    }

    // Verificar si el cliente está siendo usado en otros registros
    const [pedidos, despachos, muestras, facturas, productosTerminados] = await Promise.all([
      prisma.pedido.count({ where: { clienteId: params.id } }),
      prisma.despacho.count({ where: { clienteId: params.id } }),
      prisma.muestra.count({ where: { clienteId: params.id } }),
      prisma.factura.count({ where: { clienteId: params.id } }),
      prisma.productoTerminado.count({ where: { clienteId: params.id } })
    ]);

    const totalReferencias = pedidos + despachos + muestras + facturas + productosTerminados;

    if (totalReferencias > 0) {
      return NextResponse.json(
        { 
          error: 'No se puede eliminar el cliente porque está siendo usado en otros registros',
          referencias: {
            pedidos,
            despachos,
            muestras,
            facturas,
            productosTerminados
          }
        },
        { status: 400 }
      );
    }

    await prisma.cliente.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Cliente eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar cliente:', error);
    return NextResponse.json(
      { error: 'Error al eliminar cliente' },
      { status: 500 }
    );
  }
}
