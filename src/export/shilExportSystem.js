import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

function safeText(value, fallback = "ثبت نشده") {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
}


function batterySpecText(bank = {}) {
  const b = bank.battery || {};
  const count = safeText(bank.totalCount || bank.count, "-");
  const voltage = safeText(bank.unitVoltageV || bank.voltageV || b.nominalVoltage || b.voltageV, "-");
  const ah = safeText(bank.unitCapacityAh || bank.capacityAh || b.capacityAh, "-");
  const unitKWh = safeText(bank.unitEnergyKWh || (Number(voltage) && Number(ah) ? Math.round((Number(voltage) * Number(ah)) / 10) / 100 : "-"), "-");
  const totalKWh = safeText(bank.grossEnergyKWh || (bank.grossEnergyWh ? Math.round(bank.grossEnergyWh / 10) / 100 : "-"), "-");
  return `${count} عدد / ${voltage}V / ${ah}Ah / ${unitKWh}kWh هر باتری / ${totalKWh}kWh کل`;
}

function batteryNoteText(bank = {}) {
  const series = safeText(bank.seriesCount, "-");
  const parallel = safeText(bank.parallelCount, "-");
  const bankVoltage = safeText(bank.bankVoltageV, "-");
  const bankAh = safeText(bank.bankCurrentAh || bank.installedAh, "-");
  return `${series} سری × ${parallel} موازی / ولتاژ بانک ${bankVoltage}V / ظرفیت جریان ${bankAh}Ah`;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 600);
}

