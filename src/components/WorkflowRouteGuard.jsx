import * as React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getFlowSafeRedirect } from "../workflow/flowIsolation.js";
import { showUxToast } from "../workflow/uxFlowController.js";

export default function WorkflowRouteGuard() {
  const location = useLocation();
  const navigate = useNavigate();

  React.useEffect(() => {
    const redirect = getFlowSafeRedirect(location.pathname, location.search);
    if (!redirect) return;

    if (redirect.includes("scenario-equipment-blocked")) {
      showUxToast("این لیست تجهیزات فقط بعد از انتخاب سناریوی آماده فعال می‌شود.", "warning");
    }
    if (redirect.includes("utility-blocked")) {
      showUxToast("مسیر نیروگاهی فقط از کارت مستقل نیروگاهی فعال می‌شود.", "warning");
    }
    navigate(redirect, { replace: true });
  }, [location.pathname, location.search, navigate]);

  return null;
}
