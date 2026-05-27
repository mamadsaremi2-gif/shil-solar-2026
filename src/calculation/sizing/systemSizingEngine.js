export function runSystemSizing(form = {}, selection = {}) {
  return { status: "disabled", valid: true, form, selection, pv: {}, inverter: {}, battery: {}, cable: {}, warnings: [], explanations: ["Sizing engine disabled for clean rebuild."] };
}
