import fs from 'fs';

let appContent = fs.readFileSync('src/App.tsx', 'utf-8');

appContent = appContent.replace(/text-gray-900\/20 dark:text-white\/20/g, 'text-gray-400 dark:text-white/20');
appContent = appContent.replace(/text-gray-900\/10 dark:text-white\/10/g, 'text-gray-300 dark:text-white/10');

fs.writeFileSync('src/App.tsx', appContent);
