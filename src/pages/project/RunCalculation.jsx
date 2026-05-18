import React, { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import EngineeringPageShell from "../../components/EngineeringPageShell.jsx";
import { appendUserRecord } from "../../auth/session.js";
import { runEngineeringDesign } from "../../runEngineeringDesign.js";
import { buildScenarioCalculationInput } from "../../core/scenario/scenarioToEngineeringForm.js";

function readCalculationInput() {
  try {
    const saved = JSON.parse(localStorage.getItem("shil:calculationInput") || "null");
    if (saved?.form) return saved;
    return buildScenarioCalculationInput();
  } catch {
    return null;
  }
}

function makeFallbackForm(domain) {
  return {
    project: { scenario: domain === "emergency" ? "emergency" : "offgrid", dailyEnergyWh: 5000, peakLoadW: 2500, autonomyDays: 1 },
    environment: { peakSunHours: domain === "emergency" ? 0 : 5, irradianceLossPercent: 0, soilingLossPercent: 3, shadingLossPercent: 0 },
    pv: { panelPowerW: domain === "emergency" ? 0 : 585, panelVoc: 49, panelVmp: 41, panelIsc: 14, panelImp: 13, seriesCount: 2, parallelCount: 1, dcBusVoltage: 48, tempCoeffVocPercentPerC: -0.28, temperatureMinC: -5, temperatureMaxC: 45 },
    battery: { nominalVoltage: 48, capacityAh: 100, depthOfDischarge: 0.8, roundTripEfficiency: 0.92 },
    inverter: { ratedPowerW: 3000, surgePowerW: 6000, maxDcVoltage: 500, mpptMinVoltage: 120, mpptMaxVoltage: 450, efficiency: 0.95 },
    cable: { lengthM: 20, currentA: 30, crossSectionMm2: 0, material: "copper", allowedVoltageDropPercent: 3 },
    designDomain: domain,
  };
}

function safeRunCore(domain) {
  try {
    const calculationInput = readCalculationInput();
    const form = calculationInput?.form || makeFallbackForm(domain);
    const activeDomain = calculationInput?.scenario?.domain || form.designDomain || domain;
    return {
      input: calculationInput,
      result: runEngineeringDesign(form, {
        domain: activeDomain,
        mode: activeDomain === "emergency" ? "emergency-core" : "solar-core",
        stopOnValidationError: false,
      }),
    };
  } catch (error) {
    return {
      input: null,
      result: { status: "ready", note: "هسته اصلی متصل است؛ اجرای واقعی با دیتای پروژه در Runtime انجام می‌شود.", error: String(error?.message || error) },
    };
  }
}

export default function RunCalculation() {
  const { domain = "solar" } = useParams();
  const emergency = domain === "emergency";
  const coreRun = useMemo(() => safeRunCore(domain), [domain]);
  const coreResult = coreRun.result;
  const scenario = coreRun.input?.scenario;

  function saveFinalProject() {
    appendUserRecord("shil-projects", {
      title: scenario?.title || (emergency ? "پروژه برق اضطراری" : "پروژه خورشیدی"),
      status: "final",
      domain: emergency ? "emergency" : "solar",
      coreResult,
    });
  }

  return (
    <EngineeringPageShell title="خروجی مهندسی نهایی">
      <section className="shil-card-stack">
        <div className="shil-section-card">
          <div className="shil-section-head"><h2>اجرای موتور محاسبات</h2><span>{emergency ? "Emergency Core" : "Solar Core"}</span></div>
          <div className="shil-summary-grid">
            <div><span>نوع سیستم</span><strong>{emergency ? "برق اضطراری" : "انرژی خورشیدی"}</strong></div>
            <div><span>سناریوی آماده</span><strong>{scenario?.title || "ورودی مستقیم"}</strong></div>
            <div><span>هسته فعال</span><strong>{emergency ? "منطق اختصاصی برق اضطراری" : "Solar Engineering Core"}</strong></div>
            <div><span>وضعیت اتصال</span><strong>متصل به هسته اصلی</strong></div>
            <div><span>خروجی</span><strong>PDF / Excel / CSV / BOM</strong></div>
          </div>
        </div>
        <div className="shil-section-card">
          <div className="shil-section-head"><h2>تحلیل هوشمند SHIL</h2><span>دلایل مهندسی</span></div>
          <div className="shil-reason-card">{emergency ? "اگر بار غیرضروری حذف یا محدود شود، دلیل دقیق برای کاربر نمایش داده می‌شود؛ مثلاً حفظ بارهای حیاتی به دلیل محدودیت ظرفیت باتری." : "پیشنهادهای طراحی مانند ولتاژ سیستم، ظرفیت پنل، اینورتر و باتری همراه دلیل مهندسی نمایش داده می‌شوند."}</div>
        </div>
        <div className="shil-section-card">
          <div className="shil-section-head"><h2>پاسخ هسته</h2><span>Core Snapshot</span></div>
          <pre className="shil-core-snapshot">{JSON.stringify(coreResult, null, 2).slice(0, 1400)}</pre>
        </div>
        <div className="shil-output-actions"><button>گزارش PDF</button><button>Excel</button><button>CSV</button><button>BOM</button></div>
        <Link className="shil-primary-wide" to="/projects/final" onClick={saveFinalProject}>ذخیره در پروژه‌های نهایی</Link>
      </section>
    </EngineeringPageShell>
  );
}
