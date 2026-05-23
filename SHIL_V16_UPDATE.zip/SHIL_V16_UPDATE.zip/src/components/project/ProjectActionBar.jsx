import React from "react";

import {
  ArrowRight,
  Save,
  CheckCircle2,
} from "lucide-react";

export default function ProjectActionBar() {

  return (

    <div className="project-actionbar-v15">

      <button className="project-action-btn-v15 ghost">

        <ArrowRight size={18} />

        <span>
          مرحله قبل
        </span>

      </button>

      <button className="project-action-btn-v15 secondary">

        <Save size={18} />

        <span>
          ذخیره پیش‌نویس
        </span>

      </button>

      <button className="project-action-btn-v15 primary">

        <CheckCircle2 size={18} />

        <span>
          تایید مرحله
        </span>

      </button>

    </div>

  );
}
