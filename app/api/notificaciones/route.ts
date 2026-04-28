import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { TipoNotificacion } from '@prisma/client';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';



// GET: Listar notificaciones del usuario
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const leida = searchParams.get('leida');
    const tipo = searchParams.get('tipo') as TipoNotificacion | null;
    const soloNoLeidas = searchParams.get('soloNoLeidas') === 'true';

    const where: Record<string, unknown> = {
      usuarioId: (session?.user as any)?.id,
    };

    if (soloNoLeidas) {
      where.leida = false;
    } else if (leida !== null && leida !== '') {
      where.leida = leida === 'true';
    }

    if (tipo) {
      where.tipo = tipo;
    }

    const [notificaciones, total, noLeidas] = await Promise.all([
      prisma.notificacion.findMany({
        where,
        orderBy: { fecha: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.notificacion.count({ where }),
      prisma.notificacion.count({
        where: {
          usuarioId: (session?.user as any)?.id,
          leida: false,
        },
      }),
    ]);

    return NextResponse.json({
      notificaciones,
      total,
      noLeidas,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    return NextResponse.json(
      { error: 'Error al obtener notificaciones' },
      { status: 500 }
    );
  }
}

// POST: Crear una notificación (uso interno o admin)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const data = await request.json();
    const { usuarioId, tipo, titulo, mensaje, enlace } = data;

    // Solo admins pueden crear notificaciones para otros usuarios
    if (usuarioId && usuarioId !== (session?.user as any)?.id && (session?.user as any)?.rol !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const notificacion = await prisma.notificacion.create({
      data: {
        usuarioId: usuarioId || (session?.user as any)?.id,
        tipo: tipo || 'Sistema',
        titulo,
        mensaje,
        enlace,
      },
    });

    return NextResponse.json(notificacion, { status: 201 });
  } catch (error) {
    console.error('Error al crear notificación:', error);
    return NextResponse.json(
      { error: 'Error al crear notificación' },
      { status: 500 }
    );
  }
}

// PATCH: Marcar todas como leídas
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    await prisma.notificacion.updateMany({
      where: {
        usuarioId: (session?.user as any)?.id,
        leida: false,
      },
      data: {
        leida: true,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al marcar notificaciones:', error);
    return NextResponse.json(
      { error: 'Error al marcar notificaciones' },
      { status: 500 }
    );
  }
}
