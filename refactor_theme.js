const fs = require('fs');
const path = require('path');

function getRelativePath(from, to) {
  let rel = path.relative(path.dirname(from), to).replace(/\\/g, '/');
  if (!rel.startsWith('.')) rel = './' + rel;
  return rel.replace('.tsx', '');
}

const themeContextPath = path.resolve('src/context/ThemeContext.tsx');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes('makeStyles(') || !content.includes('COLORS')) {
    return;
  }

  // 1. Replace imports
  const relThemePath = getRelativePath(filePath, themeContextPath);
  content = content.replace(/import\s+\{\s*COLORS\s*\}\s+from\s+['"][^'"]+['"];/g, 
    `import { useTheme, ThemeColors } from '${relThemePath}';`);

  // 2. Insert hooks
  const compRegex = /(export const [A-Za-z0-9_]+ = \(.*?\) => \{)/;
  if (compRegex.test(content)) {
    content = content.replace(compRegex, 
      `$1\n  const { isDark, colors } = useTheme();\n  const s = makeStyles(colors);`);
  } else {
    const defRegex = /(export default function [A-Za-z0-9_]+\(.*\) \{)/;
    if (defRegex.test(content)) {
      content = content.replace(defRegex, 
        `$1\n  const { isDark, colors } = useTheme();\n  const s = makeStyles(colors);`);
    }
  }

  // 3. Replace COLORS. with colors.
  content = content.replace(/COLORS\./g, 'colors.');

  // 4. Change StyleSheet.create
  content = content.replace(/const s = StyleSheet\.create\(\{/g, 'const makeStyles = (colors: ThemeColors) => StyleSheet.create({');

  fs.writeFileSync(filePath, content);
  console.log('Processed', filePath);
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      processFile(fullPath);
    }
  }
}

walkDir(path.resolve('src/screens'));
walkDir(path.resolve('src/components'));
walkDir(path.resolve('src/navigation'));
