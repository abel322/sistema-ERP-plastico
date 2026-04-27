const fs = require('fs');
const path = require('path');

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    if (fs.statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
    } else if (file === 'route.ts') {
      arrayOfFiles.push(filePath);
    }
  });

  return arrayOfFiles;
}

const files = getAllFiles('app/api');
console.log(`Procesando ${files.length} archivos...\n`);

let processed = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let lines = content.split('\n');
  let modified = false;
  
  // Buscar si ya tiene export const dynamic
  let hasDynamic = false;
  let dynamicLineIndex = -1;
  let lastImportIndex = -1;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Encontrar el último import
    if (line.trim().startsWith('import ')) {
      lastImportIndex = i;
    }
    
    // Encontrar export const dynamic (en cualquier ubicación)
    if (line.includes('export const dynamic')) {
      hasDynamic = true;
      dynamicLineIndex = i;
      
      // Si no está en la posición correcta (después de imports), marcarlo para mover
      if (i > lastImportIndex + 2) {
        // Está mal ubicado, necesita moverse
        lines.splice(i, 1); // Remover de posición actual
        
        // Insertar después del último import
        if (lastImportIndex >= 0) {
          lines.splice(lastImportIndex + 1, 0, '', 'export const dynamic = \'force-dynamic\';');
        } else {
          // Si no hay imports, poner al inicio
          lines.unshift('export const dynamic = \'force-dynamic\';', '');
        }
        
        modified = true;
        break;
      }
    }
  }
  
  // Si no tiene export const dynamic, agregarlo
  if (!hasDynamic) {
    if (lastImportIndex >= 0) {
      lines.splice(lastImportIndex + 1, 0, '', 'export const dynamic = \'force-dynamic\';');
    } else {
      // Si no hay imports, poner al inicio
      lines.unshift('export const dynamic = \'force-dynamic\';', '');
    }
    modified = true;
  }
  
  if (modified) {
    fs.writeFileSync(file, lines.join('\n'), 'utf8');
    console.log(`✅ Procesado: ${file}`);
    processed++;
  }
});

console.log(`\n✅ Total procesados: ${processed} archivos`);