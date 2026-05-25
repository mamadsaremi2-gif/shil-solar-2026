import React from "react";

import {
  Line
} from "react-chartjs-2";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

export default function EnergyChart() {

  const data = {

    labels: [
      "01",
      "02",
      "03",
      "04",
      "05",
      "06",
    ],

    datasets: [
      {
        label: "Energy",
        data: [4, 7, 5, 8, 9, 11],
        borderColor: "#38bdf8",
        tension: 0.4,
      },
    ],
  };

  return (
    <div className="chart-v15">

      <Line data={data} />

    </div>
  );
}
