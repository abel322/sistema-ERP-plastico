import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET - Obtener todos los productos de un cliente
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const clienteId = params.id;

    const productos = await prisma.productoCliente.findMany({
      where: { clienteId },
      orderBy: [
        { activo: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json(productos);
  } catch (error) {
    console.error('Error al obtener productos:', error);
    return NextResponse.json(
      { error: 'Error al obtener productos' },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo producto para un cliente
export async function POST(
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

    const clienteId = params.id;
    const body = await request.json();

    // Verificar que el cliente existe
    const cliente = await prisma.cliente.findUnique({
      where: { id: clienteId }
    });

    if (!cliente) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    // Crear producto
    const producto = await prisma.productoCliente.create({
      data: {
        clienteId,
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

    return NextResponse.json(producto, { status: 201 });
  } catch (error) {
    console.error('Error al crear producto:', error);
    return NextResponse.json(
      { error: 'Error al crear producto' },
      { status: 500 }
    );
  }
}
