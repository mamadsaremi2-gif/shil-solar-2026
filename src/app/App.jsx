import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Dashboard from "../pages/Dashboard.jsx";
import NewProject from "../pages/NewProject.jsx";

import Projects from "../pages/Projects.jsx";
import Contact from "../pages/Contact.jsx";
import Feedback from "../pages/Feedback.jsx";
import Scenarios from "../pages/Scenarios.jsx";
import Assistant from "../pages/Assistant.jsx";

import ProjectInfo from "../pages/project/ProjectInfo.jsx";
import Environment from "../pages/project/Environment.jsx";
import ProjectPath from "../pages/project/ProjectPath.jsx";
import CalculationMethod from "../pages/project/CalculationMethod.jsx";
import CalculationInputs from "../pages/project/CalculationInputs.jsx";
import SystemSettings from "../pages/project/SystemSettings.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<Dashboard />} />

        <Route
          path="/new-project"
          element={<NewProject />}
        />

        <Route
          path="/new-project/info"
          element={<ProjectInfo />}
        />

        <Route
          path="/new-project/environment"
          element={<Environment />}
        />

        <Route
          path="/new-project/path"
          element={<Projects />}
        />

        <Route
          path="/new-project/method"
          element={<Projects />}
        />

        <Route
          path="/new-project/inputs"
          element={<Projects />}
        />

        <Route
          path="/new-project/system"
          element={<Projects />}
        />

        <Route
          path="/new-project/summary"
          element={<Projects />}
        />

        <Route
          path="/new-project/run"
          element={<Projects />}
        />

        <Route
          path="/new-project/future"
          element={<Projects />}
        />

        <Route path="/projects" element={<Projects />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/feedback" element={<Feedback />} />
        <Route path="/scenarios" element={<Scenarios />} />
        <Route path="/assistant" element={<Assistant />} />

      </Routes>
    </BrowserRouter>
  );
}
