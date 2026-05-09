const API_KEY = "";

export async function askSolarAI(userQuestion) {
  if (!API_KEY) {
    return "هوش مصنوعی هنوز فعال نشده است. کلید API باید به‌صورت امن تنظیم شود.";
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "تو دستیار تخصصی SHIL برای سیستم‌های خورشیدی، UPS، باتری، اینورتر و برق اضطراری هستی و فقط درباره این موضوعات پاسخ می‌دهی.",
          },
          {
            role: "user",
            content: userQuestion,
          },
        ],
        temperature: 0.4,
        max_tokens: 1200,
      }),
    });

    const data = await response.json();

    return data?.choices?.[0]?.message?.content || "پاسخی دریافت نشد.";
  } catch (error) {
    console.error(error);
    return "خطا در ارتباط با هوش مصنوعی.";
  }
}