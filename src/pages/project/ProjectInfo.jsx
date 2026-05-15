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
import ProjectActionBar from "../../components/project/ProjectActionBar.jsx";
import ProjectStepRail from "../../components/project/ProjectStepRail.jsx";

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
        <ProjectStepRail />
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
            <h1>Ø§Ø·Ù„Ø§Ø¹Ø§Øª Ù¾Ø±ÙˆÚ˜Ù‡</h1>

            <h2>
              Ù…Ø´Ø®ØµØ§Øª Ù¾Ø§ÛŒÙ‡ Ù¾Ø±ÙˆÚ˜Ù‡ Ùˆ Ø§Ø·Ù„Ø§Ø¹Ø§Øª Ø§ÙˆÙ„ÛŒÙ‡
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
            <label>Ù†Ø§Ù… Ù¾Ø±ÙˆÚ˜Ù‡</label>

            <input
              type="text"
              placeholder="Ù…Ø«Ù„Ø§Ù‹ ÙˆÛŒÙ„Ø§ÛŒ Ø®ÙˆØ±Ø´ÛŒØ¯ÛŒ Ø´Ù…Ø§Ù„"
            />
          </div>

          {/* FIELD */}

          <div className="project-field-v15">
            <label>Ù†Ø§Ù… Ú©Ø§Ø±ÙØ±Ù…Ø§</label>

            <input
              type="text"
              placeholder="Ù†Ø§Ù… Ø´Ø®Øµ ÛŒØ§ Ø´Ø±Ú©Øª"
            />
          </div>

          {/* FIELD */}

          <div className="project-field-v15">
            <label>Ù†ÙˆØ¹ Ù¾Ø±ÙˆÚ˜Ù‡</label>

            <select>
              <option>
                Ø§Ù†ØªØ®Ø§Ø¨ Ù†ÙˆØ¹ Ù¾Ø±ÙˆÚ˜Ù‡
              </option>

              <option>
                Ù†ÛŒØ±ÙˆÚ¯Ø§Ù‡ Ø®ÙˆØ±Ø´ÛŒØ¯ÛŒ
              </option>

              <option>
                Ø¨Ø±Ù‚ Ø§Ø¶Ø·Ø±Ø§Ø±ÛŒ
              </option>

              <option>
                Ù‡ÛŒØ¨Ø±ÛŒØ¯
              </option>
            </select>
          </div>

          {/* FIELD */}

          <div className="project-field-v15">
            <label>Ø´Ù‡Ø± Ù¾Ø±ÙˆÚ˜Ù‡</label>

            <input
              type="text"
              placeholder="Ù…Ø«Ù„Ø§Ù‹ Ø´ÛŒØ±Ø§Ø²"
            />
          </div>

          {/* FIELD */}

          <div className="project-field-v15">
            <label>Ø´Ù…Ø§Ø±Ù‡ ØªÙ…Ø§Ø³</label>

            <input
              type="text"
              placeholder="09xxxxxxxxx"
            />
          </div>

          {/* FIELD */}

          <div className="project-field-v15">
            <label>ØªÙˆØ¶ÛŒØ­Ø§Øª Ù¾Ø±ÙˆÚ˜Ù‡</label>

            <textarea
              rows="5"
              placeholder="ØªÙˆØ¶ÛŒØ­Ø§Øª ÙÙ†ÛŒØŒ Ù†ÛŒØ§Ø²Ù…Ù†Ø¯ÛŒâ€ŒÙ‡Ø§ Ùˆ Ø´Ø±Ø§ÛŒØ· Ù¾Ø±ÙˆÚ˜Ù‡..."
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

          <h2>ÙˆØ¶Ø¹ÛŒØª Ù…Ø±Ø­Ù„Ù‡</h2>

          <p>
            Ø§Ø·Ù„Ø§Ø¹Ø§Øª Ù¾Ø§ÛŒÙ‡ Ù¾Ø±ÙˆÚ˜Ù‡ Ø¨Ø±Ø§ÛŒ Ø§ØªØµØ§Ù„
            Ø¨Ù‡ Ù…ÙˆØªÙˆØ± Ø·Ø±Ø§Ø­ÛŒ Ùˆ Ù…Ø­Ø§Ø³Ø¨Ø§Øª Ù…Ù‡Ù†Ø¯Ø³ÛŒ
            Ø¯Ø± Ø§ÛŒÙ† Ù…Ø±Ø­Ù„Ù‡ Ø°Ø®ÛŒØ±Ù‡ Ù…ÛŒâ€ŒØ´ÙˆØ¯.
          </p>
        </motion.section>
      </main>

      {/* ACTION BAR */}

      <div className="project-actionbar-v15">
        <button className="action-btn-v15 secondary">
          <ChevronLeft size={20} />

          Ù…Ø±Ø­Ù„Ù‡ Ù‚Ø¨Ù„
        </button>

        <button className="action-btn-v15">
          <Save size={20} />

          Ø°Ø®ÛŒØ±Ù‡ Ù¾ÛŒØ´â€ŒÙ†ÙˆÛŒØ³
        </button>

        <button className="action-btn-v15 primary">
          <CheckCircle2 size={20} />

          ØªØ§ÛŒÛŒØ¯ Ù…Ø±Ø­Ù„Ù‡
        </button>
      </div>

      {/* FOOTER */}

      <ProjectActionBar />
      <DashboardBottomNav />
    </div>
  );
}

