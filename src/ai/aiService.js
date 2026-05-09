import { SHIL_AI_PROMPT } from "./aiPrompt";

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || "YOUR_API_KEY";

export async function askSolarAI(userQuestion) {
  if (!userQuestion?.trim()) return "لطفاً سوال خود را وارد کنید.";

  if (!OPENAI_API_KEY || OPENAI_API_KEY === "YOUR_API_KEY") {
    return "کلید API هنوز تنظیم نشده است. برای تست، مقدار VITE_OPENAI_API_KEY را در فایل .env.local قرار دهید.";
  }

  const fullPrompt = `${SHIL_AI_PROMPT}\n\nسوال کاربر: ${userQuestion}`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: fullPrompt }],
      }),
    });

    if (!response.ok) {
      return "ارتباط با سرویس هوش مصنوعی برقرار نشد. لطفاً تنظیمات API را بررسی کنید.";
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "پاسخی دریافت نشد.";
  } catch (error) {
    return "خطا در پردازش سوال. اتصال اینترنت یا تنظیمات API را بررسی کنید.";
  }
}
