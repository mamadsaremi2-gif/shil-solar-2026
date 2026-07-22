export function assertNonVisualInfrastructureScope(change) {
  const blockedKeywords = ["color", "layout", "font", "animation", "icon", "css"];
  const text = JSON.stringify(change || {}).toLowerCase();
  return {
    ok: !blockedKeywords.some((keyword) => text.includes(keyword)),
    message: "این نسخه برای زیرساخت است؛ تغییرات ظاهری باید در آپدیت طراحی انجام شود.",
  };
}
