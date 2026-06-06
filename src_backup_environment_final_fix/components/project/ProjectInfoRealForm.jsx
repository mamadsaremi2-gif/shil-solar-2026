import React from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  useProjectStore,
} from "../../store/projectStore.js";

export default function ProjectInfoRealForm() {

  const navigate =
    useNavigate();

  const {
    project,
    setProjectField,
  } = useProjectStore();

  function handleNext() {

    navigate("/new-project/environment");

  }

  return (

    <section className="project-real-form-v15">

      <div className="project-real-grid-v15">

        <input
          placeholder="????? ?????"
          value={project.title}
          onChange={(e)=>
            setProjectField(
              "title",
              e.target.value
            )
          }
        />

        <input
          placeholder="??? ?????"
          value={project.customer}
          onChange={(e)=>
            setProjectField(
              "customer",
              e.target.value
            )
          }
        />

        <input
          type="number"
          placeholder="???? ?????? (Wh)"
          value={project.dailyEnergyWh}
          onChange={(e)=>
            setProjectField(
              "dailyEnergyWh",
              Number(e.target.value)
            )
          }
        />

        <input
          type="number"
          placeholder="??? ??? (W)"
          value={project.peakLoadW}
          onChange={(e)=>
            setProjectField(
              "peakLoadW",
              Number(e.target.value)
            )
          }
        />

        <textarea
          placeholder="??????? ?????"
        />

      </div>

      <button
        type="button"
        className="project-next-btn-v15"
        onClick={handleNext}
      >

        ????? ????? ???

      </button>

    </section>

  );

}
