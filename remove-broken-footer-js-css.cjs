const fs = require("fs");

const files = [
  "src/appearance/styles/shil-project-layout-inline-fix.js",
  "src/src/appearance/styles/shil-project-layout-inline-fix.js"
].filter(fs.existsSync);

const START = "/* SHIL_PROJECT_INFO_FOOTER_FORCE_40_START */";
const END   = "/* SHIL_PROJECT_INFO_FOOTER_FORCE_40_END */";

function esc(s){
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

for(const file of files){
  let code = fs.readFileSync(file, "utf8");

  fs.copyFileSync(file, file + ".broken-css-js-bak");

  code = code.replace(
    new RegExp(esc(START) + "[\\s\\S]*?" + esc(END), "g"),
    ""
  );

  fs.writeFileSync(file, code.trimEnd() + "\n", "utf8");

  console.log("✅ Removed broken CSS block from JS:", file);
}

fs.rmSync("node_modules/.vite", {recursive:true, force:true});
fs.rmSync("dist", {recursive:true, force:true});
fs.rmSync("build", {recursive:true, force:true});

console.log("✅ Cache cleared");
