import React, { useState } from "react";
import { Link } from "react-router-dom";

function IconVisual({ item }) {
  const [failed, setFailed] = useState(false);
  if (item.image && !failed) {
    return <img src={item.image} alt="" onError={() => setFailed(true)} />;
  }
  return item.icon || null;
}

export default function IosIconGrid({ items = [], gridClass = "" }) {
  return (
    <section className={`shil-ios-grid ${gridClass}`}>
      {items.map((item) => (
        <Link key={item.title} to={item.to} aria-current={item.active ? "page" : undefined} className={`shil-ios-icon-link ${item.active ? "is-active-step" : ""}`} onClick={item.onClick}>
          <span className="shil-ios-icon-img" aria-hidden="true">
            <IconVisual item={item} />
          </span>
          <span className="shil-ios-icon-title">{item.title}</span>
        </Link>
      ))}
    </section>
  );
}
