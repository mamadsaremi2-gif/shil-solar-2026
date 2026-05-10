import { useProjectStore } from "../../../app/store/projectStore";

export function DashboardStats({ projectCount, systemStatus }) {
  const { setRoute, openAIPage } = useProjectStore();

  function handleOpenAI() {
    if (typeof openAIPage === "function") {
      openAIPage();
      return;
    }
    setRoute?.({ name: "ai" });
  }

  const isOnline = systemStatus?.tone === "success" || systemStatus?.title?.includes("متصل") || systemStatus?.title?.includes("آنلاین");

  return (
    <section className="shil-dashboard__stats shil-dashboard__stats--minimal" aria-label="خلاصه وضعیت داشبورد">
      <button
        type="button"
        className="shil-dashboard__stat shil-dashboard__stat--ai"
        onClick={handleOpenAI}
        aria-label="ورود به هوش مصنوعی SHIL"
      >
        <span>هوش مصنوعی SHIL</span>
        <strong>نسخه آزمایشی</strong>
        <small>دستیار تخصصی سیستم‌های خورشیدی و برق اضطراری</small>
      </button>

      <article className="shil-dashboard__stat shil-dashboard__stat--projects">
        <span>پروژه‌های من</span>
        <strong>{projectCount || 0}</strong>
        <small>در حال انجام و نهایی</small>
      </article>

      <div className={`network-status-pill is-${isOnline ? "online" : "offline"}`} title={systemStatus?.detail || ""}>
        <i aria-hidden="true" />
        <span>وضعیت شبکه: {isOnline ? "آنلاین" : "آفلاین"}</span>
      </div>
    </section>
  );
}
