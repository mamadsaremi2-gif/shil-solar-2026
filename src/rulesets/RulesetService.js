import { getActiveRuleset, getRuleset } from "./rulesetRegistry.js";

export class RulesetService {
  constructor(storage, key = "ruleset:selected") {
    this.storage = storage;
    this.key = key;
  }

  async getSelected() {
    const selectedId = await this.storage.getItem(this.key);
    return selectedId ? getRuleset(selectedId) || getActiveRuleset() : getActiveRuleset();
  }

  async select(id) {
    const ruleset = getRuleset(id);
    if (!ruleset) throw new Error(`Unknown ruleset: ${id}`);
    await this.storage.setItem(this.key, id);
    return ruleset;
  }

  applyToForm(form, ruleset) {
    const selected = ruleset || getActiveRuleset();

    return {
      ...form,
      inverter: {
        ...form.inverter,
        maxDcVoltage: Math.min(form.inverter.maxDcVoltage, selected.limits.maxDcVoltageResidential)
      },
      cable: {
        ...form.cable,
        allowedVoltageDropPercent: selected.limits.defaultCableDropPercent
      },
      battery: {
        ...form.battery,
        depthOfDischarge: Math.min(form.battery.depthOfDischarge, selected.limits.defaultBatteryDoD)
      }
    };
  }
}
