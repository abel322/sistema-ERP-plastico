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
            include: { cliente: true, productoCliente: true },
          },
          productoCliente: true,
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
          registros: {
            select: { cantidad: true },
          },
          productoCliente: true,
          pedido: {
            select: {
              productoCliente: true,
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

    const produccionesExtrusionPeriodo = (produccionesExtrusionRaw || []) as Array<{
      cantidadProducida: number;
      registros: Array<{ cantidad: number }>;
      productoCliente: any;
      pedido?: { productoCliente: any } | null;
    }>;

    produccionesExtrusionPeriodo.forEach((ord) => {
      const kgExtrusion = ord.registros && ord.registros.length > 0
        ? ord.registros.reduce((sum, r) => sum + (r.cantidad || 0), 0)
        : (ord.cantidadProducida || 0);

      const f = ord.productoCliente || ord.pedido?.productoCliente;
      if (!f || kgExtrusion <= 0) return;

      const molidoPct = Number(f.molido ?? f.formMolido ?? 0);
      consumoConsolidadoExtrusion.molido += kgExtrusion * (molidoPct / 100);
      consumoConsolidadoExtrusion.formFB7000 += kgExtrusion * ((Number(f.formFB7000) || 0) / 100);
      consumoConsolidadoExtrusion.form3003 += kgExtrusion * ((Number(f.form3003) || 0) / 100);
      consumoConsolidadoExtrusion.formLineal += kgExtrusion * ((Number(f.formLineal) || 0) / 100);
      consumoConsolidadoExtrusion.form0240 += kgExtrusion * ((Number(f.form0240) || 0) / 100);
      consumoConsolidadoExtrusion.form0348 += kgExtrusion * ((Number(f.form0348) || 0) / 100);
      consumoConsolidadoExtrusion.form7000F += kgExtrusion * ((Number(f.form7000F) || 0) / 100);
      consumoConsolidadoExtrusion.formDeslizante += kgExtrusion * ((Number(f.formDeslizante) || 0) / 100);
      consumoConsolidadoExtrusion.formMasterbachBlanco += kgExtrusion * ((Number(f.formMasterbachBlanco) || 0) / 100);
      consumoConsolidadoExtrusion.formMasterbachNegro += kgExtrusion * ((Number(f.formMasterbachNegro) || 0) / 100);
      consumoConsolidadoExtrusion.formMasterbachAzul += kgExtrusion * ((Number(f.formMasterbachAzul) || 0) / 100);
      consumoConsolidadoExtrusion.formMasterbachAmarillo += kgExtrusion * ((Number(f.formMasterbachAmarillo) || 0) / 100);
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
