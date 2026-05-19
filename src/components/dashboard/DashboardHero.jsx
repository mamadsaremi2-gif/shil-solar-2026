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
          Ø·Ø±Ø§Ø­ÛŒ Ù‡ÙˆØ´Ù…Ù†Ø¯
          <br />
          Ø³Ø§Ù…Ø§Ù†Ù‡â€ŒÙ‡Ø§ÛŒ Ø®ÙˆØ±Ø´ÛŒØ¯ÛŒ
          <br />
          Ùˆ Ø¨Ø±Ù‚ Ø§Ø¶Ø·Ø±Ø§Ø±ÛŒ
        </h2>

        <p>
          Ø±Ø§Ø¨Ø· ØµÙ†Ø¹ØªÛŒ Ù†Ø³Ù„ Ø¬Ø¯ÛŒØ¯ Ø¨Ø±Ø§ÛŒ Ø·Ø±Ø§Ø­ÛŒØŒ
          Ù…Ø­Ø§Ø³Ø¨Ø§Øª Ùˆ Ø§Ø¬Ø±Ø§ÛŒ Ù¾Ø±ÙˆÚ˜Ù‡â€ŒÙ‡Ø§ÛŒ Ø§Ù†Ø±Ú˜ÛŒ
          Ø¨Ø§ Ù…Ø¹Ù…Ø§Ø±ÛŒ Mobile First.
        </p>
      </div>
    </motion.section>
  );
}