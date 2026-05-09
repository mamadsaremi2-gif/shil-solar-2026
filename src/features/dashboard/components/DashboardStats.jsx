import { useProjectStore } from "../../../app/store/projectStore";

export function DashboardStats({ projectCount, systemStatus, isAdmin }) {
  const { setRoute, openAIPage } = useProjectStore();

  function handleOpenAI() {
    if (typeof openAIPage === "function") {
      openAIPage();
      return;
    }

    setRoute?.({ name: "ai" });
  }

  return (
    <section className="shil-dashboard__stats" aria-label="خلاصه وضعیت">
      <article className="shil-dashboard__stat">
        <span className="shil-dashboard__stat-icon" aria-hidden="true">▣</span>
        <span>پروژه‌ها</span>
        <strong>{projectCount || 0}</strong>
      </article>

      <article className={`shil-dashboard__stat shil-dashboard__stat--system is-${systemStatus.tone}`}>
        <span className="shil-dashboard__stat-icon" aria-hidden="true">●</span>
        <span>وضعیت سامانه</span>
        <strong>{systemStatus.title}</strong>
        <small>{systemStatus.detail}</small>
      </article>

      <article className="shil-dashboard__stat">
        <span className="shil-dashboard__stat-icon" aria-hidden="true">◎</span>
        <span>سطح دسترسی</span>
        <strong>{isAdmin ? "مدیر" : "کاربر"}</strong>
      </article>

      <button
        type="button"
        className="shil-dashboard__stat shil-dashboard__stat--ai"
        onClick={handleOpenAI}
        aria-label="ورود به هوش مصنوعی SHIL"
      >
        <span className="shil-dashboard__stat-icon" aria-hidden="true">✦</span>
        <span>هوش مصنوعی SHIL</span>
        <strong>نسخه آزمایشی</strong>
        <small>دستیار تخصصی سیستم‌های خورشیدی و برق اضطراری</small>
      </button>
    </section>
  );
}
