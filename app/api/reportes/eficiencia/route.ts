import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { AreaProduccion, EstadoProduccion, EstadoMantenimiento } from '@prisma/client';
import { authOptions } from '@/lib/auth-options';


export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const maquinaId = searchParams.get('maquinaId');
    const area = searchParams.get('area') as AreaProduccion | null;
    const fechaInicio = searchParams.get('fechaInicio');
    const fechaFin = searchParams.get('fechaFin');

    // Filtros
    const whereProduccion: Record<string, unknown> = {
      estado: EstadoProduccion.Finalizado
    };
    const wherePeletizado: Record<string, unknown> = {};
    const whereMaquina: Record<string, unknown> = {};

    if (maquinaId) {
      whereProduccion.maquinaId = maquinaId;
      wherePeletizado.maquinaId = maquinaId;
      whereMaquina.id = maquinaId;
    }
    if (area) {
      whereProduccion.area = area;
      whereMaquina.area = area;
    }
    if (fechaInicio || fechaFin) {
      const fechaFilter: Record<string, Date> = {};
      if (fechaInicio) fechaFilter.gte = new Date(fechaInicio);
      if (fechaFin) fechaFilter.lte = new Date(fechaFin);
      whereProduccion.fecha = fechaFilter;
      wherePeletizado.fecha = fechaFilter;
    }

    // Obtener máquinas
    const maquinas = await prisma.maquina.findMany({
      where: whereMaquina,
      include: {
        producciones: { where: whereProduccion },
        peletizados: { where: wherePeletizado },
        mantenimientos: {
          where: { estado: { in: [EstadoMantenimiento.Completado, EstadoMantenimiento.Programado] } },
          orderBy: { fechaProgramada: 'desc' },
          take: 10
        }
      }
    });

    // Calcular eficiencia por máquina
    const eficienciaPorMaquina = maquinas.map(m => {
      const totalProducido = m.producciones.reduce((acc, p) => acc + p.cantidadProducida, 0);
      const totalMerma = m.producciones.reduce((acc, p) => acc + p.merma, 0);
      const totalEntrada = totalProducido + totalMerma;
      const eficienciaProduccion = totalEntrada > 0 ? (totalProducido / totalEntrada) * 100 : 0;

      const totalEntradaPelet = m.peletizados.reduce((acc, p) => acc + p.materialEntrada, 0);
      const totalSalidaPelet = m.peletizados.reduce((acc, p) => acc + p.materialSalida, 0);
      const eficienciaPeletizado = totalEntradaPelet > 0 ? (totalSalidaPelet / totalEntradaPelet) * 100 : 0;

      const mantenimientosCompletados = m.mantenimientos.filter(mt => mt.estado === EstadoMantenimiento.Completado).length;
      const mantenimientosProgramados = m.mantenimientos.filter(mt => mt.estado === EstadoMantenimiento.Programado).length;
      const costoMantenimiento = m.mantenimientos
        .filter(mt => mt.estado === EstadoMantenimiento.Completado)
        .reduce((acc, mt) => acc + (mt.costo || 0), 0);

      return {
        id: m.id,
        nombre: m.nombre,
        area: m.area,
        activa: m.activa,
        produccion: {
          registros: m.producciones.length,
          totalProducido,
          totalMerma,
          eficiencia: eficienciaProduccion.toFixed(2)
        },
        peletizado: {
          registros: m.peletizados.length,
          totalEntrada: totalEntradaPelet,
          totalSalida: totalSalidaPelet,
          eficiencia: eficienciaPeletizado.toFixed(2)
        },
        mantenimiento: {
          completados: mantenimientosCompletados,
          programados: mantenimientosProgramados,
          costoTotal: costoMantenimiento
        }
      };
    });

    // Eficiencia por área
    const eficienciaPorArea: Record<string, { produccion: number; merma: number; eficiencia: string }> = {};
    for (const areaVal of Object.values(AreaProduccion)) {
      const maquinasArea = eficienciaPorMaquina.filter(m => m.area === areaVal);
      const totalProd = maquinasArea.reduce((acc, m) => acc + m.produccion.totalProducido, 0);
      const totalMerma = maquinasArea.reduce((acc, m) => acc + m.produccion.totalMerma, 0);
      const totalEntrada = totalProd + totalMerma;
      eficienciaPorArea[areaVal] = {
        produccion: totalProd,
        merma: totalMerma,
        eficiencia: totalEntrada > 0 ? ((totalProd / totalEntrada) * 100).toFixed(2) : '0'
      };
    }

    // Totales generales
    const totales = {
      totalMaquinas: maquinas.length,
      maquinasActivas: maquinas.filter(m => m.activa).length,
      produccionTotal: eficienciaPorMaquina.reduce((acc, m) => acc + m.produccion.totalProducido, 0),
      mermaTotal: eficienciaPorMaquina.reduce((acc, m) => acc + m.produccion.totalMerma, 0),
      eficienciaGeneral: (() => {
        const totalProd = eficienciaPorMaquina.reduce((acc, m) => acc + m.produccion.totalProducido, 0);
        const totalMerma = eficienciaPorMaquina.reduce((acc, m) => acc + m.produccion.totalMerma, 0);
        const total = totalProd + totalMerma;
        return total > 0 ? ((totalProd / total) * 100).toFixed(2) : '0';
      })(),
      costoMantenimientoTotal: eficienciaPorMaquina.reduce((acc, m) => acc + m.mantenimiento.costoTotal, 0)
    };

    return NextResponse.json({
      eficienciaPorMaquina,
      eficienciaPorArea,
      totales
    });
  } catch (error) {
    console.error('Error al obtener reporte de eficiencia:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
