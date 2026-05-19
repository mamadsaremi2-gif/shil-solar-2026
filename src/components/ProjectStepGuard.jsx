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

  const emergencyDomain = localStorage.getItem("shil:calculationDomain") === "emergency" || location.pathname.includes("/emergency");
  const emergencySkippedSteps = emergencyDomain && ["summary", "run"].includes(stepKey) && Boolean(workflow.path?.approved);
  const editable = !stepKey || stepKey === "system" || emergencySkippedSteps || canEditStep(stepKey, workflow);
  const previous = stepKey ? getPreviousStep(stepKey) : null;

  return (
    <div className={editable ? "" : "shil-readonly-mode"} aria-disabled={!editable}>
      {!editable ? (
        <div className="shil-readonly-notice">
          Ø§ÛŒÙ† Ù…Ø±Ø­Ù„Ù‡ Ù‡Ù†ÙˆØ² ÙÙ‚Ø· Ù‚Ø§Ø¨Ù„ Ù…Ø´Ø§Ù‡Ø¯Ù‡ Ø§Ø³ØªØ› Ø§Ø¨ØªØ¯Ø§ Ù…Ø±Ø­Ù„Ù‡ Â«{previous?.title || "Ù‚Ø¨Ù„ÛŒ"}Â» Ø±Ø§ ØªÚ©Ù…ÛŒÙ„ Ùˆ ØªØ£ÛŒÛŒØ¯ Ú©Ù†ÛŒØ¯.
        </div>
      ) : null}
      {children}
    </div>
  );
}
