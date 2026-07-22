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

const files = walk("src");
let changed = 0;

for(const file of files){
  let code = fs.readFileSync(file,"utf8");
  const old = code;

  code = code.replaceAll("تأیید مرحله و ورود به شرایط محیطی", "تأیید اطلاعات");
  code = code.replaceAll("تایید مرحله و ورود به شرایط محیطی", "تأیید اطلاعات");

  code = code.replace(
    /(<button[^>]*>)(\s*)تأیید اطلاعات(\s*)(<\/button>)/g,
    `$1تأیید اطلاعات$4`
  );

  if(code !== old){
    fs.copyFileSync(file, file + ".confirm-info-bak");
    fs.writeFileSync(file, code, "utf8");
    console.log("✅ fixed:", file);
    changed++;
  }
}

console.log("changed files:", changed);

fs.rmSync("node_modules/.vite",{recursive:true,force:true});
fs.rmSync("dist",{recursive:true,force:true});
fs.rmSync("build",{recursive:true,force:true});
