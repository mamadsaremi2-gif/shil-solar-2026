import React from "react";
import { FolderOpen, MapPin, Route, Calculator, ClipboardList, Settings, FileCheck, Gauge, Cuboid, Plus, Phone, Bot, MessageSquare, Layers, GraduationCap, LogOut } from "lucide-react";
import { SHIL_ASSETS } from "../config/shilAssetPaths.js";

export const dashboardItems = [
  { title: "پروژه جدید", to: "/new-project", image: SHIL_ASSETS.icons.dashboard.newProject, icon: <Plus size={42} /> },
  { title: "مدیریت پروژه ها", to: "/projects", image: SHIL_ASSETS.icons.dashboard.projects, icon: <FolderOpen size={42} /> },
  { title: "ارتباط با ما", to: "/contact", image: SHIL_ASSETS.icons.dashboard.contact, icon: <Phone size={42} /> },
  { title: "دستیار هوشمند SHIL", to: "/assistant", image: SHIL_ASSETS.icons.dashboard.assistant, icon: <Bot size={42} /> },
  { title: "نظرات کاربران", to: "/feedback", image: SHIL_ASSETS.icons.dashboard.feedback, icon: <MessageSquare size={42} /> },
  { title: "سناریوهای آماده", to: "/scenarios", image: SHIL_ASSETS.icons.dashboard.scenarios, icon: <Layers size={42} /> },
  { title: "آموزش", to: "/education", image: SHIL_ASSETS.icons.dashboard.education, icon: <GraduationCap size={42} /> },
  { title: "خروج", to: "/login", image: SHIL_ASSETS.icons.dashboard.logout, icon: <LogOut size={42} /> },
];

export const projectSteps = [
  { key: "info", title: "اطلاعات پروژه", to: "/new-project/info", image: SHIL_ASSETS.icons.project.info, icon: <FolderOpen size={40} /> },
  { key: "environment", title: "شرایط محیطی", to: "/new-project/environment", image: SHIL_ASSETS.icons.project.environment, icon: <MapPin size={40} /> },
  { key: "path", title: "انتخاب مسیر پروژه", to: "/new-project/path", image: SHIL_ASSETS.icons.project.path, icon: <Route size={40} /> },
  { key: "method", title: "روش محاسبات", to: "/new-project/method", image: SHIL_ASSETS.icons.project.method, icon: <Calculator size={40} /> },
  { key: "inputs", title: "ورودی محاسبات", to: "/new-project/inputs", image: SHIL_ASSETS.icons.project.inputs, icon: <ClipboardList size={40} /> },
  { key: "system", title: "تنظیمات سیستم", to: "/new-project/system", image: SHIL_ASSETS.icons.project.system, icon: <Settings size={40} /> },
  { key: "summary", title: "چکیده اطلاعات", to: "/new-project/summary", image: SHIL_ASSETS.icons.project.summary, icon: <FileCheck size={40} /> },
  { key: "run", title: "اجرای محاسبات", to: "/new-project/run", image: SHIL_ASSETS.icons.project.run, icon: <Gauge size={40} /> },
  { key: "future", title: "توسعه", to: "/new-project/future", image: SHIL_ASSETS.icons.project.future, icon: <Cuboid size={40} /> },
];

export const inputMethods = [
  { key: "equipment", title: "لیست تجهیزات", description: "ورود مصرف‌کننده‌ها به صورت موردی" },
  { key: "power", title: "توان کل", description: "شروع طراحی از توان کل پروژه" },
  { key: "current", title: "جریان کل", description: "شروع طراحی از جریان کل" },
  { key: "profile", title: "پروفایل مصرف", description: "ورود الگوی مصرف مرحله‌ای" },
  { key: "energy", title: "انرژی مورد نیاز", description: "شروع طراحی از انرژی مورد نیاز" },
];

export const allowedUiTerms = ["برق اضطراری", "اینورتر", "باتری", "زمان برق اضطراری مورد نیاز"];

export const assetPlacementGuide = [
  ["بک‌گراند داشبورد", SHIL_ASSETS.backgrounds.dashboard],
  ["بک‌گراند عمومی اپ", SHIL_ASSETS.backgrounds.app],
  ["بک‌گراند Welcome", SHIL_ASSETS.backgrounds.welcome],
  ["لوگوی اصلی", SHIL_ASSETS.logos.main],
  ["نقشه گرمایشی ایران", SHIL_ASSETS.maps.iranHeatmap],
  ["بنر محصولات SHIL", SHIL_ASSETS.contact.products],
  ["QR سایت", SHIL_ASSETS.contact.qrWebsite],
  ["QR پشتیبانی", SHIL_ASSETS.contact.qrSupport],
  ["QR واتساپ", SHIL_ASSETS.contact.qrWhatsApp],
  ["QR کاتالوگ", SHIL_ASSETS.contact.qrCatalog],
  ["آیکون‌های داشبورد", "/assets/shil/icons/dashboard/"],
  ["آیکون‌های پروژه جدید", "/assets/shil/icons/project/"],
];
