import { DashboardStats } from "./DashboardStats";
import { SHIL_IMAGE_MANIFEST } from "../../../design/assetManifest";

const BRANDING_ASSETS = {
  desktopBg: SHIL_IMAGE_MANIFEST.dashboard.fullscreenDesktop.path,
  mobileBg: SHIL_IMAGE_MANIFEST.dashboard.fullscreenMobile.path,
  logo: SHIL_IMAGE_MANIFEST.dashboard.centerLogo.path,
};

export function DashboardHeroPanel({ isAdmin, projectCount, systemStatus }) {
  return (
    <section className="shil-dashboard-final" aria-label="داشبورد SHIL">
      <div
        className="shil-dashboard-final__visual"
        style={{
          "--dashboard-bg-desktop": `url(${BRANDING_ASSETS.desktopBg})`,
          "--dashboard-bg-mobile": `url(${BRANDING_ASSETS.mobileBg})`,
        }}
      >
        <img className="shil-dashboard-final__logo" src={BRANDING_ASSETS.logo} alt="SHIL IRAN" />
      </div>

      <section className="shil-dashboard-final__info-card" aria-label="خلاصه داشبورد">
        <div className="shil-dashboard-final__copy">
          <h1>داشبورد هوشمند طراحی سیستم‌های خورشیدی</h1>
          <p>طراحی، تحلیل و مدیریت حرفه‌ای پروژه‌های خورشیدی با رابط کاربری مهندسی، مدرن و برندمحور.</p>
        </div>

        <DashboardStats projectCount={projectCount} systemStatus={systemStatus} isAdmin={isAdmin} />
      </section>
    </section>
  );
}
