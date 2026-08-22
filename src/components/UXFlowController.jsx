import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { captureCurrentProjectSnapshot, markCurrentProjectFinal } from "../workflow/uxFlowController.js";

function isProjectLandingPath(pathname) {
  return pathname === "/new-project" || pathname === "/new-project/path";
}

function isEngineeringPath(pathname = "") {
  // Every page in the new-project flow, including ProjectPath, owns persistent state.
  return pathname === "/new-project" || pathname.startsWith("/new-project/");
}

function safeParse(value, fallback = null) {
  try {
    return JSON.parse(value || "null") ?? fallback;
  } catch {
    return fallback;
  }
}

function currentProjectKey() {
  return localStorage.getItem("shil:activeProjectKey") || "active-draft";
}

function routeDraftKey(pathname) {
  const cleanPath = String(pathname || "").split("?")[0];
  return `shil:engineering-page-draft:v1:${currentProjectKey()}:${cleanPath}`;
}

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, 120);
}

function elementFingerprint(element, index) {
  const explicit =
    element.getAttribute("data-persist-key") ||
    element.getAttribute("name") ||
    element.id ||
    element.getAttribute("aria-label") ||
    element.getAttribute("placeholder");

  if (explicit) return `${element.tagName.toLowerCase()}:${normalizeText(explicit)}`;

  const label = element.closest("label");
  const labelText = normalizeText(label?.querySelector("span")?.textContent || label?.textContent);
  if (labelText) return `${element.tagName.toLowerCase()}:label:${labelText}`;

  return `${element.tagName.toLowerCase()}:index:${index}`;
}

function getPersistableFields() {
  return Array.from(document.querySelectorAll(
    ".shil-page-scroll input, .shil-page-scroll textarea, .shil-page-scroll select, " +
    ".shil-engineering-content input, .shil-engineering-content textarea, .shil-engineering-content select"
  )).filter((element) => {
    const type = String(element.getAttribute("type") || "").toLowerCase();
    return type !== "file" && type !== "password" && !element.hasAttribute("data-no-persist");
  });
}

function readFieldValue(element) {
  const type = String(element.getAttribute("type") || "").toLowerCase();
  if (type === "checkbox" || type === "radio") return Boolean(element.checked);
  return element.value;
}

function captureEngineeringPageDraft(pathname) {
  if (!isEngineeringPath(pathname)) return;

  const fields = getPersistableFields();
  const values = {};
  fields.forEach((element, index) => {
    values[elementFingerprint(element, index)] = readFieldValue(element);
  });

  const selectedChoices = Array.from(document.querySelectorAll(
    ".shil-page-scroll .shil-choice-card.is-selected, " +
    ".shil-page-scroll .shil-method-card.is-selected, " +
    ".shil-page-scroll [role='radio'][aria-checked='true'], " +
    ".shil-engineering-content .shil-choice-card.is-selected, " +
    ".shil-engineering-content .shil-method-card.is-selected, " +
    ".shil-engineering-content [role='radio'][aria-checked='true']"
  )).map((button) => ({
    key: button.getAttribute("data-persist-key") || button.id || normalizeText(button.textContent),
    group: normalizeText(button.parentElement?.className),
  })).filter((item) => item.key);

  const payload = {
    version: 1,
    pathname: String(pathname).split("?")[0],
    savedAt: new Date().toISOString(),
    values,
    selectedChoices,
  };

  localStorage.setItem(routeDraftKey(pathname), JSON.stringify(payload));
}

function setNativeValue(element, value) {
  const type = String(element.getAttribute("type") || "").toLowerCase();
  if (type === "checkbox" || type === "radio") {
    const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "checked");
    descriptor?.set?.call(element, Boolean(value));
    return;
  }

  const prototype = element instanceof HTMLTextAreaElement
    ? HTMLTextAreaElement.prototype
    : element instanceof HTMLSelectElement
      ? HTMLSelectElement.prototype
      : HTMLInputElement.prototype;
  const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");
  descriptor?.set?.call(element, value ?? "");
}

function restoreEngineeringPageDraft(pathname) {
  if (!isEngineeringPath(pathname)) return;
  const draft = safeParse(localStorage.getItem(routeDraftKey(pathname)), null);
  if (!draft?.values) return;

  const fields = getPersistableFields();
  fields.forEach((element, index) => {
    const key = elementFingerprint(element, index);
    if (!Object.prototype.hasOwnProperty.call(draft.values, key)) return;
    const nextValue = draft.values[key];
    if (readFieldValue(element) === nextValue) return;

    setNativeValue(element, nextValue);
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
  });

  for (const savedChoice of draft.selectedChoices || []) {
    const candidates = Array.from(document.querySelectorAll(
      ".shil-page-scroll .shil-choice-card, .shil-page-scroll .shil-method-card, .shil-page-scroll [role='radio'], " +
      ".shil-engineering-content .shil-choice-card, .shil-engineering-content .shil-method-card, .shil-engineering-content [role='radio']"
    ));
    const match = candidates.find((button) => {
      const key = button.getAttribute("data-persist-key") || button.id || normalizeText(button.textContent);
      return key === savedChoice.key;
    });
    if (match && !match.classList.contains("is-selected") && match.getAttribute("aria-checked") !== "true") {
      match.click();
    }
  }

  window.dispatchEvent(new CustomEvent("shil-engineering-draft-restored", {
    detail: { pathname: String(pathname).split("?")[0], savedAt: draft.savedAt },
  }));
}

export default function UXFlowController() {
  const location = useLocation();
  const [toast, setToast] = useState(null);
  const activePathRef = useRef(location.pathname);


  useEffect(() => {
    // Never save the previous route here: at effect time React may already have
    // committed the next page DOM. Saving then would overwrite the previous
    // page draft with fields from the new page.
    activePathRef.current = location.pathname;

    const timers = [0, 50, 140, 320, 700, 1200].map((delay) => window.setTimeout(() => {
      restoreEngineeringPageDraft(location.pathname);
    }, delay));

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [location.pathname]);

  useEffect(() => {
    const confirmedHandler = (event) => {
      const pathname = event.detail?.pathname || activePathRef.current || window.location.pathname;
      captureEngineeringPageDraft(pathname);
      window.setTimeout(() => {
        const isFinal = ["summary", "run"].includes(event.detail?.stepKey) || pathname.includes("/new-project/run/");
        if (isFinal) markCurrentProjectFinal();
        else captureCurrentProjectSnapshot(pathname, "running");
        setToast({ text: isFinal ? "پروژه در پروژه‌های نهایی ذخیره شد" : "مرحله تأیید و در پروژه‌های در حال اجرا ذخیره شد", type: "success" });
        window.setTimeout(() => setToast(null), 1800);
      }, 0);
    };

    const toastHandler = (event) => {
      setToast({ text: event.detail?.message || "انجام شد", type: event.detail?.type || "info" });
      window.setTimeout(() => setToast(null), 1800);
    };

    window.addEventListener("shil-project-step-confirmed", confirmedHandler);
    window.addEventListener("shil-ux-toast", toastHandler);
    return () => {
      window.removeEventListener("shil-project-step-confirmed", confirmedHandler);
      window.removeEventListener("shil-ux-toast", toastHandler);
    };
  }, []);

  if (!toast) return null;
  return <div className={`shil-ux-toast ${toast.type}`}>{toast.text}</div>;
}
