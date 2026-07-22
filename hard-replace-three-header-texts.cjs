const fs = require("fs");
const path = require("path");

function walk(dir){
  let out=[];
  if(!fs.existsSync(dir)) return out;

  for(const name of fs.readdirSync(dir)){
    const p=path.join(dir,name);
    const s=fs.statSync(p);

    if(s.isDirectory()){
      if(!["node_modules",".git","dist","build","_backup_before_patch"].includes(name)){
        out=out.concat(walk(p));
      }
    }else if(/\.(jsx|tsx|js|ts|css|html)$/.test(name)){
      out.push(p);
    }
  }
  return out;
}

const replacements = {
  "چکیده طراحی سیستم خورشیدی": "چکیده طراحی",
  "روش محاسبات اجرای پروژه با پنل خورشیدی": "روش طراحی",
  "تنظیمات سیستم خورشیدی": "تنظیمات"
};

const files = walk("src");
let changed = 0;

for(const file of files){
  let code = fs.readFileSync(file,"utf8");
  const old = code;

  for(const [from,to] of Object.entries(replacements)){
    code = code.split(from).join(to);
  }

  if(code !== old){
    fs.copyFileSync(file, file + ".header-text-hard-replace-bak");
    fs.writeFileSync(file, code, "utf8");
    console.log("✅ replaced:", file);
    changed++;
  }
}

console.log("changed files:", changed);

fs.rmSync("node_modules/.vite",{recursive:true,force:true});
fs.rmSync("dist",{recursive:true,force:true});
fs.rmSync("build",{recursive:true,force:true});
