import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { approveProjectStep, canEditStep, getStepKeyFromPath } from "../workflow/projectWorkflow.js";

function getLabel(element) {
  const wrapper = element.closest("label");
  return wrapper?.querySelector("span")?.textContent?.trim() || element.getAttribute("aria-label") || "ÙÛŒÙ„Ø¯ Ø¶Ø±ÙˆØ±ÛŒ";
}

export default function StepConfirmLink({ to, state, children = "ØªØ£ÛŒÛŒØ¯ Ù…Ø±Ø­Ù„Ù‡", requiredMessage }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [alert, setAlert] = useState("");

  const showAlert = (message) => {
    setAlert(message);
    window.clearTimeout(showAlert.timer);
    showAlert.timer = window.setTimeout(() => setAlert(""), 4200);
  };

  const onClick = () => {
    const stepKey = getStepKeyFromPath(location.pathname);
    if (stepKey && !canEditStep(stepKey)) {
      showAlert("Ø§ÛŒÙ† ØµÙØ­Ù‡ ÙÙ‚Ø· Ù‚Ø§Ø¨Ù„ Ù…Ø´Ø§Ù‡Ø¯Ù‡ Ø§Ø³ØªØ› Ù…Ø±Ø­Ù„Ù‡ Ù‚Ø¨Ù„ÛŒ Ù‡Ù†ÙˆØ² ØªØ£ÛŒÛŒØ¯ Ù†Ø´Ø¯Ù‡ Ø§Ø³Øª.");
      return;
    }
    const requiredFields = Array.from(document.querySelectorAll("[data-required='true']"));
    const empty = requiredFields.find((field) => !String(field.value || "").trim());
    if (empty) {
      showAlert(requiredMessage || `ÙÛŒÙ„Ø¯ Â«${getLabel(empty)}Â» Ø¶Ø±ÙˆØ±ÛŒ Ø§Ø³Øª. Ù„Ø·ÙØ§Ù‹ Ø¢Ù† Ø±Ø§ ØªÚ©Ù…ÛŒÙ„ Ú©Ù†ÛŒØ¯.`);
      empty.focus?.();
      return;
    }
    if (stepKey) approveProjectStep(stepKey);
    navigate(to, { state });
  };

  return (
    <>
      {alert ? <div className="shil-toast-alert">{alert}</div> : null}
      <button type="button" className="shil-primary-wide" onClick={onClick}>{children}</button>
    </>
  );
}
