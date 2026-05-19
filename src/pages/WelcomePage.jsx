import React from "react";
import { Link } from "react-router-dom";

export default function WelcomePage() {
  return (
    <main className="shil-welcome-page shil-welcome-fullscreen" dir="rtl">
      <img
        className="shil-welcome-fullscreen-image"
        src="/assets/shil/welcome/welcome-fullscreen.png"
        alt="SHIL Solar Smart Energy"
      />

      <Link className="shil-primary-entry shil-welcome-entry-button" to="/dashboard">
        ÙˆØ±ÙˆØ¯ Ø¨Ù‡ Ø¯Ø§Ø´Ø¨ÙˆØ±Ø¯
      </Link>
    </main>
  );
}
