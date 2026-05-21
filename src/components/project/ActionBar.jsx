import React from "react";

import {
  ChevronLeft,
  Save,
  CheckCircle2,
} from "lucide-react";

export default function ActionBar() {
  return (
    <div className="project-actionbar-v15">

      <button className="action-btn-v15 secondary">
        <ChevronLeft size={18} />
        ????? ???
      </button>

      <button className="action-btn-v15">
        <Save size={18} />
        ?????
      </button>

      <button className="action-btn-v15 primary">
        <CheckCircle2 size={18} />
        ?????
      </button>

    </div>
  );
}
