const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'media', 'tabs', 'VoiceGeneration.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const normalizedContent = content.replace(/\r?\n/g, '\n');

const startIdx = normalizedContent.indexOf('toast.error("فشل توليد الصوت: " + err.message);');
const endIdx = normalizedContent.indexOf('const previewVoice =');

if (startIdx !== -1 && endIdx !== -1 && startIdx < endIdx) {
   const partBefore = normalizedContent.slice(0, startIdx);
   const partAfter = normalizedContent.slice(endIdx);
   const updated = partBefore + 'toast.error("فشل توليد الصوت: " + err.message);\n      }\n  };\n\n  ' + partAfter;
   fs.writeFileSync(filePath, updated, 'utf8');
   console.log("Updated via index boundaries successfully!");
} else {
   console.log("Could not find boundaries. Start:", startIdx, "End:", endIdx);
}
