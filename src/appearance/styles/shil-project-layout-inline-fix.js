
function applyProjectLayoutOffsets(){

    const title=document.querySelector(".shil-clean-section-head");
    if(title){
        title.style.setProperty("position","relative","important");
        title.style.setProperty("top","7px","important");
    }

    const cards=document.querySelector(".shil-project-path-two-cards");
    if(cards){
        cards.style.setProperty("position","relative","important");
        cards.style.setProperty("top","14px","important");
    }

    const utility=document.querySelector(".shil-utility-path-field");
    if(utility){
        utility.style.setProperty("position","relative","important");
        utility.style.setProperty("top","21px","important");
    }

    const btn=document.querySelector(".shil-project-path-confirm");
    if(btn){
        btn.style.setProperty("backdrop-filter","none","important");
        btn.style.setProperty("-webkit-backdrop-filter","none","important");
        btn.style.setProperty("filter","none","important");

        btn.style.setProperty("background-image","none","important");
        btn.style.setProperty("background-color","#8A2BE2","important");

        btn.style.setProperty("border","2px solid #6B1FD3","important");
        btn.style.setProperty("border-radius","22px","important");

        btn.style.setProperty(
            "box-shadow",
            "inset 0 2px 4px rgba(255,255,255,.35), inset 0 -2px 4px rgba(0,0,0,.15)",
            "important"
        );

        btn.style.setProperty("color","#ffffff","important");
        btn.style.setProperty("text-shadow","none","important");
    }

    document.querySelectorAll(".shil-project-path-card h3").forEach(el=>{
        el.style.setProperty("display","flex","important");
        el.style.setProperty("align-items","center","important");
        el.style.setProperty("justify-content","center","important");
        el.style.setProperty("text-align","center","important");
        el.style.setProperty("width","100%","important");
        el.style.setProperty("margin","12px auto 8px","important");
        el.style.setProperty("line-height","1.15","important");
    });

}

applyProjectLayoutOffsets();

setTimeout(applyProjectLayoutOffsets,50);
setTimeout(applyProjectLayoutOffsets,250);
setTimeout(applyProjectLayoutOffsets,700);

new MutationObserver(applyProjectLayoutOffsets).observe(document.body,{
    childList:true,
    subtree:true
});


function applyProjectInfoLayout(){
    const isInfoPage = document.body.classList.contains("shil-project-info-screen");
    if(!isInfoPage) return;

    const root =
        document.querySelector(".shil-project-info-page") ||
        document.querySelector(".shil-project-page") ||
        document.querySelector(".shil-engineering-content");

    if(root){
        root.style.setProperty("position","relative","important");
        root.style.setProperty("padding-top","21px","important");
    }

    document.querySelectorAll(".shil-clean-section-head").forEach(head=>{
        head.style.setProperty("display","flex","important");
        head.style.setProperty("align-items","center","important");
        head.style.setProperty("justify-content","center","important");

        head.style.setProperty("height","40px","important");
        head.style.setProperty("margin","0 0 14px","important");

        head.style.setProperty(
            "background",
            "linear-gradient(180deg,#f6fdff 0%,#dff5ff 55%,#aedbff 100%)",
            "important"
        );

        head.style.setProperty(
            "box-shadow",
            "inset 0 2px 6px rgba(255,255,255,.95), inset 0 -7px 14px rgba(63,173,255,.30)",
            "important"
        );

        head.style.setProperty("border-radius","20px","important");
        head.style.setProperty("border","1px solid rgba(255,255,255,.95)","important");

        const span = head.querySelector("span");
        if(span){
            span.style.setProperty("display","none","important");
        }

        const h2 = head.querySelector("h2");
        if(h2){
            h2.style.setProperty("width","100%","important");
            h2.style.setProperty("margin","0","important");
            h2.style.setProperty("font-size","16px","important");
            h2.style.setProperty("font-weight","900","important");
            h2.style.setProperty("text-align","center","important");
            h2.style.setProperty("color","#071827","important");
        }
    });

    document.querySelectorAll(".shil-form-grid").forEach(grid=>{
        grid.style.setProperty("display","grid","important");
        grid.style.setProperty(
            "grid-template-columns",
            "repeat(3,minmax(0,1fr))",
            "important"
        );
        grid.style.setProperty("gap","10px","important");
        grid.style.setProperty("margin-bottom","14px","important");
    });

    document.querySelectorAll(".shil-form-grid>*").forEach(el=>{
        el.style.setProperty("width","100%","important");
        el.style.setProperty("margin","0","important");
    });
}


