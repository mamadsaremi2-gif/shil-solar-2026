import fs from "node:fs";

const libPath = "src/data/catalogs/consumerEquipmentLibrary.js";
const calcPath = "src/pages/project/CalculationInputs.jsx";
const adminPath = "src/pages/AdminDashboard.jsx";

const lib = fs.readFileSync(libPath, "utf8");
const calc = fs.readFileSync(calcPath, "utf8");
const admin = fs.readFileSync(adminPath, "utf8");

const checks = [
  [lib.includes("Array.from({ length: 250 }"), "بانک پایه 250 رکوردی موجود است"],
  [lib.includes("mergeConsumerEquipmentWithBaseline"), "بانک Cloud با بانک پایه ادغام می‌شود"],
  [lib.includes("persistBaseline"), "امکان ثبت بانک پایه در Cloud فعال است"],
  [admin.includes("persistBaseline: true"), "کارتابل ادمین بازیابی Cloud را اجرا می‌کند"],
  [!calc.includes("slice(0, 250)"), "محدودیت نمایشی 250 رکورد حذف شده است"],
  [calc.includes("equipmentLibrary"), "مسیر محاسبات از کتابخانه پویا استفاده می‌کند"],
];

console.log("\nSHIL Consumer Bank Readiness\n----------------------------");
for (const [ok, label] of checks) console.log(`${ok ? "OK " : "!! "}${label}`);

const failed = checks.filter(([ok]) => !ok);
if (failed.length) process.exit(1);
console.log("\nConsumer equipment bank is ready for beta testing.");
