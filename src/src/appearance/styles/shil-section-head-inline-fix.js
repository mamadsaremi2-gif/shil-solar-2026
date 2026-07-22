
function applyShilSectionHeadStyle() {
  document.querySelectorAll(".shil-clean-section-head").forEach((head) => {
    const en = head.querySelector("span");
    const fa = head.querySelector("h2");

    if (en) en.style.setProperty("display", "none", "important");

    head.style.cssText += `
      display:flex !important;
      align-items:center !important;
      justify-content:center !important;
      text-align:center !important;
      height:36px !important;
      min-height:36px !important;
      max-height:36px !important;
      padding:0 14px !important;
      margin:0 0 10px !important;
      background-color:#cfeeff !important;
      background-image:linear-gradient(180deg,#f4fbff 0%,#d8efff 48%,#add8f4 100%) !important;
      border:1px solid rgba(255,255,255,.95) !important;
      border-radius:18px !important;
      box-shadow:inset 0 3px 8px rgba(255,255,255,.95), inset 0 -6px 12px rgba(38,109,170,.35), inset 0 0 18px rgba(0,140,255,.12), 0 6px 16px rgba(0,0,0,.15) !important;
      box-sizing:border-box !important;
    `;

    if (fa) {
      fa.style.cssText += `
        width:100% !important;
        margin:0 !important;
        font-size:14px !important;
        font-weight:900 !important;
        line-height:1 !important;
        text-align:center !important;
        color:#061421 !important;
      `;
    }
  });
}

applyShilSectionHeadStyle();

setTimeout(applyShilSectionHeadStyle, 50);
setTimeout(applyShilSectionHeadStyle, 250);
setTimeout(applyShilSectionHeadStyle, 700);

new MutationObserver(applyShilSectionHeadStyle).observe(document.body, {
  childList: true,
  subtree: true
});

