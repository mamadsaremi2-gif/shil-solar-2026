import { useMemo } from "react";
import { useProjectStore } from "../../app/store/projectStore";
import { useAuth } from "../auth/AuthProvider";
import { DashboardActionGrid } from "./components/DashboardActionGrid";
import { DashboardHeroPanel } from "./components/DashboardHeroPanel";
import { useSystemStatus } from "./hooks/useSystemStatus";
import { buildDashboardCards } from "./model/dashboardCards";

export function DashboardPage() {
  const { projects, startNewProject, openScenarios, openContact, openAdmin } = useProjectStore();
  const { signOut, profile, isAdmin, isOfflineMode } = useAuth();
  const systemStatus = useSystemStatus(isOfflineMode);

  const dashboardCards = useMemo(
    () => buildDashboardCards({
      isAdmin,
      startNewProject,
      openContact,
      openScenarios,
      openAdmin,
      signOut,
    }),
    [isAdmin, openAdmin, openContact, openScenarios, signOut, startNewProject],
  );

  return (
    <main className="shil-dashboard" dir="rtl">
      <DashboardHeroPanel
        isAdmin={isAdmin}
        profile={profile}
        projectCount={projects.length}
        systemStatus={systemStatus}
      />
      <DashboardActionGrid cards={dashboardCards} />
    </main>
  );
}
