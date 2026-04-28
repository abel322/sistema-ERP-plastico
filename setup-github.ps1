# Script de configuración de GitHub para ERP Plásticos
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Configuración de GitHub para ERP Plásticos" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Solicitar usuario de GitHub
$githubUser = Read-Host "Ingresa tu usuario de GitHub"

if ([string]::IsNullOrWhiteSpace($githubUser)) {
    Write-Host "❌ Error: Debes ingresar un usuario de GitHub" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📝 Configurando Git..." -ForegroundColor Yellow
git config --global user.name "Abel Utrera"
git config --global user.email "utrerabel619@gmail.com"

Write-Host "✅ Git configurado" -ForegroundColor Green
Write-Host ""
Write-Host "🔗 Conectando con GitHub..." -ForegroundColor Yellow

# Verificar si ya existe el remote
$remoteExists = git remote get-url origin 2>$null
if ($remoteExists) {
    Write-Host "⚠️  Remote ya existe, actualizando URL..." -ForegroundColor Yellow
    git remote set-url origin "https://github.com/$githubUser/erp-plasticos.git"
} else {
    git remote add origin "https://github.com/$githubUser/erp-plasticos.git"
}

Write-Host "✅ Remote configurado: https://github.com/$githubUser/erp-plasticos.git" -ForegroundColor Green
Write-Host ""
Write-Host "🔄 Renombrando rama a 'main'..." -ForegroundColor Yellow
git branch -M main

Write-Host "✅ Rama renombrada" -ForegroundColor Green
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  IMPORTANTE: Crear el repositorio primero" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Antes de continuar, ve a tu navegador y:" -ForegroundColor Yellow
Write-Host "1. Abre: https://github.com/new" -ForegroundColor White
Write-Host "2. Repository name: erp-plasticos" -ForegroundColor White
Write-Host "3. NO marques README, .gitignore ni license" -ForegroundColor White
Write-Host "4. Clic en 'Create repository'" -ForegroundColor White
Write-Host ""

# Abrir el navegador automáticamente
Start-Process "https://github.com/new"

Write-Host "Presiona ENTER cuando hayas creado el repositorio..." -ForegroundColor Yellow
Read-Host

Write-Host ""
Write-Host "🚀 Subiendo código a GitHub..." -ForegroundColor Yellow
Write-Host ""

git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "==========================================" -ForegroundColor Green
    Write-Host "  ✅ ¡ÉXITO! Código subido a GitHub" -ForegroundColor Green
    Write-Host "==========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 Ver tu repositorio en:" -ForegroundColor Cyan
    Write-Host "   https://github.com/$githubUser/erp-plasticos" -ForegroundColor White
    Write-Host ""
    
    # Abrir el repositorio en el navegador
    Start-Process "https://github.com/$githubUser/erp-plasticos"
} else {
    Write-Host ""
    Write-Host "==========================================" -ForegroundColor Red
    Write-Host "  ⚠️  Error al subir código" -ForegroundColor Red
    Write-Host "==========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Si te pidió credenciales y falló:" -ForegroundColor Yellow
    Write-Host "1. Ve a: https://github.com/settings/tokens" -ForegroundColor White
    Write-Host "2. Genera un nuevo token (classic)" -ForegroundColor White
    Write-Host "3. Marca el scope 'repo'" -ForegroundColor White
    Write-Host "4. Usa el token como password" -ForegroundColor White
    Write-Host ""
    Write-Host "Luego ejecuta: git push -u origin main" -ForegroundColor Cyan
    Write-Host ""
}
