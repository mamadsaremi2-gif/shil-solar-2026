const fs = require("fs");
const path = require("path");

function walk(dir) {
  let out = [];
  if (!fs.existsSync(dir)) return out;

  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const s = fs.statSync(p);

    if (s.isDirectory()) {
      if (!["node_modules", ".git", "dist", "build", "backup"].includes(name)) {
        out = out.concat(walk(p));
      }
    } else if (/\.(jsx|tsx|js|ts|css)$/.test(name)) {
      out.push(p);
    }
  }

  return out;
}

const files = walk("src");
let changed = 0;

for (const file of files) {
  let code = fs.readFileSync(file, "utf8");
  const original = code;

  code = code.replace(/\/\*\s*SHIL Environment final mobile-first patch\s*\*\/[\s\S]*?(?=(\/\*\s*SHIL|<\/style>|`;\s*$|' ;\s*$|" ;\s*$|$))/gi, "");
  code = code.replace(/\/\*\s*SHIL Environment final mobile-first patch\s*\*\/[\s\S]*?body\.shil-environment-screen[\s\S]*?(?=(\/\*\s*SHIL|$))/gi, "");

  if (code !== original) {
    fs.copyFileSync(file, file + ".env-old-style-bak");
    fs.writeFileSync(file, code, "utf8");
    changed++;
    console.log("✅ Removed old env style from:", file);
  }
}

console.log("Changed files:", changed);

fs.rmSync("node_modules/.vite", { recursive:true, force:true });
fs.rmSync("dist", { recursive:true, force:true });
fs.rmSync("build", { recursive:true, force:true });
