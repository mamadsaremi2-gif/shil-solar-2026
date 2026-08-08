import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import EngineeringPageShell from "../components/EngineeringPageShell.jsx";
import { approveProjectStep } from "../workflow/projectWorkflow.js";
import { getEnabledEquipment } from "../data/registry/index.js";
import { filterEmergencyBatteries, filterEmergencyInverters, pickEmergencyBattery, pickEmergencyInverter } from "../engines/emergencyBankRules.js";
import { batterySeriesCountForInverter } from "../engines/solarBankRules.js";

function readDraft(key, fallback = null) { try { return JSON.parse(localStorage.getItem(key) || "null") || fallback; } catch { return fallback; } }
const number = (value, fallback = 0) => { const normalized=String(value ?? "").replace(/[۰-۹]/g,d=>String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))).replace(/[٠-٩]/g,d=>String("٠١٢٣٤٥٦٧٨٩".indexOf(d))).replace(/٫/g,".").replace(/٬|,/g,"").trim(); const n=Number(normalized); return Number.isFinite(n)?n:fallback; };
const fmt=(value,digits=0)=>Number.isFinite(Number(value))?Number(value).toLocaleString("en-US",{maximumFractionDigits:digits}):"—";
const label=(item)=>item?.title||item?.model||item?.name||item?.id||"تجهیز ثبت‌نشده";
const energyWh=(item)=>number(item?.energyWh, number(item?.nominalVoltage,0)*number(item?.capacityAh,0));
const nextStandard=(value, standards)=>standards.find(x=>x>=value)||standards[standards.length-1];

function calculateProtectionAndCables({designPowerW,totalPowerW,voltageAC,dcVoltage,cableLength,cableLengthFactor}){
 const effectiveLength=Math.max(0.5,number(cableLength,5))*Math.max(1,number(cableLengthFactor,1.1));
 const acCurrent=voltageAC>=380?designPowerW/(Math.sqrt(3)*voltageAC*.9):designPowerW/(voltageAC*.9);
 const dcCurrent=designPowerW/(Math.max(12,dcVoltage)*.92);
 const acBreaker=nextStandard(acCurrent*1.25,[6,10,16,20,25,32,40,50,63,80,100,125,160,200,250]);
 const dcBreaker=nextStandard(dcCurrent*1.25,[32,40,50,63,80,100,125,160,200,250,315,400,500,630]);
 const sections=[1.5,2.5,4,6,10,16,25,35,50,70,95,120,150,185,240];
 const acAmpacity=acCurrent/4.5, dcAmpacity=dcCurrent/4;
 const acDrop=(2*effectiveLength*acCurrent*.0175)/(Math.max(1,voltageAC*.02));
 const dcDrop=(2*effectiveLength*dcCurrent*.0175)/(Math.max(1,dcVoltage*.02));
 const acCable=nextStandard(Math.max(acAmpacity,acDrop),sections);
 const dcCable=nextStandard(Math.max(dcAmpacity,dcDrop),sections);
 return {effectiveLength,acCurrent,dcCurrent,acBreaker,dcBreaker,acCable,dcCable,acVoltage:voltageAC,dcVoltage,totalPowerW};
}

function EquipmentCard({title,kind,items,value,onChange,item,rows}){
 const selectionMode=value?"انتخاب دستی":"انتخاب خودکار";
 return <section className="shil-emergency-equipment-block">
  <div className="shil-equipment-selection-card"><span>{title}</span><strong>{selectionMode}</strong></div>
  <header className="shil-equipment-model-title"><h3>{label(item)}</h3></header>
  <details className="shil-compact-details"><summary>تغییر دستی از بانک {kind==="inverter"?"اینورتر":"باتری"}</summary><div className="shil-details-body"><select value={value||item?.id||""} onChange={e=>onChange(e.target.value)}>{items.map(x=><option key={x.id} value={x.id}>{label(x)}</option>)}</select><button type="button" className="shil-soft-button" onClick={()=>onChange("")}>بازگشت به انتخاب خودکار</button></div></details>
  <details className="shil-compact-details"><summary>مشاهده جزئیات محاسبات</summary><div className="shil-compact-data-grid">{rows.map(([k,v])=><div key={k}><span>{k}</span><strong dir="ltr" data-engineering-value="true">{v}</strong></div>)}</div></details>
 </section>;
}

