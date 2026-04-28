export default function ShilWorkspaceHero() {
  return (
    <section className="shil-workspace-hero" aria-label="SHIL workspace hero">
      <img
        className="shil-workspace-hero__image"
        src="/images/workspace/shil-solar-hero.png"
        alt="محصولات SHIL برای سیستم‌های خورشیدی و حفاظت برق"
      />
      <div className="shil-workspace-hero__shade" />
      <img
        className="shil-workspace-hero__logo"
        src="/images/workspace/shil-logo-purple.png"
        alt="SHIL"
      />
      <div className="shil-workspace-hero__content">
        <span className="shil-workspace-hero__eyebrow">SHIL Engineering Workspace</span>
        <h1>طراحی هوشمند سیستم برق و خورشیدی</h1>
        <p>
          محاسبه، انتخاب تجهیزات، بررسی باتری و خروجی مهندسی در یک مسیر ساده و حرفه‌ای.
        </p>
        <div className="shil-workspace-hero__chips">
          <span>محاسبات آفلاین</span>
          <span>پیشنهاد هوشمند</span>
          <span>محصولات SHIL</span>
        </div>
      </div>
    </section>
  );
}
