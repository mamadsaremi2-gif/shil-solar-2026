import { useProjectStore } from "../app/store/projectStore";
import { PUBLIC_ASSETS } from "../shared/constants/publicAssets";

const CONTACT_ITEMS = [
  {
    key: "instagramShil",
    title: "اینستاگرام SHIL",
    description: "صفحه رسمی محصولات و پروژه‌های SHIL",
    qr: PUBLIC_ASSETS.qr.instagramShil,
    type: "Instagram",
  },
  {
    key: "instagram",
    title: "اینستاگرام مهندس صارمی",
    description: "آموزش‌ها، نمونه‌کارها و نکات اجرایی",
    qr: PUBLIC_ASSETS.qr.instagram,
    type: "Instagram",
  },
  {
    key: "telegram",
    title: "تلگرام",
    description: "ارتباط سریع و ارسال فایل‌های پروژه",
    qr: PUBLIC_ASSETS.qr.telegram,
    type: "Telegram",
  },
  {
    key: "whatsapp",
    title: "واتساپ",
    description: "هماهنگی سریع و پشتیبانی پروژه",
    qr: PUBLIC_ASSETS.qr.whatsapp,
    type: "WhatsApp",
  },
];

function ContactCard({ item }) {
  return (
    <article className="contact-card">
      <div className="contact-card__qr-wrap">
        <img className="contact-card__qr" src={item.qr} alt={`QR ${item.title}`} loading="lazy" />
      </div>
      <div className="contact-card__body">
        <span className="contact-card__type">{item.type}</span>
        <h3>{item.title}</h3>
        <p>{item.description}</p>
      </div>
    </article>
  );
}

export function ContactPage() {
  const { goBackFromContact, goDashboard } = useProjectStore();

  return (
    <div className="shell shell--contact">
      <header
        className="contact-hero"
        style={{ backgroundImage: `linear-gradient(135deg, rgba(8,17,31,0.86), rgba(15,23,42,0.68)), url(${PUBLIC_ASSETS.backgrounds.home})` }}
      >
        <button className="btn btn--ghost btn--back" onClick={goBackFromContact} type="button">
          بازگشت
        </button>

        <div className="contact-hero__content">
          <img className="contact-hero__logo" src={PUBLIC_ASSETS.branding.logo} alt="SHIL" />
          <span className="eyebrow">Contact / SHIL.IR</span>
          <h1>ارتباط با SHIL</h1>
          <p>
            برای مشاهده محصولات SHIL، ارتباط سریع، دریافت فایل‌ها و هماهنگی پروژه، از مسیرهای زیر استفاده کنید.
          </p>
          <div className="contact-hero__actions">
            <a className="btn btn--primary" href="https://shil.ir" target="_blank" rel="noreferrer">
              ورود به سایت SHIL.IR
            </a>
            <button className="btn btn--secondary" onClick={goDashboard} type="button">
              بازگشت به داشبورد
            </button>
          </div>
        </div>
      </header>

      <section className="panel contact-site-panel">
        <div>
          <span className="eyebrow">Official Website</span>
          <h2>SHIL.IR</h2>
          <p>وب‌سایت رسمی برای معرفی محصولات، اطلاعات فنی و مسیرهای ارتباطی.</p>
        </div>
        <a className="site-link-card" href="https://shil.ir" target="_blank" rel="noreferrer">
          SHIL.IR
        </a>
      </section>

      <section className="contact-grid">
        {CONTACT_ITEMS.map((item) => (
          <ContactCard key={item.key} item={item} />
        ))}
      </section>
    </div>
  );
}
