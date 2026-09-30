import { prisma } from '@/lib/db';
import { AreaProduccion, EstadoProduccion } from '@prisma/client';
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
