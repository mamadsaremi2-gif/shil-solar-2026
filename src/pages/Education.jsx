import React from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ShilPageShell from "../components/ShilPageShell.jsx";

const educationModules = [
  {
    slug: "solar",
    title: "آموزش تجهیزات انرژی خورشیدی",
    description: "پنل، اینورتر، باتری، حفاظت و اصول طراحی سیستم خورشیدی",
    topics: [
      { slug: "solar-panels", title: "پنل‌های خورشیدی", summary: "ساختار، مشخصات فنی، انتخاب و نگهداری پنل" },
      { slug: "solar-inverters", title: "اینورترهای خورشیدی", summary: "آفلاین، هیبرید و متصل به شبکه" },
      { slug: "lithium-batteries", title: "باتری‌های لیتیومی", summary: "ظرفیت، BMS، اتصال موازی و نکات ایمنی" },
      { slug: "solar-protection", title: "تجهیزات حفاظتی خورشیدی", summary: "سرج ارستر، ایزولاتور، فیوز و تابلوهای DC" },
    ],
  },
  {
    slug: "emergency",
    title: "آموزش تجهیزات برق اضطراری",
    description: "انتخاب و بهره‌برداری از تجهیزات تأمین برق پشتیبان",
    topics: [
      { slug: "backup-inverters", title: "اینورتر برق اضطراری", summary: "توان نامی، توان راه‌اندازی و زمان پشتیبانی" },
      { slug: "backup-batteries", title: "باتری سیستم پشتیبان", summary: "محاسبه ظرفیت و روش صحیح اتصال باتری‌ها" },
      { slug: "transfer-protection", title: "انتقال و حفاظت", summary: "بای‌پس، کلید انتقال و حفاظت خروجی" },
    ],
  },
  {
    slug: "installation",
    title: "نکات نصب و بهره‌برداری",
    description: "راهنمای نصب، راه‌اندازی، سرویس و نگهداری ایمن",
    topics: [
      { slug: "site-preparation", title: "آماده‌سازی محل نصب", summary: "تهویه، فاصله ایمن، دسترسی و شرایط محیطی" },
      { slug: "wiring", title: "سیم‌کشی و اتصالات", summary: "انتخاب کابل، ترمینال، ارت و کنترل قطبیت" },
      { slug: "commissioning", title: "راه‌اندازی اولیه", summary: "کنترل‌های پیش از وصل و آزمون عملکرد سیستم" },
      { slug: "maintenance", title: "سرویس و نگهداری", summary: "بازدید دوره‌ای و پیشگیری از خطاهای متداول" },
    ],
  },
  {
    slug: "products",
    title: "محصولات و تجهیزات برند SHIL",
    description: "معرفی گروه‌های محصول، کاربردها و مشخصات قابل انتخاب",
    topics: [
      { slug: "protection-products", title: "تجهیزات حفاظتی", summary: "کلیدها، محافظ جان، سرج ارستر و تجهیزات تابلو" },
      { slug: "solar-products", title: "محصولات خورشیدی", summary: "اینورتر، باتری، تابلو و تجهیزات جانبی" },
      { slug: "industrial-products", title: "تجهیزات صنعتی", summary: "کنتاکتور، رله، کنترل و تجهیزات فرمان" },
    ],
  },
];

function findModule(moduleSlug) {
  return educationModules.find((item) => item.slug === moduleSlug);
}

function EducationHub() {
  return (
    <div id="shil-education-root" className="shil-education-root shil-education-root--hub">
      <section className="shil-education-section shil-education-intro-card">
        <h2 className="shil-education-section-title">مرکز آموزش SHIL</h2>
        <p>راهنماهای آموزشی تجهیزات خورشیدی، برق اضطراری، نصب و محصولات شیل را از دسته‌بندی‌های زیر انتخاب کنید.</p>
      </section>

      <section className="shil-education-grid" aria-label="دسته‌بندی‌های آموزشی">
        {educationModules.map((module, index) => (
          <Link className="shil-education-card" to={`/education/${module.slug}`} key={module.slug}>
            <span className="shil-education-card-index">{String(index + 1).padStart(2, "0")}</span>
            <strong>{module.title}</strong>
            <span>{module.description}</span>
            <small>{module.topics.length} مطلب آموزشی</small>
          </Link>
        ))}
      </section>
    </div>
  );
}

function EducationModule({ module }) {
  return (
    <div id="shil-education-root" className="shil-education-root shil-education-root--module">
      <section className="shil-education-section">
        <h2 className="shil-education-section-title">{module.title}</h2>
        <p className="shil-education-lead">{module.description}</p>
      </section>

      <section className="shil-education-topic-grid" aria-label={`مطالب ${module.title}`}>
        {module.topics.map((topic, index) => (
          <Link className="shil-education-topic-card" to={`/education/${module.slug}/${topic.slug}`} key={topic.slug}>
            <span className="shil-education-topic-number">{index + 1}</span>
            <div>
              <strong>{topic.title}</strong>
              <span>{topic.summary}</span>
            </div>
            <span className="shil-education-open-label">مشاهده</span>
          </Link>
        ))}
      </section>

      <Link className="shil-education-back-link" to="/education">بازگشت به دسته‌بندی‌های آموزش</Link>
    </div>
  );
}

function EducationTopic({ module, topic }) {
  return (
    <div id="shil-education-root" className="shil-education-root shil-education-root--topic">
      <section className="shil-education-section">
        <span className="shil-education-breadcrumb">{module.title}</span>
        <h2 className="shil-education-section-title">{topic.title}</h2>
        <p className="shil-education-lead">{topic.summary}</p>
      </section>

      <section className="shil-education-content-card">
        <div className="shil-education-content-status">
          <strong>محتوای آموزشی</strong>
          <span>قابل مدیریت و به‌روزرسانی توسط ادمین</span>
        </div>
        <div className="shil-education-content-placeholder">
          <strong>این بخش برای محتوای کامل درس آماده است</strong>
          <p>متن، تصویر، فایل راهنما، ویدئو، نکات ایمنی و مشخصات فنی این آموزش می‌تواند از پنل مدیریت در این قسمت نمایش داده شود.</p>
        </div>
      </section>

      <div className="shil-education-topic-actions">
        <Link className="shil-education-back-link" to={`/education/${module.slug}`}>بازگشت به فهرست مطالب</Link>
        <Link className="shil-education-home-link" to="/education">مرکز آموزش</Link>
      </div>
    </div>
  );
}

export default function Education() {
  const { moduleSlug, topicSlug } = useParams();
  const navigate = useNavigate();
  const module = moduleSlug ? findModule(moduleSlug) : null;
  const topic = module && topicSlug ? module.topics.find((item) => item.slug === topicSlug) : null;

  let title = "آموزش";
  if (module && !topicSlug) title = module.title;
  if (topic) title = topic.title;

  let content = <EducationHub />;
  if (module && !topicSlug) content = <EducationModule module={module} />;
  if (module && topic) content = <EducationTopic module={module} topic={topic} />;
  if ((moduleSlug && !module) || (topicSlug && !topic)) {
    content = (
      <div id="shil-education-root" className="shil-education-root shil-education-root--missing">
        <section className="shil-education-section">
          <h2 className="shil-education-section-title">مطلب آموزشی پیدا نشد</h2>
          <button className="shil-education-back-link" type="button" onClick={() => navigate("/education")}>بازگشت به مرکز آموزش</button>
        </section>
      </div>
    );
  }

  return (
    <ShilPageShell title={title} className="shil-education-page-v529 shil-education-page-unified">
      {content}
    </ShilPageShell>
  );
}
