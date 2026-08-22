import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { approveProjectStep, canEditStep, getStepKeyFromPath } from "../workflow/projectWorkflow.js";

function getLabel(element) {
  const wrapper = element.closest("label");
  return wrapper?.querySelector("span")?.textContent?.trim() || element.getAttribute("aria-label") || "فیلد ضروری";
}

export default function StepConfirmLink({ to, state, children = "تأیید مرحله", requiredMessage }) {
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
      showAlert("این صفحه فقط قابل مشاهده است؛ مرحله قبلی هنوز تأیید نشده است.");
      return;
    }
    const requiredFields = Array.from(document.querySelectorAll("[data-required='true']"));
    const empty = requiredFields.find((field) => !String(field.value || "").trim());
    if (empty) {
      showAlert(requiredMessage || `فیلد «${getLabel(empty)}» ضروری است. لطفاً آن را تکمیل کنید.`);
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
