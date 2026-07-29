import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { Turno, TipoMovimiento } from '@prisma/client';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const maquinaId = searchParams.get('maquinaId');
    const fechaInicio = searchParams.get('fechaInicio');
    const fechaFin = searchParams.get('fechaFin');

    const where: any = { userId };

    if (maquinaId) {
      where.maquinaId = maquinaId;
    }
    if (fechaInicio || fechaFin) {
      where.fecha = {};
      if (fechaInicio) where.fecha.gte = new Date(fechaInicio);
      if (fechaFin) where.fecha.lte = new Date(fechaFin + 'T23:59:59');
    }

    const [registros, total] = await Promise.all([
      prisma.peletizado.findMany({
        where,
        include: {
          maquina: true,
        },
        orderBy: { fecha: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.peletizado.count({ where }),
    ]);

    return NextResponse.json({
      data: registros,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error al obtener registros' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const body = await request.json();
    const {
      fecha,
      turno,
      maquinaId,
      operario,
      materialEntrada,
      materialSalida,
      colorPelet,
      tipoMaterial,
      observaciones,
    } = body;

    if (!turno || !maquinaId || !operario || !materialEntrada || !materialSalida) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    const entrada = parseFloat(materialEntrada);
    const salida = parseFloat(materialSalida);
    const merma = entrada - salida;
    const parsedFecha = fecha ? new Date(fecha) : new Date();

    const registro = await prisma.$transaction(async (tx) => {
      const pelet = await tx.peletizado.create({
        data: {
          userId,
          fecha: parsedFecha,
          turno: turno as Turno,
          maquinaId,
          operario,
          materialEntrada: entrada,
          materialSalida: salida,
          merma: merma > 0 ? merma : 0,
          colorPelet,
          tipoMaterial,
          observaciones,
        },
        include: {
          maquina: true,
        },
      });

      const tipo = tipoMaterial || 'GEN';
      const color = colorPelet || 'SD';
      const codigoInventario = `PEL-${tipo}-${color}`.toUpperCase().replace(/\s+/g, '-');
      const nombreInventario = `Peletizado ${tipo} ${color}`.trim();

      let invItem = await tx.inventario.findFirst({
        where: { userId, codigo: codigoInventario }
      });

      if (!invItem) {
        invItem = await tx.inventario.create({
          data: {
            userId,
            codigo: codigoInventario,
            nombre: nombreInventario,
            categoria: 'Peletizado' as any,
            unidad: 'Kg',
            cantidad: 0
          }
        });
      }

      await tx.movimientoInventario.create({
        data: {
          inventarioId: invItem.id,
          tipo: TipoMovimiento.Entrada,
          cantidad: salida,
          motivo: 'Producción de Peletizado',
          responsable: operario,
          referencia: `PELET-${pelet.id.substring(0, 8)}`,
          fecha: parsedFecha
        }
      });

      await tx.inventario.update({
        where: { id: invItem.id },
        data: {
          cantidad: { increment: salida }
        }
      });

      return pelet;
    });

    return NextResponse.json(registro, { status: 201 });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error al crear registro' }, { status: 500 });
  }
}
