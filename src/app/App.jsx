import * as React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import UXFlowController from "../components/UXFlowController.jsx";
import OfflineStatusBadge from "../components/offline/OfflineStatusBadge.jsx";
import WorkflowRouteGuard from "../components/WorkflowRouteGuard.jsx";
import GlobalErrorBoundary from "../components/error/GlobalErrorBoundary.jsx";

const LoginPage = React.lazy(() => import("../modules/auth/pages/LoginPage.jsx"));
const WelcomePage = React.lazy(() => import("../modules/auth/pages/WelcomePage.jsx"));
const Dashboard = React.lazy(() => import("../modules/dashboard/pages/Dashboard.jsx"));
const AdminDashboard = React.lazy(() => import("../modules/admin/pages/AdminDashboard.jsx"));
const NewProject = React.lazy(() => import("../modules/new-project/pages/NewProject.jsx"));
const Projects = React.lazy(() => import("../modules/projects/pages/Projects.jsx"));
const Contact = React.lazy(() => import("../modules/contact/pages/Contact.jsx"));
const Feedback = React.lazy(() => import("../modules/feedback/pages/Feedback.jsx"));
const Scenarios = React.lazy(() => import("../modules/scenarios/pages/Scenarios.jsx"));
const Assistant = React.lazy(() => import("../modules/assistant/pages/Assistant.jsx"));
const Education = React.lazy(() => import("../modules/assistant/pages/Education.jsx"));
const NotFoundPage = React.lazy(() => import("../modules/common/pages/NotFoundPage.jsx"));

const ProjectInfo = React.lazy(() => import("../modules/new-project/pages/ProjectInfo.jsx"));
const Environment = React.lazy(() => import("../modules/new-project/pages/Environment.jsx"));
const ProjectPath = React.lazy(() => import("../modules/new-project/pages/ProjectPath.jsx"));
const SolarSystemType = React.lazy(() => import("../modules/new-project/pages/SolarSystemType.jsx"));
const CalculationMethod = React.lazy(() => import("../modules/new-project/pages/CalculationMethod.jsx"));
const CalculationInputs = React.lazy(() => import("../modules/new-project/pages/CalculationInputs.jsx"));
const ExecutionMethod = React.lazy(() => import("../modules/new-project/pages/ExecutionMethod.jsx"));
const SystemSettings = React.lazy(() => import("../modules/new-project/pages/SystemSettings.jsx"));
const SummaryPage = React.lazy(() => import("../modules/new-project/pages/SummaryPage.jsx"));
const RunCalculation = React.lazy(() => import("../modules/new-project/pages/RunCalculation.jsx"));
const UnderDevelopment = React.lazy(() => import("../modules/new-project/pages/UnderDevelopment.jsx"));

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
      <React.Suspense fallback={<RouteFallback />}>
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
      </React.Suspense>
      </GlobalErrorBoundary>
    </BrowserRouter>
  );
}
