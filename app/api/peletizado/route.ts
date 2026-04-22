import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { Turno, CategoriaInventario, TipoMovimiento } from '@prisma/client';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';



export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const maquinaId = searchParams.get('maquinaId');
    const fechaInicio = searchParams.get('fechaInicio');
    const fechaFin = searchParams.get('fechaFin');

    const where: any = {};

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
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

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
      // 1. Crear el registro de peletizado
      const pelet = await tx.peletizado.create({
        data: {
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

      // 2. Lógica de Inventario
      const tipo = tipoMaterial || 'GEN';
      const color = colorPelet || 'SD';
      const codigoInventario = `PEL-${tipo}-${color}`.toUpperCase().replace(/\s+/g, '-');
      const nombreInventario = `Peletizado ${tipo} ${color}`.trim();

      // Buscar si existe en inventario
      let invItem = await tx.inventario.findUnique({
        where: { codigo: codigoInventario }
      });

      if (!invItem) {
        invItem = await tx.inventario.create({
          data: {
            codigo: codigoInventario,
            nombre: nombreInventario,
            categoria: 'Peletizado' as any,
            unidad: 'Kg',
            cantidad: 0 // Se incrementará abajo
          }
        });
      }

      // 3. Registrar movimiento de entrada
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

      // 4. Actualizar stock
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
