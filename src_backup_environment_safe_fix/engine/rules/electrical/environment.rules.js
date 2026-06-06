import { normalizeEngineeringInput } from '../../utils/normalizeEngineeringInput.js';

export const environmentRule = Object.freeze({
  id: 'environment',
  title: 'قوانین محیط و IP تابلو',
  version: '1.0.0',
  run(input = {}, result = {}) {
    const n = result.normalizedInput || normalizeEngineeringInput(input);
    const type = String(n.environmentType || 'roof').toLowerCase();
    let panelboardIp = 'IP40';
    if (type.includes('roof')) panelboardIp = 'IP65';
    else if (type.includes('outdoor')) panelboardIp = 'IP54';
    else if (type.includes('corrosive')) panelboardIp = 'IP65 + ضدخوردگی';
    else if (type.includes('industrial')) panelboardIp = 'IP55/IP65';

    const spdType = type.includes('roof') ? 'Type I+II قابل بررسی / Type II حداقل' : 'Type II';
    return {
      values: { panelboardIp, spdType, environmentType: n.environmentType },
      explanations: [{ rule: 'environment', message: `سطح حفاظت تابلو بر اساس محیط: ${panelboardIp}.` }],
    };
  },
});
