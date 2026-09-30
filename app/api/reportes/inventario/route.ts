import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getReporteInventario } from '@/app/actions/reportes';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const categoria = searchParams.get('categoria');
    const fechaInicio = searchParams.get('fechaInicio') || searchParams.get('desde');
    const fechaFin = searchParams.get('fechaFin') || searchParams.get('hasta');
    const formato = searchParams.get('formato');

    const reportData = await getReporteInventario({
      fechaInicio,
      fechaFin,
      categoria,
    });

    if (formato === 'csv') {
      const csvLines: string[] = [];

      // Encabezado general
      csvLines.push('REPORTE DE ESTADO DE INVENTARIO Y MOVIMIENTOS');
      csvLines.push(`Periodo: ${fechaInicio || 'Inicio'} a ${fechaFin || 'Fin'}`);
      csvLines.push('');

      // Resumen de Totales
      csvLines.push('RESUMEN DE TOTALES');
      csvLines.push(`Total Articulos,${reportData.totales.totalItems}`);
      csvLines.push(`Valor Estimado Total,${reportData.totales.valorInventarioFormatted}`);
      csvLines.push(`Items en Stock Bajo / Critico,${reportData.totales.itemsStockBajo}`);
      csvLines.push(`Items en Nivel Optimo,${reportData.totales.itemsStockOptimo}`);
      csvLines.push(`Total Transacciones Kardex,${reportData.totales.totalMovimientos}`);
      csvLines.push(`Total Kilos Entrantes (+),${reportData.totales.kilosEntrantes} Kg`);
      csvLines.push(`Total Kilos Salientes (-),${reportData.totales.kilosSalientes} Kg`);
      csvLines.push(`Balance Neto Periodo,${reportData.totales.balanceNeto} Kg`);
      csvLines.push('');

      // Resumen por Categorias
      csvLines.push('RESUMEN POR CATEGORIA');
      csvLines.push('Categoria,Total Existencia,Unidad,Items Registrados,Items en Stock Bajo');
      csvLines.push(`Materia Prima Virgen,${reportData.consolidadoCategorias.materiaPrima.totalKg},Kg,${reportData.consolidadoCategorias.materiaPrima.itemsCount},${reportData.consolidadoCategorias.materiaPrima.stockBajoCount}`);
      csvLines.push(`Peletizado / Recuperado (Molido 1 al 5),${reportData.consolidadoCategorias.peletizado.totalKg},Kg,${reportData.consolidadoCategorias.peletizado.itemsCount},${reportData.consolidadoCategorias.peletizado.desglose.filter((i: any) => i.alerta).length}`);
      csvLines.push(`Aditivos & Masterbatch,${reportData.consolidadoCategorias.aditivos.totalKg},Kg,${reportData.consolidadoCategorias.aditivos.itemsCount},${reportData.consolidadoCategorias.aditivos.desglose.filter((i: any) => i.alerta).length}`);
      csvLines.push(`Producto Terminado,${reportData.consolidadoCategorias.productoTerminado.totalKg > 0 ? reportData.consolidadoCategorias.productoTerminado.totalKg : reportData.consolidadoCategorias.productoTerminado.totalUnidades},${reportData.consolidadoCategorias.productoTerminado.totalKg > 0 ? 'Kg' : 'Und'},${reportData.consolidadoCategorias.productoTerminado.itemsCount},0`);
      csvLines.push('');

      // Alertas de Stock Bajo
      csvLines.push('ALERTAS DE STOCK CRITICO');
      csvLines.push('Codigo,Articulo,Categoria,Stock Actual,Stock Minimo,Unidad,Deficit,Estado');
      reportData.alertasStockBajo.forEach((a: any) => {
        csvLines.push(`"${a.codigo}","${a.nombre}","${a.categoriaLabel}",${a.stockActual},${a.stockMinimo},"${a.unidad}",${a.diferencia},"${a.estado}"`);
      });
      if (reportData.alertasStockBajo.length === 0) {
        csvLines.push('No hay articulos en stock critico');
      }
      csvLines.push('');

      // Kardex de Movimientos
      csvLines.push('KARDEX DEL PERIODO (HISTORIAL DE ENTRADAS Y SALIDAS)');
      csvLines.push('Fecha,Codigo,Articulo,Categoria,Tipo,Cantidad,Unidad,Concepto / Motivo,Referencia,Responsable');
      reportData.kardex.movimientos.forEach((m: any) => {
        csvLines.push(`"${m.fechaFormatted}","${m.codigo}","${m.articulo}","${m.categoriaLabel}","${m.tipo}",${m.cantidad},"${m.unidad}","${m.concepto.replace(/"/g, '""')}","${m.referencia.replace(/"/g, '""')}","${m.responsable.replace(/"/g, '""')}"`);
      });
      if (reportData.kardex.movimientos.length === 0) {
        csvLines.push('No se registraron movimientos en este periodo');
      }
      csvLines.push('');

      // Listado Completo de Existencias
      csvLines.push('CATALOGO COMPLETO DE EXISTENCIAS');
      csvLines.push('Codigo,Articulo,Categoria,Stock Actual,Stock Minimo,Unidad,Costo Unitario,Valor Estimado,Estado');
      reportData.inventarios.forEach((i: any) => {
        csvLines.push(`"${i.codigo}","${i.nombre}","${i.categoriaLabel}",${i.cantidad},${i.stockMinimo},"${i.unidad}",${i.costo},${i.valorTotal},"${i.estadoStock}"`);
      });

      const csvContent = csvLines.join('\n');

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="reporte_inventario_${fechaInicio || 'periodo'}_${fechaFin || ''}.csv"`,
        },
      });
    }

    return NextResponse.json(reportData);
  } catch (error: any) {
    console.error('Error al obtener reporte de inventario:', error);
    return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 });
  }
}
