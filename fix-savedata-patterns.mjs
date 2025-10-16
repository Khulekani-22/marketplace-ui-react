#!/usr/bin/env node

/**
 * Script to automatically fix all saveData callback patterns in backend routes
 * Converts: saveData((data) => { ... return data; })
 * To: const data = await getData(); ... await saveData(data);
 */

import fs from 'fs';
import path from 'path';

const filesToFix = [
  'backend/routes/messages.js',
  'backend/routes/vendors.js',
  'backend/routes/users.js',
  'backend/routes/startups.js',
  'backend/routes/admin.js'
];

console.log('🔧 Starting automatic saveData pattern fix...\n');

let totalFixed = 0;

filesToFix.forEach(filePath => {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  const originalContent = content;
  let fileFixCount = 0;
  
  // Pattern 1: Basic callback pattern
  // saveData((data) => { ... return data; })
  const pattern1 = /(\s+)(const\s+\w+\s*=\s*)?await\s+saveData\(\((?:data|doc)\)\s*=>\s*\{([^}]+(?:\{[^}]*\}[^}]*)*)\s*return\s+(?:data|doc);\s*\}\);?/g;
  
  content = content.replace(pattern1, (match, indent, assignment, body) => {
    fileFixCount++;
    return `${indent}const data = await getData();\n${indent}${body.trim()}\n${indent}await saveData(data);`;
  });
  
  // Pattern 2: Simple inline callback
  // saveData((data) => { ... })
  const pattern2 = /(\s+)saveData\(\((?:data|doc)\)\s*=>\s*\{([^}]+(?:\{[^}]*\}[^}]*)*)\s*\}\);?/g;
  
  content = content.replace(pattern2, (match, indent, body) => {
    // Check if there's already a getData call nearby
    if (body.includes('await getData()')) {
      return match; // Skip if already fixed
    }
    fileFixCount++;
    return `${indent}const data = await getData();\n${indent}${body.trim()}\n${indent}await saveData(data);`;
  });
  
  if (content !== originalContent) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Fixed ${fileFixCount} pattern(s) in ${filePath}`);
    totalFixed += fileFixCount;
  } else {
    console.log(`✓  No patterns found in ${filePath}`);
  }
});

console.log(`\n🎉 Total patterns fixed: ${totalFixed}`);
console.log('\n⚠️  Note: This is an automatic fix. Please review the changes and test thoroughly.');
