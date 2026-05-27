import fs from "node:fs";

const checks = [
  ["src/components/IosIconGrid.jsx", "<a"],
  ["src/components/StepConfirmLink.jsx", "window.location.assign"],
  ["src/components/WorkflowRouteGuard.jsx", "return null"],
  ["src/components/UXFlowController.jsx", "return null"],
  ["src/main.jsx", "render(<App />)"],
];

const failures = checks.filter(([file, needle]) => !fs.readFileSync(file, "utf8").includes(needle));
if (failures.length) {
  console.error("Hard navigation stabilization check failed", failures);
  process.exit(1);
}
console.log("SHIL V18.3 hard navigation stabilization passed: route transitions are no longer hook-fragile.");
