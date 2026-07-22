const fs = require("fs");

const files = [
  "src/appearance/styles/shil-project-layout-inline-fix.js",
  "src/src/appearance/styles/shil-project-layout-inline-fix.js"
].filter(fs.existsSync);

const START="/* SHIL_PRIMARY_BUTTON_FINAL_START */";
const END="/* SHIL_PRIMARY_BUTTON_FINAL_END */";

const patch=`
${START}

(function(){

if(window.__SHIL_PRIMARY_BUTTON_FINAL__) return;
window.__SHIL_PRIMARY_BUTTON_FINAL__=true;

function apply(){

document.querySelectorAll(".shil-primary-wide").forEach(btn=>{

    btn.textContent="تأیید اطلاعات";

    btn.querySelectorAll("svg,i,img,span").forEach(x=>x.remove());

    btn.style.setProperty("bottom","68px","important");
    btn.style.setProperty("height","46px","important");
    btn.style.setProperty("min-height","46px","important");
    btn.style.setProperty("max-height","46px","important");
    btn.style.setProperty("width","max-content","important");
    btn.style.setProperty("min-width","110px","important");
    btn.style.setProperty("padding","0 18px","important");
    btn.style.setProperty("font-size","11px","important");
    btn.style.setProperty("font-weight","900","important");
    btn.style.setProperty("background-image","none","important");

});

if(document.getElementById("shil-primary-button-final-style")) return;

const style=document.createElement("style");

style.id="shil-primary-button-final-style";

style.textContent=\`

.shil-primary-wide{

bottom:68px!important;
height:46px!important;
min-height:46px!important;
max-height:46px!important;

width:max-content!important;
min-width:110px!important;

padding:0 18px!important;

font-size:11px!important;
font-weight:900!important;

}

.shil-primary-wide::before,
.shil-primary-wide::after{

content:none!important;
display:none!important;
background:none!important;

}

\`;

document.head.appendChild(style);

}

new MutationObserver(apply)
.observe(document.documentElement,{
childList:true,
subtree:true
});

if(document.readyState==="loading")
document.addEventListener("DOMContentLoaded",apply);
else
apply();

})();

${END}
`;

for(const file of files){

    fs.copyFileSync(file,file+".primary-button-bak");

    let old=fs.readFileSync(file,"utf8");

    const re=new RegExp(
        START.replace(/[.*+?^${}()|[\]\\]/g,"\\\\$&")+
        "[\\\\s\\\\S]*?"+
        END.replace(/[.*+?^${}()|[\]\\]/g,"\\\\$&"),
        "g"
    );

    old=old.replace(re,"").trimEnd();

    fs.writeFileSync(file,old+"\n\n"+patch+"\n","utf8");

    console.log("✔ Updated:",file);

}

try{fs.rmSync("node_modules/.vite",{recursive:true,force:true});}catch(e){}
try{fs.rmSync("dist",{recursive:true,force:true});}catch(e){}
try{fs.rmSync("build",{recursive:true,force:true});}catch(e){}

console.log("✔ Cache Cleared");

