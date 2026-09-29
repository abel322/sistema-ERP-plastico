import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { AreaProduccion, EstadoProduccion } from '@prisma/client';
import { authOptions } from '@/lib/auth-options';
import { calcularDesgloseMerma, CLASIFICACIONES_MERMA } from '@/lib/merma-logic';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';


export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const periodo = searchParams.get('periodo') || 'semana'; // semana, mes
    const area = searchParams.get('area') as AreaProduccion | null;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Calcular fechas según el periodo
    const now = new Date();
    let fechaInicio: Date;

    if (periodo === 'semana') {
      // Inicio de la semana (lunes)
      const dayOfWeek = now.getDay();
      const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      fechaInicio = new Date(now);
      fechaInicio.setDate(now.getDate() - diff);
      fechaInicio.setHours(0, 0, 0, 0);
    } else {
      // Inicio del mes
      fechaInicio = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const where: any = {
      estado: EstadoProduccion.Finalizado,
      finalizadoAt: { gte: fechaInicio },
    };
    if (area) where.area = area;

    const [producciones, total, resumen, produccionesExtrusionRaw] = await Promise.all([
      prisma.produccion.findMany({
        where,
        include: {
          maquina: true,
          pedido: {
            include: {
              cliente: true,
              productoCliente: {
                include: { peletizado: true },
              },
            },
          },
          productoCliente: {
            include: { peletizado: true },
          },
          registros: {
            orderBy: { fecha: 'asc' },
          },
        },
        orderBy: { finalizadoAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.produccion.count({ where }),
      // Resumen por área
      prisma.produccion.groupBy({
        by: ['area'],
        where,
        _sum: {
          cantidadProducida: true,
          merma: true,
          mermaTransparenteAlta: true,
          mermaBlancoPollo: true,
          mermaColor: true,
          mermaTransparenteBaja: true,
          mermaBlancoPego: true,
        },
        _count: true,
      }),
      // Órdenes de Extrusión para desglose consolidado de materia prima
      prisma.produccion.findMany({
        where: {
          estado: EstadoProduccion.Finalizado,
          finalizadoAt: { gte: fechaInicio },
          area: AreaProduccion.Extrusion,
        },
        select: {
          id: true,
          cantidadProducida: true,
          merma: true,
          registros: {
            select: { cantidad: true, merma: true },
          },
          productoCliente: {
            include: { peletizado: true },
          },
          pedido: {
            select: {
              productoCliente: {
                include: { peletizado: true },
              },
            },
          },
        },
      }),
    ]);

    // Calcular consumo consolidado de materias primas en Extrusión durante el período filtrado
    const consumoConsolidadoExtrusion: Record<string, number> = {
      molido: 0,
      formFB7000: 0,
      form3003: 0,
      formLineal: 0,
      form0240: 0,
      form0348: 0,
      form7000F: 0,
      formDeslizante: 0,
      formMasterbachBlanco: 0,
      formMasterbachNegro: 0,
      formMasterbachAzul: 0,
      formMasterbachAmarillo: 0,
    };

    const consumoPeletizadosDetalle: Record<string, { id: string; nombre: string; codigo?: string; cantidadKg: number }> = {};

    const produccionesExtrusionPeriodo = (produccionesExtrusionRaw || []) as Array<{
      cantidadProducida: number;
      merma?: number;
      registros: Array<{ cantidad: number; merma?: number }>;
      productoCliente: any;
      pedido?: { productoCliente: any } | null;
    }>;

    produccionesExtrusionPeriodo.forEach((ord) => {
      const kgBobinas = ord.registros && ord.registros.length > 0
        ? ord.registros.reduce((sum, r) => sum + (r.cantidad || 0), 0)
        : (ord.cantidadProducida || 0);

      const kgMermas = ord.registros && ord.registros.length > 0
        ? ord.registros.reduce((sum, r) => sum + (r.merma || 0), 0)
        : (ord.merma || 0);

      // La base de consumo son estrictamente los kilos netos de bobinas producidas (sin merma)
      const kgExtrusion = kgBobinas;

      const f = ord.productoCliente || ord.pedido?.productoCliente;
      if (!f || kgExtrusion <= 0) return;

      // 1. Balance Base Polímero: Peletizado
      const peletizadoPct = Number(f.peletizadoPorcentaje ?? f.molido ?? f.formMolido ?? 0);
      const kgPel = peletizadoPct > 0 ? kgExtrusion * (peletizadoPct / 100) : 0;
      if (kgPel > 0) {
        consumoConsolidadoExtrusion.molido += kgPel;

        const pelId = f.peletizadoId || 'general';
        const pelNombre = f.peletizado?.nombre || 'Material Recuperado / Molido';

        if (!consumoPeletizadosDetalle[pelId]) {
          consumoPeletizadosDetalle[pelId] = {
            id: pelId,
            nombre: pelNombre,
            codigo: f.peletizado?.codigo || '',
            cantidadKg: 0,
          };
        }
        consumoPeletizadosDetalle[pelId].cantidadKg += kgPel;
      }

      // 2. Balance Base Polímero: Resinas Vírgenes (distribución proporcional sobre kgVirgenTotal)
      const kgVirgenTotal = Math.max(0, kgExtrusion - kgPel);

      const resinaPcts = {
        formFB7000: Number(f.formFB7000 ?? f.fb7000 ?? 0),
        form3003: Number(f.form3003 ?? f.p3003 ?? 0),
        formLineal: Number(f.formLineal ?? f.lineal ?? 0),
        form0240: Number(f.form0240 ?? f.p0240 ?? 0),
        form0348: Number(f.form0348 ?? f.p0348 ?? 0),
        form7000F: Number(f.form7000F ?? f.p7000F ?? 0),
      };

      const sumaVirgen = Object.values(resinaPcts).reduce((acc, val) => acc + val, 0);

      if (kgVirgenTotal > 0 && sumaVirgen > 0) {
        consumoConsolidadoExtrusion.formFB7000 += kgVirgenTotal * (resinaPcts.formFB7000 / sumaVirgen);
        consumoConsolidadoExtrusion.form3003 += kgVirgenTotal * (resinaPcts.form3003 / sumaVirgen);
        consumoConsolidadoExtrusion.formLineal += kgVirgenTotal * (resinaPcts.formLineal / sumaVirgen);
        consumoConsolidadoExtrusion.form0240 += kgVirgenTotal * (resinaPcts.form0240 / sumaVirgen);
        consumoConsolidadoExtrusion.form0348 += kgVirgenTotal * (resinaPcts.form0348 / sumaVirgen);
        consumoConsolidadoExtrusion.form7000F += kgVirgenTotal * (resinaPcts.form7000F / sumaVirgen);
      }

      // 3. Aditivos: dosificación externa al 100% sobre kgExtrusion
      consumoConsolidadoExtrusion.formDeslizante += kgExtrusion * ((Number(f.formDeslizante ?? f.deslizante ?? 0)) / 100);
      consumoConsolidadoExtrusion.formMasterbachBlanco += kgExtrusion * ((Number(f.formMasterbachBlanco ?? f.masterbachBlanco ?? 0)) / 100);
      consumoConsolidadoExtrusion.formMasterbachNegro += kgExtrusion * ((Number(f.formMasterbachNegro ?? f.masterbachNegro ?? 0)) / 100);
      consumoConsolidadoExtrusion.formMasterbachAzul += kgExtrusion * ((Number(f.formMasterbachAzul ?? f.masterbachAzul ?? 0)) / 100);
      consumoConsolidadoExtrusion.formMasterbachAmarillo += kgExtrusion * ((Number(f.formMasterbachAmarillo ?? f.masterbachAmarillo ?? 0)) / 100);
    });

    // Asegurar cálculo consolidado de las 5 variantes de merma por orden
    const produccionesConMermas = producciones.map((prod) => {
      const datosMerma = prod.registros && prod.registros.length > 0 ? prod.registros : prod;
      const desglose = calcularDesgloseMerma(datosMerma);

      return {
        ...prod,
        merma: desglose.mermaTotal,
        mermaTransparenteAlta: desglose.mermaTransparenteAlta,
        mermaBlancoPollo: desglose.mermaBlancoPollo,
        mermaColor: desglose.mermaColor,
        mermaTransparenteBaja: desglose.mermaTransparenteBaja,
        mermaBlancoPego: desglose.mermaBlancoPego,
        mermaCristal: desglose.mermaTransparenteAlta, // retrocompatibilidad
      };
    });

    // Calcular totales generales para las 5 variantes de merma
    const sumMermaAlta = resumen.reduce((acc, r) => acc + ((r._sum as any).mermaTransparenteAlta || 0), 0);
    const sumMermaPollo = resumen.reduce((acc, r) => acc + ((r._sum as any).mermaBlancoPollo || 0), 0);
    const sumMermaColor = resumen.reduce((acc, r) => acc + ((r._sum as any).mermaColor || 0), 0);
    const sumMermaBaja = resumen.reduce((acc, r) => acc + ((r._sum as any).mermaTransparenteBaja || 0), 0);
    const sumMermaPego = resumen.reduce((acc, r) => acc + ((r._sum as any).mermaBlancoPego || 0), 0);
    const sumMermaTotal = resumen.reduce((acc, r) => acc + (r._sum.merma || 0), 0);

    const mermasTotalesMap = {
      mermaTransparenteAlta: sumMermaAlta || produccionesConMermas.reduce((acc, p) => acc + (p.mermaTransparenteAlta || 0), 0),
      mermaBlancoPollo: sumMermaPollo || produccionesConMermas.reduce((acc, p) => acc + (p.mermaBlancoPollo || 0), 0),
      mermaColor: sumMermaColor || produccionesConMermas.reduce((acc, p) => acc + (p.mermaColor || 0), 0),
      mermaTransparenteBaja: sumMermaBaja || produccionesConMermas.reduce((acc, p) => acc + (p.mermaTransparenteBaja || 0), 0),
      mermaBlancoPego: sumMermaPego || produccionesConMermas.reduce((acc, p) => acc + (p.mermaBlancoPego || 0), 0),
    };

    const desgloseMermas = CLASIFICACIONES_MERMA.map((item) => ({
      key: item.key,
      label: item.label,
      shortLabel: item.shortLabel,
      codigo: item.codigo,
      cantidadKg: mermasTotalesMap[item.key] || 0,
      color: item.color,
      badgeClass: item.badgeClass,
    }));

    const totalMerma = sumMermaTotal || Object.values(mermasTotalesMap).reduce((a, b) => a + b, 0);

    const totales = {
      totalProducido: resumen.reduce((acc, r) => acc + (r._sum.cantidadProducida || 0), 0),
      totalMerma,
      mermaTransparenteAlta: mermasTotalesMap.mermaTransparenteAlta,
      mermaBlancoPollo: mermasTotalesMap.mermaBlancoPollo,
      mermaColor: mermasTotalesMap.mermaColor,
      mermaTransparenteBaja: mermasTotalesMap.mermaTransparenteBaja,
      mermaBlancoPego: mermasTotalesMap.mermaBlancoPego,
      desgloseMermas,
      totalMermaColor: mermasTotalesMap.mermaColor,
      totalMermaCristal: mermasTotalesMap.mermaTransparenteAlta,
      totalRegistros: resumen.reduce((acc, r) => acc + r._count, 0),
      totalProducidoExtrusion: resumen.find(r => r.area === 'Extrusion')?._sum.cantidadProducida || 0,
      totalProducidoSellado: resumen.find(r => r.area === 'Sellado')?._sum.cantidadProducida || 0,
      consumoMateriasPrimasExtrusion: consumoConsolidadoExtrusion,
      consumoPeletizados: Object.values(consumoPeletizadosDetalle),
    };

    return NextResponse.json({
      data: produccionesConMermas,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      resumenPorArea: resumen,
      totales,
      periodo,
      fechaInicio: fechaInicio.toISOString(),
    });
  } catch (error) {
    console.error('Error al obtener historial:', error);
    return NextResponse.json({ error: 'Error al obtener historial' }, { status: 500 });
  }
}
