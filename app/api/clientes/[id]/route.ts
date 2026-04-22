import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';


// GET - Obtener cliente por ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const cliente = await prisma.cliente.findUnique({
      where: { id: params.id },
      include: {
        pedidos: {
          orderBy: { fechaPedido: 'desc' },
          take: 5,
        },
      },
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

// PUT - Actualizar cliente (solo admin)
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

    // Si se está cambiando el RIF, verificar que no exista
    if (body.rif) {
      const existingCliente = await prisma.cliente.findFirst({
        where: {
          rif: body.rif,
          NOT: { id: params.id },
        },
      });

      if (existingCliente) {
        return NextResponse.json(
          { error: 'El RIF ya está registrado' },
          { status: 400 }
        );
      }
    }

    // Asegurar que conImpresion sea booleano si está presente
    const clienteData = {
      ...body,
      ...(body.conImpresion !== undefined && {
        conImpresion: body.conImpresion === true || body.conImpresion === 'true'
      })
    };

    const cliente = await prisma.cliente.update({
      where: { id: params.id },
      data: clienteData,
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

// DELETE - Eliminar cliente (solo admin)
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

    await prisma.cliente.delete({
      where: { id: params.id },
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
