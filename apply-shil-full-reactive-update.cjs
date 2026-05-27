const fs = require("fs");
const path = require("path");

const root = process.cwd();

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function write(file, content) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, content.trim() + "\n");
  console.log("✔", path.relative(root, file));
}

const shilDir = path.join(root, "src", "shil");

ensureDir(shilDir);

write(
  path.join(shilDir, "reactiveEngine.js"),
`
export const AC_VOLTAGES = [220, 380];

export function calcACCurrent(powerW, voltageAC, pf = 0.95) {
  const p = Number(powerW || 0);
  const v = Number(voltageAC || 220);

  if (v === 380) {
    return p / (Math.sqrt(3) * v * pf);
  }

  return p / (v * pf);
}

export function calcCorrectedPower(powerW, factor = 1.2) {
  return Math.ceil(Number(powerW || 0) * Number(factor || 1.2));
}

export function buildInputSummary(data = {}) {
  const totalPowerW = Number(data.totalPowerW || 0);
  const voltageAC = Number(data.voltageAC || 220);

  return {
    totalPowerW,
    voltageAC,
    acCurrentA: Number(
      calcACCurrent(totalPowerW, voltageAC).toFixed(2)
    ),
  };
}

export function buildSystemSettings(data = {}) {
  const totalPowerW = Number(data.totalPowerW || 0);
  const voltageAC = Number(data.voltageAC || 220);

  const standardFactor = Number(data.standardFactor || 1.2);
  const autonomyDays = Number(data.autonomyDays || 1);

  const correctedPowerW = calcCorrectedPower(
    totalPowerW,
    standardFactor
  );

  const inverterCount =
    correctedPowerW <= 8000
      ? 1
      : Math.ceil(correctedPowerW / 8000);

  const panelCount = Math.ceil(correctedPowerW / 600);

  const batteryCount = Math.ceil(
    (correctedPowerW / 1000) * autonomyDays * 1.5
  );

  return {
    method: "توان کل",
    totalPowerW,
    voltageAC,
    standardFactor,
    autonomyDays,

    correctedPowerW,
    correctedPowerKW: Number(
      (correctedPowerW / 1000).toFixed(2)
    ),

    acCurrentA: Number(
      calcACCurrent(correctedPowerW, voltageAC).toFixed(2)
    ),

    inverter: {
      title: "SHIL HI2 8KW 48V",
      power: 8000,
      count: inverterCount,
    },

    solar: {
      title: "SHIL SOLAR 600W",
      panelPower: 600,
      panelCount,
    },

    battery: {
      title: "SHIL LiFePO4 51.2V 100Ah",
      count: batteryCount,
      voltage: 51.2,
      kwh: 5.12,
    },
  };
}
`
);

