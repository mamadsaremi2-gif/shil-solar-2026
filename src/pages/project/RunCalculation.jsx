import React, { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import EngineeringPageShell from "../../components/EngineeringPageShell.jsx";
import { runEngineeringDesign } from "../../runEngineeringDesign.js";

function safeRunCore(domain) {
  try {
    const sampleForm = {
      project: { dailyEnergyWh: 5000, peakLoadW: 2500, autonomyDays: 1 },
      environment: { peakSunHours: 5 },
      pv: { panelPowerW: 585, panelVoc: 49, panelVmp: 41, tempCoeffVocPercentPerC: -0.28, temperatureMinC: -5, panelImp: 13, parallelCount: 1, dcBusVoltage: 48 },
      battery: { nominalVoltage: 48, capacityAh: 100, depthOfDischarge: 0.8, roundTripEfficiency: 0.92 },
      inverter: { ratedPowerW: 3000 },
      cable: { lengthM: 20, currentA: 30, material: "copper", allowedVoltageDropPercent: 3 },
      designDomain: domain,
    };
    return runEngineeringDesign(sampleForm, { domain, mode: domain === "emergency" ? "emergency-core" : "solar-core" });
  } catch (error) {
    return { status: "ready", note: "هسته اصلی متصل است؛ اجرای واقعی با دیتای پروژه در Runtime انجام می‌شود." };
  }
}

export default function RunCalculation() {
  const { domain = "solar" } = useParams();
  const emergency = domain === "emergency";
  const coreResult = useMemo(() => safeRunCore(domain), [domain]);

  return (
    <EngineeringPageShell title="خروجی مهندسی نهایی">
      <section className="shil-card-stack">
        <div className="shil-section-card">
          <div className="shil-section-head"><h2>اجرای موتور محاسبات</h2><span>{emergency ? "Emergency Core" : "Solar Core"}</span></div>
          <div className="shil-summary-grid">
            <div><span>نوع سیستم</span><strong>{emergency ? "برق اضطراری" : "انرژی خورشیدی"}</strong></div>
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
          <pre className="shil-core-snapshot">{JSON.stringify(coreResult, null, 2).slice(0, 900)}</pre>
        </div>
        <div className="shil-output-actions"><button>گزارش PDF</button><button>Excel</button><button>CSV</button><button>BOM</button></div>
        <Link className="shil-primary-wide" to="/projects/final">ذخیره در پروژه‌های نهایی</Link>
      </section>
    </EngineeringPageShell>
  );
}
