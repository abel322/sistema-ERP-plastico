const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('Iniciando limpieza de datos...');

    try {
        const registrosCount = await prisma.registroProduccion.deleteMany({});
        console.log(`Eliminados ${registrosCount.count} registros de producción.`);

        const inspeccionesCount = await prisma.inspeccionCalidad.deleteMany({});
        console.log(`Eliminadas ${inspeccionesCount.count} inspecciones de calidad.`);

        const despachosCount = await prisma.despacho.deleteMany({});
        console.log(`Eliminados ${despachosCount.count} despachos.`);

        const productosTerminadosCount = await prisma.productoTerminado.deleteMany({});
        console.log(`Eliminados ${productosTerminadosCount.count} productos terminados.`);

        const produccionesCount = await prisma.produccion.deleteMany({});
        console.log(`Eliminadas ${produccionesCount.count} producciones.`);

        const pedidosCount = await prisma.pedido.deleteMany({});
        console.log(`Eliminados ${pedidosCount.count} pedidos.`);

        const muestrasCount = await prisma.muestra.deleteMany({});
        console.log(`Eliminadas ${muestrasCount.count} muestras.`);

        try {
            if (prisma.factura) {
                const facturasCount = await prisma.factura.deleteMany({});
                console.log(`Eliminadas ${facturasCount.count} facturas.`);
            }
        } catch (e) { }

        const clientesCount = await prisma.cliente.deleteMany({});
        console.log(`Eliminados ${clientesCount.count} clientes.`);

        console.log('Limpieza completada exitosamente.');
    } catch (error) {
        console.error('Error durante la limpieza:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
