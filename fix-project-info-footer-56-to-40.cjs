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
    }else if(/\.(css|js)$/.test(name)){
      out.push(p);
    }
  }
  return out;
}

const files = walk("src");
let changed=0;

for(const file of files){
  let code=fs.readFileSync(file,"utf8");
  const old=code;

  if(code.includes("shil-project-info-screen") && code.includes("shil-fixed-footer")){
    code = code.replace(
      /(body\.shil-project-info-screen[\s\S]{0,260}?(?:\.shil-fixed-footer|footer)[\s\S]{0,260}?height\s*:\s*)56px\s*!important/g,
      "$140px !important"
    );

    code = code.replace(
      /(body\.shil-project-info-screen[\s\S]{0,260}?(?:\.shil-fixed-footer|footer)[\s\S]{0,260}?min-height\s*:\s*)56px\s*!important/g,
      "$140px !important"
    );

    code = code.replace(
      /(body\.shil-project-info-screen[\s\S]{0,260}?(?:\.shil-fixed-footer|footer)[\s\S]{0,260}?max-height\s*:\s*)56px\s*!important/g,
      "$140px !important"
    );
  }

  if(code !== old){
    fs.copyFileSync(file,file+".project-info-footer-56-to-40-bak");
    fs.writeFileSync(file,code,"utf8");
    console.log("✅ fixed:",file);
    changed++;
  }
}

console.log("changed files:",changed);

fs.rmSync("node_modules/.vite",{recursive:true,force:true});
fs.rmSync("dist",{recursive:true,force:true});
fs.rmSync("build",{recursive:true,force:true});
