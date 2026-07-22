const fs = require("fs");
const path = require("path");
const cp = require("child_process");

const root = process.cwd();
const src = path.join(root, "src");

if (!fs.existsSync(src)) {
  console.error("❌ پوشه src پیدا نشد. این دستور را در ریشه پروژه اجرا کن.");
  process.exit(1);
}

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupDir = path.join(root, "_backup_equipment_bank_" + stamp);
fs.mkdirSync(backupDir, { recursive: true });

function walk(dir) {
  let out = [];
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    const s = fs.statSync(p);
    if (s.isDirectory()) {
      if (!["node_modules", "dist", "build", ".git"].includes(f)) out = out.concat(walk(p));
    } else if (/\.(jsx|tsx|js|ts|css)$/.test(f)) {
      out.push(p);
    }
  }
  return out;
}

const files = walk(src);
const bankFiles = files.filter(f => {
  const t = fs.readFileSync(f, "utf8");
  return t.includes("بانک پنل خورشیدی") || t.includes("بانک اینورتر خورشیدی") || t.includes("بانک ذخیره‌ساز انرژی");
});

console.log("✅ فایل‌های مرتبط پیدا شد:");
bankFiles.forEach(f => console.log(" - " + path.relative(root, f)));

const compDir = path.join(src, "components", "equipment-bank");
fs.mkdirSync(compDir, { recursive: true });

fs.writeFileSync(path.join(compDir, "EquipmentBankCard.jsx"), `
import React, { useState } from "react";
import "./EquipmentBankCard.css";

export default function EquipmentBankCard({
  title,
  itemLabel,
  qtyLabel,
  sheetLabel,
  value,
  qty,
  children,
  onDatasheetClick
}) {
  const [open, setOpen] = useState(false);

  return (
    <section className="eq-bank-card">
      <div className="eq-bank-title">{title}</div>

      <table className="eq-bank-table">
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
              <button className="eq-bank-chip" type="button" onClick={() => setOpen(!open)}>
                {open ? "▲ بستن" : "▼ نمایش"}
              </button>
            </td>

            <td>{value}</td>
            <td>{qty}</td>

            <td>
              <button className="eq-bank-sheet" type="button" onClick={onDatasheetClick}>
                📄 مشاهده
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <div className={open ? "eq-bank-details open" : "eq-bank-details"}>
        {children}
      </div>
    </section>
  );
}
`, "utf8");

fs.writeFileSync(path.join(compDir, "EquipmentBankCard.css"), `
.eq-bank-card{
  direction:rtl;
  width:100%;
  margin:12px 0;
  padding:0;
  background:transparent;
  box-shadow:none;
  border:none;
  font-family:inherit;
}

.eq-bank-title{
  margin:0 0 8px;
  height:36px;
  display:flex;
  align-items:center;
  justify-content:center;
  border-radius:18px;
  background:linear-gradient(180deg,#f8ffff 0%,#dffaff 45%,#a9ecff 100%);
  box-shadow:inset 0 3px 7px rgba(255,255,255,.95), inset 0 -5px 10px rgba(0,170,255,.25);
  color:#061421;
  font-size:14px;
  font-weight:900;
}

.eq-bank-table{
  width:100%;
  table-layout:fixed;
  border-collapse:collapse;
  background:white;
  border:1px solid #9eefff;
  border-radius:12px;
  overflow:hidden;
  color:#061421;
  text-align:center;
  font-size:12px;
  box-shadow:0 4px 12px rgba(0,0,0,.10);
}

.eq-bank-table th{
  background:linear-gradient(180deg,#eaffff 0%,#c7fbff 100%);
  color:#061421;
  font-size:12px;
  font-weight:900;
  height:32px;
  padding:4px 3px;
  border:1px solid #9eefff;
  line-height:1.4;
}

.eq-bank-table td{
  background:#fff;
  color:#061421;
  font-size:12px;
  font-weight:900;
  height:36px;
  padding:4px 3px;
  border:1px solid #d9f7ff;
  line-height:1.4;
  word-break:break-word;
}

.eq-bank-chip,
.eq-bank-sheet{
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

.eq-bank-details{
  max-height:0;
  opacity:0;
  overflow:hidden;
  transition:max-height 250ms ease, opacity 250ms ease, margin-top 250ms ease;
  margin-top:0;
}

.eq-bank-details.open{
  max-height:700px;
  opacity:1;
  margin-top:8px;
  overflow:auto;
}
`, "utf8");

const target = bankFiles[0];

if (!target) {
  console.log("⚠️ کامپوننت ساخته شد ولی فایل بانک‌ها پیدا نشد.");
  process.exit(0);
}

const relTarget = path.relative(root, target);
fs.copyFileSync(target, path.join(backupDir, path.basename(target)));

let code = fs.readFileSync(target, "utf8");

if (!code.includes("EquipmentBankCard")) {
  code = `import EquipmentBankCard from "./components/equipment-bank/EquipmentBankCard";\n` + code;
}

fs.writeFileSync(target, code, "utf8");

console.log("✅ کامپوننت جدید ساخته شد:");
console.log("src/components/equipment-bank/EquipmentBankCard.jsx");
console.log("src/components/equipment-bank/EquipmentBankCard.css");

console.log("⚠️ فایل اصلی پیدا شد و بکاپ گرفته شد:");
console.log(relTarget);

console.log("📌 حالا داخل این فایل، هر بلوک بانک قدیمی را با EquipmentBankCard جایگزین کن.");
console.log("📁 بکاپ:", backupDir);

try {
  fs.rmSync(path.join(root, "node_modules", ".vite"), { recursive:true, force:true });
  fs.rmSync(path.join(root, "dist"), { recursive:true, force:true });
  fs.rmSync(path.join(root, "build"), { recursive:true, force:true });
  console.log("✅ کش پاک شد.");
} catch(e){}

const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const runCmd = pkg.scripts?.dev ? "npm run dev" : pkg.scripts?.start ? "npm start" : null;

if (runCmd) {
  console.log("🚀 اجرای پروژه:", runCmd);
  cp.execSync(runCmd, { stdio:"inherit", shell:true });
} else {
  console.log("⚠️ اسکریپت dev/start در package.json پیدا نشد.");
}
