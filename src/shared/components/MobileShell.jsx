import "../../mobile-ui/styles/globals.css";

export function MobileShell({ header, footer, children }) {
  return (
    <div className="shil-app">
      <div className="shil-shell">
        {header}
        <main className="shil-main">{children}</main>
        {footer}
      </div>
    </div>
  );
}
