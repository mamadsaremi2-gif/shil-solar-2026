export default function ShilContactCard() {
  return (
    <section className="shil-contact-card" aria-label="اطلاعات تماس SHIL">
      <div className="shil-contact-card__content">
        <div className="shil-contact-card__visual">
          <img src="/images/workspace/shil-solar-hero.png" alt="سبد محصولات برند SHIL" loading="lazy" />
          <span>سبد محصولات SHIL</span>
        </div>

        <div className="shil-contact-card__main">
          <span className="shil-contact-card__eyebrow">SHIL.IR</span>
          <h2>جهت مشاهده محصولات کامل برند SHIL</h2>
          <p>
            سبد محصولات SHIL شامل تجهیزات سیستم‌های خورشیدی و انواع سیستم‌های حفاظتی برق فشار ضعیف است.
          </p>
          <div className="shil-contact-card__actions">
            <a className="btn btn--primary" href="https://shil.ir" target="_blank" rel="noreferrer">ورود به سایت SHIL.IR</a>
            <a className="btn btn--secondary" href="tel:03133122">تماس مستقیم</a>
            <a className="btn btn--ghost" href="mailto:info@shil.ir">ارسال ایمیل</a>
          </div>
        </div>

        <div className="shil-contact-card__info">
          <div><span>آدرس</span><strong>اصفهان، شهرک صنعتی سجزی، خیابان اسپیرال، نبش سوم شرقی، پلاک ۵۹</strong></div>
          <div><span>کد پستی</span><strong>8139174361</strong></div>
          <div><span>تلفن</span><strong>031-33122</strong></div>
          <div><span>موبایل</span><strong>09135656153</strong></div>
          <div><span>ایمیل</span><strong>info@shil.ir</strong></div>
          <div><span>ساعات کاری</span><strong>شنبه تا چهارشنبه، 8:00 – 16:30</strong></div>
        </div>
      </div>
    </section>
  );
}
