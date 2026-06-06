export function generateBOM(result) {

  return [

    {
      title: "Solar Panel",
      qty: result.pv.panelCount,
    },

    {
      title: "Inverter",
      qty: 1,
    },

    {
      title: "Battery Bank",
      qty: Math.ceil(result.battery.batteryKWh / 5),
    },

    {
      title: "DC Protection",
      qty: 1,
    },

    {
      title: "AC Protection",
      qty: 1,
    },

  ];

}
