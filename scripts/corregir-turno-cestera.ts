// scripts/corregir-turno-cestera.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const lote = 'EXT-20261021-3641';
  console.log(`Corrigiendo movimientos para el lote ${lote}...`);

  await prisma.$transaction(async (tx) => {
    // 0. Asegurar que la formulación de la Cestera refleje los 50 kg de 3003 de corte (100 kg molido + 50 kg 3003)
    const producto = await tx.productoCliente.findFirst({
      where: {
        nombreProducto: { contains: 'Cestera 60(21+21)', mode: 'insensitive' },
      },
    });

    if (producto) {
      await tx.productoCliente.update({
        where: { id: producto.id },
        data: {
          tipoDosificacionMolido: 'KILOGRAMOS',
          peletizadoKgPor100: 100,
          llevaResinaEnMolido: true,
          resinaMolidoKgPor100: 50,
        },
      });

      await tx.formulacion.upsert({
        where: { productoId: producto.id },
        create: {
          productoId: producto.id,
          tipoDosificacionMolido: 'KILOGRAMOS',
          peletizadoKgPor100: 100,
          llevaResinaEnMolido: true,
          resinaMolidoKgPor100: 50,
          p3003: 50,
          lineal: 17,
          p0240: 17,
          p7000f: 16,
        },
        update: {
          tipoDosificacionMolido: 'KILOGRAMOS',
          peletizadoKgPor100: 100,
          llevaResinaEnMolido: true,
          resinaMolidoKgPor100: 50,
        },
      });
      console.log('✅ Formulación de Cestera actualizada: 100 kg Molido + 50 kg 3003 de corte');
    }

    // 1. Corregir Peletizado transparente alta (de 150 kg a 100 kg)
    const movPeletizado = await tx.movimientoInventario.findFirst({
      where: {
        OR: [
          { referencia: lote },
          { motivo: { contains: lote } },
        ],
        motivo: { contains: 'peletizado transparente alta', mode: 'insensitive' },
        tipo: 'Salida',
        cantidad: 150,
      },
    });

    if (movPeletizado) {
      await tx.movimientoInventario.update({
        where: { id: movPeletizado.id },
        data: { cantidad: 100 },
      });

      // Devolver 50 kg al stock de almacén
      if (movPeletizado.inventarioId) {
        await tx.inventario.update({
          where: { id: movPeletizado.inventarioId },
          data: { cantidad: { increment: 50 } },
        });
      }
      console.log('✅ Peletizado corregido: -100 KG (Devueltos 50 kg al almacén)');
    } else {
      console.log('ℹ️ Movimiento de Peletizado 150 kg ya no se encuentra pendiente de corrección.');
    }

    // 2. Corregir 3003 Adicional de Corte (de 37.50 kg a 50.00 kg)
    const mov3003Extra = await tx.movimientoInventario.findFirst({
      where: {
        OR: [
          { referencia: lote },
          { motivo: { contains: lote } },
        ],
        motivo: { contains: 'Enriquecimiento', mode: 'insensitive' },
        tipo: 'Salida',
        cantidad: 37.5,
      },
    });

    if (mov3003Extra) {
      await tx.movimientoInventario.update({
        where: { id: mov3003Extra.id },
        data: { cantidad: 50 },
      });

      // Descontar 12.50 kg adicionales del stock de 3003
      if (mov3003Extra.inventarioId) {
        await tx.inventario.update({
          where: { id: mov3003Extra.inventarioId },
          data: { cantidad: { decrement: 12.5 } },
        });
      }
      console.log('✅ 3003 adicional corregido: -50 KG (Descontados 12.5 kg del almacén)');
    } else {
      console.log('ℹ️ Movimiento de 3003 Enriquecimiento 37.5 kg ya no se encuentra pendiente de corrección.');
    }
  });

  console.log('🎉 Turno corregido con exactitud.');
}

main()
  .catch((e) => {
    console.error('Error al corregir turno:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

