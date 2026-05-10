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
      caption: "الگوهای آماده",
      meta: "",
      icon: "⚡",
      action: openScenarios,
      tone: "purple",
    },
    {
      key: "education",
      title: "آموزش",
      caption: "راهنمای سریع",
      meta: "",
      icon: "🎓",
      action: openEducation,
      tone: "emerald",
    },
    {
      key: "feedback",
      title: "اعلام نظر کاربران اپ",
      caption: "ثبت نظر",
      meta: "",
      icon: "💬",
      action: openFeedback,
      tone: "amber",
    },
    {
      key: "contact",
      title: "ارتباط با ما",
      caption: "پشتیبانی",
      meta: "",
      icon: "☎",
      action: openContact,
      tone: "blue",
    },
    {
      key: "logout",
      title: "خروج",
      caption: "خروج امن",
      meta: "",
      icon: "⏻",
      action: signOut,
      tone: "rose",
    },
  ];

  if (isAdmin) {
    cards.unshift({
      key: "admin",
      title: "پنل مدیریت",
      caption: "مدیریت",
      meta: "",
      icon: "⌘",
      action: openAdmin,
      tone: "gold",
      adminOnly: true,
    });
  }

  return cards;
}
