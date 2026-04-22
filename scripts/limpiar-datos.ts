import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function limpiarDatos() {
  try {
    console.log('🗑️  Iniciando limpieza de datos...\n');

    // Eliminar en orden para respetar las relaciones de foreign keys
    
    console.log('Eliminando Logs de Actividad...');
    await prisma.logActividad.deleteMany({});
    
    console.log('Eliminando Notificaciones...');
    await prisma.notificacion.deleteMany({});
    
    console.log('Eliminando Resultados de Parámetros...');
    await prisma.resultadoParametro.deleteMany({});
    
    console.log('Eliminando No Conformidades...');
    await prisma.noConformidad.deleteMany({});
    
    console.log('Eliminando Inspecciones de Calidad...');
    await prisma.inspeccionCalidad.deleteMany({});
    
    console.log('Eliminando Parámetros de Calidad...');
    await prisma.parametroCalidad.deleteMany({});
    
    console.log('Eliminando Mejoras Continuas...');
    await prisma.mejoraContinua.deleteMany({});
    
    console.log('Eliminando Mantenimientos...');
    await prisma.mantenimiento.deleteMany({});
    
    console.log('Eliminando Detalles de Facturas...');
    await prisma.detalleFactura.deleteMany({});
    
    console.log('Eliminando Facturas...');
    await prisma.factura.deleteMany({});
    
    console.log('Eliminando Detalles de Órdenes de Compra...');
    await prisma.detalleOrdenCompra.deleteMany({});
    
    console.log('Eliminando Órdenes de Compra...');
    await prisma.ordenCompra.deleteMany({});
    
    console.log('Eliminando Proveedores...');
    await prisma.proveedor.deleteMany({});
    
    console.log('Eliminando Movimientos de Inventario...');
    await prisma.movimientoInventario.deleteMany({});
    
    console.log('Eliminando Inventario...');
    await prisma.inventario.deleteMany({});
    
    console.log('Eliminando Peletizado...');
    await prisma.peletizado.deleteMany({});
    
    console.log('Eliminando Muestras...');
    await prisma.muestra.deleteMany({});
    
    console.log('Eliminando Despachos...');
    await prisma.despacho.deleteMany({});
    
    console.log('Eliminando Productos Terminados...');
    await prisma.productoTerminado.deleteMany({});
    
    console.log('Eliminando Registros de Producción...');
    await prisma.registroProduccion.deleteMany({});
    
    console.log('Eliminando Producciones...');
    await prisma.produccion.deleteMany({});
    
    console.log('Eliminando Pedidos...');
    await prisma.pedido.deleteMany({});
    
    console.log('Eliminando Clientes...');
    await prisma.cliente.deleteMany({});
    
    console.log('Eliminando Máquinas...');
    await prisma.maquina.deleteMany({});
    
    console.log('\n✅ Limpieza completada exitosamente!');
    console.log('ℹ️  Los usuarios y administradores se mantuvieron intactos.\n');
    
  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

limpiarDatos()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
