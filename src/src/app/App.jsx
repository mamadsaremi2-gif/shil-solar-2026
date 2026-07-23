import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import UXFlowController from "../components/UXFlowController.jsx";
import OfflineStatusBadge from "../components/offline/OfflineStatusBadge.jsx";
import WorkflowRouteGuard from "../components/WorkflowRouteGuard.jsx";
import GlobalErrorBoundary from "../components/error/GlobalErrorBoundary.jsx";

const LoginPage = lazy(() => import("../modules/auth/pages/LoginPage.jsx"));
const WelcomePage = lazy(() => import("../modules/auth/pages/WelcomePage.jsx"));
const Dashboard = lazy(() => import("../modules/dashboard/pages/Dashboard.jsx"));
const AdminDashboard = lazy(() => import("../modules/admin/pages/AdminDashboard.jsx"));
const Projects = lazy(() => import("../modules/projects/pages/Projects.jsx"));
const Contact = lazy(() => import("../modules/contact/pages/Contact.jsx"));
const Feedback = lazy(() => import("../modules/feedback/pages/Feedback.jsx"));
const Scenarios = lazy(() => import("../modules/scenarios/pages/Scenarios.jsx"));
const Assistant = lazy(() => import("../modules/assistant/pages/Assistant.jsx"));
const Education = lazy(() => import("../modules/assistant/pages/Education.jsx"));
const NotFoundPage = lazy(() => import("../modules/common/pages/NotFoundPage.jsx"));

const ProjectInfo = lazy(() => import("../modules/new-project/pages/ProjectInfo.jsx"));
const Environment = lazy(() => import("../modules/new-project/pages/Environment.jsx"));
const ProjectPath = lazy(() => import("../modules/new-project/pages/ProjectPath.jsx"));
const SolarSystemType = lazy(() => import("../modules/new-project/pages/SolarSystemType.jsx"));
const CalculationMethod = lazy(() => import("../modules/new-project/pages/CalculationMethod.jsx"));
const CalculationInputs = lazy(() => import("../modules/new-project/pages/CalculationInputs.jsx"));
const SystemSettings = lazy(() => import("../modules/new-project/pages/SystemSettings.jsx"));
const EmergencySystemSettings = lazy(() => import("../pages/EmergencySystemSettings.jsx"));
const UtilitySystemSettings = lazy(() => import("../pages/UtilitySystemSettings.jsx"));
const SummaryPage = lazy(() => import("../modules/new-project/pages/SummaryPage.jsx"));
const RunCalculation = lazy(() => import("../modules/new-project/pages/RunCalculation.jsx"));
const UnderDevelopment = lazy(() => import("../modules/new-project/pages/UnderDevelopment.jsx"));

function RouteFallback() {
  return <div className="shil-route-fallback" aria-live="polite" />;
}

export default function App() {
  return (
    <BrowserRouter>
      <UXFlowController />
      <OfflineStatusBadge />
      <WorkflowRouteGuard />
      <GlobalErrorBoundary>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/welcome" element={<WelcomePage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/new-project" element={<Navigate to="/new-project/path" replace />} />

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
          <Route path="/new-project/execution/:domain" element={<ProjectPath />} />
          <Route path="/new-project/execution" element={<ProjectPath />} />
          <Route path="/new-project/system/emergency" element={<EmergencySystemSettings />} />
          <Route path="/new-project/system/utility" element={<UtilitySystemSettings />} />
          <Route path="/new-project/system/solar" element={<SystemSettings />} />
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
      </GlobalErrorBoundary>
    </BrowserRouter>
  );
}


import "../appearance/styles/shil-engineering-theme-v2.css";
