const fs = require("fs");

const files = [
  "src/components/ShilFrame.jsx",
  "src/src/components/ShilFrame.jsx"
].filter(fs.existsSync);

const newTitles = `const titles = {
  "/dashboard": "داشبورد",
  "/new-project": "مسیر پروژه",
  "/new-project/info": "اطلاعات پروژه",
  "/new-project/environment": "شرایط محیطی",
  "/new-project/path": "مسیر پروژه",
  "/new-project/method": "روش طراحی",
  "/new-project/inputs": "ورودی محاسبات",
  "/new-project/system": "تنظیمات",
  "/new-project/summary": "چکیده طراحی",
  "/new-project/run": "اجرا",
  "/projects": "پروژه‌ها",
  "/contact": "ارتباط",
  "/feedback": "بازخورد",
  "/assistant": "دستیار",
  "/education": "آموزش",
};`;

for (const file of files) {
  let code = fs.readFileSync(file, "utf8");
  const old = code;

  code = code.replace(/const titles\s*=\s*\{[\s\S]*?\};/, newTitles);

  code = code.replace(
    /const title\s*=\s*[\s\S]*?;\s*const isStepPage/,
    `const title =
    titles[path] ||
    (path.startsWith("/new-project") ? "مسیر پروژه" : "SHIL");

  const isStepPage`
  );

  if (code !== old) {
    fs.copyFileSync(file, file + ".titles-clean-bak");
    fs.writeFileSync(file, code, "utf8");
    console.log("✅ ShilFrame titles fixed:", file);
  }
}

fs.rmSync("node_modules/.vite", { recursive:true, force:true });
fs.rmSync("dist", { recursive:true, force:true });
fs.rmSync("build", { recursive:true, force:true });
