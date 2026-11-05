import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Sembrando nómina oficial de planta...');

  const nomina = [
    // Extrusión
    { nombre: 'ANGEL', area: 'EXTRUSION' },
    { nombre: 'YEANCARLOS', area: 'EXTRUSION' },

    // Sellado
    { nombre: 'CARLOS CAMPOS', area: 'SELLADO' },
    { nombre: 'ANA', area: 'SELLADO' },
    { nombre: 'ANTONIO', area: 'SELLADO' },
    { nombre: 'YONNY GUARATE', area: 'SELLADO' },
    { nombre: 'ARGELIA', area: 'SELLADO' },
    { nombre: 'WILFREDO', area: 'SELLADO' },

    // Impresión / Serigrafía
    { nombre: 'ROSWARD', area: 'IMPRESION' },
  ];

  for (const item of nomina) {
    await prisma.operador.upsert({
      where: { nombre: item.nombre },
      update: { area: item.area as any, activo: true },
      create: {
        nombre: item.nombre,
        area: item.area as any,
        activo: true,
      },
    });
    console.log(`✓ ${item.nombre} cargado en ${item.area}`);
  }

  console.log('✅ Nómina base registrada exitosamente.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

