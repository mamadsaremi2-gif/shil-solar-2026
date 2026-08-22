import React from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../auth/authStore.js";

export default function AuthGuard({ children }) {
  const authenticated = useAuthStore((state) => state.authenticated);

  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
