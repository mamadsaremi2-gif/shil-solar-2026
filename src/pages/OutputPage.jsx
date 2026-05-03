import { useMemo, useRef, useState } from 'react';
import { useProjectStore } from '../app/store/projectStore';
import { MetricCard } from '../shared/components/MetricCard';
import { formatNumber } from '../shared/utils/format';
import { AdvisorList } from '../features/engineering-output/components/AdvisorList';
import { SimpleBarChart, SimpleLineChart } from '../features/simulation/components/SimpleCharts';
import { EquipmentRepository } from '../data/repositories/EquipmentRepository';
import { PUBLIC_ASSETS } from '../shared/constants/publicAssets';
import { IRAN_CITIES } from '../data/seed/iranCities';

function formatSystemType(value) {
  const map = {
    backup: 'تأمین برق اضطراری با باتری',
    offgrid: 'Off-Grid',
    hybrid: 'Hybrid',
    gridtie: 'Grid-Tie',
  };
  return map[value] || value || '—';
}

function formatCalculationMode(value) {
  const map = {
    current: 'بر اساس جریان کل',
    power: 'بر اساس توان کل',
    loads: 'بر اساس لیست تجهیزات',
    load_profile: 'بر اساس پروفایل مصرف',
    daily_energy: 'بر اساس انرژی مصرفی',
  };
  return map[value] || value || '—';
}

function formatHybridMode(value) {
  const map = {
    self_consumption: 'خودمصرفی',
    backup_priority: 'اولویت پشتیبانی',
    peak_shaving: 'کاهش پیک',
  };
  return map[value] || '—';
}


function findCityClimate(cityName) {
  return IRAN_CITIES.find((city) => city.name === cityName) || null;
}

function ClimateOutputPanel({ form, pv }) {
  const city = findCityClimate(form.city);
  const psh = Number(form.sunHours || 0);
  const avgTemp = Number(form.averageTemperature || 0);
  const minTemp = Number(form.minTemperature || 0);
  const maxTemp = Number(form.maxTemperature || 0);
  const altitude = Number(form.altitude || 0);
  const solarClass = psh >= 5.7 ? 'عالی' : psh >= 5 ? 'خوب' : psh >= 4.2 ? 'متوسط' : 'کم';
  const tempNote = maxTemp > 40
    ? 'دمای بالا باعث افت توان واقعی پنل می‌شود.'
    : minTemp < -5
      ? 'دمای پایین باید در کنترل Voc سرد رشته پنل بررسی شود.'
      : 'شرایط دمایی برای طراحی عمومی مناسب است.';

  return (
    <section className="panel climate-output-panel">
      <div className="panel__header">
        <h2>اطلاعات محیطی شهر انتخابی</h2>
        <span className="badge">{city ? city.province : 'ورودی دستی'}</span>
      </div>
      <div className="climate-metric-grid">
        <div><span>شهر</span><strong>{form.city || '—'}</strong></div>
        <div><span>تابش موثر PSH</span><strong>{formatNumber(psh, 1)} h/day</strong></div>
        <div><span>کلاس تابش</span><strong>{solarClass}</strong></div>
        <div><span>دمای متوسط</span><strong>{formatNumber(avgTemp)} °C</strong></div>
        <div><span>حداقل / حداکثر دما</span><strong>{formatNumber(minTemp)} / {formatNumber(maxTemp)} °C</strong></div>
        <div><span>ارتفاع از سطح دریا</span><strong>{formatNumber(altitude)} m</strong></div>
        <div><span>ضریب سایه</span><strong>{formatNumber(Number(form.shadingFactor || 0) * 100, 0)} %</strong></div>
        <div><span>ضریب گردوغبار</span><strong>{formatNumber(Number(form.dustFactor || 0) * 100, 0)} %</strong></div>
        <div><span>زاویه نصب</span><strong>{formatNumber(form.tiltAngle)}°</strong></div>
        {pv ? <div><span>PR طراحی</span><strong>{formatNumber(pv.performanceRatio, 2)}</strong></div> : null}
      </div>
      <div className="climate-note-list">
        <div><span>تحلیل دما</span><strong>{tempNote}</strong></div>
        {pv ? <div><span>تولید روزانه تخمینی</span><strong>{formatNumber(pv.estimatedDailyProductionWh)} Wh</strong></div> : null}
        {pv ? <div><span>String Voc سرد</span><strong>{formatNumber(pv.stringVocCold)} V</strong></div> : null}
      </div>
    </section>
  );
}


function formatEquipmentLabel(item) {
  if (!item) return 'ورود دستی';
  return `${item.title}${item.isCustom ? ' (سفارشی)' : ''}`;
}


function numberValue(value, fallback = 0) {
  const normalized = String(value ?? '').replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/,/g, '').trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function outputSameVoltageRange(systemVoltage, batteryVoltage) {
  const sv = Number(systemVoltage) || 0;
  const bv = Number(batteryVoltage) || 0;
  if (!sv || !bv) return false;
  return Math.abs(sv - bv) <= Math.max(2, sv * 0.08);
}

function outputSeriesCount(systemVoltage, batteryVoltage) {
  if (outputSameVoltageRange(systemVoltage, batteryVoltage)) return 1;
  return Math.max(1, Math.ceil((Number(systemVoltage) || 1) / Math.max(Number(batteryVoltage) || 1, 1)));
}