function buildDesign({handoff,backupHours,reserveFactor,dodPercent,cableLength,cableLengthFactor,inverterId,batteryId,banks}){
 const load=handoff?.normalizedLoad||readDraft("shil:loadEngineResult",{}); const totalPowerW=Math.max(0,number(load.totalPowerW)); const surgePowerW=Math.max(totalPowerW,number(load.surgePowerW,totalPowerW));
 const hours=Math.max(.25,number(backupHours,3)); const reserve=Math.max(1,number(reserveFactor,1.25)); const dod=Math.min(.95,Math.max(.2,number(dodPercent,80)/100)); const inverterEfficiency=.92;
 const designPowerW=Math.ceil(Math.max(totalPowerW,surgePowerW)*reserve); const inverterOptions=filterEmergencyInverters(banks.inverters,designPowerW); const smartInv=pickEmergencyInverter(inverterOptions,designPowerW); const inv=inverterOptions.find(x=>x.id===inverterId)||smartInv;
 const requiredUsableKWh=totalPowerW*hours/1000; const requiredRawKWh=requiredUsableKWh/(dod*inverterEfficiency); const batteryOptions=filterEmergencyBatteries(banks.batteries,inv,requiredRawKWh); const smartBat=pickEmergencyBattery(batteryOptions,inv,requiredRawKWh); const bat=batteryOptions.find(x=>x.id===batteryId)||smartBat;
 const unitKWh=Math.max(.01,energyWh(bat)/1000); const series=Math.max(1,batterySeriesCountForInverter(bat||{},inv||{})); const stringKWh=unitKWh*series; const parallel=Math.max(1,Math.ceil(requiredRawKWh/Math.max(.01,stringKWh))); const count=bat?series*parallel:0; const grossKWh=count*unitKWh; const usableKWh=grossKWh*dod*inverterEfficiency; const runtime=totalPowerW?usableKWh*1000/totalPowerW:0;
 const dcV=number(inv?.dcVoltage||inv?.batteryVoltage,48); const packV=number(bat?.nominalVoltage,0)*series; const bankAh=packV?grossKWh*1000/packV:0; const voltageAC=number(load.voltageAC,220);
 const protection=calculateProtectionAndCables({designPowerW,totalPowerW,voltageAC,dcVoltage:dcV,cableLength,cableLengthFactor});
 const warnings=[]; if(!totalPowerW)warnings.push("توان بار ضروری باید در ورودی محاسبات ثبت شود."); if(inv&&number(inv.ratedPowerW||inv.powerW)<designPowerW)warnings.push("توان اینورتر انتخابی از توان طراحی کمتر است.");
 return {domain:"emergency",calculationModel:"ups_like_battery_inverter",sourceMethod:handoff?.source?.method||"equipment",load:{totalPowerW,surgePowerW,voltageAC,phaseAC:voltageAC>=380?"three":"single"},settings:{backupHours:hours,reserveFactor:reserve,dodPercent:number(dodPercent,80),cableLength:number(cableLength,5),cableLengthFactor:number(cableLengthFactor,1.1)},inverter:{...inv,designPowerW,count:1,selectionMode:inverterId?"manual":"auto"},battery:{...bat,unitEnergyKWh:unitKWh,count,seriesCount:series,parallelCount:parallel,packVoltage:packV,bankCapacityAh:bankAh,requiredUsableKWh,requiredRawKWh,grossEnergyKWh:grossKWh,usableEnergyKWh:usableKWh,runtimeHours:runtime,selectionMode:batteryId?"manual":"auto"},electrical:{dcBusVoltage:dcV,estimatedDcCurrentA:protection.dcCurrent,estimatedAcCurrentA:protection.acCurrent},protection,options:{inverters:inverterOptions,batteries:batteryOptions},valid:totalPowerW>0&&Boolean(inv?.id)&&Boolean(bat?.id)&&count>0&&!warnings.some(x=>x.includes("کمتر")),warnings};
}

