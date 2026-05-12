export function buildDashboardCards({ startNewProject, openProjectsHub, openAIPage, openContact, openScenarios, openEducation, openFeedback, signOut }) {
  return [
    { key: "ai", title: "هوش مصنوعی", iconKey: "ai", action: openAIPage, tone: "blue" },
    { key: "new-project", title: "پروژه جدید", iconKey: "plus", action: startNewProject, tone: "emerald" },
    { key: "projects", title: "پروژه‌ها", iconKey: "folder", action: openProjectsHub, tone: "purple" },
    { key: "education", title: "آموزش", iconKey: "education", action: openEducation, tone: "emerald" },
    { key: "contact", title: "ارتباط با ما", iconKey: "phone", action: openContact, tone: "blue" },
    { key: "scenarios", title: "سناریوهای آماده", iconKey: "bolt", action: openScenarios, tone: "purple" },
    { key: "feedback", title: "اعلام نظر کاربران", iconKey: "chat", action: openFeedback, tone: "amber" },
    { key: "logout", title: "خروج", iconKey: "logout", action: signOut, tone: "rose" },
  ];
}