function buildBackupBatteryOutput(form, loads, batteryFallback = {}) {
  const systemVoltage = numberValue(form.systemVoltage, 24);
  const batteryVoltage = numberValue(form.batteryUnitVoltage, systemVoltage);
  const batteryAh = numberValue(form.batteryUnitAh, 100);
  const backupHours = Math.max(numberValue(form.backupHours, 1), 0.1);
  const demandPowerW = Math.max(numberValue(loads?.demandPowerW, numberValue(form.loadPower, 0)), 1);
  const dod = Math.min(Math.max(numberValue(form.dod, 0.8), 0.1), 1);
  const inverterEfficiency = Math.min(Math.max(numberValue(form.inverterEfficiency, 0.95), 0.1), 1);
  const batteryEfficiency = Math.min(Math.max(numberValue(form.batteryRoundTripEfficiency, 0.96), 0.1), 1);
  const seriesCount = outputSeriesCount(systemVoltage, batteryVoltage);
  const requiredAh = (demandPowerW * backupHours) / Math.max(systemVoltage * dod * inverterEfficiency * batteryEfficiency, 1);
  const manualParallel = numberValue(form.backupParallelCount, 0);
  const parallelCount = Math.max(1, Math.ceil(manualParallel > 0 ? manualParallel : requiredAh / Math.max(batteryAh, 1)));
  const totalCount = seriesCount * parallelCount;
  const bankNominalAh = parallelCount * batteryAh;
  const usableEnergyWh = bankNominalAh * systemVoltage * dod * inverterEfficiency * batteryEfficiency;
  const realBackupHours = usableEnergyWh / demandPowerW;
  return {
    ...batteryFallback,
    systemVoltage,
    batteryVoltage,
    batteryAh,
    seriesCount,
    parallelCount,
    totalCount,
    bankNominalAh,
    realBackupHours,
    usableEnergyWh,
    chemistry: form.batteryType || batteryFallback.chemistry || 'LFP',
  };
}

function renderEquipmentSpecs(item) {
  if (!item?.specs) return [];
  const specs = item.specs;
  const rows = [];

  if (item.category === 'panel') {
    if (specs.panelWatt) rows.push(['توان پنل', `${formatNumber(specs.panelWatt)} W`]);
    if (specs.panelVmp) rows.push(['Vmp', `${formatNumber(specs.panelVmp)} V`]);
    if (specs.panelVoc) rows.push(['Voc', `${formatNumber(specs.panelVoc)} V`]);
  }

  if (item.category === 'battery') {
    if (specs.batteryType) rows.push(['شیمی باتری', specs.batteryType]);
    if (specs.batteryUnitVoltage) rows.push(['ولتاژ واحد', `${formatNumber(specs.batteryUnitVoltage)} V`]);
    if (specs.batteryUnitAh) rows.push(['ظرفیت واحد', `${formatNumber(specs.batteryUnitAh)} Ah`]);
    if (specs.dod) rows.push(['DoD', `${formatNumber(Number(specs.dod) * 100, 0)} %`]);
  }

  if (item.category === 'inverter') {
    if (specs.loadPower) rows.push(['توان نامی', `${formatNumber(specs.loadPower)} W`]);
    if (specs.systemVoltage) rows.push(['ولتاژ DC', `${formatNumber(specs.systemVoltage)} V`]);
    if (specs.inverterEfficiency) rows.push(['راندمان', `${formatNumber(Number(specs.inverterEfficiency) * 100, 0)} %`]);
  }


  return rows.slice(0, 4);
}



function groupBackupScenarios(scenarios = []) {
  return [12, 24, 48].map((systemVoltage) => ({
    systemVoltage,
    items: scenarios.filter((item) => item.systemVoltage === systemVoltage),
  })).filter((group) => group.items.length);
}

