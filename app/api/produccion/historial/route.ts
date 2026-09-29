import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { AreaProduccion, EstadoProduccion } from '@prisma/client';
import { authOptions } from '@/lib/auth-options';

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

      const kgExtrusion = kgBobinas + kgMermas;

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

    // Asegurar cálculo consolidado de mermaColor y mermaCristal por orden
    const produccionesConMermas = producciones.map((prod) => {
      const mermaColor = prod.registros && prod.registros.length > 0
        ? prod.registros.reduce((acc, r) => acc + ((r as any).mermaColor ?? r.mermaImpreso ?? 0), 0)
        : ((prod as any).mermaColor || 0);

      const mermaCristal = prod.registros && prod.registros.length > 0
        ? prod.registros.reduce((acc, r) => acc + ((r as any).mermaCristal ?? r.mermaSinImpresion ?? 0), 0)
        : ((prod as any).mermaCristal || 0);

      const mermaTotal = prod.registros && prod.registros.length > 0
        ? prod.registros.reduce((acc, r) => acc + (r.merma || (((r as any).mermaColor ?? r.mermaImpreso ?? 0) + ((r as any).mermaCristal ?? r.mermaSinImpresion ?? 0))), 0)
        : (prod.merma || (mermaColor + mermaCristal));

      return {
        ...prod,
        merma: mermaTotal,
        mermaColor,
        mermaCristal,
      };
    });

    // Calcular totales generales
    const totalMermaColor = produccionesConMermas.reduce((acc, p) => acc + (p.mermaColor || 0), 0);
    const totalMermaCristal = produccionesConMermas.reduce((acc, p) => acc + (p.mermaCristal || 0), 0);
    const totalMerma = resumen.reduce((acc, r) => acc + (r._sum.merma || 0), 0) || (totalMermaColor + totalMermaCristal);

    const totales = {
      totalProducido: resumen.reduce((acc, r) => acc + (r._sum.cantidadProducida || 0), 0),
      totalMerma,
      totalMermaColor,
      totalMermaCristal,
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
