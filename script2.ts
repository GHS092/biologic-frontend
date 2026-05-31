import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf-8');

// Fix duplicates
content = content.replace(/dark:bg-black\/(\d+) dark:bg-white\/(\d+)/g, 'dark:bg-white/$2');
content = content.replace(/dark:border-black\/(\d+) dark:border-white\/(\d+)/g, 'dark:border-white/$2');
content = content.replace(/dark:text-gray-900\/(\d+) dark:text-white\/(\d+)/g, 'dark:text-white/$2');
content = content.replace(/dark:text-gray-900 dark:text-white/g, 'dark:text-white');
content = content.replace(/dark:bg-gray-50 dark:bg-black/g, 'dark:bg-black');
content = content.replace(/dark:bg-black\/5 dark:bg-white\/5/g, 'dark:bg-white/5');

fs.writeFileSync('src/App.tsx', content);
console.log('App.tsx cleaned up');
