export const scenarioLibrary = Array.from({ length: 600 }, (_, i) => {
  const id = i + 1;
  const domain = id <= 300 ? "solar" : "emergency";
  const levelIndex = id % 3;
  const level = levelIndex === 0 ? "سنگین" : levelIndex === 1 ? "سبک" : "متوسط";

  return {
    id,
    domain,
    level,
    category: domain === "solar" ? "پروژه های انرژی خورشیدی" : "پروژه های برق اضطراری",
    title: `${domain === "solar" ? "پروژه های انرژی خورشیدی" : "پروژه های برق اضطراری"} - سناریوی ${level} ${id}`,
    loadEstimate: 1000 + id * 25,
    inverter: domain === "solar" ? "اینورتر خورشیدی" : "اینورتر خورشیدی + باتری",
    batteryType: "Lithium / AGM",
    suggestedBattery: "48V",
    suggestedPanels: domain === "solar" ? Math.ceil(id / 10) : 0
  };
});

export function getScenarioList(domain, level) {
  return scenarioLibrary.filter((item) => {
    const domainOk = !domain || item.domain === domain;
    const levelOk = !level || item.level === level || item.title.includes(level);
    return domainOk && levelOk;
  });
}
