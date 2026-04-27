import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// صفحات اصلی
import DashboardPage from "../pages/DashboardPage";
import EquipmentLibraryPage from "../pages/EquipmentLibraryPage";
import ReadyScenariosPage from "../pages/ReadyScenariosPage";
import ContactPage from "../pages/ContactPage";
import ProjectWorkspacePage from "../pages/ProjectWorkspacePage";
import OutputPage from "../pages/OutputPage";
import AdminPage from "../pages/AdminPage";

export function App() {
  return (
    <Router>
      <Routes>

        {/* صفحه اصلی */}
        <Route path="/" element={<DashboardPage />} />

        {/* صفحات اپ */}
        <Route path="/equipment" element={<EquipmentLibraryPage />} />
        <Route path="/scenarios" element={<ReadyScenariosPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/workspace" element={<ProjectWorkspacePage />} />
        <Route path="/output" element={<OutputPage />} />
        <Route path="/admin" element={<AdminPage />} />

      </Routes>
    </Router>
  );
}