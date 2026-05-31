import React from "react";
import { FolderOpen, MapPin, Route, Calculator, ClipboardList, Settings, FileCheck, Gauge, Cuboid, Plus, Phone, Bot, MessageSquare, Layers, GraduationCap, LogOut } from "lucide-react";
import { SHIL_ASSETS } from "../config/shilAssetPaths.js";

export const dashboardItems = [
  { title: "Ù¾Ø±ÙˆÚ˜Ù‡ Ø¬Ø¯ÛŒØ¯", to: "/new-project", image: SHIL_ASSETS.icons.dashboard.newProject, icon: <Plus size={42} /> },
  { title: "Ù…Ø¯ÛŒØ±ÛŒØª Ù¾Ø±ÙˆÚ˜Ù‡ Ù‡Ø§", to: "/projects", image: SHIL_ASSETS.icons.dashboard.projects, icon: <FolderOpen size={42} /> },
  { title: "Ø§Ø±ØªØ¨Ø§Ø· Ø¨Ø§ Ù…Ø§", to: "/contact", image: SHIL_ASSETS.icons.dashboard.contact, icon: <Phone size={42} /> },
  { title: "Ø¯Ø³ØªÛŒØ§Ø± Ù‡ÙˆØ´Ù…Ù†Ø¯ SHIL", to: "/assistant", image: SHIL_ASSETS.icons.dashboard.assistant, icon: <Bot size={42} /> },
  { title: "Ù†Ø¸Ø±Ø§Øª Ú©Ø§Ø±Ø¨Ø±Ø§Ù†", to: "/feedback", image: SHIL_ASSETS.icons.dashboard.feedback, icon: <MessageSquare size={42} /> },
  { title: "Ø³Ù†Ø§Ø±ÛŒÙˆÙ‡Ø§ÛŒ Ø¢Ù…Ø§Ø¯Ù‡", to: "/scenarios", image: SHIL_ASSETS.icons.dashboard.scenarios, icon: <Layers size={42} /> },
  { title: "Ø¢Ù…ÙˆØ²Ø´", to: "/education", image: SHIL_ASSETS.icons.dashboard.education, icon: <GraduationCap size={42} /> },
  { title: "Ø®Ø±ÙˆØ¬", to: "/login", image: SHIL_ASSETS.icons.dashboard.logout, icon: <LogOut size={42} /> },
  { title: "ØªÙˆØ³Ø¹Ù‡ ØµÙØ­Ù‡ Ù¾Ø±ÙˆÚ˜Ù‡ Ø¬Ø¯ÛŒØ¯", to: "/new-project/future", image: SHIL_ASSETS.icons.project.future, icon: <Cuboid size={42} /> },
];

export const projectSteps = [
  { key: "path", title: "انتخاب مسیر پروژه", to: "/new-project/path", image: SHIL_ASSETS.icons.project.path, icon: <Route size={40} /> },
  { key: "info", title: "اطلاعات پروژه", to: "/new-project/info", image: SHIL_ASSETS.icons.project.info, icon: <FolderOpen size={40} /> },
  { key: "environment", title: "شرایط محیطی", to: "/new-project/environment", image: SHIL_ASSETS.icons.project.environment, icon: <MapPin size={40} /> },
  { key: "method", title: "روش محاسبات", to: "/new-project/method", image: SHIL_ASSETS.icons.project.method, icon: <Calculator size={40} /> },
  { key: "inputs", title: "ورودی محاسبات", to: "/new-project/inputs", image: SHIL_ASSETS.icons.project.inputs, icon: <ClipboardList size={40} /> },
  { key: "system", title: "تنظیمات سیستم", to: "/new-project/system", image: SHIL_ASSETS.icons.project.system, icon: <Settings size={40} /> },
  { key: "summary", title: "چکیده اطلاعات", to: "/new-project/summary", image: SHIL_ASSETS.icons.project.summary, icon: <FileCheck size={40} /> },
  { key: "run", title: "اجرای محاسبات", to: "/new-project/run", image: SHIL_ASSETS.icons.project.run, icon: <Gauge size={40} /> },
  { key: "future", title: "توسعه", to: "/new-project/future", image: SHIL_ASSETS.icons.project.future, icon: <Cuboid size={40} /> },
];

