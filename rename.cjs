const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(fullPath));
        } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.css')) {
            results.push(fullPath);
        }
    });
    return results;
}

const files = walk('f:/02_Projects/01 Personal/Formiqx/src');
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let updated = content.replace(/glass-card/g, 'content-card');

    if (content !== updated) {
        fs.writeFileSync(file, updated);
        console.log('Renamed glass-card in: ' + file);
    }
});
