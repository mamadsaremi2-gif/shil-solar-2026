const fs = require("fs");

const files = [
  "src/appearance/styles/shil-project-layout-inline-fix.js",
  "src/src/appearance/styles/shil-project-layout-inline-fix.js"
].filter(fs.existsSync);

const START = "/* SHIL_ENV_COMPACT_TABLE_LOGIC_START */";
const END = "/* SHIL_ENV_COMPACT_TABLE_LOGIC_END */";

const patch = `
${START}
(function(){
  if (window.__SHIL_ENV_COMPACT_TABLE_LOGIC__) return;
  window.__SHIL_ENV_COMPACT_TABLE_LOGIC__ = true;

  function injectEnvCompactStyle(){
    if (document.getElementById("shil-env-compact-table-final-style")) return;

    const style = document.createElement("style");
    style.id = "shil-env-compact-table-final-style";
    style.textContent = \`
      html body.shil-environment-screen .shil-env-card{
        background:rgba(215,235,255,.35)!important;
        border:1px solid rgba(120,230,255,.85)!important;
        border-radius:18px!important;
        box-shadow:0 8px 22px rgba(0,0,0,.18), inset 0 0 18px rgba(160,235,255,.28)!important;
        padding:8px!important;
        margin:14px 0!important;
        overflow:hidden!important;
      }

      html body.shil-environment-screen .shil-section-title{
        height:34px!important;
        min-height:34px!important;
        margin:0 0 8px!important;
        display:flex!important;
        align-items:center!important;
        justify-content:center!important;
        border-radius:17px!important;
        background:linear-gradient(180deg,#ffffff 0%,#e9ffff 42%,#aeeeff 100%)!important;
        box-shadow:inset 0 3px 8px rgba(255,255,255,.95), inset 0 -6px 10px rgba(0,160,255,.22), 0 4px 12px rgba(0,0,0,.12)!important;
        font-size:11px!important;
        font-weight:900!important;
      }

      html body.shil-environment-screen .shil-compact-summary-card{
        background:transparent!important;
        border:none!important;
        box-shadow:none!important;
        padding:0!important;
        margin:0!important;
      }

      html body.shil-environment-screen .shil-compact-summary-table{
        width:100%!important;
        table-layout:fixed!important;
        border-collapse:collapse!important;
        background:#fff!important;
        border:1px solid #000!important;
        text-align:center!important;
        font-size:11px!important;
      }

      html body.shil-environment-screen .shil-compact-summary-table th,
      html body.shil-environment-screen .shil-compact-summary-table td{
        border:1px solid #000!important;
        padding:4px 3px!important;
        font-size:11px!important;
        font-weight:900!important;
        line-height:1.35!important;
        word-break:break-word!important;
        color:#061421!important;
      }

      html body.shil-environment-screen .shil-compact-summary-table th{
        background:linear-gradient(180deg,#efffff 0%,#c9fbff 100%)!important;
      }

      html body.shil-environment-screen .shil-compact-summary-table td{
        background:linear-gradient(180deg,#ffffff 0%,#f7fdff 100%)!important;
      }

      html body.shil-environment-screen .shil-map-container{
        margin-top:10px!important;
        border-radius:16px!important;
        overflow:hidden!important;
        border:1px solid #000!important;
      }
    \`;

    document.head.appendChild(style);
  }

  function textClean(v){
    return String(v || "").replace(/\\s+/g," ").trim();
  }

  function valueOfBox(box, label){
    const inputs = Array.from(box.querySelectorAll("input, select, textarea"))
      .map(el => el.value || el.placeholder || "")
      .filter(Boolean);

    if (inputs.length) return inputs.join(" / ");

    const strong = box.querySelector("strong");
    if (strong && textClean(strong.innerText)) return textClean(strong.innerText);

    return textClean(box.innerText).replace(label, "").trim() || "-";
  }

  function convertEnvCards(){
    if (!document.body.classList.contains("shil-environment-screen")) return;

    injectEnvCompactStyle();

    document.querySelectorAll(".shil-env-card").forEach(card => {
      if (card.dataset.shilCompactApplied === "1") return;

      const title = card.querySelector(".shil-section-title");
      if (!title) return;

      const boxes = Array.from(card.querySelectorAll(".shil-field, .shil-climate-box"));
      if (!boxes.length) return;

      const rows = boxes.map(box => {
        const label =
          textClean(box.querySelector("label")?.innerText) ||
          textClean(box.querySelector("span")?.innerText) ||
          textClean(box.querySelector("strong")?.innerText) ||
          "مورد";

        return [label, valueOfBox(box, label)];
      });

      let html = '<div class="shil-compact-summary-card"><table class="shil-compact-summary-table"><tbody>';

      for (let i = 0; i < rows.length; i += 4) {
        const group = rows.slice(i, i + 4);
        while (group.length < 4) group.push(["-", "-"]);

        html += "<tr>" + group.map(([label]) => "<th>" + label + "</th>").join("") + "</tr>";
        html += "<tr>" + group.map(([, value]) => "<td>" + value + "</td>").join("") + "</tr>";
      }

      html += "</tbody></table></div>";

      const wrapper = document.createElement("div");
      wrapper.innerHTML = html;

      title.after(wrapper.firstElementChild);

      boxes.forEach(el => {
        el.style.display = "none";
      });

      card.querySelectorAll(".shil-form-grid, .shil-climate-grid").forEach(el => {
        el.style.display = "none";
      });

      card.dataset.shilCompactApplied = "1";
    });
  }

  const observer = new MutationObserver(() => convertEnvCards());
  observer.observe(document.documentElement, { childList:true, subtree:true });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", convertEnvCards);
  } else {
    convertEnvCards();
  }
})();
${END}
`;

for (const file of files) {
  fs.copyFileSync(file, file + ".env-compact-bak");

  let old = fs.readFileSync(file, "utf8");

  const re = new RegExp(
    START.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") +
    "[\\s\\S]*?" +
    END.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
    "g"
  );

  old = old.replace(re, "").trimEnd();

  fs.writeFileSync(file, old + "\n\n" + patch + "\n", "utf8");

  console.log("✅ Environment compact logic applied:", file);
}

fs.rmSync("node_modules/.vite", { recursive:true, force:true });
fs.rmSync("dist", { recursive:true, force:true });
fs.rmSync("build", { recursive:true, force:true });

console.log("✅ Cache cleared");