applyProjectInfoLayout();
setTimeout(applyProjectInfoLayout,50);
setTimeout(applyProjectInfoLayout,250);
setTimeout(applyProjectInfoLayout,700);

new MutationObserver(applyProjectInfoLayout).observe(document.body,{
    childList:true,
    subtree:true
});


function applyProjectInfoTextareaSize(){
    const isInfoPage = document.body.classList.contains("shil-project-info-screen");
    if(!isInfoPage) return;

    document.querySelectorAll("textarea").forEach(el=>{
        el.style.setProperty("min-height","130px","important");
        el.style.setProperty("height","130px","important");
        el.style.setProperty("max-height","130px","important");

        el.style.setProperty("padding","18px","important");
        el.style.setProperty("line-height","1.6","important");
        el.style.setProperty("resize","none","important");
        el.style.setProperty("overflow-y","auto","important");

        const card = el.closest(".shil-field-card,.shil-env-card");
        if(card){
            card.style.setProperty("min-height","180px","important");
            card.style.setProperty("height","auto","important");
        }
    });
}


applyProjectInfoTextareaSize();
setTimeout(applyProjectInfoTextareaSize,50);
setTimeout(applyProjectInfoTextareaSize,250);
setTimeout(applyProjectInfoTextareaSize,700);

new MutationObserver(applyProjectInfoTextareaSize).observe(document.body,{
    childList:true,
    subtree:true
});


/* SHIL PATCH - unified project path confirmation button; button only */
(function () {
  const applyProjectPathConfirm = () => {
    document.querySelectorAll(".shil-project-path-confirm").forEach((btn) => {
      btn.style.setProperty("display", "block", "important");
      btn.style.setProperty("position", "relative", "important");
      btn.style.setProperty("width", "220px", "important");
      btn.style.setProperty("min-width", "220px", "important");
      btn.style.setProperty("max-width", "220px", "important");
      btn.style.setProperty("height", "46px", "important");
      btn.style.setProperty("min-height", "46px", "important");
      btn.style.setProperty("max-height", "46px", "important");
      btn.style.setProperty("margin-left", "auto", "important");
      btn.style.setProperty("margin-right", "auto", "important");
      btn.style.setProperty("left", "auto", "important");
      btn.style.setProperty("right", "auto", "important");
      btn.style.setProperty("bottom", "auto", "important");
      btn.style.setProperty("inset", "auto", "important");
      btn.style.setProperty("transform", "none", "important");
      btn.style.setProperty("float", "none", "important");
    });
  };

  applyProjectPathConfirm();
  setTimeout(applyProjectPathConfirm, 100);
  setTimeout(applyProjectPathConfirm, 500);
  setTimeout(applyProjectPathConfirm, 1000);

  new MutationObserver(applyProjectPathConfirm).observe(document.documentElement, {
    childList: true,
    subtree: true
  });
})();

