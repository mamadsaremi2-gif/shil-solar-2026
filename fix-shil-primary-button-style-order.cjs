const fs = require("fs");

const files = [
  "src/components/project/ShilPrimaryButton.jsx",
  "src/src/components/project/ShilPrimaryButton.jsx",
  "src/components/ShilPrimaryButton.jsx",
  "src/src/components/ShilPrimaryButton.jsx"
].filter(fs.existsSync);

if (!files.length) {
  console.error("❌ ShilPrimaryButton.jsx پیدا نشد");
  process.exit(1);
}

for (const file of files) {
  fs.copyFileSync(file, file + ".safe-style-order-bak");

  let code = fs.readFileSync(file, "utf8");
  const old = code;

  // حذف bottom از fixedStyle، بدون دست زدن به متن فارسی
  code = code.replace(/\s*bottom\s*:\s*["']\d+px["']\s*,?/g, "");

  // تغییر ترتیب merge استایل، تا style صفحه بتواند fixedStyle را override کند
  code = code.replace(
    /style=\{\{\s*\.\.\.\(style\s*\|\|\s*\{\}\)\s*,\s*\.\.\.fixedStyle\s*\}\}/g,
    "style={{ ...fixedStyle, ...(style || {}) }}"
  );

  code = code.replace(
    /style=\{\{\s*\.\.\.style\s*,\s*\.\.\.fixedStyle\s*\}\}/g,
    "style={{ ...fixedStyle, ...style }}"
  );

  if (code !== old) {
    fs.writeFileSync(file, code, "utf8");
    console.log("✅ fixed:", file);
  } else {
    console.log("ℹ️ no change needed:", file);
  }
}

fs.rmSync("node_modules/.vite", { recursive:true, force:true });
fs.rmSync("dist", { recursive:true, force:true });
fs.rmSync("build", { recursive:true, force:true });

console.log("✅ cache cleared");
