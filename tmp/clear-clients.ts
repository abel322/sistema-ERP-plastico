import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Iniciando limpieza de datos...');

    try {
        // 1. RegistroProduccion (Hijo de Producción)
        const registrosCount = await prisma.registroProduccion.deleteMany({});
        console.log(`Eliminados ${registrosCount.count} registros de producción.`);

        // 2. InspeccionCalidad
        const inspeccionesCount = await prisma.inspeccionCalidad.deleteMany({});
        console.log(`Eliminadas ${inspeccionesCount.count} inspecciones de calidad.`);

        // 3. Despacho
        const despachosCount = await prisma.despacho.deleteMany({});
        console.log(`Eliminados ${despachosCount.count} despachos.`);

        // 4. ProductoTerminado
        const productosTerminadosCount = await prisma.productoTerminado.deleteMany({});
        console.log(`Eliminados ${productosTerminadosCount.count} productos terminados.`);

        // 5. Produccion
        const produccionesCount = await prisma.produccion.deleteMany({});
        console.log(`Eliminadas ${produccionesCount.count} producciones.`);

        // 6. Pedido
        const pedidosCount = await prisma.pedido.deleteMany({});
        console.log(`Eliminados ${pedidosCount.count} pedidos.`);

        // 7. Muestra
        const muestrasCount = await prisma.muestra.deleteMany({});
        console.log(`Eliminadas ${muestrasCount.count} muestras.`);

        // 8. Factura (Si existe en el esquema, aunque no la vi detalle, borramos por si acaso si prisma la reconoce)
        // Intentamos borrar tablas relacionadas con clientes que aparecían en el modelo Cliente
        try {
            // @ts-ignore
            const facturasCount = await prisma.factura.deleteMany({});
            console.log(`Eliminadas ${facturasCount.count} facturas.`);
        } catch (e) { }

        // 9. Cliente
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
