import { useEffect } from "react";
import { getCurrentUser } from "./authService.js";
import { useAuthStore } from "./authStore.js";

export function useAuthBootstrap() {
  const setUser = useAuthStore((state) => state.setUser);
  const setLoading = useAuthStore((state) => state.setLoading);

  useEffect(() => {
    async function boot() {
      setLoading(true);

      const user = await getCurrentUser();

      setUser(user);
      setLoading(false);
    }

    boot();
  }, [setUser, setLoading]);
}
