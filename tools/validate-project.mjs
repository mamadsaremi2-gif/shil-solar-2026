import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const sourceRoot = path.join(root, "src");
const requiredFiles = ["index.html", "package.json", "src/main.jsx", "src/app/App.jsx"];
const extensions = [".js", ".jsx", ".ts", ".tsx"];
const importPattern = /(?:import|export)\s+(?:[^'\"]*?\s+from\s+)?[\"']([^\"']+)[\"']/g;

function exists(filePath) {
  return fs.existsSync(path.join(root, filePath));
}

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(fullPath);
    return extensions.includes(path.extname(entry.name)) ? [fullPath] : [];
  });
}

const errors = [];
for (const file of requiredFiles) {
  if (!exists(file)) errors.push(`Missing required file: ${file}`);
}

for (const filePath of walk(sourceRoot)) {
  const content = fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
  for (const match of content.matchAll(importPattern)) {
    const specifier = match[1];
    if (!specifier.startsWith(".")) continue;

    const base = path.resolve(path.dirname(filePath), specifier);
    const candidates = [
      base,
      ...extensions.map((ext) => `${base}${ext}`),
      ...extensions.map((ext) => path.join(base, `index${ext}`)),
    ];

    if (!candidates.some((candidate) => fs.existsSync(candidate))) {
      errors.push(`${path.relative(root, filePath)} -> unresolved import: ${specifier}`);
    }
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log("SHIL validation passed: required files and relative imports are healthy.");
