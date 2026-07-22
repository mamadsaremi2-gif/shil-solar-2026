
import React, { useState } from "react";
import "./EquipmentBankCard.css";

export default function EquipmentBankCard({
  title,
  itemLabel,
  qtyLabel,
  sheetLabel,
  value,
  qty,
  children,
  onDatasheetClick
}) {
  const [open, setOpen] = useState(false);

  return (
    <section className="eq-bank-card">
      <div className="eq-bank-title">{title}</div>

      <table className="eq-bank-table">
        <thead>
          <tr>
            <th>انتخاب</th>
            <th>{itemLabel}</th>
            <th>{qtyLabel}</th>
            <th>{sheetLabel}</th>
          </tr>
        </thead>

        <tbody>
          <tr>
            <td>
              <button className="eq-bank-chip" type="button" onClick={() => setOpen(!open)}>
                {open ? "▲ بستن" : "▼ نمایش"}
              </button>
            </td>

            <td>{value}</td>
            <td>{qty}</td>

            <td>
              <button className="eq-bank-sheet" type="button" onClick={onDatasheetClick}>
                📄 مشاهده
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <div className={open ? "eq-bank-details open" : "eq-bank-details"}>
        {children}
      </div>
    </section>
  );
}
