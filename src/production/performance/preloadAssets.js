export function preloadCriticalAssets() {
  const assets = [
    "/",
    "/index.html",
  ];

  assets.forEach((href) => {
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.href = href;
    document.head.appendChild(link);
  });
}
