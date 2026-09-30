import { prisma } from '@/lib/db';
import { AreaProduccion, EstadoProduccion, CategoriaInventario, TipoMovimiento } from '@prisma/client';
import { format } from 'date-fns';

export interface FiltrosReporteProduccion {
  fechaInicio?: string | null;
  fechaFin?: string | null;
  area?: AreaProduccion | string | null;
  clienteId?: string | null;
  maquinaId?: string | null;
}

export async function getReporteProduccion(filtros: FiltrosReporteProduccion = {}) {
  try {
    const where: any = {};

    // 1. Rango de Fechas (00:00:00 a 23:59:59)
    if (filtros.fechaInicio || filtros.fechaFin) {
      where.fecha = {};
      if (filtros.fechaInicio) {
        where.fecha.gte = new Date(`${filtros.fechaInicio}T00:00:00.000Z`);
      }
      if (filtros.fechaFin) {
        where.fecha.lte = new Date(`${filtros.fechaFin}T23:59:59.999Z`);
      }
    }

    // 2. Filtro por Área
    if (filtros.area && Object.values(AreaProduccion).includes(filtros.area as AreaProduccion)) {
      where.area = filtros.area as AreaProduccion;
    }

    // 3. Filtro por Máquina
    if (filtros.maquinaId) {
      where.maquinaId = filtros.maquinaId;
    }

    // 4. Filtro por Cliente
    if (filtros.clienteId) {
      where.OR = [
        { pedido: { clienteId: filtros.clienteId } },
        { productoCliente: { clienteId: filtros.clienteId } },
      ];
    }

    // Intentar primero con órdenes Finalizadas (cerradas)
    let producciones = await prisma.produccion.findMany({
      where: {
        ...where,
        estado: EstadoProduccion.Finalizado,
      },
      include: {
        maquina: true,
        pedido: { include: { cliente: true } },
        productoCliente: { include: { cliente: true, peletizado: true } },
        registros: true,
      },
      orderBy: { fecha: 'desc' },
    });

    // Si no hay finalizadas en el rango, incluir todas las del período para no bloquear la visualización
    if (producciones.length === 0) {
      producciones = await prisma.produccion.findMany({
        where,
        include: {
          maquina: true,
          pedido: { include: { cliente: true } },
          productoCliente: { include: { cliente: true, peletizado: true } },
          registros: true,
        },
        orderBy: { fecha: 'desc' },
      });
    }

    // A. Kilos Extruidos y Bolsas Selladas
    const prodsExtrusion = producciones.filter(p => p.area === AreaProduccion.Extrusion);
    const prodsSellado = producciones.filter(p => p.area === AreaProduccion.Sellado);
    const prodsSerigrafia = producciones.filter(p => p.area === AreaProduccion.Serigrafia);
    const prodsRefilado = producciones.filter(p => p.area === AreaProduccion.Refilado);

    const kilosExtruidos = prodsExtrusion.reduce((acc, p) => acc + (Number(p.cantidadProducida) || 0), 0);
    const bolsasSelladas = prodsSellado.reduce((acc, p) => {
      return acc + (p.unidad === 'Unidades' ? (Number(p.cantidadProducida) || 0) : 0);
    }, 0);

    // Kilos Producidos Totales (para cálculo de balance y eficiencia general)
    let totalProducidoKg = 0;
    producciones.forEach(p => {
      const cant = Number(p.cantidadProducida) || 0;
      if (p.area === AreaProduccion.Extrusion || p.area === AreaProduccion.Refilado) {
        totalProducidoKg += cant;
      } else if (p.area === AreaProduccion.Sellado) {
        if (p.unidad === 'Kilogramos') {
          totalProducidoKg += cant;
        } else {
          const pesoUnitGramos = Number(p.productoCliente?.pesoPorUnidad) || 25;
          totalProducidoKg += (cant * pesoUnitGramos) / 1000;
        }
      } else {
        totalProducidoKg += cant;
      }
    });

    // B. Desglose Consolidado de Mermas (MOLIDO 1 al 5)
    let mermaMolido1 = 0; // mermaTransparenteAlta
    let mermaMolido2 = 0; // mermaBlancoPollo
    let mermaMolido3 = 0; // mermaColor
    let mermaMolido4 = 0; // mermaTransparenteBaja
    let mermaMolido5 = 0; // mermaBlancoPego
    let mermaTotal = 0;

    producciones.forEach(p => {
      const m1 = Number(p.mermaTransparenteAlta) || 0;
      const m2 = Number(p.mermaBlancoPollo) || 0;
      const m3 = Number(p.mermaColor) || 0;
      const m4 = Number(p.mermaTransparenteBaja) || 0;
      const m5 = Number(p.mermaBlancoPego) || 0;
      const mTotalReg = Number(p.merma) || (m1 + m2 + m3 + m4 + m5);

      mermaTotal += mTotalReg;

      // Si tiene desglose explícito:
      if (m1 > 0 || m2 > 0 || m3 > 0 || m4 > 0 || m5 > 0) {
        mermaMolido1 += m1;
        mermaMolido2 += m2;
        mermaMolido3 += m3;
        mermaMolido4 += m4;
        mermaMolido5 += m5;
      } else if (mTotalReg > 0) {
        // Atribución inteligente según tipo de producto si no se desglosó
        const prod = p.productoCliente;
        if (prod?.conPigmento || (prod?.formMasterbachNegro && prod.formMasterbachNegro > 0) || (prod?.formMasterbachAzul && prod.formMasterbachAzul > 0)) {
          mermaMolido3 += mTotalReg; // Color
        } else if (prod?.formMasterbachBlanco && prod.formMasterbachBlanco > 0) {
          if (prod.tipoBolsa?.toLowerCase().includes('pego')) {
            mermaMolido5 += mTotalReg; // Blanco Pego
          } else {
            mermaMolido2 += mTotalReg; // Blanco Pollo
          }
        } else if (prod?.material?.toLowerCase().includes('alta')) {
          mermaMolido1 += mTotalReg; // Transparente Alta
        } else {
          mermaMolido4 += mTotalReg; // Transparente Baja
        }
      }
    });

    // C. Eficiencia Global
    const totalEntradaKg = totalProducidoKg + mermaTotal;
    const eficienciaGlobal = totalEntradaKg > 0 
      ? Number(((totalProducidoKg / totalEntradaKg) * 100).toFixed(1))
      : 100;

    // D. Conteo Total de Registros y Turnos
    const totalRegistros = producciones.reduce((acc, p) => acc + Math.max(1, p.registros?.length || 0), 0);

    // E. Consumo Acumulado de Materias Primas en Extrusión
    const resinasVirgenes: Record<string, number> = {
      '3003': 0,
      'Lineal': 0,
      'FB7000': 0,
      '0240': 0,
      '0348': 0,
      '7000F': 0,
    };
    let totalPeletizadoKg = 0;
    const aditivos: Record<string, number> = {
      'Deslizante': 0,
      'Masterbatch Blanco': 0,
      'Masterbatch Negro': 0,
      'Masterbatch Azul': 0,
      'Masterbatch Amarillo': 0,
    };

    prodsExtrusion.forEach(p => {
      const kgExt = Number(p.cantidadProducida) || 0;
      const formulacion = p.productoCliente;

      if (formulacion && kgExt > 0) {
        // Peletizado
        const peletizadoPct = Number(formulacion.peletizadoPorcentaje) || 0;
        const kgPelet = kgExt * (peletizadoPct / 100);
        totalPeletizadoKg += kgPelet;

        // Vírgenes
        const kgVirgenTotal = Math.max(0, kgExt - kgPelet);
        const f3003 = Number(formulacion.form3003) || 0;
        const fLineal = Number(formulacion.formLineal) || 0;
        const fFB7000 = Number(formulacion.formFB7000) || 0;
        const f0240 = Number(formulacion.form0240) || 0;
        const f0348 = Number(formulacion.form0348) || 0;
        const f7000F = Number(formulacion.form7000F) || 0;
        const sumaVirgen = f3003 + fLineal + fFB7000 + f0240 + f0348 + f7000F;

        if (sumaVirgen > 0) {
          resinasVirgenes['3003'] += kgVirgenTotal * (f3003 / sumaVirgen);
          resinasVirgenes['Lineal'] += kgVirgenTotal * (fLineal / sumaVirgen);
          resinasVirgenes['FB7000'] += kgVirgenTotal * (fFB7000 / sumaVirgen);
          resinasVirgenes['0240'] += kgVirgenTotal * (f0240 / sumaVirgen);
          resinasVirgenes['0348'] += kgVirgenTotal * (f0348 / sumaVirgen);
          resinasVirgenes['7000F'] += kgVirgenTotal * (f7000F / sumaVirgen);
        } else {
          resinasVirgenes['3003'] += kgVirgenTotal * 0.75;
          resinasVirgenes['Lineal'] += kgVirgenTotal * 0.25;
        }

        // Aditivos
        aditivos['Deslizante'] += kgExt * ((Number(formulacion.formDeslizante) || 0) / 100);
        aditivos['Masterbatch Blanco'] += kgExt * ((Number(formulacion.formMasterbachBlanco) || 0) / 100);
        aditivos['Masterbatch Negro'] += kgExt * ((Number(formulacion.formMasterbachNegro) || 0) / 100);
        aditivos['Masterbatch Azul'] += kgExt * ((Number(formulacion.formMasterbachAzul) || 0) / 100);
        aditivos['Masterbatch Amarillo'] += kgExt * ((Number(formulacion.formMasterbachAmarillo) || 0) / 100);
      } else if (kgExt > 0) {
        // Valores promedio si no hay formulación explícita
        resinasVirgenes['3003'] += kgExt * 0.70;
        resinasVirgenes['Lineal'] += kgExt * 0.30;
      }
    });

    const totalVirgenesKg = Object.values(resinasVirgenes).reduce((a, b) => a + b, 0);
    const totalAditivosKg = Object.values(aditivos).reduce((a, b) => a + b, 0);
    const totalConsumoMp = totalVirgenesKg + totalPeletizadoKg + totalAditivosKg;

    // F. Resumen por Área
    const calcularArea = (prods: typeof producciones, defaultUnidad: string) => {
      const producido = prods.reduce((acc, p) => acc + (Number(p.cantidadProducida) || 0), 0);
      const merma = prods.reduce((acc, p) => acc + (Number(p.merma) || 0), 0);
      const total = producido + merma;
      return {
        producido: Number(producido.toFixed(2)),
        unidad: defaultUnidad,
        merma: Number(merma.toFixed(2)),
        eficiencia: total > 0 ? Number(((producido / total) * 100).toFixed(1)) : 100,
        registros: prods.length,
      };
    };

    const resumenPorArea = {
      Extrusion: calcularArea(prodsExtrusion, 'KG'),
      Serigrafia: calcularArea(prodsSerigrafia, 'KG'),
      Sellado: calcularArea(prodsSellado, 'Bolsas'),
      Refilado: calcularArea(prodsRefilado, 'KG'),
    };

    const porArea = [
      { area: 'Extrusión', cantidadProducida: resumenPorArea.Extrusion.producido, unidad: 'KG', merma: resumenPorArea.Extrusion.merma, eficiencia: resumenPorArea.Extrusion.eficiencia, registros: resumenPorArea.Extrusion.registros },
      { area: 'Serigrafía', cantidadProducida: resumenPorArea.Serigrafia.producido, unidad: 'KG', merma: resumenPorArea.Serigrafia.merma, eficiencia: resumenPorArea.Serigrafia.eficiencia, registros: resumenPorArea.Serigrafia.registros },
      { area: 'Sellado', cantidadProducida: resumenPorArea.Sellado.producido, unidad: 'Bolsas', merma: resumenPorArea.Sellado.merma, eficiencia: resumenPorArea.Sellado.eficiencia, registros: resumenPorArea.Sellado.registros },
      { area: 'Refilado', cantidadProducida: resumenPorArea.Refilado.producido, unidad: 'KG', merma: resumenPorArea.Refilado.merma, eficiencia: resumenPorArea.Refilado.eficiencia, registros: resumenPorArea.Refilado.registros },
    ];

    // G. Producción por Día
    const produccionPorDia: Record<string, number> = {};
    producciones.forEach(p => {
      const dia = format(new Date(p.fecha), 'yyyy-MM-dd');
      produccionPorDia[dia] = (produccionPorDia[dia] || 0) + (Number(p.cantidadProducida) || 0);
    });

    // H. Detalle de Producciones (Turnos)
    const turnosDetallados = producciones.map(p => ({
      id: p.id,
      fecha: format(new Date(p.fecha), 'yyyy-MM-dd'),
      fechaFormatted: format(new Date(p.fecha), 'dd/MM/yyyy'),
      turno: p.turno,
      area: p.area,
      orden: p.codigoLote || (p.pedidoId ? `PED-${p.pedidoId.slice(0, 6).toUpperCase()}` : p.id.slice(0, 8).toUpperCase()),
      producto: p.productoCliente?.nombreProducto || 'Genérico',
      cliente: p.pedido?.cliente?.nombre || p.productoCliente?.cliente?.nombre || 'General',
      cantidadProducida: Number(p.cantidadProducida) || 0,
      unidad: p.unidad,
      merma: Number(p.merma) || 0,
      operario: p.operario || 'Sin asignar',
      maquina: p.maquina?.nombre || '-',
      estado: p.estado,
      mermas: {
        molido1: Number(p.mermaTransparenteAlta) || 0,
        molido2: Number(p.mermaBlancoPollo) || 0,
        molido3: Number(p.mermaColor) || 0,
        molido4: Number(p.mermaTransparenteBaja) || 0,
        molido5: Number(p.mermaBlancoPego) || 0,
      },
    }));

    return {
      totales: {
        kilosExtruidos: Number(kilosExtruidos.toFixed(2)),
        bolsasSelladas: Math.round(bolsasSelladas),
        kilosTotales: Number(totalProducidoKg.toFixed(2)),
        mermaTotal: Number(mermaTotal.toFixed(2)),
        registros: totalRegistros,
        eficienciaGlobal,
        consumoMpTotal: Number(totalConsumoMp.toFixed(2)),
        produccion: Number(totalProducidoKg.toFixed(2)), // Para compatibilidad
        merma: Number(mermaTotal.toFixed(2)),            // Para compatibilidad
        eficiencia: `${eficienciaGlobal}%`,             // Para compatibilidad
      },
      mermasPorTipo: {
        mermaTransparenteAlta: Number(mermaMolido1.toFixed(2)),
        mermaBlancoPollo: Number(mermaMolido2.toFixed(2)),
        mermaColor: Number(mermaMolido3.toFixed(2)),
        mermaTransparenteBaja: Number(mermaMolido4.toFixed(2)),
        mermaBlancoPego: Number(mermaMolido5.toFixed(2)),
        total: Number(mermaTotal.toFixed(2)),
      },
      balanceMateriales: {
        virgenes: {
          total: Number(totalVirgenesKg.toFixed(2)),
          desglose: Object.entries(resinasVirgenes)
            .filter(([_, kg]) => kg > 0)
            .map(([resina, kg]) => ({ resina, kg: Number(kg.toFixed(2)) })),
        },
        peletizado: {
          total: Number(totalPeletizadoKg.toFixed(2)),
        },
        aditivos: {
          total: Number(totalAditivosKg.toFixed(2)),
          desglose: Object.entries(aditivos)
            .filter(([_, kg]) => kg > 0)
            .map(([aditivo, kg]) => ({ aditivo, kg: Number(kg.toFixed(2)) })),
        },
        totalConsumo: Number(totalConsumoMp.toFixed(2)),
        mermaRecuperada: Number(mermaTotal.toFixed(2)),
      },
      resumenPorArea,
      porArea,
      producciones: turnosDetallados,
      produccionPorDia,
    };
  } catch (error: any) {
    console.error('Error en getReporteProduccion:', error);
    throw new Error(error.message || 'Error al obtener reporte de producción');
  }
}

