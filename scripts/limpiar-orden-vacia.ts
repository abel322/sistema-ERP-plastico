import { PrismaClient, EstadoMaquina } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const lote = 'EXT-20261021-59C8';
  console.log(`Buscando orden con lote ${lote}...`);

  const orden = await prisma.produccion.findFirst({
    where: {
      OR: [
        { codigoLote: lote },
        { id: lote },
      ],
    },
    include: {
      registros: true,
      productoTerminado: true,
      inspeccionesCalidad: true,
      maquina: true,
    },
  });

  if (!orden) {
    console.log(`No se encontró la orden con lote ${lote} o ya fue eliminada.`);
    return;
  }

  console.log(`Orden encontrada (ID: ${orden.id}, Máquina: ${orden.maquina?.nombre || 'N/A'}). Procediendo a eliminar...`);

  await prisma.$transaction(async (tx) => {
    // 1. Eliminar inspecciones de calidad si existen
    if (orden.inspeccionesCalidad && orden.inspeccionesCalidad.length > 0) {
      const inspeccionIds = orden.inspeccionesCalidad.map((i) => i.id);
      await tx.resultadoParametro.deleteMany({
        where: { inspeccionId: { in: inspeccionIds } },
      });
      await tx.inspeccionCalidad.deleteMany({
        where: { produccionId: orden.id },
      });
    }

    // 2. Eliminar registros de turno asociados
    if (orden.registros && orden.registros.length > 0) {
      await tx.registroProduccion.deleteMany({
        where: { produccionId: orden.id },
      });
    }

    // 3. Eliminar producto terminado si existe
    if (orden.productoTerminado) {
      await tx.productoTerminado.delete({
        where: { id: orden.productoTerminado.id },
      });
    } else if (orden.codigoLote) {
      await tx.productoTerminado.deleteMany({
        where: { codigoLote: orden.codigoLote },
      });
    }

    // 4. Eliminar movimientos de inventario asociados al lote
    if (orden.codigoLote) {
      await tx.movimientoInventario.deleteMany({
        where: {
          OR: [
            { motivo: { contains: orden.codigoLote } },
            { referencia: { contains: orden.codigoLote } },
          ],
        },
      });
    }

    // 5. Eliminar la orden de producción
    await tx.produccion.delete({
      where: { id: orden.id },
    });

    // 6. Liberar máquina si existe dejándola disponible (Operativa)
    if (orden.maquinaId) {
      await tx.maquina.updateMany({
        where: { id: orden.maquinaId },
        data: {
          estado: EstadoMaquina.Operativa,
          activa: true,
        },
      });
    }
  });

  console.log(`✅ Orden ${lote} eliminada y máquina ${orden.maquina?.nombre || ''} liberada con éxito.`);
}

main()
  .catch((e) => {
    console.error('Error al limpiar la orden:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

