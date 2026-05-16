import { useMemo, useState } from "react";
import ShilPageShell from "../../components/ShilPageShell.jsx";
import { consumerEquipmentLibrary } from "../../data/catalogs/consumerEquipmentLibrary.js";

export default function CalculationInputs() {
  const [query, setQuery] = useState("");

  const items = useMemo(() => {
    const q = query.trim();
    if (!q) return consumerEquipmentLibrary.slice(0, 80);
    return consumerEquipmentLibrary.filter((item) =>
      item.title.includes(q) || item.category.includes(q)
    );
  }, [query]);

  return (
    <ShilPageShell title="لیست تجهیزات مصرف‌کننده">
      <div className="shil-equipment-page">
        <section className="shil-env-card">
          <h3 className="shil-section-title">جستجوی تجهیزات</h3>
          <input
            className="shil-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="مثلاً یخچال، کولر، پمپ، روشنایی..."
          />
        </section>

        <section className="shil-equipment-list">
          {items.map((item) => (
            <button key={item.id} className="shil-equipment-card" type="button">
              <strong>{item.title}</strong>
              <span>{item.category}</span>
              <small>{item.defaultPowerW} W | Surge ×{item.surgeFactor} | {item.priority}</small>
            </button>
          ))}
        </section>
      </div>
    </ShilPageShell>
  );
}
