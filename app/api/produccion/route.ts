import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { AreaProduccion, EstadoPedido } from '@prisma/client';
import { authOptions } from '@/lib/auth-options';
import { generarCodigoLoteUnico } from '@/lib/utils/lote';

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
    const area = searchParams.get('area') as AreaProduccion | null;
    const estado = searchParams.get('estado');
    const fechaInicio = searchParams.get('fechaInicio');
    const fechaFin = searchParams.get('fechaFin');
    const maquinaId = searchParams.get('maquinaId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const where: any = { userId };
    if (area) where.area = area;
    if (estado) where.estado = estado;
    if (maquinaId) where.maquinaId = maquinaId;
    if (fechaInicio || fechaFin) {
      where.fecha = {};
      if (fechaInicio) where.fecha.gte = new Date(fechaInicio);
      if (fechaFin) where.fecha.lte = new Date(fechaFin + 'T23:59:59');
    }

    const userFilter = userId ? { OR: [{ userId }, { userId: null }] } : {};

    const [producciones, total] = await Promise.all([
      prisma.produccion.findMany({
        where,
        include: {
          maquina: true,
          pedido: {
            include: { cliente: true, productoCliente: true },
          },
          productoCliente: true,
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

    const produccionesConStockPrevio = await Promise.all(
      producciones.map(async (prod) => {
        if (prod.area !== 'Extrusion') {
          let previo = null;

          // 1. Trazabilidad exacta madre-hija: Si la orden tiene loteOrigen, buscar directamente por código de lote
          if (prod.loteOrigen) {
            previo = await prisma.productoTerminado.findFirst({
              where: {
                ...userFilter,
                codigoLote: prod.loteOrigen,
                cantidadDisponible: { gt: 0 },
              },
            });

            // Si el stock está en 0, igualmente vincularlo para mostrar la trazabilidad exacta
            if (!previo) {
              previo = await prisma.productoTerminado.findFirst({
                where: {
                  ...userFilter,
                  codigoLote: prod.loteOrigen,
                },
              });
            }
          }

          // 2. Fallback heurístico para órdenes legacy que no posean loteOrigen
          if (!previo && !prod.loteOrigen) {
            const productoClienteId = prod.productoClienteId || prod.pedido?.productoClienteId;
            const clienteId = prod.pedido?.clienteId || prod.pedido?.cliente?.id;

            // 2a. Si la orden tiene pedidoId, buscar stock disponible de ese pedido
            if (prod.pedidoId) {
            // 1a. Prioridad: ProductoTerminado del mismo pedido asignado a esta siguienteArea
            previo = await prisma.productoTerminado.findFirst({
              where: {
                ...userFilter,
                pedidoId: prod.pedidoId,
                siguienteArea: prod.area as any,
                cantidadDisponible: { gt: 0 },
                produccionId: { not: prod.id },
              },
              orderBy: [
                { fechaFinalizacion: 'desc' },
                { createdAt: 'desc' },
              ],
            });

            // 1b. Fallback: cualquier ProductoTerminado del mismo pedido proveniente de un área previa
            if (!previo) {
              previo = await prisma.productoTerminado.findFirst({
                where: {
                  ...userFilter,
                  pedidoId: prod.pedidoId,
                  areaOrigen: { not: prod.area },
                  cantidadDisponible: { gt: 0 },
                  produccionId: { not: prod.id },
                },
                orderBy: [
                  { fechaFinalizacion: 'desc' },
                  { createdAt: 'desc' },
                ],
              });
            }
          }

          // 2. Si no se encontró por pedidoId (o la orden no tiene pedidoId), buscar por productoClienteId
          if (!previo && productoClienteId) {
            // 2a. Específico para esta siguienteArea
            previo = await prisma.productoTerminado.findFirst({
              where: {
                ...userFilter,
                productoClienteId,
                siguienteArea: prod.area as any,
                cantidadDisponible: { gt: 0 },
                produccionId: { not: prod.id },
              },
              orderBy: [
                { fechaFinalizacion: 'desc' },
                { createdAt: 'desc' },
              ],
            });

            // 2b. De cualquier área previa
            if (!previo) {
              previo = await prisma.productoTerminado.findFirst({
                where: {
                  ...userFilter,
                  productoClienteId,
                  areaOrigen: { not: prod.area },
                  cantidadDisponible: { gt: 0 },
                  produccionId: { not: prod.id },
                },
                orderBy: [
                  { fechaFinalizacion: 'desc' },
                  { createdAt: 'desc' },
                ],
              });
            }
          }

          // 3. Si no se encontró por producto, buscar por clienteId destinado a esta área
          if (!previo && clienteId) {
            previo = await prisma.productoTerminado.findFirst({
              where: {
                ...userFilter,
                clienteId,
                siguienteArea: prod.area as any,
                cantidadDisponible: { gt: 0 },
                produccionId: { not: prod.id },
              },
              orderBy: [
                { fechaFinalizacion: 'desc' },
                { createdAt: 'desc' },
              ],
            });
          }

          // 4. Para órdenes libres / internas sin pedido específico:
          if (!previo && !prod.pedidoId) {
            // 4a. Buscar stock pendiente para esta área
            previo = await prisma.productoTerminado.findFirst({
              where: {
                ...userFilter,
                siguienteArea: prod.area as any,
                cantidadDisponible: { gt: 0 },
                produccionId: { not: prod.id },
              },
              orderBy: [
                { fechaFinalizacion: 'desc' },
                { createdAt: 'desc' },
              ],
            });

            // 4b. Fallback: stock disponible de área previa (en Serigrafía, viene de Extrusión)
            if (!previo) {
              const areaOrigenFallback = prod.area === 'Serigrafia' ? 'Extrusion' : { not: prod.area };
              previo = await prisma.productoTerminado.findFirst({
                where: {
                  ...userFilter,
                  areaOrigen: areaOrigenFallback as any,
                  cantidadDisponible: { gt: 0 },
                  produccionId: { not: prod.id },
                },
                orderBy: [
                  { fechaFinalizacion: 'desc' },
                  { createdAt: 'desc' },
                ],
              });
            }
          }
        }

        if (previo) {
          return {
            ...prod,
            stockPrevio: {
              id: previo.id,
              codigoLote: previo.codigoLote,
              lote: previo.codigoLote,
              cantidad: previo.cantidadDisponible,
              unidad: previo.unidad,
              area: previo.areaOrigen,
              tipoProducto: previo.tipoProducto,
              conImpresion: previo.conImpresion,
            },
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
    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const body = await request.json();
    const {
      fecha,
      turno = 'Manana',
      area,
      maquinaId,
      operario = 'Por asignar',
      pedidoId,
      productoClienteId,
      cantidadProducida = 0,
      unidad = 'Kilogramos',
      merma = 0,
      horaInicio,
      horaFin,
      observaciones,
      codigoLote,
      loteOrigen,
    } = body;

    if (!area || !maquinaId) {
      return NextResponse.json({ error: 'Campos requeridos faltantes (área y máquina)' }, { status: 400 });
    }

    let finalProductoClienteId = productoClienteId || null;
    if (!finalProductoClienteId && pedidoId) {
      const pedidoRef = await prisma.pedido.findUnique({
        where: { id: pedidoId },
        select: { productoClienteId: true },
      });
      if (pedidoRef) {
        finalProductoClienteId = pedidoRef.productoClienteId;
      }
    }

    // Generar código de lote único (ej. EXT-YYYYMMDD-XXXX) si no fue provisto
    const finalCodigoLote = (codigoLote && typeof codigoLote === 'string' && codigoLote.trim() !== '')
      ? codigoLote.trim()
      : await generarCodigoLoteUnico(prisma, area, fecha);

    const produccion = await prisma.produccion.create({
      data: {
        userId,
        codigoLote: finalCodigoLote,
        loteOrigen: (loteOrigen && typeof loteOrigen === 'string' && loteOrigen.trim() !== '') ? loteOrigen.trim() : null,
        fecha: fecha ? new Date(fecha) : new Date(),
        turno,
        area,
        maquinaId,
        operario,
        pedidoId: pedidoId || null,
        productoClienteId: finalProductoClienteId,
        cantidadProducida: parseFloat(cantidadProducida.toString()),
        unidad,
        merma: merma ? parseFloat(merma.toString()) : 0,
        horaInicio,
        horaFin,
        observaciones,
      },
      include: {
        maquina: true,
        pedido: { include: { cliente: true, productoCliente: true } },
        productoCliente: true,
      },
    });

    if (pedidoId) {
      const pedido = await prisma.pedido.findFirst({ where: { id: pedidoId, userId } });
      if (pedido) {
        const nuevaCantidad = pedido.cantidadProducida + parseFloat(cantidadProducida.toString());
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
