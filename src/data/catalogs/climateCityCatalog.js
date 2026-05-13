export const climateCityCatalog = [
  {
    id: "ir_tehran",
    country: "Iran",
    city: "Tehran",
    latitude: 35.6892,
    longitude: 51.389,
    defaultPeakSunHours: 5.1,
    minTemperatureC: -5,
    maxTemperatureC: 42
  },
  {
    id: "ir_shiraz",
    country: "Iran",
    city: "Shiraz",
    latitude: 29.5918,
    longitude: 52.5837,
    defaultPeakSunHours: 5.6,
    minTemperatureC: -2,
    maxTemperatureC: 44
  },
  {
    id: "ir_tabriz",
    country: "Iran",
    city: "Tabriz",
    latitude: 38.0962,
    longitude: 46.2738,
    defaultPeakSunHours: 4.8,
    minTemperatureC: -15,
    maxTemperatureC: 38
  }
];

export function findClimateCity(id) {
  return climateCityCatalog.find((item) => item.id === id) || null;
}
