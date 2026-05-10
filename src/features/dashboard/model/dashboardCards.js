export function buildDashboardCards({
  isAdmin,
  openContact,
  openScenarios,
  openEducation,
  openFeedback,
  openAdmin,
  signOut,
}) {
  const cards = [
    {
      key: "scenarios",
      title: "سناریوهای آماده",
      caption: "الگوهای مهندسی آماده",
      meta: "Ready Presets",
      icon: "",
      action: openScenarios,
      tone: "purple",
    },
    {
      key: "education",
      title: "آموزش",
      caption: "راهنمای آموزشی اپ",
      meta: "Learning Center",
      icon: "",
      action: openEducation,
      tone: "emerald",
    },
    {
      key: "feedback",
      title: "اعلام نظر کاربران اپ",
      caption: "پیشنهاد توسعه و تجهیزات",
      meta: "Private Feedback",
      icon: "",
      action: openFeedback,
      tone: "amber",
    },
    {
      key: "contact",
      title: "ارتباط با ما",
      caption: "پشتیبانی و مشاوره فنی",
      meta: "Support Center",
      icon: "",
      action: openContact,
      tone: "blue",
    },
    {
      key: "logout",
      title: "خروج",
      caption: "خروج امن از سامانه",
      meta: "Secure Sign Out",
      icon: "",
      action: signOut,
      tone: "rose",
    },
  ];

  if (isAdmin) {
    cards.unshift({
      key: "admin",
      title: "پنل مدیریت",
      caption: "مدیریت کاربران و گزارش‌ها",
      meta: "Admin Only",
      icon: "",
      action: openAdmin,
      tone: "gold",
      adminOnly: true,
    });
  }

  return cards;
}
