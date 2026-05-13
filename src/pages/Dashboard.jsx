import React from "react";
import { Link } from "react-router-dom";

export default function Dashboard() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg,#02131d 0%,#031924 100%)",
        color: "white",
        fontFamily: "Tahoma",
        overflowX: "hidden",
      }}
    >
      {/* HEADER */}

      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          padding: 20,
          background:
            "linear-gradient(90deg,#183050,#4a0d64)",
          borderBottom: "1px solid rgba(0,255,255,.2)",
        }}
      >
        <div
          style={{
            maxWidth: 430,
            margin: "auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <button
            style={{
              border: "1px solid rgba(0,255,255,.4)",
              background: "#081926",
              color: "white",
              borderRadius: 24,
              padding: "16px 22px",
              fontSize: 20,
              fontWeight: 700,
            }}
          >
            داشبورد
          </button>

          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: 56,
                fontWeight: 900,
                lineHeight: 1,
              }}
            >
              SHIL
            </div>

            <div
              style={{
                fontSize: 18,
                opacity: 0.9,
                marginTop: 6,
              }}
            >
              ENGINEERING UI
            </div>
          </div>

          <Link
            to="/contact"
            style={{
              border: "1px solid rgba(0,255,255,.4)",
              background: "#081926",
              color: "white",
              borderRadius: 24,
              padding: "16px 22px",
              fontSize: 20,
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            ارتباط با ما
          </Link>
        </div>
      </header>

      {/* CONTENT */}

      <main
        style={{
          maxWidth: 430,
          margin: "auto",
          padding: 20,
          paddingBottom: 140,
        }}
      >
        {/* HERO */}

        <section
          style={{
            background:
              "linear-gradient(135deg,#061b30,#031019)",
            border: "1px solid rgba(0,255,255,.5)",
            borderRadius: 34,
            padding: 28,
            marginBottom: 24,
            boxShadow: "0 0 30px rgba(0,255,255,.08)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 28,
              color: "#8bdcff",
              fontSize: 18,
            }}
          >
            <span>Industrial UI</span>
            <span>SHIL Mobile V15</span>
          </div>

          <h1
            style={{
              fontSize: 58,
              lineHeight: 1.45,
              marginBottom: 24,
              fontWeight: 900,
            }}
          >
            طراحی هوشمند سامانه‌های
            خورشیدی و برق اضطراری
          </h1>

          <p
            style={{
              fontSize: 24,
              lineHeight: 2,
              opacity: 0.9,
            }}
          >
            رابط موبایل‌فرست، فشرده،
            بدون اسکرول افقی و آماده اتصال
            به موتورهای محاسبات مهندسی.
          </p>
        </section>

        {/* GRID */}

        <section
          style={{
            border: "1px solid rgba(0,255,255,.4)",
            borderRadius: 32,
            padding: 20,
          }}
        >
          <div
            style={{
              fontSize: 42,
              fontWeight: 800,
              marginBottom: 24,
            }}
          >
            دسترسی سریع
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 18,
            }}
          >
            <DashboardCard
              title="پروژه‌ها"
              subtitle="جاری و نهایی"
              icon="▦"
            />

            <DashboardCard
              title="پروژه جدید"
              subtitle="مسیر 8 مرحله‌ای"
              icon="＋"
            />

            <DashboardCard
              title="سناریوهای آماده"
              subtitle="خورشیدی و اضطراری"
              icon="⚡"
            />

            <DashboardCard
              title="ارتباط با ما"
              subtitle="راه‌های تماس"
              icon="☎"
            />

            <DashboardCard
              title="بازخورد کاربر"
              subtitle="ثبت مشکل/پیشنهاد"
              icon="◉"
            />

            <DashboardCard
              title="دستیار هوشمند"
              subtitle="کنترل مهندسی"
              icon="AI"
            />
          </div>
        </section>

        {/* STATUS */}

        <section
          style={{
            marginTop: 24,
            border: "1px solid rgba(0,255,255,.4)",
            borderRadius: 32,
            padding: 24,
          }}
        >
          <div
            style={{
              fontSize: 20,
              color: "#8bdcff",
              marginBottom: 16,
            }}
          >
            V15
          </div>

          <div
            style={{
              fontSize: 40,
              fontWeight: 900,
              marginBottom: 16,
            }}
          >
            وضعیت زیرساخت
          </div>

          <p
            style={{
              fontSize: 24,
              lineHeight: 2,
              opacity: 0.9,
            }}
          >
            Core Skeleton فعال است.
            UI استاندارد V15 روی موتور اصلی
            نصب شده و آماده توسعه مرحله‌ای است.
          </p>
        </section>
      </main>

      {/* FOOTER */}

      <footer
        style={{
          position: "fixed",
          bottom: 0,
          width: "100%",
          maxWidth: 430,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: 14,
          padding: 18,
          background: "#031019",
          borderTop: "1px solid rgba(0,255,255,.2)",
        }}
      >
        <BottomButton text="داشبورد" />
        <BottomButton text="پروژه‌ها" />
        <BottomButton text="ذخیره پیش‌نویس" />
      </footer>
    </div>
  );
}

function DashboardCard({ title, subtitle, icon }) {
  return (
    <div
      style={{
        background:
          "linear-gradient(135deg,#0a2531,#07141d)",
        border: "1px solid rgba(0,255,255,.35)",
        borderRadius: 28,
        minHeight: 240,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        padding: 20,
      }}
    >
      <div
        style={{
          width: 86,
          height: 86,
          borderRadius: 24,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontSize: 40,
          marginBottom: 20,
          background:
            "linear-gradient(135deg,#1f6f69,#1c2d76)",
        }}
      >
        {icon}
      </div>

      <div
        style={{
          fontSize: 28,
          fontWeight: 800,
          marginBottom: 12,
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: 18,
          opacity: 0.8,
        }}
      >
        {subtitle}
      </div>
    </div>
  );
}

function BottomButton({ text }) {
  return (
    <button
      style={{
        flex: 1,
        border: "none",
        borderRadius: 24,
        background: "#1a1836",
        color: "white",
        padding: 18,
        fontSize: 20,
        fontWeight: 700,
      }}
    >
      {text}
    </button>
  );
}