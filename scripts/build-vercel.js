#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Iniciando build para Vercel...');

try {
  // 1. Limpiar cache anterior
  console.log('🧹 Limpiando cache...');
  if (fs.existsSync('.next')) {
    execSync('rm -rf .next', { stdio: 'inherit' });
  }
  
  // 2. Generar cliente de Prisma
  console.log('🗄️  Generando cliente de Prisma...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  // 3. Verificar que el cliente se generó
  const prismaClientPath = path.join(__dirname, '../node_modules/.prisma/client');
  if (!fs.existsSync(prismaClientPath)) {
    throw new Error('❌ Cliente de Prisma no se generó correctamente');
  }
  console.log('✅ Cliente de Prisma generado');
  
  // 4. Build de Next.js
  console.log('📦 Construyendo aplicación Next.js...');
  execSync('npx next build', { stdio: 'inherit' });
  
  // 5. Verificar que el build se completó
  const routesManifestPath = path.join(__dirname, '../.next/routes-manifest.json');
  if (!fs.existsSync(routesManifestPath)) {
    throw new Error('❌ Build incompleto: routes-manifest.json no encontrado');
  }
  
  console.log('✅ Build completado exitosamente');
  
} catch (error) {
  console.error('❌ Error durante el build:', error.message);
  process.exit(1);
}