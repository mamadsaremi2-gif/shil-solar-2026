export const voltageRule = Object.freeze({
  id: 'voltage',
  title: 'انتخاب سطح ولتاژ DC',
  version: '1.0.0',
  run(_input = {}, result = {}) {
    const vString = result.values?.stringVocCold || result.values?.stringVmp || 0;
    let dcVoltageLevel = null;
    if (vString <= 0) dcVoltageLevel = 'نامشخص';
    else if (vString <= 550) dcVoltageLevel = '600VDC';
    else if (vString <= 900) dcVoltageLevel = '1000VDC';
    else if (vString <= 1200) dcVoltageLevel = '1500VDC';
    else dcVoltageLevel = 'نیازمند بازطراحی String';

    return {
      values: { dcVoltageLevel },
      warnings: vString > 1200 ? [{ code: 'DC_VOLTAGE_TOO_HIGH', message: 'سطح ولتاژ DC از 1200V بالاتر رفته است.' }] : [],
      explanations: [{ rule: 'voltage', message: `سطح پیشنهادی حفاظت DC: ${dcVoltageLevel}.` }],
    };
  },
});
