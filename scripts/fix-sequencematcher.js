// scripts/fix-sequencematcher.js
import fs from 'fs';
import path from 'path';

const filePath = path.resolve('.mastra/output/mastra.mjs');

try {
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️ No mastra.mjs found at: ${filePath}`);
    process.exit(0);
  }

  let code = fs.readFileSync(filePath, 'utf8');

  const before = code.includes('SequenceMatcher.name');
  code = code.replace(
    /SequenceMatcher\.name\s*=\s*['"`]SequenceMatcher['"`];?/,
    '// SequenceMatcher.name assignment removed (patched)'
  );

  fs.writeFileSync(filePath, code, 'utf8');
  console.log(
    before
      ? '✅ Patched mastra.mjs to remove SequenceMatcher.name assignment'
      : 'ℹ️ No SequenceMatcher.name assignment found; nothing to patch.'
  );
} catch (err) {
  console.error('❌ Failed to patch mastra.mjs', err);
  process.exit(1);
}