function normalizeFileName(name) {
  return safeText(name, "shil-project")
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

export function buildFinalEngineeringDelivery({ domain, project = {}, summary = {}, result = {}, solarDesign = {}, aiPreview = null }) {
  const emergency = domain === "emergency";
  const projectTitle = project.projectName || project.name || (emergency ? "پروژه برق اضطراری" : "پروژه خورشیدی");
  const customer = project.clientName || project.customerName || project.employerName || project.ownerName || "ثبت نشده";
  const location = [project.city, project.province].filter(Boolean).join(" / ") || project.address || "ثبت نشده";
  const generatedAt = new Date().toLocaleString("fa-IR");

  const solarRows = [
    { item: "پنل خورشیدی", qty: safeText(solarDesign?.pvArray?.panelCount, "-") + " عدد", spec: `${safeText(solarDesign?.panel?.powerW, 620)} وات`, reason: `${safeText(solarDesign?.pvArray?.seriesCount, "-")} سری × ${safeText(solarDesign?.pvArray?.parallelCount, "-")} موازی برای تطابق توان و محدوده کاری` },
    { item: "اینورتر خورشیدی", qty: safeText(solarDesign?.inverter?.count, 1) + " عدد", spec: `${safeText(solarDesign?.inverter?.ratedPowerW, "-")} وات`, reason: "انتخاب‌شده بر اساس توان بار، سناریوی طراحی و ظرفیت توسعه آینده" },
    { item: "باتری", qty: safeText(solarDesign?.battery?.totalCount, "-") + " عدد", spec: batterySpecText(solarDesign?.battery), reason: `${batteryNoteText(solarDesign?.battery)} برای تأمین ظرفیت ذخیره` },
    { item: "حفاظت DC/AC", qty: "۱ مجموعه", spec: `DC ${safeText(solarDesign?.protection?.dcBreakerA, "-")}A / AC ${safeText(solarDesign?.protection?.acBreakerA, "-")}A`, reason: "حفاظت مدار، جداسازی، ارتینگ و محدودسازی خطا" },
    { item: "استراکچر و متعلقات نصب", qty: "بر اساس جانمایی", spec: "سقف / زمین / ترکیبی", reason: "مطابق محل نصب، جهت پنل و شرایط اجرای پروژه" }
  ];

  const emergencyRows = [
    { item: "اینورتر برق اضطراری", qty: safeText(result?.inverter?.count, 1) + " عدد", spec: `${safeText(result?.inverter?.ratedPowerW, "-")} وات`, reason: "پوشش توان دائم و توان لحظه‌ای بارهای ضروری" },
    { item: "باتری منتخب", qty: safeText(result?.battery?.totalCount, "-") + " عدد", spec: batterySpecText(result?.battery), reason: `${batteryNoteText(result?.battery)} برای رسیدن به ولتاژ و ظرفیت مورد نیاز` },
    { item: "زمان برق اضطراری مورد نیاز", qty: `${safeText(result?.settings?.requiredEmergencyHours, 2)} ساعت`, spec: "بر اساس بار ضروری", reason: "در ظرفیت باتری، ضریب اطمینان و عمق دشارژ لحاظ شده است" },
    { item: "تابلو و حفاظت برق اضطراری", qty: "۱ مجموعه", spec: `DC ${safeText(result?.protection?.dcBreakerA, "-")}A / AC ${safeText(result?.protection?.acBreakerA, "-")}A`, reason: "حفاظت باتری، خروجی AC، ارتینگ، کلید جداساز و حفاظت اضافه‌جریان" },
    { item: "کابل و متعلقات اجرا", qty: "طبق مسیر اجرا", spec: safeText(result?.cable?.recommendedSize, "محاسبه‌شده"), reason: "انتخاب بر اساس جریان، افت ولتاژ و طول مسیر" }
  ];

  const equipment = emergency ? emergencyRows : solarRows;
  const validations = [
    { check: "کامل بودن اطلاعات پروژه", status: "تأیید", detail: "اطلاعات اصلی برای تولید خروجی نهایی در دسترس است" },
    { check: "اعتبار طراحی", status: result?.valid === false ? "نیازمند بازبینی" : "تأیید", detail: result?.valid === false ? "هشدارهای موتور باید بررسی شوند" : "محاسبات برای خروجی مهندسی آماده است" },
    { check: "تجهیزات مورد نیاز", status: "تأیید", detail: "لیست تجهیزات اجرایی بر اساس مسیر طراحی تولید شده است" },
    { check: "خروجی نهایی", status: "آماده", detail: "امکان ذخیره تصویر، PDF یک‌صفحه‌ای و اشتراک‌گذاری فعال است" }
  ];

  return {
    meta: {
      title: projectTitle,
      customer,
      location,
      domain: emergency ? "برق اضطراری" : "پنل خورشیدی",
      generatedAt,
      status: result?.valid === false ? "نیازمند بازبینی" : "تکمیل شده",
      version: "SHIL One Page Export 101"
    },
    project,
    summary,
    result,
    solarDesign,
    aiPreview,
    equipment,
    validations,
    notes: result?.explanations || solarDesign?.explanations || ["خروجی بر اساس داده‌های ثبت‌شده پروژه و موتور محاسبات SHIL تولید شده است."],
    warnings: result?.warnings || []
  };
}

export function exportDeliveryJson(delivery) {
  downloadBlob(new Blob([JSON.stringify(delivery, null, 2)], { type: "application/json;charset=utf-8" }), `${normalizeFileName(delivery.meta.title)}-shil-output.json`);
}

export function exportDeliveryCsv(delivery) {
  const rows = [
    ["بخش", "آیتم", "تعداد", "مشخصات", "توضیح"],
    ...delivery.equipment.map((row) => ["تجهیزات", row.item, row.qty, row.spec, row.reason]),
    ...delivery.validations.map((row) => ["اعتبارسنجی", row.check, row.status, "", row.detail])
  ];
  const csv = rows.map((row) => row.map((cell) => `"${safeText(cell, "").replaceAll('"', '""')}"`).join(",")).join("\n");
  downloadBlob(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }), `${normalizeFileName(delivery.meta.title)}-shil-output.csv`);
}

