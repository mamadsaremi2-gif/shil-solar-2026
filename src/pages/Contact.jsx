import React from "react";
import ShilPageShell from "../components/ShilPageShell.jsx";

const contactRows = [
  { label: "آدرس", value: "دفتر مرکزی و کارخانه: اصفهان، شهرک صنعتی سجزی، خیابان اسپیرال، نبش سوم شرقی، پلاک ۵۹" },
  { label: "کد پستی", value: "8139174361" },
  { label: "تلفن", value: "33122-031" },
  { label: "موبایل", value: "09135656153" },
  { label: "ایمیل", value: "info@shil.ir" },
  { label: "ساعات کاری", value: "شنبه تا چهارشنبه، 8:00 تا 16:30" },
  { label: "وب‌سایت", value: "shil.ir", href: "https://shil.ir" },
];

const qrItems = [
  {
    title: "اینستاگرام شخصی",
    subtitle: "@MOHAMAD_SAREMI1991",
    src: "/assets/contact/instagram-personal.png",
  },
  {
    title: "اینستاگرام SHIL",
    subtitle: "@SHILIRAN",
    src: "/assets/contact/instagram-shil.png",
  },
  {
    title: "تلگرام",
    subtitle: "@MOHAMAD_SAREMI1991",
    src: "/assets/contact/telegram.png",
  },
  {
    title: "واتساپ بیزینس",
    subtitle: "09135656153",
    src: "/assets/contact/whatsapp.png",
  },
];

export default function Contact() {
  return (
    <ShilPageShell title="ارتباط با ما" className="shil-contact-page-v529">
      <section className="shil-contact-data" aria-label="اطلاعات تماس SHIL">
        <header className="shil-contact-data-head">
          <h2>اطلاعات تماس</h2>
          <span>SHIL Engineering</span>
        </header>

        <div className="shil-contact-data-list">
          {contactRows.map((row) => (
            <div className="shil-contact-data-row" key={row.label}>
              <strong>{row.label}</strong>
              {row.href ? (
                <a href={row.href} target="_blank" rel="noreferrer">{row.value}</a>
              ) : (
                <span>{row.value}</span>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="shil-contact-qrs" aria-label="کدهای ارتباطی SHIL">
        <header className="shil-contact-data-head">
          <h2>کدهای ارتباطی</h2>
          <span>اسکن سریع</span>
        </header>

        <div className="shil-contact-qrs-grid">
          {qrItems.map((item) => (
            <article className="shil-contact-qr-item" key={item.title}>
              <img src={item.src} alt={`کد QR ${item.title}`} loading="lazy" />
              <strong>{item.title}</strong>
              <span>{item.subtitle}</span>
            </article>
          ))}
        </div>
      </section>
    </ShilPageShell>
  );
}
