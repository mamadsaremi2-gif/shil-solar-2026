export function assertNonVisualInfrastructureScope(change) {
  const blockedKeywords = ["color", "layout", "font", "animation", "icon", "css"];
  const text = JSON.stringify(change || {}).toLowerCase();
  return {
    ok: !blockedKeywords.some((keyword) => text.includes(keyword)),
    message: "Ø§ÛŒÙ† Ù†Ø³Ø®Ù‡ Ø¨Ø±Ø§ÛŒ Ø²ÛŒØ±Ø³Ø§Ø®Øª Ø§Ø³ØªØ› ØªØºÛŒÛŒØ±Ø§Øª Ø¸Ø§Ù‡Ø±ÛŒ Ø¨Ø§ÛŒØ¯ Ø¯Ø± Ø¢Ù¾Ø¯ÛŒØª Ø·Ø±Ø§Ø­ÛŒ Ø§Ù†Ø¬Ø§Ù… Ø´ÙˆØ¯.",
  };
}
