const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const clientes = await prisma.cliente.findMany({
            select: {
                id: true,
                nombre: true,
                pesoPorUnidad: true
            }
        });
        console.log(JSON.stringify(clientes, null, 2));
    } catch (error) {
        console.error('Error fetching clients:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
