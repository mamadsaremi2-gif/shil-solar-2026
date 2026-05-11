export function buildDashboardCards({ startNewProject, openProjectsHub, openAIPage, openContact, openScenarios, openEducation, openFeedback, signOut }) {
  return [
    { key: "ai", title: "هوش مصنوعی", icon: "🤖", action: openAIPage, tone: "blue" },
    { key: "new-project", title: "پروژه جدید", icon: "➕", action: startNewProject, tone: "emerald" },
    { key: "projects", title: "پروژه‌ها", icon: "📁", action: openProjectsHub, tone: "purple" },
    { key: "education", title: "آموزش", icon: "🎓", action: openEducation, tone: "emerald" },
    { key: "contact", title: "ارتباط با ما", icon: "☎️", action: openContact, tone: "blue" },
    { key: "scenarios", title: "سناریوهای آماده", icon: "⚡", action: openScenarios, tone: "purple" },
    { key: "feedback", title: "اعلام نظر کاربران", icon: "💬", action: openFeedback, tone: "amber" },
    { key: "logout", title: "خروج", icon: "⎋", action: signOut, tone: "rose" },
  ];
}
