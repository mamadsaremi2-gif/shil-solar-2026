import React from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutGrid, FolderOpen, PlusSquare } from "lucide-react";

export default function DashboardBottomNav() {
  const location = useLocation();
  const items = [
    { to: "/", label: "داشبورد", icon: <LayoutGrid size={22} /> },
    { to: "/projects", label: "پروژه‌ها", icon: <FolderOpen size={22} /> },
    { to: "/new-project/path", label: "پروژه جدید", icon: <PlusSquare size={22} /> },
  ];
  return (
    <nav className="bottom-nav-v15">
      {items.map((item) => {
        const active = location.pathname === item.to;
        return <Link key={item.to} to={item.to} className={`bottom-nav-item ${active ? "active" : ""}`}><div className="bottom-nav-icon">{item.icon}</div><span>{item.label}</span></Link>;
      })}
    </nav>
  );
}
