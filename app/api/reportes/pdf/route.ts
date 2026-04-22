import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const dynamic = 'force-dynamic';

const generateHTML = (tipo: string, data: any, periodo: { inicio: string; fin: string }) => {
  const headerStyle = `
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #333; }
      .header { border-bottom: 3px solid #1e40af; padding-bottom: 20px; margin-bottom: 30px; }
      .logo { font-size: 28px; font-weight: bold; color: #1e40af; }
      .subtitle { color: #6b7280; font-size: 14px; margin-top: 5px; }
      .title { font-size: 22px; color: #1e40af; margin: 20px 0; }
      .periodo { background: #f3f4f6; padding: 10px 15px; border-radius: 6px; margin-bottom: 20px; font-size: 14px; }
      .stats { display: flex; gap: 20px; margin-bottom: 30px; flex-wrap: wrap; }
      .stat-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px 20px; min-width: 150px; }
      .stat-value { font-size: 24px; font-weight: bold; color: #1e40af; }
      .stat-label { font-size: 12px; color: #6b7280; margin-top: 5px; }
      table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
      th { background: #1e40af; color: white; padding: 12px 10px; text-align: left; }
      td { padding: 10px; border-bottom: 1px solid #e2e8f0; }
      tr:nth-child(even) { background: #f8fafc; }
      .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #6b7280; text-align: center; }
      .section-title { font-size: 16px; font-weight: 600; color: #374151; margin: 25px 0 15px; }
    </style>
  `;

  const header = `
    <div class="header">
      <div class="logo">ERP Plásticos</div>
      <div class="subtitle">Sistema de Gestión Empresarial</div>
    </div>
    <div class="periodo">Período: ${periodo.inicio || 'Sin definir'} al ${periodo.fin || 'Sin definir'}</div>
  `;

  const footer = `
    <div class="footer">
      Generado el ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })} | ERP Plásticos © ${new Date().getFullYear()}
    </div>
  `;

  switch (tipo) {
    case 'produccion':
      return `
        <!DOCTYPE html><html><head>${headerStyle}</head><body>
        ${header}
        <h1 class="title">Reporte de Producción</h1>
        <div class="stats">
          <div class="stat-card"><div class="stat-value">${data.totales?.cantidadProducida?.toLocaleString() || 0}</div><div class="stat-label">Total Producido</div></div>
          <div class="stat-card"><div class="stat-value">${data.totales?.merma?.toLocaleString() || 0}</div><div class="stat-label">Total Merma</div></div>
          <div class="stat-card"><div class="stat-value">${data.totales?.registros || 0}</div><div class="stat-label">Registros</div></div>
          <div class="stat-card"><div class="stat-value">${data.totales?.cantidadProducida > 0 ? ((data.totales.merma / data.totales.cantidadProducida) * 100).toFixed(1) : 0}%</div><div class="stat-label">% Merma</div></div>
        </div>
        <h2 class="section-title">Resumen por Área</h2>
        <table>
          <thead><tr><th>Área</th><th>Cantidad</th><th>Merma</th><th>Registros</th></tr></thead>
          <tbody>${data.porArea?.map((a: any) => `<tr><td>${a.area}</td><td>${a.cantidadProducida.toLocaleString()}</td><td>${a.merma.toLocaleString()}</td><td>${a.registros}</td></tr>`).join('') || ''}</tbody>
        </table>
        <h2 class="section-title">Detalle de Producción</h2>
        <table>
          <thead><tr><th>Fecha</th><th>Turno</th><th>Área</th><th>Máquina</th><th>Operario</th><th>Cantidad</th><th>Merma</th></tr></thead>
          <tbody>${data.producciones?.slice(0, 50).map((p: any) => `<tr><td>${format(new Date(p.fecha), 'dd/MM/yyyy')}</td><td>${p.turno}</td><td>${p.area}</td><td>${p.maquina?.nombre || '-'}</td><td>${p.operario}</td><td>${p.cantidadProducida.toLocaleString()}</td><td>${p.merma}</td></tr>`).join('') || ''}</tbody>
        </table>
        ${footer}
        </body></html>
      `;

    case 'ventas':
      return `
        <!DOCTYPE html><html><head>${headerStyle}</head><body>
        ${header}
        <h1 class="title">Reporte de Ventas</h1>
        <div class="stats">
          <div class="stat-card"><div class="stat-value">Bs. ${data.totales?.total?.toLocaleString() || 0}</div><div class="stat-label">Total Ventas</div></div>
          <div class="stat-card"><div class="stat-value">${data.totales?.facturas || 0}</div><div class="stat-label">Facturas</div></div>
          <div class="stat-card"><div class="stat-value">${data.totales?.pagadas || 0}</div><div class="stat-label">Pagadas</div></div>
          <div class="stat-card"><div class="stat-value">Bs. ${data.totales?.iva?.toLocaleString() || 0}</div><div class="stat-label">IVA Total</div></div>
        </div>
        <h2 class="section-title">Ventas por Cliente</h2>
        <table>
          <thead><tr><th>Cliente</th><th>Facturas</th><th>Total</th></tr></thead>
          <tbody>${data.porCliente?.slice(0, 10).map((c: any) => `<tr><td>${c.cliente}</td><td>${c.facturas}</td><td>Bs. ${c.total.toLocaleString()}</td></tr>`).join('') || ''}</tbody>
        </table>
        <h2 class="section-title">Detalle de Facturas</h2>
        <table>
          <thead><tr><th>Número</th><th>Fecha</th><th>Cliente</th><th>Subtotal</th><th>IVA</th><th>Total</th><th>Estado</th></tr></thead>
          <tbody>${data.facturas?.slice(0, 50).map((f: any) => `<tr><td>${f.numero}</td><td>${format(new Date(f.fecha), 'dd/MM/yyyy')}</td><td>${f.cliente?.nombre || '-'}</td><td>Bs. ${f.subtotal.toLocaleString()}</td><td>Bs. ${f.iva.toLocaleString()}</td><td>Bs. ${f.total.toLocaleString()}</td><td>${f.estado}</td></tr>`).join('') || ''}</tbody>
        </table>
        ${footer}
        </body></html>
      `;

    case 'inventario':
      return `
        <!DOCTYPE html><html><head>${headerStyle}</head><body>
        ${header}
        <h1 class="title">Reporte de Inventario</h1>
        <div class="stats">
          <div class="stat-card"><div class="stat-value">${data.totales?.items || 0}</div><div class="stat-label">Total Items</div></div>
          <div class="stat-card"><div class="stat-value">Bs. ${data.totales?.valorTotal?.toLocaleString() || 0}</div><div class="stat-label">Valor Total</div></div>
          <div class="stat-card"><div class="stat-value">${data.totales?.itemsStockBajo || 0}</div><div class="stat-label">Stock Bajo</div></div>
        </div>
        <h2 class="section-title">Resumen por Categoría</h2>
        <table>
          <thead><tr><th>Categoría</th><th>Items</th><th>Valor Total</th></tr></thead>
          <tbody>${data.porCategoria?.map((c: any) => `<tr><td>${c.categoria}</td><td>${c.items}</td><td>Bs. ${c.valorTotal.toLocaleString()}</td></tr>`).join('') || ''}</tbody>
        </table>
        <h2 class="section-title">Detalle de Inventario</h2>
        <table>
          <thead><tr><th>Código</th><th>Nombre</th><th>Categoría</th><th>Stock</th><th>Mínimo</th><th>Unidad</th><th>Costo</th><th>Valor</th></tr></thead>
          <tbody>${data.inventario?.slice(0, 50).map((i: any) => `<tr><td>${i.codigo}</td><td>${i.nombre}</td><td>${i.categoria}</td><td>${i.cantidad}</td><td>${i.stockMinimo}</td><td>${i.unidad}</td><td>Bs. ${i.costo || 0}</td><td>Bs. ${(i.cantidad * (i.costo || 0)).toLocaleString()}</td></tr>`).join('') || ''}</tbody>
        </table>
        ${footer}
        </body></html>
      `;

    default:
      return '<html><body><h1>Tipo de reporte no válido</h1></body></html>';
  }
};

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { tipo, fechaInicio, fechaFin, filtros } = await request.json();

    // Obtener datos según el tipo
    let reportData;
    const baseUrl = process.env.NEXTAUTH_URL || request.headers.get('origin') || '';
    
    const params = new URLSearchParams();
    if (fechaInicio) params.set('fechaInicio', fechaInicio);
    if (fechaFin) params.set('fechaFin', fechaFin);
    if (filtros?.area) params.set('area', filtros.area);
    if (filtros?.categoria) params.set('categoria', filtros.categoria);

    const res = await fetch(`${baseUrl}/api/reportes/${tipo}?${params.toString()}`, {
      headers: { cookie: request.headers.get('cookie') || '' },
    });
    reportData = await res.json();

    const html_content = generateHTML(tipo, reportData, { inicio: fechaInicio, fin: fechaFin });

    // Crear solicitud PDF
    const createResponse = await fetch('https://apps.abacus.ai/api/createConvertHtmlToPdfRequest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deployment_token: process.env.ABACUSAI_API_KEY,
        html_content,
        pdf_options: { format: 'A4', margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' } },
      }),
    });

    if (!createResponse.ok) {
      return NextResponse.json({ error: 'Error al crear solicitud PDF' }, { status: 500 });
    }

    const { request_id } = await createResponse.json();

    // Polling
    const maxAttempts = 60;
    let attempts = 0;

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const statusResponse = await fetch('https://apps.abacus.ai/api/getConvertHtmlToPdfStatus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_id, deployment_token: process.env.ABACUSAI_API_KEY }),
      });

      const statusResult = await statusResponse.json();
      
      if (statusResult?.status === 'SUCCESS' && statusResult?.result?.result) {
        const pdfBuffer = Buffer.from(statusResult.result.result, 'base64');
        return new NextResponse(pdfBuffer, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="reporte_${tipo}_${format(new Date(), 'yyyy-MM-dd')}.pdf"`,
          },
        });
      } else if (statusResult?.status === 'FAILED') {
        return NextResponse.json({ error: 'Error al generar PDF' }, { status: 500 });
      }
      attempts++;
    }

    return NextResponse.json({ error: 'Tiempo de espera agotado' }, { status: 500 });
  } catch (error) {
    console.error('Error generando PDF:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
