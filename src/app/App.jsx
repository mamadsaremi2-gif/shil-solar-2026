import { useEffect } from "react";
import { AppProvider } from "./providers/AppProvider";
import { useProjectStore } from "./store/projectStore";
import { useAuth } from "../features/auth/AuthProvider";
import LoginPage from "../features/auth/LoginPage";
import { AdminPage } from "../pages/AdminPage";
import { ContactPage } from "../pages/ContactPage";
import { DashboardPage } from "../pages/DashboardPage";
import { EquipmentLibraryPage } from "../pages/EquipmentLibraryPage";
import { OutputPage } from "../pages/OutputPage";
import { ProjectWorkspacePage } from "../pages/ProjectWorkspacePage";
import { ReadyScenariosPage } from "../pages/ReadyScenariosPage";

function AppShell() {
  const { route, syncCloudProjects } = useProjectStore();
  const { user, loading, isRejected, isPending, signOut } = useAuth();

  useEffect(() => {
    const handleOnline = () => {
      if (user?.id) void syncCloudProjects(user.id);
    };
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [syncCloudProjects, user?.id]);

  if (loading) {
    return (
      <div className="shell">
        <section className="panel"><strong>در حال بارگذاری...</strong></section>
      </div>
    );
  }

  if (!user) return <LoginPage />;

  if (isRejected) {
    return (
      <div className="shell">
        <section className="panel">
          <h2>دسترسی شما فعال نیست</h2>
          <p>برای بررسی وضعیت حساب با مدیر سامانه تماس بگیرید.</p>
          <button className="btn btn--primary" type="button" onClick={signOut}>خروج</button>
        </section>
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="shell">
        <section className="panel">
          <h2>حساب شما در انتظار تأیید است</h2>
          <p>پس از تأیید مدیر، امکان ورود کامل به اپ فعال می‌شود.</p>
          <button className="btn btn--primary" type="button" onClick={signOut}>خروج</button>
        </section>
      </div>
    );
  }

  switch (route.name) {
    case "admin":
      return <AdminPage />;
    case "contact":
      return <ContactPage />;
    case "equipment":
      return <EquipmentLibraryPage />;
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

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
