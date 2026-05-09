import { PUBLIC_ASSETS } from "../../../shared/constants/publicAssets";

export function DashboardHeader({ isAdmin, profile }) {
  return (
    <header className="shil-dashboard__header">
      <div className="shil-dashboard__brand">
        <img src={PUBLIC_ASSETS.branding.appLogo} alt="SHIL IRAN" />
        <div>
          <strong>SHIL IRAN</strong>
          <span>Smart Solar Engineering Platform</span>
        </div>
      </div>

      <div className="shil-dashboard__user">
        <span>{isAdmin ? "Admin Access" : "User Access"}</span>
        <strong>{profile?.full_name || "کاربر SHIL"}</strong>
      </div>
    </header>
  );
}
