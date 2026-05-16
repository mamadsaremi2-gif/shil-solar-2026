import React from "react";

const tasks = [

  {
    title: "????? ??????? ??????",
    status: "completed",
  },

  {
    title: "????? ????? ????????",
    status: "running",
  },

  {
    title: "????? ??????????",
    status: "pending",
  },

  {
    title: "????? PDF ?????",
    status: "pending",
  },

];

export default function TaskPipelineWidget() {

  return (

    <div className="task-pipeline-v15">

      <div className="widget-head-v15">

        <div>

          <span>PIPELINE</span>

          <h3>????? ?????? ?????</h3>

        </div>

      </div>

      <div className="task-pipeline-list-v15">

        {tasks.map((task, index) => (

          <div
            key={index}
            className={`
              task-item-v15
              ${task.status}
            `}
          >

            <div className="task-indicator-v15" />

            <div className="task-content-v15">

              <h4>{task.title}</h4>

              <p>{task.status}</p>

            </div>

          </div>

        ))}

      </div>

    </div>

  );
}
