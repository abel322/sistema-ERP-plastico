import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { EstadoFactura, EstadoDespacho } from '@prisma/client';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';



export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const clienteId = searchParams.get('clienteId');
    const fechaInicio = searchParams.get('fechaInicio');
    const fechaFin = searchParams.get('fechaFin');

    const whereFacturas: Record<string, unknown> = {
      estado: { in: [EstadoFactura.Emitida, EstadoFactura.Pagada] }
    };
    const whereDespachos: Record<string, unknown> = {
      estado: EstadoDespacho.Entregado
    };
    
    if (clienteId) {
      whereFacturas.clienteId = clienteId;
      whereDespachos.clienteId = clienteId;
    }
    if (fechaInicio || fechaFin) {
      whereFacturas.fecha = {};
      whereDespachos.fecha = {};
      if (fechaInicio) {
        (whereFacturas.fecha as Record<string, Date>).gte = new Date(fechaInicio);
        (whereDespachos.fecha as Record<string, Date>).gte = new Date(fechaInicio);
      }
      if (fechaFin) {
        (whereFacturas.fecha as Record<string, Date>).lte = new Date(fechaFin);
        (whereDespachos.fecha as Record<string, Date>).lte = new Date(fechaFin);
      }
    }

    // Facturas
    const facturas = await prisma.factura.findMany({
      where: whereFacturas,
      include: {
        cliente: true,
        detalles: true
      },
      orderBy: { fecha: 'desc' }
    });

    // Despachos entregados
    const despachos = await prisma.despacho.findMany({
      where: whereDespachos,
      include: {
        cliente: true,
        pedido: true
      },
      orderBy: { fecha: 'desc' }
    });

    // Ventas por cliente
    const ventasPorCliente = new Map<string, { nombre: string; totalFacturado: number; totalDespachado: number; facturas: number; despachos: number }>();
    
    facturas.forEach(f => {
      const current = ventasPorCliente.get(f.clienteId) || { 
        nombre: f.cliente.nombre, 
        totalFacturado: 0, 
        totalDespachado: 0, 
        facturas: 0, 
        despachos: 0 
      };
      current.totalFacturado += f.total;
      current.facturas += 1;
      ventasPorCliente.set(f.clienteId, current);
    });

    despachos.forEach(d => {
      const current = ventasPorCliente.get(d.clienteId) || { 
        nombre: d.cliente.nombre, 
        totalFacturado: 0, 
        totalDespachado: 0, 
        facturas: 0, 
        despachos: 0 
      };
      current.totalDespachado += d.cantidadDespachada;
      current.despachos += 1;
      ventasPorCliente.set(d.clienteId, current);
    });

    // Ventas por mes
    const ventasPorMes: Record<string, { facturado: number; pagado: number }> = {};
    facturas.forEach(f => {
      const mes = f.fecha.toISOString().slice(0, 7);
      if (!ventasPorMes[mes]) ventasPorMes[mes] = { facturado: 0, pagado: 0 };
      ventasPorMes[mes].facturado += f.total;
      if (f.estado === EstadoFactura.Pagada) {
        ventasPorMes[mes].pagado += f.total;
      }
    });

    // Totales
    const totales = {
      totalFacturado: facturas.reduce((acc, f) => acc + f.total, 0),
      totalPagado: facturas.filter(f => f.estado === EstadoFactura.Pagada).reduce((acc, f) => acc + f.total, 0),
      totalPendiente: facturas.filter(f => f.estado === EstadoFactura.Emitida).reduce((acc, f) => acc + f.total, 0),
      cantidadFacturas: facturas.length,
      cantidadDespachos: despachos.length,
      totalDespachado: despachos.reduce((acc, d) => acc + d.cantidadDespachada, 0)
    };

    return NextResponse.json({
      facturas,
      despachos,
      ventasPorCliente: Array.from(ventasPorCliente.entries()).map(([id, data]) => ({ id, ...data })),
      ventasPorMes,
      totales
    });
  } catch (error) {
    console.error('Error al obtener reporte de ventas:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
