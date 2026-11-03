import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth-options';
import { CategoriaInventario } from '@prisma/client';
import { RESINAS_VIRGENES_CONFIG, ADITIVOS_CONFIG } from '@/lib/consumo-extrusion-logic';
import { calculateBagWeight, getPlasticDensity } from '@/lib/utils/bag-weight';

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

    const produccion = await prisma.produccion.findUnique({
      where: { id },
      include: {
        maquina: true,
        pedido: {
          include: {
            cliente: true,
            productoCliente: {
              include: {
                peletizado: true,
                resinaMolido: true,
              },
            },
          },
        },
        productoCliente: {
          include: {
            cliente: true,
            peletizado: true,
            resinaMolido: true,
          },
        },
        registros: {
          orderBy: { fecha: 'asc' },
        },
      },
    });

    if (!produccion) {
      return NextResponse.json({ error: 'Producción no encontrada' }, { status: 404 });
    }

    const productoCliente = produccion.pedido?.productoCliente || produccion.productoCliente;
    const cliente = produccion.pedido?.cliente || produccion.productoCliente?.cliente;

    // Consultar inventario actual de materias primas, peletizados y aditivos
    const inventarios = await prisma.inventario.findMany({
      where: {
        categoria: {
          in: [
            CategoriaInventario.MateriaPrima,
            CategoriaInventario.Peletizado,
            CategoriaInventario.Aditivo,
          ],
        },
      },
    });

    // 1. Kilos producidos a la fecha en la orden
    const kgProducidos = produccion.registros.reduce((sum, r) => sum + r.cantidad, 0) || produccion.cantidadProducida || 0;
    const mermaTotal = produccion.registros.reduce((sum, r) => sum + (r.merma || 0), 0) || produccion.merma || 0;

    // 2. Meta en KG
    let metaKg = produccion.pedido?.cantidadSolicitada || 0;
    const unidadPedido = produccion.pedido?.unidad;
    if (productoCliente?.tipoProducto === 'Bolsa' && unidadPedido === 'Unidades') {
      let peso = productoCliente?.pesoPorUnidad || 0;
      if (!peso && productoCliente?.ancho && productoCliente?.largo && productoCliente?.calibre) {
        const densidad = getPlasticDensity(productoCliente.material || undefined);
        peso = calculateBagWeight({
          tipoBolsa:
            productoCliente.anchoValvula && productoCliente.anchoValvula > 0
              ? 'valvula'
              : productoCliente.anchoFuelle && productoCliente.anchoFuelle > 0
              ? 'fuelle'
              : 'sencilla',
          ancho: productoCliente.ancho,
          largo: productoCliente.largo,
          calibre: productoCliente.calibre,
          fuelle: productoCliente.anchoFuelle || undefined,
          solapa: productoCliente.anchoSolapa || undefined,
          densidad,
        });
      }
      if (peso > 0) {
        metaKg = (metaKg * peso) / 1000;
      }
    }

    if (metaKg <= 0) {
      metaKg = kgProducidos;
    }

    const kgPendientes = Math.max(0, metaKg - kgProducidos);
    const porcentajeProgreso = metaKg > 0 ? Math.min(100, (kgProducidos / metaKg) * 100) : (kgProducidos > 0 ? 100 : 0);
    const porcentajeMerma = (kgProducidos + mermaTotal) > 0 ? (mermaTotal / (kgProducidos + mermaTotal)) * 100 : 0;
    const sacasProducidas = kgProducidos / 25;
    const sacasPendientes = kgPendientes / 25;
    const sacasMeta = metaKg / 25;

    // 3. Balance Peletizado / Molido
    const tipoDosif = productoCliente?.tipoDosificacionMolido || 'PORCENTAJE';
    const peletizadoPct = Number(productoCliente?.peletizadoPorcentaje) || 0;
    const peletizadoKgPor100 = Number(productoCliente?.peletizadoKgPor100) || 0;
    const llevaResinaEnMolido = Boolean(productoCliente?.llevaResinaEnMolido);
    const resinaMolidoKgPor100 = Number(productoCliente?.resinaMolidoKgPor100) || 0;

    let peletizadoInfo = null;

    let kgMolidoConsumido = 0;
    let kgMolidoFaltante = 0;
    let kgResinaMolidoConsumido = 0;
    let kgResinaMolidoFaltante = 0;

    if (tipoDosif === 'PORCENTAJE') {
      if (peletizadoPct > 0) {
        kgMolidoConsumido = kgProducidos * (peletizadoPct / 100);
        kgMolidoFaltante = kgPendientes * (peletizadoPct / 100);
      }
    } else {
      if (peletizadoKgPor100 > 0) {
        const ratioProducido = kgProducidos / 100;
        const ratioPendiente = kgPendientes / 100;
        kgMolidoConsumido = ratioProducido * peletizadoKgPor100;
        kgMolidoFaltante = ratioPendiente * peletizadoKgPor100;

        if (llevaResinaEnMolido && resinaMolidoKgPor100 > 0) {
          kgResinaMolidoConsumido = ratioProducido * resinaMolidoKgPor100;
          kgResinaMolidoFaltante = ratioPendiente * resinaMolidoKgPor100;
        }
      }
    }

    if (kgMolidoConsumido > 0 || kgMolidoFaltante > 0 || peletizadoPct > 0 || peletizadoKgPor100 > 0) {
      let itemPel = null;
      if (productoCliente?.peletizadoId) {
        itemPel = inventarios.find((i) => i.id === productoCliente.peletizadoId);
      }
      if (!itemPel) {
        itemPel = inventarios.find((i) => i.categoria === CategoriaInventario.Peletizado);
      }

      // Enriquecimiento de resina (ej. LDPE 3003)
      let itemResinaMolido = null;
      if (llevaResinaEnMolido) {
        if (productoCliente?.resinaMolidoId) {
          itemResinaMolido = inventarios.find((i) => i.id === productoCliente.resinaMolidoId);
        }
        if (!itemResinaMolido) {
          itemResinaMolido = inventarios.find((i) =>
            i.categoria === CategoriaInventario.MateriaPrima &&
            (i.codigo.toLowerCase().includes('3003') || i.nombre.toLowerCase().includes('3003'))
          );
        }
      }

      const stockActualKg = itemPel?.cantidad ?? 0;
      const sacasConsumidas = kgMolidoConsumido / 25;
      const sacasFaltantes = kgMolidoFaltante / 25;
      const stockActualSacas = stockActualKg / 25;

      let status: 'optimo' | 'critico' | 'agotado' = 'optimo';
      let deficitKg = 0;
      let deficitSacas = 0;

      if (stockActualKg <= 0) {
        status = 'agotado';
        deficitKg = kgMolidoFaltante;
        deficitSacas = sacasFaltantes;
      } else if (stockActualKg < kgMolidoFaltante) {
        status = 'critico';
        deficitKg = kgMolidoFaltante - stockActualKg;
        deficitSacas = deficitKg / 25;
      }

      peletizadoInfo = {
        inventarioId: itemPel?.id || null,
        codigo: itemPel?.codigo || 'PEL',
        nombre: itemPel?.nombre || productoCliente?.peletizado?.nombre || 'Peletizado Recuperado',
        tipoDosificacion: tipoDosif,
        porcentaje: peletizadoPct,
        kgPor100: peletizadoKgPor100,
        kgConsumido: kgMolidoConsumido,
        sacasConsumidas,
        kgFaltante: kgMolidoFaltante,
        sacasFaltantes,
        stockActualKg,
        stockActualSacas,
        status,
        deficitKg,
        deficitSacas,
        // Datos de resina virgen de enriquecimiento
        llevaResinaEnMolido,
        resinaMolidoId: itemResinaMolido?.id || productoCliente?.resinaMolidoId || null,
        resinaMolidoNombre: itemResinaMolido?.nombre || 'LDPE 3003',
        resinaMolidoKgPor100,
        resinaMolidoKgConsumido: kgResinaMolidoConsumido,
        resinaMolidoSacasConsumidas: kgResinaMolidoConsumido / 25,
        resinaMolidoKgFaltante: kgResinaMolidoFaltante,
        resinaMolidoSacasFaltantes: kgResinaMolidoFaltante / 25,
      };
    }

    // 4. Balance Resinas Vírgenes
    const baseVirgenActual = kgProducidos;
    const baseVirgenFaltante = kgPendientes;

    const resinasVirgenesInfo = [];

    for (const resina of RESINAS_VIRGENES_CONFIG) {
      const pct = Number((productoCliente as any)?.[resina.key] ?? (productoCliente as any)?.[resina.altKey]) || 0;
      if (pct > 0) {
        const factor = pct / 100;
        const kgConsumidoBase = baseVirgenActual * factor;
        const kgFaltanteBase = baseVirgenFaltante * factor;

        let itemMp = null;
        for (const term of resina.searchTerms) {
          itemMp = inventarios.find(
            (i) =>
              i.categoria === CategoriaInventario.MateriaPrima &&
              (i.codigo.toLowerCase().includes(term.toLowerCase()) ||
                i.nombre.toLowerCase().includes(term.toLowerCase()))
          );
          if (itemMp) break;
        }

        if (!itemMp) {
          for (const term of resina.searchTerms) {
            itemMp = inventarios.find(
              (i) =>
                i.codigo.toLowerCase().includes(term.toLowerCase()) ||
                i.nombre.toLowerCase().includes(term.toLowerCase())
            );
            if (itemMp) break;
          }
        }

        // Comprobar si esta resina virgen es la que se usó como enriquecimiento en el molido (ej. 3003)
        const esResinaDeMolido = llevaResinaEnMolido && (
          (productoCliente?.resinaMolidoId && itemMp?.id === productoCliente.resinaMolidoId) ||
          resina.searchTerms.some((t) => t.includes('3003'))
        );

        const kgConsumidoExtra = esResinaDeMolido ? kgResinaMolidoConsumido : 0;
        const kgFaltanteExtra = esResinaDeMolido ? kgResinaMolidoFaltante : 0;

        const kgConsumidoTotal = kgConsumidoBase + kgConsumidoExtra;
        const kgFaltanteTotal = kgFaltanteBase + kgFaltanteExtra;

        const stockActualKg = itemMp?.cantidad ?? 0;
        const sacasConsumidas = kgConsumidoTotal / 25;
        const sacasFaltantes = kgFaltanteTotal / 25;
        const stockActualSacas = stockActualKg / 25;

        let status: 'optimo' | 'critico' | 'agotado' = 'optimo';
        let deficitKg = 0;
        let deficitSacas = 0;

        if (stockActualKg <= 0) {
          status = 'agotado';
          deficitKg = kgFaltanteTotal;
          deficitSacas = sacasFaltantes;
        } else if (stockActualKg < kgFaltanteTotal) {
          status = 'critico';
          deficitKg = kgFaltanteTotal - stockActualKg;
          deficitSacas = deficitKg / 25;
        }

        resinasVirgenesInfo.push({
          key: resina.key,
          label: resina.label,
          nombreInventario: itemMp?.nombre || `Resina ${resina.label}`,
          codigo: itemMp?.codigo || resina.label,
          porcentaje: pct,
          kgConsumido: kgConsumidoTotal,
          kgConsumidoBase,
          kgConsumidoExtraMolido: kgConsumidoExtra,
          sacasConsumidas,
          kgFaltante: kgFaltanteTotal,
          kgFaltanteBase,
          kgFaltanteExtraMolido: kgFaltanteExtra,
          sacasFaltantes,
          stockActualKg,
          stockActualSacas,
          status,
          deficitKg,
          deficitSacas,
        });
      }
    }

    // 5. Balance Aditivos y Masterbatch
    const aditivosInfo = [];

    for (const aditivo of ADITIVOS_CONFIG) {
      const pct = Number((productoCliente as any)?.[aditivo.key] ?? (productoCliente as any)?.[aditivo.altKey]) || 0;
      if (pct > 0) {
        const kgConsumido = kgProducidos * (pct / 100);
        const kgFaltante = kgPendientes * (pct / 100);

        let itemAditivo = inventarios.find(
          (i) =>
            i.categoria === CategoriaInventario.Aditivo &&
            (i.codigo.toLowerCase() === aditivo.codigo.toLowerCase() ||
              i.nombre.toLowerCase().includes(aditivo.nombre.toLowerCase()))
        );

        if (!itemAditivo) {
          itemAditivo = inventarios.find(
            (i) =>
              i.codigo.toLowerCase() === aditivo.codigo.toLowerCase() ||
              i.nombre.toLowerCase().includes(aditivo.nombre.toLowerCase())
          );
        }

        const stockActualKg = itemAditivo?.cantidad ?? 0;
        const sacasConsumidas = kgConsumido / 25;
        const sacasFaltantes = kgFaltante / 25;
        const stockActualSacas = stockActualKg / 25;

        let status: 'optimo' | 'critico' | 'agotado' = 'optimo';
        let deficitKg = 0;
        let deficitSacas = 0;

        if (stockActualKg <= 0) {
          status = 'agotado';
          deficitKg = kgFaltante;
          deficitSacas = sacasFaltantes;
        } else if (stockActualKg < kgFaltante) {
          status = 'critico';
          deficitKg = kgFaltante - stockActualKg;
          deficitSacas = deficitKg / 25;
        }

        aditivosInfo.push({
          key: aditivo.key,
          label: aditivo.label,
          nombreInventario: itemAditivo?.nombre || aditivo.label,
          codigo: itemAditivo?.codigo || aditivo.codigo,
          porcentaje: pct,
          kgConsumido,
          sacasConsumidas,
          kgFaltante,
          sacasFaltantes,
          stockActualKg,
          stockActualSacas,
          status,
          deficitKg,
          deficitSacas,
        });
      }
    }

    // 6. Resumen Global de Almacén
    const todosLosItems = [
      ...(peletizadoInfo ? [peletizadoInfo] : []),
      ...resinasVirgenesInfo,
      ...aditivosInfo,
    ];

    const tieneAgotados = todosLosItems.some((i) => i.status === 'agotado' && i.kgFaltante > 0);
    const tieneCriticos = todosLosItems.some((i) => i.status === 'critico' && i.kgFaltante > 0);

    let estadoGlobal: 'optimo' | 'critico' | 'agotado' = 'optimo';
    let mensajeGlobal = 'Insumos completos en almacén para cubrir la meta';

    if (tieneAgotados) {
      estadoGlobal = 'agotado';
      mensajeGlobal = 'Déficit crítico: Hay insumos completamente agotados en almacén';
    } else if (tieneCriticos) {
      estadoGlobal = 'critico';
      mensajeGlobal = 'Alerta de suministro: Stock insuficiente para completar la meta programada';
    }

    const totalSacasFaltantes = todosLosItems.reduce((sum, i) => sum + i.sacasFaltantes, 0);
    const totalKgFaltantes = todosLosItems.reduce((sum, i) => sum + i.kgFaltante, 0);

    return NextResponse.json({
      orden: {
        id: produccion.id,
        codigoLote: produccion.codigoLote,
        fecha: produccion.fecha,
        turno: produccion.turno,
        area: produccion.area,
        clienteNombre: cliente?.nombre || 'Producción Interna',
        productoNombre: productoCliente?.nombreProducto || 'Material Extruido',
        maquinaNombre: produccion.maquina?.nombre || 'Extrusora',
        operario: produccion.operario,
        pedidoId: produccion.pedidoId,
        kgProducidos,
        metaKg,
        kgPendientes,
        sacasProducidas,
        sacasPendientes,
        sacasMeta,
        porcentajeProgreso,
        mermaTotal,
        porcentajeMerma,
      },
      peletizado: peletizadoInfo,
      resinasVirgenes: resinasVirgenesInfo,
      aditivos: aditivosInfo,
      resumenGlobal: {
        estado: estadoGlobal,
        mensaje: mensajeGlobal,
        totalSacasFaltantes,
        totalKgFaltantes,
      },
    });
  } catch (error) {
    console.error('Error al obtener consumo de materia prima:', error);
    return NextResponse.json({ error: 'Error al calcular consumo de MP' }, { status: 500 });
  }
}
