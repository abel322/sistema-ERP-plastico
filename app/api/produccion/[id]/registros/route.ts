import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth-options';
import { determinarDestinoProducto } from '@/lib/producto-terminado-logic';

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

    // Calcular total de cantidad y mermas
    const totalCantidad = registros.reduce((sum, r) => sum + r.cantidad, 0);
    const totalMerma = registros.reduce((sum, r) => sum + r.merma, 0);
    const totalMermaColor = registros.reduce((sum, r) => sum + ((r as any).mermaColor ?? r.mermaImpreso ?? 0), 0);
    const totalMermaCristal = registros.reduce((sum, r) => sum + ((r as any).mermaCristal ?? r.mermaSinImpresion ?? 0), 0);

    return NextResponse.json({
      registros,
      totalCantidad,
      totalMerma,
      totalMermaColor,
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
      merma,
      mermaColor,
      mermaCristal,
      mermaSinImpresion,
      mermaImpreso,
    } = body;

    if (!turno || !operario || cantidad === undefined) {
      return NextResponse.json({ error: 'Campos requeridos faltantes' }, { status: 400 });
    }

    // Verificar que la producción existe
    const produccion = await prisma.produccion.findUnique({
      where: { id },
      include: {
        pedido: { include: { cliente: true, productoCliente: true } },
        productoCliente: true,
        productoTerminado: true,
      },
    });

    if (!produccion) {
      return NextResponse.json({ error: 'Producción no encontrada' }, { status: 404 });
    }

    // Clasificación y segregación de desperdicio según área
    let finalMermaColor = 0;
    let finalMermaCristal = 0;
    let finalMerma = 0;

    const area = produccion.area;
    if (area === 'Serigrafia' || area === 'Refilado') {
      finalMermaColor = mermaColor !== undefined 
        ? (parseFloat(mermaColor?.toString() || '0') || 0)
        : (parseFloat(mermaImpreso?.toString() || '0') || 0);

      finalMermaCristal = mermaCristal !== undefined
        ? (parseFloat(mermaCristal?.toString() || '0') || 0)
        : (parseFloat(mermaSinImpresion?.toString() || '0') || 0);

      finalMerma = finalMermaColor + finalMermaCristal;
    } else if (area === 'Sellado') {
      const rawMerma = merma !== undefined 
        ? (parseFloat(merma?.toString() || '0') || 0)
        : ((parseFloat(mermaColor?.toString() || '0') || 0) + (parseFloat(mermaCristal?.toString() || '0') || 0));

      const conImpresion = Boolean(
        produccion.pedido?.productoCliente?.conImpresion ||
        produccion.productoCliente?.conImpresion ||
        (produccion.pedido?.cliente as any)?.conImpresion
      );

      if (conImpresion) {
        finalMermaColor = rawMerma;
        finalMermaCristal = 0;
      } else {
        finalMermaCristal = rawMerma;
        finalMermaColor = 0;
      }
      finalMerma = rawMerma;
    } else {
      // Extrusión o default
      const rawMerma = merma !== undefined 
        ? (parseFloat(merma?.toString() || '0') || 0)
        : ((parseFloat(mermaColor?.toString() || '0') || 0) + (parseFloat(mermaCristal?.toString() || '0') || 0));

      finalMermaCristal = rawMerma;
      finalMermaColor = 0;
      finalMerma = rawMerma;
    }

    // Crear registro
    const registro = await prisma.registroProduccion.create({
      data: {
        produccionId: id,
        turno,
        fecha: fecha ? new Date(fecha) : new Date(),
        operario,
        cantidad: parseFloat(cantidad.toString()),
        reporte: reporte || null,
        merma: finalMerma,
        mermaColor: finalMermaColor,
        mermaCristal: finalMermaCristal,
        mermaSinImpresion: finalMermaCristal,
        mermaImpreso: finalMermaColor,
      } as any,
    });

    // Actualizar cantidad total en la producción
    const todosRegistros = await prisma.registroProduccion.findMany({
      where: { produccionId: id },
    });
    const totalCantidad = todosRegistros.reduce((sum, r) => sum + r.cantidad, 0);
    const totalMerma = todosRegistros.reduce((sum, r) => sum + r.merma, 0);
    const totalMermaColor = todosRegistros.reduce((sum, r) => sum + ((r as any).mermaColor ?? r.mermaImpreso ?? 0), 0);
    const totalMermaCristal = todosRegistros.reduce((sum, r) => sum + ((r as any).mermaCristal ?? r.mermaSinImpresion ?? 0), 0);

    await prisma.produccion.update({
      where: { id },
      data: {
        cantidadProducida: totalCantidad,
        merma: totalMerma,
        mermaColor: totalMermaColor,
        mermaCristal: totalMermaCristal,
      } as any,
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
            cantidadTotal: totalCantidad,
            cantidadDisponible: totalCantidad,
          },
        });
      } else {
        // Crear la tarjeta temporal que indica que está en proceso
        await prisma.productoTerminado.create({
          data: {
            userId: (session.user as any)?.id || produccion.userId,
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

      // --- DINAMIC MATERIAL CONSUMPTION ---
      // If we are producing in Sellado (or any subsequent area consuming Bobinas), deduct from the previous phase 
      // dynamically per register.
      if (produccion.pedidoId && produccion.area !== 'Extrusion') {
        const previo = await prisma.productoTerminado.findFirst({
          where: {
            pedidoId: produccion.pedidoId,
            cantidadDisponible: { gt: 0 },
            produccionId: { not: produccion.id }, // Exclude current production
            areaOrigen: { not: produccion.area }, // Must be from a DIFFERENT area (e.g. Extrusion)
          },
          orderBy: { fechaFinalizacion: 'asc' }, // Consume the oldest stock first
        });

        console.log("Consumo Dinámico previo encontrado:", previo?.id, "Unidades:", previo?.unidad, "Actual:", produccion.unidad);

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

    return NextResponse.json(registro, { status: 201 });
  } catch (error) {
    console.error('Error al crear registro:', error);
    return NextResponse.json({ error: 'Error al crear registro' }, { status: 500 });
  }
}