write(
  path.join(shilDir, "TotalPowerPage.jsx"),
`
import React, { useMemo, useState } from "react";
import "./shilReactive.css";

import {
  AC_VOLTAGES,
  buildInputSummary,
  buildSystemSettings,
} from "./reactiveEngine";

export default function TotalPowerPage() {
  const [totalPowerW, setTotalPowerW] = useState("");
  const [voltageAC, setVoltageAC] = useState(220);

  const summary = useMemo(() => {
    return buildInputSummary({
      totalPowerW,
      voltageAC,
    });
  }, [totalPowerW, voltageAC]);

  const handleConfirm = () => {
    const settings = buildSystemSettings({
      totalPowerW,
      voltageAC,
      standardFactor: 1.2,
      autonomyDays: 1,
    });

    localStorage.setItem(
      "shil_system_settings",
      JSON.stringify(settings)
    );

    window.location.href = "/system-settings";
  };

  return (
    <div className="shil-page">

      <section className="shil-card">
        <h2>زمینه محاسبات</h2>

        <div className="shil-grid-2">

          <div className="shil-field">
            <small>روش</small>
            <strong>توان کل</strong>
          </div>

          <div className="shil-field">
            <small>مسیر پروژه</small>
            <strong>خورشیدی</strong>
          </div>

          <div className="shil-field">
            <small>سناریو</small>
            <strong>دستی</strong>
          </div>

          <div className="shil-field">
            <small>شهر</small>
            <strong>اصفهان</strong>
          </div>

        </div>
      </section>

      <section className="shil-card">
        <h2>ورودی مستقیم روش انتخاب‌شده</h2>

        <div className="shil-grid-2">

          <label className="shil-input-wrap">
            <span>توان کل W</span>

            <input
              value={totalPowerW}
              onChange={(e) =>
                setTotalPowerW(e.target.value)
              }
              placeholder="توان خود را وارد کنید"
            />
          </label>

          <label className="shil-input-wrap">
            <span>ولتاژ AC</span>

            <select
              value={voltageAC}
              onChange={(e) =>
                setVoltageAC(Number(e.target.value))
              }
            >
              {AC_VOLTAGES.map((v) => (
                <option key={v} value={v}>
                  {v} ولت {v === 220 ? "تک‌فاز" : "سه‌فاز"}
                </option>
              ))}
            </select>
          </label>

        </div>
      </section>

      <section className="shil-card">
        <h2>نتایج ورودی محاسبات</h2>

        <div className="shil-grid-2">

          <div className="shil-field">
            <small>توان کل</small>
            <strong>W {summary.totalPowerW}</strong>
          </div>

          <div className="shil-field">
            <small>ولتاژ AC</small>
            <strong>{summary.voltageAC} ولت</strong>
          </div>

          <div className="shil-field">
            <small>جریان AC</small>
            <strong>A {summary.acCurrentA}</strong>
          </div>

        </div>
      </section>

      <button
        className="shil-btn"
        onClick={handleConfirm}
      >
        تأیید اطلاعات و ورود به پیکربندی تنظیمات
      </button>

    </div>
  );
}
`
);

write(
  path.join(shilDir, "SystemSettingsPage.jsx"),
`
import React, { useEffect, useState } from "react";
import "./shilReactive.css";

export default function SystemSettingsPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    const raw = localStorage.getItem(
      "shil_system_settings"
    );

    if (raw) {
      setData(JSON.parse(raw));
    }
  }, []);

  if (!data) {
    return (
      <div className="shil-page">
        <div className="shil-card">
          داده‌ای یافت نشد
        </div>
      </div>
    );
  }

  return (
    <div className="shil-page">

      <section className="shil-card">
        <h2>اینورتر خورشیدی پیشنهادی</h2>

        <div className="shil-grid-3">

          <div className="shil-select-card active">
            <h3>آفگرید</h3>
            <p>پیش‌فرض فعال</p>
          </div>

          <div className="shil-select-card">
            <h3>هیبرید</h3>
          </div>

          <div className="shil-select-card">
            <h3>آنگرید</h3>
          </div>

        </div>
      </section>

      <section className="shil-card">
        <h2>پارامترهای اثرگذار</h2>

        <div className="shil-grid-2">

          <div className="shil-field">
            <small>توان کل</small>
            <strong>W {data.totalPowerW}</strong>
          </div>

          <div className="shil-field">
            <small>ضریب افزایش استاندارد</small>
            <strong>{data.standardFactor}</strong>
          </div>

          <div className="shil-field">
            <small>روز خودکفایی</small>
            <strong>{data.autonomyDays}</strong>
          </div>

          <div className="shil-field">
            <small>توان کل با ضرایب</small>
            <strong>
              W {data.correctedPowerW}
            </strong>
          </div>

          <div className="shil-field">
            <small>جریان AC</small>
            <strong>
              A {data.acCurrentA}
            </strong>
          </div>

        </div>
      </section>

      <section className="shil-card">
        <h2>بانک اینورتر خورشیدی</h2>

        <div className="shil-grid-2">

          <div className="shil-field">
            <small>انتخاب هوشمند</small>

            <strong>
              {data.inverter.title}
            </strong>
          </div>

          <div className="shil-field">
            <small>تعداد</small>

            <strong>
              {data.inverter.count} عدد
            </strong>
          </div>

        </div>
      </section>

      <section className="shil-card">
        <h2>بانک پنل خورشیدی</h2>

        <div className="shil-grid-2">

          <div className="shil-field">
            <small>پنل انتخابی</small>

            <strong>
              {data.solar.title}
            </strong>
          </div>

          <div className="shil-field">
            <small>تعداد پنل</small>

            <strong>
              {data.solar.panelCount} عدد
            </strong>
          </div>

        </div>
      </section>

      <section className="shil-card">
        <h2>بانک باتری</h2>

        <div className="shil-grid-2">

          <div className="shil-field">
            <small>باتری انتخابی</small>

            <strong>
              {data.battery.title}
            </strong>
          </div>

          <div className="shil-field">
            <small>تعداد باتری</small>

            <strong>
              {data.battery.count} عدد
            </strong>
          </div>

        </div>
      </section>

      <section className="shil-card">
        <h2>تقسیم اینورتر و MPPT</h2>

        <div className="shil-grid-2">

          <div className="shil-field">
            <small>تعداد اینورتر</small>

            <strong>
              {data.inverter.count}
            </strong>
          </div>

          <div className="shil-field">
            <small>MPPT هر اینورتر</small>

            <strong>1</strong>
          </div>

        </div>
      </section>

      <section className="shil-card">
        <h2>نتایج تنظیمات</h2>

        <div className="shil-grid-2">

          <div className="shil-field">
            <small>روش محاسبات</small>
            <strong>{data.method}</strong>
          </div>

          <div className="shil-field">
            <small>ولتاژ مصرف‌کننده</small>
            <strong>
              {data.voltageAC}V
            </strong>
          </div>

          <div className="shil-field">
            <small>تعداد اینورتر</small>
            <strong>
              {data.inverter.count}
            </strong>
          </div>

          <div className="shil-field">
            <small>تعداد پنل</small>
            <strong>
              {data.solar.panelCount}
            </strong>
          </div>

          <div className="shil-field">
            <small>تعداد باتری</small>
            <strong>
              {data.battery.count}
            </strong>
          </div>

        </div>
      </section>

    </div>
  );
}
`
);

