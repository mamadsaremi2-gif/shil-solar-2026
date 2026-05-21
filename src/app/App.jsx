import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import UXFlowController from "../components/UXFlowController.jsx";
import OfflineStatusBadge from "../components/offline/OfflineStatusBadge.jsx";
import WorkflowRouteGuard from "../components/WorkflowRouteGuard.jsx";

const LoginPage = lazy(() => import("../pages/LoginPage.jsx"));
const WelcomePage = lazy(() => import("../pages/WelcomePage.jsx"));
const Dashboard = lazy(() => import("../pages/Dashboard.jsx"));
const AdminDashboard = lazy(() => import("../pages/AdminDashboard.jsx"));
const NewProject = lazy(() => import("../pages/NewProject.jsx"));
const Projects = lazy(() => import("../pages/Projects.jsx"));
const Contact = lazy(() => import("../pages/Contact.jsx"));
const Feedback = lazy(() => import("../pages/Feedback.jsx"));
const Scenarios = lazy(() => import("../pages/Scenarios.jsx"));
const Assistant = lazy(() => import("../pages/Assistant.jsx"));
const Education = lazy(() => import("../pages/Education.jsx"));
const NotFoundPage = lazy(() => import("../pages/NotFoundPage.jsx"));

const ProjectInfo = lazy(() => import("../pages/project/ProjectInfo.jsx"));
const Environment = lazy(() => import("../pages/project/Environment.jsx"));
const ProjectPath = lazy(() => import("../pages/project/ProjectPath.jsx"));
const SolarSystemType = lazy(() => import("../pages/project/SolarSystemType.jsx"));
const CalculationMethod = lazy(() => import("../pages/project/CalculationMethod.jsx"));
const CalculationInputs = lazy(() => import("../pages/project/CalculationInputs.jsx"));
const ExecutionMethod = lazy(() => import("../pages/project/ExecutionMethod.jsx"));
const SystemSettings = lazy(() => import("../pages/project/SystemSettings.jsx"));
const SummaryPage = lazy(() => import("../pages/project/SummaryPage.jsx"));
const RunCalculation = lazy(() => import("../pages/project/RunCalculation.jsx"));
const UnderDevelopment = lazy(() => import("../pages/project/UnderDevelopment.jsx"));

function RouteFallback() {
  return <div className="shil-route-fallback" aria-live="polite" />;
}

export default function App() {
  return (
    <BrowserRouter>
      <UXFlowController />
      <OfflineStatusBadge />
      <WorkflowRouteGuard />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/welcome" element={<WelcomePage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
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
          <Route path="/new-project/future" element={<UnderDevelopment />} />

          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/running" element={<Projects view="running" />} />
          <Route path="/projects/final" element={<Projects view="final" />} />
          <Route path="/projects/archived" element={<Projects view="archived" />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/feedback" element={<Feedback />} />
          <Route path="/scenarios" element={<Scenarios />} />
          <Route path="/scenarios/:domain" element={<Scenarios />} />
          <Route path="/scenarios/:domain/:level" element={<Scenarios />} />
          <Route path="/assistant" element={<Assistant />} />
          <Route path="/education" element={<Education />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
