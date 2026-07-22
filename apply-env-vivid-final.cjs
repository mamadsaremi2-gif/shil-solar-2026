const fs = require("fs");

const files = [
  "src/appearance/styles/shil-project-clean-pages.css",
  "src/src/appearance/styles/shil-project-clean-pages.css",
  "src/index.css",
  "src/src/index.css"
].filter(fs.existsSync);

const START = "/* SHIL_ENVIRONMENT_VIVID_FINAL_START */";
const END   = "/* SHIL_ENVIRONMENT_VIVID_FINAL_END */";

const css = `
${START}

/* ===== SHIL Environment Final UI ===== */

html body.shil-environment-screen .shil-env-page{
    display:flex;
    flex-direction:column;
    gap:14px;
}

html body.shil-environment-screen .shil-env-card{
    background:rgba(215,235,255,.35)!important;
    border:1px solid rgba(120,230,255,.85)!important;
    border-radius:18px!important;
    box-shadow:
        0 8px 22px rgba(0,0,0,.18),
        inset 0 0 18px rgba(160,235,255,.28)!important;
    padding:10px!important;
}

html body.shil-environment-screen .shil-section-title{
    display:flex!important;
    align-items:center!important;
    justify-content:center!important;
    height:34px!important;
    margin:0 0 10px!important;
    border-radius:17px!important;

    background:
        linear-gradient(
            180deg,
            #ffffff 0%,
            #e9ffff 42%,
            #aeeeff 100%
        )!important;

    box-shadow:
        inset 0 3px 8px rgba(255,255,255,.95),
        inset 0 -6px 10px rgba(0,160,255,.22),
        0 4px 12px rgba(0,0,0,.12)!important;

    font-size:13px!important;
    font-weight:900!important;
}

html body.shil-environment-screen .shil-form-grid{
    display:grid!important;
    grid-template-columns:repeat(2,minmax(0,1fr));
    gap:10px!important;
}

html body.shil-environment-screen .shil-field{

    background:
        linear-gradient(
            180deg,
            #ffffff 0%,
            #f7fdff 100%
        )!important;

    border:1px solid #9eefff!important;

    border-radius:14px!important;

    box-shadow:
        0 5px 14px rgba(0,0,0,.10),
        inset 0 0 12px rgba(110,230,255,.14)!important;

    padding:8px!important;
}

html body.shil-environment-screen .shil-field label{
    font-size:11px!important;
    font-weight:800!important;
}

html body.shil-environment-screen .shil-field input,
html body.shil-environment-screen .shil-field select,
html body.shil-environment-screen textarea{
    font-size:12px!important;
}

html body.shil-environment-screen .shil-map-container{

    border-radius:16px!important;
    overflow:hidden!important;

    border:1px solid #8fe7ff!important;

    box-shadow:
        0 8px 20px rgba(0,0,0,.12)!important;
}

html body.shil-environment-screen .shil-climate-grid{
    display:grid!important;
    grid-template-columns:repeat(2,minmax(0,1fr));
    gap:10px!important;
}

html body.shil-environment-screen .shil-climate-box{

    background:
        linear-gradient(
            180deg,
            #ffffff 0%,
            #f7fdff 100%
        )!important;

    border:1px solid #9eefff!important;

    border-radius:14px!important;

    box-shadow:
        0 5px 14px rgba(0,0,0,.10),
        inset 0 0 12px rgba(110,230,255,.14)!important;

    padding:8px!important;

    font-size:12px!important;
}

html body.shil-environment-screen .shil-primary-wide{

    margin-top:8px!important;

    height:44px!important;

    border-radius:14px!important;
}

/* ===== END ===== */

${END}
`;

for(const file of files){

    fs.copyFileSync(file,file+".env-vivid-bak");

    let content=fs.readFileSync(file,"utf8");

    const re=new RegExp(
        START.replace(/[.*+?^${}()|[\]\\]/g,"\\\\$&")
        +"[\\\\s\\\\S]*?"
        +END.replace(/[.*+?^${}()|[\]\\]/g,"\\\\$&"),
        "g"
    );

    content=content.replace(re,"").trimEnd();

    content+="\n\n"+css+"\n";

    fs.writeFileSync(file,content,"utf8");

    console.log("✔ Updated:",file);
}

["node_modules/.vite","dist","build"].forEach(p=>{
    try{
        fs.rmSync(p,{recursive:true,force:true});
    }catch(e){}
});

console.log("✔ Cache Cleared");
