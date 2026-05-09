import { useEffect, useState } from 'react';
import { syncQueuedUsageEvents } from '../lib/usageTracker.js';

export function OfflineStatus() {
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine !== false));
  const [showBackOnline, setShowBackOnline] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    syncQueuedUsageEvents().catch(() => {});

    function handleOnline() {
      setOnline(true);
      setShowBackOnline(true);
      syncQueuedUsageEvents().catch(() => {});
      window.setTimeout(() => setShowBackOnline(false), 3500);
    }
    function handleOffline() {
      setOnline(false);
      setShowBackOnline(false);
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!online) {
    return <div className="offline-status offline-status--offline" role="status">حالت آفلاین فعال است؛ پروژه‌ها روی همین دستگاه ذخیره می‌شوند.</div>;
  }

  if (showBackOnline) {
    return <div className="offline-status offline-status--online" role="status">اتصال برگشت؛ داده‌های صف‌شده همگام‌سازی می‌شوند.</div>;
  }

  return null;
}
