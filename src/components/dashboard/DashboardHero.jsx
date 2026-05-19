import React from "react";
import { motion } from "framer-motion";

export default function DashboardHero() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="hero-v15"
    >
      <div className="hero-topline">
        <span>Industrial UI</span>
        <span>SHIL Mobile V15</span>
      </div>

      <div className="hero-logo-wrap">
        <div className="hero-logo-glow" />
        <h1>SHIL</h1>
        <p>SMART ENGINEERING SUITE</p>
      </div>

      <div className="hero-content">
        <h2>
          طراحی هوشمند
          <br />
          سامانه‌های خورشیدی
          <br />
          و برق اضطراری
        </h2>

        <p>
          رابط صنعتی نسل جدید برای طراحی،
          محاسبات و اجرای پروژه‌های انرژی
          با معماری Mobile First.
        </p>
      </div>
    </motion.section>
  );
}