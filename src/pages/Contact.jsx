import React from "react";
import ShilPageShell from "../components/ShilPageShell.jsx";

const contactRows = [
  { label: "آدرس", value: "دفتر مرکزی و کارخانه: اصفهان، شهرک صنعتی سجزی، خیابان اسپیرال، نبش سوم شرقی، پلاک ۵۹" },
  { label: "کد پستی", value: "8139174361" },
  { label: "تلفن", value: "33122-031" },
  { label: "موبایل", value: "09135656153" },
  { label: "ایمیل", value: "info@shil.ir" },
  { label: "ساعات کاری", value: "شنبه تا چهارشنبه، 8:00 تا 16:30" },
];

const qrItems = [
  {
    title: "اینستاگرام شخصی",
    subtitle: "@MOHAMAD_SAREMI1991",
    src: "/assets/contact/qr-1.png",
  },
  {
    title: "اینستاگرام SHIL",
    subtitle: "@SHILIRAN",
    src: "/assets/contact/qr-2.png",
  },
  {
    title: "تلگرام",
    subtitle: "@MOHAMAD_SAREMI1991",
    src: "/assets/contact/qr-3.png",
  },
  {
    title: "واتساپ بیزینس",
    subtitle: "m.saremi-shilirian company",
    src: "/assets/contact/qr-4.png",
  },
];

export default function Contact() {
  return (
    <ShilPageShell title="ارتباط با ما">
      <section className="shil-contact-banner">
        <img src="/assets/shil/contact/shil-products-banner.webp" alt="محصولات SHIL" />
        <a href="https://shil.ir" target="_blank" rel="noreferrer">ورود به سایت SHIL</a>
      </section>

      <section className="shil-info-panel shil-contact-info-card" aria-label="اطلاعات تماس SHIL">
        <div className="shil-contact-section-head">
          <h3>اطلاعات تماس</h3>
          <span>SHIL Engineering</span>
        </div>
        <div className="shil-contact-info-list">
          {contactRows.map((row) => (
            <div className="shil-contact-info-row" key={row.label}>
              <strong>{row.label}</strong>
              <span>{row.value}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="shil-info-panel shil-contact-qr-panel" aria-label="کدهای ارتباطی SHIL">
        <div className="shil-contact-section-head">
          <h3>کدهای ارتباطی</h3>
          <span>اسکن سریع</span>
        </div>
        <div className="shil-qr-grid shil-contact-qr-grid">
          {qrItems.map((item) => (
            <div className="shil-qr-card shil-contact-qr-card" key={item.title}>
              <img src={item.src} alt={item.title} loading="lazy" />
              <strong>{item.title}</strong>
              <span>{item.subtitle}</span>
            </div>
          ))}
        </div>
      </section>
    </ShilPageShell>
  );
}
