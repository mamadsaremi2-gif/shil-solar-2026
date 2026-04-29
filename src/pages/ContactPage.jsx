import { useProjectStore } from "../app/store/projectStore";
import { PUBLIC_ASSETS } from "../shared/constants/publicAssets";
import { CONTACT_LINKS } from "../shared/constants/contactLinks";

const CONTACT_ITEMS = [
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
    title: "تماس مستقیم",
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

function ShilProductsCard() {
  return (
    <section className="panel shil-products-showcase">
      <a className="shil-products-showcase__image" href={CONTACT_LINKS.website} target="_blank" rel="noreferrer" aria-label="ورود به سایت SHIL.IR">
        <img src={PUBLIC_ASSETS.branding.productsFullCard} alt="جهت مشاهده محصولات کامل برند SHIL" />
        <span className="shil-products-showcase__button">ورود به سایت SHIL.IR</span>
      </a>
    </section>
  );
}

export function ContactPage() {
  const { goBackFromContact, goDashboard } = useProjectStore();

  return (
    <div className="shell shell--contact">
      <header className="contact-page-topbar">
        <button className="btn btn--ghost btn--back" onClick={goBackFromContact} type="button">بازگشت</button>
        <img src={PUBLIC_ASSETS.branding.logo} alt="SHIL" />
        <button className="btn btn--secondary" onClick={goDashboard} type="button">داشبورد</button>
      </header>

      <ShilProductsCard />

      <section className="panel contact-channel-heading">
        <span className="eyebrow">مسیرهای ارتباطی</span>
        <h2>ارتباط با ما</h2>
        <p>همه اطلاعات تماس، QR Codeها و مسیرهای ارتباطی رسمی SHIL در این صفحه جمع‌آوری شده‌اند.</p>
        <div className="contact-info-strip">
          <div><span>تلفن ثابت</span><strong>031-33122</strong></div>
          <div><span>موبایل</span><strong>09135656153</strong></div>
          <div><span>ایمیل</span><strong>info@shil.ir</strong></div>
          <div><span>آدرس</span><strong>اصفهان، شهرک صنعتی سجزی، خیابان اسپیرال، نبش سوم شرقی، پلاک 59</strong></div>
          <div><span>کد پستی</span><strong>8139174361</strong></div>
          <div><span>ساعت کاری</span><strong>شنبه تا چهارشنبه، 8:00 - 16:30</strong></div>
        </div>
      </section>

      <section className="contact-grid">
        {CONTACT_ITEMS.map((item) => (
          <ContactCard key={item.key} item={item} />
        ))}
      </section>
    </div>
  );
}