/* SHIL PATCH - force project info confirm button compact */
(function () {
  const applyCompactProjectInfoConfirmButton = () => {
    document.querySelectorAll(
      ".shil-project-info-confirm, .shil-project-details-confirm, .shil-project-data-confirm, button"
    ).forEach((btn) => {
      const text = (btn.innerText || btn.textContent || "").trim();

      if (
        !btn.classList.contains("shil-project-info-confirm") &&
        !btn.classList.contains("shil-project-details-confirm") &&
        !btn.classList.contains("shil-project-data-confirm") &&
        !text.includes("تأیید") &&
        !text.includes("تایید")
      ) {
        return;
      }

      const pageText = document.body.innerText || "";
      if (
        !pageText.includes("اطلاعات پروژه") &&
        !pageText.includes("مشخصات پروژه")
      ) {
        return;
      }

      btn.style.setProperty("width", "max-content", "important");
      btn.style.setProperty("min-width", "0", "important");
      btn.style.setProperty("max-width", "none", "important");

      btn.style.setProperty("padding-left", "5px", "important");
      btn.style.setProperty("padding-right", "5px", "important");
      btn.style.setProperty("padding-top", "0", "important");
      btn.style.setProperty("padding-bottom", "0", "important");

      btn.style.setProperty("height", "46px", "important");
      btn.style.setProperty("display", "inline-flex", "important");
      btn.style.setProperty("align-items", "center", "important");
      btn.style.setProperty("justify-content", "center", "important");
      btn.style.setProperty("white-space", "nowrap", "important");

      btn.style.setProperty("left", "50%", "important");
      btn.style.setProperty("right", "auto", "important");
      btn.style.setProperty("transform", "translateX(-50%)", "important");
    });
  };

  applyCompactProjectInfoConfirmButton();
  setTimeout(applyCompactProjectInfoConfirmButton, 100);
  setTimeout(applyCompactProjectInfoConfirmButton, 500);
  setTimeout(applyCompactProjectInfoConfirmButton, 1000);

  new MutationObserver(applyCompactProjectInfoConfirmButton).observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["class", "style"]
  });
})();





/* ===== SHIL ALL CONFIRM BUTTONS PATCH ===== */
(function () {
  const styleConfirmButtons = () => {
    document.querySelectorAll("button").forEach((btn) => {
      const text = (btn.innerText || btn.textContent || "").trim();

      if (!text.includes("تایید") && !text.includes("تأیید")) return;

      btn.style.setProperty("width", "max-content", "important");
      btn.style.setProperty("min-width", "0", "important");
      btn.style.setProperty("max-width", "none", "important");

      btn.style.setProperty("padding-left", "5px", "important");
      btn.style.setProperty("padding-right", "5px", "important");
      btn.style.setProperty("padding-top", "0", "important");
      btn.style.setProperty("padding-bottom", "0", "important");

      btn.style.setProperty("height", "46px", "important");
      btn.style.setProperty("display", "inline-flex", "important");
      btn.style.setProperty("align-items", "center", "important");
      btn.style.setProperty("justify-content", "center", "important");
      btn.style.setProperty("white-space", "nowrap", "important");

      const isContentFlowConfirm =
        btn.classList.contains("shil-flow-content-confirm-slot") ||
        btn.classList.contains("shil-flow-content-confirm-button") ||
        btn.classList.contains("shil-inline-confirm-button") ||
        btn.classList.contains("shil-env-content-confirm-button") ||
        Boolean(btn.closest(".shil-system-settings-page, .shil-summary-page, .shil-equipment-page"));

      if (isContentFlowConfirm) {
        // These confirmation buttons are part of the page content. Keep them
        // exactly 8px after the final visible data and center them inside the
        // mobile content width. Do not use left:50%/translateX, because the
        // page is RTL and those runtime inline styles move the button away.
        btn.style.setProperty("position", "static", "important");
        btn.style.setProperty("inset", "auto", "important");
        btn.style.setProperty("top", "auto", "important");
        btn.style.setProperty("left", "auto", "important");
        btn.style.setProperty("right", "auto", "important");
        btn.style.setProperty("bottom", "auto", "important");
        btn.style.setProperty("transform", "none", "important");
        btn.style.setProperty("translate", "none", "important");
        btn.style.setProperty("display", "flex", "important");
        btn.style.setProperty("width", "max-content", "important");
        btn.style.setProperty("min-width", "110px", "important");
        btn.style.setProperty("max-width", "calc(100% - 24px)", "important");
        btn.style.setProperty("padding-left", "18px", "important");
        btn.style.setProperty("padding-right", "18px", "important");
        btn.style.setProperty("margin-top", "8px", "important");
        btn.style.setProperty("margin-left", "auto", "important");
        btn.style.setProperty("margin-right", "auto", "important");
        btn.style.setProperty("margin-bottom", "calc(52px + env(safe-area-inset-bottom, 0px))", "important");
        btn.style.setProperty("float", "none", "important");
        btn.style.setProperty("clear", "both", "important");
        btn.style.setProperty("align-self", "center", "important");
      } else {
        btn.style.setProperty("left", "50%", "important");
        btn.style.setProperty("right", "auto", "important");
        btn.style.setProperty("transform", "translateX(-50%)", "important");
      }

      btn.style.setProperty("background", "#8A2BE2", "important");
      btn.style.setProperty("background-color", "#8A2BE2", "important");
      btn.style.setProperty("background-image", "none", "important");
      btn.style.setProperty("color", "#ffffff", "important");
      btn.style.setProperty("border", "2px solid #6B1FD3", "important");
      btn.style.setProperty("border-radius", "22px", "important");
      btn.style.setProperty(
        "box-shadow",
        "inset 0 2px 4px rgba(255,255,255,.35), inset 0 -2px 4px rgba(0,0,0,.15)",
        "important"
      );
    });
  };

  styleConfirmButtons();
  setTimeout(styleConfirmButtons, 100);
  setTimeout(styleConfirmButtons, 400);
  setTimeout(styleConfirmButtons, 900);

  window.addEventListener("click", () => setTimeout(styleConfirmButtons, 80));
  window.addEventListener("popstate", () => setTimeout(styleConfirmButtons, 80));
})();
  
