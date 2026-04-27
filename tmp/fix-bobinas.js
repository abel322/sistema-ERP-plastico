const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const res = await prisma.productoTerminado.updateMany({
            where: {
                tipoProducto: 'Bobina',
                areaOrigen: 'Serigrafia',
                estado: 'ListoDespacho'
            },
            data: {
                estado: 'PendienteArea',
                siguienteArea: 'Refilado'
            }
        });
        console.log(`Updated ${res.count} records.`);
    } catch (error) {
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}
main();