export function exportDeliveryHtml(delivery) {
  const equipmentRows = delivery.equipment.map((row) => `<tr><td>${row.item}</td><td>${row.qty}</td><td>${row.spec}</td><td>${row.reason}</td></tr>`).join("");
  const validationRows = delivery.validations.map((row) => `<tr><td>${row.check}</td><td>${row.status}</td><td>${row.detail}</td></tr>`).join("");
  const html = `<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><title>${delivery.meta.title}</title><style>body{font-family:Tahoma,Arial,sans-serif;background:#f7f7f7;color:#111;padding:24px;line-height:1.8}.sheet{max-width:920px;margin:auto;background:#fff;border:1px solid #ddd;border-radius:18px;padding:28px}.hero{display:flex;justify-content:space-between;gap:16px;border-bottom:2px solid #111;padding-bottom:18px;margin-bottom:22px}.badge{background:#111;color:#fff;border-radius:999px;padding:6px 12px;font-size:12px}table{width:100%;border-collapse:collapse;margin:16px 0 26px}th,td{border:1px solid #ddd;padding:10px;text-align:right;vertical-align:top}th{background:#f1f1f1}h1,h2{margin:0 0 10px}.meta{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px 18px}</style></head><body><main class="sheet"><div class="hero"><div><h1>جمع‌بندی نهایی پروژه</h1><p>خروجی نهایی طراحی هوشمند مهندسی SHIL</p></div><span class="badge">${delivery.meta.version}</span></div><section class="meta"><div>نام پروژه: <b>${delivery.meta.title}</b></div><div>کارفرما: <b>${delivery.meta.customer}</b></div><div>محل اجرا: <b>${delivery.meta.location}</b></div><div>مسیر طراحی: <b>${delivery.meta.domain}</b></div><div>وضعیت: <b>${delivery.meta.status}</b></div><div>تاریخ: <b>${delivery.meta.generatedAt}</b></div></section><h2>تجهیزات مورد نیاز اجرا</h2><table><thead><tr><th>تجهیز</th><th>تعداد</th><th>مشخصات</th><th>علت انتخاب</th></tr></thead><tbody>${equipmentRows}</tbody></table><h2>اعتبارسنجی نهایی</h2><table><thead><tr><th>بررسی</th><th>نتیجه</th><th>توضیح</th></tr></thead><tbody>${validationRows}</tbody></table><h2>توضیحات مهندسی</h2><ul>${delivery.notes.map((note) => `<li>${note}</li>`).join("")}</ul></main></body></html>`;
  downloadBlob(new Blob([html], { type: "text/html;charset=utf-8" }), `${normalizeFileName(delivery.meta.title)}-shil-report.html`);
}

export async function exportElementAsPng(element, filename = "shil-output.png") {
  if (!element) throw new Error("Export element not found");
  const canvas = await html2canvas(element, { scale: 2, backgroundColor: "#08101b", useCORS: true, logging: false });
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png", 0.95));
  downloadBlob(blob, filename);
  return canvas;
}

export async function exportElementAsPdf(element, delivery, filename = "shil-output.pdf") {
  if (!element) throw new Error("Export element not found");
  const canvas = await html2canvas(element, { scale: 2, backgroundColor: "#08101b", useCORS: true, logging: false });
  const imgData = canvas.toDataURL("image/png", 0.96);
  const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 5;
  const maxWidth = pageWidth - margin * 2;
  const maxHeight = pageHeight - margin * 2;
  const ratio = Math.min(maxWidth / canvas.width, maxHeight / canvas.height);
  const imgWidth = canvas.width * ratio;
  const imgHeight = canvas.height * ratio;
  const x = (pageWidth - imgWidth) / 2;
  const y = (pageHeight - imgHeight) / 2;

  pdf.addImage(imgData, "PNG", x, y, imgWidth, imgHeight, undefined, "FAST");
  pdf.setProperties({ title: delivery?.meta?.title || "SHIL One Page Output", subject: "SHIL One Page Engineering Delivery", creator: "SHIL" });
  pdf.save(filename);
}

export async function shareDelivery(delivery) {
  const text = `خروجی طراحی مهندسی SHIL - ${delivery.meta.title}`;
  if (navigator.share) {
    await navigator.share({ title: delivery.meta.title, text, url: window.location.href });
    return "shared";
  }
  await navigator.clipboard.writeText(`${text}\n${window.location.href}`);
  return "copied";
}
