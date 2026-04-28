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
console.log(`Revisando ${files.length} archivos...\n`);

let fixed = 0;
let problematic = [];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  
  // Buscar "export const dynamic" mal ubicado (con cualquier indentación)
  let dynamicLineIndex = -1;
  let lastImportIndex = -1;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Encontrar el último import
    if (line.trim().startsWith('import ')) {
      lastImportIndex = i;
    }
    
    // Encontrar export const dynamic mal ubicado (con espacios/tabs al inicio)
    if (line.match(/^\s+export const dynamic/) || 
        (line.includes('export const dynamic') && !line.trim().startsWith('export const dynamic'))) {
      dynamicLineIndex = i;
      problematic.push({ file, line: i + 1, content: line.trim() });
      break;
    }
  }
  
  if (dynamicLineIndex !== -1 && lastImportIndex !== -1) {
    // Remover la línea mal ubicada
    const dynamicLine = 'export const dynamic = \'force-dynamic\';';
    lines.splice(dynamicLineIndex, 1);
    
    // Insertar después del último import
    lines.splice(lastImportIndex + 1, 0, '', dynamicLine);
    
    // Guardar el archivo
    fs.writeFileSync(file, lines.join('\n'), 'utf8');
    console.log(`✅ Corregido: ${file}`);
    fixed++;
  }
});

if (problematic.length > 0) {
  console.log('\n❌ Archivos problemáticos encontrados:');
  problematic.forEach(p => {
    console.log(`${p.file}:${p.line} - ${p.content}`);
  });
}

console.log(`\n✅ Total corregidos: ${fixed} archivos`);