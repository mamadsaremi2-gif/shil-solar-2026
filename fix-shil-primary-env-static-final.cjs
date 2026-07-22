const fs = require("fs");

const files = [
  "src/components/project/ShilPrimaryButton.jsx",
  "src/src/components/project/ShilPrimaryButton.jsx",
  "src/components/ShilPrimaryButton.jsx",
  "src/src/components/ShilPrimaryButton.jsx"
].filter(fs.existsSync);

for (const file of files) {
  fs.copyFileSync(file, file + ".env-static-final-bak");

  let code = fs.readFileSync(file, "utf8");
  const old = code;

  // اضافه کردن تشخیص دکمه Environment
  if (!code.includes("const isEnvConfirmButton")) {
    code = code.replace(
      /export default function ShilPrimaryButton\s*\(([\s\S]*?)\)\s*\{/,
      (m) => m + `

  const isEnvConfirmButton = String(className || "").includes("shil-env-confirm-button");
`
    );
  }

  // تبدیل style نهایی به حالتی که دکمه Environment آخرین Override را داشته باشد
  code = code.replace(
    /style=\{\{[\s\S]*?\}\}/,
    `style={{
        ...fixedStyle,
        ...(style || {}),
        ...(isEnvConfirmButton
          ? {
              position: "static",
              inset: "auto",
              left: "auto",
              right: "auto",
              top: "auto",
              bottom: "auto",
              transform: "none",
              display: "flex",
              margin: "12px auto 52px",
              zIndex: "auto"
            }
          : {})
      }}`
  );

  if (code !== old) {
    fs.writeFileSync(file, code, "utf8");
    console.log("✅ ShilPrimaryButton env override fixed:", file);
  }
}

fs.rmSync("node_modules/.vite", { recursive:true, force:true });
fs.rmSync("dist", { recursive:true, force:true });
fs.rmSync("build", { recursive:true, force:true });
