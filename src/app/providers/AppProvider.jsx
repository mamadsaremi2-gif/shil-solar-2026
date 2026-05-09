import { AuthProvider } from "../../features/auth/AuthProvider";
import { ProjectStoreProvider } from "../store/projectStore";

export function AppProvider({ children }) {
  return (
    <AuthProvider>
      <ProjectStoreProvider>{children}</ProjectStoreProvider>
    </AuthProvider>
  );
}
