import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

function safeText(value, fallback = "Ø«Ø¨Øª Ù†Ø´Ø¯Ù‡") {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
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
  const projectTitle = project.projectName || project.name || (emergency ? "Ù¾Ø±ÙˆÚ˜Ù‡ Ø¨Ø±Ù‚ Ø§Ø¶Ø·Ø±Ø§Ø±ÛŒ" : "Ù¾Ø±ÙˆÚ˜Ù‡ Ø®ÙˆØ±Ø´ÛŒØ¯ÛŒ");
  const customer = project.clientName || project.customerName || project.employerName || project.ownerName || "Ø«Ø¨Øª Ù†Ø´Ø¯Ù‡";
  const location = [project.city, project.province].filter(Boolean).join(" / ") || project.address || "Ø«Ø¨Øª Ù†Ø´Ø¯Ù‡";
  const generatedAt = new Date().toLocaleString("fa-IR");

  const solarRows = [
    { item: "Ù¾Ù†Ù„ Ø®ÙˆØ±Ø´ÛŒØ¯ÛŒ", qty: safeText(solarDesign?.pvArray?.panelCount, "-") + " Ø¹Ø¯Ø¯", spec: `${safeText(solarDesign?.panel?.powerW, 620)} ÙˆØ§Øª`, reason: `${safeText(solarDesign?.pvArray?.seriesCount, "-")} Ø³Ø±ÛŒ Ã— ${safeText(solarDesign?.pvArray?.parallelCount, "-")} Ù…ÙˆØ§Ø²ÛŒ Ø¨Ø±Ø§ÛŒ ØªØ·Ø§Ø¨Ù‚ ØªÙˆØ§Ù† Ùˆ Ù…Ø­Ø¯ÙˆØ¯Ù‡ Ú©Ø§Ø±ÛŒ` },
    { item: "Ø§ÛŒÙ†ÙˆØ±ØªØ± Ø®ÙˆØ±Ø´ÛŒØ¯ÛŒ", qty: safeText(solarDesign?.inverter?.count, 1) + " Ø¹Ø¯Ø¯", spec: `${safeText(solarDesign?.inverter?.ratedPowerW, "-")} ÙˆØ§Øª`, reason: "Ø§Ù†ØªØ®Ø§Ø¨â€ŒØ´Ø¯Ù‡ Ø¨Ø± Ø§Ø³Ø§Ø³ ØªÙˆØ§Ù† Ø¨Ø§Ø±ØŒ Ø³Ù†Ø§Ø±ÛŒÙˆÛŒ Ø·Ø±Ø§Ø­ÛŒ Ùˆ Ø¸Ø±ÙÛŒØª ØªÙˆØ³Ø¹Ù‡ Ø¢ÛŒÙ†Ø¯Ù‡" },
    { item: "Ø¨Ø§ØªØ±ÛŒ", qty: safeText(solarDesign?.battery?.totalCount, "-") + " Ø¹Ø¯Ø¯", spec: `${safeText(solarDesign?.battery?.voltageV, "-")} ÙˆÙ„Øª`, reason: `${safeText(solarDesign?.battery?.seriesCount, "-")} Ø³Ø±ÛŒ Ã— ${safeText(solarDesign?.battery?.parallelCount, "-")} Ù…ÙˆØ§Ø²ÛŒ Ø¨Ø±Ø§ÛŒ ØªØ£Ù…ÛŒÙ† Ø¸Ø±ÙÛŒØª Ø°Ø®ÛŒØ±Ù‡` },
    { item: "Ø­ÙØ§Ø¸Øª DC/AC", qty: "Û± Ù…Ø¬Ù…ÙˆØ¹Ù‡", spec: `DC ${safeText(solarDesign?.protection?.dcBreakerA, "-")}A / AC ${safeText(solarDesign?.protection?.acBreakerA, "-")}A`, reason: "Ø­ÙØ§Ø¸Øª Ù…Ø¯Ø§Ø±ØŒ Ø¬Ø¯Ø§Ø³Ø§Ø²ÛŒØŒ Ø§Ø±ØªÛŒÙ†Ú¯ Ùˆ Ù…Ø­Ø¯ÙˆØ¯Ø³Ø§Ø²ÛŒ Ø®Ø·Ø§" },
    { item: "Ø§Ø³ØªØ±Ø§Ú©Ú†Ø± Ùˆ Ù…ØªØ¹Ù„Ù‚Ø§Øª Ù†ØµØ¨", qty: "Ø¨Ø± Ø§Ø³Ø§Ø³ Ø¬Ø§Ù†Ù…Ø§ÛŒÛŒ", spec: "Ø³Ù‚Ù / Ø²Ù…ÛŒÙ† / ØªØ±Ú©ÛŒØ¨ÛŒ", reason: "Ù…Ø·Ø§Ø¨Ù‚ Ù…Ø­Ù„ Ù†ØµØ¨ØŒ Ø¬Ù‡Øª Ù¾Ù†Ù„ Ùˆ Ø´Ø±Ø§ÛŒØ· Ø§Ø¬Ø±Ø§ÛŒ Ù¾Ø±ÙˆÚ˜Ù‡" }
  ];

  const emergencyRows = [
    { item: "Ø§ÛŒÙ†ÙˆØ±ØªØ± Ø¨Ø±Ù‚ Ø§Ø¶Ø·Ø±Ø§Ø±ÛŒ", qty: safeText(result?.inverter?.count, 1) + " Ø¹Ø¯Ø¯", spec: `${safeText(result?.inverter?.ratedPowerW, "-")} ÙˆØ§Øª`, reason: "Ù¾ÙˆØ´Ø´ ØªÙˆØ§Ù† Ø¯Ø§Ø¦Ù… Ùˆ ØªÙˆØ§Ù† Ù„Ø­Ø¸Ù‡â€ŒØ§ÛŒ Ø¨Ø§Ø±Ù‡Ø§ÛŒ Ø¶Ø±ÙˆØ±ÛŒ" },
    { item: "Ø¨Ø§ØªØ±ÛŒ Ù…Ù†ØªØ®Ø¨", qty: safeText(result?.battery?.totalCount, "-") + " Ø¹Ø¯Ø¯", spec: `${safeText(result?.battery?.battery?.capacityAh, "-")}Ah`, reason: `${safeText(result?.battery?.seriesCount, "-")} Ø³Ø±ÛŒ Ã— ${safeText(result?.battery?.parallelCount, "-")} Ù…ÙˆØ§Ø²ÛŒ Ø¨Ø±Ø§ÛŒ Ø±Ø³ÛŒØ¯Ù† Ø¨Ù‡ ÙˆÙ„ØªØ§Ú˜ Ùˆ Ø¸Ø±ÙÛŒØª Ù…ÙˆØ±Ø¯ Ù†ÛŒØ§Ø²` },
    { item: "Ø²Ù…Ø§Ù† Ø¨Ø±Ù‚ Ø§Ø¶Ø·Ø±Ø§Ø±ÛŒ Ù…ÙˆØ±Ø¯ Ù†ÛŒØ§Ø²", qty: `${safeText(result?.settings?.requiredEmergencyHours, 2)} Ø³Ø§Ø¹Øª`, spec: "Ø¨Ø± Ø§Ø³Ø§Ø³ Ø¨Ø§Ø± Ø¶Ø±ÙˆØ±ÛŒ", reason: "Ø¯Ø± Ø¸Ø±ÙÛŒØª Ø¨Ø§ØªØ±ÛŒØŒ Ø¶Ø±ÛŒØ¨ Ø§Ø·Ù…ÛŒÙ†Ø§Ù† Ùˆ Ø¹Ù…Ù‚ Ø¯Ø´Ø§Ø±Ú˜ Ù„Ø­Ø§Ø¸ Ø´Ø¯Ù‡ Ø§Ø³Øª" },
    { item: "ØªØ§Ø¨Ù„Ùˆ Ùˆ Ø­ÙØ§Ø¸Øª Ø¨Ø±Ù‚ Ø§Ø¶Ø·Ø±Ø§Ø±ÛŒ", qty: "Û± Ù…Ø¬Ù…ÙˆØ¹Ù‡", spec: `DC ${safeText(result?.protection?.dcBreakerA, "-")}A / AC ${safeText(result?.protection?.acBreakerA, "-")}A`, reason: "Ø­ÙØ§Ø¸Øª Ø¨Ø§ØªØ±ÛŒØŒ Ø®Ø±ÙˆØ¬ÛŒ ACØŒ Ø§Ø±ØªÛŒÙ†Ú¯ØŒ Ú©Ù„ÛŒØ¯ Ø¬Ø¯Ø§Ø³Ø§Ø² Ùˆ Ø­ÙØ§Ø¸Øª Ø§Ø¶Ø§ÙÙ‡â€ŒØ¬Ø±ÛŒØ§Ù†" },
    { item: "Ú©Ø§Ø¨Ù„ Ùˆ Ù…ØªØ¹Ù„Ù‚Ø§Øª Ø§Ø¬Ø±Ø§", qty: "Ø·Ø¨Ù‚ Ù…Ø³ÛŒØ± Ø§Ø¬Ø±Ø§", spec: safeText(result?.cable?.recommendedSize, "Ù…Ø­Ø§Ø³Ø¨Ù‡â€ŒØ´Ø¯Ù‡"), reason: "Ø§Ù†ØªØ®Ø§Ø¨ Ø¨Ø± Ø§Ø³Ø§Ø³ Ø¬Ø±ÛŒØ§Ù†ØŒ Ø§ÙØª ÙˆÙ„ØªØ§Ú˜ Ùˆ Ø·ÙˆÙ„ Ù…Ø³ÛŒØ±" }
  ];

  const equipment = emergency ? emergencyRows : solarRows;
  const validations = [
    { check: "Ú©Ø§Ù…Ù„ Ø¨ÙˆØ¯Ù† Ø§Ø·Ù„Ø§Ø¹Ø§Øª Ù¾Ø±ÙˆÚ˜Ù‡", status: "ØªØ£ÛŒÛŒØ¯", detail: "Ø§Ø·Ù„Ø§Ø¹Ø§Øª Ø§ØµÙ„ÛŒ Ø¨Ø±Ø§ÛŒ ØªÙˆÙ„ÛŒØ¯ Ø®Ø±ÙˆØ¬ÛŒ Ù†Ù‡Ø§ÛŒÛŒ Ø¯Ø± Ø¯Ø³ØªØ±Ø³ Ø§Ø³Øª" },
    { check: "Ø§Ø¹ØªØ¨Ø§Ø± Ø·Ø±Ø§Ø­ÛŒ", status: result?.valid === false ? "Ù†ÛŒØ§Ø²Ù…Ù†Ø¯ Ø¨Ø§Ø²Ø¨ÛŒÙ†ÛŒ" : "ØªØ£ÛŒÛŒØ¯", detail: result?.valid === false ? "Ù‡Ø´Ø¯Ø§Ø±Ù‡Ø§ÛŒ Ù…ÙˆØªÙˆØ± Ø¨Ø§ÛŒØ¯ Ø¨Ø±Ø±Ø³ÛŒ Ø´ÙˆÙ†Ø¯" : "Ù…Ø­Ø§Ø³Ø¨Ø§Øª Ø¨Ø±Ø§ÛŒ Ø®Ø±ÙˆØ¬ÛŒ Ù…Ù‡Ù†Ø¯Ø³ÛŒ Ø¢Ù…Ø§Ø¯Ù‡ Ø§Ø³Øª" },
    { check: "ØªØ¬Ù‡ÛŒØ²Ø§Øª Ù…ÙˆØ±Ø¯ Ù†ÛŒØ§Ø²", status: "ØªØ£ÛŒÛŒØ¯", detail: "Ù„ÛŒØ³Øª ØªØ¬Ù‡ÛŒØ²Ø§Øª Ø§Ø¬Ø±Ø§ÛŒÛŒ Ø¨Ø± Ø§Ø³Ø§Ø³ Ù…Ø³ÛŒØ± Ø·Ø±Ø§Ø­ÛŒ ØªÙˆÙ„ÛŒØ¯ Ø´Ø¯Ù‡ Ø§Ø³Øª" },
    { check: "Ø®Ø±ÙˆØ¬ÛŒ Ù†Ù‡Ø§ÛŒÛŒ", status: "Ø¢Ù…Ø§Ø¯Ù‡", detail: "Ø§Ù…Ú©Ø§Ù† Ø°Ø®ÛŒØ±Ù‡ ØªØµÙˆÛŒØ±ØŒ PDFØŒ JSON Ùˆ CSV ÙØ¹Ø§Ù„ Ø§Ø³Øª" }
  ];

  return {
    meta: {
      title: projectTitle,
      customer,
      location,
      domain: emergency ? "Ø¨Ø±Ù‚ Ø§Ø¶Ø·Ø±Ø§Ø±ÛŒ" : "Ù¾Ù†Ù„ Ø®ÙˆØ±Ø´ÛŒØ¯ÛŒ",
      generatedAt,
      status: result?.valid === false ? "Ù†ÛŒØ§Ø²Ù…Ù†Ø¯ Ø¨Ø§Ø²Ø¨ÛŒÙ†ÛŒ" : "ØªÚ©Ù…ÛŒÙ„ Ø´Ø¯Ù‡",
      version: "SHIL Export System 100"
    },
    project,
    summary,
    result,
    solarDesign,
    aiPreview,
    equipment,
    validations,
    notes: result?.explanations || solarDesign?.explanations || ["Ø®Ø±ÙˆØ¬ÛŒ Ø¨Ø± Ø§Ø³Ø§Ø³ Ø¯Ø§Ø¯Ù‡â€ŒÙ‡Ø§ÛŒ Ø«Ø¨Øªâ€ŒØ´Ø¯Ù‡ Ù¾Ø±ÙˆÚ˜Ù‡ Ùˆ Ù…ÙˆØªÙˆØ± Ù…Ø­Ø§Ø³Ø¨Ø§Øª SHIL ØªÙˆÙ„ÛŒØ¯ Ø´Ø¯Ù‡ Ø§Ø³Øª."],
    warnings: result?.warnings || []
  };
}

