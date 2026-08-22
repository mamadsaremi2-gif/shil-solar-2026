import React from "react";

export default function GlassCard({
  children,
  className = "",
}) {
  return (
    <div className={`glass-card-v15 ${className}`}>
      {children}
    </div>
  );
}
