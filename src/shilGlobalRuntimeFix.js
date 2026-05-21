export function applyShilGlobalRuntimeFix() {
  const apply = () => {
    const root = document.getElementById("root");
    if (!root) return;

    document.body.style.margin = "0";
    document.body.style.overflowX = "hidden";
    document.body.style.background = "#f7f9fc";
    document.body.style.direction = "rtl";

    const path = window.location.pathname;

    if (path.includes("/new-project")) {
      const imgs = Array.from(root.querySelectorAll("img")).filter((img) => {
        const src = img.getAttribute("src") || "";
        return !src.includes("map") && !src.includes("iran") && !src.includes("heat") && !src.includes("logo");
      });

      imgs.forEach((img) => {
        img.style.width = "86px";
        img.style.height = "86px";
        img.style.maxWidth = "86px";
        img.style.maxHeight = "86px";
        img.style.objectFit = "contain";
        img.style.display = "block";
        img.style.margin = "0 auto 8px";

        const card = img.closest("a") || img.closest("button") || img.parentElement;

        if (card) {
          card.style.width = "112px";
          card.style.minHeight = "126px";
          card.style.display = "flex";
          card.style.flexDirection = "column";
          card.style.alignItems = "center";
          card.style.justifyContent = "center";
          card.style.textAlign = "center";
          card.style.gap = "6px";
          card.style.padding = "10px 8px";
          card.style.margin = "8px";
          card.style.borderRadius = "24px";
          card.style.background = "rgba(255,255,255,.82)";
          card.style.boxShadow = "0 12px 28px rgba(18,24,60,.12)";
          card.style.textDecoration = "none";
          card.style.color = "#35185f";
          card.style.overflow = "hidden";
        }
      });

      const cards = imgs
        .map((img) => img.closest("a") || img.closest("button") || img.parentElement)
        .filter(Boolean);

      if (cards.length && cards[0].parentElement) {
        const container = cards[0].parentElement;
        container.style.width = "100%";
        container.style.maxWidth = "430px";
        container.style.margin = "0 auto";
        container.style.padding = "64px 14px 88px";
        container.style.display = "grid";
        container.style.gridTemplateColumns = "repeat(3, minmax(0, 1fr))";
        container.style.justifyItems = "center";
        container.style.alignItems = "start";
        container.style.gap = "14px";
        container.style.overflowX = "hidden";
      }
    }

    const maps = Array.from(root.querySelectorAll('img[src*="map"], img[src*="iran"], img[src*="heat"]'));
    maps.forEach((img) => {
      img.style.width = "100%";
      img.style.maxWidth = "390px";
      img.style.height = "auto";
      img.style.display = "block";
      img.style.margin = "14px auto";
      img.style.borderRadius = "18px";
    });
  };

  apply();

  const observer = new MutationObserver(apply);
  observer.observe(document.body, { childList: true, subtree: true });

  window.addEventListener("resize", apply);
  window.addEventListener("popstate", apply);
}
