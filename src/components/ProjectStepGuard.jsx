import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { canEditStep, getPreviousStep, getStepKeyFromPath, readWorkflowState } from "../workflow/projectWorkflow.js";

export default function ProjectStepGuard({ children }) {
  const location = useLocation();
  const stepKey = useMemo(() => getStepKeyFromPath(location.pathname), [location.pathname]);
  const [workflow, setWorkflow] = useState(() => readWorkflowState());

  useEffect(() => {
    const update = () => setWorkflow(readWorkflowState());
    window.addEventListener("storage", update);
    window.addEventListener("shil-workflow-updated", update);
    return () => {
      window.removeEventListener("storage", update);
      window.removeEventListener("shil-workflow-updated", update);
    };
  }, []);

  const editable = !stepKey || canEditStep(stepKey, workflow);
  const previous = stepKey ? getPreviousStep(stepKey) : null;

  return (
    <div className={editable ? "" : "shil-readonly-mode"} aria-disabled={!editable}>
      {!editable ? (
        <div className="shil-readonly-notice">
          این مرحله هنوز فقط قابل مشاهده است؛ ابتدا مرحله «{previous?.title || "قبلی"}» را تکمیل و تأیید کنید.
        </div>
      ) : null}
      {children}
    </div>
  );
}
