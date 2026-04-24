import { Suspense, lazy } from "react";
import { DashboardPage } from "../pages/DashboardPage";
import { useProjectStore } from "./store/projectStore";

const ProjectWorkspacePage = lazy(() => import("../pages/ProjectWorkspacePage").then((m) => ({ default: m.ProjectWorkspacePage })));
const OutputPage = lazy(() => import("../pages/OutputPage").then((m) => ({ default: m.OutputPage })));
const EquipmentLibraryPage = lazy(() => import("../pages/EquipmentLibraryPage").then((m) => ({ default: m.EquipmentLibraryPage })));
const ContactPage = lazy(() => import("../pages/ContactPage").then((m) => ({ default: m.ContactPage })));

function PageLoader() {
  return <div className="shell"><div className="panel empty-state">در حال بارگذاری ماژول...</div></div>;
}

export function App() {
  const { route } = useProjectStore();

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

  if (route.name === "contact") {
    return (
      <Suspense fallback={<PageLoader />}>
        <ContactPage />
      </Suspense>
    );
  }

  return <DashboardPage />;
}
