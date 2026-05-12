import { APP_LAYOUT } from './layout.config';

export function AppFooter({ children, className = '' }) {
  return <footer className={`${APP_LAYOUT.footer.className} ${className}`.trim()}>{children}</footer>;
}
