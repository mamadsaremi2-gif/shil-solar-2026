import React, { Suspense, lazy, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import UXFlowController from "../components/UXFlowController.jsx";
import OfflineStatusBadge from "../components/offline/OfflineStatusBadge.jsx";
import InstallAppPrompt from "../components/pwa/InstallAppPrompt.jsx";
import WorkflowRouteGuard from "../components/WorkflowRouteGuard.jsx";
import GlobalErrorBoundary from "../components/error/GlobalErrorBoundary.jsx";
import { RequireAdmin, RequireSession } from "../auth/RouteGuards.jsx";
import SessionActivityManager from "../auth/SessionActivityManager.jsx";
import { bootstrapRuntimeAppData } from "../services/runtimeAppDataService.js";

const LoginPage = lazy(() => import("../modules/auth/pages/LoginPage.jsx"));
const RegisterPage = lazy(() => import("../modules/auth/pages/RegisterPage.jsx"));
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
const EmergencySystemSettings = lazy(() => import("../pages/project/EmergencySystemSettings.jsx"));
const UtilitySystemSettings = lazy(() => import("../pages/UtilitySystemSettings.jsx"));
const SummaryPage = lazy(() => import("../modules/new-project/pages/SummaryPage.jsx"));
const RunCalculation = lazy(() => import("../modules/new-project/pages/RunCalculation.jsx"));
const UnderDevelopment = lazy(() => import("../modules/new-project/pages/UnderDevelopment.jsx"));

function RouteFallback() {
  return <div className="shil-route-fallback" aria-live="polite" />;
}

export default function App() {
  useEffect(() => { bootstrapRuntimeAppData(); }, []);
  return (
    <BrowserRouter>
      <SessionActivityManager />
      <UXFlowController />
      <OfflineStatusBadge />
      <InstallAppPrompt />
      <WorkflowRouteGuard />
      <GlobalErrorBoundary>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/welcome" element={<RequireSession><WelcomePage /></RequireSession>} />
          <Route path="/dashboard" element={<RequireSession><Dashboard /></RequireSession>} />
          <Route path="/admin" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
          <Route path="/new-project" element={<RequireSession><Navigate to="/new-project/path?new=1" replace /></RequireSession>} />

          <Route path="/new-project/info" element={<RequireSession><ProjectInfo /></RequireSession>} />
          <Route path="/new-project/environment/:domain" element={<RequireSession><Environment /></RequireSession>} />
          <Route path="/new-project/environment" element={<RequireSession><Environment /></RequireSession>} />
          <Route path="/new-project/path" element={<RequireSession><ProjectPath /></RequireSession>} />
          <Route path="/new-project/solar/select" element={<RequireSession><SolarSystemType /></RequireSession>} />
          <Route path="/new-project/solar/:connection" element={<RequireSession><CalculationMethod /></RequireSession>} />
          <Route path="/new-project/emergency" element={<RequireSession><CalculationMethod /></RequireSession>} />
          <Route path="/new-project/method" element={<RequireSession><CalculationMethod /></RequireSession>} />
          <Route path="/new-project/input/:domain/:method" element={<RequireSession><CalculationInputs /></RequireSession>} />
          <Route path="/new-project/inputs/:domain" element={<RequireSession><CalculationInputs /></RequireSession>} />
          <Route path="/new-project/inputs" element={<RequireSession><CalculationInputs /></RequireSession>} />
          <Route path="/new-project/execution/:domain" element={<RequireSession><ProjectPath /></RequireSession>} />
          <Route path="/new-project/execution" element={<RequireSession><ProjectPath /></RequireSession>} />
          <Route path="/new-project/system/emergency" element={<RequireSession><EmergencySystemSettings /></RequireSession>} />
          <Route path="/new-project/system/utility" element={<RequireSession><UtilitySystemSettings /></RequireSession>} />
          <Route path="/new-project/system/solar" element={<RequireSession><SystemSettings /></RequireSession>} />
          <Route path="/new-project/system" element={<RequireSession><SystemSettings /></RequireSession>} />
          <Route path="/new-project/summary/:domain" element={<RequireSession><SummaryPage /></RequireSession>} />
          <Route path="/new-project/summary" element={<RequireSession><SummaryPage /></RequireSession>} />
          <Route path="/new-project/run/:domain" element={<RequireSession><RunCalculation /></RequireSession>} />
          <Route path="/new-project/run" element={<RequireSession><RunCalculation /></RequireSession>} />
          <Route path="/new-project/future" element={<RequireSession><UnderDevelopment /></RequireSession>} />

          <Route path="/projects" element={<RequireSession><Projects /></RequireSession>} />
          <Route path="/projects/running" element={<RequireSession><Projects view="running" /></RequireSession>} />
          <Route path="/projects/final" element={<RequireSession><Projects view="final" /></RequireSession>} />
          <Route path="/projects/archived" element={<RequireSession><Projects view="archived" /></RequireSession>} />
          <Route path="/contact" element={<RequireSession><Contact /></RequireSession>} />
          <Route path="/feedback" element={<RequireSession><Feedback /></RequireSession>} />
          <Route path="/scenarios" element={<RequireSession><Scenarios /></RequireSession>} />
          <Route path="/scenarios/:domain" element={<RequireSession><Scenarios /></RequireSession>} />
          <Route path="/scenarios/:domain/:level" element={<RequireSession><Scenarios /></RequireSession>} />
          <Route path="/assistant" element={<RequireSession><Assistant /></RequireSession>} />
          <Route path="/education" element={<RequireSession><Education /></RequireSession>} />
          <Route path="/education/:moduleSlug" element={<RequireSession><Education /></RequireSession>} />
          <Route path="/education/:moduleSlug/:topicSlug" element={<RequireSession><Education /></RequireSession>} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
      </GlobalErrorBoundary>
    </BrowserRouter>
  );
}


import "../appearance/styles/shil-engineering-theme-v2.css";
