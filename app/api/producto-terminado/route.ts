import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { EstadoProductoTerminado, SiguienteArea, AreaProduccion, TipoProducto } from '@prisma/client';
import { determinarDestinoProducto } from '@/lib/producto-terminado-logic';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const estado = searchParams.get('estado') as EstadoProductoTerminado | null;
    const siguienteArea = searchParams.get('siguienteArea') as SiguienteArea | null;
    const areaOrigen = searchParams.get('areaOrigen') as AreaProduccion | null;
    const clienteId = searchParams.get('clienteId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      cantidadDisponible: { gt: 0 }
    };

    if (estado) where.estado = estado;
    if (siguienteArea) where.siguienteArea = siguienteArea;
    if (areaOrigen) where.areaOrigen = areaOrigen;
    if (clienteId) where.clienteId = clienteId;

    const [productos, total] = await Promise.all([
      prisma.productoTerminado.findMany({
        where,
        include: {
          cliente: {
            select: {
              id: true,
              nombre: true,
              rif: true,
              tipoProducto: true,
              conImpresion: true
            }
          },
          produccion: {
            select: {
              id: true,
              fecha: true,
              turno: true,
              operario: true,
              maquina: {
                select: {
                  id: true,
                  nombre: true
                }
              }
            }
          }
        },
        orderBy: { fechaFinalizacion: 'desc' },
        skip,
        take: limit
      }),
      prisma.productoTerminado.count({ where })
    ]);

    // Agrupar por estado para las secciones
    const listosDespacho = await prisma.productoTerminado.count({
      where: { estado: 'ListoDespacho', cantidadDisponible: { gt: 0 } }
    });

    const pendientesArea = await prisma.productoTerminado.count({
      where: { estado: 'PendienteArea', cantidadDisponible: { gt: 0 } }
    });

    // Agrupar pendientes por siguiente área
    const pendientesPorArea = await prisma.productoTerminado.groupBy({
      by: ['siguienteArea'],
      where: { estado: 'PendienteArea', cantidadDisponible: { gt: 0 } },
      _count: { id: true }
    });

    return NextResponse.json({
      productos,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      },
      resumen: {
        listosDespacho,
        pendientesArea,
        pendientesPorArea: pendientesPorArea.reduce((acc, item) => {
          acc[item.siguienteArea] = item._count.id;
          return acc;
        }, {} as Record<string, number>)
      }
    });
  } catch (error) {
    console.error('Error al obtener productos terminados:', error);
    return NextResponse.json(
      { error: 'Error al obtener productos terminados' },
      { status: 500 }
    );
  }
}

// POST: Crear manualmente un producto terminado (sin producción asociada o manual)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const {
      produccionId,
      clienteId,
      areaOrigen,
      descripcion,
      cantidadTotal,
      unidad,
      tipoProducto,
      conImpresion,
      pedidoId,
      // Manual state overrides
      estado,
      siguienteArea
    } = body;

    // produccionId is now optional for manual entry
    if (!clienteId || !areaOrigen || !cantidadTotal || !unidad || !tipoProducto) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    if (produccionId) {
      // Verificar que la producción existe y no tiene ya un producto terminado
      const produccionExistente = await prisma.produccion.findUnique({
        where: { id: produccionId },
        include: { productoTerminado: true }
      });

      if (!produccionExistente) {
        return NextResponse.json(
          { error: 'Producción no encontrada' },
          { status: 404 }
        );
      }

      if (produccionExistente.productoTerminado) {
        return NextResponse.json(
          { error: 'Esta producción ya tiene un producto terminado asociado' },
          { status: 400 }
        );
      }
    }

    // Determinar destino del producto si no viene especificado manualmente
    const destino = (estado && siguienteArea)
      ? { estado, siguienteArea, descripcionDestino: `Ingresado desde ${areaOrigen} para ${estado === 'ListoDespacho' ? 'Despacho' : siguienteArea}` }
      : determinarDestinoProducto(
        areaOrigen as AreaProduccion,
        tipoProducto as TipoProducto,
        conImpresion || false
      );

    const productoTerminado = await prisma.productoTerminado.create({
      data: {
        produccionId,
        pedidoId,
        clienteId,
        areaOrigen: areaOrigen as AreaProduccion,
        descripcion: descripcion || destino.descripcionDestino,
        cantidadTotal,
        cantidadDisponible: cantidadTotal,
        unidad,
        tipoProducto: tipoProducto as TipoProducto,
        conImpresion: conImpresion || false,
        estado: destino.estado,
        siguienteArea: destino.siguienteArea,
        fechaFinalizacion: new Date()
      },
      include: {
        cliente: true,
        produccion: {
          include: {
            maquina: true
          }
        }
      }
    });

    return NextResponse.json(productoTerminado, { status: 201 });
  } catch (error) {
    console.error('Error al crear producto terminado:', error);
    return NextResponse.json(
      { error: 'Error al crear producto terminado' },
      { status: 500 }
    );
  }
}
