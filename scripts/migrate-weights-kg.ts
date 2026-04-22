import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Re-migrando Pesos de Clientes a Kilogramos ---');
    const clientes = await prisma.cliente.findMany();

    for (const c of clientes) {
        const ancho = c.ancho || 0;
        const largo = c.largo || 0;
        const calibre = c.calibre || 0;

        if (ancho && largo && calibre) {
            const nuevoPesoKb = (ancho * largo * calibre) / 1000;
            console.log(`Actualizando ${c.nombre}: ${ancho}x${largo}x${calibre} -> ${nuevoPesoKb} kg`);

            await prisma.cliente.update({
                where: { id: c.id },
                data: { pesoPorUnidad: nuevoPesoKb }
            });
        }
    }
    console.log('--- Migración completada ---');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
