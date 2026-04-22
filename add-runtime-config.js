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
  
  // Verificar si ya tiene runtime configurado
  if (content.includes("export const runtime")) {
    console.log(`⏭️  Ya tiene runtime: ${file}`);
    return;
  }
  
  // Buscar la línea de export const dynamic
  const lines = content.split('\n');
  let dynamicIndex = -1;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('export const dynamic')) {
      dynamicIndex = i;
      break;
    }
  }
  
  if (dynamicIndex !== -1) {
    // Agregar runtime después de dynamic
    lines.splice(dynamicIndex + 1, 0, "export const runtime = 'nodejs';");
    
    fs.writeFileSync(file, lines.join('\n'), 'utf8');
    console.log(`✅ Procesado: ${file}`);
    processed++;
  } else {
    console.log(`⚠️  No tiene dynamic: ${file}`);
  }
});

console.log(`\n✅ Total procesados: ${processed} archivos`);