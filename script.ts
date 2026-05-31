import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf-8');

// Replace text-white/x with text-gray-900/x dark:text-white/x
content = content.replace(/text-white\/(\d+)/g, 'text-gray-900/$1 dark:text-white/$1');
content = content.replace(/text-white\b(?![\/\-])/g, 'text-gray-900 dark:text-white');

// Replace bg-black/x with bg-gray-100 dark:bg-black/x
content = content.replace(/bg-black\/(\d+)/g, 'bg-gray-100 dark:bg-black/$1');
content = content.replace(/bg-black\b(?![\/\-])/g, 'bg-gray-50 dark:bg-black');

// Replace border-white/x with border-black/10 dark:border-white/x
content = content.replace(/border-white\/(\d+)/g, 'border-black/10 dark:border-white/$1');

// Replace bg-white/x with bg-black/5 dark:bg-white/x
content = content.replace(/bg-white\/(\d+)/g, 'bg-black/5 dark:bg-white/$1');

// Replace text-emerald-50 with text-emerald-900 dark:text-emerald-50
content = content.replace(/text-emerald-50\b/g, 'text-emerald-900 dark:text-emerald-50');

// Replace bg-emerald-900/40 with bg-emerald-100 dark:bg-emerald-900/40
content = content.replace(/bg-emerald-900\/40/g, 'bg-emerald-100 dark:bg-emerald-900/40');

// Replace border-emerald-500/30 with border-emerald-500/30 dark:border-emerald-500/30
content = content.replace(/border-emerald-500\/30/g, 'border-emerald-500/30 dark:border-emerald-500/30');

fs.writeFileSync('src/App.tsx', content);
console.log('App.tsx updated');
