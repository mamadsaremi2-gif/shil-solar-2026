import React from "react";
import ShilPageShell from "../components/ShilPageShell.jsx";

const modules = [
  "Ø¢Ù…ÙˆØ²Ø´ ØªØ¬Ù‡ÛŒØ²Ø§Øª Ø§Ù†Ø±Ú˜ÛŒ Ø®ÙˆØ±Ø´ÛŒØ¯ÛŒ",
  "Ø¢Ù…ÙˆØ²Ø´ ØªØ¬Ù‡ÛŒØ²Ø§Øª Ø¨Ø±Ù‚ Ø§Ø¶Ø·Ø±Ø§Ø±ÛŒ",
  "Ù†Ú©Ø§Øª Ù†ØµØ¨ Ùˆ Ø¨Ù‡Ø±Ù‡ Ø¨Ø±Ø¯Ø§Ø±ÛŒ",
  "Ù…Ø­ØµÙˆÙ„Ø§Øª Ùˆ ØªØ¬Ù‡ÛŒØ²Ø§Øª Ø¨Ø±Ù†Ø¯ SHIL",
];

export default function Education() {
  return (
    <ShilPageShell title="Ø¢Ù…ÙˆØ²Ø´">
      <section className="shil-info-panel">
        <h3>Ù…Ø±Ú©Ø² Ø¢Ù…ÙˆØ²Ø´ SHIL</h3>
        <p>Ø§ÛŒÙ† ØµÙØ­Ù‡ ØªÙˆØ³Ø· Ø§Ø¯Ù…ÛŒÙ† ØªÚ©Ù…ÛŒÙ„ Ùˆ Ø¨Ù‡â€ŒØ±ÙˆØ²Ø±Ø³Ø§Ù†ÛŒ Ù…ÛŒâ€ŒØ´ÙˆØ¯ Ùˆ Ù…Ø­Ù„ Ù†Ù…Ø§ÛŒØ´ Ù†Ú©Ø§Øª Ø¢Ù…ÙˆØ²Ø´ÛŒ Ù…Ø­ØµÙˆÙ„Ø§ØªØŒ ØªØ¬Ù‡ÛŒØ²Ø§Øª Ø§Ù†Ø±Ú˜ÛŒ Ø®ÙˆØ±Ø´ÛŒØ¯ÛŒ Ùˆ Ø¨Ø±Ù‚ Ø§Ø¶Ø·Ø±Ø§Ø±ÛŒ Ø§Ø³Øª.</p>
      </section>
      <section className="shil-list-panel">
        {modules.map((item) => <article className="shil-mini-project-card" key={item}><strong>{item}</strong><span>Ù‚Ø§Ø¨Ù„ Ù…Ø¯ÛŒØ±ÛŒØª Ùˆ Ø¨Ø±ÙˆØ²Ø±Ø³Ø§Ù†ÛŒ ØªÙˆØ³Ø· Ø§Ø¯Ù…ÛŒÙ†</span></article>)}
      </section>
    </ShilPageShell>
  );
}
