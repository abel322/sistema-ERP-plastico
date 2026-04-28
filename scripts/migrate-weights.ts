import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Actualizando Pesos de Clientes ---');
    const clientes = await prisma.cliente.findMany();

    for (const c of clientes) {
        const ancho = c.ancho || 0;
        const largo = c.largo || 0;
        const calibre = c.calibre || 0;

        if (ancho && largo && calibre) {
            const nuevoPeso = ancho * largo * calibre;
            console.log(`Actualizando ${c.nombre}: ${ancho}x${largo}x${calibre} -> ${nuevoPeso}g`);

            await prisma.cliente.update({
                where: { id: c.id },
                data: { pesoPorUnidad: nuevoPeso }
            });
        }
    }
    console.log('--- Migración completada ---');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
