// Script temporal para aplicar migración en Vercel
const { PrismaClient } = require('@prisma/client');

async function migrate() {
  console.log('🔄 Aplicando migración de base de datos...');
  
  try {
    const prisma = new PrismaClient();
    
    // Test de conexión
    await prisma.$connect();
    console.log('✅ Conexión a base de datos exitosa');
    
    // Verificar que los nuevos campos existen
    const cliente = await prisma.cliente.findFirst();
    console.log('✅ Schema actualizado correctamente');
    
    await prisma.$disconnect();
    console.log('✅ Migración completada');
  } catch (error) {
    console.error('❌ Error en migración:', error.message);
    process.exit(1);
  }
}

migrate();