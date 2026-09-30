import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getReporteProduccion } from '@/app/actions/reportes';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const area = searchParams.get('area');
    const maquinaId = searchParams.get('maquinaId');
    const clienteId = searchParams.get('clienteId');
    const fechaInicio = searchParams.get('fechaInicio');
    const fechaFin = searchParams.get('fechaFin');
    const formato = searchParams.get('formato');

    const reportData = await getReporteProduccion({
      fechaInicio,
      fechaFin,
      area,
      clienteId,
      maquinaId,
    });

    if (formato === 'csv') {
      const headers = [
        'Fecha',
        'Turno',
        'Area',
        'Maquina',
        'Orden / Lote',
        'Producto',
        'Cliente',
        'Cantidad Producida',
        'Unidad',
        'Merma Total (KG)',
        'Molido 1 (Alta)',
        'Molido 2 (Pollo)',
        'Molido 3 (Color)',
        'Molido 4 (Baja)',
        'Molido 5 (Pego)',
        'Operario',
      ];

      const rows = reportData.producciones.map(p => [
        p.fechaFormatted,
        p.turno,
        p.area,
        p.maquina,
        p.orden,
        p.producto,
        p.cliente,
        p.cantidadProducida,
        p.unidad,
        p.merma,
        p.mermas.molido1,
        p.mermas.molido2,
        p.mermas.molido3,
        p.mermas.molido4,
        p.mermas.molido5,
        p.operario,
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')),
      ].join('\n');

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="reporte_produccion_${fechaInicio || 'periodo'}_${fechaFin || ''}.csv"`,
        },
      });
    }

    return NextResponse.json(reportData);
  } catch (error: any) {
    console.error('Error al obtener reporte de producción:', error);
    return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 });
  }
}
