function nextStandard(current) {
  const ratings = [2, 4, 6, 10, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400];
  return ratings.find((rating) => rating >= current) ?? Math.ceil(current / 10) * 10;
}

export function calculateProtection(input, cabling, controller, inverter) {
  const dcFuseA = controller ? nextStandard((controller.perControllerA ?? controller.selectedCurrentA) * 1.25) : 0;
  const batteryFuseA = nextStandard(cabling.batteryCurrentA * 1.25);
  const acFuseA = nextStandard(cabling.acCurrentA * 1.25);
  const dcDisconnectRating = controller ? `${nextStandard(Math.max(controller.perControllerA ?? controller.selectedCurrentA, cabling.dcPvCurrentA / Math.max(controller.controllerCount ?? 1, 1)) * 1.25)}A / ${input.controllerMaxVoc}VDC` : '—';
  const acBreakerRating = `${acFuseA}A / ${input.loadVoltage}VAC`;
  const spdRequired = input.systemType !== 'backup';

  return {
    dcFuseA,
    batteryFuseA,
    acFuseA,
    dcDisconnectRating,
    acBreakerRating,
    spdRequired,
  };
}
