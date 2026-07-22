const fs = require("fs");

const files = [
  "src/appearance/styles/shil-project-layout-inline-fix.js",
  "src/src/appearance/styles/shil-project-layout-inline-fix.js"
].filter(fs.existsSync);

const oldStart = "/* SHIL_PRIMARY_BUTTON_FINAL_START */";
const oldEnd   = "/* SHIL_PRIMARY_BUTTON_FINAL_END */";

const START = "/* SHIL_PRIMARY_BUTTON_SAFE_START */";
const END   = "/* SHIL_PRIMARY_BUTTON_SAFE_END */";

const patch = `
${START}
(function(){
  if (window.__SHIL_PRIMARY_BUTTON_SAFE__) return;
  window.__SHIL_PRIMARY_BUTTON_SAFE__ = true;

  function applyPrimaryButtonSafe(){
    document.querySelectorAll(".shil-primary-wide").forEach(function(btn){
      if (!btn) return;

      btn.textContent = "تأیید اطلاعات";

      btn.querySelectorAll("svg,i,img,span").forEach(function(el){
        el.remove();
      });

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
  }

  function injectPrimaryButtonStyle(){
    if (document.getElementById("shil-primary-button-safe-style")) return;

    const style = document.createElement("style");
    style.id = "shil-primary-button-safe-style";
    style.textContent = \`
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

  function runSafe(){
    injectPrimaryButtonStyle();
    applyPrimaryButtonSafe();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", runSafe);
  } else {
    setTimeout(runSafe, 0);
  }

  window.addEventListener("load", runSafe);
})();
${END}
`;

function esc(s){
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

for (const file of files) {
  fs.copyFileSync(file, file + ".primary-safe-bak");

  let code = fs.readFileSync(file, "utf8");

  code = code.replace(new RegExp(esc(oldStart) + "[\\s\\S]*?" + esc(oldEnd), "g"), "");
  code = code.replace(new RegExp(esc(START) + "[\\s\\S]*?" + esc(END), "g"), "");

  code = code.trimEnd() + "\n\n" + patch + "\n";

  fs.writeFileSync(file, code, "utf8");

  console.log("✅ Safe primary button patch applied:", file);
}

fs.rmSync("node_modules/.vite", { recursive:true, force:true });
fs.rmSync("dist", { recursive:true, force:true });
fs.rmSync("build", { recursive:true, force:true });

console.log("✅ Cache cleared");
