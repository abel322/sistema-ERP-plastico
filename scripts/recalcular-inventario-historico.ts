import { AreaProduccion, CategoriaInventario, TipoMovimiento } from '@prisma/client';
import { prisma } from '@/lib/db';

// Helper para evitar decimales flotantes infinitos (ej. -88.19999999999999 -> -88.20)
export function round2(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

function obtenerPorcentajeSegunMovimiento(
  mov: {
    motivo?: string | null;
    inventario?: {
      nombre?: string | null;
      codigo?: string | null;
      categoria?: CategoriaInventario | string | null;
    } | null;
  },
  formula: any
): number {
  const nombreItem = (mov.inventario?.nombre || '').toLowerCase();
  const codigoItem = (mov.inventario?.codigo || '').toLowerCase();
  const motivo = (mov.motivo || '').toLowerCase();
  const categoria = mov.inventario?.categoria;

  // A. Si es Peletizado / Molido (Añadidura directa %)
  if (
    categoria === CategoriaInventario.Peletizado ||
    categoria === 'PELETIZADO' ||
    nombreItem.includes('peletizado') ||
    nombreItem.includes('molido') ||
    motivo.includes('consumo peletizado')
  ) {
    return Number(formula.peletizadoPorcentaje ?? formula.molido ?? 0);
  }

  // B. Si es Resina Virgen 3003 (Base directa %)
  if (
    nombreItem.includes('3003') ||
    codigoItem.includes('3003') ||
    motivo.includes('3003')
  ) {
    return Number(formula.form3003 ?? formula.p3003 ?? 70);
  }

  // C. Si es Resina Virgen Lineal (Base directa %)
  if (
    nombreItem.includes('lineal') ||
    nombreItem.includes('lldpe') ||
    codigoItem.includes('lineal') ||
    motivo.includes('lineal')
  ) {
    return Number(formula.formLineal ?? formula.lineal ?? 30);
  }

  // D. Otras resinas vírgenes (7000F, FB7000, 0240, 0348)
  if (
    nombreItem.includes('7000f') ||
    nombreItem.includes('7000 f') ||
    codigoItem.includes('7000f') ||
    motivo.includes('7000f')
  ) {
    return Number(formula.form7000F ?? formula.p7000F ?? 0);
  }

  if (
    nombreItem.includes('fb7000') ||
    nombreItem.includes('fb 7000') ||
    nombreItem.includes('7000') ||
    codigoItem.includes('7000') ||
    motivo.includes('fb7000')
  ) {
    return Number(formula.formFB7000 ?? formula.fb7000 ?? 0);
  }

  if (
    nombreItem.includes('0240') ||
    codigoItem.includes('0240') ||
    motivo.includes('0240')
  ) {
    return Number(formula.form0240 ?? formula.p0240 ?? 0);
  }

  if (
    nombreItem.includes('0348') ||
    codigoItem.includes('0348') ||
    motivo.includes('0348')
  ) {
    return Number(formula.form0348 ?? formula.p0348 ?? 0);
  }

  // E. Aditivos y Masterbatch (Dosificación directa %)
  if (
    categoria === CategoriaInventario.Aditivo ||
    categoria === 'ADITIVO' ||
    motivo.includes('consumo aditivo')
  ) {
    if (codigoItem === 'mb-3' || nombreItem.includes('deslizante') || motivo.includes('deslizante')) {
      return Number(formula.formDeslizante ?? formula.deslizante ?? 0);
    }
    if (codigoItem === 'mb-1' || nombreItem.includes('blanco') || motivo.includes('blanco')) {
      return Number(formula.formMasterbachBlanco ?? formula.masterbachBlanco ?? 0);
    }
    if (codigoItem === 'mb-2' || nombreItem.includes('negro') || motivo.includes('negro')) {
      return Number(formula.formMasterbachNegro ?? formula.masterbachNegro ?? 0);
    }
    if (codigoItem === 'mb-4' || nombreItem.includes('azul') || motivo.includes('azul')) {
      return Number(formula.formMasterbachAzul ?? formula.masterbachAzul ?? 0);
    }
    if (codigoItem === 'mb-5' || nombreItem.includes('amarillo') || motivo.includes('amarillo')) {
      return Number(formula.formMasterbachAmarillo ?? formula.masterbachAmarillo ?? 0);
    }
  }

  return 0;
}

export async function recalcularHistoricoInventario() {
  console.log('🔄 Iniciando recálculo y sincronización de movimientos históricos...');

  // 1. Obtener todas las órdenes de Extrusión con sus formulaciones y registros de turno
  const ordenes = await prisma.produccion.findMany({
    where: {
      area: AreaProduccion.Extrusion,
    },
    include: {
      pedido: {
        include: {
          productoCliente: {
            include: {
              peletizado: true,
              formulacion: true,
            },
          },
        },
      },
      productoCliente: {
        include: {
          peletizado: true,
          formulacion: true,
        },
      },
      registros: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  let movimientosActualizados = 0;
  const deltasPorArticulo: Record<string, number> = {};
  const procesadosIds = new Set<string>();

  await prisma.$transaction(async (tx) => {
    for (const orden of ordenes) {
      const formula = orden.pedido?.productoCliente || orden.productoCliente;
      if (!formula) continue;

      const loteCodigo = orden.codigoLote || orden.id.slice(0, 8).toUpperCase();
      const orFilters: any[] = [
        { referencia: loteCodigo },
        { motivo: { contains: loteCodigo, mode: 'insensitive' } },
      ];
      if (orden.codigoLote && orden.codigoLote !== loteCodigo) {
        orFilters.push(
          { referencia: orden.codigoLote },
          { motivo: { contains: orden.codigoLote, mode: 'insensitive' } }
        );
      }

      // Buscar los movimientos de salida vinculados a este lote
      const movimientos = await tx.movimientoInventario.findMany({
        where: {
          tipo: TipoMovimiento.Salida,
          OR: orFilters,
        },
        include: {
          inventario: true,
        },
        orderBy: { createdAt: 'asc' },
      });

      for (const mov of movimientos) {
        if (procesadosIds.has(mov.id)) continue;

        // Determinar los kilos del turno (kgTurno) correspondiente a este movimiento
        let kgTurno = 0;
        const motivoLower = (mov.motivo || '').toLowerCase();

        if (!orden.registros || orden.registros.length === 0) {
          kgTurno = Number(orden.cantidadProducida || 0);
        } else if (orden.registros.length === 1) {
          kgTurno = Number(orden.registros[0].cantidad || orden.cantidadProducida || 0);
        } else if (!motivoLower.includes('turno')) {
          // Movimiento legacy generado por el total de la orden
          kgTurno = Number(orden.cantidadProducida || 0);
        } else {
          // Filtrar turnos cuyo nombre aparezca en el motivo (ej. "(Turno Manana)")
          const candidatos = orden.registros.filter((r) =>
            motivoLower.includes(`turno ${String(r.turno).toLowerCase()}`)
          );
          const listaBusqueda = candidatos.length > 0 ? candidatos : orden.registros;

          if (listaBusqueda.length === 1) {
            kgTurno = Number(listaBusqueda[0].cantidad || 0);
          } else {
            // Emparejar con el registro de turno más cercano en timestamp de creación
            const movTime = new Date(mov.createdAt).getTime();
            let mejorTurno = listaBusqueda[0];
            let menorDiffTiempo = Math.abs(new Date(mejorTurno.createdAt).getTime() - movTime);

            for (const reg of listaBusqueda) {
              const diffT = Math.abs(new Date(reg.createdAt).getTime() - movTime);
              if (diffT < menorDiffTiempo) {
                menorDiffTiempo = diffT;
                mejorTurno = reg;
              }
            }
            kgTurno = Number(mejorTurno.cantidad || 0);
          }
        }

        if (kgTurno <= 0) continue;

        let nuevoConsumoKg = 0;
        const formulaData = (formula as any).formulacion || formula;
        const tipoDosif = formulaData.tipoDosificacionMolido || 'PORCENTAJE';
        const esMolidoMov = mov.inventario?.categoria === CategoriaInventario.Peletizado ||
          (mov.inventario?.nombre || '').toLowerCase().includes('peletizado') ||
          (mov.inventario?.nombre || '').toLowerCase().includes('molido') ||
          motivoLower.includes('consumo molido') ||
          motivoLower.includes('consumo peletizado');
        const esEnriquecimientoMov = motivoLower.includes('enriquecimiento');

        if (tipoDosif === 'KILOGRAMOS' && (esMolidoMov || esEnriquecimientoMov)) {
          const kgMolidoConfig = Number(formulaData.peletizadoKgPor100 || 0);
          const llevaResina = Boolean(formulaData.llevaResinaEnMolido);
          const kgResinaExtraConfig = llevaResina ? Number(formulaData.resinaMolidoKgPor100 || 0) : 0;
          const pesoTotalTanda = kgMolidoConfig + kgResinaExtraConfig;

          if (pesoTotalTanda > 0) {
            if (esMolidoMov) {
              nuevoConsumoKg = round2(kgTurno * (kgMolidoConfig / pesoTotalTanda));
            } else if (esEnriquecimientoMov) {
              nuevoConsumoKg = round2(kgTurno * (kgResinaExtraConfig / pesoTotalTanda));
            }
          } else {
            nuevoConsumoKg = esMolidoMov ? kgMolidoConfig : kgResinaExtraConfig;
          }
        } else {
          const pct = obtenerPorcentajeSegunMovimiento(mov, formulaData);
          nuevoConsumoKg = pct > 0 ? round2(kgTurno * (pct / 100)) : 0;
        }

        if (nuevoConsumoKg > 0) {
          procesadosIds.add(mov.id);
          const consumoAnterior = Math.abs(Number(mov.cantidad));
          const diferencia = round2(nuevoConsumoKg - consumoAnterior);
          const tieneDecimalesFlotantes = Number(mov.cantidad) !== round2(Number(mov.cantidad));

          if (Math.abs(diferencia) >= 0.01 || tieneDecimalesFlotantes) {
            // 1. Actualizar el registro del kardex con valor exacto y redondeado a 2 decimales
            await tx.movimientoInventario.update({
              where: { id: mov.id },
              data: {
                cantidad: nuevoConsumoKg,
              },
            });

            // 2. Acumular el delta para ajustar el stock del almacén
            // Si nuevoConsumo > consumoAnterior (diferencia positiva), se consumió más material, por lo que el stock actual debe disminuir.
            if (Math.abs(diferencia) >= 0.01 && mov.inventarioId) {
              deltasPorArticulo[mov.inventarioId] = round2(
                (deltasPorArticulo[mov.inventarioId] || 0) + diferencia
              );
            }

            movimientosActualizados++;
          }
        }
      }
    }

    // Limpiar cualquier otro movimiento histórico que tenga decimales flotantes infinitos (ej. 88.19999999999999)
    const todosLosMovimientos = await tx.movimientoInventario.findMany();
    for (const mov of todosLosMovimientos) {
      if (procesadosIds.has(mov.id)) continue;
      const cantActual = Number(mov.cantidad);
      const cantRedondeada = round2(cantActual);
      if (cantActual !== cantRedondeada) {
        await tx.movimientoInventario.update({
          where: { id: mov.id },
          data: {
            cantidad: cantRedondeada,
          },
        });
        movimientosActualizados++;
      }
    }

    // 3. Aplicar los ajustes en masa a Inventario
    for (const [articuloId, deltaConsumo] of Object.entries(deltasPorArticulo)) {
      if (Math.abs(deltaConsumo) >= 0.01) {
        const articulo = await tx.inventario.findUnique({
          where: { id: articuloId },
        });
        if (articulo) {
          const nuevoStock = round2(Number(articulo.cantidad) - deltaConsumo);
          await tx.inventario.update({
            where: { id: articuloId },
            data: {
              cantidad: nuevoStock,
            },
          });
          console.log(`📦 Artículo ${articulo.nombre} (${articuloId}): stock ajustado en -${deltaConsumo} kg (Nuevo stock: ${nuevoStock} kg)`);
        }
      }
    }

    // 4. Asegurar que todos los stocks en Inventario queden redondeados a 2 decimales sin flotantes infinitos
    const todosLosArticulos = await tx.inventario.findMany();
    for (const art of todosLosArticulos) {
      const stockActual = Number(art.cantidad);
      const stockLimpio = round2(stockActual);
      if (stockActual !== stockLimpio) {
        await tx.inventario.update({
          where: { id: art.id },
          data: {
            cantidad: stockLimpio,
          },
        });
      }
    }
  });

  console.log(`✅ Sincronización completada. Movimientos corregidos: ${movimientosActualizados}`);
  return { success: true, count: movimientosActualizados };
}

if (
  typeof require !== 'undefined' &&
  typeof module !== 'undefined' &&
  require.main === module
) {
  recalcularHistoricoInventario()
    .then((res) => {
      console.log('Resultado:', res);
      process.exit(0);
    })
    .catch((err) => {
      console.error('Error al ejecutar recálculo histórico:', err);
      process.exit(1);
    });
}

