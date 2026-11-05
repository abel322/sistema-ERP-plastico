import { PrismaClient, AreaProduccion, EstadoProduccion } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Buscando órdenes de Cestera en Extrusora 6...');

  // Buscar todas las órdenes de extrusión relacionadas con Extrusora 6 o Cestera
  const ordenes = await prisma.produccion.findMany({
    where: {
      area: AreaProduccion.Extrusion,
      OR: [
        { maquina: { nombre: { contains: '6', mode: 'insensitive' } } },
        { pedido: { productoCliente: { nombreProducto: { contains: 'Cestera', mode: 'insensitive' } } } },
        { productoCliente: { nombreProducto: { contains: 'Cestera', mode: 'insensitive' } } },
      ],
    },
    include: {
      maquina: true,
      pedido: {
        include: {
          cliente: true,
          productoCliente: true,
        },
      },
      productoCliente: true,
      registros: true,
      productoTerminado: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  console.log(`📋 Encontradas ${ordenes.length} órdenes:`);
  for (const o of ordenes) {
    const prodNom = o.pedido?.productoCliente?.nombreProducto || o.productoCliente?.nombreProducto || 'Sin nombre';
    console.log(`- ID: ${o.id} | Lote: ${o.codigoLote} | Estado: ${o.estado} | Máquina: ${o.maquina?.nombre} | Madre: ${o.esOrdenMadre} | MetaKg: ${o.metaKg} | Prod: ${prodNom} | Solicitada: ${o.pedido?.cantidadSolicitada} ${o.pedido?.unidad}`);
  }

  // Localizar la orden madre de Cestera en Extrusora 6
  // Priorizar la que esté EnProceso en Extrusora 6
  const ordenMadre = ordenes.find(
    (o) =>
      o.estado === EstadoProduccion.EnProceso &&
      (o.esOrdenMadre ||
        (o.maquina?.nombre || '').toLowerCase().includes('6') ||
        (o.pedido?.productoCliente?.nombreProducto || o.productoCliente?.nombreProducto || '').toLowerCase().includes('cestera'))
  );

  if (!ordenMadre) {
    console.error('❌ No se encontró la orden activa de Cestera en Extrusora 6.');
    return;
  }

  console.log(`\n🎯 Orden Madre seleccionada para corrección: ${ordenMadre.codigoLote} (${ordenMadre.id})`);

  // Meta exacta: 3,488.40 kg (lisa) + 3,052.35 kg (perforada) = 6,540.75 kg
  const metaCombinada = 6540.75;
  const nombreVariante = 'Cestera 60(21+21) [Lisa + Perforada]';
  const observaciones = 'Producción unificada: 3.488,40 kg Lisa + 3.052,35 kg Perforada';

  await prisma.produccion.update({
    where: { id: ordenMadre.id },
    data: {
      metaKg: metaCombinada,
      nombreVariante,
      esOrdenMadre: true,
      observaciones: ordenMadre.observaciones
        ? `${ordenMadre.observaciones} | ${observaciones}`
        : observaciones,
    },
  });

  // Si existe ProductoTerminado vinculado, asegurar que su meta o cantidad total refleje la disponibilidad
  if (ordenMadre.codigoLote) {
    await prisma.productoTerminado.updateMany({
      where: { codigoLote: ordenMadre.codigoLote },
      data: {
        descripcion: `Bobina WIP compartida - ${nombreVariante}`,
      },
    });
  }

  // Buscar si hay órdenes secundarias de Cestera que deban estar vinculadas a esta madre
  const secundarias = ordenes.filter(
    (o) =>
      o.id !== ordenMadre.id &&
      (o.estado === EstadoProduccion.Unificada || o.estado === EstadoProduccion.EnProceso) &&
      (o.pedido?.productoCliente?.nombreProducto || o.productoCliente?.nombreProducto || '').toLowerCase().includes('cestera')
  );

  for (const sec of secundarias) {
    console.log(`🔗 Vinculando orden secundaria ${sec.codigoLote} a la madre ${ordenMadre.codigoLote}...`);
    await prisma.produccion.update({
      where: { id: sec.id },
      data: {
        estado: EstadoProduccion.Unificada,
        ordenExtrusionOrigenId: ordenMadre.id,
      },
    });
  }

  console.log(`\n✅ Orden ${ordenMadre.codigoLote} actualizada exitosamente con meta combinada de ${metaCombinada} KG y variante "${nombreVariante}".`);
}

main()
  .catch((e) => {
    console.error('Error al ejecutar script:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

