function emptyHours() {
  return Array.from({ length: 24 }, (_, hour) => ({ hour, powerW: 0, energyWh: 0, loads: [] }));
}

export class HourlyLoadProfileEngine {
  constructor(loads = []) {
    this.loads = loads;
  }

  addLoad(load) {
    this.loads.push(load);
    return this;
  }

  build() {
    const hours = emptyHours();

    for (const load of this.loads) {
      const schedule = load.schedule || [];
      const quantity = load.quantity ?? 1;
      const powerW = load.powerW ?? 0;
      const simultaneityFactor = load.simultaneityFactor ?? 1;

      for (const hour of schedule) {
        if (hour < 0 || hour > 23) continue;
        const contributionW = quantity * powerW * simultaneityFactor;
        hours[hour].powerW += contributionW;
        hours[hour].energyWh += contributionW;
        hours[hour].loads.push(load.name || load.id || "load");
      }
    }

    const dailyEnergyWh = hours.reduce((sum, item) => sum + item.energyWh, 0);
    const peakHour = hours.reduce((best, item) => item.powerW > best.powerW ? item : best, hours[0]);
    const loadFactor = peakHour.powerW > 0 ? dailyEnergyWh / (peakHour.powerW * 24) : 0;

    return {
      hours,
      dailyEnergyWh,
      peakLoadW: peakHour.powerW,
      peakHour: peakHour.hour,
      loadFactor,
      loadCount: this.loads.length
    };
  }
}

export function buildHourlyLoadProfile(loads = []) {
  return new HourlyLoadProfileEngine(loads).build();
}
