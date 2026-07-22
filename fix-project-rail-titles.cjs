const fs = require("fs");
const path = require("path");

function walk(dir){
  let out=[];
  if(!fs.existsSync(dir)) return out;

  for(const name of fs.readdirSync(dir)){
    const p=path.join(dir,name);
    const s=fs.statSync(p);

    if(s.isDirectory()){
      if(!["node_modules",".git","dist","build"].includes(name)){
        out=out.concat(walk(p));
      }
    }else if(/\.(jsx|tsx|js|ts)$/.test(name)){
      out.push(p);
    }
  }

  return out;
}

const replacements = {
  "انتخاب مسیر پروژه": "مسیر پروژه",
  "روش محاسبات": "روش طراحی",
  "تنظیمات سیستم": "تنظیمات",
  "چکیده اطلاعات": "چکیده طراحی",
  "اجرای محاسبات": "اجرا"
};

let changed = 0;

for(const file of walk("src")){
  let code = fs.readFileSync(file,"utf8");
  const old = code;

  for(const [from,to] of Object.entries(replacements)){
    code = code.split(from).join(to);
  }

  if(code !== old){
    fs.copyFileSync(file, file + ".rail-title-bak");
    fs.writeFileSync(file, code, "utf8");
    console.log("✅ rail title fixed:", file);
    changed++;
  }
}

console.log("changed files:", changed);

fs.rmSync("node_modules/.vite",{recursive:true,force:true});
fs.rmSync("dist",{recursive:true,force:true});
fs.rmSync("build",{recursive:true,force:true});
