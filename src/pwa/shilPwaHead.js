/* SHIL PWA metadata bootstrap.
 * Keeps install/home-screen metadata available even when the root index.html
 * is managed outside the distributed src bundle.
 */
(function installShilPwaHead() {
  if (typeof document === 'undefined') return;

  const head = document.head;
  if (!head) return;

  const upsertLink = (rel, href, attrs = {}) => {
    let el = head.querySelector(`link[rel="${rel}"]${attrs.sizes ? `[sizes="${attrs.sizes}"]` : ''}`);
    if (!el) {
      el = document.createElement('link');
      el.rel = rel;
      head.appendChild(el);
    }
    el.href = href;
    Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
  };

  const upsertMeta = (name, content) => {
    let el = head.querySelector(`meta[name="${name}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.name = name;
      head.appendChild(el);
    }
    el.content = content;
  };

  upsertLink('manifest', '/manifest.webmanifest');
  upsertLink('apple-touch-icon', '/apple-touch-icon.png', { sizes: '180x180' });
  upsertLink('icon', '/icons/icon-192.png', { type: 'image/png', sizes: '192x192' });
  upsertLink('icon', '/icons/icon-512.png', { type: 'image/png', sizes: '512x512' });
  upsertLink('shortcut icon', '/favicon.ico');

  upsertMeta('theme-color', '#06182a');
  upsertMeta('apple-mobile-web-app-capable', 'yes');
  upsertMeta('apple-mobile-web-app-status-bar-style', 'black-translucent');
  upsertMeta('apple-mobile-web-app-title', 'SHIL');
  upsertMeta('mobile-web-app-capable', 'yes');
})();
