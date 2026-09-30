require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const prods = await prisma.productoCliente.findMany();
  console.log(`Migrando tipoBolsa para ${prods.length} productos...`);

  let updated = 0;
  for (const p of prods) {
    if (p.tipoProducto !== 'Bolsa') continue;

    let tipo = 'sencilla';
    if (p.anchoValvula || p.anchoSolapa || p.sldTipoSelladora === 'valvula' || p.nombreProducto?.toLowerCase().includes('pego')) {
      tipo = 'valvula';
    } else if (p.esBolsaASA || p.anchoTroquelASA || p.largoTroquelASA || p.nombreProducto?.toLowerCase().includes('asa')) {
      tipo = 'asa';
    } else if (p.anchoFuelle) {
      tipo = 'fuelle';
    }

    const updates = {
      tipoBolsa: tipo,
      esBolsaASA: tipo === 'asa',
      fuelleASA: tipo === 'asa' ? p.fuelleASA : null,
      anchoTroquelASA: tipo === 'asa' ? p.anchoTroquelASA : null,
      largoTroquelASA: tipo === 'asa' ? p.largoTroquelASA : null,
    };

    await prisma.productoCliente.update({
      where: { id: p.id },
      data: updates,
    });
    updated++;
    console.log(`Updated [${p.id}] "${p.nombreProducto}" -> tipoBolsa: ${tipo}`);
  }

  console.log(`Migración completada: ${updated} productos actualizados.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
