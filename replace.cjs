const fs = require('fs');
const path = require('path');

function replaceInDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceInDir(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      if (fullPath.includes('soundToast.ts') || fullPath.includes('App.tsx')) continue; // Skip App if it has Toaster
      let content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes("from 'sonner'") || content.includes('from "sonner"')) {
        let regex = /import\s+\{\s*toast\s*(?:,\s*Toaster)?\s*\}\s+from\s+['"]sonner['"];/g;
        // if only toast was imported
        if (content.match(/import \{ toast \} from ['"]sonner['"];/)) {
            // we need to know the relative path to lib/soundToast
            const relativePath = path.relative(path.dirname(fullPath), path.join(__dirname, 'src/lib/soundToast')).replace(/\\/g, '/');
            content = content.replace(/import \{ toast \} from ['"]sonner['"];/g, `import { toast } from '${relativePath.startsWith('.') ? relativePath : './' + relativePath}';`);
        } else if (content.match(/import \{ Toaster, toast \} from ['"]sonner['"];/)) {
            const relativePath = path.relative(path.dirname(fullPath), path.join(__dirname, 'src/lib/soundToast')).replace(/\\/g, '/');
            content = content.replace(/import \{ Toaster, toast \} from ['"]sonner['"];/g, `import { Toaster } from 'sonner';\nimport { toast } from '${relativePath.startsWith('.') ? relativePath : './' + relativePath}';`);
        }
        fs.writeFileSync(fullPath, content);
      }
    }
  }
}

replaceInDir(path.join(__dirname, 'src'));
