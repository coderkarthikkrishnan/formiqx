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
    let updated = content
        .replace(/btn-primary/g, 'primary-button')
        .replace(/form-input/g, 'input-field')
        .replace(/btn btn-glass/g, 'primary-button')
        .replace(/btn-glass/g, 'primary-button') // Catch any remaining
        .replace(/className="btn primary-button"/g, 'className="primary-button"')
        .replace(/className={`btn primary-button/g, 'className={`primary-button')
        .replace(/className="btn primary-button btn-sm"/g, 'className="primary-button btn-sm"')
        .replace(/className="btn primary-button btn-lg"/g, 'className="primary-button btn-lg"')
        .replace(/className="container"/g, 'className="page-container"')
        .replace(/\.container /g, '.page-container ')
        .replace(/\.container\b/g, '.page-container');

    // Clean up class names again if it resulted in duplicates
    updated = updated.replace(/className="btn primary-button/g, 'className="primary-button');

    if (content !== updated) {
        fs.writeFileSync(file, updated);
        console.log('Updated: ' + file);
    }
});
