import React from "react";
import ShilPageShell from "../components/ShilPageShell.jsx";

const qrItems = ["سایت رسمی", "پشتیبانی", "کاتالوگ محصولات", "شبکه های اجتماعی"];

export default function Contact() {
  return (
    <ShilPageShell title="ارتباط با ما">
      <section className="shil-contact-banner">
        <img src="/assets/shil/contact/shil-products-banner.webp" alt="محصولات SHIL" />
        <a href="https://shil.ir" target="_blank" rel="noreferrer">ورود به سایت SHIL</a>
      </section>
      <section className="shil-info-panel">
        <h3>اطلاعات ارتباط با شرکت</h3>
        <p>آدرس، شماره تماس، پشتیبانی، ایمیل و اطلاعات رسمی شرکت در این بخش قرار می‌گیرد.</p>
      </section>
      <section className="shil-qr-grid">
        {qrItems.map((item, index) => (
          <div className="shil-qr-card" key={item}>
            <img src={`/assets/qr-${index + 1}.png`} alt={item} />
            <span>{item}</span>
          </div>
        ))}
      </section>
    </ShilPageShell>
  );
}
