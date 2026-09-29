import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth-options';
import { determinarDestinoProducto } from '@/lib/producto-terminado-logic';
import { calcularDesgloseMerma, aplicarMermaAInventario } from '@/lib/merma-logic';

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
            productoCliente: { include: { peletizado: true } },
          },
        },
        productoCliente: { include: { peletizado: true } },
        productoTerminado: true,
      },
    });

    if (!produccion) {
      return NextResponse.json({ error: 'Producción no encontrada' }, { status: 404 });
    }

    // Desglose de merma tipificado en 5 variantes (MOLIDO 1 a MOLIDO 5)
    const desglose = calcularDesgloseMerma(body);
    const finalMerma = desglose.mermaTotal || 0;
    let totalCantidad = 0;

    const registro = await prisma.$transaction(async (tx) => {
      // 1. Crear registro de turno
      const reg = await tx.registroProduccion.create({
        data: {
          produccionId: id,
          turno,
          fecha: fecha ? new Date(fecha) : new Date(),
          operario,
          cantidad: parseFloat(cantidad.toString()),
          reporte: reporte || null,
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

      return reg;
    });

    // Actualizar o crear ProductoTerminado dinámicamente ("En proceso")
    const prodCli = produccion.pedido?.productoCliente || produccion.productoCliente;
    const clienteId =
      produccion.pedido?.clienteId ||
      produccion.pedido?.cliente?.id ||
      produccion.productoCliente?.clienteId;

    if (clienteId) {
      const tipoProducto = (prodCli?.tipoProducto || (produccion.unidad === 'Kilogramos' ? 'Bobina' : 'Bolsa')) as 'Bolsa' | 'Bobina';
      const conImpresion = prodCli?.conImpresion || false;

      const destinoTemp = determinarDestinoProducto(produccion.area, tipoProducto, conImpresion);

      if (produccion.productoTerminado) {
        // Actualizar la cantidad en la tarjeta existente
        await prisma.productoTerminado.update({
          where: { id: produccion.productoTerminado.id },
          data: {
            userId: (session.user as any)?.id || produccion.userId,
            codigoLote: produccion.codigoLote,
            loteOrigen: produccion.loteOrigen,
            cantidadTotal: totalCantidad,
            cantidadDisponible: totalCantidad,
          },
        });
      } else {
        // Crear la tarjeta temporal que indica que está en proceso
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
            estado: 'PendienteArea', // Forzado a estar pendiente mientras produce
            siguienteArea: destinoTemp.siguienteArea, // Mostramos hacia donde iría teóricamente
            fechaFinalizacion: new Date(),
          },
        });
      }

      // --- DINAMIC MATERIAL CONSUMPTION CON TRAZABILIDAD DE LOTE ---
      // If we are producing in Sellado (or any subsequent area consuming Bobinas), deduct from the previous phase 
      // dynamically per register linked to exact loteOrigen.
      if (produccion.area !== 'Extrusion') {
        let previo = null;

        // 1. Trazabilidad punto a punto: Buscar exactamente por el loteOrigen de la bobina
        if (produccion.loteOrigen) {
          previo = await prisma.productoTerminado.findFirst({
            where: {
              codigoLote: produccion.loteOrigen,
            },
          });
        }

        // 2. Fallback heurístico para órdenes legacy sin loteOrigen
        if (!previo && produccion.pedidoId) {
          previo = await prisma.productoTerminado.findFirst({
            where: {
              pedidoId: produccion.pedidoId,
              cantidadDisponible: { gt: 0 },
              produccionId: { not: produccion.id }, // Exclude current production
              areaOrigen: { not: produccion.area }, // Must be from a DIFFERENT area (e.g. Extrusion)
            },
            orderBy: { fechaFinalizacion: 'asc' }, // Consume the oldest stock first
          });
        }

        console.log("Consumo Dinámico previo encontrado:", previo?.id, "Lote:", previo?.codigoLote, "Unidades:", previo?.unidad, "Actual:", produccion.unidad);

        if (previo) {
          let consumido = 0;
          const cantidadAgregada = parseFloat(cantidad.toString());
          const esBolsaSellado = tipoProducto === 'Bolsa' && produccion.area === 'Sellado';
          const esProduccionDeKg = previo.areaOrigen === 'Extrusion' || previo.areaOrigen === 'Serigrafia' || previo.areaOrigen === 'Refilado';

          if (esBolsaSellado && esProduccionDeKg) {
            const cliente = produccion.pedido?.cliente;
            const ancho = prodCli?.ancho ?? (cliente as any)?.ancho;
            const largo = prodCli?.largo ?? (cliente as any)?.largo;
            const calibre = prodCli?.calibre ?? (cliente as any)?.calibre;
            const tipoBobina = prodCli?.tipoBobinaCliente ?? (cliente as any)?.tipoBobinaCliente;
            const material = prodCli?.material ?? (cliente as any)?.material;
            const anchoValvula = prodCli?.anchoValvula ?? (cliente as any)?.anchoValvula;
            const anchoFuelle = prodCli?.anchoFuelle ?? (cliente as any)?.anchoFuelle;
            const anchoSolapa = prodCli?.anchoSolapa ?? (cliente as any)?.anchoSolapa;
            const pesoPorUnidad = prodCli?.pesoPorUnidad ?? (cliente as any)?.pesoPorUnidad ?? 0;

            // Determinar densidad basada en el material
            let densidad = 0.922; // Por defecto (baja densidad)
            if (material) {
              const materialStr = material.toLowerCase();
              if (materialStr.includes('alta') || materialStr.includes('hdpe') || materialStr.includes('ad')) {
                densidad = 0.96; // Alta densidad
              }
            }

            // Verificar si tiene valvulada (pego) o con fuelle activo
            const tieneValvulada = anchoValvula && anchoValvula > 0;
            const tieneConFuelle = anchoFuelle && anchoFuelle > 0 && !tieneValvulada;

            let pesoTotal = 0;

            if (tieneValvulada && ancho && largo && calibre) {
              // Fórmula para bolsas valvuladas (pego)
              const fuelle = anchoFuelle || 0;
              const solapa = anchoSolapa || 0;
              
              const pesoUnitario = (((ancho * 2) + (fuelle * 2) + solapa) * largo * densidad * calibre) / 1000000;
              pesoTotal = pesoUnitario * cantidadAgregada;
            } else if (tieneConFuelle && ancho && largo && calibre) {
              // Fórmula para bolsas con fuelle
              const fuelle = anchoFuelle || 0;
              
              const pesoUnitario = ((ancho + (fuelle * 2)) * largo * calibre * densidad) / 1000000;
              pesoTotal = pesoUnitario * cantidadAgregada;
            } else if (ancho && largo && calibre) {
              // Fórmula para bolsas normales
              pesoTotal = (ancho * largo * calibre * densidad * cantidadAgregada) / 1000000;
            } else {
              // Fallback a peso por unidad si faltan datos dimensionales
              pesoTotal = (pesoPorUnidad * cantidadAgregada * densidad) / 1000;
            }

            consumido = pesoTotal + finalMerma;
            console.log(`Total consumido: ${consumido.toFixed(3)}kg (Producción: ${pesoTotal.toFixed(3)}kg + Merma: ${finalMerma}kg)`);
          } else {
            consumido = cantidadAgregada + finalMerma;
          }

          console.log(`Deduciendo ${consumido} del producto previo ID: ${previo.id}`);

          // Deduct this cycle's consumption from the previous area's available stock
          await prisma.productoTerminado.update({
            where: { id: previo.id },
            data: {
              cantidadDisponible: Math.max(0, previo.cantidadDisponible - consumido)
            }
          });
        } else {
          console.log("No previo stock found to deduct.");
        }
      }
    }

    revalidatePath('/produccion');
    revalidatePath('/produccion/historial');
    revalidatePath('/inventario');

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
