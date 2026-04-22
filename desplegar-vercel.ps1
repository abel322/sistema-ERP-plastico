# Script para desplegar en Vercel
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Despliegue en Vercel - ERP Plásticos" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📋 Pasos a seguir:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Abriendo Vercel en tu navegador..." -ForegroundColor White
Start-Sleep -Seconds 2
Start-Process "https://vercel.com/new"

Write-Host ""
Write-Host "2. En Vercel:" -ForegroundColor Yellow
Write-Host "   - Inicia sesión con GitHub" -ForegroundColor White
Write-Host "   - Busca: sistema-ERP-plastico" -ForegroundColor White
Write-Host "   - Haz clic en 'Import'" -ForegroundColor White
Write-Host ""

Write-Host "3. Configurar Variables de Entorno:" -ForegroundColor Yellow
Write-Host "   Expande 'Environment Variables' y agrega:" -ForegroundColor White
Write-Host ""

Write-Host "   DATABASE_URL:" -ForegroundColor Green
Write-Host "   postgresql://neondb_owner:npg_2GJXFQmbKhM9@ep-withered-band-an1ie58f-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require" -ForegroundColor Gray
Write-Host ""

Write-Host "   NEXTAUTH_SECRET:" -ForegroundColor Green
Write-Host "   vRGEpoOH2tubpToZXi12YWYmiUwk35C5" -ForegroundColor Gray
Write-Host ""

Write-Host "   ABACUSAI_API_KEY:" -ForegroundColor Green
Write-Host "   49a1c579791a47748bc6fe316442c094" -ForegroundColor Gray
Write-Host ""

Write-Host "   NEXTAUTH_URL:" -ForegroundColor Green
Write-Host "   (Déjalo vacío por ahora, lo actualizaremos después)" -ForegroundColor Gray
Write-Host ""

Write-Host "4. Haz clic en 'Deploy' y espera 2-5 minutos" -ForegroundColor Yellow
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Presiona ENTER cuando el deploy termine..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Read-Host

Write-Host ""
Write-Host "📝 Ahora necesitas actualizar NEXTAUTH_URL:" -ForegroundColor Yellow
Write-Host ""
$vercelUrl = Read-Host "Ingresa la URL que te dio Vercel (ejemplo: https://sistema-erp-plastico.vercel.app)"

if ([string]::IsNullOrWhiteSpace($vercelUrl)) {
    Write-Host "❌ No ingresaste una URL" -ForegroundColor Red
    Write-Host ""
    Write-Host "Pasos manuales:" -ForegroundColor Yellow
    Write-Host "1. Ve a tu proyecto en Vercel" -ForegroundColor White
    Write-Host "2. Settings → Environment Variables" -ForegroundColor White
    Write-Host "3. Edita NEXTAUTH_URL y pon tu URL de Vercel" -ForegroundColor White
    Write-Host "4. Deployments → Redeploy" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "✅ URL capturada: $vercelUrl" -ForegroundColor Green
    Write-Host ""
    Write-Host "Ahora ve a Vercel y:" -ForegroundColor Yellow
    Write-Host "1. Settings → Environment Variables" -ForegroundColor White
    Write-Host "2. Edita NEXTAUTH_URL y pon: $vercelUrl" -ForegroundColor Cyan
    Write-Host "3. Guarda los cambios" -ForegroundColor White
    Write-Host "4. Ve a Deployments → Redeploy" -ForegroundColor White
    Write-Host ""
    
    Write-Host "¿Quieres abrir la configuración de Vercel? (s/n): " -ForegroundColor Yellow -NoNewline
    $openSettings = Read-Host
    
    if ($openSettings -eq "s" -or $openSettings -eq "S") {
        Start-Process "https://vercel.com/dashboard"
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  ✅ Proceso completado" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Tu aplicación estará disponible en:" -ForegroundColor Cyan
if (![string]::IsNullOrWhiteSpace($vercelUrl)) {
    Write-Host "   $vercelUrl" -ForegroundColor White
    Write-Host ""
    Write-Host "¿Quieres abrir tu aplicación? (s/n): " -ForegroundColor Yellow -NoNewline
    $openApp = Read-Host
    
    if ($openApp -eq "s" -or $openApp -eq "S") {
        Start-Process $vercelUrl
    }
}

Write-Host ""
Write-Host "📚 Para más información, lee: DESPLEGAR-VERCEL.md" -ForegroundColor Cyan
Write-Host ""
