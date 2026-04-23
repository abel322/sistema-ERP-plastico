// Archivo de verificación para Vercel
// Este archivo ayuda a diagnosticar problemas de build

console.log('🔍 Verificando configuración de Vercel...');

// Verificar variables de entorno críticas
const requiredEnvVars = [
  'DATABASE_URL',
  'NEXTAUTH_SECRET',
  'ABACUSAI_API_KEY'
];

console.log('📋 Variables de entorno requeridas:');
requiredEnvVars.forEach(envVar => {
  const value = process.env[envVar];
  console.log(`${envVar}: ${value ? '✅ Configurada' : '❌ FALTANTE'}`);
});

// Verificar Prisma Client
try {
  const { PrismaClient } = require('@prisma/client');
  console.log('✅ Prisma Client disponible');
} catch (error) {
  console.log('❌ Error con Prisma Client:', error.message);
}

// Verificar Next.js
try {
  const nextConfig = require('./next.config.js');
  console.log('✅ Next.js config cargado');
} catch (error) {
  console.log('❌ Error con Next.js config:', error.message);
}

console.log('🏁 Verificación completada');