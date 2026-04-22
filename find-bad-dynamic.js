const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Buscar todos los archivos route.ts
const files = glob.sync('app/api/**/route.ts');

console.log(`Revisando ${files.length} archivos...\n`);

const problematicos = [];

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Buscar "export const dynamic" que NO esté al inicio de la línea (ignorando espacios)
    if (line.includes('export const dynamic') && line.trim().startsWith('export')) {
      // Verificar si tiene indentación (espacios o tabs al inicio)
      if (line.match(/^[\s\t]+export const dynamic/)) {
        problematicos.push({
          file,
          line: i + 1,
          content: line.trim()
        });
      }
    }
  }
});

if (problematicos.length === 0) {
  console.log('✅ No se encontraron problemas');
} else {
  console.log(`❌ Se encontraron ${problematicos.length} archivos con problemas:\n`);
  problematicos.forEach(p => {
    console.log(`${p.file}:${p.line}`);
    console.log(`  ${p.content}\n`);
  });
}
