export function buildDashboardCards({
  isAdmin,
  startNewProject,
  openContact,
  openScenarios,
  openAdmin,
  signOut,
}) {
  const cards = [
    {
      key: "new-project",
      title: "پروژه جدید",
      caption: "شروع طراحی هوشمند سیستم خورشیدی",
      meta: "Design Workspace",
      icon: "＋",
      action: startNewProject,
      tone: "cyan",
    },
    {
      key: "contact",
      title: "ارتباط با ما",
      caption: "پشتیبانی، مشاوره فنی و ارتباط مستقیم",
      meta: "Support Center",
      icon: "☎",
      action: openContact,
      tone: "blue",
    },
    {
      key: "scenarios",
      title: "سناریوهای آماده",
      caption: "انتخاب سریع الگوهای مهندسی آماده",
      meta: "Ready Presets",
      icon: "◈",
      action: openScenarios,
      tone: "purple",
    },
    {
      key: "logout",
      title: "خروج کاربران",
      caption: "خروج امن از سامانه طراحی SHIL",
      meta: "Secure Sign Out",
      icon: "⎋",
      action: signOut,
      tone: "rose",
    },
  ];

  if (isAdmin) {
    cards.splice(2, 0, {
      key: "admin",
      title: "پنل مدیریت",
      caption: "مدیریت کاربران، تجهیزات و سناریوها",
      meta: "Admin Only",
      icon: "⚙",
      action: openAdmin,
      tone: "gold",
      adminOnly: true,
    });
  }

  return cards;
}
