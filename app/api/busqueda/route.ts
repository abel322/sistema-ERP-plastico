import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.trim();

  if (!query || query.length < 2) {
    return NextResponse.json({ resultados: [] });
  }

  try {
    const resultados: any[] = [];

    // Buscar clientes
    const clientes = await prisma.cliente.findMany({
      where: {
        OR: [
          { nombre: { contains: query, mode: 'insensitive' } },
          { rif: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 5,
      select: { id: true, nombre: true, rif: true },
    });
    clientes.forEach((c: any) => resultados.push({
      id: c.id,
      tipo: 'cliente',
      titulo: c.nombre,
      subtitulo: `RIF: ${c.rif}`,
      url: `/clientes?search=${encodeURIComponent(c.nombre)}`,
    }));

    // Buscar pedidos
    const pedidos = await prisma.pedido.findMany({
      where: {
        OR: [
          { observaciones: { contains: query, mode: 'insensitive' } },
          { cliente: { nombre: { contains: query, mode: 'insensitive' } } },
        ],
      },
      take: 5,
      include: { cliente: { select: { nombre: true } } },
    });
    pedidos.forEach((p: any) => resultados.push({
      id: p.id,
      tipo: 'pedido',
      titulo: `Pedido - ${p.cliente?.nombre || 'N/A'}`,
      subtitulo: `${p.cantidadSolicitada} ${p.unidad} - ${p.estado}`,
      url: `/pedidos/${p.id}/editar`,
    }));

    // Buscar facturas
    const facturas = await prisma.factura.findMany({
      where: {
        OR: [
          { numero: { contains: query, mode: 'insensitive' } },
          { cliente: { nombre: { contains: query, mode: 'insensitive' } } },
        ],
      },
      take: 5,
      include: { cliente: { select: { nombre: true } } },
    });
    facturas.forEach((f: any) => resultados.push({
      id: f.id,
      tipo: 'factura',
      titulo: `Factura ${f.numero}`,
      subtitulo: `${f.cliente?.nombre || 'N/A'} - Bs. ${f.total.toLocaleString()}`,
      url: `/facturas/${f.id}`,
    }));

    // Buscar inventario
    const inventario = await prisma.inventario.findMany({
      where: {
        OR: [
          { nombre: { contains: query, mode: 'insensitive' } },
          { codigo: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 5,
      select: { id: true, nombre: true, codigo: true, cantidad: true, unidad: true },
    });
    inventario.forEach((i: any) => resultados.push({
      id: i.id,
      tipo: 'inventario',
      titulo: i.nombre,
      subtitulo: `Código: ${i.codigo} - Stock: ${i.cantidad} ${i.unidad}`,
      url: `/inventario?search=${encodeURIComponent(i.nombre)}`,
    }));

    // Buscar proveedores
    const proveedores = await prisma.proveedor.findMany({
      where: {
        OR: [
          { nombre: { contains: query, mode: 'insensitive' } },
          { rif: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 5,
      select: { id: true, nombre: true, rif: true },
    });
    proveedores.forEach((p: any) => resultados.push({
      id: p.id,
      tipo: 'proveedor',
      titulo: p.nombre,
      subtitulo: `RIF: ${p.rif}`,
      url: `/proveedores?search=${encodeURIComponent(p.nombre)}`,
    }));

    return NextResponse.json({ resultados: resultados.slice(0, 15) });
  } catch (error) {
    console.error('Error en búsqueda:', error);
    return NextResponse.json({ error: 'Error en búsqueda' }, { status: 500 });
  }
}