/* ===== END SHIL ALL CONFIRM BUTTONS PATCH ===== */


/* ===== SHIL SYSTEM TYPE TABLE BEHAVIOR ===== */
(function () {
  const applySystemTypeTable = () => {
    const page = document.querySelector(".shil-system-settings-page");
    if (!page) return;

    const card = [...page.querySelectorAll(".shil-section-card.shil-config-block")]
      .find(el => (el.innerText || "").includes("نوع سیستم خورشیدی"));

    if (!card) return;

    const grid = card.querySelector(":scope > .shil-choice-grid.three");
    if (!grid) return;

    const head = card.querySelector(":scope > .shil-section-head");
    if (head) {
      const span = head.querySelector("span");
      if (span) span.style.setProperty("display", "none", "important");
    }

    if (!card.querySelector(".shil-system-type-table-title")) {
      const tableTitle = document.createElement("div");
      tableTitle.className = "shil-system-type-table-title";
      tableTitle.textContent = "اختصاصی مسیر پنل خورشیدی";
      grid.parentNode.insertBefore(tableTitle, grid);
    }

    const labels = ["آفگرید", "هیبرید", "آنگرید"];
    [...grid.querySelectorAll(".shil-choice-card")].forEach((btn, i) => {
      if (labels[i]) btn.textContent = labels[i];
    });

    if (!card.querySelector(".shil-system-type-details")) {
      const details = document.createElement("div");
      details.className = "shil-system-type-details";
      details.innerHTML = `
        <button type="button" class="shil-system-type-details-toggle">توضیحات <span>⌄</span></button>
        <div class="shil-system-type-details-box" style="display:none">
          <div><strong>آفگرید</strong><span>باتری الزامی است و سیستم بدون شبکه کار می‌کند.</span></div>
          <div><strong>هیبرید</strong><span>پنل خورشیدی، باتری و اتصال به شبکه را هم‌زمان پشتیبانی می‌کند.</span></div>
          <div><strong>آنگرید</strong><span>بدون باتری و به‌صورت پیش‌فرض متصل به شبکه برق است.</span></div>
        </div>
      `;
      grid.parentNode.insertBefore(details, grid.nextSibling);
    }

    const toggle = card.querySelector(".shil-system-type-details-toggle");
    const box = card.querySelector(".shil-system-type-details-box");

    if (toggle && box && !toggle.dataset.shilBound) {
      toggle.dataset.shilBound = "1";
      toggle.addEventListener("click", () => {
        const isOpen = box.style.display !== "none";
        box.style.display = isOpen ? "none" : "block";
        const icon = toggle.querySelector("span");
        if (icon) icon.textContent = isOpen ? "⌄" : "⌃";
      });
    }
  };

  applySystemTypeTable();
  setTimeout(applySystemTypeTable, 100);
  setTimeout(applySystemTypeTable, 500);
  setTimeout(applySystemTypeTable, 1000);

  window.addEventListener("click", () => setTimeout(applySystemTypeTable, 80));
})();
  
