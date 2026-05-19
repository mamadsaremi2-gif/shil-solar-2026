import React from "react";
import { useNavigate } from "react-router-dom";

export default function ContactPage() {
  const navigate = useNavigate();

  const contactItems = [
    { label: "Ø¢Ø¯Ø±Ø³", value: "Ø¯ÙØªØ± Ù…Ø±Ú©Ø²ÛŒ Ùˆ Ú©Ø§Ø±Ø®Ø§Ù†Ù‡: Ø§ØµÙÙ‡Ø§Ù†ØŒ Ø´Ù‡Ø±Ú© ØµÙ†Ø¹ØªÛŒ Ø³Ø¬Ø²ÛŒØŒ Ø®ÛŒØ§Ø¨Ø§Ù† Ø§Ø³Ù¾ÛŒØ±Ø§Ù„ØŒ Ù†Ø¨Ø´ Ø³ÙˆÙ… Ø´Ø±Ù‚ÛŒØŒ Ù¾Ù„Ø§Ú© ÛµÛ¹" },
    { label: "Ú©Ø¯ Ù¾Ø³ØªÛŒ", value: "8139174361" },
    { label: "ØªÙ„ÙÙ†", value: "031-33122" },
    { label: "Ù…ÙˆØ¨Ø§ÛŒÙ„", value: "09135656153" },
    { label: "Ø§ÛŒÙ…ÛŒÙ„", value: "info@shil.ir" },
    { label: "Ø³Ø§Ø¹Ø§Øª Ú©Ø§Ø±ÛŒ", value: "Ø´Ù†Ø¨Ù‡ ØªØ§ Ú†Ù‡Ø§Ø±Ø´Ù†Ø¨Ù‡ØŒ 8:00 â€“ 16:30" },
  ];

  const qrItems = [
    {
      title: "Ø¢Ù…ÙˆØ²Ø´ ÙÙ†ÛŒ",
      handle: "@MOHAMAD_SAREMI1991",
      image: "/assets/contact/instagram-personal.jpg",
    },
    {
      title: "Ø§ÛŒÙ†Ø³ØªØ§Ú¯Ø±Ø§Ù… SHIL",
      handle: "@SHILIRAN",
      image: "/assets/contact/instagram-shil.jpg",
    },
    {
      title: "ØªÙ„Ú¯Ø±Ø§Ù…",
      handle: "@MOHAMAD_SAREMI1991",
      image: "/assets/contact/telegram.jpg",
    },
    {
      title: "ÙˆØ§ØªØ³Ø§Ù¾ Ø¨ÛŒØ²ÛŒÙ†Ø³",
      handle: "m.saremi-shiliran company",
      image: "/assets/contact/whatsapp.jpg",
    },
  ];

  return (
    <main className="shil-contact-page" dir="rtl">
      <header className="shil-contact-header">
        <button type="button" className="shil-contact-back" onClick={() => navigate(-1)}>
          Ø¨Ø§Ø²Ú¯Ø´Øª
        </button>

        <div className="shil-contact-title-pill">
          Ø§Ø±ØªØ¨Ø§Ø· Ø¨Ø§ Ù…Ø§
        </div>

        <button type="button" className="shil-contact-back" onClick={() => navigate("/")}>
          Ø¯Ø§Ø´Ø¨ÙˆØ±Ø¯
        </button>
      </header>

      <section className="shil-contact-content">
        <section className="shil-contact-hero">
          <span>SHIL Communication Center</span>
          <h1>Ø§Ø·Ù„Ø§Ø¹Ø§Øª ØªÙ…Ø§Ø³ Ùˆ Ø´Ø¨Ú©Ù‡â€ŒÙ‡Ø§ÛŒ Ø§Ø±ØªØ¨Ø§Ø·ÛŒ</h1>
          <p>
            Ø±Ø§Ù‡â€ŒÙ‡Ø§ÛŒ Ø§Ø±ØªØ¨Ø§Ø·ÛŒ Ø±Ø³Ù…ÛŒ Ø´Ø±Ú©ØªØŒ Ø¯ÙØªØ± Ù…Ø±Ú©Ø²ÛŒØŒ Ú©Ø§Ø±Ø®Ø§Ù†Ù‡ Ùˆ Ú©Ø§Ù†Ø§Ù„â€ŒÙ‡Ø§ÛŒ Ø§Ø·Ù„Ø§Ø¹â€ŒØ±Ø³Ø§Ù†ÛŒ SHIL
          </p>
        </section>

        <section className="shil-contact-info-card">
          <div className="shil-contact-section-head">
            <h2>Ø§Ø·Ù„Ø§Ø¹Ø§Øª ØªÙ…Ø§Ø³</h2>
            <span>Official Contact</span>
          </div>

          <div className="shil-contact-info-grid">
            {contactItems.map((item) => (
              <div className="shil-contact-info-row" key={item.label}>
                <strong>{item.label}</strong>
                <p>{item.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="shil-contact-qr-section">
          <div className="shil-contact-section-head">
            <h2>Ú©Ø§Ù†Ø§Ù„â€ŒÙ‡Ø§ÛŒ Ø§Ø±ØªØ¨Ø§Ø·ÛŒ</h2>
            <span>QR Access</span>
          </div>

          <div className="shil-contact-qr-grid">
            {qrItems.map((item) => (
              <article className="shil-contact-qr-card" key={item.title}>
                <div className="shil-contact-qr-image-wrap">
                  <img src={item.image} alt={item.title} loading="lazy" />
                </div>
                <h3>{item.title}</h3>
                <p>{item.handle}</p>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}