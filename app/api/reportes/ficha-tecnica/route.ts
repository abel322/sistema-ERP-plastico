import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const productoId = searchParams.get('productoId');

    if (!productoId) {
      return NextResponse.json({ error: 'ID de producto requerido' }, { status: 400 });
    }

    const producto = await prisma.productoCliente.findUnique({
      where: { id: productoId },
      include: {
        cliente: true
      }
    });

    if (!producto) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }

    const formato = searchParams.get('formato');

    if (formato === 'csv') {
      const headers = [
        'Campo', 'Valor'
      ];
      const rows = [
        ['Nombre Producto', producto.nombreProducto],
        ['Código Producto', producto.codigoProducto || 'N/A'],
        ['Cliente', producto.cliente?.nombre || 'N/A'],
        ['Tipo Producto', producto.tipoProducto],
        ['Material', producto.material || 'N/A'],
        ['Ancho (cm)', producto.ancho || '-'],
        ['Largo (cm)', producto.largo || '-'],
        ['Calibre (µ)', producto.calibre || '-'],
        ['Peso (g)', producto.pesoPorUnidad || '-'],
        ['Unidad Venta', producto.unidadVenta],
        ['Lleva Impresión', producto.conImpresion ? 'SÍ' : 'NO'],
        ['Lleva Pigmento', producto.conPigmento ? 'SÍ' : 'NO'],
        ['Máquina Extrusora', producto.extMaquinaExtrusora || 'N/A'],
      ];

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename=ficha_tecnica_${productoId}.csv`
        }
      });
    }

    return NextResponse.json(producto);
  } catch (error) {
    console.error('Error al obtener datos para ficha técnica:', error);
    return NextResponse.json(
      { error: 'Error al obtener datos' },
      { status: 500 }
    );
  }
}
