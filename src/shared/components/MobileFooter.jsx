export function MobileFooter({ mode = "dashboard", onPrevious, onSave, onConfirm, onDashboard }) {
  if (mode === "single") {
    return <footer className="shil-footer"><button className="shil-primary-btn" onClick={onDashboard}>داشبورد</button></footer>;
  }
  return (
    <footer className="shil-footer">
      <div className="shil-footer-row">
        <button className="shil-ghost-btn" onClick={onPrevious}>مرحله قبل</button>
        <button className="shil-ghost-btn" onClick={onSave}>ذخیره پیش‌نویس</button>
        <button className="shil-primary-btn" onClick={onConfirm}>تأیید مرحله</button>
      </div>
    </footer>
  );
}
