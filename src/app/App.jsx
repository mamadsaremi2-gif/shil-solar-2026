import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "../pages/Dashboard.jsx";
import Projects from "../pages/Projects.jsx";
import Contact from "../pages/Contact.jsx";
import Feedback from "../pages/Feedback.jsx";
import NewProject from "../pages/NewProject.jsx";
import Scenarios from "../pages/Scenarios.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/feedback" element={<Feedback />} />
        <Route path="/new-project" element={<NewProject />} />
        <Route path="/scenarios" element={<Scenarios />} />
      </Routes>
    </BrowserRouter>
  );
}
