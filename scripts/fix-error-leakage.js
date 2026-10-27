const fs = require('fs');
const path = require('path');

function walkDir(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory() && file !== 'node_modules') {
      results = results.concat(walkDir(filePath));
    } else if (file.endsWith('route.ts')) {
      results.push(filePath);
    }
  }
  return results;
}

const apiDir = path.join(__dirname, '..', 'app', 'api');
const files = walkDir(apiDir);

let totalReplacements = 0;

for (const filePath of files) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Pattern 1: { error: error?.message || 'Some message' },
  const pattern1 = /{ error: error\?\.message \|\| '([^']+)'/g;
  const newContent1 = content.replace(pattern1, (match, fallback) => {
    modified = true;
    totalReplacements++;
    return `{ error: '${fallback}'`;
  });
  content = newContent1;

  // Pattern 2: { error: error.message || 'Some message' },
  const pattern2 = /{ error: error\.message \|\| '([^']+)'/g;
  const newContent2 = content.replace(pattern2, (match, fallback) => {
    modified = true;
    totalReplacements++;
    return `{ error: '${fallback}'`;
  });
  content = newContent2;

  // Pattern 3: { error: err.message },
  const pattern3 = /{ error: err\.message },/g;
  const newContent3 = content.replace(pattern3, (match) => {
    modified = true;
    totalReplacements++;
    return `{ error: 'Internal server error' },`;
  });
  content = newContent3;

  // Pattern 4: { error: err?.message || 'Some message' },
  const pattern4 = /{ error: err\?\.message \|\| '([^']+)'/g;
  const newContent4 = content.replace(pattern4, (match, fallback) => {
    modified = true;
    totalReplacements++;
    return `{ error: '${fallback}'`;
  });
  content = newContent4;

  // Pattern 5: details: error?.message || String(error),
  const pattern5 = /details: error\?\.message \|\| String\(error\),/g;
  const newContent5 = content.replace(pattern5, (match) => {
    modified = true;
    totalReplacements++;
    return `details: 'An unexpected error occurred',`;
  });
  content = newContent5;

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed: ${filePath.replace(__dirname + '/', '')}`);
  }
}

console.log(`\nTotal replacements: ${totalReplacements}`);
