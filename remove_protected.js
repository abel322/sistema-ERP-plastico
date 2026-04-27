const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
    });
}

const protectedDir = path.join(__dirname, 'app', '(protected)');

walk(protectedDir, (filePath) => {
    if (filePath.endsWith('.tsx')) {
        let content = fs.readFileSync(filePath, 'utf8');

        // Check if file uses ProtectedLayout
        if (content.includes('ProtectedLayout')) {
            // Remove import
            content = content.replace(/import\s*{\s*ProtectedLayout\s*}\s*from\s*['"]@\/components\/layout\/protected-layout['"];?\n?/g, '');

            // Replace LoadingSpinner wraps
            content = content.replace(/<ProtectedLayout>\s*<LoadingSpinner([^>]+|.*?)>\s*<\/ProtectedLayout>/g, '<div className="flex h-[50vh] w-full items-center justify-center"><LoadingSpinner$1></div>');
            content = content.replace(/<ProtectedLayout>\s*<LoadingSpinner\s*\/>\s*<\/ProtectedLayout>/g, '<div className="flex h-[50vh] w-full items-center justify-center"><LoadingSpinner /></div>');

            // Replace outer tags
            content = content.replace(/<ProtectedLayout>/g, '<>');
            content = content.replace(/<\/ProtectedLayout>/g, '</>');

            fs.writeFileSync(filePath, content, 'utf8');
            console.log('Updated:', filePath);
        }
    }
});
