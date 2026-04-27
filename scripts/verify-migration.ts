/**
 * Script de Verificación: Migración Cliente → ProductoCliente
 * 
 * Verifica que los datos se migraron correctamente
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verificarMigracion() {
  console.log('🔍 Verificando migración...\n');
  
  try {
    // Contar clientes
    const totalClientes = await prisma.cliente.count();
    console.log(`📊 Total de Clientes: ${totalClientes}`);
    
    // Contar productos cliente
    const totalProductos = await prisma.productoCliente.count();
    console.log(`📦 Total de ProductoCliente: ${totalProductos}\n`);
    
    if (totalProductos === 0) {
      console.log('❌ No se encontraron productos migrados');
      return;
    }
    
    // Mostrar algunos ejemplos
    console.log('📋 Ejemplos de productos migrados:\n');
    const ejemplos = await prisma.productoCliente.findMany({
      take: 5
    });
    
    for (const producto of ejemplos) {
      const cliente = await prisma.cliente.findUnique({
        where: { id: producto.clienteId }
      });
      
      console.log(`• ${cliente?.nombre || 'Cliente desconocido'}`);
      console.log(`  Producto: ${producto.nombreProducto}`);
      console.log(`  Tipo: ${producto.tipoProducto}`);
      console.log(`  Con Impresión: ${producto.conImpresion ? 'Sí' : 'No'}`);
      console.log(`  Dimensiones: ${producto.ancho || 'N/A'}cm x ${producto.largo || 'N/A'}cm x ${producto.calibre || 'N/A'}µ`);
      console.log('');
    }
    
    // Verificar que todos los productos tienen un cliente válido
    const productosHuerfanos = await prisma.productoCliente.count({
      where: {
        clienteId: {
          notIn: (await prisma.cliente.findMany({ select: { id: true } })).map(c => c.id)
        }
      }
    });
    
    if (productosHuerfanos > 0) {
      console.log(`⚠️  Productos sin cliente válido: ${productosHuerfanos}`);
    } else {
      console.log('✅ Todos los productos tienen un cliente válido');
    }
    
    console.log('\n✅ Verificación completada');
    
  } catch (error) {
    console.error('❌ Error en verificación:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

verificarMigracion()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
