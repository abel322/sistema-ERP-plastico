#!/bin/bash

# Script para deployment en Vercel
# Evita la creación de múltiples proyectos

echo "🚀 Iniciando deployment en Vercel..."

# Verificar si vercel CLI está instalado
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI no está instalado. Instalando..."
    npm i -g vercel
fi

# Verificar si ya existe un proyecto vinculado
if [ ! -f ".vercel/project.json" ]; then
    echo "⚠️  No hay proyecto vinculado. Vinculando proyecto existente..."
    echo "IMPORTANTE: Selecciona tu proyecto EXISTENTE, no crees uno nuevo"
    vercel link
else
    echo "✅ Proyecto ya vinculado"
fi

# Hacer deployment
echo "📦 Haciendo deployment..."
vercel --prod

echo "✅ Deployment completado!"
echo "🔗 Revisa tu proyecto en: https://vercel.com/dashboard"