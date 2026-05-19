export function MobileFooter({ mode = "dashboard", onPrevious, onSave, onConfirm, onDashboard }) {
  if (mode === "single") {
    return <footer className="shil-footer"><button className="shil-primary-btn" onClick={onDashboard}>Ø¯Ø§Ø´Ø¨ÙˆØ±Ø¯</button></footer>;
  }
  return (
    <footer className="shil-footer">
      <div className="shil-footer-row">
        <button className="shil-ghost-btn" onClick={onPrevious}>Ù…Ø±Ø­Ù„Ù‡ Ù‚Ø¨Ù„</button>
        <button className="shil-ghost-btn" onClick={onSave}>Ø°Ø®ÛŒØ±Ù‡ Ù¾ÛŒØ´â€ŒÙ†ÙˆÛŒØ³</button>
        <button className="shil-primary-btn" onClick={onConfirm}>ØªØ£ÛŒÛŒØ¯ Ù…Ø±Ø­Ù„Ù‡</button>
      </div>
    </footer>
  );
}