function SettingsSection({title, meta, children}){return <section className="shil-summary-section"><header className="shil-summary-section-title"><h2>{title}</h2>{meta?<span>{meta}</span>:null}</header>{children}</section>}
function SettingsGrid({children}){return <div className="shil-summary-kv-grid">{children}</div>}
function SettingsField({labelText,value,onChange,readOnly=false,note}){return <label className="shil-summary-kv-card shil-settings-field-card"><span className="shil-summary-kv-label">{labelText}</span><input value={value} onChange={onChange} readOnly={readOnly} inputMode="decimal"/>{note?<small>{note}</small>:null}</label>}
function ResultCard({labelText,children}){return <article className="shil-summary-kv-card"><span className="shil-summary-kv-label">{labelText}</span><strong className="shil-summary-kv-value" dir="ltr" data-engineering-value="true">{children}</strong></article>}

export default function EmergencySystemSettings(){
 const navigate=useNavigate(); const handoff=useMemo(()=>readDraft("shil:systemSetupHandoff",{}),[]); const saved=readDraft("shil:emergencyPowerSettings",{}); const banks=useMemo(()=>({inverters:getEnabledEquipment("inverters"),batteries:getEnabledEquipment("batteries")}),[]);
 const confirmedInputHours=number(handoff?.autonomy?.backupHours,handoff?.autonomy?.hours); const inheritedHours=confirmedInputHours>0?confirmedInputHours:3;
 const [backupHours,setBackupHours]=useState(String(inheritedHours)); const [reserveFactor,setReserveFactor]=useState(String(saved.safetyFactor||1.25)); const [dodPercent,setDodPercent]=useState(String(saved.dodPercent||80)); const [cableLength,setCableLength]=useState(String(saved.cableLength||5)); const [cableLengthFactor,setCableLengthFactor]=useState(String(saved.cableLengthFactor||1.1)); const [inverterId,setInverterId]=useState(""); const [batteryId,setBatteryId]=useState("");
 useEffect(()=>setBackupHours(String(inheritedHours)),[inheritedHours]);
 const design=useMemo(()=>buildDesign({handoff,backupHours,reserveFactor,dodPercent,cableLength,cableLengthFactor,inverterId,batteryId,banks}),[handoff,backupHours,reserveFactor,dodPercent,cableLength,cableLengthFactor,inverterId,batteryId,banks]);
 const confirm=()=>{if(!design.valid)return; const finalDesign={...design,confirmedAt:new Date().toISOString()}; const settings={requiredEmergencyHours:design.settings.backupHours,safetyFactor:design.settings.reserveFactor,dodPercent:design.settings.dodPercent,cableLength:design.settings.cableLength,cableLengthFactor:design.settings.cableLengthFactor}; localStorage.setItem("shil:emergencyPowerSettings",JSON.stringify(settings)); localStorage.setItem("shil:emergencySystemDesign",JSON.stringify(finalDesign)); localStorage.setItem("shil:systemSettingsDraft",JSON.stringify({domain:"emergency",displayName:"برق اضطراری با اینورتر و باتری",calculationModel:"ups_like_battery_inverter",design:finalDesign,designResult:finalDesign,sourceHandoff:handoff})); approveProjectStep("system"); navigate("/new-project/summary/emergency");};
 const invRows=[["مدل",label(design.inverter)],["توان طراحی",`${fmt(design.inverter.designPowerW)} W`],["توان نامی",`${fmt(design.inverter.ratedPowerW||design.inverter.powerW)} W`],["ولتاژ بانک",`${fmt(design.inverter.dcVoltage||design.inverter.batteryVoltage)} V DC`],["جریان DC",`${fmt(design.electrical.estimatedDcCurrentA,1)} A`],["نوع انتخاب",design.inverter.selectionMode==="manual"?"دستی":"خودکار"]];
 const batRows=[["مدل",label(design.battery)],["ولتاژ و ظرفیت",`${fmt(design.battery.nominalVoltage,1)} V / ${fmt(design.battery.capacityAh)} AH`],["آرایش",`${fmt(design.battery.seriesCount)} سری × ${fmt(design.battery.parallelCount)} موازی`],["تعداد کل",`${fmt(design.battery.count)} عدد`],["انرژی قابل استفاده",`${fmt(design.battery.usableEnergyKWh,2)} KWH`],["پشتیبانی واقعی",`${fmt(design.battery.runtimeHours,2)} ساعت`],["نوع انتخاب",design.battery.selectionMode==="manual"?"دستی":"خودکار"]];
 return <EngineeringPageShell title="تنظیمات برق اضطراری"><style>{`
#shil-emergency-settings-root{direction:rtl;width:100%;margin:0;padding:8px 0 86px!important;display:flex;flex-direction:column;gap:10px!important;background:transparent!important}
#shil-emergency-settings-root .shil-summary-section{width:min(100%,860px)!important;margin:0 auto!important;padding:8px!important;background:rgba(244,249,255,.95)!important;border:1px solid #b8d4ec!important;border-radius:18px!important;box-shadow:none!important;overflow:hidden!important}
#shil-emergency-settings-root .shil-summary-section-title{min-height:48px!important;margin:0 0 7px!important;padding:7px 10px!important;display:flex!important;align-items:center!important;justify-content:center!important;gap:7px!important;background:#e8f2fc!important;border:1px solid #adc8e2!important;border-radius:13px!important}
#shil-emergency-settings-root .shil-summary-section-title h2{width:100%!important;margin:0!important;text-align:center!important;font-size:16px!important;line-height:1.3!important;font-weight:900!important;color:#102542!important}
#shil-emergency-settings-root .shil-summary-section-title span{display:none!important}
#shil-emergency-settings-root .shil-summary-kv-grid{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:6px!important}
#shil-emergency-settings-root .shil-summary-kv-card{min-width:0!important;min-height:56px!important;height:auto!important;margin:0!important;padding:7px 8px!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;gap:4px!important;text-align:center!important;background:var(--em-calc-field,#f9fcff)!important;background-image:none!important;border:1px solid var(--em-calc-line,#bdd6eb)!important;border-radius:11px!important;box-shadow:none!important}
#shil-emergency-settings-root .shil-summary-kv-label{margin:0!important;padding:0!important;font-size:11px!important;line-height:1.3!important;font-weight:850!important;color:#233c57!important}
#shil-emergency-settings-root .shil-summary-kv-value{margin:0!important;padding:0!important;font-size:12px!important;line-height:1.35!important;font-weight:900!important;color:#102542!important;overflow-wrap:anywhere!important}
#shil-emergency-settings-root .shil-settings-field-card{min-height:56px!important;padding:7px 8px!important;gap:4px!important}
#shil-emergency-settings-root.shil-summary-page .shil-summary-kv-grid .shil-settings-field-card > input{width:100%!important;min-width:0!important;min-height:0!important;height:auto!important;max-height:none!important;margin:0!important;padding:0!important;text-align:center!important;font-size:12px!important;line-height:1.35!important;font-weight:900!important;color:#102542!important;background:transparent!important;background-image:none!important;border:0!important;border-radius:0!important;box-shadow:none!important}
#shil-emergency-settings-root.shil-summary-page .shil-summary-kv-grid .shil-settings-field-card > input:not([readonly]){cursor:text!important}
#shil-emergency-settings-root.shil-summary-page .shil-summary-kv-grid .shil-settings-field-card > small{margin:0!important;padding:0!important;font-size:9px!important;line-height:1.25!important;color:#60758a!important}
#shil-emergency-settings-root .shil-emergency-equipment-block{margin:0 0 8px!important;padding:0!important;border:0!important;background:transparent!important}
#shil-emergency-settings-root .shil-emergency-equipment-block:last-child{margin-bottom:0!important}
#shil-emergency-settings-root .shil-equipment-model-title{min-height:48px!important;padding:7px 10px!important;display:flex!important;align-items:center!important;justify-content:center!important;text-align:center!important;background:#f9fcff!important;border:1px solid #bdd6eb!important;border-radius:11px!important}
#shil-emergency-settings-root .shil-equipment-model-title h3{width:100%!important;margin:0!important;padding:0!important;text-align:center!important;font-size:13px!important;line-height:1.35!important;font-weight:900!important;color:#102542!important;overflow-wrap:anywhere!important}
#shil-emergency-settings-root .shil-equipment-selection-card{min-height:42px!important;margin-top:6px!important;padding:7px 10px!important;display:flex!important;align-items:center!important;justify-content:center!important;gap:6px!important;text-align:center!important;background:#f9fcff!important;border:1px solid #bdd6eb!important;border-radius:11px!important}
#shil-emergency-settings-root .shil-equipment-selection-card span,#shil-emergency-settings-root .shil-equipment-selection-card strong{margin:0!important;font-size:11px!important;line-height:1.3!important;font-weight:900!important;color:#102542!important;text-align:center!important}#shil-emergency-settings-root .shil-equipment-selection-card span::after{content:" - "}#shil-emergency-settings-root .shil-equipment-model-title{margin-top:6px!important}
#shil-emergency-settings-root .shil-compact-details{margin-top:6px!important;border:1px solid #bdd6eb!important;border-radius:11px!important;background:#f5faff!important;overflow:hidden!important}
#shil-emergency-settings-root .shil-compact-details summary{min-height:38px!important;padding:6px 9px!important;display:flex!important;align-items:center!important;justify-content:center!important;font-size:11px!important;line-height:1.3!important;font-weight:900!important;color:#102542!important;cursor:pointer!important}
#shil-emergency-settings-root .shil-details-body{padding:7px 8px!important;font-size:10px!important;line-height:1.55!important}
#shil-emergency-settings-root .shil-primary-wide{width:220px!important;min-width:220px!important;height:46px!important;min-height:46px!important;margin:0 auto!important;display:block!important}

#shil-emergency-settings-root.shil-summary-page .shil-summary-kv-grid > .shil-summary-kv-card{height:76px!important;min-height:76px!important;max-height:76px!important;padding:7px 8px!important;gap:4px!important}
#shil-emergency-settings-root.shil-summary-page .shil-summary-kv-grid > .shil-settings-field-card > input{display:block!important;box-sizing:border-box!important;width:auto!important;min-width:0!important;max-width:100%!important;height:auto!important;min-height:0!important;max-height:none!important;margin:0!important;padding:0!important;background:transparent!important;background-color:transparent!important;background-image:none!important;border:0!important;outline:0!important;border-radius:0!important;box-shadow:none!important;appearance:none!important;-webkit-appearance:none!important}
#shil-emergency-settings-root.shil-summary-page .shil-summary-kv-grid > .shil-settings-field-card > small{position:static!important;display:block!important;max-width:100%!important;margin:0!important;padding:0!important;text-align:center!important}
@media(max-width:640px){#shil-emergency-settings-root .shil-summary-section{padding:8px!important;border-radius:18px!important}#shil-emergency-settings-root .shil-summary-section-title{min-height:48px!important;padding:7px 10px!important}#shil-emergency-settings-root .shil-summary-section-title h2{font-size:16px!important}#shil-emergency-settings-root .shil-summary-kv-grid{gap:6px!important}#shil-emergency-settings-root .shil-summary-kv-card{min-height:56px!important;padding:7px 8px!important}}
`}</style><div id="shil-emergency-settings-root" className="shil-summary-page shil-page-scroll">
<SettingsSection title="پارامترهای طراحی"><SettingsGrid>
<SettingsField labelText="زمان پشتیبانی هدف" value={backupHours} readOnly note="از ورودی محاسبات دریافت شده است"/>
<SettingsField labelText="ضریب اطمینان اینورتر" value={reserveFactor} onChange={e=>setReserveFactor(e.target.value)}/>
<SettingsField labelText="عمق دشارژ مجاز %" value={dodPercent} onChange={e=>setDodPercent(e.target.value)}/>
<SettingsField labelText="طول یک‌طرفه کابل (m)" value={cableLength} onChange={e=>setCableLength(e.target.value)}/>
<SettingsField labelText="ضریب افزایش متراژ" value={cableLengthFactor} onChange={e=>setCableLengthFactor(e.target.value)}/>
<ResultCard labelText="طول مؤثر کابل">{fmt(design.protection.effectiveLength,2)} m</ResultCard>
<ResultCard labelText="توان بار">{fmt(design.load.totalPowerW)} W</ResultCard><ResultCard labelText="توان طراحی">{fmt(design.inverter.designPowerW)} W</ResultCard><ResultCard labelText="انرژی خام لازم">{fmt(design.battery.requiredRawKWh,2)} KWH</ResultCard><ResultCard labelText="پشتیبانی واقعی">{fmt(design.battery.runtimeHours,2)} ساعت</ResultCard>
</SettingsGrid></SettingsSection>
<SettingsSection title="انتخاب تجهیزات اصلی"><EquipmentCard title="اینورتر برق اضطراری" kind="inverter" items={design.options.inverters} value={inverterId} onChange={setInverterId} item={design.inverter} rows={invRows}/><EquipmentCard title="بانک باتری" kind="battery" items={design.options.batteries} value={batteryId} onChange={setBatteryId} item={design.battery} rows={batRows}/></SettingsSection>
<SettingsSection title="حفاظت و کابل پیشنهادی"><SettingsGrid><ResultCard labelText="حفاظت DC باتری">{fmt(design.protection.dcBreaker)} A / حداقل {fmt(design.protection.dcVoltage)} VDC</ResultCard><ResultCard labelText="حفاظت خروجی AC">{fmt(design.protection.acBreaker)} A / {fmt(design.protection.acVoltage)} VAC</ResultCard><ResultCard labelText="کابل باتری">مس {fmt(design.protection.dcCable)} mm²</ResultCard><ResultCard labelText="کابل خروجی AC">مس {fmt(design.protection.acCable)} mm²</ResultCard></SettingsGrid><details className="shil-compact-details"><summary>مشاهده جزئیات محاسبه حفاظت و کابل</summary><SettingsGrid><ResultCard labelText="جریان طراحی DC">{fmt(design.protection.dcCurrent,1)} A</ResultCard><ResultCard labelText="جریان طراحی AC">{fmt(design.protection.acCurrent,1)} A</ResultCard><ResultCard labelText="طول مؤثر کابل">{fmt(design.protection.effectiveLength,2)} m</ResultCard><ResultCard labelText="مبنای انتخاب کابل">جریان مجاز و افت ولتاژ ۲٪</ResultCard></SettingsGrid></details><details className="shil-compact-details"><summary>هشدارها و الزامات اجرا</summary><div className="shil-details-body">ارت و هم‌بندی، بای‌پس تعمیراتی، تهویه و قدرت قطع متناسب با جریان اتصال کوتاه محل نصب الزامی است.</div></details></SettingsSection>
{design.warnings.length?<details className="shil-compact-details shil-warning-details"><summary>{design.warnings.length} هشدار طراحی</summary><div className="shil-details-body">{design.warnings.map(x=><p key={x}>{x}</p>)}</div></details>:null}
<button type="button" className="shil-primary-wide shil-emergency-confirm-button" disabled={!design.valid} onClick={confirm}>تأیید</button></div></EngineeringPageShell>;
}
