#!/bin/bash

echo "=========================================="
echo "  Configuración de GitHub para ERP Plásticos"
echo "=========================================="
echo ""

# Solicitar usuario de GitHub
read -p "Ingresa tu usuario de GitHub: " GITHUB_USER

if [ -z "$GITHUB_USER" ]; then
    echo "❌ Error: Debes ingresar un usuario de GitHub"
    exit 1
fi

echo ""
echo "📝 Configurando Git..."
git config --global user.name "Abel Utrera"
git config --global user.email "utrerabel619@gmail.com"

echo "✅ Git configurado"
echo ""
echo "🔗 Conectando con GitHub..."

# Agregar remote
git remote add origin "https://github.com/$GITHUB_USER/erp-plasticos.git" 2>/dev/null

if [ $? -ne 0 ]; then
    echo "⚠️  Remote ya existe, actualizando URL..."
    git remote set-url origin "https://github.com/$GITHUB_USER/erp-plasticos.git"
fi

echo "✅ Remote configurado: https://github.com/$GITHUB_USER/erp-plasticos.git"
echo ""
echo "🔄 Renombrando rama a 'main'..."
git branch -M main

echo "✅ Rama renombrada"
echo ""
echo "=========================================="
echo "  IMPORTANTE: Crear el repositorio primero"
echo "=========================================="
echo ""
echo "Antes de continuar, ve a tu navegador y:"
echo "1. Abre: https://github.com/new"
echo "2. Repository name: erp-plasticos"
echo "3. NO marques README, .gitignore ni license"
echo "4. Clic en 'Create repository'"
echo ""
read -p "¿Ya creaste el repositorio? (s/n): " CONFIRM

if [ "$CONFIRM" != "s" ] && [ "$CONFIRM" != "S" ]; then
    echo "❌ Cancelado. Crea el repositorio primero."
    exit 1
fi

echo ""
echo "🚀 Subiendo código a GitHub..."
echo ""

git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "=========================================="
    echo "  ✅ ¡ÉXITO! Código subido a GitHub"
    echo "=========================================="
    echo ""
    echo "🌐 Ver tu repositorio en:"
    echo "   https://github.com/$GITHUB_USER/erp-plasticos"
    echo ""
else
    echo ""
    echo "=========================================="
    echo "  ⚠️  Error al subir código"
    echo "=========================================="
    echo ""
    echo "Si te pidió credenciales y falló:"
    echo "1. Ve a: https://github.com/settings/tokens"
    echo "2. Genera un nuevo token (classic)"
    echo "3. Marca el scope 'repo'"
    echo "4. Usa el token como password"
    echo ""
    echo "Luego ejecuta: git push -u origin main"
    echo ""
fi
