import { NEW_PROJECT_STEPS } from "./newProject.steps.js";

export function NewProjectPage({ activeStep = 0, children }) {
  return <section className="shil-panel"><div className="shil-panel-title"><h2>Ù¾Ø±ÙˆÚ˜Ù‡ Ø¬Ø¯ÛŒØ¯</h2><span>{activeStep + 1}/9</span></div><div className="shil-path-strip">{NEW_PROJECT_STEPS.map((step, index) => <div key={step.id} className={`shil-step-chip ${index === activeStep ? "active" : ""}`}><b>{step.number}</b><span>{step.title}</span></div>)}</div>{children}</section>;
}
