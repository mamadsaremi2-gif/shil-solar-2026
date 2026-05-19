import React from "react";
import DashboardCard from "./DashboardCard.jsx";

// Ø¢ÛŒÚ©ÙˆÙ†â€ŒÙ‡Ø§ÛŒ Ù†Ø¦ÙˆÙ†ÛŒ Ø¨Ù‡â€ŒØµÙˆØ±Øª Ú©Ø§Ù…Ù¾ÙˆÙ†Ù†Øª React
import {
  NeonProjects,
  NeonNewProject,
  NeonScenarios,
  NeonContact,
  NeonFeedback,
  NeonAssistant,
} from "../../mobile-ui/icons/NeonIcons.jsx";

const dashboardItems = [
  {
    to: "/projects",
    icon: <NeonProjects />,
    title: "Ù¾Ø±ÙˆÚ˜Ù‡â€ŒÙ‡Ø§",
    subtitle: "Ø¬Ø§Ø±ÛŒ Ùˆ Ù†Ù‡Ø§ÛŒÛŒ",
    tone: "cyan",
  },
  {
    to: "/new-project",
    icon: <NeonNewProject />,
    title: "Ù¾Ø±ÙˆÚ˜Ù‡ Ø¬Ø¯ÛŒØ¯",
    subtitle: "Ù…Ø³ÛŒØ± Û¸ Ù…Ø±Ø­Ù„Ù‡â€ŒØ§ÛŒ",
    tone: "blue",
  },
  {
    to: "/scenarios",
    icon: <NeonScenarios />,
    title: "Ø³Ù†Ø§Ø±ÛŒÙˆÙ‡Ø§ÛŒ Ø¢Ù…Ø§Ø¯Ù‡",
    subtitle: "Ø®ÙˆØ±Ø´ÛŒØ¯ÛŒ Ùˆ Ø§Ø¶Ø·Ø±Ø§Ø±ÛŒ",
    tone: "amber",
  },
  {
    to: "/contact",
    icon: <NeonContact />,
    title: "Ø§Ø±ØªØ¨Ø§Ø· Ø¨Ø§ Ù…Ø§",
    subtitle: "Ø±Ø§Ù‡â€ŒÙ‡Ø§ÛŒ ØªÙ…Ø§Ø³",
    tone: "purple",
  },
  {
    to: "/feedback",
    icon: <NeonFeedback />,
    title: "Ø¨Ø§Ø²Ø®ÙˆØ±Ø¯ Ú©Ø§Ø±Ø¨Ø±",
    subtitle: "Ø«Ø¨Øª Ù…Ø´Ú©Ù„/Ù¾ÛŒØ´Ù†Ù‡Ø§Ø¯",
    tone: "pink",
  },
  {
    to: "/assistant",
    icon: <NeonAssistant />,
    title: "Ø¯Ø³ØªÛŒØ§Ø± Ù‡ÙˆØ´Ù…Ù†Ø¯",
    subtitle: "Ú©Ù†ØªØ±Ù„ Ù…Ù‡Ù†Ø¯Ø³ÛŒ",
    tone: "violet",
  },
];

export default function DashboardGrid() {
  return (
    <section className="dash-panel-v15">
      <div className="dash-section-head">
        <h2>Ø¯Ø³ØªØ±Ø³ÛŒ Ø³Ø±ÛŒØ¹</h2>
        <span>Û²Ã—Û³</span>
      </div>

      <div className="dash-grid-v15">
        {dashboardItems.map((item) => (
          <DashboardCard key={item.title} {...item} />
        ))}
      </div>
    </section>
  );
}
