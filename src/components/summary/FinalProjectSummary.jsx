import React, { useMemo, useState } from "react";

const toEnglishDigits = (value) => String(value ?? "")
  .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
  .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));

const num = (value, digits = 0) => {
  const n = Number(value || 0);
  if (!Number.isFinite(n)) return "0";
  return toEnglishDigits(n.toLocaleString("en-US", { maximumFractionDigits: digits }));
};

const kw = (w) => `${num(Math.round(Number(w || 0) / 10) / 100, 2)} kW`;
const kwh = (v) => `${num(Number(v || 0), 2)} kWh`;

function readJson(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function compactEquipmentLabel(item, kind) {
  if (!item) return "-";
  if (kind === "panel") return `${num(item.powerW || item.ratedPowerW)}W`;
  if (kind === "inverter") {
    const power = item.ratedPowerW || item.powerW || item.outputPowerW;
    return `${kw(power)}${item.type ? ` / ${item.type}` : ""}`.trim();
  }
  if (kind === "battery") {
    const voltage = item.nominalVoltage || item.voltageV;
    const capacity = item.capacityAh;
    return `${num(voltage, 1)}V ${num(capacity)}Ah`;
  }
  return item.name || item.title || item.model || item.id || "-";
}

function pick(...values) {
  return values.find((v) => v !== undefined && v !== null && v !== "") ?? "-";
}

function normalizeData(props) {
  const fromProps = props?.design || props?.designResult || props?.summary || null;
  const fromSolar = readJson("shil:solarSystemDesign");
  const fromDraft = readJson("shil:systemSettingsDraft");
  const fromCentral = readJson("shil:projectDesignState");

  const design = fromProps || fromSolar || fromDraft?.designResult || fromCentral?.design || fromCentral?.designResult || {};
  const handoff = props?.handoff || fromDraft?.handoff || fromCentral?.handoff || {};
  const load = design.load || handoff.normalizedLoad || handoff.load || {};
  const pvArray = design.pvArray || design.pv || {};
  const inverter = design.inverter || {};
  const battery = design.battery || {};

  return { design, handoff, load, pvArray, inverter, battery };
}

function SummaryTableCard({ title, badge, rows = [], details = [], defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const safeRows = rows.filter(Boolean);
  const normalizedRows = [...safeRows];

  while (normalizedRows.length % 4 !== 0) normalizedRows.push(["-", "-"]);

  const rowGroups = [];
  for (let i = 0; i < normalizedRows.length; i += 4) {
    rowGroups.push(normalizedRows.slice(i, i + 4));
  }

  return (
    <section className="shil-final-compact-card">
      <div className="shil-final-compact-title">
        <h2>{title}</h2>
        {badge ? <span>{badge}</span> : null}
      </div>

      <table className="shil-final-compact-table">
        <tbody>
          {rowGroups.map((group, index) => (
            <React.Fragment key={index}>
              <tr>{group.map(([label]) => <th key={label}>{label}</th>)}</tr>
              <tr>{group.map(([label, value]) => <td key={label}>{value || "-"}</td>)}</tr>
            </React.Fragment>
          ))}
        </tbody>
      </table>

      {details.length ? (
        <>
          <button type="button" className="shil-final-detail-chip" onClick={() => setOpen((v) => !v)}>
            {open ? "▲ بستن جزئیات" : "▼ مشاهده جزئیات"}
          </button>

          <div className={open ? "shil-final-details open" : "shil-final-details"}>
            <div className="shil-final-details-grid">
              {details.filter(Boolean).map(([label, value]) => (
                <div key={label} className="shil-final-detail-item">
                  <span>{label}</span>
                  <strong>{value || "-"}</strong>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}

export default function FinalProjectSummary(props) {
  const { design, handoff, load, pvArray, inverter, battery } = useMemo(() => normalizeData(props), [props]);

  const method = pick(handoff?.source?.method, design?.source?.method, "equipment");
  const systemType = pick(design?.system?.type, design?.systemType, design?.system?.scenario, "solar");
  const valid = pick(design?.valid, design?.validation?.valid, props?.valid, true);
  const warnings = Array.isArray(design?.warnings) ? design.warnings : [];

  const panelItem = design?.panel || pvArray?.panel || null;
  const inverterItem = inverter?.item || inverter || null;
  const batteryItem = battery?.item || design?.batteryItem || null;

  const panelCount = pick(pvArray?.panelCount, design?.panelCount, 0);
  const inverterCount = pick(inverter?.count, design?.inverterCount, 1);
  const batteryCount = pick(battery?.count, design?.batteryCount, 0);

  const summaryRows = [
    ["توان مصرفی", kw(pick(load?.basePowerW, load?.totalPowerW, load?.peakPowerW, 0))],
    ["انرژی روزانه", `${num(pick(load?.finalEnergyKWh, load?.dailyEnergyKWh, load?.totalEnergyKWh, 0), 2)} kWh/day`],
    ["توان آرایه", kw(pick(pvArray?.arrayPowerW, pvArray?.baseRequiredPowerW, 0))],
    ["توان اینورتر", kw((Number(inverter?.ratedPowerW || inverter?.powerW || 0)) * Number(inverterCount || 1))],
    ["پنل", `${compactEquipmentLabel(panelItem, "panel")} / ${num(panelCount)} عدد`],
    ["اینورتر", `${compactEquipmentLabel(inverterItem, "inverter")} / ${num(inverterCount)} عدد`],
    ["باتری", batteryCount && Number(batteryCount) > 0 ? `${compactEquipmentLabel(batteryItem, "battery")} / ${num(batteryCount)} عدد` : "غیرفعال"],
    ["استرینگ", `${num(pick(pvArray?.seriesCount, 0))}S × ${num(pick(pvArray?.parallelCount, 0))}P`],
  ];

  const inputRows = [
    ["روش ورود", method === "equipment" ? "لیست تجهیزات" : method],
    ["توان مبنا", kw(pick(load?.totalPowerW, load?.basePowerW, 0))],
    ["انرژی روزانه", `${num(pick(load?.dailyEnergyKWh, load?.totalEnergyKWh, load?.finalEnergyKWh, 0), 2)} kWh`],
    ["مبنای طراحی", pick(design?.source?.basis, handoff?.methodSummary?.basis, "load_consumption")],
  ];

  const equipmentRows = [
    ["پنل انتخابی", compactEquipmentLabel(panelItem, "panel")],
    ["تعداد پنل", `${num(panelCount)} عدد`],
    ["اینورتر انتخابی", compactEquipmentLabel(inverterItem, "inverter")],
    ["تعداد اینورتر", `${num(inverterCount)} عدد`],
    ["باتری انتخابی", batteryCount && Number(batteryCount) > 0 ? compactEquipmentLabel(batteryItem, "battery") : "غیرفعال"],
    ["تعداد باتری", `${num(batteryCount)} عدد`],
    ["تولید روزانه", `${num(pick(pvArray?.estimatedDailyKWh, pvArray?.generatedDailyKWh, 0), 2)} kWh`],
    ["اعتبارسنجی", valid ? "قابل تأیید" : "نیازمند اصلاح"],
  ];

  const calculationDetails = [
    ["نوع سیستم", systemType],
    ["توان مبنای آرایه", kw(pick(pvArray?.baseRequiredPowerW, 0))],
    ["توان کل پنل‌ها", kw(pick(pvArray?.arrayPowerW, 0))],
    ["تعداد MPPT", `${num(pick(inverter?.mpptCount, 1))} ورودی`],
    ["بازه MPPT", `${num(pick(inverter?.mpptMinV, 0))}-${num(pick(inverter?.mpptMaxV, 0))} V`],
    ["حداکثر Voc PV", `${num(pick(inverter?.maxPvVocV, inverter?.maxPvVoc, 0))} V`],
    ["انرژی باتری", battery?.grossEnergyKWh ? kwh(battery.grossEnergyKWh) : "غیرفعال"],
    ["آرایش باتری", battery?.seriesCount || battery?.parallelCount ? `${num(battery.seriesCount)} سری × ${num(battery.parallelCount)} موازی` : "-"],
  ];

  return (
    <div className="shil-final-summary-page">
      <style>{`
        .shil-final-summary-page{
          direction:rtl;
          width:100%;
          display:flex;
          flex-direction:column;
          gap:14px;
          font-family:inherit;
        }

        .shil-final-compact-card{
          direction:rtl;
          width:100%;
          margin:0;
          padding:0;
          background:transparent;
          border:none;
          box-shadow:none;
        }

        .shil-final-compact-title{
          height:36px;
          margin:0 0 8px;
          padding:0 12px;
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:8px;
          border-radius:18px;
          background:linear-gradient(180deg,#f8ffff 0%,#dffaff 45%,#a9ecff 100%);
          box-shadow:inset 0 3px 7px rgba(255,255,255,.95), inset 0 -5px 10px rgba(0,170,255,.25);
          color:#061421;
        }

        .shil-final-compact-title h2{
          margin:0;
          flex:1;
          text-align:center;
          font-size:14px;
          font-weight:900;
          line-height:1;
        }

        .shil-final-compact-title span{
          min-width:72px;
          text-align:center;
          font-size:12px;
          font-weight:900;
        }

        .shil-final-compact-table{
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

        .shil-final-compact-table th{
          background:linear-gradient(180deg,#eaffff 0%,#c7fbff 100%);
          font-size:12px;
          font-weight:900;
          height:32px;
          padding:4px 3px;
          border:1px solid #9eefff;
          line-height:1.35;
          vertical-align:middle;
        }

        .shil-final-compact-table td{
          background:#fff;
          font-size:12px;
          font-weight:900;
          height:36px;
          padding:4px 3px;
          border:1px solid #d9f7ff;
          line-height:1.35;
          vertical-align:middle;
          word-break:break-word;
        }

        .shil-final-detail-chip{
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

        .shil-final-details{
          max-height:0;
          opacity:0;
          overflow:hidden;
          transition:max-height 250ms ease, opacity 250ms ease, margin-top 250ms ease;
          margin-top:0;
        }

        .shil-final-details.open{
          max-height:700px;
          opacity:1;
          margin-top:8px;
          overflow:auto;
        }

        .shil-final-details-grid{
          display:grid;
          grid-template-columns:repeat(2,1fr);
          gap:6px;
        }

        .shil-final-detail-item{
          padding:6px;
          border:1px solid #d9f7ff;
          border-radius:10px;
          background:rgba(255,255,255,.88);
          font-size:12px;
          text-align:center;
        }

        .shil-final-detail-item span{
          display:block;
          font-size:11px;
          font-weight:800;
          color:#26384a;
        }

        .shil-final-detail-item strong{
          display:block;
          margin-top:3px;
          font-size:12px;
          font-weight:900;
          color:#061421;
        }

        .shil-final-warning-list{
          display:flex;
          flex-direction:column;
          gap:6px;
        }

        .shil-final-warning-item{
          padding:6px 8px;
          border:1px solid #ffd6a3;
          border-radius:10px;
          background:#fff8ed;
          color:#5b3300;
          font-size:12px;
          font-weight:900;
          text-align:center;
        }
      `}</style>

      <SummaryTableCard
        title="چکیده تنظیمات"
        badge={valid ? "قابل تأیید" : "نیازمند اصلاح"}
        rows={summaryRows}
        details={calculationDetails}
      />

      <SummaryTableCard
        title="چکیده ورودی محاسبات"
        badge="مسیر پروژه"
        rows={inputRows}
      />

      <SummaryTableCard
        title="تجهیزات انتخابی"
        badge="نتیجه طراحی"
        rows={equipmentRows}
        details={calculationDetails}
      />

      {warnings.length ? (
        <section className="shil-final-compact-card">
          <div className="shil-final-compact-title"><h2>هشدارها و اصلاحات</h2><span>{num(warnings.length)} مورد</span></div>
          <div className="shil-final-warning-list">
            {warnings.map((item) => <div key={item} className="shil-final-warning-item">{item}</div>)}
          </div>
        </section>
      ) : null}
    </div>
  );
}
