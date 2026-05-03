import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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

    case 'ficha-tecnica':
      return `
        <!DOCTYPE html><html><head>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 30px; color: #1e293b; background: #fff; line-height: 1.4; }
          .header-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; border: 2px solid #1e40af; }
          .header-table td { padding: 10px; border: 1px solid #cbd5e1; }
          .logo-cell { width: 25%; text-align: center; }
          .title-cell { width: 50%; text-align: center; font-size: 24px; font-weight: 800; color: #1e40af; text-transform: uppercase; }
          .info-cell { width: 25%; font-size: 10px; color: #64748b; }
          
          .section { margin-bottom: 20px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
          .section-header { background: #1e40af; color: white; padding: 8px 15px; font-size: 14px; font-weight: 700; text-transform: uppercase; display: flex; align-items: center; gap: 10px; }
          .section-content { padding: 15px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
          
          .data-item { display: flex; flex-direction: column; }
          .data-label { font-size: 9px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 2px; }
          .data-value { font-size: 12px; font-weight: 600; color: #1e293b; }
          
          .grid-3 { grid-template-columns: repeat(3, 1fr); }
          .grid-4 { grid-template-columns: repeat(4, 1fr); }
          .span-2 { grid-column: span 2; }
          
          .formulation-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 5px; }
          .form-tag { background: #f1f5f9; border: 1px solid #e2e8f0; padding: 5px; border-radius: 4px; text-align: center; }
          .form-label { font-size: 8px; color: #64748b; display: block; }
          .form-val { font-size: 11px; font-weight: 700; color: #1e40af; }
          
          .colors-flex { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 5px; }
          .color-tag { border: 1px solid #e2e8f0; padding: 4px 10px; border-radius: 4px; font-size: 10px; font-weight: 600; background: #f8fafc; }
          
          .footer-info { margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 15px; text-align: center; font-size: 9px; color: #94a3b8; }
          @media print { .no-print { display: none; } }
        </style>
        </head><body>
        
        <table class="header-table">
          <tr>
            <td class="logo-cell"><h2 style="color: #1e40af; font-weight: 900;">ERP</h2><p style="font-size: 8px; font-weight: 700;">INDUSTRIAL</p></td>
            <td class="title-cell">Ficha Técnica de Producto</td>
            <td class="info-cell">
              <strong>Código:</strong> FT-${data.codigoProducto || data.id.slice(0, 8)}<br>
              <strong>Emisión:</strong> ${format(new Date(), 'dd/MM/yyyy')}<br>
              <strong>Versión:</strong> 1.0
            </td>
          </tr>
        </table>

        <div class="section">
          <div class="section-header">Identificación del Producto</div>
          <div class="section-content grid-3">
            <div class="data-item span-2"><span class="data-label">Nombre del Producto</span><span class="data-value">${data.nombreProducto}</span></div>
            <div class="data-item"><span class="data-label">Tipo</span><span class="data-value">${data.tipoProducto}</span></div>
            <div class="data-item span-2"><span class="data-label">Cliente</span><span class="data-value">${data.cliente?.nombre || 'N/A'}</span></div>
            <div class="data-item"><span class="data-label">RIF Cliente</span><span class="data-value">${data.cliente?.rif || 'N/A'}</span></div>
          </div>
        </div>

        <div class="section">
          <div class="section-header">Especificaciones Físicas y Dimensiones</div>
          <div class="section-content grid-4">
            <div class="data-item"><span class="data-label">Ancho</span><span class="data-value">${data.ancho ? data.ancho + ' cm' : '-'}</span></div>
            <div class="data-item"><span class="data-label">Largo</span><span class="data-value">${data.largo ? data.largo + ' cm' : '-'}</span></div>
            <div class="data-item"><span class="data-label">Calibre</span><span class="data-value">${data.calibre ? data.calibre + ' µ' : '-'}</span></div>
            <div class="data-item"><span class="data-label">Material</span><span class="data-value">${data.material || '-'}</span></div>
            
            <div class="data-item"><span class="data-label">Peso x Unidad</span><span class="data-value">${data.pesoPorUnidad ? data.pesoPorUnidad + ' g' : '-'}</span></div>
            <div class="data-item"><span class="data-label">Unidad Venta</span><span class="data-value">${data.unidadVenta}</span></div>
            <div class="data-item"><span class="data-label">Impresión</span><span class="data-value">${data.conImpresion ? 'SÍ' : 'NO'}</span></div>
            <div class="data-item"><span class="data-label">Pigmento</span><span class="data-value">${data.conPigmento ? 'SÍ' : 'NO'}</span></div>
            
            ${data.tipoProducto === 'Bobina' ? `
              <div class="data-item"><span class="data-label">Ancho Bobina</span><span class="data-value">${data.anchoBobina ? data.anchoBobina + ' cm' : '-'}</span></div>
              <div class="data-item"><span class="data-label">Peso Máx Bobina</span><span class="data-value">${data.pesoMaximoBobina ? data.pesoMaximoBobina + ' kg' : '-'}</span></div>
              <div class="data-item"><span class="data-label">Tipo Bobina</span><span class="data-value">${data.tipoBobinaCliente || '-'}</span></div>
              <div class="data-item"><span class="data-label">Muleteado</span><span class="data-value">${data.muleteado ? 'SÍ' : 'NO'}</span></div>
            ` : `
              <div class="data-item"><span class="data-label">Tipo Sellado</span><span class="data-value">${data.tipoSellado || '-'}</span></div>
              <div class="data-item"><span class="data-label">Estructura</span><span class="data-value">${data.tipoSelladoEstructura || '-'}</span></div>
              <div class="data-item"><span class="data-label">Bolsas x Rollo</span><span class="data-value">${data.bolsasPorRollo || '-'}</span></div>
              <div class="data-item"><span class="data-label">Rollos x Bulto</span><span class="data-value">${data.rollosPorBulto || '-'}</span></div>
            `}
          </div>
        </div>

        ${data.conImpresion ? `
          <div class="section">
            <div class="section-header">Parámetros de Serigrafía e Impresión</div>
            <div class="section-content grid-3">
              <div class="data-item"><span class="data-label">Tipo Impresión</span><span class="data-value">${data.tipoImpresion || '-'}</span></div>
              <div class="data-item"><span class="data-label">Cilindro</span><span class="data-value">${data.cilindro || '-'}</span></div>
              <div class="data-item"><span class="data-label">Repeticiones</span><span class="data-value">${data.repeticionesImagen || '-'}</span></div>
              <div class="data-item span-2">
                <span class="data-label">Colores de Impresión</span>
                <div class="colors-flex">
                  ${[1,2,3,4,5,6].map(i => data[`color${i}`] ? `<span class="color-tag">C${i}: ${data[`color${i}`]}</span>` : '').join('')}
                </div>
              </div>
              <div class="data-item"><span class="data-label">Tratador Serigrafía</span><span class="data-value">${data.serigrafiaTratadorIntensidad || '-'}</span></div>
            </div>
          </div>
        ` : ''}

        <div class="section">
          <div class="section-header">Formulación de Mezcla (%)</div>
          <div class="section-content">
            <div class="data-item span-2">
              <div class="formulation-grid">
                ${[
                  {k: 'formFB7000', l: 'FB7000'}, {k: 'form3003', l: '3003'}, {k: 'formLineal', l: 'Lineal'}, {k: 'form0240', l: '0240'},
                  {k: 'form0348', l: '0348'}, {k: 'form7000F', l: '7000F'}, {k: 'formDeslizante', l: 'Deslizante'}, {k: 'formMasterbachBlanco', l: 'MB Blanco'}
                ].map(f => data[f.k] ? `
                  <div class="form-tag"><span class="form-label">${f.l}</span><span class="form-val">${data[f.k]}%</span></div>
                ` : '').join('')}
              </div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-header">Parámetros de Extrusión</div>
          <div class="section-content grid-4">
            <div class="data-item"><span class="data-label">Máquina</span><span class="data-value">${data.extMaquinaExtrusora || '-'}</span></div>
            <div class="data-item"><span class="data-label">Motor Principal</span><span class="data-value">${data.extMotorPrincipal || '-'}</span></div>
            <div class="data-item"><span class="data-label">Tracción</span><span class="data-value">${data.extTraccion || '-'}</span></div>
            <div class="data-item"><span class="data-label">Tratador</span><span class="data-value">${data.extIntensidadTratador || '-'}</span></div>
            
            <div class="data-item"><span class="data-label">Soplador</span><span class="data-value">${data.extSopladorPrincipal || '-'}</span></div>
            <div class="data-item"><span class="data-label">Abertura Blower</span><span class="data-value">${data.extAberturaBlower || '-'}</span></div>
            <div class="data-item"><span class="data-label">Cuello Globo</span><span class="data-value">${data.extCuelloGlobo || '-'}</span></div>
            <div class="data-item"><span class="data-label">Temp. Cuello</span><span class="data-value">${data.extTemperaturaCuelloGlobo || '-'}</span></div>
          </div>
          <div style="padding: 10px 15px; border-top: 1px solid #e2e8f0; font-size: 9px; background: #f8fafc;">
            <strong style="text-transform: uppercase; color: #64748b;">Temperaturas Zonas (°C):</strong> 
            ${[1,2,3,4,5,6,7,8,9,10].map(i => data[`extTemperaturaZ${i}`] ? `<span style="margin-left: 8px;"><strong>Z${i}:</strong> ${data[`extTemperaturaZ${i}`]}°</span>` : '').join('')}
          </div>
        </div>

        <div class="footer-info">
          Este documento es propiedad de ERP INDUSTRIAL. La información contenida es confidencial y para uso técnico exclusivo.<br>
          Generado automáticamente por el Sistema de Gestión ERP el ${format(new Date(), 'dd/MM/yyyy HH:mm')}
        </div>
        
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
    const host = request.headers.get('host');
    const protocol = host?.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;
    
    const params = new URLSearchParams();
    if (fechaInicio) params.set('fechaInicio', fechaInicio);
    if (fechaFin) params.set('fechaFin', fechaFin);
    if (filtros?.area) params.set('area', filtros.area);
    if (filtros?.categoria) params.set('categoria', filtros.categoria);
    if (filtros?.productoId) params.set('productoId', filtros.productoId);

    const res = await fetch(`${baseUrl}/api/reportes/${tipo}?${params.toString()}`, {
      headers: { cookie: request.headers.get('cookie') || '' },
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      return NextResponse.json({ error: `Error al obtener datos del reporte: ${res.status} ${errorText}` }, { status: res.status });
    }
    
    reportData = await res.json();

    const html_content = generateHTML(tipo, reportData, { inicio: fechaInicio, fin: fechaFin });

    // Enviar el HTML al cliente para que el navegador genere el PDF nativamente
    // Esto evita depender de APIs externas que pueden expirar o fallar
    return new NextResponse(html_content, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error: any) {
    console.error('Error generando reporte:', error);
    return NextResponse.json({ error: `Error interno: ${error.message || 'Desconocido'}` }, { status: 500 });
  }
}
