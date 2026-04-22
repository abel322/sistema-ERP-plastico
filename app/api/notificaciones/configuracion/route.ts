import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth-options';


export const dynamic = 'force-dynamic';

// GET: Obtener configuración de notificaciones del usuario
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    let config = await prisma.configuracionNotificacion.findUnique({
      where: { usuarioId: (session?.user as any)?.id },
    });

    // Si no existe, crear configuración por defecto
    if (!config) {
      config = await prisma.configuracionNotificacion.create({
        data: {
          usuarioId: (session?.user as any)?.id,
        },
      });
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error al obtener configuración:', error);
    return NextResponse.json(
      { error: 'Error al obtener configuración' },
      { status: 500 }
    );
  }
}

// PUT: Actualizar configuración
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const data = await request.json();

    const config = await prisma.configuracionNotificacion.upsert({
      where: { usuarioId: (session?.user as any)?.id },
      update: {
        stockBajo: data.stockBajo,
        facturaVencida: data.facturaVencida,
        mantenimientoProgramado: data.mantenimientoProgramado,
        pedidoUrgente: data.pedidoUrgente,
        mejoraPendiente: data.mejoraPendiente,
        calidadNoConforme: data.calidadNoConforme,
        despachoEntregado: data.despachoEntregado,
        pushEnabled: data.pushEnabled,
      },
      create: {
        usuarioId: (session?.user as any)?.id,
        stockBajo: data.stockBajo ?? true,
        facturaVencida: data.facturaVencida ?? true,
        mantenimientoProgramado: data.mantenimientoProgramado ?? true,
        pedidoUrgente: data.pedidoUrgente ?? true,
        mejoraPendiente: data.mejoraPendiente ?? true,
        calidadNoConforme: data.calidadNoConforme ?? true,
        despachoEntregado: data.despachoEntregado ?? true,
        pushEnabled: data.pushEnabled ?? false,
      },
    });

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error al actualizar configuración:', error);
    return NextResponse.json(
      { error: 'Error al actualizar configuración' },
      { status: 500 }
    );
  }
}
