import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth-options';
import { determinarDestinoProducto } from '@/lib/producto-terminado-logic';
import { calcularDesgloseMerma, aplicarMermaAInventario } from '@/lib/merma-logic';
import { resolverConsumoExtrusion, aplicarConsumoExtrusion } from '@/lib/consumo-extrusion-logic';
import { parseLocalDateToMiddayUTC } from '@/lib/utils/dates';
import { calcularConsumoBobinaSellado, validarDisponibilidadBobina } from '@/lib/consumo-sellado-logic';

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

    const { id } = params;

    const registros = await prisma.registroProduccion.findMany({
      where: { produccionId: id },
      orderBy: { fecha: 'desc' },
    });

    // Calcular total de cantidad y 5 clasificaciones de mermas
    const totalCantidad = registros.reduce((sum, r) => sum + r.cantidad, 0);
    const totalMerma = registros.reduce((sum, r) => sum + (r.merma || 0), 0);
    const totalMermaTransparenteAlta = registros.reduce((sum, r) => sum + ((r as any).mermaTransparenteAlta || (r as any).mermaCristal || r.mermaSinImpresion || 0), 0);
    const totalMermaBlancoPollo = registros.reduce((sum, r) => sum + ((r as any).mermaBlancoPollo || 0), 0);
    const totalMermaColor = registros.reduce((sum, r) => sum + ((r as any).mermaColor || r.mermaImpreso || 0), 0);
    const totalMermaTransparenteBaja = registros.reduce((sum, r) => sum + ((r as any).mermaTransparenteBaja || 0), 0);
    const totalMermaBlancoPego = registros.reduce((sum, r) => sum + ((r as any).mermaBlancoPego || 0), 0);
    const totalMermaCristal = totalMermaTransparenteAlta;

    return NextResponse.json({
      registros,
      totalCantidad,
      totalMerma,
      totalMermaTransparenteAlta,
      totalMermaBlancoPollo,
      totalMermaColor,
      totalMermaTransparenteBaja,
      totalMermaBlancoPego,
      totalMermaCristal,
    });
  } catch (error) {
    console.error('Error al obtener registros:', error);
    return NextResponse.json({ error: 'Error al obtener registros' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const {
      turno,
      fecha,
      operario,
      cantidad,
      reporte,
    } = body;

    if (!turno || !operario || cantidad === undefined) {
      return NextResponse.json({ error: 'Campos requeridos faltantes' }, { status: 400 });
    }

    // Verificar que la producción existe
    const produccion = await prisma.produccion.findUnique({
      where: { id },
      include: {
        pedido: {
          include: {
            cliente: true,
            productoCliente: { include: { peletizado: true, resinaMolido: true } },
          },
        },
        productoCliente: { include: { peletizado: true, resinaMolido: true } },
        productoTerminado: true,
      },
    });

    if (!produccion) {
      return NextResponse.json({ error: 'Producción no encontrada' }, { status: 404 });
    }

    // 1. Obtener formulación / productoCliente
    const prodCli = produccion.pedido?.productoCliente || produccion.productoCliente;
    const clienteId =
      produccion.pedido?.clienteId ||
      produccion.pedido?.cliente?.id ||
      produccion.productoCliente?.clienteId;

    // Desglose de merma tipificado en 5 variantes (MOLIDO 1 a MOLIDO 5)
    const desglose = calcularDesgloseMerma(body);
    const finalMerma = desglose.mermaTotal || 0;
    const cantidadTurno = parseFloat(cantidad.toString()) || 0;

    // 2. Si es Sellado (o área subsiguiente), buscar stock previo de bobina y validar disponibilidad
    let previo: any = null;
    let consumoBobinaSellado: any = null;

    if (produccion.area === 'Sellado') {
      consumoBobinaSellado = calcularConsumoBobinaSellado({
        cantidadBolsas: cantidadTurno,
        mermaTotal: finalMerma,
        productoCliente: prodCli,
      });

      if (produccion.loteOrigen) {
        previo = await prisma.productoTerminado.findFirst({
          where: { codigoLote: produccion.loteOrigen },
        });
      }

      if (!previo && produccion.pedidoId) {
        previo = await prisma.productoTerminado.findFirst({
          where: {
            pedidoId: produccion.pedidoId,
            areaOrigen: { in: ['Extrusion', 'Serigrafia', 'Refilado'] as any },
            cantidadDisponible: { gt: 0 },
            produccionId: { not: produccion.id },
          },
          orderBy: { fechaFinalizacion: 'asc' },
        });
      }

      // Validación con margen de tolerancia del 5%
      if (previo && consumoBobinaSellado.kgTotalConsumido > 0) {
        const validacion = validarDisponibilidadBobina({
          kgRequerido: consumoBobinaSellado.kgTotalConsumido,
          kgDisponible: previo.cantidadDisponible || 0,
          margenTolerancia: 0.05,
        });

        if (!validacion.valido) {
          return NextResponse.json({ error: validacion.error }, { status: 400 });
        }
      }
    } else if (produccion.area !== 'Extrusion') {
      // Para Serigrafía o Refilado (consumo directo en Kg)
      if (produccion.loteOrigen) {
        previo = await prisma.productoTerminado.findFirst({
          where: { codigoLote: produccion.loteOrigen },
        });
      }
      if (!previo && produccion.pedidoId) {
        previo = await prisma.productoTerminado.findFirst({
          where: {
            pedidoId: produccion.pedidoId,
            areaOrigen: { not: produccion.area },
            cantidadDisponible: { gt: 0 },
            produccionId: { not: produccion.id },
          },
          orderBy: { fechaFinalizacion: 'asc' },
        });
      }

      const kgRequerido = cantidadTurno + finalMerma;
      if (previo && kgRequerido > 0) {
        const validacion = validarDisponibilidadBobina({
          kgRequerido,
          kgDisponible: previo.cantidadDisponible || 0,
          margenTolerancia: 0.05,
        });
        if (!validacion.valido) {
          return NextResponse.json({ error: validacion.error }, { status: 400 });
        }
      }
    }

    let totalCantidad = 0;

    const registro = await prisma.$transaction(async (tx) => {
      // Construir nota de reporte con detalle de consumo para trazabilidad
      let reporteConConsumo = reporte || '';
      if (produccion.area === 'Sellado' && consumoBobinaSellado && consumoBobinaSellado.kgTotalConsumido > 0) {
        const detalleConsumo = `[Consumo Bobina: ${consumoBobinaSellado.kgTotalConsumido.toFixed(2)} kg (${consumoBobinaSellado.kgBolsas.toFixed(2)} kg bolsas + ${consumoBobinaSellado.kgMerma.toFixed(2)} kg merma)]`;
        reporteConConsumo = reporteConConsumo ? `${reporteConConsumo} | ${detalleConsumo}` : detalleConsumo;
      }

      // 1. Crear registro de turno
      const reg = await tx.registroProduccion.create({
        data: {
          produccionId: id,
          turno,
          fecha: parseLocalDateToMiddayUTC(fecha),
          operario,
          cantidad: cantidadTurno,
          reporte: reporteConConsumo || null,
          merma: desglose.mermaTotal,
          mermaTransparenteAlta: desglose.mermaTransparenteAlta,
          mermaBlancoPollo: desglose.mermaBlancoPollo,
          mermaColor: desglose.mermaColor,
          mermaTransparenteBaja: desglose.mermaTransparenteBaja,
          mermaBlancoPego: desglose.mermaBlancoPego,
          mermaCristal: desglose.mermaTransparenteAlta,
          mermaSinImpresion: desglose.mermaTransparenteAlta,
          mermaImpreso: desglose.mermaColor,
          mermaInventarioSumada: true,
        },
      });

      // 2. Actualizar cantidad total y mermas acumuladas en la producción
      const todosRegistros = await tx.registroProduccion.findMany({
        where: { produccionId: id },
      });
      totalCantidad = todosRegistros.reduce((sum, r) => sum + r.cantidad, 0);
      const totalMerma = todosRegistros.reduce((sum, r) => sum + (r.merma || 0), 0);
      const totalMermaAlta = todosRegistros.reduce((sum, r) => sum + ((r as any).mermaTransparenteAlta || (r as any).mermaCristal || r.mermaSinImpresion || 0), 0);
      const totalMermaPollo = todosRegistros.reduce((sum, r) => sum + ((r as any).mermaBlancoPollo || 0), 0);
      const totalMermaColor = todosRegistros.reduce((sum, r) => sum + ((r as any).mermaColor || r.mermaImpreso || 0), 0);
      const totalMermaBaja = todosRegistros.reduce((sum, r) => sum + ((r as any).mermaTransparenteBaja || 0), 0);
      const totalMermaPego = todosRegistros.reduce((sum, r) => sum + ((r as any).mermaBlancoPego || 0), 0);

      await tx.produccion.update({
        where: { id },
        data: {
          cantidadProducida: totalCantidad,
          merma: totalMerma,
          mermaTransparenteAlta: totalMermaAlta,
          mermaBlancoPollo: totalMermaPollo,
          mermaColor: totalMermaColor,
          mermaTransparenteBaja: totalMermaBaja,
          mermaBlancoPego: totalMermaPego,
          mermaCristal: totalMermaAlta,
        },
      });

      // 3. Sumar automáticamente los kilos de merma al stock del ítem de PELETIZADO correspondiente
      await aplicarMermaAInventario(tx, desglose, {
        area: produccion.area,
        ordenId: produccion.id,
        codigoLote: produccion.codigoLote,
        responsable: operario,
      });

      // 4. Descuento Automático en Inventario para Extrusión por Turno
      if (produccion.area === 'Extrusion') {
        if (cantidadTurno > 0) {
          const formulacionProd = prodCli;
          const consumoCalculado = await resolverConsumoExtrusion(tx, formulacionProd, cantidadTurno);
          if (consumoCalculado) {
            await aplicarConsumoExtrusion(tx, {
              consumo: consumoCalculado,
              loteCodigo: produccion.codigoLote || produccion.id.slice(0, 8).toUpperCase(),
              turno: turno,
              responsable: operario,
            });
          }
        }
      }

      // 5. Descuento Dinámico de Bobina en Piso (WIP) para Sellado u otras fases subsiguientes
      if (previo) {
        let kgADescontar = 0;
        if (produccion.area === 'Sellado' && consumoBobinaSellado) {
          kgADescontar = consumoBobinaSellado.kgTotalConsumido;
        } else {
          kgADescontar = cantidadTurno + finalMerma;
        }

        if (kgADescontar > 0) {
          await tx.productoTerminado.update({
            where: { id: previo.id },
            data: {
              cantidadDisponible: Math.max(0, (previo.cantidadDisponible || 0) - kgADescontar),
            },
          });
        }
      }

      return reg;
    });

    // Actualizar o crear ProductoTerminado de esta orden dinámicamente ("En proceso")
    if (clienteId) {
      const tipoProducto = (prodCli?.tipoProducto || (produccion.unidad === 'Kilogramos' ? 'Bobina' : 'Bolsa')) as 'Bolsa' | 'Bobina';
      const conImpresion = prodCli?.conImpresion || false;
      const destinoTemp = determinarDestinoProducto(produccion.area, tipoProducto, conImpresion);

      if (produccion.productoTerminado) {
        // En Extrusión, incrementamos cantidadDisponible con los nuevos kilos producidos en el turno
        const dataUpdate: any = {
          userId: (session.user as any)?.id || produccion.userId,
          codigoLote: produccion.codigoLote,
          loteOrigen: produccion.loteOrigen,
          cantidadTotal: totalCantidad,
        };

        if (produccion.area === 'Extrusion') {
          dataUpdate.cantidadDisponible = {
            increment: cantidadTurno,
          };
        } else {
          dataUpdate.cantidadDisponible = totalCantidad;
        }

        await prisma.productoTerminado.update({
          where: { id: produccion.productoTerminado.id },
          data: dataUpdate,
        });
      } else {
        // Crear la tarjeta inicial en proceso
        await prisma.productoTerminado.create({
          data: {
            userId: (session.user as any)?.id || produccion.userId,
            codigoLote: produccion.codigoLote,
            loteOrigen: produccion.loteOrigen,
            produccionId: id,
            pedidoId: produccion.pedidoId,
            clienteId: clienteId,
            productoClienteId: prodCli?.id || produccion.productoClienteId || null,
            areaOrigen: produccion.area,
            descripcion: `(En Proceso) Producción de ${produccion.area}`,
            cantidadTotal: totalCantidad,
            cantidadDisponible: totalCantidad,
            unidad: produccion.unidad,
            tipoProducto: tipoProducto,
            conImpresion: conImpresion,
            estado: 'PendienteArea',
            siguienteArea: destinoTemp.siguienteArea,
            fechaFinalizacion: new Date(),
          },
        });
      }
    }

    revalidatePath('/produccion');
    revalidatePath('/inventario');
    revalidatePath('/inventario/movimientos');
    revalidatePath('/produccion/historial');

    return NextResponse.json(
      {
        success: true,
        message: 'Turno registrado correctamente',
        data: registro,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error al crear registro:', error);
    return NextResponse.json({ error: 'Error al crear registro' }, { status: 500 });
  }
}
