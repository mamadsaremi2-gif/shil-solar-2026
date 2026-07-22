const fs = require("fs");

const files = [
  "src/pages/project/Environment.jsx",
  "src/src/pages/project/Environment.jsx"
].filter(fs.existsSync);

for (const file of files) {
  fs.copyFileSync(file, file + ".env-confirm-static-bak");

  let code = fs.readFileSync(file, "utf8");
  const old = code;

  code = code.replace(
    /(<ShilPrimaryButton\s+className="shil-env-confirm-button"[\s\S]*?label="تأیید محیط"\s*)\/>/,
    `$1
    style={{
      position: "static",
      left: "auto",
      right: "auto",
      bottom: "auto",
      top: "auto",
      transform: "none",
      margin: "12px auto 52px",
      display: "flex"
    }}
  />`
  );

  if (code !== old) {
    fs.writeFileSync(file, code, "utf8");
    console.log("✅ Environment confirm button made static:", file);
  } else {
    console.log("⚠️ Pattern not found:", file);
  }
}

fs.rmSync("node_modules/.vite", { recursive:true, force:true });
fs.rmSync("dist", { recursive:true, force:true });
fs.rmSync("build", { recursive:true, force:true });

console.log("✅ done");
