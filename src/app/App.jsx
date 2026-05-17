import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import LoginPage from "../pages/LoginPage.jsx";
import WelcomePage from "../pages/WelcomePage.jsx";
import Dashboard from "../pages/Dashboard.jsx";
import NewProject from "../pages/NewProject.jsx";
import Projects from "../pages/Projects.jsx";
import Contact from "../pages/Contact.jsx";
import Feedback from "../pages/Feedback.jsx";
import Scenarios from "../pages/Scenarios.jsx";
import Assistant from "../pages/Assistant.jsx";
import Education from "../pages/Education.jsx";
import NotFoundPage from "../pages/NotFoundPage.jsx";

import ProjectInfo from "../pages/project/ProjectInfo.jsx";
import Environment from "../pages/project/Environment.jsx";
import ProjectPath from "../pages/project/ProjectPath.jsx";
import SolarSystemType from "../pages/project/SolarSystemType.jsx";
import CalculationMethod from "../pages/project/CalculationMethod.jsx";
import CalculationInputs from "../pages/project/CalculationInputs.jsx";
import ExecutionMethod from "../pages/project/ExecutionMethod.jsx";
import SystemSettings from "../pages/project/SystemSettings.jsx";
import SummaryPage from "../pages/project/SummaryPage.jsx";
import RunCalculation from "../pages/project/RunCalculation.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/welcome" element={<WelcomePage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/new-project" element={<NewProject />} />

        <Route path="/new-project/info" element={<ProjectInfo />} />
        <Route path="/new-project/environment/:domain" element={<Environment />} />
        <Route path="/new-project/environment" element={<Environment />} />
        <Route path="/new-project/path" element={<ProjectPath />} />
        <Route path="/new-project/solar/select" element={<SolarSystemType />} />
        <Route path="/new-project/solar/:connection" element={<CalculationMethod />} />
        <Route path="/new-project/emergency" element={<CalculationMethod />} />
        <Route path="/new-project/method" element={<CalculationMethod />} />
        <Route path="/new-project/input/:domain/:method" element={<CalculationInputs />} />
        <Route path="/new-project/inputs/:domain" element={<CalculationInputs />} />
        <Route path="/new-project/inputs" element={<CalculationInputs />} />
        <Route path="/new-project/execution/:domain" element={<ExecutionMethod />} />
        <Route path="/new-project/execution" element={<ExecutionMethod />} />
        <Route path="/new-project/system/:domain" element={<SystemSettings />} />
        <Route path="/new-project/system" element={<SystemSettings />} />
        <Route path="/new-project/summary/:domain" element={<SummaryPage />} />
        <Route path="/new-project/summary" element={<SummaryPage />} />
        <Route path="/new-project/run/:domain" element={<RunCalculation />} />
        <Route path="/new-project/run" element={<RunCalculation />} />
        <Route path="/new-project/future" element={<NewProject />} />

        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/running" element={<Projects view="running" />} />
        <Route path="/projects/final" element={<Projects view="final" />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/feedback" element={<Feedback />} />
        <Route path="/scenarios" element={<Scenarios />} />
        <Route path="/scenarios/:domain" element={<Scenarios />} />
        <Route path="/scenarios/:domain/:level" element={<Scenarios />} />
        <Route path="/assistant" element={<Assistant />} />
        <Route path="/education" element={<Education />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
