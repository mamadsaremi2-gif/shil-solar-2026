export function runEmergencySizing(data) {

  const loadPower =
    Number(data.loadPower || 0);

  const backupHours =
    Number(data.backupHours || 2);

  const batteryVoltage =
    Number(data.batteryVoltage || 24);

  const inverterPower =
    Math.ceil(loadPower * 1.25);

  const batteryAh =
    Math.ceil(
      (loadPower * backupHours) /
      batteryVoltage
    );

  return {
    inverterPower,
    batteryAh,
  };
}