/* ===== END SHIL SYSTEM TYPE TABLE BEHAVIOR ===== */



/* ===== SHIL ENERGY SUMMARY SMART TABLE BEHAVIOR ===== */
(function () {
  const applyEnergySummarySmartTable = () => {
    const page = document.querySelector(".shil-system-settings-page");
    if (!page) return;

    const card = [...page.querySelectorAll(".shil-section-card.shil-config-block")]
      .find(el =>
        (el.innerText || "").includes("چکیده مسیر انرژی روزانه") ||
        (el.innerText || "").includes("چکیده مسیر توان کل")
      );

    if (!card) return;

    const head = card.querySelector(":scope > .shil-section-head");
    const grid = card.querySelector(":scope > .shil-summary-grid");
    if (!grid) return;

    if (grid.dataset.shilEnergySmart === "1") return;

    const rows = [...grid.querySelectorAll(":scope > .shil-summary-item")]
      .map(item => {
        const label =
          item.querySelector("span,label,p,small")?.innerText?.trim() ||
          item.children[0]?.innerText?.trim() ||
          item.innerText?.split("\n")[0]?.trim() ||
          "";

        const value =
          item.querySelector("strong,b,h3,h4")?.innerText?.trim() ||
          [...item.children].slice(1).map(x => x.innerText?.trim()).filter(Boolean).join(" ") ||
          item.innerText?.split("\n").slice(1).join(" ").trim() ||
          "";

        return { label, value };
      })
      .filter(x => x.label);

    if (!rows.length) return;

    const tableTitle =
      head?.querySelector("span")?.innerText?.trim() ||
      "مبنای مصرف";

    card.style.setProperty("background", "transparent", "important");
    card.style.setProperty("border", "0", "important");
    card.style.setProperty("border-right", "0", "important");
    card.style.setProperty("box-shadow", "none", "important");
    card.style.setProperty("padding", "0", "important");
    card.style.setProperty("margin-bottom", "18px", "important");
    card.style.setProperty("overflow", "visible", "important");

    if (head) {
      const sub = head.querySelector("span");
      if (sub) sub.style.setProperty("display", "none", "important");
    }

    let tableTitleEl = card.querySelector(".shil-energy-summary-table-title");
    if (!tableTitleEl) {
      tableTitleEl = document.createElement("div");
      tableTitleEl.className = "shil-energy-summary-table-title";
      grid.parentNode.insertBefore(tableTitleEl, grid);
    }

    tableTitleEl.textContent = tableTitle;

    grid.classList.add("shil-energy-summary-grid");
    grid.dataset.shilEnergySmart = "1";
    grid.style.setProperty("grid-template-columns", `repeat(${rows.length}, minmax(0, 1fr))`, "important");

    [...grid.querySelectorAll(":scope > .shil-summary-item")].forEach((item, i) => {
      const data = rows[i];
      if (!data) return;
      item.innerHTML = `<span>${data.label}</span>`;
    });

    let details = card.querySelector(".shil-energy-summary-details");
    if (!details) {
      details = document.createElement("div");
      details.className = "shil-energy-summary-details";
      grid.parentNode.insertBefore(details, grid.nextSibling);
    }

    details.innerHTML = `
      <button type="button" class="shil-energy-summary-details-toggle">توضیحات <span>⌄</span></button>
      <div class="shil-energy-summary-details-box" style="display:none">
        <div class="shil-energy-summary-details-head">
          ${rows.map(r => `<strong>${r.label}</strong>`).join("")}
        </div>
        <div class="shil-energy-summary-details-values">
          ${rows.map(r => `<span>${r.value || "—"}</span>`).join("")}
        </div>
      </div>
    `;

    const box = details.querySelector(".shil-energy-summary-details-box");
    const toggle = details.querySelector(".shil-energy-summary-details-toggle");

    details.querySelectorAll(".shil-energy-summary-details-head,.shil-energy-summary-details-values")
      .forEach(row => {
        row.style.setProperty("grid-template-columns", `repeat(${rows.length}, minmax(0,1fr))`, "important");
      });

    if (toggle && box) {
      toggle.addEventListener("click", () => {
        const isOpen = box.style.display !== "none";
        box.style.display = isOpen ? "none" : "block";
        const icon = toggle.querySelector("span");
        if (icon) icon.textContent = isOpen ? "⌄" : "⌃";
      });
    }
  };

  applyEnergySummarySmartTable();
  setTimeout(applyEnergySummarySmartTable, 100);
  setTimeout(applyEnergySummarySmartTable, 500);
  setTimeout(applyEnergySummarySmartTable, 1000);

  window.addEventListener("click", () => setTimeout(applyEnergySummarySmartTable, 80));
})();
  
