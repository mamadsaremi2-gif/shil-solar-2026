import React from "react";
import StepPage from "../components/dashboard/StepPage.jsx";
import { runEngineeringDesign } from "../engine/runEngineeringDesign.js";
export default function FinalOutput(){const r=runEngineeringDesign({});return <StepPage title="خروجی نهایی محاسبات" subtitle="خروجی مهندسی بدون محاسبات مالی"><div className="result-grid-v15"><div><b>{r.energyDaily}</b><span>kWh/day</span><p>انرژی روزانه</p></div><div><b>{r.systemPower}</b><span>kW</span><p>توان سیستم</p></div><div><b>{r.efficiency}</b><span>%</span><p>بازده کل</p></div></div></StepPage>}
