const faNumber = (value) => Number(value || 0).toLocaleString("en-US");

function readLiveSolarDesign() {
  try {
    return JSON.parse(localStorage.getItem("shil:solarSystemDesign:live") || localStorage.getItem("shil:solarSystemDesign") || "null");
  } catch {
    return null;
  }
}

export function SummaryStep({ value = {} }) {
  const design = readLiveSolarDesign();
  return (
    <div className="shil-card-stack">
      <div className="shil-metrics">
        <div className="shil-metric"><b>{value.city || "-"}</b><span>موقعیت</span></div>
        <div className="shil-metric"><b>{value.path || "-"}</b><span>مسیر</span></div>
        <div className="shil-metric"><b>{value.dailyEnergy || "-"}</b><span>kWh/day</span></div>
        <div className="shil-metric"><b>{value.systemVoltage || design?.design?.systemVoltage || "48"}V</b><span>ولتاژ</span></div>
      </div>
      {design?.systemScale ? (
        <div className="shil-section-card shil-utility-scale-summary">
          <div className="shil-section-head"><h2>تحلیل مقیاس پروژه</h2><span>{design.systemScale.scaleLabel}</span></div>
          <div className="shil-result-grid">
            <div><span>حالت طراحی</span><strong>{design.systemScale.designModeLabel}</strong></div>
            <div><span>توان AC هدف</span><strong>{design.systemScale.targetPowerMW >= 1 ? `${design.systemScale.targetPowerMW} MW` : `${design.systemScale.targetPowerKW} kW`}</strong></div>
            <div><span>توان DC هدف</span><strong>{design.systemScale.targetDcPowerMW >= 1 ? `${design.systemScale.targetDcPowerMW} MW` : `${faNumber(design.systemScale.targetDcPowerW / 1000)} kW`}</strong></div>
            <div><span>بلوک‌بندی</span><strong>{faNumber(design.systemScale.blockCount)} بلوک</strong></div>
            <div><span>اینورتر کل</span><strong>{faNumber(design.systemScale.totalInverterCount)} عدد</strong></div>
            <div><span>پنل کل</span><strong>{faNumber(design.pvArray?.panelCount)} عدد</strong></div>
            {design.utilityElectrical?.active ? <>
              <div><span>ولتاژ MV</span><strong>{design.utilityElectrical.mv.voltageKV} kV</strong></div>
              <div><span>فیدر MV</span><strong>{faNumber(design.utilityElectrical.mv.feederCount)} فیدر</strong></div>
              <div><span>ترانس بلوکی</span><strong>{faNumber(design.utilityElectrical.transformer.count)} × {design.utilityElectrical.transformer.unitMVA} MVA</strong></div>
              <div><span>زمین تقریبی</span><strong>{design.utilityElectrical.land.landAreaHa} ha</strong></div>
              <div><span>تولید سالانه</span><strong>{faNumber(design.utilityElectrical.yield.annualKWh)} kWh</strong></div>
              <div><span>CUF</span><strong>{design.utilityElectrical.yield.cufPercent}%</strong></div>
            </> : null}
            {design.enterpriseUtility?.active ? <>
              <div><span>Enterprise Score</span><strong>{design.enterpriseUtility.score}/100</strong></div>
              <div><span>حفاظت MV</span><strong>{design.enterpriseUtility.protection.requiredBreakerKA}kA / {design.enterpriseUtility.protection.feederBreakerA}A</strong></div>
              <div><span>Grid Study</span><strong>{design.enterpriseUtility.gridStudy.studyLevel}</strong></div>
              <div><span>Tracker</span><strong>{design.enterpriseUtility.tracker.trackerMode}</strong></div>
              <div><span>زمین ناخالص</span><strong>{design.enterpriseUtility.terrain.requiredGrossLandHa} ha</strong></div>
              <div><span>SCADA</span><strong>{design.enterpriseUtility.scada.blockGatewayCount} Gateway</strong></div>
              <div><span>P90 سال اول</span><strong>{faNumber(design.enterpriseUtility.advancedYield.p90KWh)} kWh</strong></div>
            </> : null}
          </div>
          <p className="shil-muted-line">این بخش فقط خروجی مهندسی مقیاس، برق نیروگاهی و اتصال شبکه را نمایش می‌دهد و شامل قیمت، خرید یا فروش نیست.</p>
        </div>
      ) : null}
    </div>
  );
}
