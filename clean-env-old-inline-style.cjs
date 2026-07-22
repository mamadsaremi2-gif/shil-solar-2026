const fs = require("fs");

const files = [
  "src/pages/project/Environment.jsx",
  "src/src/pages/project/Environment.jsx",
  "src/appearance/styles/shil-project-layout-inline-fix.js",
  "src/src/appearance/styles/shil-project-layout-inline-fix.js"
].filter(fs.existsSync);

const removeBlocks = [
  /\/\*\s*SHIL Environment final mobile-first patch\s*\*\/[\s\S]*?(?=\/\* SHIL|$)/g,
  /\/\*\s*SHIL Environment Map Pin - clean final\s*\*\/[\s\S]*?(?=\/\* SHIL|$)/g,
  /\/\*\s*SHIL Environment.*?patch\s*\*\/[\s\S]*?(?=\/\* SHIL|$)/gi
];

for (const file of files) {
  fs.copyFileSync(file, file + ".env-style-bak");

  let code = fs.readFileSync(file, "utf8");

  for (const re of removeBlocks) {
    code = code.replace(re, "");
  }

  fs.writeFileSync(file, code, "utf8");
  console.log("✅ پاکسازی شد:", file);
}

fs.rmSync("node_modules/.vite", { recursive:true, force:true });
fs.rmSync("dist", { recursive:true, force:true });
fs.rmSync("build", { recursive:true, force:true });

console.log("✅ کش پاک شد");