export interface FiltrosReporteInventario {
  fechaInicio?: string | null;
  fechaFin?: string | null;
  desde?: string | null;
  hasta?: string | null;
  categoria?: CategoriaInventario | string | null;
  userId?: string | null;
}

export async function getReporteInventario(filtros: FiltrosReporteInventario = {}) {
  try {
    const fInicio = filtros.fechaInicio || filtros.desde;
    const fFin = filtros.fechaFin || filtros.hasta;

    const fechaFiltro: any = {};
    if (fInicio) {
      const inicio = new Date(fInicio);
      inicio.setHours(0, 0, 0, 0);
      const utcInicio = new Date(`${fInicio}T00:00:00.000Z`);
      fechaFiltro.gte = new Date(Math.min(inicio.getTime(), utcInicio.getTime() - 14 * 3600 * 1000));
    }
    if (fFin) {
      const fin = new Date(fFin);
      fin.setHours(23, 59, 59, 999);
      // Ensure we cover up to 14 hours past UTC midnight to encompass all local timezones (e.g., UTC-4)
      const utcFin = new Date(`${fFin}T23:59:59.999Z`);
      const utcFinWithBuffer = new Date(utcFin.getTime() + 14 * 3600 * 1000);
      fechaFiltro.lte = new Date(Math.max(fin.getTime(), utcFinWithBuffer.getTime()));
    }

    // 1. Obtener todos los artículos de inventario base
    const whereInventario: any = {};
    if (filtros.userId) {
      whereInventario.userId = filtros.userId;
    }
    if (filtros.categoria && Object.values(CategoriaInventario).includes(filtros.categoria as CategoriaInventario)) {
      whereInventario.categoria = filtros.categoria as CategoriaInventario;
    }

    const inventarios = await prisma.inventario.findMany({
      where: whereInventario,
      orderBy: [
        { categoria: 'asc' },
        { nombre: 'asc' },
      ],
    });

    // 2. Consultar los lotes de Producto Terminado disponibles / listos para despacho
    const wherePT: any = {
      estado: { in: ['ListoDespacho', 'PendienteArea'] },
      cantidadDisponible: { gt: 0 },
    };
    if (filtros.userId) {
      wherePT.userId = filtros.userId;
    }
    if (fechaFiltro.lte) {
      wherePT.createdAt = {
        ...(fechaFiltro.gte ? { gte: fechaFiltro.gte } : {}),
        lte: fechaFiltro.lte,
      };
    }

    const productosTerminadosDb = await prisma.productoTerminado.findMany({
      where: wherePT,
      include: {
        cliente: {
          include: {
            productos: true,
          }
        },
        productoCliente: true,
        produccion: {
          include: {
            productoCliente: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    let totalKgLotesTerminados = 0;
    let totalUndLotesTerminados = 0;

    const lotesTerminadosDetallados = productosTerminadosDb.map(p => {
      const isKg = p.unidad === 'Kilogramos' || p.tipoProducto === 'Bobina';
      const cant = Number(p.cantidadDisponible) || 0;
      
      let pesoKg = 0;
      let und = 0;

      if (isKg) {
        pesoKg = cant;
        totalKgLotesTerminados += pesoKg;
      } else {
        und = cant;
        totalUndLotesTerminados += und;
        const pesoPorUnidadGramos = Number(p.productoCliente?.pesoPorUnidad) || 
          Number(p.produccion?.productoCliente?.pesoPorUnidad) || 
          Number(p.cliente?.productos?.[0]?.pesoPorUnidad) || 0;
        if (pesoPorUnidadGramos > 0) {
          pesoKg = (cant * pesoPorUnidadGramos) / 1000;
          totalKgLotesTerminados += pesoKg;
        }
      }

      // Resolver nombre de producto descriptivo
      const nombreProducto = p.productoCliente?.nombreProducto || 
        p.produccion?.productoCliente?.nombreProducto || 
        p.cliente?.productos?.[0]?.nombreProducto || 
        (p.descripcion && !p.descripcion.toLowerCase().includes('ingresado desde') ? p.descripcion : null) || 
        (p.tipoProducto === 'Bobina' ? 'Bobina Plástica' : 'Bolsa Plástica');

      const clienteNombre = p.cliente?.nombre || 'General';

      return {
        id: p.id,
        lote: p.codigoLote || p.loteOrigen || 'S/L',
        codigoLote: p.codigoLote || p.loteOrigen || 'S/L',
        producto: nombreProducto,
        cliente: clienteNombre,
        productoCliente: `${nombreProducto} - ${clienteNombre}`,
        cantidad: cant,
        pesoKg: Number(pesoKg.toFixed(2)),
        unidades: Math.round(und),
        isKg,
        unidad: isKg ? 'KG' : 'UND',
        stockFisico: und > 0 && pesoKg > 0
          ? `${Math.round(und).toLocaleString('es-VE')} UND (${pesoKg.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} KG)`
          : isKg
            ? `${pesoKg.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} KG`
            : `${Math.round(und).toLocaleString('es-VE')} UND`,
        estado: p.estado === 'ListoDespacho' ? 'Listo para Despacho' : p.estado,
        fechaIngreso: format(new Date(p.createdAt), 'dd/MM/yyyy'),
        createdAt: p.createdAt,
      };
    });

    const cantidadLotes = lotesTerminadosDetallados.length;

    // 3. Conteo de ítems por estado de stock
    const stockBajo = inventarios.filter(i => Number(i.cantidad) <= Number(i.stockMinimo));
    const stockOptimo = inventarios.filter(i => Number(i.cantidad) > Number(i.stockMinimo));
    const totalItems = inventarios.length + cantidadLotes;

    // 4. Valor monetario total del inventario
    const valorInventario = inventarios.reduce((acc, i) => {
      const costo = Number(i.costo) || 0;
      return acc + (Number(i.cantidad) * costo);
    }, 0);

    const valorInventarioFormatted = valorInventario > 0
      ? `$ ${valorInventario.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : '$ 0,00';

    // 5. Agrupación por Categoría y Desgloses Especiales (Materia Prima, Peletizado, Aditivos, Producto Terminado)
    const itemsMateriaPrima = inventarios.filter(i => i.categoria === CategoriaInventario.MateriaPrima);
    const itemsPeletizado = inventarios.filter(i => i.categoria === CategoriaInventario.Peletizado);
    const itemsAditivo = inventarios.filter(i => i.categoria === CategoriaInventario.Aditivo);
    const itemsProductoTerminado = inventarios.filter(i => i.categoria === CategoriaInventario.ProductoTerminado);

    const kgMateriaPrima = itemsMateriaPrima.reduce((acc, i) => acc + (Number(i.cantidad) || 0), 0);
    const kgPeletizado = itemsPeletizado.reduce((acc, i) => acc + (Number(i.cantidad) || 0), 0);
    const kgAditivos = itemsAditivo.reduce((acc, i) => acc + (Number(i.cantidad) || 0), 0);
    
    let totalBolsasTerminadas = 0;
    let totalBobinasTerminadasKg = 0;
    itemsProductoTerminado.forEach(i => {
      const cant = Number(i.cantidad) || 0;
      const u = (i.unidad || '').toLowerCase();
      if (u.includes('und') || u.includes('unidad') || u.includes('bolsa')) {
        totalBolsasTerminadas += cant;
      } else {
        totalBobinasTerminadasKg += cant;
      }
    });

    const totalKgTerminado = totalBobinasTerminadasKg + totalKgLotesTerminados;
    const totalUndTerminado = totalBolsasTerminadas + totalUndLotesTerminados;

    // Molidos 1 al 5 en Peletizado
    const molidosDetalle = [
      { molido: 'MOLIDO 1', tipo: 'Transparente Alta', codigoKey: 'molido 1' },
      { molido: 'MOLIDO 2', tipo: 'Blanco Pollo', codigoKey: 'molido 2' },
      { molido: 'MOLIDO 3', tipo: 'Color', codigoKey: 'molido 3' },
      { molido: 'MOLIDO 4', tipo: 'Transparente Baja', codigoKey: 'molido 4' },
      { molido: 'MOLIDO 5', tipo: 'Blanco Pego', codigoKey: 'molido 5' },
    ].map(m => {
      const match = itemsPeletizado.find(item => 
        item.codigo.toLowerCase().includes(m.codigoKey) || 
        item.nombre.toLowerCase().includes(m.tipo.toLowerCase())
      );
      return {
        molido: m.molido,
        tipo: m.tipo,
        nombre: match?.nombre || `Peletizado ${m.tipo}`,
        codigo: match?.codigo || m.codigoKey,
        cantidad: match ? Number(match.cantidad) : 0,
        stockMinimo: match ? Number(match.stockMinimo) : 0,
        unidad: match?.unidad || 'Kg',
      };
    });

    // Resumen estructurado por categoría (para tablas de compatibilidad)
    const resumenPorCategoria: Record<string, { items: number; valorTotal: number; stockBajo: number; stockTotal: number }> = {};
    const porCategoriaArray = [
      {
        categoria: 'Materia Prima',
        categoriaKey: CategoriaInventario.MateriaPrima,
        items: itemsMateriaPrima.length,
        stockTotal: kgMateriaPrima,
        unidad: 'Kg',
        valorTotal: itemsMateriaPrima.reduce((acc, i) => acc + (Number(i.cantidad) * (Number(i.costo) || 0)), 0),
        stockBajo: itemsMateriaPrima.filter(i => Number(i.cantidad) <= Number(i.stockMinimo)).length,
      },
      {
        categoria: 'Peletizado / Recuperado',
        categoriaKey: CategoriaInventario.Peletizado,
        items: itemsPeletizado.length,
        stockTotal: kgPeletizado,
        unidad: 'Kg',
        valorTotal: itemsPeletizado.reduce((acc, i) => acc + (Number(i.cantidad) * (Number(i.costo) || 0)), 0),
        stockBajo: itemsPeletizado.filter(i => Number(i.cantidad) <= Number(i.stockMinimo)).length,
      },
      {
        categoria: 'Aditivos & Masterbatch',
        categoriaKey: CategoriaInventario.Aditivo,
        items: itemsAditivo.length,
        stockTotal: kgAditivos,
        unidad: 'Kg',
        valorTotal: itemsAditivo.reduce((acc, i) => acc + (Number(i.cantidad) * (Number(i.costo) || 0)), 0),
        stockBajo: itemsAditivo.filter(i => Number(i.cantidad) <= Number(i.stockMinimo)).length,
      },
      {
        categoria: 'Producto Terminado',
        categoriaKey: CategoriaInventario.ProductoTerminado,
        items: itemsProductoTerminado.length + cantidadLotes,
        stockTotal: totalKgTerminado > 0 ? totalKgTerminado : totalUndTerminado,
        unidad: totalKgTerminado > 0 ? 'Kg' : 'Und',
        valorTotal: itemsProductoTerminado.reduce((acc, i) => acc + (Number(i.cantidad) * (Number(i.costo) || 0)), 0),
        stockBajo: itemsProductoTerminado.filter(i => Number(i.cantidad) <= Number(i.stockMinimo)).length,
        cantidadLotes,
      },
    ];

    porCategoriaArray.forEach(cat => {
      resumenPorCategoria[cat.categoriaKey] = {
        items: cat.items,
        valorTotal: cat.valorTotal,
        stockBajo: cat.stockBajo,
        stockTotal: cat.stockTotal,
      };
    });

    // 5. Alertas de Stock Bajo / Crítico
    const categoriaNombreMap: Record<string, string> = {
      MateriaPrima: 'Materia Prima',
      Peletizado: 'Peletizado',
      Aditivo: 'Aditivo',
      ProductoTerminado: 'Producto Terminado',
    };

    const alertasStockBajo = stockBajo.map(item => {
      const cant = Number(item.cantidad);
      const min = Number(item.stockMinimo);
      const deficit = Math.max(0, min - cant);
      const esAgotado = cant <= 0;
      return {
        id: item.id,
        nombre: item.nombre,
        codigo: item.codigo,
        categoria: item.categoria,
        categoriaLabel: categoriaNombreMap[item.categoria] || item.categoria,
        stockActual: cant,
        stockMinimo: min,
        diferencia: deficit,
        unidad: item.unidad || 'Kg',
        costo: Number(item.costo) || 0,
        estado: esAgotado ? 'Agotado' : 'Stock Bajo',
        ubicacion: item.ubicacion || 'Almacén Principal',
      };
    });

    // 6. Consultar Movimientos de Inventario en el rango de fechas
    const whereMovimientos: any = {};
    if (Object.keys(fechaFiltro).length > 0) {
      whereMovimientos.fecha = fechaFiltro;
    }

    const movimientosDb = await prisma.movimientoInventario.findMany({
      where: whereMovimientos,
      include: {
        inventario: true,
      },
      orderBy: { fecha: 'desc' },
      take: 200,
    });

    // Totales del Kardex
    let totalKilosEntrantes = 0;
    let totalKilosSalientes = 0;
    let countEntradas = 0;
    let countSalidas = 0;

    const movimientosDetallados = movimientosDb.map(m => {
      const cant = Number(m.cantidad) || 0;
      const isEntrada = m.tipo === TipoMovimiento.Entrada || m.tipo === TipoMovimiento.Devolucion;
      const isSalida = m.tipo === TipoMovimiento.Salida;

      if (isEntrada) {
        totalKilosEntrantes += cant;
        countEntradas++;
      } else if (isSalida) {
        totalKilosSalientes += cant;
        countSalidas++;
      } else if (m.tipo === TipoMovimiento.Ajuste) {
        // En ajuste se puede considerar entrada o salida según motivo
        countEntradas++;
      }

      return {
        id: m.id,
        fecha: format(new Date(m.fecha), 'yyyy-MM-dd'),
        fechaFormatted: format(new Date(m.fecha), 'dd/MM/yyyy HH:mm'),
        articulo: m.inventario?.nombre || 'Artículo eliminado',
        codigo: m.inventario?.codigo || '-',
        categoria: m.inventario?.categoria || '-',
        categoriaLabel: categoriaNombreMap[m.inventario?.categoria || ''] || m.inventario?.categoria || '-',
        tipo: m.tipo,
        cantidad: cant,
        unidad: m.inventario?.unidad || 'Kg',
        concepto: m.motivo || m.referencia || (isEntrada ? 'Ingreso a Almacén' : 'Salida / Consumo'),
        referencia: m.referencia || '-',
        responsable: m.responsable || 'Almacén',
      };
    });

    const balanceNeto = totalKilosEntrantes - totalKilosSalientes;
    const totalMovimientos = movimientosDb.length;

    // 7. Todos los artículos serializados para listados (incluyendo lotes de producto terminado)
    const inventariosListadoBase = inventarios.map(i => ({
      id: i.id,
      nombre: i.nombre,
      codigo: i.codigo,
      categoria: i.categoria,
      categoriaLabel: categoriaNombreMap[i.categoria] || i.categoria,
      cantidad: Number(i.cantidad),
      unidad: i.unidad,
      stockMinimo: Number(i.stockMinimo),
      stockMaximo: i.stockMaximo ? Number(i.stockMaximo) : null,
      costo: Number(i.costo) || 0,
      valorTotal: Number(i.cantidad) * (Number(i.costo) || 0),
      ubicacion: i.ubicacion || '-',
      proveedor: i.proveedor || '-',
      estadoStock: Number(i.cantidad) <= 0 
        ? 'Agotado' 
        : Number(i.cantidad) <= Number(i.stockMinimo) 
          ? 'Stock Bajo' 
          : 'Óptimo',
    }));

    const lotesListadoParaInventarios = lotesTerminadosDetallados.map(l => ({
      id: l.id,
      nombre: `${l.producto} (${l.cliente})`,
      codigo: l.lote,
      categoria: CategoriaInventario.ProductoTerminado,
      categoriaLabel: 'Producto Terminado',
      cantidad: l.isKg ? l.pesoKg : (l.unidades || l.cantidad),
      unidad: l.unidad,
      stockMinimo: 0,
      stockMaximo: null,
      costo: 0,
      valorTotal: 0,
      ubicacion: 'Almacén Producto Terminado',
      proveedor: l.cliente,
      estadoStock: 'Óptimo',
    }));

    const inventariosListado = [...inventariosListadoBase, ...lotesListadoParaInventarios];

    return {
      totales: {
        totalItems,
        valorInventario: Number(valorInventario.toFixed(2)),
        valorInventarioFormatted,
        itemsStockBajo: stockBajo.length,
        itemsStockOptimo: stockOptimo.length + cantidadLotes,
        totalMovimientos,
        kilosEntrantes: Number(totalKilosEntrantes.toFixed(2)),
        kilosSalientes: Number(totalKilosSalientes.toFixed(2)),
        balanceNeto: Number(balanceNeto.toFixed(2)),
        countEntradas,
        countSalidas,
        // Compatibilidad con KPI cards genéricas
        items: totalItems,
        valorTotal: Number(valorInventario.toFixed(2)),
      },
      consolidadoCategorias: {
        materiaPrima: {
          totalKg: Number(kgMateriaPrima.toFixed(2)),
          itemsCount: itemsMateriaPrima.length,
          stockBajoCount: itemsMateriaPrima.filter(i => Number(i.cantidad) <= Number(i.stockMinimo)).length,
          desglose: itemsMateriaPrima.map(i => ({
            id: i.id,
            nombre: i.nombre,
            codigo: i.codigo,
            cantidad: Number(i.cantidad),
            unidad: i.unidad,
            stockMinimo: Number(i.stockMinimo),
            costo: Number(i.costo) || 0,
            alerta: Number(i.cantidad) <= Number(i.stockMinimo),
          })),
        },
        peletizado: {
          totalKg: Number(kgPeletizado.toFixed(2)),
          itemsCount: itemsPeletizado.length,
          desgloseMolidos: molidosDetalle,
          desglose: itemsPeletizado.map(i => ({
            id: i.id,
            nombre: i.nombre,
            codigo: i.codigo,
            cantidad: Number(i.cantidad),
            unidad: i.unidad,
            stockMinimo: Number(i.stockMinimo),
            alerta: Number(i.cantidad) <= Number(i.stockMinimo),
          })),
        },
        aditivos: {
          totalKg: Number(kgAditivos.toFixed(2)),
          itemsCount: itemsAditivo.length,
          desglose: itemsAditivo.map(i => ({
            id: i.id,
            nombre: i.nombre,
            codigo: i.codigo,
            cantidad: Number(i.cantidad),
            unidad: i.unidad,
            stockMinimo: Number(i.stockMinimo),
            alerta: Number(i.cantidad) <= Number(i.stockMinimo),
          })),
        },
        productoTerminado: {
          totalKg: Number(totalKgTerminado.toFixed(2)),
          totalUnidades: Math.round(totalUndTerminado),
          itemsCount: itemsProductoTerminado.length + cantidadLotes,
          cantidadLotes,
          desglose: itemsProductoTerminado.map(i => ({
            id: i.id,
            nombre: i.nombre,
            codigo: i.codigo,
            cantidad: Number(i.cantidad),
            unidad: i.unidad,
            stockMinimo: Number(i.stockMinimo),
            alerta: Number(i.cantidad) <= Number(i.stockMinimo),
          })),
          desgloseLotes: lotesTerminadosDetallados,
        },
      },
      alertasStockBajo,
      kardex: {
        kilosEntrantes: Number(totalKilosEntrantes.toFixed(2)),
        kilosSalientes: Number(totalKilosSalientes.toFixed(2)),
        balanceNeto: Number(balanceNeto.toFixed(2)),
        totalMovimientos,
        movimientos: movimientosDetallados,
      },
      inventarios: inventariosListado,
      porCategoria: porCategoriaArray,
      resumenPorCategoria,
    };
  } catch (error: any) {
    console.error('Error en getReporteInventario:', error);
    throw new Error(error.message || 'Error al obtener reporte de inventario');
  }
}

