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
          <h3>Ø§Ø·Ù„Ø§Ø¹Ø§Øª ÙˆØ§Ù‚Ø¹ÛŒ Ù¾Ø±ÙˆÚ˜Ù‡</h3>
        </div>
      </div>

      <div className="engineering-form-grid-v15">

        <input
          value={project.title}
          placeholder="Ø¹Ù†ÙˆØ§Ù† Ù¾Ø±ÙˆÚ˜Ù‡"
          onChange={(e)=>
            setProjectField("title", e.target.value)
          }
        />

        <input
          value={project.customer}
          placeholder="Ù†Ø§Ù… Ù…Ø´ØªØ±ÛŒ"
          onChange={(e)=>
            setProjectField("customer", e.target.value)
          }
        />

        <input
          type="number"
          value={project.dailyEnergyWh}
          placeholder="Ù…ØµØ±Ù Ø±ÙˆØ²Ø§Ù†Ù‡"
          onChange={(e)=>
            setProjectField("dailyEnergyWh", Number(e.target.value))
          }
        />

        <input
          type="number"
          value={project.peakLoadW}
          placeholder="Ù¾ÛŒÚ© Ø¨Ø§Ø±"
          onChange={(e)=>
            setProjectField("peakLoadW", Number(e.target.value))
          }
        />

        <input
          type="number"
          value={project.backupHours}
          placeholder="Ø²Ù…Ø§Ù† Ø¨Ø±Ù‚ Ø§Ø¶Ø·Ø±Ø§Ø±ÛŒ Ù…ÙˆØ±Ø¯ Ù†ÛŒØ§Ø²"
          onChange={(e)=>
            setProjectField("backupHours", Number(e.target.value))
          }
        />

      </div>

    </section>

  );
}
