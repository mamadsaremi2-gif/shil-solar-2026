import { sum, max } from "../utils/engineeringMath.js";

export class LoadProfileBuilder {
  constructor() {
    this.items = [];
  }

  addLoad({
    id,
    name,
    quantity = 1,
    powerW,
    hoursPerDay = 0,
    simultaneityFactor = 1,
    surgeFactor = 1,
    category = "general"
  }) {
    if (!powerW || powerW <= 0) throw new Error("Load powerW must be greater than zero.");

    this.items.push({
      id: id || `load_${this.items.length + 1}`,
      name: name || "Unnamed Load",
      quantity,
      powerW,
      hoursPerDay,
      simultaneityFactor,
      surgeFactor,
      category
    });

    return this;
  }

  build() {
    const dailyEnergyWh = sum(
      this.items.map((item) => item.quantity * item.powerW * item.hoursPerDay)
    );

    const connectedPowerW = sum(
      this.items.map((item) => item.quantity * item.powerW)
    );

    const peakLoadW = sum(
      this.items.map((item) => item.quantity * item.powerW * item.simultaneityFactor)
    );

    const surgeLoadW = max(
      this.items.map((item) => item.quantity * item.powerW * item.surgeFactor)
    );

    const byCategory = this.items.reduce((acc, item) => {
      const energy = item.quantity * item.powerW * item.hoursPerDay;
      acc[item.category] = (acc[item.category] || 0) + energy;
      return acc;
    }, {});

    return {
      items: [...this.items],
      dailyEnergyWh,
      connectedPowerW,
      peakLoadW,
      surgeLoadW,
      byCategory
    };
  }
}

export function buildLoadProfile(loads = []) {
  const builder = new LoadProfileBuilder();
  for (const load of loads) builder.addLoad(load);
  return builder.build();
}
