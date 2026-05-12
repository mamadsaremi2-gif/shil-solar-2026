import { useEffect } from "react";
import { AppProvider } from "./providers/AppProvider";
import { useProjectStore } from "./store/projectStore";
import { useAuth } from "../features/auth/AuthProvider";
import LoginPage from "../features/auth/LoginPage";
import { AdminPage } from "../pages/AdminPage";
import { ContactPage } from "../pages/ContactPage";
import { DashboardPage } from "../pages/DashboardPage";
import { ProjectsHubPage } from "../features/projects/ProjectsHubPage";
import { EquipmentLibraryPage } from "../pages/EquipmentLibraryPage";
import { EducationPage } from "../features/education/EducationPage";
import { FeedbackPage } from "../features/feedback/FeedbackPage";
import { OutputPage } from "../pages/OutputPage";
import { ProjectWorkspacePage } from "../pages/ProjectWorkspacePage";
import { ReadyScenariosPage } from "../pages/ReadyScenariosPage";
import AIExpertSolar from "../ai/AIExpertSolar";
import { AppHeader } from "../layout/AppHeader";
import { AppFooter } from "../layout/AppFooter";
import { OfflineStatus } from "../shared/components/OfflineStatus";
import { PwaInstallPrompt } from "../ui/PwaInstallPrompt";

const INTERNAL_PAGE_TITLES = {
  admin: "مدیریت سامانه",
  projects: "پروژه‌ها",
  ai: "هوش مصنوعی SHIL",
  contact: "ارتباط با ما",
  equipment: "بانک تجهیزات",
  education: "آموزش",
  feedback: "اعلام نظر کاربران",
  output: "خروجی مهندسی",
  workspace: "مسیر طراحی پروژه",
  scenarios: "سناریوهای آماده",
};

function InternalMobileFrame({ title, routeName, children }) {
  const { goDashboard, prevStep, nextStep, saveDraftProject } = useProjectStore();

  return (
    <main className={`shil-v17-shell shil-v22-shell route-${routeName}`} dir="rtl">
      <a className="shil-v22-skip-link" href="#shil-main-content">رفتن به محتوای اصلی</a>
      <AppHeader title={title} onHome={goDashboard} />
      <section id="shil-main-content" className="shil-v17-scroll" aria-label={title} tabIndex={-1}>
        <div className="shil-v17-page-host">{children}</div>
      </section>
      <div className="shil-v22-system-status"><OfflineStatus /></div>
      <PwaInstallPrompt />
      <AppFooter
        routeName={routeName}
        onHome={goDashboard}
        onPrev={prevStep}
        onNext={nextStep}
        onSave={saveDraftProject}
      />
    </main>
  );
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
          <button className="btn btn--primary" type="button" onClick={handleSignOut}>خروج</button>
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
          <button className="btn btn--primary" type="button" onClick={handleSignOut}>خروج</button>
        </section>
      </div>
    );
  }

  let page;
  switch (route.name) {
    case "admin":
      page = isAdmin ? <AdminPage /> : <DashboardPage />;
      break;
    case "projects":
      page = <ProjectsHubPage />;
      break;
    case "ai":
      page = <AIExpertSolar />;
      break;
    case "contact":
      page = <ContactPage />;
      break;
    case "equipment":
      page = <EquipmentLibraryPage />;
      break;
    case "education":
      page = <EducationPage />;
      break;
    case "feedback":
      page = <FeedbackPage />;
      break;
    case "output":
      page = <OutputPage />;
      break;
    case "workspace":
      page = <ProjectWorkspacePage />;
      break;
    case "scenarios":
      page = <ReadyScenariosPage />;
      break;
    case "dashboard":
    default:
      return <DashboardPage />;
  }

  return (
    <InternalMobileFrame title={INTERNAL_PAGE_TITLES[route.name] ?? "SHIL"} routeName={route.name}>
      {page}
    </InternalMobileFrame>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
