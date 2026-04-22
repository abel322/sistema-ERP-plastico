import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Listado de Clientes y Pesos Actuales ---');
    const clientes = await prisma.cliente.findMany({
        select: {
            nombre: true,
            ancho: true,
            largo: true,
            calibre: true,
            pesoPorUnidad: true
        }
    });

    clientes.forEach(c => {
        console.log(`Cliente: ${c.nombre}`);
        console.log(`  Dimensiones: ${c.ancho} x ${c.largo} x ${c.calibre}`);
        console.log(`  Peso Por Unidad (DB): ${c.pesoPorUnidad}`);
        console.log('-------------------------------------------');
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
