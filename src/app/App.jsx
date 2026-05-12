import { Suspense, lazy, useEffect } from "react";
import { AppProvider } from "./providers/AppProvider";
import { useProjectStore } from "./store/projectStore";
import { useAuth } from "../features/auth/AuthProvider";
import LoginPage from "../features/auth/LoginPage";
import { DashboardPage } from "../pages/DashboardPage";

const AdminPage = lazy(() => import("../pages/AdminPage").then((module) => ({ default: module.AdminPage })));
const ProjectsHubPage = lazy(() => import("../features/projects/ProjectsHubPage").then((module) => ({ default: module.ProjectsHubPage })));
const ContactPage = lazy(() => import("../pages/ContactPage").then((module) => ({ default: module.ContactPage })));
const EquipmentLibraryPage = lazy(() => import("../pages/EquipmentLibraryPage").then((module) => ({ default: module.EquipmentLibraryPage })));
const EducationPage = lazy(() => import("../features/education/EducationPage").then((module) => ({ default: module.EducationPage })));
const FeedbackPage = lazy(() => import("../features/feedback/FeedbackPage").then((module) => ({ default: module.FeedbackPage })));
const OutputPage = lazy(() => import("../pages/OutputPage").then((module) => ({ default: module.OutputPage })));
const ProjectWorkspacePage = lazy(() => import("../pages/ProjectWorkspacePage").then((module) => ({ default: module.ProjectWorkspacePage })));
const ReadyScenariosPage = lazy(() => import("../pages/ReadyScenariosPage").then((module) => ({ default: module.ReadyScenariosPage })));
const AIExpertSolar = lazy(() => import("../ai/AIExpertSolar"));

function RouteFallback() {
  return (
    <div className="shell route-loading-shell" dir="rtl">
      <section className="panel route-loading-card">
        <strong>در حال بارگذاری...</strong>
        <span>ماژول صفحه در حال آماده‌سازی است.</span>
      </section>
    </div>
  );
}

function renderRoute(route, isAdmin) {
  switch (route.name) {
    case "admin":
      return isAdmin ? <AdminPage /> : <DashboardPage />;
    case "projects":
      return <ProjectsHubPage />;
    case "ai":
      return <AIExpertSolar />;
    case "contact":
      return <ContactPage />;
    case "equipment":
      return <EquipmentLibraryPage />;
    case "education":
      return <EducationPage />;
    case "feedback":
      return <FeedbackPage />;
    case "output":
      return <OutputPage />;
    case "workspace":
      return <ProjectWorkspacePage />;
    case "scenarios":
      return <ReadyScenariosPage />;
    case "dashboard":
    default:
      return <DashboardPage />;
  }
}

function AppShell() {
  const { route, syncCloudProjects } = useProjectStore();
  const { user, loading, isRejected, isPending, signOut, isAdmin } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    window.location.reload();
  };

  useEffect(() => {
    const handleOnline = () => {
      if (user?.id) void syncCloudProjects(user.id);
    };
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [syncCloudProjects, user?.id]);

  if (loading) {
    return (
      <div className="shell route-loading-shell" dir="rtl">
        <section className="panel route-loading-card"><strong>در حال بارگذاری...</strong></section>
      </div>
    );
  }

  if (!user) return <LoginPage />;

  if (isRejected) {
    return (
      <div className="shell" dir="rtl">
        <section className="panel">
          <h2>دسترسی شما فعال نیست</h2>
          <p>برای بررسی وضعیت حساب با مدیر سامانه تماس بگیرید.</p>
          <button className="btn btn--primary" type="button" onClick={handleSignOut}>خروج</button>
        </section>
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="shell" dir="rtl">
        <section className="panel">
          <h2>حساب شما در انتظار تأیید است</h2>
          <p>پس از تأیید مدیر، امکان ورود کامل به اپ فعال می‌شود.</p>
          <button className="btn btn--primary" type="button" onClick={handleSignOut}>خروج</button>
        </section>
      </div>
    );
  }

  return <Suspense fallback={<RouteFallback />}>{renderRoute(route, isAdmin)}</Suspense>;
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
