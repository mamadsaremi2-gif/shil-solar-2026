import { Suspense, lazy, useEffect } from "react";
import { DashboardPage } from "../pages/DashboardPage";
import { AuthGate } from "../features/auth/AuthGate";
import { useProjectStore } from "./store/projectStore";
import { OfflineStatus } from "../shared/components/OfflineStatus";

const ProjectWorkspacePage = lazy(() => import("../pages/ProjectWorkspacePage").then((m) => ({ default: m.ProjectWorkspacePage })));
const OutputPage = lazy(() => import("../pages/OutputPage").then((m) => ({ default: m.OutputPage })));
const EquipmentLibraryPage = lazy(() => import("../pages/EquipmentLibraryPage").then((m) => ({ default: m.EquipmentLibraryPage })));
const ReadyScenariosPage = lazy(() => import("../pages/ReadyScenariosPage").then((m) => ({ default: m.ReadyScenariosPage })));
const ContactPage = lazy(() => import("../pages/ContactPage").then((m) => ({ default: m.ContactPage })));
const AdminPage = lazy(() => import("../pages/AdminPage").then((m) => ({ default: m.AdminPage })));

function PageLoader() {
  return <div className="shell"><div className="panel empty-state">در حال بارگذاری ماژول...</div></div>;
}

export function App() {
  const { route } = useProjectStore();

  useEffect(() => {
    import("../shared/lib/usageTracker")
      .then(({ trackEvent }) => trackEvent("app_loaded", { path: window.location.pathname }))
      .catch(() => {});
  }, []);

  const renderRoute = () => {
    if (route.name === "workspace") {
      return (
        <Suspense fallback={<PageLoader />}>
          <ProjectWorkspacePage />
        </Suspense>
      );
    }

    if (route.name === "output") {
      return (
        <Suspense fallback={<PageLoader />}>
          <OutputPage />
        </Suspense>
      );
    }

    if (route.name === "equipment") {
      return (
        <Suspense fallback={<PageLoader />}>
          <EquipmentLibraryPage />
        </Suspense>
      );
    }

    if (route.name === "scenarios") {
      return (
        <Suspense fallback={<PageLoader />}>
          <ReadyScenariosPage />
        </Suspense>
      );
    }

    if (route.name === "contact") {
      return (
        <Suspense fallback={<PageLoader />}>
          <ContactPage />
        </Suspense>
      );
    }

    if (route.name === "admin") {
      return (
        <Suspense fallback={<PageLoader />}>
          <AdminPage />
        </Suspense>
      );
    }

    return <DashboardPage />;
  };

  return <AuthGate><OfflineStatus />{renderRoute()}</AuthGate>;
}
