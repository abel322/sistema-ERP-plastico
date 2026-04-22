import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { AreaProduccion, EstadoProduccion } from '@prisma/client';
import { authOptions } from '@/lib/auth-options';


export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const area = searchParams.get('area') as AreaProduccion | null;
    const maquinaId = searchParams.get('maquinaId');
    const fechaInicio = searchParams.get('fechaInicio');
    const fechaFin = searchParams.get('fechaFin');

    const where: Record<string, unknown> = {
      estado: EstadoProduccion.Finalizado
    };
    
    if (area) where.area = area;
    if (maquinaId) where.maquinaId = maquinaId;
    if (fechaInicio || fechaFin) {
      where.fecha = {};
      if (fechaInicio) (where.fecha as Record<string, Date>).gte = new Date(fechaInicio);
      if (fechaFin) (where.fecha as Record<string, Date>).lte = new Date(fechaFin);
    }

    // Obtener producciones
    const producciones = await prisma.produccion.findMany({
      where,
      include: {
        maquina: true,
        pedido: { include: { cliente: true } }
      },
      orderBy: { fecha: 'desc' }
    });

    // Resumen por área
    const resumenPorArea: Record<string, { total: number; merma: number; count: number }> = {};
    for (const area of Object.values(AreaProduccion)) {
      const prodsArea = producciones.filter(p => p.area === area);
      resumenPorArea[area] = {
        total: prodsArea.reduce((acc, p) => acc + p.cantidadProducida, 0),
        merma: prodsArea.reduce((acc, p) => acc + p.merma, 0),
        count: prodsArea.length
      };
    }

    // Resumen por máquina
    const maquinasMap = new Map<string, { nombre: string; total: number; merma: number; count: number }>();
    producciones.forEach(p => {
      const current = maquinasMap.get(p.maquinaId) || { nombre: p.maquina.nombre, total: 0, merma: 0, count: 0 };
      current.total += p.cantidadProducida;
      current.merma += p.merma;
      current.count += 1;
      maquinasMap.set(p.maquinaId, current);
    });
    const resumenPorMaquina = Array.from(maquinasMap.entries()).map(([id, data]) => ({ id, ...data }));

    // Producción por día (últimos 30 días)
    const produccionPorDia: Record<string, number> = {};
    producciones.forEach(p => {
      const dia = p.fecha.toISOString().split('T')[0];
      produccionPorDia[dia] = (produccionPorDia[dia] || 0) + p.cantidadProducida;
    });

    // Totales generales
    const totales = {
      produccion: producciones.reduce((acc, p) => acc + p.cantidadProducida, 0),
      merma: producciones.reduce((acc, p) => acc + p.merma, 0),
      registros: producciones.length,
      eficiencia: producciones.length > 0
        ? ((producciones.reduce((acc, p) => acc + p.cantidadProducida, 0) / 
            (producciones.reduce((acc, p) => acc + p.cantidadProducida + p.merma, 0))) * 100).toFixed(2)
        : 0
    };

    return NextResponse.json({
      producciones,
      resumenPorArea,
      resumenPorMaquina,
      produccionPorDia,
      totales
    });
  } catch (error) {
    console.error('Error al obtener reporte de producción:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