write(
  path.join(shilDir, "shilReactive.css"),
`
.shil-page {
  direction: rtl;
  padding: 16px;
  color: white;
}

.shil-card {
  background: rgba(10, 16, 35, 0.82);
  border-radius: 24px;
  border: 1px solid rgba(60, 180, 255, 0.18);
  padding: 18px;
  margin-bottom: 14px;
}

.shil-card h2 {
  margin: 0 0 16px;
  font-size: 22px;
  font-weight: 900;
}

.shil-grid-2 {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.shil-grid-3 {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.shil-field,
.shil-input-wrap,
.shil-select-card {
  min-height: 72px;
  border-radius: 18px;
  background: rgba(255,255,255,0.06);
  padding: 14px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.shil-field small,
.shil-input-wrap span {
  font-size: 12px;
  color: #9cb2d4;
  margin-bottom: 6px;
}

.shil-field strong {
  font-size: 18px;
  font-weight: 900;
}

.shil-input-wrap input,
.shil-input-wrap select {
  border: none;
  outline: none;
  background: transparent;
  color: white;
  font-size: 18px;
  font-weight: 900;
}

.shil-btn {
  width: 100%;
  border: none;
  border-radius: 18px;
  padding: 16px;
  font-weight: 900;
  color: white;
  background: linear-gradient(
    90deg,
    #1cc7ff,
    #b75cff,
    #ffb42b
  );
}

.shil-select-card.active {
  border: 1px solid #2ed4ff;
}

@media (max-width: 720px) {

  .shil-grid-2,
  .shil-grid-3 {
    grid-template-columns: 1fr;
  }

}
`
);

write(
  path.join(root, "apply-shil-routes.txt"),
`
=== APP ROUTES ===

1) TOTAL POWER PAGE

import TotalPowerPage from "./src/shil/TotalPowerPage";

<TotalPowerPage />

------------------------------------------------

2) SYSTEM SETTINGS PAGE

import SystemSettingsPage from "./src/shil/SystemSettingsPage";

<SystemSettingsPage />

------------------------------------------------

3) MAIN CSS / APP

import "./src/shil/shilReactive.css";

`
);

console.log("");
console.log("====================================");
console.log("SHIL FULL UPDATE INSTALLED");
console.log("====================================");
console.log("");
console.log("NEXT:");
console.log("1) node apply-shil-full-reactive-update.cjs");
console.log("2) import components into routes");
console.log("3) npm run dev");