/* ===== END SHIL ENERGY SUMMARY SMART TABLE BEHAVIOR ===== */


/* SHIL_CONFIRM_BUTTON_PLACEMENT_SAFE_START */
(function(){
  if (window.__SHIL_CONFIRM_BUTTON_PLACEMENT_SAFE__) return;
  window.__SHIL_CONFIRM_BUTTON_PLACEMENT_SAFE__ = true;

  const selector = [
    ".shil-project-path-confirm",
    ".shil-calculation-method-confirm",
    ".shil-project-info-confirm",
    ".shil-project-details-confirm",
    ".shil-project-data-confirm",
    ".shil-env-content-confirm-button",
    ".shil-env-confirm-button",
    ".shil-env-confirm-final-button",
    ".shil-env-confirm-button-final",
    ".shil-flow-content-confirm-button",
    ".shil-confirm-config-button",
    ".shil-inline-confirm-button",
    ".shil-calc-content-confirm-slot > button",
    ".shil-system-content-confirm-slot > button",
    ".shil-summary-content-confirm-slot > button",
    ".shil-run-content-confirm-slot > button",
    ".shil-input-content-confirm-slot > button",
    ".shil-env-content-confirm-slot > button"
  ].join(",");

  function applyConfirmPlacement(){
    document.querySelectorAll(selector).forEach(function(btn){
      if (!(btn instanceof HTMLButtonElement)) return;
      btn.style.setProperty("display","block","important");
      btn.style.setProperty("position","relative","important");
      btn.style.setProperty("inset","auto","important");
      btn.style.setProperty("top","auto","important");
      btn.style.setProperty("bottom","auto","important");
      btn.style.setProperty("left","auto","important");
      btn.style.setProperty("right","auto","important");
      btn.style.setProperty("transform","none","important");
      btn.style.setProperty("float","none","important");
      btn.style.setProperty("width","220px","important");
      btn.style.setProperty("min-width","220px","important");
      btn.style.setProperty("max-width","220px","important");
      btn.style.setProperty("height","46px","important");
      btn.style.setProperty("min-height","46px","important");
      btn.style.setProperty("max-height","46px","important");
      btn.style.setProperty("margin-left","auto","important");
      btn.style.setProperty("margin-right","auto","important");
    });
  }

  function run(){
    applyConfirmPlacement();
    setTimeout(applyConfirmPlacement, 100);
    setTimeout(applyConfirmPlacement, 500);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run, { once: true });
  } else {
    run();
  }

  window.addEventListener("popstate", run);
  window.addEventListener("hashchange", run);
  document.addEventListener("click", function(){ setTimeout(applyConfirmPlacement, 0); });

  new MutationObserver(applyConfirmPlacement).observe(document.documentElement, {
    childList: true,
    subtree: true
  });
})();
/* SHIL_CONFIRM_BUTTON_PLACEMENT_SAFE_END */
