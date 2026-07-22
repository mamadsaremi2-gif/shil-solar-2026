const fs = require("fs");

const files = [
  "src/app.css",
  "src/src/app.css",
  "src/index.css",
  "src/src/index.css",
  "src/appearance/styles/shil-design-system.css",
  "src/src/appearance/styles/shil-design-system.css"
].filter(fs.existsSync);

for(const file of files){

    fs.copyFileSync(file,file+".bg-backup");

    let css=fs.readFileSync(file,"utf8");

    css=css.replace(
        /background\s*:\s*[^;]*(linear-gradient|radial-gradient)[^;]*;/gi,
        "background:#eef5fb;"
    );

    css=css.replace(
        /background-image\s*:\s*[^;]*(linear-gradient|radial-gradient)[^;]*;/gi,
        "background-image:none;"
    );

    css=css.replace(
        /--shil-main-background-image\s*:[^;]*;/gi,
        "--shil-main-background-image:none;"
    );

    fs.writeFileSync(file,css,"utf8");

    console.log("✔ cleaned:",file);

}

try{fs.rmSync("node_modules/.vite",{recursive:true,force:true});}catch(e){}
try{fs.rmSync("dist",{recursive:true,force:true});}catch(e){}
try{fs.rmSync("build",{recursive:true,force:true});}catch(e){}

console.log("✔ Background gradients removed");
