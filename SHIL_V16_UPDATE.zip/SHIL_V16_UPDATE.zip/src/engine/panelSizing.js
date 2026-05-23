export function calculatePanels(
  energy,
  sunHours,
  panelPower
) {

  return Math.ceil(
    energy /
    (sunHours * panelPower)
  );
}
