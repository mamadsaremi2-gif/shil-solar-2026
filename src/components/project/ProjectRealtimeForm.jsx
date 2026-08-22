import React from "react";
import { useProjectStore } from "../../store/projectStore.js";

export default function ProjectRealtimeForm() {

  const {
    project,
    setProjectField,
  } = useProjectStore();

  return (

    <section className="engineering-form-v15">

      <div className="widget-head-v15">
        <div>
          <span>PROJECT ENGINE</span>
          <h3>اطلاعات واقعی پروژه</h3>
        </div>
      </div>

      <div className="engineering-form-grid-v15">

        <input
          value={project.title}
          placeholder="عنوان پروژه"
          onChange={(e)=>
            setProjectField("title", e.target.value)
          }
        />

        <input
          value={project.customer}
          placeholder="نام مشتری"
          onChange={(e)=>
            setProjectField("customer", e.target.value)
          }
        />

        <input
          type="number"
          value={project.dailyEnergyWh}
          placeholder="مصرف روزانه"
          onChange={(e)=>
            setProjectField("dailyEnergyWh", Number(e.target.value))
          }
        />

        <input
          type="number"
          value={project.peakLoadW}
          placeholder="پیک بار"
          onChange={(e)=>
            setProjectField("peakLoadW", Number(e.target.value))
          }
        />

        <input
          type="number"
          value={project.backupHours}
          placeholder="زمان برق اضطراری مورد نیاز"
          onChange={(e)=>
            setProjectField("backupHours", Number(e.target.value))
          }
        />

      </div>

    </section>

  );
}
