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
    case 'produccion': {
      const tot = data.totales || {};
      const mermas = data.mermasPorTipo || {};
      const balance = data.balanceMateriales || {};
      const virgenes = balance.virgenes?.desglose || [];
      const aditivos = balance.aditivos?.desglose || [];

      return `
        <!DOCTYPE html><html><head>
        <meta charset="utf-8">
        <title>Reporte de Producción - ERP Plásticos</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
            padding: 24px; 
            color: #0f172a; 
            background: #fff; 
            font-size: 10px; 
            line-height: 1.35; 
          }
          @media print {
            @page {
              size: A4 portrait;
              margin: 8mm 10mm 8mm 10mm;
            }
            body { padding: 0 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .no-break { page-break-inside: avoid; break-inside: avoid; }
            .page-break { page-break-before: always; break-before: always; }
          }

          /* Header institucional */
          .header-table { width: 100%; border-collapse: collapse; margin-bottom: 14px; border-bottom: 2px solid #0f172a; padding-bottom: 8px; }
          .header-table td { vertical-align: middle; border: none; padding: 4px; }
          .logo-cell { width: 35%; }
          .title-cell { width: 40%; text-align: center; }
          .info-cell { width: 25%; text-align: right; font-size: 8.5px; color: #475569; }

          /* KPIs ejecutivos */
          .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 14px; }
          .kpi-card { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px 10px; }
          .kpi-title { font-size: 8px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px; }
          .kpi-val { font-size: 14px; font-weight: 900; color: #0f172a; }
          .kpi-sub { font-size: 8.5px; font-weight: 700; color: #64748b; margin-top: 2px; }

          /* Secciones */
          .section { margin-bottom: 14px; border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden; }
          .section-header { background: #0f172a; color: #fff; padding: 5px 10px; font-weight: 800; font-size: 9px; text-transform: uppercase; letter-spacing: 0.6px; display: flex; justify-content: space-between; align-items: center; }
          .section-content { padding: 8px 10px; }

          /* Tablas */
          table.report-table { width: 100%; border-collapse: collapse; font-size: 8.5px; }
          table.report-table th { background: #f1f5f9; color: #334155; font-weight: 800; text-transform: uppercase; font-size: 8px; padding: 5px 6px; border: 1px solid #cbd5e1; text-align: left; }
          table.report-table td { padding: 4.5px 6px; border: 1px solid #cbd5e1; color: #0f172a; }
          table.report-table tr:nth-child(even) { background: #f8fafc; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }

          /* Tarjetas y barras */
          .molido-badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 8px; font-weight: 800; }
          .footer-info { margin-top: 14px; border-top: 1px solid #cbd5e1; padding-top: 6px; text-align: center; font-size: 8px; color: #64748b; }
        </style>
        </head><body>

        <!-- ENCABEZADO INSTITUCIONAL -->
        <table class="header-table">
          <tr>
            <td class="logo-cell">
              <div style="font-size: 16px; font-weight: 900; color: #0f172a; line-height: 1;">PLÁSTICOS ERP</div>
              <div style="font-size: 7.5px; font-weight: 800; color: #64748b; letter-spacing: 0.8px; margin-top: 2px;">GESTIÓN INDUSTRIAL Y MANUFACTURA</div>
            </td>
            <td class="title-cell">
              <div style="font-size: 13px; font-weight: 900; color: #1e3a8a; text-transform: uppercase; letter-spacing: 0.5px;">REPORTE EJECUTIVO DE PRODUCCIÓN</div>
              <div style="font-size: 8px; font-weight: 700; color: #475569; margin-top: 2px;">PERÍODO: ${periodo.inicio || 'Inicio'} &bull; ${periodo.fin || 'Fin'}</div>
            </td>
            <td class="info-cell">
              <div><strong>EMISIÓN:</strong> ${format(new Date(), 'dd/MM/yyyy HH:mm')}</div>
              <div><strong>ESTADO:</strong> CONSOLIDADO</div>
            </td>
          </tr>
        </table>

        <!-- 1. KPIS GENERALES -->
        <div class="kpi-grid">
          <div class="kpi-card" style="border-left: 4px solid #2563eb;">
            <div class="kpi-title">Producción Total</div>
            <div class="kpi-val" style="color: #1d4ed8;">${(tot.kilosTotales || tot.produccion || 0).toLocaleString()} <span style="font-size: 9px;">KG</span></div>
            <div class="kpi-sub">Bobinas: ${(tot.kilosExtruidos || 0).toLocaleString()} KG | Bolsas: ${(tot.bolsasSelladas || 0).toLocaleString()} UND</div>
          </div>
          <div class="kpi-card" style="border-left: 4px solid #e11d48;">
            <div class="kpi-title">Merma Total Generada</div>
            <div class="kpi-val" style="color: #e11d48;">${(tot.mermaTotal || tot.merma || 0).toLocaleString()} <span style="font-size: 9px;">KG</span></div>
            <div class="kpi-sub">Retorno Scrap al Circuito</div>
          </div>
          <div class="kpi-card" style="border-left: 4px solid #059669;">
            <div class="kpi-title">Eficiencia Global</div>
            <div class="kpi-val" style="color: #059669;">${tot.eficienciaGlobal || 100}%</div>
            <div class="kpi-sub">(Producido / Entrada Total)</div>
          </div>
          <div class="kpi-card" style="border-left: 4px solid #7c3aed;">
            <div class="kpi-title">Turnos / Registros</div>
            <div class="kpi-val" style="color: #7c3aed;">${tot.registros || 0}</div>
            <div class="kpi-sub">Órdenes Procesadas</div>
          </div>
        </div>

        <!-- 2. RESUMEN POR ÁREA DE PRODUCCIÓN -->
        <div class="section no-break">
          <div class="section-header">
            <span>1. Rendimiento por Área de Fabricación</span>
            <span style="font-size: 8px; opacity: 0.85;">EXTRUSIÓN &bull; SERIGRAFÍA &bull; SELLADO &bull; REFILADO</span>
          </div>
          <div class="section-content" style="padding: 0;">
            <table class="report-table">
              <thead>
                <tr>
                  <th style="width: 22%;">Área</th>
                  <th class="text-right" style="width: 22%;">Cantidad Producida</th>
                  <th class="text-right" style="width: 18%;">Merma (KG)</th>
                  <th class="text-center" style="width: 18%;">Eficiencia (%)</th>
                  <th class="text-center" style="width: 20%;">Turnos / Lotes</th>
                </tr>
              </thead>
              <tbody>
                ${(data.porArea || []).map((a: any) => `
                  <tr>
                    <td><strong>${a.area}</strong></td>
                    <td class="text-right"><strong>${a.cantidadProducida.toLocaleString()}</strong> <span style="color:#64748b; font-size:7.5px;">${a.unidad}</span></td>
                    <td class="text-right" style="color: #e11d48; font-weight: 700;">${a.merma.toLocaleString()} KG</td>
                    <td class="text-center"><strong style="color: ${a.eficiencia >= 95 ? '#059669' : a.eficiencia >= 90 ? '#d97706' : '#e11d48'};">${a.eficiencia}%</strong></td>
                    <td class="text-center">${a.registros}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- 3. BALANCE DE MATERIALES Y RECUPERACIÓN DE SCRAP -->
        <div class="section no-break">
          <div class="section-header">
            <span>2. Balance de Materiales y Recuperación de Scrap (MOLIDO 1 al 5)</span>
            <span style="font-size: 8px; opacity: 0.85;">TOLVA vs MERMA RECUPERADA</span>
          </div>
          <div class="section-content">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
              <!-- Materia Prima Consumida en Extrusión -->
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 8px;">
                <div style="font-size: 8.5px; font-weight: 800; color: #1e3a8a; text-transform: uppercase; margin-bottom: 6px; border-bottom: 1px solid #cbd5e1; padding-bottom: 3px;">
                  Consumo Estimado de Tolva (${(balance.totalConsumo || 0).toLocaleString()} KG)
                </div>
                <div style="font-size: 8px; line-height: 1.5;">
                  <div><strong>Peletizado Recuperado:</strong> ${(balance.peletizado?.total || 0).toLocaleString()} KG</div>
                  <div style="margin-top: 2px;"><strong>Resinas Vírgenes (${(balance.virgenes?.total || 0).toLocaleString()} KG):</strong></div>
                  <div style="color: #475569; padding-left: 6px;">
                    ${virgenes.length > 0 ? virgenes.map((v: any) => `${v.resina}: ${v.kg} kg`).join(' &bull; ') : 'Base 3003/Lineal estándar'}
                  </div>
                  <div style="margin-top: 2px;"><strong>Aditivos (${(balance.aditivos?.total || 0).toLocaleString()} KG):</strong></div>
                  <div style="color: #475569; padding-left: 6px;">
                    ${aditivos.length > 0 ? aditivos.map((a: any) => `${a.aditivo}: ${a.kg} kg`).join(' &bull; ') : 'Dosificación según Ficha Técnica'}
                  </div>
                </div>
              </div>

              <!-- Desglose de Scrap hacia Peletizado -->
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 8px;">
                <div style="font-size: 8.5px; font-weight: 800; color: #9f1239; text-transform: uppercase; margin-bottom: 6px; border-bottom: 1px solid #cbd5e1; padding-bottom: 3px;">
                  Mermas Recuperadas por Tipo (${(mermas.total || 0).toLocaleString()} KG)
                </div>
                <table style="width: 100%; font-size: 8px; border-collapse: collapse;">
                  <tr><td style="padding: 2px 0;"><strong>MOLIDO 1:</strong> Transparente Alta</td><td class="text-right"><strong>${(mermas.mermaTransparenteAlta || 0).toLocaleString()} KG</strong></td></tr>
                  <tr><td style="padding: 2px 0;"><strong>MOLIDO 2:</strong> Blanco Pollo</td><td class="text-right"><strong>${(mermas.mermaBlancoPollo || 0).toLocaleString()} KG</strong></td></tr>
                  <tr><td style="padding: 2px 0;"><strong>MOLIDO 3:</strong> Color</td><td class="text-right"><strong>${(mermas.mermaColor || 0).toLocaleString()} KG</strong></td></tr>
                  <tr><td style="padding: 2px 0;"><strong>MOLIDO 4:</strong> Transparente Baja</td><td class="text-right"><strong>${(mermas.mermaTransparenteBaja || 0).toLocaleString()} KG</strong></td></tr>
                  <tr><td style="padding: 2px 0;"><strong>MOLIDO 5:</strong> Blanco Pego</td><td class="text-right"><strong>${(mermas.mermaBlancoPego || 0).toLocaleString()} KG</strong></td></tr>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- 4. DETALLE DE TURNOS Y ÓRDENES -->
        <div class="section no-break">
          <div class="section-header">
            <span>3. Detalle Consolidado de Turnos y Órdenes</span>
            <span style="font-size: 8px; opacity: 0.85;">REGISTRO OPERATIVO</span>
          </div>
          <div class="section-content" style="padding: 0;">
            <table class="report-table">
              <thead>
                <tr>
                  <th style="width: 10%;">Fecha</th>
                  <th style="width: 8%;">Turno</th>
                  <th style="width: 11%;">Área</th>
                  <th style="width: 12%;">Máquina</th>
                  <th style="width: 12%;">Lote / Orden</th>
                  <th style="width: 21%;">Producto</th>
                  <th class="text-right" style="width: 13%;">Producido</th>
                  <th class="text-right" style="width: 13%;">Merma (KG)</th>
                </tr>
              </thead>
              <tbody>
                ${(data.producciones || []).slice(0, 45).map((p: any) => `
                  <tr>
                    <td>${p.fechaFormatted || p.fecha}</td>
                    <td><span style="font-weight:700;">${p.turno}</span></td>
                    <td>${p.area}</td>
                    <td>${p.maquina}</td>
                    <td><strong style="color: #1e40af;">${p.orden}</strong></td>
                    <td style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 140px;">${p.producto}</td>
                    <td class="text-right"><strong>${p.cantidadProducida.toLocaleString()}</strong> ${p.unidad}</td>
                    <td class="text-right" style="color: #e11d48; font-weight: 700;">${p.merma.toLocaleString()}</td>
                  </tr>
                `).join('') || '<tr><td colspan="8" class="text-center" style="padding: 12px; color: #94a3b8;">No se registraron turnos en este período.</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>

        <!-- FIRMAS Y PIE DE PÁGINA -->
        <div style="margin-top: 16px; page-break-inside: avoid; break-inside: avoid;">
          <table style="width: 100%; border-collapse: collapse; text-align: center; margin-bottom: 8px;">
            <tr>
              <td style="width: 33%; padding: 10px; border: 1px solid #cbd5e1; background: #fafafa;">
                <div style="height: 25px;"></div>
                <div style="border-top: 1px solid #0f172a; padding-top: 3px; font-weight: 800; font-size: 8px;">GERENCIA DE PLANTA</div>
              </td>
              <td style="width: 33%; padding: 10px; border: 1px solid #cbd5e1; background: #fafafa;">
                <div style="height: 25px;"></div>
                <div style="border-top: 1px solid #0f172a; padding-top: 3px; font-weight: 800; font-size: 8px;">SUPERVISIÓN DE PRODUCCIÓN</div>
              </td>
              <td style="width: 33%; padding: 10px; border: 1px solid #cbd5e1; background: #fafafa;">
                <div style="height: 25px;"></div>
                <div style="border-top: 1px solid #0f172a; padding-top: 3px; font-weight: 800; font-size: 8px;">CONTROL DE CALIDAD</div>
              </td>
            </tr>
          </table>
          <div class="footer-info">
            Este reporte ejecutivo es generado por el Sistema ERP Industrial para control de operaciones de planta el ${format(new Date(), 'dd/MM/yyyy HH:mm')}
          </div>
        </div>

        </body></html>
      `;
    }

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

    case 'inventario': {
      const tot = data.totales || {};
      const cat = data.consolidadoCategorias || {};
      const alertas = data.alertasStockBajo || [];
      const kardex = data.kardex || {};
      const movimientos = kardex.movimientos || [];
      const inventarios = data.inventarios || [];

      // Filtrar clasificados para catálogo
      const listMp = inventarios.filter((i: any) => i.categoria === 'MateriaPrima');
      const listPelet = inventarios.filter((i: any) => i.categoria === 'Peletizado');
      const listAdit = inventarios.filter((i: any) => i.categoria === 'Aditivo');
      const listPt = inventarios.filter((i: any) => i.categoria === 'ProductoTerminado');
      const lotesPt = cat.productoTerminado?.desgloseLotes || [];

      return `
        <!DOCTYPE html><html><head>
        <meta charset="utf-8">
        <title>Reporte de Estado de Inventario y Movimientos - ERP Plásticos</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
            padding: 24px; 
            color: #0f172a; 
            background: #fff; 
            font-size: 10px; 
            line-height: 1.35; 
          }
          @media print {
            @page {
              size: A4 portrait;
              margin: 8mm 10mm 8mm 10mm;
            }
            body { padding: 0 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .no-break { page-break-inside: avoid; break-inside: avoid; }
            .page-break { page-break-before: always; break-before: always; }
          }

          /* Header institucional */
          .header-table { width: 100%; border-collapse: collapse; margin-bottom: 14px; border-bottom: 2px solid #0f172a; padding-bottom: 8px; }
          .header-table td { vertical-align: middle; border: none; padding: 4px; }
          .logo-cell { width: 32%; }
          .title-cell { width: 44%; text-align: center; }
          .info-cell { width: 24%; text-align: right; font-size: 8px; color: #475569; }

          /* KPIs ejecutivos */
          .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 14px; }
          .kpi-card { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px 10px; }
          .kpi-title { font-size: 8px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px; }
          .kpi-val { font-size: 14px; font-weight: 900; color: #0f172a; }
          .kpi-sub { font-size: 8px; font-weight: 700; color: #64748b; margin-top: 2px; }

          /* Secciones */
          .section { margin-bottom: 14px; border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden; }
          .section-header { background: #0f172a; color: #fff; padding: 5px 10px; font-weight: 800; font-size: 9px; text-transform: uppercase; letter-spacing: 0.6px; display: flex; justify-content: space-between; align-items: center; }
          .section-content { padding: 8px 10px; }

          /* Tablas */
          table.report-table { width: 100%; border-collapse: collapse; font-size: 8.5px; }
          table.report-table th { background: #f1f5f9; color: #334155; font-weight: 800; text-transform: uppercase; font-size: 8px; padding: 5px 6px; border: 1px solid #cbd5e1; text-align: left; }
          table.report-table td { padding: 4.5px 6px; border: 1px solid #cbd5e1; color: #0f172a; }
          table.report-table tr:nth-child(even) { background: #f8fafc; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }

          /* Badges */
          .badge { display: inline-block; padding: 1.5px 5px; border-radius: 4px; font-size: 7.5px; font-weight: 800; text-transform: uppercase; }
          .badge-danger { background: #fee2e2; color: #b91c1c; border: 1px solid #f87171; }
          .badge-warning { background: #fef3c7; color: #b45309; border: 1px solid #fcd34d; }
          .badge-success { background: #dcfce7; color: #15803d; border: 1px solid #86efac; }
          .badge-neutral { background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; }

          /* Footer y firmas */
          .footer-info { margin-top: 14px; border-top: 1px solid #cbd5e1; padding-top: 6px; text-align: center; font-size: 8px; color: #64748b; }
        </style>
        </head><body>

        <!-- ENCABEZADO INSTITUCIONAL -->
        <table class="header-table">
          <tr>
            <td class="logo-cell">
              <div style="font-size: 16px; font-weight: 900; color: #0f172a; line-height: 1;">PLÁSTICOS ERP</div>
              <div style="font-size: 7.5px; font-weight: 800; color: #64748b; letter-spacing: 0.8px; margin-top: 2px;">GESTIÓN INDUSTRIAL Y MANUFACTURA</div>
            </td>
            <td class="title-cell">
              <div style="font-size: 13px; font-weight: 900; color: #1e3a8a; text-transform: uppercase; letter-spacing: 0.5px;">REPORTE DE ESTADO DE INVENTARIO Y MOVIMIENTOS</div>
              <div style="font-size: 8px; font-weight: 700; color: #475569; margin-top: 2px;">PERÍODO: ${periodo.inicio || 'Inicio'} &bull; ${periodo.fin || 'Fin'}</div>
            </td>
            <td class="info-cell">
              <div><strong>CÓDIGO:</strong> REP-INV-01</div>
              <div><strong>EMISIÓN:</strong> ${format(new Date(), 'dd/MM/yyyy HH:mm')}</div>
              <div><strong>ESTADO:</strong> OFICIAL AUDITABLE</div>
            </td>
          </tr>
        </table>

        <!-- 1. KPIS GENERALES -->
        <div class="kpi-grid">
          <div class="kpi-card" style="border-left: 4px solid #4f46e5;">
            <div class="kpi-title">Total Artículos</div>
            <div class="kpi-val" style="color: #4f46e5;">${tot.totalItems || 0}</div>
            <div class="kpi-sub">${tot.itemsStockOptimo || 0} en nivel óptimo</div>
          </div>
          <div class="kpi-card" style="border-left: 4px solid #059669;">
            <div class="kpi-title">Valor Estimado Total</div>
            <div class="kpi-val" style="color: #059669;">${tot.valorInventarioFormatted || '$ 0,00'}</div>
            <div class="kpi-sub">Costo de reposición estimado</div>
          </div>
          <div class="kpi-card" style="border-left: 4px solid #dc2626;">
            <div class="kpi-title">Stock Crítico / Bajo</div>
            <div class="kpi-val" style="color: #dc2626;">${tot.itemsStockBajo || 0}</div>
            <div class="kpi-sub">Requiere compra o molienda</div>
          </div>
          <div class="kpi-card" style="border-left: 4px solid #0284c7;">
            <div class="kpi-title">Movimientos en Período</div>
            <div class="kpi-val" style="color: #0284c7;">${tot.totalMovimientos || 0}</div>
            <div class="kpi-sub">+${(tot.kilosEntrantes || 0).toLocaleString()} kg | -${(tot.kilosSalientes || 0).toLocaleString()} kg</div>
          </div>
        </div>

        <!-- 2. RESUMEN CONSOLIDADO POR CATEGORÍA -->
        <div class="section no-break">
          <div class="section-header">
            <span>1. Resumen Consolidado por Categoría de Material</span>
            <span style="font-size: 8px; opacity: 0.85;">BALANCE EN PLANTA</span>
          </div>
          <div class="section-content" style="padding: 0;">
            <table class="report-table">
              <thead>
                <tr>
                  <th style="width: 25%;">Categoría de Almacén</th>
                  <th class="text-right" style="width: 20%;">Stock Total Físico</th>
                  <th class="text-center" style="width: 15%;">Artículos</th>
                  <th class="text-center" style="width: 18%;">Alertas Críticas</th>
                  <th style="width: 22%;">Desglose Resumido</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Materia Prima Virgen</strong></td>
                  <td class="text-right"><strong>${(cat.materiaPrima?.totalKg || 0).toLocaleString()} KG</strong></td>
                  <td class="text-center">${cat.materiaPrima?.itemsCount || 0}</td>
                  <td class="text-center">${(cat.materiaPrima?.stockBajoCount || 0) > 0 ? `<span class="badge badge-danger">${cat.materiaPrima.stockBajoCount} BAJO MÍNIMO</span>` : '<span class="badge badge-success">OK</span>'}</td>
                  <td style="font-size: 8px; color: #475569;">FB7000, Lineal, 3003, 0240, 7000F</td>
                </tr>
                <tr>
                  <td><strong>Peletizado / Recuperado</strong></td>
                  <td class="text-right"><strong>${(cat.peletizado?.totalKg || 0).toLocaleString()} KG</strong></td>
                  <td class="text-center">${cat.peletizado?.itemsCount || 0}</td>
                  <td class="text-center"><span class="badge badge-neutral">CIRCULANTE</span></td>
                  <td style="font-size: 8px; color: #475569;">Molidos 1, 2, 3, 4 y 5 clasificados</td>
                </tr>
                <tr>
                  <td><strong>Aditivos & Masterbatch</strong></td>
                  <td class="text-right"><strong>${(cat.aditivos?.totalKg || 0).toLocaleString()} KG</strong></td>
                  <td class="text-center">${cat.aditivos?.itemsCount || 0}</td>
                  <td class="text-center"><span class="badge badge-success">ÓPTIMO</span></td>
                  <td style="font-size: 8px; color: #475569;">Deslizante, Pigmentos Bco/Neg/Az/Am</td>
                </tr>
                <tr>
                  <td><strong>Producto Terminado</strong></td>
                  <td class="text-right"><strong>${(cat.productoTerminado?.totalKg || 0) > 0 && (cat.productoTerminado?.totalUnidades || 0) > 0
                    ? `${Number(cat.productoTerminado.totalKg).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} KG (${Number(cat.productoTerminado.totalUnidades).toLocaleString('es-VE')} UND)`
                    : (cat.productoTerminado?.totalKg || 0) > 0 
                      ? `${Number(cat.productoTerminado.totalKg).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} KG` 
                      : `${Number(cat.productoTerminado?.totalUnidades || 0).toLocaleString('es-VE')} UND`}</strong></td>
                  <td class="text-center">${cat.productoTerminado?.cantidadLotes || cat.productoTerminado?.itemsCount || 0} ${(cat.productoTerminado?.cantidadLotes || cat.productoTerminado?.itemsCount || 0) === 1 ? 'artículo/lote' : 'artículos/lotes'}</td>
                  <td class="text-center"><span class="badge badge-success">LISTO DESPACHO</span></td>
                  <td style="font-size: 8px; color: #475569;">Lotes en almacén listos para despacho a clientes</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 3. ALERTAS DE STOCK CRÍTICO / REPOSICIÓN -->
        <div class="section no-break">
          <div class="section-header" style="background: #991b1b;">
            <span>2. Alertas de Stock Crítico y Necesidad de Reposición</span>
            <span style="font-size: 8px; opacity: 0.85;">PRIORIDAD ALTA: COMPRAS & MOLIENDA</span>
          </div>
          <div class="section-content" style="padding: 0;">
            <table class="report-table">
              <thead>
                <tr>
                  <th style="width: 14%;">Código</th>
                  <th style="width: 28%;">Artículo / Material</th>
                  <th style="width: 16%;">Categoría</th>
                  <th class="text-right" style="width: 12%;">Stock Actual</th>
                  <th class="text-right" style="width: 12%;">Stock Mínimo</th>
                  <th class="text-right" style="width: 10%;">Déficit</th>
                  <th class="text-center" style="width: 8%;">Estado</th>
                </tr>
              </thead>
              <tbody>
                ${alertas.length > 0 ? alertas.map((a: any) => `
                  <tr>
                    <td><strong>${a.codigo}</strong></td>
                    <td><strong>${a.nombre}</strong></td>
                    <td>${a.categoriaLabel}</td>
                    <td class="text-right"><strong style="color: #b91c1c;">${a.stockActual.toLocaleString()}</strong> ${a.unidad}</td>
                    <td class="text-right">${a.stockMinimo.toLocaleString()} ${a.unidad}</td>
                    <td class="text-right"><strong style="color: #b91c1c;">-${a.diferencia.toLocaleString()}</strong></td>
                    <td class="text-center"><span class="badge ${a.stockActual <= 0 ? 'badge-danger' : 'badge-warning'}">${a.estado}</span></td>
                  </tr>
                `).join('') : '<tr><td colspan="7" class="text-center" style="padding: 10px; color: #059669; font-weight: 700;">No existen artículos en nivel crítico de inventario.</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>

        <!-- 4. KARDEX DEL PERÍODO (HISTORIAL DE MOVIMIENTOS) -->
        <div class="section no-break">
          <div class="section-header">
            <span>3. Kardex del Período (Entradas vs Salidas Registradas)</span>
            <span style="font-size: 8px; opacity: 0.85;">BALANCE: NETO ${(kardex.balanceNeto || 0).toLocaleString()} KG</span>
          </div>
          <div class="section-content" style="padding: 0;">
            <!-- Mini Balance Bar -->
            <div style="background: #f8fafc; border-bottom: 1px solid #cbd5e1; padding: 6px 10px; display: flex; justify-content: space-between; font-size: 8.5px;">
              <div><strong>Kilos Entrantes (+):</strong> <span style="color: #15803d; font-weight: 800;">+${(kardex.kilosEntrantes || 0).toLocaleString()} Kg</span></div>
              <div><strong>Kilos Salientes (-):</strong> <span style="color: #b91c1c; font-weight: 800;">-${(kardex.kilosSalientes || 0).toLocaleString()} Kg</span></div>
              <div><strong>Balance Neto:</strong> <strong style="color: #0f172a;">${(kardex.balanceNeto || 0).toLocaleString()} Kg</strong></div>
              <div><strong>Total Movimientos:</strong> <strong>${movimientos.length}</strong> transacciones</div>
            </div>
            <table class="report-table">
              <thead>
                <tr>
                  <th style="width: 12%;">Fecha</th>
                  <th style="width: 25%;">Artículo</th>
                  <th style="width: 12%;">Código</th>
                  <th class="text-center" style="width: 10%;">Tipo</th>
                  <th class="text-right" style="width: 11%;">Cantidad</th>
                  <th style="width: 18%;">Concepto / Referencia</th>
                  <th style="width: 12%;">Responsable</th>
                </tr>
              </thead>
              <tbody>
                ${movimientos.length > 0 ? movimientos.slice(0, 35).map((m: any) => `
                  <tr>
                    <td>${m.fechaFormatted || m.fecha}</td>
                    <td><strong>${m.articulo}</strong></td>
                    <td style="color: #475569;">${m.codigo}</td>
                    <td class="text-center">
                      <span class="badge ${m.tipo === 'Entrada' ? 'badge-success' : m.tipo === 'Salida' ? 'badge-danger' : 'badge-neutral'}">${m.tipo}</span>
                    </td>
                    <td class="text-right"><strong>${m.cantidad.toLocaleString()}</strong> ${m.unidad}</td>
                    <td style="color: #334155;">${m.concepto || m.referencia || '-'}</td>
                    <td>${m.responsable || 'Almacén'}</td>
                  </tr>
                `).join('') : '<tr><td colspan="7" class="text-center" style="padding: 10px; color: #94a3b8;">No se registraron movimientos en este período.</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>

        <!-- 5. CATÁLOGO COMPLETO DE EXISTENCIAS -->
        <div class="section no-break page-break">
          <div class="section-header">
            <span>4. Catálogo Detallado de Existencias por Categoría</span>
            <span style="font-size: 8px; opacity: 0.85;">AUDITORÍA DE STOCK FÍSICO</span>
          </div>
          <div class="section-content" style="padding: 0;">
            <!-- Subtabla Materia Prima -->
            <div style="background: #e2e8f0; padding: 4px 8px; font-weight: 800; font-size: 8px; text-transform: uppercase; color: #1e3a8a;">
              4.1 Resinas y Materia Prima Virgen (${listMp.length} Ítems)
            </div>
            <table class="report-table">
              <thead>
                <tr>
                  <th style="width: 18%;">Código</th>
                  <th style="width: 32%;">Nombre Material</th>
                  <th class="text-right" style="width: 15%;">Stock Actual</th>
                  <th class="text-right" style="width: 15%;">Stock Mínimo</th>
                  <th class="text-right" style="width: 10%;">Costo</th>
                  <th class="text-center" style="width: 10%;">Estado</th>
                </tr>
              </thead>
              <tbody>
                ${listMp.map((i: any) => `
                  <tr>
                    <td>${i.codigo}</td>
                    <td><strong>${i.nombre}</strong></td>
                    <td class="text-right"><strong>${i.cantidad.toLocaleString()}</strong> ${i.unidad}</td>
                    <td class="text-right">${i.stockMinimo.toLocaleString()} ${i.unidad}</td>
                    <td class="text-right">${i.costo ? `$ ${i.costo}` : '-'}</td>
                    <td class="text-center"><span class="badge ${i.cantidad <= i.stockMinimo ? 'badge-danger' : 'badge-success'}">${i.estadoStock}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <!-- Subtabla Peletizado -->
            <div style="background: #e2e8f0; padding: 4px 8px; font-weight: 800; font-size: 8px; text-transform: uppercase; color: #1e3a8a; border-top: 1px solid #cbd5e1;">
              4.2 Peletizado y Material Recuperado - MOLIDO 1 AL 5 (${listPelet.length} Ítems)
            </div>
            <table class="report-table">
              <thead>
                <tr>
                  <th style="width: 18%;">Código</th>
                  <th style="width: 32%;">Nombre Material</th>
                  <th class="text-right" style="width: 15%;">Stock Actual</th>
                  <th class="text-right" style="width: 15%;">Stock Mínimo</th>
                  <th class="text-right" style="width: 10%;">Costo</th>
                  <th class="text-center" style="width: 10%;">Estado</th>
                </tr>
              </thead>
              <tbody>
                ${listPelet.map((i: any) => `
                  <tr>
                    <td><strong>${i.codigo}</strong></td>
                    <td>${i.nombre}</td>
                    <td class="text-right"><strong>${i.cantidad.toLocaleString()}</strong> ${i.unidad}</td>
                    <td class="text-right">${i.stockMinimo.toLocaleString()} ${i.unidad}</td>
                    <td class="text-right">${i.costo ? `$ ${i.costo}` : '-'}</td>
                    <td class="text-center"><span class="badge badge-success">${i.estadoStock}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <!-- Subtabla Aditivos -->
            <div style="background: #e2e8f0; padding: 4px 8px; font-weight: 800; font-size: 8px; text-transform: uppercase; color: #1e3a8a; border-top: 1px solid #cbd5e1;">
              4.3 Aditivos y Masterbatch (${listAdit.length} Ítems)
            </div>
            <table class="report-table">
              <thead>
                <tr>
                  <th style="width: 18%;">Código</th>
                  <th style="width: 32%;">Nombre Material</th>
                  <th class="text-right" style="width: 15%;">Stock Actual</th>
                  <th class="text-right" style="width: 15%;">Stock Mínimo</th>
                  <th class="text-right" style="width: 10%;">Costo</th>
                  <th class="text-center" style="width: 10%;">Estado</th>
                </tr>
              </thead>
              <tbody>
                ${listAdit.map((i: any) => `
                  <tr>
                    <td>${i.codigo}</td>
                    <td>${i.nombre}</td>
                    <td class="text-right"><strong>${i.cantidad.toLocaleString()}</strong> ${i.unidad}</td>
                    <td class="text-right">${i.stockMinimo.toLocaleString()} ${i.unidad}</td>
                    <td class="text-right">${i.costo ? `$ ${i.costo}` : '-'}</td>
                    <td class="text-center"><span class="badge badge-success">${i.estadoStock}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <!-- Subtabla Producto Terminado (Lotes en Almacén / Listos para Despacho) -->
            <div style="background: #e2e8f0; padding: 4px 8px; font-weight: 800; font-size: 8px; text-transform: uppercase; color: #1e3a8a; border-top: 1px solid #cbd5e1;">
              4.4 PRODUCTO TERMINADO - LOTES EN ALMACÉN (${lotesPt.length} ${lotesPt.length === 1 ? 'Lote' : 'Lotes'})
            </div>
            <table class="report-table">
              <thead>
                <tr>
                  <th style="width: 22%;">LOTE</th>
                  <th style="width: 38%;">PRODUCTO / CLIENTE</th>
                  <th class="text-right" style="width: 16%;">STOCK FÍSICO (KG / UND)</th>
                  <th class="text-center" style="width: 12%;">FECHA INGRESO</th>
                  <th class="text-center" style="width: 12%;">ESTADO</th>
                </tr>
              </thead>
              <tbody>
                ${lotesPt.length > 0 ? lotesPt.map((l: any) => `
                  <tr>
                    <td><strong>${l.lote || l.codigoLote}</strong></td>
                    <td><strong>${l.productoCliente || `${l.producto} - ${l.cliente}`}</strong></td>
                    <td class="text-right"><strong>${l.stockFisico || (l.unidades > 0 && l.pesoKg > 0 ? `${Number(l.unidades).toLocaleString('es-VE')} UND (${Number(l.pesoKg).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} KG)` : l.pesoKg > 0 ? `${Number(l.pesoKg).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} KG` : `${Number(l.cantidad).toLocaleString('es-VE')} UND`)}</strong></td>
                    <td class="text-center">${l.fechaIngreso || (l.createdAt ? format(new Date(l.createdAt), 'dd/MM/yyyy') : '-')}</td>
                    <td class="text-center"><span class="badge badge-success">${l.estado || 'Listo para Despacho'}</span></td>
                  </tr>
                `).join('') : `
                  <tr>
                    <td colspan="5" class="text-center" style="padding: 8px; color: #64748b;">No hay lotes de producto terminado registrados en este período.</td>
                  </tr>
                `}
              </tbody>
            </table>
          </div>
        </div>

        <!-- FIRMAS Y PIE DE PÁGINA -->
        <div style="margin-top: 16px; page-break-inside: avoid; break-inside: avoid;">
          <table style="width: 100%; border-collapse: collapse; text-align: center; margin-bottom: 8px;">
            <tr>
              <td style="width: 33%; padding: 12px; border: 1px solid #cbd5e1; background: #fafafa;">
                <div style="height: 30px;"></div>
                <div style="border-top: 1px solid #0f172a; padding-top: 4px; font-weight: 800; font-size: 8.5px;">RESPONSABLE DE ALMACÉN</div>
                <div style="font-size: 7.5px; color: #64748b; margin-top: 1px;">Control Físico y Despachos</div>
              </td>
              <td style="width: 33%; padding: 12px; border: 1px solid #cbd5e1; background: #fafafa;">
                <div style="height: 30px;"></div>
                <div style="border-top: 1px solid #0f172a; padding-top: 4px; font-weight: 800; font-size: 8.5px;">CONTROL DE PRODUCCIÓN</div>
                <div style="font-size: 7.5px; color: #64748b; margin-top: 1px;">Consumo de Tolva y Recuperación</div>
              </td>
              <td style="width: 33%; padding: 12px; border: 1px solid #cbd5e1; background: #fafafa;">
                <div style="height: 30px;"></div>
                <div style="border-top: 1px solid #0f172a; padding-top: 4px; font-weight: 800; font-size: 8.5px;">GERENCIA DE PLANTA</div>
                <div style="font-size: 7.5px; color: #64748b; margin-top: 1px;">Aprobación y Auditoría</div>
              </td>
            </tr>
          </table>
          <div class="footer-info">
            Reporte oficial generado por el Sistema ERP Industrial para control de inventario y movimientos el ${format(new Date(), 'dd/MM/yyyy HH:mm')}
          </div>
        </div>

        </body></html>
      `;
    }

    case 'ficha-tecnica': {
      const regDia = data.parametrosSellado?.find((p: any) => p.turno === 'DIA') || data;
      const regTarde = data.parametrosSellado?.find((p: any) => p.turno === 'TARDE') || regDia;
      
      const v = (val: any, unit = '') => (val !== null && val !== undefined && val !== '' ? `${val}${unit ? ' ' + unit : ''}` : '-');
      const boolBadge = (val: boolean) => val 
        ? '<span style="color:#059669;font-weight:700;">SÍ</span>' 
        : '<span style="color:#64748b;font-weight:600;">NO</span>';

      return `
        <!DOCTYPE html><html><head>
        <meta charset="utf-8">
        <title>Ficha Técnica - ${data.nombreProducto}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
            padding: 24px; 
            color: #0f172a; 
            background: #fff; 
            font-size: 10px; 
            line-height: 1.35; 
          }
          
          @media print {
            @page {
              size: A4 portrait;
              margin: 8mm 10mm 8mm 10mm;
            }
            body { 
              padding: 0 !important; 
              background: #fff !important; 
              -webkit-print-color-adjust: exact; 
              print-color-adjust: exact; 
            }
            .page-break { page-break-before: always; break-before: always; }
            .no-break { page-break-inside: avoid; break-inside: avoid; }
            .no-print { display: none; }
          }

          .header-table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 12px; 
            border: 2px solid #0f172a; 
          }
          .header-table td { 
            padding: 8px 12px; 
            border: 1px solid #cbd5e1; 
            vertical-align: middle; 
          }
          .logo-cell { width: 22%; text-align: left; }
          .title-cell { 
            width: 53%; 
            text-align: center; 
            font-size: 16px; 
            font-weight: 900; 
            color: #0f172a; 
            letter-spacing: 0.5px;
            text-transform: uppercase; 
          }
          .info-cell { width: 25%; font-size: 9px; color: #475569; text-align: right; }
          
          .section { 
            margin-bottom: 12px; 
            border: 1px solid #cbd5e1; 
            border-radius: 6px; 
            overflow: hidden; 
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .section-header { 
            background: #0f172a; 
            color: #ffffff; 
            padding: 6px 12px; 
            font-size: 11px; 
            font-weight: 800; 
            text-transform: uppercase; 
            letter-spacing: 0.5px;
            display: flex; 
            justify-content: space-between;
            align-items: center; 
          }
          .section-content { 
            padding: 10px 12px; 
            background: #ffffff; 
          }
          
          .grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
          .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
          .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
          .grid-6 { display: grid; grid-template-columns: repeat(6, 1fr); gap: 6px; }
          
          .data-item { display: flex; flex-direction: column; }
          .data-label { 
            font-size: 8px; 
            font-weight: 800; 
            color: #64748b; 
            text-transform: uppercase; 
            letter-spacing: 0.3px; 
            margin-bottom: 2px; 
          }
          .data-value { 
            font-size: 10.5px; 
            font-weight: 700; 
            color: #0f172a; 
          }
          .data-value.highlight { color: #1d4ed8; }

          /* Tabla comparativa de sellado */
          .table-sellado { 
            width: 100%; 
            border-collapse: collapse; 
            font-size: 9.5px; 
            margin-top: 2px;
          }
          .table-sellado th, .table-sellado td { 
            padding: 4.5px 8px; 
            border: 1px solid #e2e8f0; 
          }
          .table-sellado th { 
            background: #f1f5f9; 
            font-weight: 800; 
            text-transform: uppercase; 
            font-size: 8.5px; 
            color: #334155; 
          }
          .table-sellado th.dia-header { 
            background: #fef3c7; 
            color: #92400e; 
            text-align: center; 
            width: 25%;
          }
          .table-sellado th.tarde-header { 
            background: #e0e7ff; 
            color: #3730a3; 
            text-align: center; 
            width: 25%;
          }
          .table-sellado td.center { text-align: center; font-weight: 700; }
          .table-sellado tr:nth-child(even) td { background: #fafafa; }
          .table-subheading { 
            background: #f8fafc; 
            font-weight: 800; 
            color: #0f172a; 
            text-transform: uppercase; 
            font-size: 8.5px; 
            letter-spacing: 0.5px;
          }

          /* Cuadrícula de Zonas Térmicas */
          .zones-grid { 
            display: grid; 
            grid-template-columns: repeat(10, 1fr); 
            gap: 4px; 
            margin-top: 6px; 
          }
          .zone-box { 
            border: 1px solid #cbd5e1; 
            background: #f8fafc; 
            padding: 3px 2px; 
            border-radius: 4px; 
            text-align: center; 
          }
          .zone-name { font-size: 7.5px; font-weight: 800; color: #64748b; display: block; }
          .zone-val { font-size: 9.5px; font-weight: 800; color: #0f172a; }

          /* Tarjetas de formulación */
          .formulation-grid { 
            display: grid; 
            grid-template-columns: repeat(4, 1fr); 
            gap: 6px; 
          }
          .form-card { 
            background: #f8fafc; 
            border: 1px solid #e2e8f0; 
            padding: 6px 8px; 
            border-radius: 4px; 
            text-align: center; 
          }
          .form-title { font-size: 8px; font-weight: 800; color: #475569; text-transform: uppercase; }
          .form-percent { font-size: 12px; font-weight: 900; color: #1d4ed8; margin-top: 2px; }

          .footer-info { 
            margin-top: 14px; 
            border-top: 1px solid #cbd5e1; 
            padding-top: 8px; 
            text-align: center; 
            font-size: 8px; 
            color: #64748b; 
          }
        </style>
        </head><body>
        
        <!-- ENCABEZADO OFICIAL -->
        <table class="header-table">
          <tr>
            <td class="logo-cell">
              <div style="font-size: 16px; font-weight: 900; color: #0f172a; line-height: 1;">PLÁSTICOS ERP</div>
              <div style="font-size: 7.5px; font-weight: 800; color: #64748b; letter-spacing: 0.8px; margin-top: 2px;">GESTIÓN INDUSTRIAL Y MANUFACTURA</div>
            </td>
            <td class="title-cell">
              FICHA TÉCNICA DE FABRICACIÓN
            </td>
            <td class="info-cell">
              <div><strong>CÓDIGO:</strong> FT-${data.codigoProducto || data.id.slice(0, 8).toUpperCase()}</div>
              <div><strong>EMISIÓN:</strong> ${format(new Date(), 'dd/MM/yyyy HH:mm')}</div>
              <div><strong>REV:</strong> 2.0 (ACTUALIZADA)</div>
            </td>
          </tr>
        </table>

        <!-- SECCIÓN 1: DATOS GENERALES Y ESPECIFICACIONES BÁSICAS -->
        <div class="section">
          <div class="section-header">
            <span>1. Identificación y Especificaciones Generales</span>
            <span style="font-size: 9px; opacity: 0.85;">DATOS DEL PRODUCTO Y CLIENTE</span>
          </div>
          <div class="section-content">
            <div class="grid-4" style="margin-bottom: 8px;">
              <div class="data-item"><span class="data-label">Cliente</span><span class="data-value highlight">${data.cliente?.nombre || 'N/A'}</span></div>
              <div class="data-item"><span class="data-label">RIF Cliente</span><span class="data-value">${data.cliente?.rif || 'N/A'}</span></div>
              <div class="data-item"><span class="data-label">Nombre del Producto</span><span class="data-value highlight">${data.nombreProducto}</span></div>
              <div class="data-item"><span class="data-label">Código Interno</span><span class="data-value">${data.codigoProducto || '-'}</span></div>
            </div>

            <div class="grid-4" style="margin-bottom: 8px; padding-top: 8px; border-top: 1px dashed #e2e8f0;">
              <div class="data-item"><span class="data-label">Tipo de Producto</span><span class="data-value">${data.tipoProducto}</span></div>
              <div class="data-item"><span class="data-label">Tipo de Bolsa</span><span class="data-value">${v(data.tipoBolsa)}</span></div>
              <div class="data-item"><span class="data-label">Material Base</span><span class="data-value">${v(data.material)}</span></div>
              <div class="data-item"><span class="data-label">Unidad de Venta</span><span class="data-value">${data.unidadVenta || 'Unidades'}</span></div>
            </div>

            <div class="grid-6" style="margin-bottom: 8px; padding-top: 8px; border-top: 1px dashed #e2e8f0;">
              <div class="data-item"><span class="data-label">Ancho</span><span class="data-value">${v(data.ancho, 'cm')}</span></div>
              <div class="data-item"><span class="data-label">Largo</span><span class="data-value">${v(data.largo, 'cm')}</span></div>
              <div class="data-item"><span class="data-label">Calibre</span><span class="data-value">${v(data.calibre, 'µ')}</span></div>
              <div class="data-item"><span class="data-label">Fuelle</span><span class="data-value">${v(data.anchoFuelle || data.fuelleASA, 'cm')}</span></div>
              <div class="data-item"><span class="data-label">Peso x Unidad</span><span class="data-value highlight">${v(data.pesoPorUnidad, 'g')}</span></div>
              <div class="data-item"><span class="data-label">Ancho Bobina</span><span class="data-value">${v(data.anchoBobina, 'cm')}</span></div>
            </div>

            <div class="grid-3" style="padding-top: 8px; border-top: 1px dashed #e2e8f0;">
              <div class="data-item"><span class="data-label">¿Lleva Impresión?</span><span class="data-value">${boolBadge(Boolean(data.conImpresion))}</span></div>
              <div class="data-item"><span class="data-label">¿Lleva Pigmento?</span><span class="data-value">${boolBadge(Boolean(data.conPigmento))}</span></div>
              <div class="data-item"><span class="data-label">¿Lleva Postizo?</span><span class="data-value">${boolBadge(Boolean(data.llevaPostizo || regDia.llevaPostizo))}</span></div>
            </div>
          </div>
        </div>

        <!-- SECCIÓN 2: FORMULACIÓN Y BALANCE DE MATERIALES (TOLVA) -->
        <div class="section">
          <div class="section-header">
            <span>2. Formulación y Balance de Materiales (Tolva)</span>
            <span style="font-size: 9px; opacity: 0.85;">DOSIFICACIÓN TOTAL: 100%</span>
          </div>
          <div class="section-content">
            <div class="grid-3" style="margin-bottom: 8px;">
              <div class="form-card" style="border-left: 3px solid #0284c7; text-align: left;">
                <span class="form-title">Material Recuperado / Molido</span>
                <div class="form-percent" style="color: #0284c7;">${v(data.molido, '%')}</div>
              </div>
              <div class="form-card" style="border-left: 3px solid #059669; text-align: left;">
                <span class="form-title">Peletizado Asignado</span>
                <div style="font-size: 10px; font-weight: 800; color: #0f172a; margin-top: 2px;">${data.peletizado?.nombre || (data.peletizadoId ? 'Peletizado Asignado' : 'Ninguno')}</div>
                <div class="form-percent" style="color: #059669; font-size: 11px;">${v(data.peletizadoPorcentaje, '%')}</div>
              </div>
              <div class="form-card" style="border-left: 3px solid #6366f1; text-align: left;">
                <span class="form-title">Resinas Vírgenes Base</span>
                <div style="font-size: 9px; font-weight: 700; color: #334155; margin-top: 2px;">
                  ${[
                    { k: 'form3003', l: '3003' }, { k: 'formLineal', l: 'Lineal' },
                    { k: 'formFB7000', l: 'FB7000' }, { k: 'form0240', l: '0240' },
                    { k: 'form0348', l: '0348' }, { k: 'form7000F', l: '7000F' }
                  ].filter(r => data[r.k] && Number(data[r.k]) > 0).map(r => `${r.l}: ${data[r.k]}%`).join(' | ') || 'No configuradas'}
                </div>
              </div>
            </div>

            <!-- Aditivos y Pigmentos -->
            <div style="padding-top: 6px; border-top: 1px dashed #e2e8f0;">
              <span class="data-label" style="margin-bottom: 4px; display: block;">Aditivos y Pigmentos Activos (% Adicional):</span>
              <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                ${[
                  { k: 'formDeslizante', l: 'Deslizante' },
                  { k: 'formMasterbachBlanco', l: 'MB Blanco' },
                  { k: 'formMasterbachNegro', l: 'MB Negro' },
                  { k: 'formMasterbachAzul', l: 'MB Azul' },
                  { k: 'formMasterbachAmarillo', l: 'MB Amarillo' },
                ].filter(a => data[a.k] && Number(data[a.k]) > 0).map(a => `
                  <div style="background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 4px; padding: 3px 8px; font-size: 9px;">
                    <span style="color: #475569; font-weight: 600;">${a.l}:</span> 
                    <strong style="color: #0f172a;">${data[a.k]}%</strong>
                  </div>
                `).join('') || '<span style="color: #94a3b8; font-style: italic;">Sin aditivos ni masterbatch configurados.</span>'}
              </div>
            </div>
          </div>
        </div>

        <!-- SECCIÓN 3: ESPECIFICACIONES DE EXTRUSIÓN Y SERIGRAFÍA -->
        <div class="section">
          <div class="section-header">
            <span>3. Especificaciones de Extrusión y Serigrafía</span>
            <span style="font-size: 9px; opacity: 0.85;">PARÁMETROS DE CABEZAL Y TRATAMIENTO</span>
          </div>
          <div class="section-content">
            <div class="grid-4" style="margin-bottom: 8px;">
              <div class="data-item"><span class="data-label">Máquina Extrusora</span><span class="data-value">${v(data.extMaquinaExtrusora)}</span></div>
              <div class="data-item"><span class="data-label">Diámetro Cabezal</span><span class="data-value">${v(data.extDiametroCabezal, 'mm')}</span></div>
              <div class="data-item"><span class="data-label">Temp. Ambiente Ext.</span><span class="data-value">${v(data.extTemperaturaAmbiente, '°C')}</span></div>
              <div class="data-item"><span class="data-label">Motor Principal</span><span class="data-value">${v(data.extMotorPrincipal)}</span></div>
            </div>

            <div class="grid-4" style="margin-bottom: 8px; padding-top: 6px; border-top: 1px dashed #e2e8f0;">
              <div class="data-item"><span class="data-label">Tracción</span><span class="data-value">${v(data.extTraccion)}</span></div>
              <div class="data-item"><span class="data-label">Soplador Principal</span><span class="data-value">${v(data.extSopladorPrincipal)}</span></div>
              <div class="data-item"><span class="data-label">Abertura Blower</span><span class="data-value">${v(data.extAberturaBlower)}</span></div>
              <div class="data-item"><span class="data-label">Cuello Globo / Temp</span><span class="data-value">${v(data.extCuelloGlobo)} (${v(data.extTemperaturaCuelloGlobo, '°C')})</span></div>
            </div>

            <div class="grid-4" style="margin-bottom: 8px; padding-top: 6px; border-top: 1px dashed #e2e8f0;">
              <div class="data-item"><span class="data-label">Tracción Rebobinador</span><span class="data-value">${v(data.extTraccionRebobinador)}</span></div>
              <div class="data-item"><span class="data-label">Winding 1 / Winding 2</span><span class="data-value">${v(data.extRebobinadorWinding1)} / ${v(data.extRebobinadorWinding2)}</span></div>
              <div class="data-item"><span class="data-label">Tratador Corona Ext.</span><span class="data-value">${v(data.extIntensidadTratador || data.intensidadTratador)}</span></div>
              <div class="data-item"><span class="data-label">Flujo Blower</span><span class="data-value">${v(data.extOrientacionFlujoBlower)}</span></div>
            </div>

            <!-- Perfil Térmico Extrusión Z1 a Z20 -->
            <div style="margin-top: 6px; padding-top: 6px; border-top: 1px dashed #e2e8f0;">
              <span class="data-label" style="color: #1d4ed8;">Perfil Térmico de Zonas de Extrusión (°C):</span>
              <div class="zones-grid">
                ${Array.from({ length: 20 }, (_, i) => i + 1).map(i => `
                  <div class="zone-box">
                    <span class="zone-name">Z${i}</span>
                    <span class="zone-val">${data[`extTemperaturaZ${i}`] || '-'}</span>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- Serigrafía (si aplica) -->
            ${data.conImpresion ? `
              <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #cbd5e1;">
                <span class="data-label" style="color: #0f172a; margin-bottom: 4px; display: block;">Detalle de Serigrafía e Impresión:</span>
                <div class="grid-4" style="margin-bottom: 6px;">
                  <div class="data-item"><span class="data-label">Tipo de Impresión</span><span class="data-value">${v(data.tipoImpresion)}</span></div>
                  <div class="data-item"><span class="data-label">Desarrollo Cilindro</span><span class="data-value highlight">${v(data.cilindro, 'cm')}</span></div>
                  <div class="data-item"><span class="data-label">Repeticiones Imagen</span><span class="data-value">${v(data.repeticionesImagen)}</span></div>
                  <div class="data-item"><span class="data-label">Tratador Serigrafía</span><span class="data-value">${v(data.serigrafiaTratadorIntensidad)}</span></div>
                </div>
                <div class="data-item">
                  <span class="data-label">Colores de Tinta:</span>
                  <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-top: 2px;">
                    ${[1, 2, 3, 4, 5, 6].filter(i => data[`color${i}`]).map(i => `
                      <span style="background: #f8fafc; border: 1px solid #cbd5e1; padding: 2px 6px; border-radius: 4px; font-size: 8.5px; font-weight: 700;">
                        C${i}: ${data[`color${i}`]}
                      </span>
                    `).join('') || '<span style="color: #94a3b8;">No especificados</span>'}
                  </div>
                </div>
              </div>
            ` : ''}
          </div>
        </div>

        <!-- SECCIÓN 4: PARÁMETROS TÉCNICOS DE SELLADO (DÍA vs TARDE) -->
        <div class="section no-break">
          <div class="section-header">
            <span>4. Parámetros Técnicos de Sellado (Comparativa de Turnos)</span>
            <span style="font-size: 9px; opacity: 0.85;">TURNO DÍA ☀️ vs TURNO TARDE 🌙</span>
          </div>
          <div class="section-content" style="padding: 0;">
            <table class="table-sellado">
              <thead>
                <tr>
                  <th style="text-align: left; width: 50%;">Parámetro Técnico de Fabricación</th>
                  <th class="dia-header">Turno Día ☀️</th>
                  <th class="tarde-header">Turno Tarde 🌙</th>
                </tr>
              </thead>
              <tbody>
                <tr class="table-subheading"><td colspan="3">1. Control de Temperaturas (°C)</td></tr>
                <tr><td>Temperatura Superior (°C)</td><td class="center">${v(regDia.temperaturaSuperior)}</td><td class="center">${v(regTarde.temperaturaSuperior)}</td></tr>
                <tr><td>Temperatura Inferior (°C)</td><td class="center">${v(regDia.temperaturaInferior)}</td><td class="center">${v(regTarde.temperaturaInferior)}</td></tr>
                <tr><td>Temperatura Válvula (°C)</td><td class="center">${v(regDia.temperaturaValvula)}</td><td class="center">${v(regTarde.temperaturaValvula)}</td></tr>
                <tr><td>Temperatura Cuchilla (°C)</td><td class="center">${v(regDia.temperaturaCuchilla)}</td><td class="center">${v(regTarde.temperaturaCuchilla)}</td></tr>
                <tr><td>Temperatura Presellado A (°C)</td><td class="center">${v(regDia.preselladoA)}</td><td class="center">${v(regTarde.preselladoA)}</td></tr>
                <tr><td>Temperatura Presellado B (°C)</td><td class="center">${v(regDia.preselladoB)}</td><td class="center">${v(regTarde.preselladoB)}</td></tr>
                <tr><td>Temperatura Ambiente en Máquina (°C)</td><td class="center">${v(regDia.temperaturaAmbiente)}</td><td class="center">${v(regTarde.temperaturaAmbiente)}</td></tr>

                <tr class="table-subheading"><td colspan="3">2. Tiempos, Accesorios y Operación</td></tr>
                <tr><td>Tiempo Límite / Tiempo Soldador (ms)</td><td class="center">${v(regDia.tiempoLimite)}</td><td class="center">${v(regTarde.tiempoLimite)}</td></tr>
                <tr><td>Microperforaciones</td><td class="center">${v(regDia.microperforaciones)}</td><td class="center">${v(regTarde.microperforaciones)}</td></tr>
                <tr><td>Muleteado</td><td class="center">${v(regDia.muleteado)}</td><td class="center">${v(regTarde.muleteado)}</td></tr>
                <tr><td>Presión de Troquel de Válvula (PSI)</td><td class="center">${v(regDia.presionTroquelValvula)}</td><td class="center">${v(regTarde.presionTroquelValvula)}</td></tr>

                <tr class="table-subheading"><td colspan="3">3. Velocidades, Balancines y Presiones</td></tr>
                <tr><td>Velocidad de Máquina (GPM) | Ciclo de Trabajo (%)</td><td class="center">${v(regDia.gpm)} GPM | ${v(regDia.cicloTrabajo)}%</td><td class="center">${v(regTarde.gpm)} GPM | ${v(regTarde.cicloTrabajo)}%</td></tr>
                <tr><td>Velocidad Transportador / Banda (cm)</td><td class="center">${v(regDia.velocidadTransportador)}</td><td class="center">${v(regTarde.velocidadTransportador)}</td></tr>
                <tr><td>Rodillo Ancho Válvula (cm)</td><td class="center">${v(regDia.rodilloAnchoValvula)}</td><td class="center">${v(regTarde.rodilloAnchoValvula)}</td></tr>
                <tr><td>Presión Balancín 1 | Balancín 2 | Balancín 3 (bar)</td><td class="center">${v(regDia.presionBalancin1)} / ${v(regDia.presionBalancin2)} / ${v(regDia.presionBalancin3)}</td><td class="center">${v(regTarde.presionBalancin1)} / ${v(regTarde.presionBalancin2)} / ${v(regTarde.presionBalancin3)}</td></tr>
                <tr><td>Presión Soplado Arriba | Abajo (bar)</td><td class="center">${v(regDia.presionSopladoArriba)} / ${v(regDia.presionSopladoAbajo)}</td><td class="center">${v(regTarde.presionSopladoArriba)} / ${v(regTarde.presionSopladoAbajo)}</td></tr>
                <tr><td>Presión Rodillo Servo L | Servo R (bar)</td><td class="center">${v(regDia.presionRodilloServoL)} / ${v(regDia.presionRodilloServoR)}</td><td class="center">${v(regTarde.presionRodilloServoL)} / ${v(regTarde.presionRodilloServoR)}</td></tr>
                <tr><td>Soplar Inicio | Soplar Terminar</td><td class="center">${v(regDia.soplarInicio)} / ${v(regDia.soplarTerminar)}</td><td class="center">${v(regTarde.soplarInicio)} / ${v(regTarde.soplarTerminar)}</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- SECCIÓN 5: AJUSTES MECÁNICOS, FUELLES Y GEOMETRÍA DE VÁLVULA -->
        <div class="section no-break">
          <div class="section-header">
            <span>5. Ajustes Mecánicos, Fuelles y Geometría de Válvula</span>
            <span style="font-size: 9px; opacity: 0.85;">CALIBRACIÓN Y REGLAJES DE MÁQUINA</span>
          </div>
          <div class="section-content">
            <!-- Alturas y Sensores -->
            <div class="grid-4" style="margin-bottom: 8px;">
              <div class="data-item"><span class="data-label">Altura Cabezal Ext. Der.</span><span class="data-value">${v(regDia.alturaCabezalExtDerecho ?? data.alturaCabezalExtDerecho, 'cm')}</span></div>
              <div class="data-item"><span class="data-label">Altura Cabezal Ext. Izq.</span><span class="data-value">${v(regDia.alturaCabezalExtIzquierdo ?? data.alturaCabezalExtIzquierdo, 'cm')}</span></div>
              <div class="data-item"><span class="data-label">Banda Transportadora</span><span class="data-value">${v(regDia.bandaTransportadora ?? data.bandaTransportadora, 'cm')}</span></div>
              <div class="data-item"><span class="data-label">Medida Portabobina</span><span class="data-value">${v(regDia.medidaPortabobina ?? data.medidaPortabobina, 'cm')}</span></div>
            </div>

            <div class="grid-4" style="margin-bottom: 8px; padding-top: 6px; border-top: 1px dashed #e2e8f0;">
              <div class="data-item"><span class="data-label">Ajuste Sensor Fail</span><span class="data-value">${v(regDia.ajusteSensorFail ?? data.ajusteSensorFail)}</span></div>
              <div class="data-item"><span class="data-label">Ángulo Alimentación Bolsa</span><span class="data-value">${v(regDia.feedingBagAngle ?? data.feedingBagAngle, '°')}</span></div>
              <div class="data-item"><span class="data-label">Dist. Sensor Registro Color</span><span class="data-value">${v(regDia.distanciaSensorRegistroColor ?? data.distanciaSensorRegistroColor, 'cm')}</span></div>
              <div class="data-item"><span class="data-label">Dist. Sensor Movimiento / Presell.</span><span class="data-value">${v(regDia.distanciaSensorMovimiento ?? data.distanciaSensorMovimiento, 'cm')} / ${v(regDia.distanciaPresellado ?? data.distanciaPresellado, 'cm')}</span></div>
            </div>

            <!-- Medidas de Fuelles y Fondos -->
            <div class="grid-4" style="margin-bottom: 8px; padding-top: 6px; border-top: 1px dashed #e2e8f0;">
              <div class="data-item"><span class="data-label">Ancho Válvula / Solapa</span><span class="data-value highlight">${v(data.anchoValvula, 'cm')} / ${v(data.anchoSolapa, 'cm')}</span></div>
              <div class="data-item"><span class="data-label">Fuelle Sup. (Izq / Der)</span><span class="data-value">${v(regDia.fuelleSuperiorIzquierdo ?? data.fuelleSuperiorIzquierdo, 'cm')} / ${v(regDia.fuelleSuperiorDerecho ?? data.fuelleSuperiorDerecho, 'cm')}</span></div>
              <div class="data-item"><span class="data-label">Fuelle Inf. (Izq / Der)</span><span class="data-value">${v(regDia.fuelleInferiorIzquierdo ?? data.fuelleInferiorIzquierdo, 'cm')} / ${v(regDia.fuelleInferiorDerecho ?? data.fuelleInferiorDerecho, 'cm')}</span></div>
              <div class="data-item"><span class="data-label">Bolsa Después Triángulo / Long.</span><span class="data-value">${v(regDia.anchoBolsaDespuesTriangulo ?? data.anchoBolsaDespuesTriangulo, 'cm')} / ${v(regDia.longitudBolsa ?? data.longitudBolsa, 'cm')}</span></div>
            </div>

            <!-- Tornillería y Calibración -->
            <div class="grid-4" style="padding-top: 6px; border-top: 1px dashed #e2e8f0;">
              <div class="data-item"><span class="data-label">Tornillo Espárrago</span><span class="data-value">${v(regDia.tornilloEsparrago ?? data.tornilloEsparrago)}</span></div>
              <div class="data-item"><span class="data-label">Amortiguador Cabezal (A, B, C)</span><span class="data-value">${v(regDia.tornilloAmortiguadorCabezalA ?? data.tornilloAmortiguadorCabezalA)} / ${v(regDia.tornilloAmortiguadorCabezalB ?? data.tornilloAmortiguadorCabezalB)} / ${v(regDia.tornilloAmortiguadorCabezalC ?? data.tornilloAmortiguadorCabezalC)}</span></div>
              <div class="data-item"><span class="data-label">Mov. Horiz. Cabezal Der (D/I)</span><span class="data-value">${v(regDia.tornilloDerMovHorizCabezalDer ?? data.tornilloDerMovHorizCabezalDer)} / ${v(regDia.tornilloIzqMovHorizCabezalDer ?? data.tornilloIzqMovHorizCabezalDer)}</span></div>
              <div class="data-item"><span class="data-label">Mov. Horiz. Cabezal Izq (D/I)</span><span class="data-value">${v(regDia.tornilloDerMovHorizCabezalIzq ?? data.tornilloDerMovHorizCabezalIzq)} / ${v(regDia.tornilloIzqMovHorizCabezalIzq ?? data.tornilloIzqMovHorizCabezalIzq)}</span></div>
            </div>

            ${(data.tipoBolsa === 'asa' || data.esBolsaASA) ? `
              <div class="grid-3" style="margin-top: 6px; padding-top: 6px; border-top: 1px dashed #e2e8f0;">
                <div class="data-item"><span class="data-label">Fuelle ASA</span><span class="data-value">${v(data.fuelleASA, 'cm')}</span></div>
                <div class="data-item"><span class="data-label">Ancho Troquel ASA</span><span class="data-value">${v(data.anchoTroquelASA, 'cm')}</span></div>
                <div class="data-item"><span class="data-label">Largo Troquel ASA</span><span class="data-value">${v(data.largoTroquelASA, 'cm')}</span></div>
              </div>
            ` : ''}
          </div>
        </div>

        <!-- FIRMAS Y PIE TÉCNICO -->
        <div style="margin-top: 14px; page-break-inside: avoid; break-inside: avoid;">
          <table style="width: 100%; border-collapse: collapse; text-align: center; margin-bottom: 8px;">
            <tr>
              <td style="width: 33%; padding: 12px; border: 1px solid #cbd5e1; background: #fafafa;">
                <div style="height: 30px;"></div>
                <div style="border-top: 1px solid #0f172a; padding-top: 4px; font-weight: 800; font-size: 8.5px;">SUPERVISOR DE PRODUCCIÓN</div>
              </td>
              <td style="width: 33%; padding: 12px; border: 1px solid #cbd5e1; background: #fafafa;">
                <div style="height: 30px;"></div>
                <div style="border-top: 1px solid #0f172a; padding-top: 4px; font-weight: 800; font-size: 8.5px;">CONTROL DE CALIDAD</div>
              </td>
              <td style="width: 33%; padding: 12px; border: 1px solid #cbd5e1; background: #fafafa;">
                <div style="height: 30px;"></div>
                <div style="border-top: 1px solid #0f172a; padding-top: 4px; font-weight: 800; font-size: 8.5px;">OPERARIO DE MÁQUINA</div>
              </td>
            </tr>
          </table>
          <div class="footer-info">
            Este documento es propiedad confidencial de ERP INDUSTRIAL. Prohibida su reproducción sin autorización.<br>
            Generado automáticamente por el Sistema de Gestión Industrial el ${format(new Date(), 'dd/MM/yyyy HH:mm')}
          </div>
        </div>
        
        </body></html>
      `;
    }

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