export const inputMethods = [
  { key: "equipment", title: "Ù„ÛŒØ³Øª ØªØ¬Ù‡ÛŒØ²Ø§Øª", description: "ÙˆØ±ÙˆØ¯ Ù…ØµØ±Ùâ€ŒÚ©Ù†Ù†Ø¯Ù‡â€ŒÙ‡Ø§ Ø¨Ù‡ ØµÙˆØ±Øª Ù…ÙˆØ±Ø¯ÛŒ" },
  { key: "power", title: "ØªÙˆØ§Ù† Ú©Ù„", description: "Ø´Ø±ÙˆØ¹ Ø·Ø±Ø§Ø­ÛŒ Ø§Ø² ØªÙˆØ§Ù† Ú©Ù„ Ù¾Ø±ÙˆÚ˜Ù‡" },
  { key: "current", title: "Ø¬Ø±ÛŒØ§Ù† Ú©Ù„", description: "Ø´Ø±ÙˆØ¹ Ø·Ø±Ø§Ø­ÛŒ Ø§Ø² Ø¬Ø±ÛŒØ§Ù† Ú©Ù„" },
  { key: "solar_panel_power", title: "ØªÙˆØ§Ù† Ù¾Ù†Ù„ Ø®ÙˆØ±Ø´ÛŒØ¯ÛŒ", description: "Ø´Ø±ÙˆØ¹ Ø·Ø±Ø§Ø­ÛŒ Ø§Ø² ØªÙˆØ§Ù† Ùˆ ØªØ¹Ø¯Ø§Ø¯ Ù¾Ù†Ù„ Ø®ÙˆØ±Ø´ÛŒØ¯ÛŒ" },
  { key: "profile", title: "Ù¾Ø±ÙˆÙØ§ÛŒÙ„ Ù…ØµØ±Ù", description: "ÙˆØ±ÙˆØ¯ Ø§Ù„Ú¯ÙˆÛŒ Ù…ØµØ±Ù Ù…Ø±Ø­Ù„Ù‡â€ŒØ§ÛŒ" },
  { key: "energy", title: "Ø§Ù†Ø±Ú˜ÛŒ Ù…ÙˆØ±Ø¯ Ù†ÛŒØ§Ø²", description: "Ø´Ø±ÙˆØ¹ Ø·Ø±Ø§Ø­ÛŒ Ø§Ø² Ø§Ù†Ø±Ú˜ÛŒ Ù…ÙˆØ±Ø¯ Ù†ÛŒØ§Ø²" },
];

export const allowedUiTerms = ["Ø¨Ø±Ù‚ Ø§Ø¶Ø·Ø±Ø§Ø±ÛŒ", "Ø§ÛŒÙ†ÙˆØ±ØªØ±", "Ø¨Ø§ØªØ±ÛŒ", "Ø²Ù…Ø§Ù† Ø¨Ø±Ù‚ Ø§Ø¶Ø·Ø±Ø§Ø±ÛŒ Ù…ÙˆØ±Ø¯ Ù†ÛŒØ§Ø²"];

export const assetPlacementGuide = [
  ["Ø¨Ú©â€ŒÚ¯Ø±Ø§Ù†Ø¯ Ø¯Ø§Ø´Ø¨ÙˆØ±Ø¯", SHIL_ASSETS.backgrounds.dashboard],
  ["Ø¨Ú©â€ŒÚ¯Ø±Ø§Ù†Ø¯ Ø¹Ù…ÙˆÙ…ÛŒ Ø§Ù¾", SHIL_ASSETS.backgrounds.app],
  ["Ø¨Ú©â€ŒÚ¯Ø±Ø§Ù†Ø¯ Welcome", SHIL_ASSETS.backgrounds.welcome],
  ["Ù„ÙˆÚ¯ÙˆÛŒ Ø§ØµÙ„ÛŒ", SHIL_ASSETS.logos.main],
  ["Ù†Ù‚Ø´Ù‡ Ú¯Ø±Ù…Ø§ÛŒØ´ÛŒ Ø§ÛŒØ±Ø§Ù†", SHIL_ASSETS.maps.iranHeatmap],
  ["Ø¨Ù†Ø± Ù…Ø­ØµÙˆÙ„Ø§Øª SHIL", SHIL_ASSETS.contact.products],
  ["QR Ø³Ø§ÛŒØª", SHIL_ASSETS.contact.qrWebsite],
  ["QR Ù¾Ø´ØªÛŒØ¨Ø§Ù†ÛŒ", SHIL_ASSETS.contact.qrSupport],
  ["QR ÙˆØ§ØªØ³Ø§Ù¾", SHIL_ASSETS.contact.qrWhatsApp],
  ["QR Ú©Ø§ØªØ§Ù„ÙˆÚ¯", SHIL_ASSETS.contact.qrCatalog],
  ["Ø¢ÛŒÚ©ÙˆÙ†â€ŒÙ‡Ø§ÛŒ Ø¯Ø§Ø´Ø¨ÙˆØ±Ø¯", "/assets/shil/icon/dashboard/"],
  ["Ø¢ÛŒÚ©ÙˆÙ†â€ŒÙ‡Ø§ÛŒ Ù¾Ø±ÙˆÚ˜Ù‡ Ø¬Ø¯ÛŒØ¯", "/assets/shil/icon/project/"],
];
