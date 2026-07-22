const fs = require("fs");

const files = [
  "src/components/ShilPageShell.jsx",
  "src/src/components/ShilPageShell.jsx"
].filter(fs.existsSync);

for (const file of files) {
  let code = fs.readFileSync(file, "utf8");
  const old = code;

  if (!code.includes("const normalizeShilTitle")) {
    code = code.replace(
      /export default function ShilPageShell\s*\(([^)]*)\)\s*\{/,
      `function normalizeShilTitle(title) {
  const t = String(title || "").trim();
  if (t.includes("روش محاسبات")) return "روش طراحی";
  if (t.includes("تنظیمات سیستم")) return "تنظیمات";
  if (t.includes("چکیده طراحی سیستم")) return "چکیده طراحی";
  return t;
}

export default function ShilPageShell($1) {`
    );
  }

  code = code.replace(
    /<div className="shil-header-title">\{title\}<\/div>/g,
    `<div className="shil-header-title">{normalizeShilTitle(title)}</div>`
  );

  if (code !== old) {
    fs.copyFileSync(file, file + ".normalize-title-bak");
    fs.writeFileSync(file, code, "utf8");
    console.log("✅ normalized header title:", file);
  }
}

fs.rmSync("node_modules/.vite", { recursive:true, force:true });
fs.rmSync("dist", { recursive:true, force:true });
fs.rmSync("build", { recursive:true, force:true });
