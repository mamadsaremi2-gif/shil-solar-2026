const fs = require("fs");
const path = require("path");

const roots = ["src", "src/src"].filter(fs.existsSync);

const labelsByFile = {
  "ProjectPath.jsx": "تأیید مسیر",
  "ProjectInfo.jsx": "تأیید اطلاعات",
  "Environment.jsx": "تأیید محیط",
  "CalculationMethod.jsx": "تأیید روش",
  "CalculationInputs.jsx": "تأیید توان",
  "SystemSettings.jsx": "تأیید پنل",
  "EmergencySystemSettings.jsx": "تأیید انرژی",
  "UtilitySystemSettings.jsx": "تأیید جریان",
  "SummaryPage.jsx": "تأیید چکیده",
  "RunCalculation.jsx": "تأیید خروجی"
};

const componentCode = `import React from "react";

export default function ShilPrimaryButton({
  label = "تأیید",
  children,
  className = "",
  style,
  ...props
}) {
  const fixedStyle = {
    bottom: "68px",
    height: "46px",
    minHeight: "46px",
    maxHeight: "46px",
    width: "max-content",
    minWidth: "110px",
    maxWidth: "calc(100vw - 32px)",
    padding: "0 18px",
    fontSize: "11px",
    fontWeight: 900,
    lineHeight: 1,
    backgroundImage: "none"
  };

  return (
    <button
      type="button"
      {...props}
      className={["shil-primary-wide", className].filter(Boolean).join(" ")}
      style={{ ...(style || {}), ...fixedStyle }}
    >
      {label || children || "تأیید"}
    </button>
  );
}
`;

function ensureComponent(base){
  const dir = path.join(base, "components", "project");
  fs.mkdirSync(dir, { recursive:true });
  fs.writeFileSync(path.join(dir, "ShilPrimaryButton.jsx"), componentCode, "utf8");
  console.log("✅ component created:", path.join(dir, "ShilPrimaryButton.jsx"));
}

function cleanAttrs(attrs){
  let extraClass = "";

  attrs = attrs.replace(/\s*type=["']button["']/g, "");
  attrs = attrs.replace(/\s*style=\{\{[\s\S]*?\}\}/g, "");
  attrs = attrs.replace(/\s*style=\{[^}]*\}/g, "");

  attrs = attrs.replace(/\s*className=["']([^"']*)["']/g, (_, cls) => {
    extraClass = cls
      .split(/\s+/)
      .filter(x => x && x !== "shil-primary-wide")
      .join(" ");
    return "";
  });

  return { attrs: attrs.trim(), extraClass };
}

function patchFile(file, label){
  let code = fs.readFileSync(file, "utf8");
  const original = code;

  if (!code.includes("shil-primary-wide")) return;

  fs.copyFileSync(file, file + ".primary-component-bak");

  if (!code.includes("ShilPrimaryButton")) {
    code = `import ShilPrimaryButton from "../../components/project/ShilPrimaryButton";\n` + code;
  }

  code = code.replace(
    /<button\b([^>]*className=["'][^"']*shil-primary-wide[^"']*["'][^>]*)>[\s\S]*?<\/button>/g,
    (match, attrs) => {
      const cleaned = cleanAttrs(attrs);
      const classPart = cleaned.extraClass ? ` className="${cleaned.extraClass}"` : "";
      const attrPart = cleaned.attrs ? " " + cleaned.attrs : "";
      return `<ShilPrimaryButton${classPart}${attrPart} label="${label}" />`;
    }
  );

  if (code !== original) {
    fs.writeFileSync(file, code, "utf8");
    console.log("✅ patched:", file, "=>", label);
  }
}

for (const base of roots) {
  ensureComponent(base);

  const projectDir = path.join(base, "pages", "project");
  if (!fs.existsSync(projectDir)) continue;

  for (const [name, label] of Object.entries(labelsByFile)) {
    const file = path.join(projectDir, name);
    if (fs.existsSync(file)) patchFile(file, label);
  }
}

for (const p of ["node_modules/.vite", "dist", "build"]) {
  fs.rmSync(p, { recursive:true, force:true });
}

console.log("✅ done");
