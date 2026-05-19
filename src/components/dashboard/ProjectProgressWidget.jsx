import React from "react";

const projects = [

  {
    name: "Solar Farm A1",
    progress: 78,
  },

  {
    name: "Hybrid Site B4",
    progress: 54,
  },

  {
    name: "Emergency Grid C2",
    progress: 92,
  },

];

export default function ProjectProgressWidget() {

  return (

    <div className="project-progress-v15">

      <div className="widget-head-v15">

        <div>

          <span>PROJECTS</span>

          <h3>پیشرفت پروژه‌ها</h3>

        </div>

      </div>

      <div className="project-progress-list-v15">

        {projects.map((item) => (

          <div
            key={item.name}
            className="project-progress-item-v15"
          >

            <div className="project-progress-head-v15">

              <h4>{item.name}</h4>

              <span>
                {item.progress}%
              </span>

            </div>

            <div className="project-progress-bar-v15">

              <div
                className="project-progress-fill-v15"
                style={{
                  width:
                    `${item.progress}%`,
                }}
              />

            </div>

          </div>

        ))}

      </div>

    </div>

  );
}
