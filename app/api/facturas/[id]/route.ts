import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { EstadoFactura } from '@prisma/client';
import { authOptions } from '@/lib/auth-options';
import { verifyActionPassword } from '@/lib/verify-action-password';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';



export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const factura = await prisma.factura.findUnique({
      where: { id: params.id },
      include: {
        cliente: true,
        detalles: true
      }
    });

    if (!factura) {
      return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 });
    }

    return NextResponse.json(factura);
  } catch (error) {
    console.error('Error al obtener factura:', error);
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
    const { estado, metodoPago, observaciones, fechaVencimiento } = body;

    const facturaActual = await prisma.factura.findUnique({ where: { id: params.id } });
    if (!facturaActual) {
      return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 });
    }

    // Validar transiciones de estado
    if (estado && facturaActual.estado === EstadoFactura.Anulada) {
      return NextResponse.json({ error: 'No se puede modificar una factura anulada' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    
    if (estado) {
      updateData.estado = estado;
      if (estado === EstadoFactura.Pagada) {
        updateData.pagadaAt = new Date();
      }
    }
    if (metodoPago !== undefined) updateData.metodoPago = metodoPago;
    if (observaciones !== undefined) updateData.observaciones = observaciones;
    if (fechaVencimiento !== undefined) updateData.fechaVencimiento = fechaVencimiento ? new Date(fechaVencimiento) : null;

    const factura = await prisma.factura.update({
      where: { id: params.id },
      data: updateData,
      include: {
        cliente: true,
        detalles: true
      }
    });

    return NextResponse.json(factura);
  } catch (error) {
    console.error('Error al actualizar factura:', error);
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

    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json({ error: 'Contraseña requerida' }, { status: 400 });
    }

    // Verificar contraseña de acción
    const userEmail = (session.user as { email?: string })?.email;
    if (!userEmail) {
      return NextResponse.json({ error: 'Email no encontrado' }, { status: 400 });
    }

    const verification = await verifyActionPassword(userEmail, password);
    if (!verification.valid) {
      return NextResponse.json({ error: verification.error || 'Contraseña incorrecta' }, { status: 401 });
    }

    // Buscar factura y sus detalles
    const factura = await prisma.factura.findUnique({
      where: { id: params.id },
      include: { detalles: true }
    });

    if (!factura) {
      return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 });
    }

    // Desmarcar despachos como facturados si tienen despachoId
    const despachoIds = factura.detalles
      .filter(d => d.despachoId)
      .map(d => d.despachoId as string);

    if (despachoIds.length > 0) {
      await prisma.despacho.updateMany({
        where: { id: { in: despachoIds } },
        data: { facturado: false }
      });
    }

    // Eliminar factura (los detalles se eliminan en cascada)
    await prisma.factura.delete({ where: { id: params.id } });

    return NextResponse.json({ message: 'Factura eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar factura:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
