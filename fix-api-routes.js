const fs = require('fs');
const path = require('path');

// Lista de archivos de rutas API
const apiRoutes = [
  'app/api/proveedores/route.ts',
  'app/api/proveedores/[id]/route.ts',
  'app/api/producto-terminado/[id]/route.ts',
  'app/api/producto-terminado/[id]/procesar/route.ts',
  'app/api/producto-terminado/[id]/defectuoso/route.ts',
  'app/api/perfil/verify-action/route.ts',
  'app/api/perfil/action-password/route.ts',
  'app/api/peletizado/[id]/route.ts',
  'app/api/peletizado/route.ts',
  'app/api/notificaciones/[id]/route.ts',
  'app/api/notificaciones/route.ts',
  'app/api/notificaciones/configuracion/route.ts',
  'app/api/muestras/[id]/route.ts',
  'app/api/muestras/route.ts',
  'app/api/mejoras/[id]/route.ts',
  'app/api/mejoras/route.ts',
  'app/api/mantenimientos/[id]/route.ts',
  'app/api/mantenimientos/route.ts',
  'app/api/inventario/[id]/route.ts',
  'app/api/inventario/route.ts',
  'app/api/inventario/movimientos/route.ts',
  'app/api/inventario/materia-prima/proyecciones/route.ts',
  'app/api/inventario/materia-prima/entrada/route.ts',
  'app/api/inventario/materia-prima/analisis/route.ts',
  'app/api/facturas/[id]/route.ts',
  'app/api/facturas/stats-mes/route.ts',
  'app/api/facturas/route.ts',
  'app/api/despachos/[id]/route.ts',
  'app/api/despachos/route.ts',
  'app/api/despachos/pendientes-facturar/route.ts',
  'app/api/compras/[id]/route.ts',
  'app/api/compras/route.ts',
  'app/api/calidad/inspecciones/route.ts',
  'app/api/calidad/parametros/route.ts',
  'app/api/reportes/ventas/route.ts',
  'app/api/reportes/produccion/route.ts',
  'app/api/reportes/inventario/route.ts',
  'app/api/reportes/eficiencia/route.ts',
];

apiRoutes.forEach(filePath => {
  try {
    const fullPath = path.join(__dirname, filePath);
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  Archivo no encontrado: ${filePath}`);
      return;
    }

    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Verificar si ya tiene la declaración
    if (content.includes('export const dynamic')) {
      console.log(`✅ Ya tiene dynamic: ${filePath}`);
      return;
    }

    // Buscar la primera línea vacía después de los imports
    const lines = content.split('\n');
    let insertIndex = -1;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim() === '' && i > 0 && !lines[i-1].startsWith('import')) {
        insertIndex = i;
        break;
      }
    }

    if (insertIndex === -1) {
      // Si no encuentra línea vacía, buscar después del último import
      for (let i = lines.length - 1; i >= 0; i--) {
        if (lines[i].startsWith('import')) {
          insertIndex = i + 1;
          break;
        }
      }
    }

    if (insertIndex !== -1) {
      lines.splice(insertIndex, 0, '', 'export const dynamic = \'force-dynamic\';');
      content = lines.join('\n');
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`✅ Actualizado: ${filePath}`);
    } else {
      console.log(`⚠️  No se pudo encontrar dónde insertar: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error en ${filePath}:`, error.message);
  }
});

console.log('\n✅ Proceso completado');
