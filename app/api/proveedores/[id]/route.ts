import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth-options';


// GET: Obtener un proveedor
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const proveedor = await prisma.proveedor.findUnique({
      where: { id: params.id },
      include: {
        ordenesCompra: {
          orderBy: { fecha: 'desc' },
          take: 10,
        },
      },
    });

    if (!proveedor) {
      return NextResponse.json(
        { error: 'Proveedor no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(proveedor);
  } catch (error) {
    console.error('Error al obtener proveedor:', error);
    return NextResponse.json(
      { error: 'Error al obtener proveedor' },
      { status: 500 }
    );
  }
}

// PUT: Actualizar proveedor
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const existente = await prisma.proveedor.findUnique({
      where: { id: params.id },
    });

    if (!existente) {
      return NextResponse.json(
        { error: 'Proveedor no encontrado' },
        { status: 404 }
      );
    }

    const data = await request.json();

    // Si cambia el RIF, verificar que no exista
    if (data.rif && data.rif !== existente.rif) {
      const rifExistente = await prisma.proveedor.findUnique({
        where: { rif: data.rif },
      });
      if (rifExistente) {
        return NextResponse.json(
          { error: 'Ya existe un proveedor con ese RIF' },
          { status: 400 }
        );
      }
    }

    const proveedor = await prisma.proveedor.update({
      where: { id: params.id },
      data: {
        nombre: data.nombre,
        rif: data.rif,
        direccion: data.direccion,
        telefono: data.telefono,
        email: data.email,
        contacto: data.contacto,
        condicionesPago: data.condicionesPago,
        observaciones: data.observaciones,
        activo: data.activo,
      },
    });

    return NextResponse.json(proveedor);
  } catch (error) {
    console.error('Error al actualizar proveedor:', error);
    return NextResponse.json(
      { error: 'Error al actualizar proveedor' },
      { status: 500 }
    );
  }
}

// DELETE: Eliminar proveedor
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if ((session.user as { rol?: string }).rol !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const existente = await prisma.proveedor.findUnique({
      where: { id: params.id },
      include: { _count: { select: { ordenesCompra: true } } },
    });

    if (!existente) {
      return NextResponse.json(
        { error: 'Proveedor no encontrado' },
        { status: 404 }
      );
    }

    // No eliminar si tiene órdenes de compra
    if (existente._count.ordenesCompra > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar un proveedor con órdenes de compra. Desactívelo en su lugar.' },
        { status: 400 }
      );
    }

    await prisma.proveedor.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al eliminar proveedor:', error);
    return NextResponse.json(
      { error: 'Error al eliminar proveedor' },
      { status: 500 }
    );
  }
}
