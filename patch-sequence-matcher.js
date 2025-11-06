import fs from "fs";
import path from "path";

const outputDir = "./.mastra/output";
const patchRegex = /SequenceMatcher\.name\s*=\s*['"]SequenceMatcher['"];/g;

function patchFile(filePath) {
  let content = fs.readFileSync(filePath, "utf8");

  if (patchRegex.test(content)) {
    const patched = content.replace(
      patchRegex,
      `try {
  if (Object.getOwnPropertyDescriptor(SequenceMatcher, 'name')?.writable) {
    SequenceMatcher.name = 'SequenceMatcher';
  }
} catch (e) {
  // Ignore read-only property errors (Node >= 20)
}`
    );

    fs.writeFileSync(filePath, patched, "utf8");
    console.log(`✅ Patched SequenceMatcher safely in: ${path.basename(filePath)}`);
  }
}

// loop through all .mjs files inside .mastra/output
for (const file of fs.readdirSync(outputDir)) {
  if (file.endsWith(".mjs")) {
    patchFile(path.join(outputDir, file));
  }
}

console.log("✅ SequenceMatcher patch process completed.");
