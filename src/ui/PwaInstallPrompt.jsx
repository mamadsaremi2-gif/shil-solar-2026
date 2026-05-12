import { useEffect, useState } from 'react';

export function PwaInstallPrompt() {
  const [promptEvent, setPromptEvent] = useState(null);
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem('shil:pwa-install-dismissed') === '1'; } catch { return false; }
  });

  useEffect(() => {
    function handleBeforeInstallPrompt(event) {
      event.preventDefault();
      setPromptEvent(event);
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  if (!promptEvent || dismissed) return null;

  const install = async () => {
    await promptEvent.prompt();
    setPromptEvent(null);
  };

  const dismiss = () => {
    setDismissed(true);
    try { localStorage.setItem('shil:pwa-install-dismissed', '1'); } catch {}
  };

  return (
    <aside className="shil-v22-install-prompt" role="dialog" aria-label="نصب اپ SHIL">
      <strong>نصب SHIL روی موبایل</strong>
      <p>برای اجرای سریع‌تر، دسترسی آفلاین و تجربه شبیه اپ native، SHIL را نصب کنید.</p>
      <div className="shil-v22-install-prompt__actions">
        <button type="button" className="shil-v22-install-prompt__dismiss" onClick={dismiss}>بعداً</button>
        <button type="button" className="shil-v22-install-prompt__install" onClick={install}>نصب</button>
      </div>
    </aside>
  );
}
