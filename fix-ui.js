import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf-8');

// Fix prose-invert
content = content.replace(/prose-invert/g, 'dark:prose-invert');

// Fix tabs text color
content = content.replace(
  /"bg-emerald-600 text-gray-900 dark:text-white"/g,
  '"bg-emerald-600 text-white"'
);
content = content.replace(
  /"text-gray-900\/30 dark:text-white\/30 hover:text-gray-900\/60 dark:text-white\/60 hover:bg-black\/5 dark:bg-white\/5"/g,
  '"text-gray-500 dark:text-white/50 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"'
);

// Fix 3-dots menu visibility
content = content.replace(
  /"text-gray-400 hover:text-gray-900 dark:text-white\/40 dark:hover:text-white opacity-0 group-hover:opacity-100 transition-all p-1.5 rounded-lg hover:bg-black\/5 dark:hover:bg-white\/10"/g,
  '"text-gray-400 hover:text-gray-900 dark:text-white/40 dark:hover:text-white opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10"'
);

fs.writeFileSync('src/App.tsx', content);
