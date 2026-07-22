const fs = require("fs");

const targets = [
  "src/pages/project/SystemSettings.jsx",
  "src/src/pages/project/SystemSettings.jsx"
].filter(fs.existsSync);

if (!targets.length) {
  console.log("❌ SystemSettings.jsx پیدا نشد");
  process.exit(1);
}

const newFn = `function BankSelectCard({ title, subtitle, items, value, onChange, smartTitle, smartValue, selectedItem, detailRows = [], disabled = false, kind = "equipment" }) {
  const [open, setOpen] = useState(false);
  const activeItem = selectedItem || items.find((item) => item.id === value) || null;

  const itemLabel =
    kind === "panel" ? "پنل هوشمند" :
    kind === "inverter" ? "اینورتر هوشمند" :
    kind === "battery" ? "باتری هوشمند" :
    "تجهیز هوشمند";

  const qtyLabel =
    kind === "panel" ? "تعداد پنل هوشمند" :
    kind === "inverter" ? "تعداد اینورتر هوشمند" :
    kind === "battery" ? "تعداد باتری هوشمند" :
    "تعداد";

  const sheetLabel =
    kind === "panel" ? "دیتاشیت پنل هوشمند" :
    kind === "inverter" ? "دیتاشیت اینورتر هوشمند" :
    kind === "battery" ? "دیتاشیت باتری هوشمند" :
    "دیتاشیت";

  const qtyValue = String(smartValue || "").split("/")[0].trim() || "-";

  return <section className={\`shil-equipment-bank-card \${disabled ? "is-locked" : ""}\`}>
    <div className="shil-equipment-bank-title">{title}</div>

    <table className="shil-equipment-bank-table">
      <thead>
        <tr>
          <th>انتخاب</th>
          <th>{itemLabel}</th>
          <th>{qtyLabel}</th>
          <th>{sheetLabel}</th>
        </tr>
      </thead>

      <tbody>
        <tr>
          <td>
            <button type="button" className="shil-equipment-bank-chip" onClick={() => setOpen((v) => !v)} disabled={disabled}>
              {open ? "▲ بستن" : "▼ نمایش"}
            </button>
          </td>
          <td>{compactEquipmentLabel(activeItem, kind)}</td>
          <td>{qtyValue}</td>
          <td>
            <button type="button" className="shil-equipment-bank-sheet" onClick={() => setOpen(true)}>
              📄 مشاهده
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <div className={open ? "shil-equipment-bank-details open" : "shil-equipment-bank-details"}>
      <div className="shil-equipment-bank-old-content">
        <select value={value || activeItem?.id || ""} onChange={(event) => onChange(event.target.value)} disabled={disabled}>
          {items.map((item) => <option key={item.id} value={item.id}>{compactEquipmentLabel(item, kind)}</option>)}
        </select>

        <div className="shil-bank-smart-note">
          <span>پیشنهاد هوشمند</span>
          <strong>{smartTitle}</strong>
          <small>{smartValue}</small>
        </div>

        <div className="shil-summary-grid shil-bank-datasheet-grid">
          {detailRows.filter(Boolean).map(([label, val]) => <div key={label}><span>{label}</span><strong>{val || "-"}</strong></div>)}
        </div>
      </div>
    </div>
  </section>;
}
`;

for (const file of targets) {
  fs.copyFileSync(file, file + ".bak");

  let code = fs.readFileSync(file, "utf8");
  const start = code.indexOf("function BankSelectCard");
  const end = code.indexOf("export default function SystemSettings");

  if (start === -1 || end === -1) {
    console.log("❌ محل تابع پیدا نشد:", file);
    continue;
  }

  code = code.slice(0, start) + newFn + "\n\n" + code.slice(end);
  fs.writeFileSync(file, code, "utf8");
  console.log("✅ تابع جایگزین شد:", file);
}

const cssTargets = [
  "src/appearance/styles/shil-project-clean-pages.css",
  "src/src/appearance/styles/shil-project-clean-pages.css",
  "src/index.css",
  "src/src/index.css"
].filter(fs.existsSync);

const markerStart = "/* EQUIPMENT_BANK_COMPACT_START */";
const markerEnd = "/* EQUIPMENT_BANK_COMPACT_END */";

const css = `
${markerStart}
.shil-equipment-bank-card{
  direction:rtl;
  width:100%;
  margin:12px 0;
  padding:0;
  background:transparent;
  border:none;
  box-shadow:none;
  font-family:inherit;
}

.shil-equipment-bank-title{
  height:36px;
  margin:0 0 8px;
  display:flex;
  align-items:center;
  justify-content:center;
  text-align:center;
  border-radius:18px;
  background:linear-gradient(180deg,#f8ffff 0%,#dffaff 45%,#a9ecff 100%);
  box-shadow:inset 0 3px 7px rgba(255,255,255,.95), inset 0 -5px 10px rgba(0,170,255,.25);
  color:#061421;
  font-size:14px;
  font-weight:900;
}

.shil-equipment-bank-table{
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

.shil-equipment-bank-table th{
  background:linear-gradient(180deg,#eaffff 0%,#c7fbff 100%);
  font-size:12px;
  font-weight:900;
  height:32px;
  padding:4px 3px;
  border:1px solid #9eefff;
}

.shil-equipment-bank-table td{
  background:#fff;
  font-size:12px;
  font-weight:900;
  height:36px;
  padding:4px 3px;
  border:1px solid #d9f7ff;
  word-break:break-word;
}

.shil-equipment-bank-chip,
.shil-equipment-bank-sheet{
  padding:4px 8px;
  border-radius:10px;
  border:1px solid #9eefff;
  background:#f8feff;
  color:#061421;
  font-size:12px;
  font-weight:900;
  font-family:inherit;
  cursor:pointer;
}

.shil-equipment-bank-details{
  max-height:0;
  opacity:0;
  overflow:hidden;
  transition:max-height 250ms ease, opacity 250ms ease, margin-top 250ms ease;
  margin-top:0;
}

.shil-equipment-bank-details.open{
  max-height:700px;
  opacity:1;
  margin-top:8px;
  overflow:auto;
}

.shil-equipment-bank-old-content{
  padding:8px;
  border-radius:12px;
  background:rgba(255,255,255,.88);
}
${markerEnd}
`;

for (const file of cssTargets) {
  let old = fs.readFileSync(file, "utf8");
  const re = new RegExp(`${markerStart}[\\s\\S]*?${markerEnd}`, "g");
  old = old.replace(re, "").trimEnd();
  fs.writeFileSync(file, old + "\n\n" + css, "utf8");
  console.log("✅ CSS اضافه/آپدیت شد:", file);
}

fs.rmSync("node_modules/.vite", { recursive:true, force:true });
fs.rmSync("dist", { recursive:true, force:true });
fs.rmSync("build", { recursive:true, force:true });

console.log("✅ کش پاک شد");
console.log("✅ تمام شد. حالا اجرا کن: npm run dev");
