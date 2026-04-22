const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const producciones = await prisma.produccion.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { productoTerminado: true }
    });
    console.log(JSON.stringify(producciones, null, 2));

    const pt = await prisma.productoTerminado.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5
    });
    console.log("\nPRODUCTOS TERMINADOS:");
    console.log(JSON.stringify(pt, null, 2));

    await prisma.$disconnect();
}
main();
