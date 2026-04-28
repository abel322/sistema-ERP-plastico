const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const clientes = await prisma.cliente.findMany();
        // Use console.table to show the output in a nice tabular format
        console.table(clientes);
        // Print the full JSON just in case console.table truncates some nested values
        console.log('\n--- Full Details ---\n');
        console.log(JSON.stringify(clientes, null, 2));
    } catch (error) {
        console.error('Error fetching clients:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
