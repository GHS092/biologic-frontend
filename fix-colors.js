import fs from 'fs';

// Fix index.css
let cssContent = fs.readFileSync('src/index.css', 'utf-8');

// Remove hardcoded markdown colors
cssContent = cssContent.replace(/\.markdown-body h1,\s*\.markdown-body h2,\s*\.markdown-body h3,\s*\.markdown-body h4,\s*\.markdown-body h5,\s*\.markdown-body h6\s*\{[^}]+\}/g, '');
cssContent = cssContent.replace(/\.markdown-body strong\s*\{[^}]+\}/g, '');
cssContent = cssContent.replace(/\.markdown-body em\s*\{[^}]+\}/g, '');
cssContent = cssContent.replace(/\.markdown-body code\s*\{[^}]+\}/g, '');
cssContent = cssContent.replace(/\.markdown-body pre\s*\{[^}]+\}/g, '');
cssContent = cssContent.replace(/\.markdown-body pre code\s*\{[^}]+\}/g, '');
cssContent = cssContent.replace(/\.markdown-body blockquote\s*\{[^}]+\}/g, '');

fs.writeFileSync('src/index.css', cssContent);

// Fix App.tsx
let appContent = fs.readFileSync('src/App.tsx', 'utf-8');

// Add dark: prefixes for prose colors
appContent = appContent.replace(/prose-headings:text-rose-400/g, 'prose-headings:text-rose-600 dark:prose-headings:text-rose-400');
appContent = appContent.replace(/prose-strong:text-emerald-400/g, 'prose-strong:text-emerald-600 dark:prose-strong:text-emerald-400');
appContent = appContent.replace(/prose-em:text-blue-400/g, 'prose-em:text-blue-600 dark:prose-em:text-blue-400');
appContent = appContent.replace(/prose-a:text-emerald-400/g, 'prose-a:text-emerald-600 dark:prose-a:text-emerald-400');
appContent = appContent.replace(/hover:prose-a:text-emerald-300/g, 'hover:prose-a:text-emerald-700 dark:hover:prose-a:text-emerald-300');
appContent = appContent.replace(/prose-a:text-purple-400/g, 'prose-a:text-purple-600 dark:prose-a:text-purple-400');
appContent = appContent.replace(/hover:prose-a:text-purple-300/g, 'hover:prose-a:text-purple-700 dark:hover:prose-a:text-purple-300');

// Fix text-gray-900/40 to be more visible in light mode
appContent = appContent.replace(/text-gray-900\/40 dark:text-white\/40/g, 'text-gray-500 dark:text-white/40');

fs.writeFileSync('src/App.tsx', appContent);
