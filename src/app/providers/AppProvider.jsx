import { ProjectStoreProvider } from "../store/projectStore";

export function AppProvider({ children }) {
  return <ProjectStoreProvider>{children}</ProjectStoreProvider>;
}