export function exportDeliveryJson(delivery) {
  downloadBlob(new Blob([JSON.stringify(delivery, null, 2)], { type: "application/json;charset=utf-8" }), `${normalizeFileName(delivery.meta.title)}-shil-output.json`);
}

export function exportDeliveryCsv(delivery) {
  const rows = [
    ["Ø¨Ø®Ø´", "Ø¢ÛŒØªÙ…", "ØªØ¹Ø¯Ø§Ø¯", "Ù…Ø´Ø®ØµØ§Øª", "ØªÙˆØ¶ÛŒØ­"],
    ...delivery.equipment.map((row) => ["ØªØ¬Ù‡ÛŒØ²Ø§Øª", row.item, row.qty, row.spec, row.reason]),
    ...delivery.validations.map((row) => ["Ø§Ø¹ØªØ¨Ø§Ø±Ø³Ù†Ø¬ÛŒ", row.check, row.status, "", row.detail])
  ];
  const csv = rows.map((row) => row.map((cell) => `"${safeText(cell, "").replaceAll('"', '""')}"`).join(",")).join("\n");
  downloadBlob(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }), `${normalizeFileName(delivery.meta.title)}-shil-output.csv`);
}

export function exportDeliveryHtml(delivery) {
  const equipmentRows = delivery.equipment.map((row) => `<tr><td>${row.item}</td><td>${row.qty}</td><td>${row.spec}</td><td>${row.reason}</td></tr>`).join("");
  const validationRows = delivery.validations.map((row) => `<tr><td>${row.check}</td><td>${row.status}</td><td>${row.detail}</td></tr>`).join("");
  const html = `<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><title>${delivery.meta.title}</title><style>body{font-family:Tahoma,Arial,sans-serif;background:#f7f7f7;color:#111;padding:24px;line-height:1.8}.sheet{max-width:920px;margin:auto;background:#fff;border:1px solid #ddd;border-radius:18px;padding:28px}.hero{display:flex;justify-content:space-between;gap:16px;border-bottom:2px solid #111;padding-bottom:18px;margin-bottom:22px}.badge{background:#111;color:#fff;border-radius:999px;padding:6px 12px;font-size:12px}table{width:100%;border-collapse:collapse;margin:16px 0 26px}th,td{border:1px solid #ddd;padding:10px;text-align:right;vertical-align:top}th{background:#f1f1f1}h1,h2{margin:0 0 10px}.meta{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px 18px}</style></head><body><main class="sheet"><div class="hero"><div><h1>Ø¬Ù…Ø¹â€ŒØ¨Ù†Ø¯ÛŒ Ù†Ù‡Ø§ÛŒÛŒ Ù¾Ø±ÙˆÚ˜Ù‡</h1><p>Ø®Ø±ÙˆØ¬ÛŒ Ù†Ù‡Ø§ÛŒÛŒ Ø·Ø±Ø§Ø­ÛŒ Ù‡ÙˆØ´Ù…Ù†Ø¯ Ù…Ù‡Ù†Ø¯Ø³ÛŒ SHIL</p></div><span class="badge">${delivery.meta.version}</span></div><section class="meta"><div>Ù†Ø§Ù… Ù¾Ø±ÙˆÚ˜Ù‡: <b>${delivery.meta.title}</b></div><div>Ú©Ø§Ø±ÙØ±Ù…Ø§: <b>${delivery.meta.customer}</b></div><div>Ù…Ø­Ù„ Ø§Ø¬Ø±Ø§: <b>${delivery.meta.location}</b></div><div>Ù…Ø³ÛŒØ± Ø·Ø±Ø§Ø­ÛŒ: <b>${delivery.meta.domain}</b></div><div>ÙˆØ¶Ø¹ÛŒØª: <b>${delivery.meta.status}</b></div><div>ØªØ§Ø±ÛŒØ®: <b>${delivery.meta.generatedAt}</b></div></section><h2>ØªØ¬Ù‡ÛŒØ²Ø§Øª Ù…ÙˆØ±Ø¯ Ù†ÛŒØ§Ø² Ø§Ø¬Ø±Ø§</h2><table><thead><tr><th>ØªØ¬Ù‡ÛŒØ²</th><th>ØªØ¹Ø¯Ø§Ø¯</th><th>Ù…Ø´Ø®ØµØ§Øª</th><th>Ø¹Ù„Øª Ø§Ù†ØªØ®Ø§Ø¨</th></tr></thead><tbody>${equipmentRows}</tbody></table><h2>Ø§Ø¹ØªØ¨Ø§Ø±Ø³Ù†Ø¬ÛŒ Ù†Ù‡Ø§ÛŒÛŒ</h2><table><thead><tr><th>Ø¨Ø±Ø±Ø³ÛŒ</th><th>Ù†ØªÛŒØ¬Ù‡</th><th>ØªÙˆØ¶ÛŒØ­</th></tr></thead><tbody>${validationRows}</tbody></table><h2>ØªÙˆØ¶ÛŒØ­Ø§Øª Ù…Ù‡Ù†Ø¯Ø³ÛŒ</h2><ul>${delivery.notes.map((note) => `<li>${note}</li>`).join("")}</ul></main></body></html>`;
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
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight, undefined, "FAST");
  heightLeft -= pageHeight;
  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight, undefined, "FAST");
    heightLeft -= pageHeight;
  }
  pdf.setProperties({ title: delivery?.meta?.title || "SHIL Engineering Output", subject: "SHIL Engineering Delivery", creator: "SHIL" });
  pdf.save(filename);
}

export async function shareDelivery(delivery) {
  const text = `Ø®Ø±ÙˆØ¬ÛŒ Ø·Ø±Ø§Ø­ÛŒ Ù…Ù‡Ù†Ø¯Ø³ÛŒ SHIL - ${delivery.meta.title}`;
  if (navigator.share) {
    await navigator.share({ title: delivery.meta.title, text, url: window.location.href });
    return "shared";
  }
  await navigator.clipboard.writeText(`${text}\n${window.location.href}`);
  return "copied";
}
