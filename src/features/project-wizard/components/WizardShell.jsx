import { useProjectStore } from "../../../app/store/projectStore";

export function WizardShell({ title, children, actions }) {
  const { steps, stepIndex, goToStep } = useProjectStore();

  return (
    <div className="workspace-grid">
      <aside className="stepper-panel panel">
        <div className="panel__header"><h3>مسیر طراحی</h3></div>
        <div className="stepper-list">
          {steps.map((step, index) => (
            <button
              key={step.key}
              className={`stepper-item ${stepIndex === index ? "is-active" : ""}`}
              onClick={() => goToStep(index)}
            >
              <span>{index + 1}</span>
              <strong>{step.label}</strong>
            </button>
          ))}
        </div>
      </aside>
      <section className="panel panel--content">
        <div className="panel__header"><h2>{title}</h2></div>
        {children}
        <div className="action-bar">{actions}</div>
      </section>
    </div>
  );
}
