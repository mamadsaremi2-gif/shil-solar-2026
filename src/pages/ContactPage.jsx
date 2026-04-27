import { useProjectStore } from "../app/store/projectStore";
import { PUBLIC_ASSETS } from "../shared/constants/publicAssets";
import { CONTACT_LINKS } from "../shared/constants/contactLinks";
import { ShareActions } from "../shared/components/ShareActions";

const CONTACT_ITEMS = [
  {
    key: "instagramShil",
    title: "اینستاگرام SHIL",
    description: "صفحه رسمی محصولات، پروژه‌ها و اخبار برند SHIL",
    qr: PUBLIC_ASSETS.qr.instagramShil,
    type: "Instagram",
    url: CONTACT_LINKS.instagramShil,
    actionLabel: "ورود به اینستاگرام SHIL",
  },
  {
    key: "instagram",
    title: "اینستاگرام مهندس صارمی",
    description: "آموزش‌ها، نمونه‌کارها و نکات اجرایی سیستم‌های خورشیدی",
    qr: PUBLIC_ASSETS.qr.instagram,
    type: "Instagram",
    url: CONTACT_LINKS.instagramPersonal,
    actionLabel: "ورود به اینستاگرام",
  },
  {
    key: "telegram",
    title: "تلگرام",
    description: "ارتباط سریع، ارسال فایل‌های پروژه و پیگیری هماهنگی‌ها",
    qr: PUBLIC_ASSETS.qr.telegram,
    type: "Telegram",
    url: CONTACT_LINKS.telegram,
    actionLabel: "ورود به تلگرام",
  },
  {
    key: "whatsapp",
    title: "واتساپ",
    description: "هماهنگی سریع، مشاوره اولیه و پشتیبانی پروژه",
    qr: PUBLIC_ASSETS.qr.whatsapp,
    type: "WhatsApp",
    url: CONTACT_LINKS.whatsapp,
    actionLabel: "ورود به واتساپ",
  },
];

function ContactCard({ item }) {
  return (
    <article className="contact-card contact-card--premium">
      <a className="contact-card__qr-wrap" href={item.url} target="_blank" rel="noreferrer" aria-label={item.actionLabel}>
        <img className="contact-card__qr" src={item.qr} alt={`QR ${item.title}`} loading="lazy" />
      </a>
      <div className="contact-card__body">
        <span className="contact-card__type">{item.type}</span>
        <h3>{item.title}</h3>
        <p>{item.description}</p>
        <div className="contact-card__actions">
          <a className="btn btn--primary btn--sm" href={item.url} target="_blank" rel="noreferrer">{item.actionLabel}</a>
          <a className="btn btn--ghost btn--sm" href={item.qr} target="_blank" rel="noreferrer">مشاهده QR</a>
        </div>
      </div>
    </article>
  );
}

export function ContactPage() {
  const { goBackFromContact, goDashboard } = useProjectStore();

  return (
    <div className="shell shell--contact">
      <header
        className="contact-hero contact-hero--premium"
        style={{ backgroundImage: `linear-gradient(110deg, rgba(8,17,31,0.26) 0%, rgba(8,17,31,0.40) 42%, rgba(8,17,31,0.66) 100%), url(${PUBLIC_ASSETS.backgrounds.home})` }}
      >
        <button className="btn btn--ghost btn--back" onClick={goBackFromContact} type="button">
          بازگشت
        </button>

        <div className="contact-hero__content contact-hero__content--glass">
          <img className="contact-hero__logo" src={PUBLIC_ASSETS.branding.logo} alt="SHIL" />
          <span className="eyebrow">مرکز ارتباط رسمی SHIL</span>
          <h1>ارتباط سریع با SHIL</h1>
          <p>
            برای مشاهده محصولات، دریافت مشاوره، ارسال فایل‌های پروژه و هماهنگی اجرای سیستم‌های خورشیدی از مسیرهای رسمی زیر استفاده کنید.
          </p>
          <div className="contact-hero__actions">
            <a className="btn btn--primary" href={CONTACT_LINKS.website} target="_blank" rel="noreferrer">
              وب‌سایت رسمی شرکت
            </a>
            <a className="btn btn--secondary" href={CONTACT_LINKS.whatsapp} target="_blank" rel="noreferrer">
              ارتباط سریع واتساپ
            </a>
            <button className="btn btn--ghost" onClick={goDashboard} type="button">
              بازگشت به داشبورد
            </button>
          </div>
        </div>
      </header>

      <section className="panel contact-channel-heading">
        <span className="eyebrow">مسیرهای ارتباطی</span>
        <h2>انتخاب مسیر ارتباطی رسمی</h2>
        <p>از QR یا دکمه ورود هر کارت برای ارتباط سریع، مشاهده نمونه‌کارها، ارسال فایل پروژه و پیگیری هماهنگی‌ها استفاده کنید.</p>
      </section>

      <section className="contact-grid">
        {CONTACT_ITEMS.map((item) => (
          <ContactCard key={item.key} item={item} />
        ))}
      </section>

      <section className="panel contact-share-panel contact-share-panel--compact">
        <div className="panel__header">
          <h2>ارسال لینک برنامه</h2>
        </div>
        <p className="section-note">لینک برنامه یا صفحه ارتباط را با پیامک، واتساپ، ایمیل، Gmail و برنامه‌های داخلی نصب‌شده روی موبایل ارسال کنید.</p>
        <ShareActions title="ارتباط با SHIL" text="مسیرهای ارتباطی SHIL و برنامه طراحی سیستم خورشیدی" />
      </section>
    </div>
  );
}
