import React from "react";
import { Link } from "react-router-dom";

import {
  FolderOpen,
  ChevronLeft,
  Save,
  CheckCircle2,
} from "lucide-react";

import { motion } from "framer-motion";

import DashboardBottomNav from "../../components/dashboard/DashboardBottomNav.jsx";

export default function ProjectInfo() {
  return (
    <div className="dashboard-shell-v15" dir="rtl">
      {/* BG GLOW */}

      <div className="dashboard-bg-glow glow-1" />
      <div className="dashboard-bg-glow glow-2" />
      <div className="dashboard-bg-glow glow-3" />

      {/* HEADER */}

      <header className="dashboard-header-v15">
        <Link to="/new-project" className="header-btn-v15">
          <ChevronLeft size={22} />
        </Link>

        <div className="brand-v15">
          <h1>SHIL</h1>
          <span>PROJECT INFORMATION</span>
        </div>

        <div className="header-btn-v15">
          <FolderOpen size={22} />
        </div>
      </header>

      {/* MAIN */}

      <main className="dashboard-main-v15">
        {/* HERO */}

        <motion.section
          className="hero-card-v15"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <div className="hero-row-v15">
            <span>STEP 01</span>
            <span>PROJECT CORE</span>
          </div>

          <div className="hero-content-v15">
            <h1>اطلاعات پروژه</h1>

            <h2>
              مشخصات پایه پروژه و اطلاعات اولیه
            </h2>
          </div>
        </motion.section>

        {/* FORM CARD */}

        <motion.section
          className="status-card-v15"
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.04 }}
        >
          <div className="status-chip">
            SHIL V15
          </div>

          {/* FIELD */}

          <div className="project-field-v15">
            <label>نام پروژه</label>

            <input
              type="text"
              placeholder="مثلاً ویلای خورشیدی شمال"
            />
          </div>

          {/* FIELD */}

          <div className="project-field-v15">
            <label>نام کارفرما</label>

            <input
              type="text"
              placeholder="نام شخص یا شرکت"
            />
          </div>

          {/* FIELD */}

          <div className="project-field-v15">
            <label>نوع پروژه</label>

            <select>
              <option>
                انتخاب نوع پروژه
              </option>

              <option>
                نیروگاه خورشیدی
              </option>

              <option>
                برق اضطراری
              </option>

              <option>
                هیبرید
              </option>
            </select>
          </div>

          {/* FIELD */}

          <div className="project-field-v15">
            <label>شهر پروژه</label>

            <input
              type="text"
              placeholder="مثلاً شیراز"
            />
          </div>

          {/* FIELD */}

          <div className="project-field-v15">
            <label>شماره تماس</label>

            <input
              type="text"
              placeholder="09xxxxxxxxx"
            />
          </div>

          {/* FIELD */}

          <div className="project-field-v15">
            <label>توضیحات پروژه</label>

            <textarea
              rows="5"
              placeholder="توضیحات فنی، نیازمندی‌ها و شرایط پروژه..."
            />
          </div>
        </motion.section>

        {/* STATUS */}

        <motion.section
          className="status-card-v15"
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
        >
          <div className="status-chip">
            ENGINE STATUS
          </div>

          <h2>وضعیت مرحله</h2>

          <p>
            اطلاعات پایه پروژه برای اتصال
            به موتور طراحی و محاسبات مهندسی
            در این مرحله ذخیره می‌شود.
          </p>
        </motion.section>
      </main>

      {/* ACTION BAR */}

      <div className="project-actionbar-v15">
        <button className="action-btn-v15 secondary">
          <ChevronLeft size={20} />

          مرحله قبل
        </button>

        <button className="action-btn-v15">
          <Save size={20} />

          ذخیره پیش‌نویس
        </button>

        <button className="action-btn-v15 primary">
          <CheckCircle2 size={20} />

          تایید مرحله
        </button>
      </div>

      {/* FOOTER */}

      <DashboardBottomNav />
    </div>
  );
}