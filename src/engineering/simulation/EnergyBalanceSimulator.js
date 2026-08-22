export class EnergyBalanceSimulator {
  constructor({
    batteryCapacityWh = 0,
    initialSocPercent = 50,
    minSocPercent = 10,
    maxSocPercent = 100,
    chargeEfficiency = 0.95,
    dischargeEfficiency = 0.95
  } = {}) {
    this.batteryCapacityWh = batteryCapacityWh;
    this.initialSocPercent = initialSocPercent;
    this.minSocPercent = minSocPercent;
    this.maxSocPercent = maxSocPercent;
    this.chargeEfficiency = chargeEfficiency;
    this.dischargeEfficiency = dischargeEfficiency;
  }

  simulate({ hourlyLoadWh = [], hourlyPVWh = [] }) {
    const hours = Math.max(hourlyLoadWh.length, hourlyPVWh.length);
    const minEnergyWh = this.batteryCapacityWh * this.minSocPercent / 100;
    const maxEnergyWh = this.batteryCapacityWh * this.maxSocPercent / 100;
    let batteryWh = this.batteryCapacityWh * this.initialSocPercent / 100;

    const timeline = [];
    let unmetLoadWh = 0;
    let curtailedWh = 0;
    let gridImportWh = 0;
    let batteryCyclesEquivalent = 0;

    for (let hour = 0; hour < hours; hour += 1) {
      const load = hourlyLoadWh[hour] || 0;
      const pv = hourlyPVWh[hour] || 0;
      let net = pv - load;
      let chargedWh = 0;
      let dischargedWh = 0;
      let unmetWh = 0;
      let curtailedHourWh = 0;

      if (net >= 0) {
        const availableCharge = net * this.chargeEfficiency;
        const room = maxEnergyWh - batteryWh;
        chargedWh = Math.min(room, availableCharge);
        batteryWh += chargedWh;
        curtailedHourWh = Math.max(availableCharge - chargedWh, 0);
        curtailedWh += curtailedHourWh;
      } else {
        const need = Math.abs(net) / this.dischargeEfficiency;
        const available = Math.max(batteryWh - minEnergyWh, 0);
        dischargedWh = Math.min(available, need);
        batteryWh -= dischargedWh;
        unmetWh = Math.max(need - dischargedWh, 0) * this.dischargeEfficiency;
        unmetLoadWh += unmetWh;
        gridImportWh += unmetWh;
      }

      batteryCyclesEquivalent += dischargedWh / Math.max(this.batteryCapacityWh, 1);

      timeline.push({
        hour,
        loadWh: load,
        pvWh: pv,
        batteryWh,
        socPercent: this.batteryCapacityWh > 0 ? (batteryWh / this.batteryCapacityWh) * 100 : 0,
        chargedWh,
        dischargedWh,
        unmetWh,
        curtailedWh: curtailedHourWh
      });
    }

    return {
      timeline,
      unmetLoadWh,
      curtailedWh,
      gridImportWh,
      batteryCyclesEquivalent,
      finalSocPercent: this.batteryCapacityWh > 0 ? (batteryWh / this.batteryCapacityWh) * 100 : 0,
      reliabilityPercent: hours > 0 ? 100 * (1 - timeline.filter((h) => h.unmetWh > 0).length / hours) : 100
    };
  }
}
