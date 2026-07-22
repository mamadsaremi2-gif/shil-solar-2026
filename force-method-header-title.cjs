const fs = require("fs");
const path = require("path");

const files = [
  "src/pages/project/CalculationMethod.jsx",
  "src/src/pages/project/CalculationMethod.jsx",
  "src/pages/CalculationMethod.jsx",
  "src/src/pages/CalculationMethod.jsx"
].filter(fs.existsSync);

for (const file of files) {
  let code = fs.readFileSync(file, "utf8");
  const old = code;

  code = code.replace(/روش\s*محاسبات\s*اجرای\s*پروژه\s*با\s*پنل\s*خورشیدی/g, "روش طراحی");
  code = code.replace(/روش\s*محاسبات\s*اجرایی\s*پروژه/g, "روش طراحی");
  code = code.replace(/روش\s*محاسبات/g, "روش طراحی");

  code = code.replace(
    /(<ShilPageShell\b[^>]*\btitle\s*=\s*)["'][^"']*["']/g,
    '$1"روش طراحی"'
  );

  code = code.replace(
    /(<ShilFrame\b[^>]*\btitle\s*=\s*)["'][^"']*["']/g,
    '$1"روش طراحی"'
  );

  code = code.replace(
    /(<div\b[^>]*className=["']shil-header-title["'][^>]*>)[\s\S]*?(<\/div>)/g,
    '$1روش طراحی$2'
  );

  if (code !== old) {
    fs.copyFileSync(file, file + ".method-title-force-bak");
    fs.writeFileSync(file, code, "utf8");
    console.log("✅ fixed:", file);
  }
}

fs.rmSync("node_modules/.vite", { recursive:true, force:true });
fs.rmSync("dist", { recursive:true, force:true });
fs.rmSync("build", { recursive:true, force:true });
