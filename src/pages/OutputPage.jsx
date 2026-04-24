import { useMemo, useRef, useState } from 'react';
import { useProjectStore } from '../app/store/projectStore';
import { MetricCard } from '../shared/components/MetricCard';
import { formatNumber } from '../shared/utils/format';
import { AdvisorList } from '../features/engineering-output/components/AdvisorList';
import { SimpleBarChart, SimpleLineChart } from '../features/simulation/components/SimpleCharts';
import { EquipmentRepository } from '../data/repositories/EquipmentRepository';
import { PUBLIC_ASSETS } from '../shared/constants/publicAssets';

function formatSystemType(value) {
  const map = {
    backup: 'سانورتر و باطری',
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

function formatEquipmentLabel(item) {
  if (!item) return 'ورود دستی';
  return `${item.title}${item.isCustom ? ' (سفارشی)' : ''}`;
}

function renderEquipmentSpecs(item) {
  if (!item?.specs) return [];
  const specs = item.specs;
  const rows = [];

  if (item.category === 'panel') {
    if (specs.panelWatt) rows.push(['توان پنل', `${formatNumber(specs.panelWatt)} W`]);
    if (specs.panelType) rows.push(['نوع پنل', specs.panelType]);
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

  if (item.category === 'controller') {
    if (specs.controllerType) rows.push(['نوع', specs.controllerType]);
    if (specs.controllerMaxVoc) rows.push(['حداکثر Voc', `${formatNumber(specs.controllerMaxVoc)} V`]);
    if (specs.mpptMinVoltage || specs.mpptMaxVoltage) {
      rows.push(['بازه MPPT', `${formatNumber(specs.mpptMinVoltage || 0)} تا ${formatNumber(specs.mpptMaxVoltage || 0)} V`]);
    }
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
        <h2>سناریوهای مختلف بانک باطری</h2>
        <span className="badge">برای سانورترهای 12 / 24 / 48 ولت</span>
      </div>
      <p className="section-note">برای هر ولتاژ سانورتر و ظرفیت باطری، تعداد سری، موازی، تعداد کل و زمان بکاپ واقعی نشان داده شده است.</p>
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
                    <th>باطری</th>
                    <th>ظرفیت هر باطری</th>
                    <th>سری</th>
                    <th>موازی</th>
                    <th>تعداد کل</th>
                    <th>ظرفیت بانک</th>
                    <th>زمان بکاپ واقعی</th>
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
  const { activeProject, activeRecord, projectVersions, goDashboard, openProject, openWorkspace, saveProjectVersion } = useProjectStore();
  const output = activeProject.result;
  const reportRef = useRef(null);
  const [isExporting, setIsExporting] = useState(false);

  if (!output?.ok) {
    return <div className="shell"><div className="panel empty-state">محاسبات معتبر موجود نیست.</div></div>;
  }

  const { summary, battery, pv, inverter, controller, cabling, protection, loads, simulation, advisor } = output.result;
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
    ['کارشناس طراحی', 'مهندس صارمی'],
    ['مجموعه', 'SHILIRAN GROUP'],
    ['وب سایت', 'SHIL.IR'],
    ['نوع گزارش', summary.systemType === 'backup' ? 'سانورتر و باطری' : 'طراحی سیستم خورشیدی'],
    ['وضعیت طراحی', designStatusLabel],
  ];

  const calculationSummaryRows = [
    ['بار موثر مصرف کننده', `${formatNumber(summary.demandPowerW)} W`],
    [summary.systemType === 'backup' ? 'انرژی مصرفی' : 'انرژی روزانه', `${formatNumber(summary.totalDailyEnergyWh)} Wh`],
    ['زمان پشتیبانی واقعی', `${formatNumber(summary.batteryBackupHours, 1)} h`],
    ['ولتاژ سیستم', `${formatNumber(activeProject.form.systemVoltage)} V`],
    ['ظرفیت موردنیاز باتری', `${formatNumber(summary.batteryAh)} Ah`],
    ['توان پیک / راه اندازی', `${formatNumber(loads.surgePowerW)} W`],
  ];

  const requiredEquipmentRows = [
    [summary.systemType === 'backup' ? 'سانورتر پیشنهادی' : 'اینورتر پیشنهادی', `${formatNumber(summary.inverterPowerW)} W / Surge ${formatNumber(summary.inverterSurgePowerW)} W`],
    ['بانک باتری', `${formatNumber(battery.totalCount)} عدد - ${battery.seriesCount} سری × ${battery.parallelCount} موازی`],
    ['مشخصات باتری', `${formatNumber(activeProject.form.batteryUnitVoltage)}V ${formatNumber(activeProject.form.batteryUnitAh)}Ah - ${battery.chemistry}`],
    ['کابل باتری', `${formatNumber(cabling.batteryCableSizeMm2, 1)} mm²`],
    ['فیوز باتری / AC', `${protection?.batteryFuseA ? formatNumber(protection.batteryFuseA) : '—'} A / ${protection?.acFuseA ? formatNumber(protection.acFuseA) : '—'} A`],
  ];

  if (summary.systemType !== 'backup') {
    requiredEquipmentRows.splice(1, 0, ['آرایه پنل', `${formatNumber(summary.panelCount)} عدد - ${formatNumber(summary.pvInstalledPowerW)} W`]);
    requiredEquipmentRows.push(['شارژ کنترلر', `${controller?.controllerType ?? '—'} - ${controller?.selectedCurrentA ? formatNumber(controller.selectedCurrentA) : '—'} A`]);
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
        <button className="btn btn--ghost" onClick={goDashboard}>داشبورد</button>
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
            <span className="eyebrow">Executive Summary</span>
            <h1>{projectTitle}</h1>
            <p>{summary.systemType === 'backup' ? 'جمع بندی یک صفحه ای طراحی سانورتر و باطری، شامل معرفی مشتری، معرفی کارشناس، نتیجه خلاصه محاسبات و تجهیزات مورد نیاز مصرف کننده.' : 'جمع بندی یک صفحه ای طراحی سیستم خورشیدی، شامل مشخصات مشتری، کارشناس، خلاصه محاسبات و تجهیزات اصلی مورد نیاز.'}</p>
          </div>

          <div className="executive-summary-grid">
            <section className="executive-card">
              <h2>معرفی مشتری</h2>
              <div className="executive-row-list">
                {customerInfoRows.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}
              </div>
            </section>

            <section className="executive-card">
              <h2>معرفی کارشناس</h2>
              <div className="executive-row-list">
                {expertInfoRows.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}
              </div>
            </section>

            <section className="executive-card executive-card--wide">
              <h2>نتیجه خلاصه محاسبات</h2>
              <div className="executive-metric-grid">
                {calculationSummaryRows.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}
              </div>
            </section>

            <section className="executive-card executive-card--wide">
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
          <section className="report-cover panel report-cover--hero report-cover--with-bg" style={{ backgroundImage: `linear-gradient(135deg, rgba(8,17,31,0.82), rgba(15,23,42,0.70)), url(${PUBLIC_ASSETS.backgrounds.report})` }}>
            <div className="report-cover__text">
              <img className="report-cover__logo" src={PUBLIC_ASSETS.branding.logo} alt="Solar Design Suite" />
              <span className="eyebrow">Solar Design Suite</span>
              <h1>{projectTitle}</h1>
              <p>{summary.systemType === 'backup' ? 'گزارش طراحی سانورتر و باطری شامل خلاصه بار، ظرفیت باطری، توان سانورتر، کابل، حفاظت و تحلیل پشتیبانی روزانه است.' : 'گزارش مهندسی سیستم خورشیدی شامل خلاصه طراحی، نتایج محاسبات، وضعیت باتری، پنل، اینورتر، کنترلر، کابل و حفاظت، به همراه تحلیل شبیه سازی روزانه.'}</p>
            </div>
            <div className="report-cover__meta">
              <div><span>نوع سیستم</span><strong>{formatSystemType(summary.systemType)}</strong></div>
              <div><span>روش محاسبه</span><strong>{formatCalculationMode(summary.calculationMode)}</strong></div>
              <div><span>شهر</span><strong>{activeProject.form.city || '—'}</strong></div>
              <div><span>تاریخ گزارش</span><strong>{projectDate}</strong></div>
              <div><span>وضعیت طراحی</span><strong>{designStatusLabel}</strong></div>
              {summary.systemType === 'hybrid' ? <div><span>استراتژی هیبرید</span><strong>{formatHybridMode(summary.hybridMode)}</strong></div> : null}
              {summary.systemType === 'gridtie' ? <div><span>هدف جبران</span><strong>{formatNumber(summary.targetOffsetPercent)} %</strong></div> : null}
            </div>
          </section>

          <section className="metric-grid metric-grid--tight">
            <MetricCard label="بار مؤثر" value={`${formatNumber(summary.demandPowerW)} W`} />
            <MetricCard label={summary.systemType === 'backup' ? 'انرژی مصرفی' : 'انرژی روزانه'} value={`${formatNumber(summary.totalDailyEnergyWh)} Wh`} accent="green" />
            <MetricCard label="باتری موردنیاز" value={`${formatNumber(summary.batteryAh)} Ah`} accent="purple" />
            <MetricCard label="زمان بکاپ واقعی" value={`${formatNumber(summary.batteryBackupHours, 1)} h`} accent="purple" />
            <MetricCard label={summary.systemType === 'backup' ? 'سانورتر پیشنهادی' : 'اینورتر پیشنهادی'} value={`${formatNumber(summary.inverterPowerW)} W`} accent="amber" />
            <MetricCard label={summary.systemType === 'backup' ? 'Surge سانورتر' : 'Surge اینورتر'} value={`${formatNumber(summary.inverterSurgePowerW)} W`} accent="amber" />
            {summary.systemType !== 'backup' ? <MetricCard label="تعداد پنل" value={formatNumber(summary.panelCount)} accent="green" /> : null}
            {summary.systemType !== 'backup' ? <MetricCard label="توان نصب شده PV" value={`${formatNumber(summary.pvInstalledPowerW)} W`} accent="blue" /> : null}
            {summary.systemType !== 'backup' ? <MetricCard label="کنترلر" value={summary.controllerCurrentA ? `${formatNumber(summary.controllerCurrentA)} A` : '—'} accent="blue" /> : null}
            <MetricCard label="کابل باتری" value={`${formatNumber(summary.batteryCableSizeMm2, 1)} mm²`} accent="amber" />
            <MetricCard label="فیوز AC" value={summary.acFuseA ? `${formatNumber(summary.acFuseA)} A` : '—'} accent="amber" />
            <MetricCard label="افت کابل AC" value={`${formatNumber(cabling.acVoltageDropPercent || 0, 2)} %`} accent="amber" />
          </section>
        </section>

        <section className="pdf-page-section report-page">
          <div className="output-grid output-grid--single-export">
            <section className="panel">
              <div className="panel__header"><h2>خلاصه فنی</h2></div>
              <div className="summary-list">
                <div><span>نوع سیستم</span><strong>{formatSystemType(summary.systemType)}</strong></div>
                <div><span>روش محاسبه</span><strong>{formatCalculationMode(summary.calculationMode)}</strong></div>
                <div><span>بار متصل / بار مؤثر</span><strong>{formatNumber(loads.connectedPowerW)} W / {formatNumber(loads.demandPowerW)} W</strong></div>
                <div><span>توان پیک / Surge</span><strong>{formatNumber(loads.peakLoadPowerW)} W / {formatNumber(loads.surgePowerW)} W</strong></div>
                <div><span>تعداد کل باتری</span><strong>{formatNumber(battery.totalCount)}</strong></div>
                <div><span>سری / موازی</span><strong>{battery.seriesCount} / {battery.parallelCount}</strong></div>
                <div><span>ظرفیت نامی بانک</span><strong>{formatNumber(battery.bankNominalAh)} Ah</strong></div>
                <div><span>Charge / Discharge C-rate</span><strong>{formatNumber(battery.chargeCRate, 2)} / {formatNumber(battery.dischargeCRate, 2)} C</strong></div>
                <div><span>{summary.systemType === 'backup' ? 'توان سانورتر' : 'توان اینورتر'}</span><strong>{formatNumber(inverter.continuousPowerW)} W / {formatNumber(inverter.surgePowerW)} W</strong></div>
                {pv ? <div><span>PR طراحی</span><strong>{formatNumber(pv.performanceRatio, 2)}</strong></div> : null}
                {pv ? <div><span>رشته پنل (سری × موازی)</span><strong>{pv.panelSeriesCount} × {pv.panelParallelCount}</strong></div> : null}
                {pv ? <div><span>String Vmp / Voc(cold)</span><strong>{formatNumber(pv.stringVmp)} / {formatNumber(pv.stringVocCold)} V</strong></div> : null}
                {pv ? <div><span>تولید روزانه تخمینی</span><strong>{formatNumber(pv.estimatedDailyProductionWh)} Wh</strong></div> : null}
                {summary.systemType === 'gridtie' ? <div><span>واردات / صادرات شبکه</span><strong>{formatNumber(summary.gridImportWh)} / {formatNumber(summary.gridExportWh)} Wh</strong></div> : null}
              </div>
            </section>

            <section className="panel">
              <div className="panel__header"><h2>کنترلر، کابل و حفاظت</h2></div>
              <div className="summary-list">
                {summary.systemType !== 'backup' ? <div><span>نوع کنترلر</span><strong>{controller?.controllerType ?? '—'}</strong></div> : null}
                {summary.systemType !== 'backup' ? <div><span>جریان کنترلر / انتخابی</span><strong>{controller ? `${formatNumber(controller.requiredCurrentA, 1)} / ${formatNumber(controller.selectedCurrentA)} A` : '—'}</strong></div> : null}
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
              {summary.systemType !== 'backup' ? <EquipmentCard title="شارژ کنترلر" item={controllerItem} /> : null}
            </div>
          </section>

          {summary.systemType === 'backup' ? <BackupScenarioTable scenarios={battery.scenarios} /> : null}

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
                {version.summary?.systemType !== 'backup' ? <span>پنل: {formatNumber(version.summary?.panelCount || 0)}</span> : <span>سانورتر و باطری</span>}
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
