import { useState } from "react";
import { getShareLinks, shareSmart, copyToClipboard } from "../utils/share";

export function ShareActions({ title = "SHIL Solar Design Suite", text = "لینک برنامه طراحی سیستم خورشیدی SHIL", url }) {
  const [copied, setCopied] = useState(false);
  const shareUrl = url || (typeof window !== "undefined" ? window.location.href : "");
  const links = getShareLinks({ title, text, url: shareUrl });

  async function handleSmartShare() {
    try {
      const result = await shareSmart({ title, text, url: shareUrl });
      setCopied(result === "copied");
      if (result === "copied") window.alert("لینک کپی شد. می‌توانید در پیامک، واتساپ، ایمیل یا برنامه‌های داخلی ارسال کنید.");
    } catch (error) {
      if (error?.name !== "AbortError") {
        await copyToClipboard(shareUrl);
        setCopied(true);
        window.alert("اشتراک مستقیم انجام نشد؛ لینک کپی شد.");
      }
    }
  }

  async function handleCopy() {
    await copyToClipboard(shareUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="share-actions" aria-label="اشتراک‌گذاری لینک">
      <button className="btn btn--primary btn--sm" type="button" onClick={handleSmartShare}>اشتراک‌گذاری</button>
      <a className="share-chip" href={links.whatsapp} target="_blank" rel="noreferrer">واتساپ</a>
      <a className="share-chip" href={links.sms}>پیامک</a>
      <a className="share-chip" href={links.email}>ایمیل</a>
      <a className="share-chip" href={links.gmail} target="_blank" rel="noreferrer">Gmail</a>
      <button className="share-chip share-chip--button" type="button" onClick={handleCopy}>{copied ? "کپی شد" : "کپی لینک"}</button>
    </div>
  );
}
