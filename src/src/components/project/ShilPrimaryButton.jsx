import React from "react";

export default function ShilPrimaryButton({
  label = "تأیید",
  children,
  className = "",
  style,
  ...props
}) {
  const fixedStyle = {
    height: "46px",
    minHeight: "46px",
    maxHeight: "46px",
    width: "220px",
    minWidth: "220px",
    maxWidth: "220px",
    padding: "0 18px",
    fontSize: "11px",
    fontWeight: 900,
    lineHeight: 1,
    backgroundImage: "none",
    display: "block",
    position: "relative",
    left: "auto",
    right: "auto",
    bottom: "auto",
    transform: "none",
    marginLeft: "auto",
    marginRight: "auto",
    float: "none"
  };

  return (
    <button
      type="button"
      {...props}
      className={["shil-primary-wide", className].filter(Boolean).join(" ")}
      style={{ ...fixedStyle, ...(style || {}) }}
    >
      {label || children || "تأیید"}
    </button>
  );
}
