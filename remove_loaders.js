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

        // Check if file uses LoadingSpinner wrap
        if (content.includes('<div className="flex h-[50vh] w-full items-center justify-center"><LoadingSpinner /></div>') ||
            content.includes('<div className="flex h-[50vh] w-full items-center justify-center"><LoadingSpinner/></div>')) {

            // If we completely remove the early return `if (loading) return <loader />`, 
            // the tables will render empty initially and then fill up when data arrives.
            // This is much faster and less jarring than a full screen unmount/mount loader.

            // Replace standard loading block
            content = content.replace(/if\s*\(\s*loading\s*\)\s*(?:return|{)\s*<div[^>]*>\s*<LoadingSpinner[^>]*>\s*<\/div>;?\s*(?:})?/g, '');
            content = content.replace(/if\s*\(\s*loading\s*\)\s*(?:return|{)\s*<ProtectedLayout>\s*<LoadingSpinner[^>]*>\s*<\/ProtectedLayout>;?\s*(?:})?/g, '');

            fs.writeFileSync(filePath, content, 'utf8');
            console.log('Removed blocking loader from:', filePath);
        }
    }
});