function BackupScenarioTable({ scenarios = [] }) {
  const groups = groupBackupScenarios(scenarios);
  if (!groups.length) return null;

  return (
    <section className="panel panel--full">
      <div className="panel__header">
        <h2>سناریوهای مختلف بانک باتری</h2>
        <span className="badge">برای سانورترهای 12 / 24 / 48 ولت</span>
      </div>
      <p className="section-note">برای هر ولتاژ سانورتر و ظرفیت باتری، تعداد سری، موازی، تعداد کل و زمان پشتیبانی واقعی نشان داده شده است.</p>
      <div className="backup-scenario-stack">
        {groups.map((group) => (
          <div key={group.systemVoltage} className="backup-scenario-group">
            <div className="backup-scenario-group__header">
              <h3>سیستم {group.systemVoltage} ولت</h3>
              <span>{group.items.length} حالت</span>
            </div>
            <div className="backup-scenario-table-wrap">
              <table className="backup-scenario-table">
                <thead>
                  <tr>
                    <th>باتری</th>
                    <th>ظرفیت هر باتری</th>
                    <th>سری</th>
                    <th>موازی</th>
                    <th>تعداد کل</th>
                    <th>ظرفیت بانک</th>
                    <th>زمان پشتیبانی واقعی</th>
                  </tr>
                </thead>
                <tbody>
                  {group.items.map((row) => (
                    <tr key={`${row.systemVoltage}-${row.batteryUnitVoltage}-${row.batteryUnitAh}`} className={row.isSelected ? 'is-selected' : ''}>
                      <td>{row.batteryUnitVoltage}V</td>
                      <td>{formatNumber(row.batteryUnitAh)}Ah</td>
                      <td>{row.seriesCount}</td>
                      <td>{row.parallelCount}</td>
                      <td>{row.totalCount}</td>
                      <td>{formatNumber(row.bankNominalAh)}Ah</td>
                      <td>{formatNumber(row.realBackupHours, 1)} h</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function EquipmentCard({ title, item }) {
  const specRows = renderEquipmentSpecs(item);

  return (
    <section className="panel equipment-panel">
      <div className="panel__header">
        <h2>{title}</h2>
        <span className="badge">{item ? (item.isCustom ? 'سفارشی' : 'کتابخانه') : 'دستی'}</span>
      </div>
      <div className="equipment-summary">
        <strong>{formatEquipmentLabel(item)}</strong>
        {item ? <span>{item.brand} / {item.model}</span> : <span>در این نقش تجهیزی از کتابخانه انتخاب نشده و محاسبه با داده‌های دستی انجام شده است.</span>}
      </div>
      {specRows.length ? (
        <div className="summary-list equipment-spec-list">
          {specRows.map(([label, value]) => (
            <div key={label}><span>{label}</span><strong>{value}</strong></div>
          ))}
        </div>
      ) : null}
      {item?.summary ? <p className="equipment-note">{item.summary}</p> : null}
    </section>
  );
}

export function OutputPage() {
  const { activeProject, activeRecord, projectVersions, goDashboard, openProject, openWorkspace, editProjectStep, saveProjectVersion } = useProjectStore();
  const output = activeProject.result;
  const reportRef = useRef(null);
  const [isExporting, setIsExporting] = useState(false);

  if (!output?.ok) {
    return <div className="shell"><div className="panel empty-state">محاسبات معتبر موجود نیست.</div></div>;
  }

  const { summary, battery, pv, inverter, controller, cabling, protection, loads, simulation, industrial, advisor, validation } = output.result;
  const displayBattery = summary.systemType === 'backup' ? buildBackupBatteryOutput(activeProject.form, loads, battery) : battery;
  const designStatusLabel = useMemo(() => summary.designStatus === 'error' ? 'نیازمند اصلاح' : summary.designStatus === 'warning' ? 'دارای هشدار' : 'معتبر', [summary.designStatus]);
  const projectTitle = activeProject.form.projectTitle || 'Solar Design Suite';
  const projectDate = new Date().toLocaleDateString('fa-IR');
  const selectedEquipment = activeProject.form.selectedEquipment || {};
  const panelItem = selectedEquipment.panel ? EquipmentRepository.getById(selectedEquipment.panel) : null;
  const batteryItem = selectedEquipment.battery ? EquipmentRepository.getById(selectedEquipment.battery) : null;
  const inverterItem = selectedEquipment.inverter ? EquipmentRepository.getById(selectedEquipment.inverter) : null;
  const controllerItem = selectedEquipment.controller ? EquipmentRepository.getById(selectedEquipment.controller) : null;
  const customerInfoRows = [
    ['نام پروژه', projectTitle],
    ['نام مشتری / کارفرما', activeProject.form.clientName || '—'],
    ['موقعیت پروژه', activeProject.form.city || '—'],
    ['نوع سیستم', formatSystemType(summary.systemType)],
    ['تاریخ گزارش', projectDate],
  ];

  const expertInfoRows = [
    ['کارشناس طراحی', 'کارشناس فنی'],
    ['مجموعه', 'SHILIRAN GROUP'],
    ['وب سایت', 'SHIL.IR'],
    ['نوع گزارش', summary.systemType === 'backup' ? 'تأمین برق اضطراری با باتری' : 'طراحی سیستم خورشیدی'],
    ['وضعیت طراحی', designStatusLabel],
  ];

  const calculationSummaryRows = [
    ['مجموع توان تجهیزات', `${formatNumber(loads.connectedPowerW)} W`],
    ['ضریب همزمانی میانگین', `${loads.connectedPowerW ? formatNumber((loads.demandPowerW / loads.connectedPowerW) * 100, 0) : 100} %`],
    ['نیاز واقعی اجرا', `${formatNumber(summary.demandPowerW)} W`],
    ['بار ظاهری طراحی', `${formatNumber(summary.demandApparentVA || loads.demandApparentVA)} VA`],
    [summary.systemType === 'backup' ? 'انرژی مصرفی' : 'انرژی روزانه', `${formatNumber(summary.totalDailyEnergyWh)} Wh`],
    [summary.systemType === 'backup' ? 'زمان مورد نیاز مشتری' : 'روزهای خودکفایی مورد نظر', summary.systemType === 'backup' ? `${formatNumber(activeProject.form.backupHours, 1)} h` : `${formatNumber(activeProject.form.daysAutonomy || 0, 1)} روز`],
    [summary.systemType === 'offgrid' ? 'خودکفایی واقعی باتری' : 'زمان پشتیبانی واقعی', summary.systemType === 'offgrid' ? `${formatNumber(summary.batteryAutonomyDays, 2)} روز / ${formatNumber(summary.batteryBackupHours, 1)} h` : `${formatNumber(displayBattery.realBackupHours ?? summary.batteryBackupHours, 1)} h`],
    ['ولتاژ سیستم', `${formatNumber(activeProject.form.systemVoltage)} V`],
    ['ظرفیت نهایی بانک باتری', `${formatNumber(displayBattery.bankNominalAh || summary.batteryAh)} Ah`],
    ['توان پیک / راه اندازی', `${formatNumber(loads.surgePowerW)} W`],
  ];

  const batteryArrangementText = displayBattery.seriesCount === 1
    ? `${formatNumber(displayBattery.totalCount)} عدد - ${displayBattery.parallelCount} موازی`
    : `${formatNumber(displayBattery.totalCount)} عدد - ${displayBattery.seriesCount} سری × ${displayBattery.parallelCount} موازی`;
  const batteryExplanationText = displayBattery.seriesCount === 1
    ? `برای کارکرد این سیستم، ${formatNumber(displayBattery.totalCount)} عدد باتری نیاز است. چون ولتاژ باتری انتخاب‌شده با ولتاژ سیستم همخوان است، باتری‌ها سری نمی‌شوند و ${displayBattery.parallelCount} عدد/رشته به صورت موازی قرار می‌گیرند تا ظرفیت و زمان پشتیبانی افزایش پیدا کند. خروجی نهایی بانک برابر ${formatNumber(activeProject.form.systemVoltage)}V / ${formatNumber(displayBattery.bankNominalAh || displayBattery.parallelCount * Number(activeProject.form.batteryUnitAh || 0))}Ah است.`
    : `برای کارکرد این سیستم، ${formatNumber(displayBattery.totalCount)} عدد باتری نیاز است. ابتدا در هر رشته ${displayBattery.seriesCount} عدد باتری به صورت سری وصل می‌شوند تا ولتاژ ${formatNumber(activeProject.form.systemVoltage)}V تامین شود. سپس ${displayBattery.parallelCount} رشته موازی می‌شود تا ظرفیت و زمان پشتیبانی افزایش پیدا کند. خروجی نهایی بانک برابر ${formatNumber(activeProject.form.systemVoltage)}V / ${formatNumber(displayBattery.bankNominalAh || displayBattery.parallelCount * Number(activeProject.form.batteryUnitAh || 0))}Ah است.`;

  const requiredEquipmentRows = [
    [summary.systemType === 'backup' ? 'سانورتر پیشنهادی' : 'اینورتر پیشنهادی', `${formatNumber(summary.inverterPowerW)} W / ${formatNumber(summary.inverterPowerVA || inverter.continuousPowerVA)} VA`],
    ['Surge پیشنهادی', `${formatNumber(summary.inverterSurgePowerW)} W / ${formatNumber(summary.inverterSurgePowerVA || inverter.surgePowerVA)} VA`],
    ['بانک باتری', batteryArrangementText],
    ['توضیح بانک باتری', batteryExplanationText],
    ['مشخصات باتری', `${formatNumber(activeProject.form.batteryUnitVoltage)}V ${formatNumber(activeProject.form.batteryUnitAh)}Ah - ${displayBattery.chemistry}`],
    ['ضریب افزایش باتری', `${formatNumber(activeProject.form.batteryFactor || 1, 2)}`],
    ['ظرفیت نهایی بانک باتری', `${formatNumber(activeProject.form.systemVoltage)}V / ${formatNumber(displayBattery.bankNominalAh || displayBattery.parallelCount * Number(activeProject.form.batteryUnitAh || 0))}Ah`],
    ['کابل باتری', `${formatNumber(cabling.batteryCableSizeMm2, 1)} mm²`],
    ['فیوز باتری / AC', `${protection?.batteryFuseA ? formatNumber(protection.batteryFuseA) : '—'} A / ${protection?.acFuseA ? formatNumber(protection.acFuseA) : '—'} A`],
  ];

  if (summary.systemType !== 'backup') {
    requiredEquipmentRows.splice(1, 0, ['آرایه پنل', `${formatNumber(summary.panelCount)} عدد پنل ${formatNumber(activeProject.form.panelWatt)}W - آرایش ${pv?.panelSeriesCount || 0} سری × ${pv?.panelParallelCount || 0} موازی`]);
    requiredEquipmentRows.splice(2, 0, ['مشخصات پنل', `Vmp ${formatNumber(activeProject.form.panelVmp)}V / Voc ${formatNumber(activeProject.form.panelVoc)}V / ضریب افزایش پنل ${formatNumber(activeProject.form.panelFactor || 1, 2)}`]);
    requiredEquipmentRows.splice(3, 0, ['علت سری کردن پنل', `${pv?.panelSeriesCount || 0} پنل به صورت سری انتخاب شده تا ولتاژ کاری آرایه (${formatNumber(pv?.stringVmp || 0)}V) داخل محدوده MPPT سانورتر (${formatNumber(activeProject.form.mpptMinVoltage)} تا ${formatNumber(activeProject.form.mpptMaxVoltage)}V) قرار بگیرد.`]);
    requiredEquipmentRows.splice(4, 0, ['علت موازی کردن پنل', `${pv?.panelParallelCount || 0} رشته موازی برای افزایش توان و تولید انرژی روزانه در نظر گرفته شده است. توان کل پنل‌ها ${formatNumber(summary.pvInstalledPowerW)}W است.`]);
    requiredEquipmentRows.splice(5, 0, ['کنترل MPPT و Voc', `${pv?.mpptWindowOk ? 'MPPT مناسب' : 'MPPT نیازمند اصلاح'} / Voc سرد ${formatNumber(pv?.stringVocCold || 0)}V ${pv?.vocOk ? 'مجاز' : 'بیشتر از حد مجاز'}`]);
    requiredEquipmentRows.splice(6, 0, ['تولید روزانه پنل', `${formatNumber(pv?.estimatedDailyProductionWh || 0)} Wh/day`]);
  }


  function handleSave() {
    const saved = saveProjectVersion();
    if (!saved) {
      window.alert('برای ذخیره نسخه جدید ابتدا محاسبات معتبر داشته باش.');
    }
  }

  async function handleExportPdf() {
    try {
      setIsExporting(true);
      const { exportEngineeringPdf } = await import('../features/reports/services/exportEngineeringPdf');
      await exportEngineeringPdf({
        element: reportRef.current,
        fileName: projectTitle,
        title: `Engineering Report - ${projectTitle}`,
      });
    } catch (error) {
      console.error('PDF export failed', error);
      window.alert('ساخت PDF با خطا مواجه شد.');
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="shell">
      <header className="topbar topbar--report">
        <button className="btn btn--ghost" onClick={goDashboard}>داشبورد</button><button className="btn btn--ghost" type="button" onClick={() => editProjectStep(6)}>بازگشت به صفحه قبل</button>
        <div className="topbar__title topbar__title--brand"><img src={PUBLIC_ASSETS.branding.logo} alt="Solar Design Suite" className="topbar__brand-logo" /> <span>خروجی مهندسی</span></div>
        <div className="topbar__actions">
          <button className="btn btn--secondary" onClick={handleSave}>ذخیره نسخه جدید</button>
          <button className="btn btn--primary" onClick={handleExportPdf} disabled={isExporting}>{isExporting ? 'در حال ساخت PDF...' : 'گزارش PDF'}</button>
        </div>
      </header>

      <div ref={reportRef} className="report-export-root">
        <section className="pdf-page-section report-page executive-summary-page" style={{ backgroundImage: `linear-gradient(135deg, rgba(8,17,31,0.92), rgba(15,23,42,0.86)), url(${PUBLIC_ASSETS.backgrounds.report})` }}>
          <div className="executive-summary-header">
            <div className="executive-summary-brand">
              <img src={PUBLIC_ASSETS.branding.logo} alt="SHIL" />
              <div>
                <span>SHIL.IR</span>
                <strong>خلاصه مهندسی طراحی</strong>
              </div>
            </div>
            <div className="executive-summary-status">
              <span>{formatSystemType(summary.systemType)}</span>
              <strong>{designStatusLabel}</strong>
            </div>
          </div>

          <div className="executive-summary-title">
            <span className="eyebrow">خلاصه مدیریتی</span>
            <h1>{projectTitle}</h1>
            <p>{summary.systemType === 'backup' ? 'جمع بندی یک صفحه ای طراحی تأمین برق اضطراری با باتری، شامل معرفی مشتری، معرفی کارشناس، نتیجه خلاصه محاسبات و تجهیزات مورد نیاز مصرف کننده.' : 'جمع بندی یک صفحه ای طراحی سیستم خورشیدی، شامل مشخصات مشتری، کارشناس، خلاصه محاسبات و تجهیزات اصلی مورد نیاز.'}</p>
          </div>

          <div className="executive-summary-grid">
            <section className="executive-card executive-card--clickable" role="button" tabIndex={0} onClick={() => editProjectStep(0)} onKeyDown={(e) => e.key === 'Enter' ? editProjectStep(0) : null}>
              <h2>معرفی مشتری</h2>
              <div className="executive-row-list">
                {customerInfoRows.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}
              </div>
            </section>

            <section className="executive-card executive-card--clickable" role="button" tabIndex={0} onClick={() => editProjectStep(0)} onKeyDown={(e) => e.key === 'Enter' ? editProjectStep(0) : null}>
              <h2>معرفی کارشناس</h2>
              <div className="executive-row-list">
                {expertInfoRows.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}
              </div>
            </section>

            <section className="executive-card executive-card--wide executive-card--clickable" role="button" tabIndex={0} onClick={() => editProjectStep(5)} onKeyDown={(e) => e.key === 'Enter' ? editProjectStep(5) : null}>
              <h2>نتیجه خلاصه محاسبات</h2>
              <div className="executive-metric-grid">
                {calculationSummaryRows.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}
              </div>
            </section>

            <section className="executive-card executive-card--wide executive-card--clickable" role="button" tabIndex={0} onClick={() => editProjectStep(5)} onKeyDown={(e) => e.key === 'Enter' ? editProjectStep(5) : null}>
              <h2>تجهیزات مورد نیاز مصرف کننده</h2>
              <div className="executive-equipment-table">
                {requiredEquipmentRows.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}
              </div>
            </section>
          </div>

          <footer className="executive-summary-footer">
            این خلاصه برای برآورد و طراحی اولیه مهندسی تهیه شده و اجرای نهایی نیازمند بررسی شرایط محل نصب، کابل کشی و حفاظت است.
          </footer>
        </section>

        <section className="pdf-page-section report-page">
          <section className="metric-grid metric-grid--tight">
            <MetricCard label="نیاز واقعی اجرا" value={`${formatNumber(summary.demandPowerW)} W`} accent="green" />
            <MetricCard label={summary.systemType === 'backup' ? 'زمان موردنیاز مشتری' : 'روزهای خودکفایی'} value={summary.systemType === 'backup' ? `${formatNumber(activeProject.form.backupHours, 1)} h` : `${formatNumber(activeProject.form.daysAutonomy || 0, 1)} روز`} accent="purple" />
            <MetricCard label={summary.systemType === 'backup' ? 'زمان برق اضطراری واقعی' : 'تولید روزانه پنل'} value={summary.systemType === 'backup' ? `${formatNumber(displayBattery.realBackupHours, 1)} h` : `${formatNumber(pv?.estimatedDailyProductionWh || 0)} Wh`} accent="purple" />
            <MetricCard label="بانک باتری" value={`${formatNumber(displayBattery.totalCount)} عدد / ${displayBattery.seriesCount === 1 ? `${displayBattery.parallelCount} موازی` : `${displayBattery.seriesCount} سری × ${displayBattery.parallelCount} موازی`}`} accent="green" />
            {summary.systemType !== 'backup' ? <MetricCard label="آرایه پنل" value={`${formatNumber(summary.panelCount)} عدد / ${pv?.panelSeriesCount || 0}S × ${pv?.panelParallelCount || 0}P`} accent="blue" /> : null}
            <MetricCard label="کابل باتری" value={`${formatNumber(summary.batteryCableSizeMm2, 1)} mm²`} accent="amber" />
            <MetricCard label="فیوز AC" value={summary.acFuseA ? `${formatNumber(summary.acFuseA)} A` : '—'} accent="amber" />
          </section>
        </section>

        {summary.systemType !== 'backup' ? (
          <section className="pdf-page-section report-page">
            <ClimateOutputPanel form={activeProject.form} pv={pv} />
          </section>
        ) : null}

        <section className="pdf-page-section report-page">
          <div className="output-grid output-grid--single-export">
            <section className="panel">
              <div className="panel__header"><h2>خلاصه فنی</h2></div>
              <div className="summary-list">
                <div><span>نوع سیستم</span><strong>{formatSystemType(summary.systemType)}</strong></div>
                <div><span>روش محاسبه</span><strong>{formatCalculationMode(summary.calculationMode)}</strong></div>
                <div><span>بار متصل / بار مؤثر</span><strong>{formatNumber(loads.connectedPowerW)} W / {formatNumber(loads.demandPowerW)} W</strong></div>
                <div><span>بار ظاهری / PF میانگین</span><strong>{formatNumber(loads.demandApparentVA)} VA / {formatNumber(loads.averagePowerFactor, 2)}</strong></div>
                <div><span>توان پیک / Surge</span><strong>{formatNumber(loads.peakLoadPowerW)} W / {formatNumber(loads.surgePowerW)} W</strong></div>
                <div><span>تعداد کل باتری</span><strong>{formatNumber(displayBattery.totalCount)}</strong></div>
                <div><span>آرایش باتری</span><strong>{displayBattery.seriesCount === 1 ? `${displayBattery.parallelCount} موازی` : `${displayBattery.seriesCount} سری / ${displayBattery.parallelCount} موازی`}</strong></div>
                {displayBattery.seriesCount > 1 ? <div><span>دلیل سری شدن باتری</span><strong>{`برای رسیدن از باتری ${formatNumber(activeProject.form.batteryUnitVoltage)}V به ولتاژ بانک ${formatNumber(activeProject.form.systemVoltage)}V، تعداد ${displayBattery.seriesCount} عدد در هر رشته سری می‌شود.`}</strong></div> : <div><span>منطق ولتاژ باتری</span><strong>{`ولتاژ باتری ${formatNumber(activeProject.form.batteryUnitVoltage)}V با ولتاژ سانورتر ${formatNumber(activeProject.form.systemVoltage)}V همخوان است؛ سری کردن لازم نیست.`}</strong></div>}
                <div><span>دلیل موازی شدن باتری</span><strong>{`برای افزایش ظرفیت Ah و تأمین زمان/روز موردنیاز، ${displayBattery.parallelCount} رشته مشابه با هم موازی می‌شوند.`}</strong></div>
                <div><span>ظرفیت نامی بانک</span><strong>{formatNumber(displayBattery.bankNominalAh)} Ah</strong></div>
                <div><span>Charge / Discharge C-rate</span><strong>{formatNumber(displayBattery.chargeCRate, 2)} / {formatNumber(displayBattery.dischargeCRate, 2)} C</strong></div>
                {summary.systemType === 'offgrid' ? <div><span>بکاپ در بار پیک</span><strong>{formatNumber(summary.batteryBackupHoursAtPeak, 1)} h</strong></div> : null}
                {summary.systemType === 'offgrid' ? <div><span>خودکفایی بر اساس مصرف روزانه</span><strong>{formatNumber(summary.batteryAutonomyDays, 2)} روز</strong></div> : null}
                <div><span>{summary.systemType === 'backup' ? 'توان سانورتر' : 'توان اینورتر'}</span><strong>{formatNumber(inverter.continuousPowerW)} W / {formatNumber(inverter.continuousPowerVA)} VA</strong></div>
                <div><span>Surge خروجی</span><strong>{formatNumber(inverter.surgePowerW)} W / {formatNumber(inverter.surgePowerVA)} VA</strong></div>
                {pv ? <div><span>PR طراحی</span><strong>{formatNumber(pv.performanceRatio, 2)}</strong></div> : null}
                {pv ? <div><span>پنل انتخابی</span><strong>{`${formatNumber(activeProject.form.panelWatt)}W / Vmp ${formatNumber(activeProject.form.panelVmp)}V / Voc ${formatNumber(activeProject.form.panelVoc)}V`}</strong></div> : null}
                {pv ? <div><span>رشته پنل (سری × موازی)</span><strong>{pv.panelSeriesCount} × {pv.panelParallelCount}</strong></div> : null}
                {pv ? <div><span>علت سری / موازی پنل</span><strong>{`سری برای ساخت ولتاژ مناسب MPPT و موازی برای رسیدن به تعداد کل ${formatNumber(pv.panelCount)} پنل و توان ${formatNumber(pv.installedPvPowerW)}W است.`}</strong></div> : null}
                {pv ? <div><span>String Vmp / Voc(cold)</span><strong>{formatNumber(pv.stringVmp)} / {formatNumber(pv.stringVocCold)} V</strong></div> : null}
                {pv ? <div><span>تولید روزانه تخمینی</span><strong>{formatNumber(pv.estimatedDailyProductionWh)} Wh</strong></div> : null}
                {summary.systemType === 'gridtie' ? <div><span>واردات / صادرات شبکه</span><strong>{formatNumber(summary.gridImportWh)} / {formatNumber(summary.gridExportWh)} Wh</strong></div> : null}
              </div>
            </section>

            <section className="panel">
              <div className="panel__header"><h2>کنترلر، کابل و حفاظت</h2></div>
              <div className="summary-list">
                {summary.systemType !== 'backup' ? <div><span>نوع MPPT داخلی</span><strong>{controller?.controllerType ?? '—'}</strong></div> : null}
                {summary.systemType !== 'backup' ? <div><span>جریان MPPT داخلی / انتخابی</span><strong>{controller ? `${formatNumber(controller.requiredCurrentA, 1)} / ${controller.controllerCount > 1 ? `${controller.controllerCount} × ${formatNumber(controller.perControllerA)}` : formatNumber(controller.selectedCurrentA)} A` : '—'}</strong></div> : null}
                {summary.systemType !== 'backup' ? <div><span>کابل DC پنل</span><strong>{pv ? `${formatNumber(cabling.dcCableSizeMm2, 1)} mm² | افت ${formatNumber(cabling.dcVoltageDropPercent, 2)}%` : '—'}</strong></div> : null}
                <div><span>کابل باتری</span><strong>{`${formatNumber(cabling.batteryCableSizeMm2, 1)} mm² | افت ${formatNumber(cabling.batteryVoltageDropPercent, 2)}%`}</strong></div>
                <div><span>کابل AC خروجی</span><strong>{`${formatNumber(cabling.acCableSizeMm2, 1)} mm² | افت ${formatNumber(cabling.acVoltageDropPercent, 2)}%`}</strong></div>
                {summary.systemType !== 'backup' ? <div><span>فیوز DC پنل</span><strong>{protection?.dcFuseA ? `${formatNumber(protection.dcFuseA)} A` : '—'}</strong></div> : null}
                <div><span>فیوز باتری</span><strong>{protection?.batteryFuseA ? `${formatNumber(protection.batteryFuseA)} A` : '—'}</strong></div>
                <div><span>فیوز AC</span><strong>{protection?.acFuseA ? `${formatNumber(protection.acFuseA)} A` : '—'}</strong></div>
                <div><span>کلید DC Disconnect</span><strong>{protection?.dcDisconnectRating || '—'}</strong></div>
                <div><span>SPD</span><strong>{protection?.spdRequired ? 'پیشنهاد می شود' : 'ضروری نیست'}</strong></div>
              </div>
            </section>
          </div>

          <section className="panel panel--full">
            <div className="panel__header"><h2>تجهیزات انتخاب‌شده</h2></div>
            <div className="equipment-output-grid">
              {summary.systemType !== 'backup' ? <EquipmentCard title="پنل خورشیدی" item={panelItem} /> : null}
              <EquipmentCard title="باتری" item={batteryItem} />
              <EquipmentCard title={summary.systemType === 'backup' ? 'سانورتر' : 'اینورتر'} item={inverterItem} />
            </div>
          </section>

          {summary.systemType === 'backup' ? <BackupScenarioTable scenarios={battery.scenarios} /> : null}

          <section className="panel panel--full">
            <div className="panel__header">
              <h2>تحلیل صنعتی قابلیت اجرا</h2>
              <span className="badge">V6 Industrial</span>
            </div>
            <div className="summary-list">
              <div><span>امتیاز صنعتی</span><strong>{formatNumber(industrial?.serviceabilityScore || 0)} / 100</strong></div>
              <div><span>پوشش زمان پشتیبانی</span><strong>{formatNumber((industrial?.backupCoverageRatio || 0) * 100, 0)} %</strong></div>
              <div><span>زمان پشتیبانی هدف / واقعی</span><strong>{formatNumber(industrial?.requiredBackupHours || 0, 1)} h / {formatNumber(industrial?.realBackupHours || 0, 1)} h</strong></div>
              <div><span>جریان DC دائم / لحظه‌ای</span><strong>{formatNumber(industrial?.dcCurrentAtDemandA || 0, 1)} A / {formatNumber(industrial?.dcCurrentAtSurgeA || 0, 1)} A</strong></div>
              <div><span>ولتاژ DC پیشنهادی</span><strong>{formatNumber(industrial?.recommendedDcVoltage || activeProject.form.systemVoltage)} V</strong></div>
              {summary.systemType !== 'backup' ? <div><span>پوشش انرژی PV</span><strong>{formatNumber((industrial?.pvCoverageRatio || 0) * 100, 0)} %</strong></div> : null}
              {summary.systemType !== 'backup' ? <div><span>کمبود / مازاد انرژی PV</span><strong>{formatNumber(industrial?.pvShortageWh || 0)} / {formatNumber(industrial?.pvSurplusWh || 0)} Wh</strong></div> : null}
              <div><span>استفاده از ظرفیت اینورتر</span><strong>{formatNumber(industrial?.inverterUtilizationPercent || 0, 0)} %</strong></div>
            </div>
            {industrial?.actionItems?.length ? (
              <div className="advisor-list">
                {industrial.actionItems.map((item) => <div key={item} className="advisor-card advisor-card--warning"><strong>اقدام پیشنهادی</strong><span>{item}</span></div>)}
              </div>
            ) : <p className="section-note">در این مرحله اقدام بحرانی برای اصلاح طراحی تشخیص داده نشد.</p>}
          </section>

          <section className="panel panel--full">
            <div className="panel__header">
              <h2>Validation مهندسی هوشمند</h2>
              <span className="badge">{validation?.summary?.label || "Engineering Validation"}</span>
            </div>
            <div className="summary-list">
              <div><span>امتیاز اعتبارسنجی</span><strong>{formatNumber(validation?.summary?.score || 0)} / 100</strong></div>
              <div><span>درجه طراحی</span><strong>{validation?.summary?.grade || "—"}</strong></div>
              <div><span>خطا / هشدار</span><strong>{formatNumber(validation?.summary?.counts?.error || 0)} / {formatNumber(validation?.summary?.counts?.warning || 0)}</strong></div>
            </div>
            <div className="advisor-list">
              {(validation?.checks || []).map((item) => (
                <div key={item.id} className={`advisor-card advisor-card--${item.severity}`}>
                  <strong>{item.title}</strong>
                  <p>{item.message}</p>
                  {item.recommendation ? <p><b>اقدام پیشنهادی:</b> {item.recommendation}</p> : null}
                </div>
              ))}
            </div>
          </section>

          <section className="panel panel--full">
            <div className="panel__header"><h2>تحلیل Advisor</h2></div>
            <AdvisorList messages={advisor} />
          </section>
        </section>

        {simulation ? (
          <section className="pdf-page-section report-page">
            <section className="metric-grid metric-grid--simulation">
              <MetricCard label="حداقل SOC" value={`${formatNumber(simulation.summary.minSocPercent, 1)} %`} accent="green" />
              <MetricCard label="حداکثر SOC" value={`${formatNumber(simulation.summary.maxSocPercent, 1)} %`} accent="green" />
              <MetricCard label="ساعات کمبود انرژی" value={`${formatNumber(simulation.summary.deficitHours)} ساعت`} accent="amber" />
              <MetricCard label="انرژی تامین نشده" value={`${formatNumber(simulation.summary.unservedLoadWh)} Wh`} accent="amber" />
              <MetricCard label="انرژی مازاد" value={`${formatNumber(simulation.summary.surplusEnergyWh)} Wh`} accent="blue" />
              <MetricCard label="بار تامین شده" value={`${formatNumber(simulation.summary.totalLoadServedWh)} Wh`} accent="purple" />
              {(summary.systemType === 'gridtie' || summary.systemType === 'hybrid') ? <MetricCard label="واردات شبکه" value={`${formatNumber(simulation.summary.gridImportWh)} Wh`} accent="amber" /> : null}
              {(summary.systemType === 'gridtie' || summary.systemType === 'hybrid') ? <MetricCard label="صادرات شبکه" value={`${formatNumber(simulation.summary.gridExportWh)} Wh`} accent="blue" /> : null}
            </section>
            <div className="simulation-grid">
              {summary.systemType !== 'gridtie' ? <SimpleLineChart title="SOC باتری در طول شبانه روز" labels={simulation.series.labels} values={simulation.series.socPercent} suffix="%" /> : null}
              <SimpleLineChart title={summary.systemType === 'backup' ? 'مصرف بار در برابر دشارژ باتری' : 'تولید پنل در برابر مصرف بار'} labels={simulation.series.labels} values={simulation.series.loadWh} secondaryValues={summary.systemType === 'backup' ? simulation.series.deficitWh.map((v, i) => Math.max((simulation.series.loadWh[i] || 0) - v, 0)) : simulation.series.pvWh} suffix="Wh" />
              <SimpleLineChart title={summary.systemType === 'backup' ? 'کمبود انرژی ساعتی' : 'کمبود و اضافه تولید ساعتی'} labels={simulation.series.labels} values={simulation.series.deficitWh} secondaryValues={summary.systemType === 'backup' ? undefined : simulation.series.surplusWh} suffix="Wh" />
              {(summary.systemType === 'gridtie' || summary.systemType === 'hybrid') ? <SimpleLineChart title="واردات و صادرات شبکه" labels={simulation.series.labels} values={simulation.series.gridImportWh} secondaryValues={simulation.series.gridExportWh} suffix="Wh" /> : null}
              {summary.systemType !== 'backup' ? <SimpleBarChart title="تخمین تولید ماهانه آرایه" items={simulation.series.monthlyProduction} suffix="Wh" /> : null}
            </div>
          </section>
        ) : null}
      </div>

      {activeRecord ? (
        <section className="panel panel--full">
          <div className="panel__header">
            <h2>تاریخچه نسخه‌ها</h2>
            <span className="badge">{projectVersions.length} نسخه</span>
          </div>
          <div className="version-list">
            {projectVersions.slice().reverse().map((version) => (
              <button
                key={version.id}
                type="button"
                className={`version-item ${activeProject.versionId === version.id ? 'is-active' : ''}`}
                onClick={() => openProject(activeRecord.id, version.id)}
              >
                <strong>{version.label}</strong>
                <span>تاریخ: {new Date(version.createdAt).toLocaleDateString('fa-IR')}</span>
                <span>بار موثر: {formatNumber(version.summary?.demandPowerW || 0)} W</span>
                <span>انرژی: {formatNumber(version.summary?.totalDailyEnergyWh || 0)} Wh</span>
                <span>باتری: {formatNumber(version.summary?.batteryAh || 0)} Ah</span>
                {version.summary?.systemType !== 'backup' ? <span>پنل: {formatNumber(version.summary?.panelCount || 0)}</span> : <span>سانورتر و باتری</span>}
              </button>
            ))}
          </div>
          <div className="action-bar">
            <button className="btn btn--ghost" onClick={() => openWorkspace(activeRecord.id)}>ویرایش پیش نویس جاری</button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
