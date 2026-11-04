// scripts/reponer-50kg-3003.ts
import { PrismaClient, TipoMovimiento } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const lote = 'EXT-20261021-3641';
  console.log(`Buscando artículo 3003 para reponer 50 KG del lote ${lote}...`);

  const art3003 = await prisma.inventario.findFirst({
    where: {
      OR: [
        { id: 'cmomxvwfj000dky04b4k78c3f' },
        { codigo: { contains: '025', mode: 'insensitive' } },
        { nombre: { contains: '3003', mode: 'insensitive' } },
      ],
    },
  });

  if (!art3003) {
    console.error('No se encontró el artículo 3003 en Inventario.');
    process.exit(1);
  }

  console.log(`Artículo localizado: ${art3003.nombre} (${art3003.codigo}) - Stock previo: ${art3003.cantidad} kg`);

  await prisma.$transaction(async (tx) => {
    // 1. Devolver 50 kg al stock de almacén
    await tx.inventario.update({
      where: { id: art3003.id },
      data: {
        cantidad: { increment: 50 },
      },
    });

    // 2. Registrar la entrada formal en el Kardex / Movimientos
    await tx.movimientoInventario.create({
      data: {
        inventarioId: art3003.id,
        tipo: TipoMovimiento.Entrada,
        cantidad: 50,
        motivo: `Reversión Consumo Polietileno de baja densidad 3003 (Enriquecimiento mezcla de molido) por Eliminación en Extrusión - Lote ${lote} (Turno Manana)`,
        referencia: lote,
        responsable: 'abel',
        fecha: new Date(),
      },
    });
  });

  const artActualizado = await prisma.inventario.findUnique({
    where: { id: art3003.id },
  });

  console.log(`✅ 50 KG de 3003 reincorporados exitosamente. Nuevo stock en almacén: ${artActualizado?.cantidad} kg`);
}

main()
  .catch((e) => {
    console.error('Error al reponer 50 kg de 3003:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
