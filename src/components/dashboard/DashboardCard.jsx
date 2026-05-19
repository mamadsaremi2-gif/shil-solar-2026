import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function DashboardCard({
  to = "#",
  icon,
  title,
  subtitle,
  tone = "cyan",
}) {
  return (
    <motion.div whileTap={{ scale: 0.96 }} className={`dash-card-wrap ${tone}`}>
      <Link to={to} className="dash-card-v15">
        <div className="dash-card-menu">â€¢â€¢â€¢</div>

        <div className="dash-icon-v15">
          {icon}
        </div>

        <h3>{title}</h3>
        <p>{subtitle}</p>

        <span className="dash-card-dot" />
      </Link>
    </motion.div>
  );
}