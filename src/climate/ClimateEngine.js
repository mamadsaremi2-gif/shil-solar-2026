import { monthlyClimateData } from "./monthlyClimateData.js";

export class ClimateEngine {
  constructor(data = monthlyClimateData) {
    this.data = data;
  }

  getCity(cityId) {
    return this.data[cityId] || null;
  }

  summarize(cityId) {
    const city = this.getCity(cityId);
    if (!city) throw new Error(`Unknown climate city: ${cityId}`);

    const avg = (values) => values.reduce((a, b) => a + b, 0) / values.length;
    const min = (values) => Math.min(...values);
    const max = (values) => Math.max(...values);

    return {
      city: city.city,
      country: city.country,
      averagePeakSunHours: avg(city.monthlyPeakSunHours),
      annualPeakSunHours: city.monthlyPeakSunHours.reduce((total, psh) => total + psh * 30, 0),
      minTemperatureC: min(city.monthlyMinTempC),
      maxTemperatureC: max(city.monthlyMaxTempC),
      averageTemperatureC: avg(city.monthlyAvgTempC)
    };
  }

  estimateMonthlyPV(form, cityId) {
    const city = this.getCity(cityId);
    if (!city) throw new Error(`Unknown climate city: ${cityId}`);

    const arrayPowerW = form.pv.panelPowerW * form.pv.seriesCount * form.pv.parallelCount;
    const lossFactor = 1 - (
      form.environment.irradianceLossPercent +
      form.environment.soilingLossPercent +
      form.environment.shadingLossPercent
    ) / 100;

    return city.monthlyPeakSunHours.map((psh, index) => ({
      month: index + 1,
      peakSunHours: psh,
      estimatedEnergyWh: arrayPowerW * psh * 30 * Math.max(lossFactor, 0),
      avgTemperatureC: city.monthlyAvgTempC[index]
    }));
  }

  findWorstMonth(cityId) {
    const city = this.getCity(cityId);
    if (!city) throw new Error(`Unknown climate city: ${cityId}`);

    let index = 0;
    for (let i = 1; i < city.monthlyPeakSunHours.length; i += 1) {
      if (city.monthlyPeakSunHours[i] < city.monthlyPeakSunHours[index]) index = i;
    }

    return {
      month: index + 1,
      peakSunHours: city.monthlyPeakSunHours[index],
      avgTemperatureC: city.monthlyAvgTempC[index]
    };
  }
}
