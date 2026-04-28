import { useProjectStore } from "../app/store/projectStore";
import { PUBLIC_ASSETS } from "../shared/constants/publicAssets";
import { CONTACT_LINKS } from "../shared/constants/contactLinks";

const CONTACT_ITEMS = [
  {
    key: "website",
    title: "سایت SHIL",
    description: "مشاهده محصولات کامل برند SHIL و اطلاعات رسمی شرکت",
    qr: PUBLIC_ASSETS.qr.instagramShil,
    type: "Website",
    url: CONTACT_LINKS.website,
    actionLabel: "ورود به سایت SHIL",
  },
  {
    key: "whatsapp",
    title: "واتساپ",
    description: "ارتباط سریع و ارسال اطلاعات پروژه",
    qr: PUBLIC_ASSETS.qr.whatsapp,
    type: "WhatsApp",
    url: CONTACT_LINKS.whatsapp,
    actionLabel: "ورود به واتساپ",
  },
  {
    key: "phone",
    title: "تماس",
    description: "تماس مستقیم با واحد ارتباط SHIL",
    qr: PUBLIC_ASSETS.qr.whatsapp,
    type: "Phone",
    url: "tel:03133122",
    actionLabel: "تماس مستقیم",
  },
  {
    key: "email",
    title: "ایمیل",
    description: "ارسال مشخصات پروژه، فایل‌ها و درخواست مشاوره",
    qr: PUBLIC_ASSETS.qr.instagramShil,
    type: "Email",
    url: CONTACT_LINKS.email,
    actionLabel: "ارسال ایمیل",
  },
  {
    key: "eitaa",
    title: "ایتا",
    description: "مسیر ارتباطی داخلی برای پیگیری پروژه",
    qr: PUBLIC_ASSETS.qr.telegram,
    type: "Eitaa",
    url: CONTACT_LINKS.eitaa,
    actionLabel: "ورود به ایتا",
  },
  {
    key: "bale",
    title: "بله",
    description: "مسیر ارتباطی داخلی برای هماهنگی و پیگیری",
    qr: PUBLIC_ASSETS.qr.telegram,
    type: "Bale",
    url: CONTACT_LINKS.bale,
    actionLabel: "ورود به بله",
  },
  {
    key: "rubika",
    title: "روبیکا",
    description: "مسیر ارتباطی داخلی برای پیام‌رسانی سریع",
    qr: PUBLIC_ASSETS.qr.telegram,
    type: "Rubika",
    url: CONTACT_LINKS.rubika,
    actionLabel: "ورود به روبیکا",
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
            همه مسیرهای ارتباطی رسمی در همین صفحه قرار دارد: سایت، واتساپ، تماس، ایمیل، ایتا، بله و روبیکا.
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
        <p>بارکدها و دکمه‌های ورود هر مسیر در بلوک‌های جداگانه قرار گرفته‌اند.</p>
      </section>

      <section className="contact-grid">
        {CONTACT_ITEMS.map((item) => (
          <ContactCard key={item.key} item={item} />
        ))}
      </section>
    </div>
  );
}
