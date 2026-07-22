import React from "react";
import { createPortal } from "react-dom";

/**
 * Shows engineering warnings above the page data without taking space in the
 * document flow. The overlay stays above the bottom navigation and does not
 * affect the position of confirmation buttons.
 */
export default function ShilWarningOverlay({ messages = [], children = null }) {
  const items = Array.isArray(messages) ? messages.filter(Boolean) : [messages].filter(Boolean);
  if (children) items.push(children);
  if (!items.length || typeof document === "undefined") return null;

  return createPortal(
    <div className="shil-warning-overlay" role="status" aria-live="polite">
      {items.map((item, index) => (
        <div className="shil-warning-overlay-item" key={typeof item === "string" ? item : `warning-${index}`}>
          <span className="shil-warning-overlay-icon" aria-hidden="true">!</span>
          <div>{item}</div>
        </div>
      ))}
    </div>,
    document.body,
  );
}
