import { PrismaClient } from '@prisma/client';
import { generarCodigoLote } from '../lib/utils/lote';

const prisma = new PrismaClient();

async function backfillLotes() {
  console.log('Iniciando asignación de lotes para producciones y productos terminados existentes...');

  // 1. Producciones sin lote
  const produccionesSinLote = await prisma.produccion.findMany({
    where: { codigoLote: null },
    orderBy: { createdAt: 'asc' },
  });

  console.log(`Encontradas ${produccionesSinLote.length} producciones sin codigoLote.`);

  for (const prod of produccionesSinLote) {
    const nuevoLote = generarCodigoLote(prod.area, prod.fecha);
    await prisma.produccion.update({
      where: { id: prod.id },
      data: { codigoLote: nuevoLote },
    });
    console.log(`Produccion ${prod.id} (${prod.area}) -> ${nuevoLote}`);
  }

  // 2. Productos Terminados sin lote
  const ptSinLote = await prisma.productoTerminado.findMany({
    where: { codigoLote: null },
    include: { produccion: true },
    orderBy: { createdAt: 'asc' },
  });

  console.log(`Encontrados ${ptSinLote.length} productos terminados sin codigoLote.`);

  for (const pt of ptSinLote) {
    // Si tiene producción asociada, heredar su lote
    const loteAsignar = pt.produccion?.codigoLote || generarCodigoLote(pt.areaOrigen, pt.fechaFinalizacion);
    await prisma.productoTerminado.update({
      where: { id: pt.id },
      data: {
        codigoLote: loteAsignar,
        loteOrigen: pt.produccion?.loteOrigen || null,
      },
    });
    console.log(`ProductoTerminado ${pt.id} (${pt.areaOrigen}) -> ${loteAsignar}`);
  }

  console.log('Finalizado backfill de lotes con éxito.');
}

backfillLotes()
  .catch((e) => {
    console.error('Error en backfill:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
