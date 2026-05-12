import { useProjectStore } from "../../app/store/projectStore";
import { PUBLIC_ASSETS } from "../../shared/constants/publicAssets";
import { SHIL_IMAGE_MANIFEST } from "../../design/assetManifest";
import { CONTACT_LINKS } from "../../shared/constants/contactLinks";

const QR_ITEMS = [
  { key: "instagramShil", title: "اینستاگرام شرکت", qr: PUBLIC_ASSETS.qr.instagramShil, url: CONTACT_LINKS.instagramShil },
  { key: "instagramTraining", title: "آموزش فنی", qr: PUBLIC_ASSETS.qr.instagram, url: CONTACT_LINKS.instagramPersonal },
  { key: "whatsappExpert", title: "واتساپ", qr: PUBLIC_ASSETS.qr.whatsapp, url: CONTACT_LINKS.whatsapp },
  { key: "telegramExpert", title: "تلگرام", qr: PUBLIC_ASSETS.qr.telegram, url: CONTACT_LINKS.telegram },
];

const INTERNAL_MESSENGERS = [
  { key: "eitaa", title: "ایتا", url: CONTACT_LINKS.eitaa },
  { key: "bale", title: "بله", url: CONTACT_LINKS.bale },
  { key: "rubika", title: "روبیکا", url: CONTACT_LINKS.rubika },
];

function copyText(text) {
  navigator.clipboard?.writeText(text);
  window.alert("کپی شد.");
}

export function ContactPage() {
  const { goDashboard } = useProjectStore();
  const appLink = window.location.href;

  return (
    <main className="mobile-page-shell contact-mobile-page shil-contact-final" dir="rtl">
      <header className="mobile-fixed-header unified-shil-header">
        <button className="mobile-back-btn" type="button" onClick={goDashboard} aria-label="بازگشت">‹</button>
        <img className="mobile-header-logo" src={SHIL_IMAGE_MANIFEST.branding.headerLogo.path} alt="SHIL" />
        <span className="mobile-title-pill">ارتباط با ما</span>
      </header>

      <section className="mobile-scroll-content contact-scroll-content final-contact-scroll">
        <section className="contact-brand-frame" aria-label="تجهیزات برند SHIL">
          <img src={SHIL_IMAGE_MANIFEST.contact.heroEquipment.path} alt="تجهیزات برند SHIL" />
        </section>

        <a className="contact-site-link" href={CONTACT_LINKS.website || "https://shil.ir"} target="_blank" rel="noreferrer">
          ورود مستقیم به سایت شرکت
        </a>

        <section className="contact-compact-block contact-info-lines" aria-label="اطلاعات ارتباطی">
          <button type="button" onClick={() => copyText("031-33122")}><span>تلفن ثابت</span><strong>031-33122</strong></button>
          <button type="button" onClick={() => copyText("09135656153")}><span>موبایل</span><strong>09135656153</strong></button>
          <button type="button" onClick={() => copyText("info@shil.ir")}><span>ایمیل</span><strong>info@shil.ir</strong></button>
          <button type="button" onClick={() => copyText(appLink)}><span>لینک برنامه</span><strong>کپی لینک</strong></button>
          {INTERNAL_MESSENGERS.map((item) => (
            <a key={item.key} href={item.url} target="_blank" rel="noreferrer"><span>{item.title}</span><strong>ورود</strong></a>
          ))}
        </section>

        <section className="contact-qr-block final-qr-block" aria-label="QR Code ها">
          {QR_ITEMS.map((item) => (
            <a key={item.key} href={item.url} target="_blank" rel="noreferrer">
              <img src={item.qr} alt={item.title} loading="lazy" />
              <span>{item.title}</span>
            </a>
          ))}
        </section>
      </section>

      <footer className="mobile-fixed-footer unified-shil-footer">
        <button className="btn btn--ghost" type="button" onClick={goDashboard}>برگشت</button>
      </footer>
    </main>
  );
}

export default ContactPage;
