import { buildShareText } from "../constants/contactLinks.js";

export async function copyToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return true;
  }

  const area = document.createElement("textarea");
  area.value = text;
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.focus();
  area.select();
  document.execCommand("copy");
  document.body.removeChild(area);
  return true;
}

export async function shareSmart({ title, text, url } = {}) {
  const shareUrl = url || window.location.href;
  const shareTitle = title || document.title || "SHIL Solar Design Suite";
  const shareText = text || buildShareText(shareTitle, shareUrl);

  if (navigator.share) {
    await navigator.share({
      title: shareTitle,
      text: shareText,
      url: shareUrl,
    });
    return "native";
  }

  await copyToClipboard(`${shareText}\n${shareUrl}`);
  return "copied";
}

export function getShareLinks({ title, text, url } = {}) {
  const shareUrl = encodeURIComponent(url || window.location.href);
  const shareTitle = encodeURIComponent(title || "SHIL Solar Design Suite");
  const shareText = encodeURIComponent(text || buildShareText(title || "SHIL Solar Design Suite", url || window.location.href));

  return {
    sms: `sms:?&body=${shareText}%0A${shareUrl}`,
    email: `mailto:?subject=${shareTitle}&body=${shareText}%0A${shareUrl}`,
    gmail: `https://mail.google.com/mail/?view=cm&fs=1&su=${shareTitle}&body=${shareText}%0A${shareUrl}`,
    whatsapp: `https://wa.me/?text=${shareText}%0A${shareUrl}`,
  };
}
