/**
 * Script de Actualización de Referencias: productoClienteId
 * 
 * Este script actualiza las referencias en Pedidos, Producción, Despachos,
 * Muestras y ProductoTerminado para usar productoClienteId en lugar de solo clienteId.
 * 
 * Estrategia:
 * - Para cada registro, buscar el primer ProductoCliente del cliente
 * - Actualizar el campo productoClienteId
 * 
 * IMPORTANTE: Ejecutar DESPUÉS de migrar clientes a ProductoCliente
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function actualizarReferencias() {
  console.log('🔍 Analizando referencias a actualizar...\n');
  console.log('⚠️  NOTA: Este script solo analiza. Las actualizaciones se harán después de aplicar el schema final.\n');
  
  try {
    // 1. Contar Pedidos
    console.log('📦 Analizando Pedidos...');
    const pedidos = await prisma.pedido.findMany();
    console.log(`  📊 Total de Pedidos: ${pedidos.length}`);
    console.log(`  ✅ Todos necesitarán campo productoClienteId\n`);
    
    // 2. Contar Producción
    console.log('🏭 Analizando Producción...');
    const producciones = await prisma.produccion.findMany({
      where: {
        pedidoId: { not: null }
      }
    });
    console.log(`  📊 Total de Producciones con pedido: ${producciones.length}`);
    console.log(`  ✅ Todas necesitarán campo productoClienteId\n`);
    
    // 3. Contar Despachos
    console.log('🚚 Analizando Despachos...');
    const despachos = await prisma.despacho.findMany();
    console.log(`  📊 Total de Despachos: ${despachos.length}`);
    console.log(`  ✅ Todos necesitarán campo productoClienteId\n`);
    
    // 4. Contar Muestras
    console.log('🧪 Analizando Muestras...');
    const muestras = await prisma.muestra.findMany();
    console.log(`  📊 Total de Muestras: ${muestras.length}`);
    console.log(`  ✅ Todas necesitarán campo productoClienteId\n`);
    
    // 5. Contar ProductoTerminado
    console.log('📦 Analizando ProductoTerminado...');
    const productosTerminados = await prisma.productoTerminado.findMany();
    console.log(`  📊 Total de ProductoTerminado: ${productosTerminados.length}`);
    console.log(`  ✅ Todos necesitarán campo productoClienteId\n`);
    
    // Resumen
    const total = pedidos.length + producciones.length + despachos.length + muestras.length + productosTerminados.length;
    console.log('📊 Resumen de registros a actualizar:');
    console.log(`   📦 Pedidos: ${pedidos.length}`);
    console.log(`   🏭 Producción: ${producciones.length}`);
    console.log(`   🚚 Despachos: ${despachos.length}`);
    console.log(`   🧪 Muestras: ${muestras.length}`);
    console.log(`   📦 ProductoTerminado: ${productosTerminados.length}`);
    console.log(`   ✅ Total: ${total}\n`);
    
    console.log('✅ Análisis completado\n');
    console.log('⚠️  PRÓXIMOS PASOS:');
    console.log('   1. Aplicar schema final que agrega productoClienteId a estos modelos');
    console.log('   2. Ejecutar script de actualización de referencias');
    console.log('   3. Verificar que las referencias sean correctas');
    console.log('   4. Actualizar la interfaz de usuario\n');
    
  } catch (error) {
    console.error('❌ Error en análisis:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar actualización
actualizarReferencias()
  .then(() => {
    console.log('✅ Script finalizado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script falló:', error);
    process.exit(1);
  });
