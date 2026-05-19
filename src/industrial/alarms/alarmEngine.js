export function evaluateAlarms(data = {}) {
  const alarms = [];

  if ((data.temperature || 0) > 65) {
    alarms.push({
      level: "danger",
      title: "دمای بالا",
      message: "دمای اینورتر از حد مجاز بالاتر است.",
    });
  }

  if ((data.batterySoc || 0) < 20) {
    alarms.push({
      level: "warning",
      title: "باتری کم",
      message: "شارژ باتری پایین است.",
    });
  }

  if ((data.pvPower || 0) === 0 && data.gridStatus !== "NIGHT") {
    alarms.push({
      level: "warning",
      title: "عدم تولید PV",
      message: "توان پنل صفر است؛ ورودی PV بررسی شود.",
    });
  }

  return alarms;
}
