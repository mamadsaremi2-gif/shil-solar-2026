
function applyShilUtilityHeaderStyle() {
  document.querySelectorAll(".shil-utility-path-field summary").forEach((summary) => {
    const title = summary.querySelector("span");
    const note = summary.querySelector("small");

    summary.style.cssText += `
      display:grid !important;
      grid-template-columns:160px 1fr !important;
      align-items:center !important;
      gap:12px !important;
      padding:8px 10px !important;
      height:auto !important;
      background:transparent !important;
      border:0 !important;
      box-shadow:none !important;
    `;

    if (title) {
      title.style.cssText += `
        display:flex !important;
        align-items:center !important;
        justify-content:center !important;
        height:36px !important;
        background-color:#cfeeff !important;
        background-image:linear-gradient(180deg,#f4fbff 0%,#d8efff 48%,#add8f4 100%) !important;
        border:1px solid rgba(255,255,255,.95) !important;
        border-radius:18px !important;
        box-shadow:inset 0 3px 8px rgba(255,255,255,.95), inset 0 -6px 12px rgba(38,109,170,.35), inset 0 0 18px rgba(0,140,255,.12), 0 6px 16px rgba(0,0,0,.15) !important;
        font-size:14px !important;
        font-weight:900 !important;
        color:#061421 !important;
      `;
    }

    if (note) {
      note.style.cssText += `
        display:flex !important;
        align-items:center !important;
        justify-content:center !important;
        margin:0 !important;
        height:36px !important;
        padding:0 12px !important;
        background:linear-gradient(180deg,#efffe9,#dff9d9) !important;
        border-radius:18px !important;
        box-shadow:inset 0 2px 6px rgba(255,255,255,.9), inset 0 -4px 10px rgba(40,120,40,.18) !important;
        font-size:12px !important;
        font-weight:700 !important;
        color:#1d5d18 !important;
        text-align:center !important;
      `;
    }
  });
}

applyShilUtilityHeaderStyle();

setTimeout(applyShilUtilityHeaderStyle, 50);
setTimeout(applyShilUtilityHeaderStyle, 250);
setTimeout(applyShilUtilityHeaderStyle, 700);

new MutationObserver(applyShilUtilityHeaderStyle).observe(document.body, {
  childList: true,
  subtree: true
});

