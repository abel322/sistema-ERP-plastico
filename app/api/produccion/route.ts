import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { AreaProduccion, EstadoPedido } from '@prisma/client';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';


export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const area = searchParams.get('area') as AreaProduccion | null;
    const estado = searchParams.get('estado');
    const fechaInicio = searchParams.get('fechaInicio');
    const fechaFin = searchParams.get('fechaFin');
    const maquinaId = searchParams.get('maquinaId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const where: any = {};
    if (area) where.area = area;
    if (estado) where.estado = estado;
    if (maquinaId) where.maquinaId = maquinaId;
    if (fechaInicio || fechaFin) {
      where.fecha = {};
      if (fechaInicio) where.fecha.gte = new Date(fechaInicio);
      if (fechaFin) where.fecha.lte = new Date(fechaFin + 'T23:59:59');
    }

    const [producciones, total] = await Promise.all([
      prisma.produccion.findMany({
        where,
        include: {
          maquina: true,
          pedido: {
            include: { cliente: true },
          },
          registros: {
            orderBy: { fecha: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.produccion.count({ where }),
    ]);

    // Attach stock previo
    const produccionesConStockPrevio = await Promise.all(
      producciones.map(async (prod) => {
        if (prod.pedidoId && prod.area !== 'Extrusion') {
          // Buscamos el stock anterior (de un área distinta) asociado al pedido
          const previo = await prisma.productoTerminado.findFirst({
            where: {
              pedidoId: prod.pedidoId,
              produccionId: { not: prod.id },
              areaOrigen: { not: prod.area },
            },
            orderBy: [
              { cantidadDisponible: 'desc' },
              { fechaFinalizacion: 'asc' }
            ],
          });

          if (previo) {
            return {
              ...prod,
              stockPrevio: {
                cantidad: previo.cantidadDisponible,
                unidad: previo.unidad,
                area: previo.areaOrigen,
                tipoProducto: previo.tipoProducto,
                conImpresion: previo.conImpresion,
              }
            };
          }
        }
        return { ...prod, stockPrevio: null };
      })
    );

    return NextResponse.json({
      data: produccionesConStockPrevio,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error al obtener producción:', error);
    return NextResponse.json({ error: 'Error al obtener producción' }, { status: 500 });
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
      turno = 'Manana',
      area,
      maquinaId,
      operario = 'Por asignar',
      pedidoId,
      cantidadProducida = 0,
      unidad = 'Kilogramos',
      merma = 0,
      horaInicio,
      horaFin,
      observaciones,
    } = body;

    if (!area || !maquinaId) {
      return NextResponse.json({ error: 'Campos requeridos faltantes (área y máquina)' }, { status: 400 });
    }

    // Crear registro de producción
    const produccion = await prisma.produccion.create({
      data: {
        fecha: fecha ? new Date(fecha) : new Date(),
        turno,
        area,
        maquinaId,
        operario,
        pedidoId: pedidoId || null,
        cantidadProducida: parseFloat(cantidadProducida),
        unidad,
        merma: merma ? parseFloat(merma) : 0,
        horaInicio,
        horaFin,
        observaciones,
      },
      include: {
        maquina: true,
        pedido: { include: { cliente: true } },
      },
    });

    // Si está asociado a un pedido, actualizar cantidad producida
    if (pedidoId) {
      const pedido = await prisma.pedido.findUnique({ where: { id: pedidoId } });
      if (pedido) {
        const nuevaCantidad = pedido.cantidadProducida + parseFloat(cantidadProducida);
        let nuevoEstado = pedido.estado;

        if (pedido.estado === EstadoPedido.Pendiente) {
          nuevoEstado = EstadoPedido.EnProceso;
        }
        if (nuevaCantidad >= pedido.cantidadSolicitada) {
          nuevoEstado = EstadoPedido.Completado;
        }

        await prisma.pedido.update({
          where: { id: pedidoId },
          data: {
            cantidadProducida: nuevaCantidad,
            estado: nuevoEstado,
          },
        });
      }
    }

    return NextResponse.json(produccion, { status: 201 });
  } catch (error) {
    console.error('Error al crear producción:', error);
    return NextResponse.json({ error: 'Error al crear producción' }, { status: 500 });
  }
}
