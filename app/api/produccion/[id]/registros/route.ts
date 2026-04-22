import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth-options';
import { determinarDestinoProducto } from '@/lib/producto-terminado-logic';

export const dynamic = 'force-dynamic';

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

    // Calcular total de cantidad
    const totalCantidad = registros.reduce((sum, r) => sum + r.cantidad, 0);
    const totalMerma = registros.reduce((sum, r) => sum + r.merma, 0);

    return NextResponse.json({
      registros,
      totalCantidad,
      totalMerma,
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
        pedido: { include: { cliente: true } },
        productoTerminado: true
      }
    });

    if (!produccion) {
      return NextResponse.json({ error: 'Producción no encontrada' }, { status: 404 });
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
        merma: merma ? parseFloat(merma.toString()) : 0,
        mermaSinImpresion: mermaSinImpresion ? parseFloat(mermaSinImpresion.toString()) : null,
        mermaImpreso: mermaImpreso ? parseFloat(mermaImpreso.toString()) : null,
      },
    });

    // Actualizar cantidad total en la producción
    const todosRegistros = await prisma.registroProduccion.findMany({
      where: { produccionId: id },
    });
    const totalCantidad = todosRegistros.reduce((sum, r) => sum + r.cantidad, 0);
    const totalMerma = todosRegistros.reduce((sum, r) => sum + r.merma, 0);

    await prisma.produccion.update({
      where: { id },
      data: {
        cantidadProducida: totalCantidad,
        merma: totalMerma,
      },
    });

    // Actualizar o crear ProductoTerminado dinámicamente ("En proceso")
    if (produccion.pedido?.cliente) {
      const clienteId = produccion.pedido.cliente.id;
      const tipoProducto = produccion.pedido.cliente.tipoProducto as 'Bolsa' | 'Bobina';
      const conImpresion = produccion.pedido.cliente.conImpresion || false;

      const destinoTemp = determinarDestinoProducto(produccion.area, tipoProducto, conImpresion);

      if (produccion.productoTerminado) {
        // Actualizar la cantidad en la tarjeta existente
        await prisma.productoTerminado.update({
          where: { id: produccion.productoTerminado.id },
          data: {
            cantidadTotal: totalCantidad,
            cantidadDisponible: totalCantidad,
          }
        });
      } else {
        // Crear la tarjeta temporal que indica que está en proceso
        await prisma.productoTerminado.create({
          data: {
            produccionId: id,
            pedidoId: produccion.pedidoId,
            clienteId: clienteId,
            areaOrigen: produccion.area,
            descripcion: `(En Proceso) Producción de ${produccion.area}`,
            cantidadTotal: totalCantidad,
            cantidadDisponible: totalCantidad,
            unidad: produccion.unidad,
            tipoProducto: tipoProducto,
            conImpresion: conImpresion,
            estado: 'PendienteArea', // Forzado a estar pendiente mientras produce
            siguienteArea: destinoTemp.siguienteArea, // Mostramos hacia donde iría teóricamente
            fechaFinalizacion: new Date()
          }
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
            areaOrigen: { not: produccion.area }  // Must be from a DIFFERENT area (e.g. Extrusion)
          },
          orderBy: { fechaFinalizacion: 'asc' } // Consume the oldest stock first
        });

        console.log("Consumo Dinámico previo encontrado:", previo?.id, "Unidades:", previo?.unidad, "Actual:", produccion.unidad);

        if (previo) {
          let consumido = 0;
          const cantidadAgregada = parseFloat(cantidad.toString());
          const mermaAgregada = merma ? parseFloat(merma.toString()) : 0;
          const mermaAgregada_2 = mermaSinImpresion ? parseFloat(mermaSinImpresion.toString()) : 0;
          const mermaAgregada_3 = mermaImpreso ? parseFloat(mermaImpreso.toString()) : 0;

          const esBolsaSellado = tipoProducto === 'Bolsa' && produccion.area === 'Sellado';
          const esProduccionDeKg = previo.areaOrigen === 'Extrusion' || previo.areaOrigen === 'Serigrafia' || previo.areaOrigen === 'Refilado';

          if (esBolsaSellado && esProduccionDeKg) {
            const cliente = produccion.pedido.cliente;
            const ancho = cliente.ancho;
            const largo = cliente.largo;
            const calibre = cliente.calibre;
            const tipoBobina = cliente.tipoBobinaCliente;

            // Sumamos todas las mermas que se generaron en este registro
            const mermasTotales = mermaAgregada + mermaAgregada_2 + mermaAgregada_3;

            // Determinar densidad basada en el material
            let densidad = 0.922; // Por defecto (baja densidad)
            if (cliente.material) {
              const materialStr = cliente.material.toLowerCase();
              if (materialStr.includes('alta') || materialStr.includes('hdpe') || materialStr.includes('ad')) {
                densidad = 0.96; // Alta densidad
              }
            }

            // Verificar si tiene valvulada (pego) o con fuelle activo
            const tieneValvulada = cliente.anchoValvula && cliente.anchoValvula > 0;
            const tieneConFuelle = cliente.anchoFuelle && cliente.anchoFuelle > 0 && !tieneValvulada;

            let pesoTotal = 0;

            if (tieneValvulada && ancho && largo && calibre) {
              // Fórmula para bolsas valvuladas (pego)
              const fuelle = cliente.anchoFuelle || 0;
              const solapa = cliente.anchoSolapa || 0;
              
              // (((ancho * 2) + (fuelle * 2) + solapa) * largo * densidad * calibre) / 1000000
              const pesoUnitario = (((ancho * 2) + (fuelle * 2) + solapa) * largo * densidad * calibre) / 1000000;
              pesoTotal = pesoUnitario * cantidadAgregada;
              console.log(`Bolsa Valvulada (A=${ancho}, L=${largo}, C=${calibre}, F=${fuelle}, S=${solapa}, D=${densidad}, Qty=${cantidadAgregada}) -> Peso=${pesoTotal.toFixed(3)}kg`);
              
            } else if (tieneConFuelle && ancho && largo && calibre) {
              // Fórmula para bolsas con fuelle
              const fuelle = cliente.anchoFuelle || 0;
              
              // ((ancho + (fuelle * 2)) * largo * calibre * densidad) / 1000000
              const pesoUnitario = ((ancho + (fuelle * 2)) * largo * calibre * densidad) / 1000000;
              pesoTotal = pesoUnitario * cantidadAgregada;
              console.log(`Bolsa Con Fuelle (A=${ancho}, L=${largo}, C=${calibre}, F=${fuelle}, D=${densidad}, Qty=${cantidadAgregada}) -> Peso=${pesoTotal.toFixed(3)}kg`);
              
            } else if (ancho && largo && calibre) {
              // Fórmula original para bolsas normales
              const esManga = tipoBobina === 'Manga';
              
              // (Ancho * Largo * Calibre * Densidad * Caras) / 1000000
              pesoTotal = (ancho * largo * calibre * densidad * cantidadAgregada) / 1000000;
              console.log(`Bolsa Normal (Material=${cliente.material || 'N/A'}, Densidad=${densidad}, A=${ancho}, L=${largo}, C=${calibre}, Manga=${esManga}, Qty=${cantidadAgregada}) -> Peso=${pesoTotal.toFixed(3)}kg`);
              
            } else {
              // Fallback a peso por unidad si faltan datos dimensionales
              const pesoPorUnidad = cliente.pesoPorUnidad || 0;
              pesoTotal = (pesoPorUnidad * cantidadAgregada * densidad) / 1000;
              console.log(`Fallback peso por unidad (peso=${pesoPorUnidad}, densidad=${densidad}, qty=${cantidadAgregada}) -> Peso=${pesoTotal.toFixed(3)}kg`);
            }

            consumido = pesoTotal + mermasTotales;
            console.log(`Total consumido: ${consumido.toFixed(3)}kg (Producción: ${pesoTotal.toFixed(3)}kg + Mermas: ${mermasTotales}kg)`);
          } else {
            consumido = cantidadAgregada + mermaAgregada + mermaAgregada_2 + mermaAgregada_3;
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
