const fs = require("fs");

const targets = [
  "src/pages/project/SystemSettings.jsx",
  "src/src/pages/project/SystemSettings.jsx"
].filter(fs.existsSync);

if (!targets.length) {
  console.log("❌ SystemSettings.jsx پیدا نشد");
  process.exit(1);
}

const newSummaryGrid = `function SummaryGrid({ rows = [] }) {
  const [open, setOpen] = useState(false);
  const cleanRows = rows.filter(Boolean);

  const mainRows = [
    ["توان مصرفی", cleanRows.find(([label]) => label.includes("توان مصرفی"))?.[1] || "0 kW"],
    ["انرژی روزانه", cleanRows.find(([label]) => label.includes("انرژی روزانه"))?.[1] || "0 kWh/day"],
    ["توان آرایه", cleanRows.find(([label]) => label.includes("توان کل پنل"))?.[1] || cleanRows.find(([label]) => label.includes("توان مبنای آرایه"))?.[1] || "0 kW"],
    ["توان اینورتر", cleanRows.find(([label]) => label.includes("توان مبنای انتخاب اینورتر"))?.[1] || "0 kW"],
    ["پنل", cleanRows.find(([label]) => label.includes("پنل معرفی"))?.[1] || "-"],
    ["اینورتر", cleanRows.find(([label]) => label.includes("اینورتر معرفی"))?.[1] || "-"],
    ["باتری", cleanRows.find(([label]) => label.includes("باتری معرفی"))?.[1] || "-"],
    ["استرینگ", cleanRows.find(([label]) => label.includes("استرینگ"))?.[1] || "-"],
  ];

  return <div className="shil-summary-table-card">
    <table className="shil-summary-table">
      <tbody>
        <tr>
          {mainRows.slice(0, 4).map(([label]) => <th key={label}>{label}</th>)}
        </tr>
        <tr>
          {mainRows.slice(0, 4).map(([label, value]) => <td key={label}>{value || "-"}</td>)}
        </tr>
        <tr>
          {mainRows.slice(4, 8).map(([label]) => <th key={label}>{label}</th>)}
        </tr>
        <tr>
          {mainRows.slice(4, 8).map(([label, value]) => <td key={label}>{value || "-"}</td>)}
        </tr>
      </tbody>
    </table>

    <button type="button" className="shil-summary-detail-chip" onClick={() => setOpen((v) => !v)}>
      {open ? "▲ بستن جزئیات" : "▼ مشاهده جزئیات محاسبات"}
    </button>

    <div className={open ? "shil-summary-details open" : "shil-summary-details"}>
      <div className="shil-summary-details-grid">
        {cleanRows.map(([label, value]) => (
          <div key={label} className="shil-summary-detail-item">
            <span>{label}</span>
            <strong>{value || "-"}</strong>
          </div>
        ))}
      </div>
    </div>
  </div>;
}
`;

for (const file of targets) {
  fs.copyFileSync(file, file + ".bak");

  let code = fs.readFileSync(file, "utf8");

  const start = code.indexOf("function SummaryGrid");
  const end = code.indexOf("function MethodSummaryCard");

  if (start === -1 || end === -1) {
    console.log("❌ محل SummaryGrid پیدا نشد:", file);
    continue;
  }

  code = code.slice(0, start) + newSummaryGrid + "\n\n" + code.slice(end);
  fs.writeFileSync(file, code, "utf8");

  console.log("✅ SummaryGrid جایگزین شد:", file);
}

const cssTargets = [
  "src/appearance/styles/shil-project-clean-pages.css",
  "src/src/appearance/styles/shil-project-clean-pages.css",
  "src/index.css",
  "src/src/index.css"
].filter(fs.existsSync);

const markerStart = "/* SUMMARY_TABLE_COMPACT_START */";
const markerEnd = "/* SUMMARY_TABLE_COMPACT_END */";

const css = `
${markerStart}
.shil-summary-table-card{
  direction:rtl;
  width:100%;
  margin:10px 0;
  padding:0;
  background:transparent;
  border:none;
  box-shadow:none;
}

.shil-summary-table{
  width:100%;
  table-layout:fixed;
  border-collapse:collapse;
  background:#fff;
  border:1px solid #9eefff;
  color:#061421;
  text-align:center;
  font-size:12px;
  box-shadow:0 4px 12px rgba(0,0,0,.10);
}

.shil-summary-table th{
  background:linear-gradient(180deg,#eaffff 0%,#c7fbff 100%);
  font-size:12px;
  font-weight:900;
  height:32px;
  padding:4px 3px;
  border:1px solid #9eefff;
  line-height:1.35;
}

.shil-summary-table td{
  background:#fff;
  font-size:12px;
  font-weight:900;
  height:36px;
  padding:4px 3px;
  border:1px solid #d9f7ff;
  line-height:1.35;
  word-break:break-word;
}

.shil-summary-detail-chip{
  display:block;
  margin:8px auto 0;
  padding:4px 10px;
  border-radius:10px;
  border:1px solid #9eefff;
  background:#f8feff;
  color:#061421;
  font-size:12px;
  font-weight:900;
  font-family:inherit;
  cursor:pointer;
}

.shil-summary-details{
  max-height:0;
  opacity:0;
  overflow:hidden;
  transition:max-height 250ms ease, opacity 250ms ease, margin-top 250ms ease;
  margin-top:0;
}

.shil-summary-details.open{
  max-height:700px;
  opacity:1;
  margin-top:8px;
  overflow:auto;
}

.shil-summary-details-grid{
  display:grid;
  grid-template-columns:repeat(2,1fr);
  gap:6px;
}

.shil-summary-detail-item{
  padding:6px;
  border:1px solid #d9f7ff;
  border-radius:10px;
  background:rgba(255,255,255,.88);
  font-size:12px;
  text-align:center;
}

.shil-summary-detail-item span{
  display:block;
  font-size:11px;
  font-weight:800;
}

.shil-summary-detail-item strong{
  display:block;
  font-size:12px;
  font-weight:900;
}
${markerEnd}
`;

for (const file of cssTargets) {
  let old = fs.readFileSync(file, "utf8");
  const re = new RegExp(`${markerStart}[\\s\\S]*?${markerEnd}`, "g");
  old = old.replace(re, "").trimEnd();
  fs.writeFileSync(file, old + "\n\n" + css, "utf8");
  console.log("✅ CSS خلاصه اضافه/آپدیت شد:", file);
}

fs.rmSync("node_modules/.vite", { recursive:true, force:true });
fs.rmSync("dist", { recursive:true, force:true });
fs.rmSync("build", { recursive:true, force:true });

console.log("✅ انجام شد. حالا اجرا کن: npm run dev");
