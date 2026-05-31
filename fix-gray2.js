import fs from 'fs';

let appContent = fs.readFileSync('src/App.tsx', 'utf-8');

appContent = appContent.replace(/text-gray-900\/50 dark:text-white\/50/g, 'text-gray-500 dark:text-white/50');
appContent = appContent.replace(/text-gray-900\/60 dark:text-white\/60/g, 'text-gray-500 dark:text-white/60');
appContent = appContent.replace(/text-gray-900\/70 dark:text-white\/70/g, 'text-gray-600 dark:text-white/70');
appContent = appContent.replace(/text-gray-900\/80 dark:text-white\/80/g, 'text-gray-700 dark:text-white/80');
appContent = appContent.replace(/text-gray-900\/90 dark:text-white\/90/g, 'text-gray-800 dark:text-white/90');

fs.writeFileSync('src/App.tsx', appContent);
