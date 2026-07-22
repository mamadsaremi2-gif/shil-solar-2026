const fs = require("fs");

const files = [
  "src/pages/project/Environment.jsx",
  "src/src/pages/project/Environment.jsx"
].filter(fs.existsSync);

for (const file of files) {
  fs.copyFileSync(file, file + ".env-button-inline-force-bak");

  let code = fs.readFileSync(file, "utf8");
  const old = code;

  // اضافه کردن useEffect اگر داخل import نباشد
  code = code.replace(
    /import\s+React\s*,\s*\{([^}]*)\}\s+from\s+["']react["'];/,
    (m, hooks) => {
      if (hooks.includes("useEffect")) return m;
      return `import React, {${hooks.trim() ? hooks + "," : ""} useEffect } from "react";`;
    }
  );

  // اگر import فقط React بود
  code = code.replace(
    /import\s+React\s+from\s+["']react["'];/,
    `import React, { useEffect } from "react";`
  );

  const marker = "SHIL_ENV_CONFIRM_BUTTON_STATIC_EFFECT";

  if (!code.includes(marker)) {
    code = code.replace(
      /(export\s+default\s+function\s+\w+\s*\([^)]*\)\s*\{)/,
      `$1

  // ${marker}
  useEffect(() => {
    const applyEnvConfirmButtonStatic = () => {
      const btn = document.querySelector(".shil-env-confirm-button");
      if (!btn) return;

      btn.style.setProperty("position", "static", "important");
      btn.style.setProperty("left", "auto", "important");
      btn.style.setProperty("right", "auto", "important");
      btn.style.setProperty("top", "auto", "important");
      btn.style.setProperty("bottom", "auto", "important");
      btn.style.setProperty("transform", "none", "important");
      btn.style.setProperty("display", "flex", "important");
      btn.style.setProperty("margin", "12px auto 52px", "important");
      btn.style.setProperty("z-index", "auto", "important");
    };

    applyEnvConfirmButtonStatic();
    const t1 = setTimeout(applyEnvConfirmButtonStatic, 50);
    const t2 = setTimeout(applyEnvConfirmButtonStatic, 250);
    const t3 = setTimeout(applyEnvConfirmButtonStatic, 700);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);
`
    );
  }

  if (code !== old) {
    fs.writeFileSync(file, code, "utf8");
    console.log("✅ Environment button inline force fixed:", file);
  } else {
    console.log("ℹ️ no change:", file);
  }
}

fs.rmSync("node_modules/.vite", { recursive:true, force:true });
fs.rmSync("dist", { recursive:true, force:true });
fs.rmSync("build", { recursive:true, force:true });

console.log("✅ done");
