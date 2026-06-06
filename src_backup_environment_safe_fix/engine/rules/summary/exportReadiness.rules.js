function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

export const exportReadinessRule = Object.freeze({
  id: 'exportReadiness',
  title: 'آماده‌سازی خروجی نهایی، BOM و گزارش بهره‌برداری',
  version: '18.0.0',
  run(_input = {}, result = {}) {
    const summary = result.summary || {};
    const bom = summary.billOfMaterials || result.values?.billOfMaterials || {};
    const protection = safeArray(bom.protection);
    const cables = safeArray(bom.cables?.items);
    const distributed = safeArray(summary.distributedInverterSystems || result.values?.distributedInverterSystems);
    const kpis = summary.engineeringKpis || result.values?.engineeringKpis || {};
    const warnings = safeArray(result.warnings);
    const errors = safeArray(result.errors);

    const ready = errors.length === 0 && Boolean(bom.inverters?.length) && Boolean(bom.panels?.length) && protection.length > 0 && cables.length > 0 && distributed.length > 0;
    const exportPayload = {
      status: ready ? 'READY_FOR_OPERATION' : 'NEEDS_REVIEW',
      generatedBy: 'SHIL V18 Engineering Platform',
      reportSections: ['project', 'environment', 'designPath', 'billOfMaterials', 'mppt', 'protection', 'cables', 'space', 'warnings'],
      bom,
      distributedInverterSystems: distributed,
      kpis,
      warningCount: warnings.length,
      errorCount: errors.length,
    };

    return {
      values: {
        exportReady: ready,
        exportPayload,
        operationalStatus: exportPayload.status,
      },
      summary: {
        ...summary,
        exportReady: ready,
        exportPayload,
        operationalStatus: exportPayload.status,
      },
      explanations: [{ rule: 'exportReadiness', message: ready ? 'خروجی برای PDF/BOM/اشتراک‌گذاری آماده است.' : 'خروجی نیازمند بازبینی قبل از ارائه نهایی است.' }],
    };
  },
});
