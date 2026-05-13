import React, { useMemo, useState } from "react";

const tabs = [
  "داشبورد",
  "پروژه‌ها",
  "محاسبات",
  "شرایط محیطی",
  "گزارش",
];

const projectTypes = [
  {
    title: "آنگرید",
    desc: "سیستم متصل به شبکه",
    icon: "⚡",
  },
  {
    title: "آفگرید",
    desc: "سیستم مستقل",
    icon: "🔋",
  },
  {
    title: "هیبرید",
    desc: "ترکیبی هوشمند",
    icon: "☀️",
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState("داشبورد");
  const [selectedProject, setSelectedProject] = useState("آنگرید");

  const summary = useMemo(() => {
    switch (selectedProject) {
      case "آفگرید":
        return {
          power: "12.4 kW",
          battery: "20 kWh",
          panels: "18",
        };

      case "هیبرید":
        return {
          power: "16.2 kW",
          battery: "12 kWh",
          panels: "24",
        };

      default:
        return {
          power: "8.5 kW",
          battery: "—",
          panels: "14",
        };
    }
  }, [selectedProject]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg,#02131c 0%, #041d2a 50%, #031018 100%)",
        color: "white",
        fontFamily: "sans-serif",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 430,
          position: "relative",
          minHeight: "100vh",
          overflow: "hidden",
        }}
      >
        {/* HEADER */}
        <div
          style={{
            position: "fixed",
            top: 0,
            width: "100%",
            maxWidth: 430,
            zIndex: 20,
            backdropFilter: "blur(12px)",
            background: "rgba(0,0,0,0.35)",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            padding: "14px 18px",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <button
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                border: "none",
                background: "#0d2532",
                color: "white",
                cursor: "pointer",
              }}
            >
              ←
            </button>

            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                letterSpacing: 1,
              }}
            >
              SHIL V15
            </div>

            <button
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                border: "none",
                background: "#0d2532",
                color: "white",
                cursor: "pointer",
              }}
            >
              ☰
            </button>
          </div>

          {/* Tabs */}
          <div
            style={{
              display: "flex",
              gap: 8,
              overflowX: "auto",
              marginTop: 14,
              paddingBottom: 2,
            }}
          >
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  whiteSpace: "nowrap",
                  border: "none",
                  padding: "10px 16px",
                  borderRadius: 999,
                  background:
                    activeTab === tab
                      ? "#14b8a6"
                      : "rgba(255,255,255,0.08)",
                  color: "white",
                  cursor: "pointer",
                  fontSize: 13,
                  transition: "0.25s",
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* BODY */}
        <div
          style={{
            paddingTop: 140,
            paddingBottom: 120,
            paddingLeft: 16,
            paddingRight: 16,
            boxSizing: "border-box",
          }}
        >
          {/* HERO */}
          <div
            style={{
              background:
                "linear-gradient(145deg, rgba(20,184,166,.25), rgba(2,6,23,.8))",
              borderRadius: 28,
              padding: 22,
              border: "1px solid rgba(255,255,255,.08)",
              boxShadow: "0 10px 30px rgba(0,0,0,.35)",
            }}
          >
            <div
              style={{
                fontSize: 14,
                opacity: 0.75,
                marginBottom: 8,
              }}
            >
              وضعیت سیستم
            </div>

            <div
              style={{
                fontSize: 32,
                fontWeight: 800,
                marginBottom: 10,
              }}
            >
              Solar Engineering Platform
            </div>

            <div
              style={{
                opacity: 0.8,
                lineHeight: 1.8,
                fontSize: 14,
              }}
            >
              زیرساخت مهندسی و محاسباتی SHIL نسخه V15 با طراحی
              Mobile-First و ساختار Banking UI.
            </div>
          </div>

          {/* PROJECT TYPES */}
          <div
            style={{
              marginTop: 22,
              display: "grid",
              gridTemplateColumns: "1fr",
              gap: 14,
            }}
          >
            {projectTypes.map((item) => (
              <div
                key={item.title}
                onClick={() => setSelectedProject(item.title)}
                style={{
                  background:
                    selectedProject === item.title
                      ? "rgba(20,184,166,.18)"
                      : "rgba(255,255,255,.05)",
                  border:
                    selectedProject === item.title
                      ? "1px solid #14b8a6"
                      : "1px solid rgba(255,255,255,.06)",
                  borderRadius: 24,
                  padding: 18,
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  cursor: "pointer",
                  transition: ".25s",
                }}
              >
                <div
                  style={{
                    width: 58,
                    height: 58,
                    borderRadius: 18,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#08202d",
                    fontSize: 28,
                  }}
                >
                  {item.icon}
                </div>

                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 700,
                      marginBottom: 4,
                    }}
                  >
                    {item.title}
                  </div>

                  <div
                    style={{
                      fontSize: 13,
                      opacity: 0.7,
                    }}
                  >
                    {item.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* SUMMARY */}
          <div
            style={{
              marginTop: 22,
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 12,
            }}
          >
            <Card title="توان" value={summary.power} />
            <Card title="باتری" value={summary.battery} />
            <Card title="پنل" value={summary.panels} />
          </div>

          {/* FORMS */}
          <div
            style={{
              marginTop: 22,
              background: "rgba(255,255,255,.05)",
              borderRadius: 24,
              padding: 18,
              border: "1px solid rgba(255,255,255,.06)",
            }}
          >
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                marginBottom: 18,
              }}
            >
              اطلاعات پروژه
            </div>

            <Input label="نام پروژه" placeholder="پروژه خورشیدی..." />

            <Input label="شهر پروژه" placeholder="تهران..." />

            <Input label="توان مصرفی" placeholder="مثلاً 12kW" />

            <button
              style={{
                width: "100%",
                height: 52,
                borderRadius: 18,
                border: "none",
                marginTop: 12,
                background: "#14b8a6",
                color: "#001219",
                fontWeight: 800,
                cursor: "pointer",
                fontSize: 15,
              }}
            >
              ذخیره اطلاعات
            </button>
          </div>
        </div>

        {/* FOOTER */}
        <div
          style={{
            position: "fixed",
            bottom: 0,
            width: "100%",
            maxWidth: 430,
            padding: 14,
            boxSizing: "border-box",
            backdropFilter: "blur(12px)",
            background: "rgba(0,0,0,.4)",
            borderTop: "1px solid rgba(255,255,255,.06)",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 10,
            }}
          >
            <button
              style={{
                flex: 1,
                height: 52,
                borderRadius: 18,
                border: "none",
                background: "rgba(255,255,255,.08)",
                color: "white",
                cursor: "pointer",
              }}
            >
              مرحله قبل
            </button>

            <button
              style={{
                flex: 1.4,
                height: 52,
                borderRadius: 18,
                border: "none",
                background: "#14b8a6",
                color: "#001219",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              تأیید مرحله
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Card({ title, value }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,.05)",
        borderRadius: 20,
        padding: 16,
        border: "1px solid rgba(255,255,255,.06)",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: 12,
          opacity: 0.7,
          marginBottom: 8,
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: 18,
          fontWeight: 800,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function Input({ label, placeholder }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          fontSize: 13,
          marginBottom: 8,
          opacity: 0.75,
        }}
      >
        {label}
      </div>

      <input
        placeholder={placeholder}
        style={{
          width: "100%",
          height: 52,
          borderRadius: 16,
          border: "1px solid rgba(255,255,255,.08)",
          background: "rgba(255,255,255,.04)",
          padding: "0 16px",
          color: "white",
          outline: "none",
          boxSizing: "border-box",
        }}
      />
    </div>
  );
}